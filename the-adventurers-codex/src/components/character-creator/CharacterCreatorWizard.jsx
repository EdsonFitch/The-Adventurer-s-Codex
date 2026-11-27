/**
 * -----------------------------------------------------------------------------
 * COMPONENT: CharacterCreatorWizard.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Master container and state manager for the 9-step D&D 5e character creator.
 *
 * Responsibilities:
 * - Coordinates step progression across all 9 creator steps (`StepBasics` through
 *   `StepReviewForge`) and centralizes `characterData` state.
 * - Pre-fetches races, subraces, classes, subclasses, and backgrounds from
 *   Supabase and computes dynamic `STAT_MOD` and `PROFICIENCY_GRANT` effects.
 * - Executes final multi-table character insertion (`characters`,
 *   `character_classes`, `character_skills`, `character_spells`, and pack-expanded
 *   `character_inventory` with level 1-5 gear rules).
 *
 * Responsive & Touch Behavior:
 * - Wizard Header Stack: Switches to `flex-col sm:flex-row` on phones so the
 *   9-pill progress indicator sits cleanly below the step title instead of
 *   cramping long step headings on 375px viewports.
 * - Adaptive Step Padding: Uses `p-3.5 sm:p-6` inside the wizard body so
 *   complex steps (Ability Scores, Equipment, Spells) keep maximum width on
 *   mobile screens.
 * - Touch-Friendly Footer Navigation: Increases vertical tap padding
 *   (`py-2.5 sm:py-2`) on `Previous Step`, `Next Step`, and `Forge Hero`.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onComplete - Callback fired after successful hero forge.
 * @param {string} props.userId - Active authenticated user UUID.
 * -----------------------------------------------------------------------------
 */

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import StepBasics from "./StepBasics";
import StepLineageClass from "./StepLineageClass";
import StepAbilityScores from "./StepAbilityScores";
import StepBackgroundGear from "./StepBackgroundGear";
import StepPersonality from "./StepPersonality";
import StepEquipmentProficiencies from "./StepEquipmentProficiencies";
import StepSkills from "./StepSkills";
import StepSpells from "./StepSpells";
import StepReviewForge from "./StepReviewForge";
import { computeCharacterStats } from "../../utils/statCalculator";
import headerBgImage from "../../assets/hero/hero-bg.png";

/**
 * Strips leading articles ("a", "an", "any", "the") and leading numeric counts.
 */
function stripArticlesAndCounts(rawText) {
  return String(rawText || "")
    .replace(/^(a|an|any|the)\s+/i, "")
    .replace(/^\d+\s+/, "")
    .trim()
    .toLowerCase();
}

/**
 * Singularizes simple English plural tokens (e.g., "costumes" -> "costume").
 */
function singularizeTokens(text) {
  return text
    .split(/\s+/)
    .map((word) => {
      if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
        return word.slice(0, -1);
      }
      return word;
    })
    .join(" ");
}

/**
 * Generates normalized lookup variants for an equipment name so exact strings,
 * comma-inverted catalog names, parenthetical-stripped names, and singular forms
 * match reliably.
 */
function buildCandidateVariants(rawText) {
  const base = stripArticlesAndCounts(rawText);
  if (!base) return [];

  const variants = new Set([base]);

  if (base.includes(",")) {
    const parts = base
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 2) {
      variants.add(`${parts[1]} ${parts[0]}`);
      variants.add(parts[1]);
    }
  }

  const withoutParens = base.replace(/\(.*?\)/g, "").trim();
  if (withoutParens) {
    variants.add(withoutParens);
  }

  Array.from(variants).forEach((v) => {
    const singular = singularizeTokens(v);
    if (singular) variants.add(singular);
  });

  return Array.from(variants);
}

/**
 * Finds the best matching row from `masterEquipment` for a given item string.
 */
function findMatchingCatalogItem(rawName, masterEquipment) {
  const inputVariants = buildCandidateVariants(rawName);
  if (inputVariants.length === 0) return null;

  const inputVariantSet = new Set(inputVariants);

  for (const eq of masterEquipment) {
    const dbVariants = buildCandidateVariants(eq.name);
    if (dbVariants.some((dv) => inputVariantSet.has(dv))) {
      return eq;
    }
  }

  for (const eq of masterEquipment) {
    const dbVariants = buildCandidateVariants(eq.name);
    for (const iv of inputVariants) {
      if (iv.length < 4) continue;
      const escaped = iv.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const wordRegex = new RegExp(`\\b${escaped}\\b`, "i");
      if (dbVariants.some((dv) => wordRegex.test(dv))) {
        return eq;
      }
    }
  }

  return null;
}

/**
 * Extracts `{ name, quantity }` candidates from a single starting equipment slot entry.
 */
function extractSlotCandidates(chosenEntry) {
  if (!chosenEntry) return [];

  let choiceLabel = "";
  let selections = {};

  if (typeof chosenEntry === "object") {
    choiceLabel = chosenEntry.choiceLabel || "";
    selections =
      chosenEntry.selections && typeof chosenEntry.selections === "object"
        ? chosenEntry.selections
        : {};
  } else if (typeof chosenEntry === "string") {
    try {
      const parsed = JSON.parse(chosenEntry);
      if (parsed && typeof parsed === "object") {
        choiceLabel = parsed.choiceLabel || parsed.base || "";
        selections =
          parsed.selections && typeof parsed.selections === "object"
            ? parsed.selections
            : {};
      } else {
        choiceLabel = chosenEntry;
      }
    } catch {
      choiceLabel = chosenEntry;
    }
  }

  const clauses = choiceLabel
    ? choiceLabel
        .split(
          /,\s*(?:and\s+|or\s+)?|\s+\band\b\s+|\s+\bor\b\s+|\s+\bwith\b\s+/i,
        )
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  const selectionEntries = Object.entries(selections).filter(
    ([, val]) => val && typeof val === "string" && !val.trim().startsWith("--"),
  );

  if (selectionEntries.length > 0) {
    const resolved = [];
    const usedKeys = new Set();

    clauses.forEach((clause, idx) => {
      const clauseKey = `clause_${idx}`;
      if (selections[clauseKey]) {
        usedKeys.add(clauseKey);
        resolved.push({ name: selections[clauseKey].trim(), quantity: 1 });
      } else if (clause.toLowerCase().includes("holy symbol")) {
        resolved.push({ name: "Holy Symbol", quantity: 1 });
      } else {
        resolved.push({ name: clause, quantity: 1 });
      }
    });

    Object.entries(selections).forEach(([key, val]) => {
      if (!usedKeys.has(key) && val && typeof val === "string") {
        resolved.push({
          name: key === "symbol" ? "Holy Symbol" : val.trim(),
          quantity: 1,
        });
      }
    });

    return resolved;
  }

  if (clauses.length > 0) {
    return clauses.map((c) => ({ name: c, quantity: 1 }));
  }

  return [{ name: String(chosenEntry).trim(), quantity: 1 }];
}

export default function CharacterCreatorWizard({ onComplete, userId }) {
  // ---------------------------------------------------------------------------
  // 1. WIZARD NAVIGATION & FORM STATE HOOKS
  // ---------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [activeEffects, setActiveEffects] = useState([]);

  const [characterData, setCharacterData] = useState({
    name: "",
    level: 1,
    campaignName: "",
    alignmentCode: "LN",
    portraitUrl: "",
    fullBodyUrl: "",
    raceId: "",
    subraceId: "",
    classId: "",
    subclassId: "",
    backgroundId: "",
    abilityScores: {
      str: 15,
      dex: 14,
      con: 13,
      int: 12,
      wis: 10,
      cha: 8,
    },
    personalityTraits: "",
    ideals: "",
    bonds: "",
    flaws: "",
    definingEvents: "",
    equipment: [],
    languages: ["Common"],
    skills: [],
    spells: { classSpells: [], bonusSpells: [] },
    selectedSpellIds: [],
    hitPointsMax: 10,
  });

  // ---------------------------------------------------------------------------
  // 2. SUPABASE REFERENCE DATA STATES
  // ---------------------------------------------------------------------------
  const [racesList, setRacesList] = useState([]);
  const [subracesList, setSubracesList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [subclassesList, setSubclassesList] = useState([]);
  const [backgroundsList, setBackgroundsList] = useState([]);

  useEffect(() => {
    async function fetchReferenceData() {
      try {
        setLoadingData(true);
        setErrorMessage(null);

        const [
          { data: races, error: raceErr },
          { data: subraces, error: subraceErr },
          { data: classes, error: classErr },
          { data: subclasses, error: subclassErr },
          { data: backgrounds, error: bgErr },
        ] = await Promise.all([
          supabase.from("races").select("*"),
          supabase.from("subraces").select("*"),
          supabase.from("classes").select("*"),
          supabase.from("subclasses").select("*"),
          supabase.from("backgrounds").select("*"),
        ]);

        if (raceErr) throw raceErr;
        if (subraceErr) throw subraceErr;
        if (classErr) throw classErr;
        if (subclassErr) throw subclassErr;
        if (bgErr) throw bgErr;

        setRacesList(races || []);
        setSubracesList(subraces || []);
        setClassesList(classes || []);
        setSubclassesList(subclasses || []);
        setBackgroundsList(backgrounds || []);
      } catch (err) {
        console.error("Error fetching creator reference data:", err);
        setErrorMessage(
          "Failed to load ancient archives from Supabase. Please check your connection.",
        );
      } finally {
        setLoadingData(false);
      }
    }

    fetchReferenceData();
  }, []);

  useEffect(() => {
    const extractedEffects = [];

    const appendEntityData = (entity, defaultSource) => {
      if (!entity) return;

      if (
        entity.effects &&
        Array.isArray(entity.effects) &&
        entity.effects.length > 0
      ) {
        entity.effects.forEach((e) => {
          extractedEffects.push({
            ...e,
            source: e.source || entity.name || defaultSource,
          });
        });
      }

      if (entity.ability_bonuses) {
        const bonuses = entity.ability_bonuses;
        if (!Array.isArray(bonuses) && typeof bonuses === "object") {
          Object.entries(bonuses).forEach(([stat, val]) => {
            extractedEffects.push({
              type: "STAT_MOD",
              target: String(stat).toUpperCase(),
              value: Number(val),
              source: entity.name || defaultSource,
            });
          });
        } else if (Array.isArray(bonuses)) {
          bonuses.forEach((b) => {
            const stat = b.ability_score?.name || b.stat || b.target;
            const val = b.bonus || b.value;
            if (stat && val) {
              extractedEffects.push({
                type: "STAT_MOD",
                target: String(stat).substring(0, 3).toUpperCase(),
                value: Number(val),
                source: entity.name || defaultSource,
              });
            }
          });
        }
      }

      const skillGrants =
        entity.skill_proficiencies ||
        entity.skills ||
        entity.proficiencies ||
        entity.granted_skills;

      if (skillGrants) {
        const skillArray = Array.isArray(skillGrants)
          ? skillGrants
          : [skillGrants];
        skillArray.forEach((skillItem) => {
          const skillName =
            typeof skillItem === "string"
              ? skillItem
              : skillItem?.name || skillItem?.skill || skillItem?.index;

          if (skillName) {
            extractedEffects.push({
              type: "PROFICIENCY_GRANT",
              target: skillName.trim(),
              source: entity.name || defaultSource,
            });
          }
        });
      }
    };

    const currentRace = racesList.find((r) => r.id === characterData.raceId);
    const currentSubrace = subracesList.find(
      (s) => s.id === characterData.subraceId,
    );
    const currentClass = classesList.find(
      (c) => c.id === characterData.classId,
    );
    const currentSubclass = subclassesList.find(
      (sc) => sc.id === characterData.subclassId,
    );
    const currentBackground = backgroundsList.find(
      (b) => b.id === characterData.backgroundId,
    );

    appendEntityData(currentRace, "Race Lineage");
    appendEntityData(currentSubrace, "Subrace Lineage");
    appendEntityData(currentClass, "Class Feature");
    appendEntityData(currentSubclass, "Subclass Feature");
    appendEntityData(currentBackground, "Background");

    setActiveEffects(extractedEffects);
  }, [
    characterData.raceId,
    characterData.subraceId,
    characterData.classId,
    characterData.subclassId,
    characterData.backgroundId,
    racesList,
    subracesList,
    classesList,
    subclassesList,
    backgroundsList,
  ]);

  // ---------------------------------------------------------------------------
  // 3. COMPUTED STAT ENGINE INVOCATION
  // ---------------------------------------------------------------------------
  const computedCharacterPackage = useMemo(() => {
    return computeCharacterStats(
      {
        baseAbilityScores: characterData.abilityScores,
        level: characterData.level,
      },
      activeEffects,
    );
  }, [characterData.abilityScores, characterData.level, activeEffects]);

  // ---------------------------------------------------------------------------
  // 4. STATE MUTATION & NAVIGATION HANDLERS
  // ---------------------------------------------------------------------------
  const updateCharacterData = (updatedFields) => {
    setCharacterData((prev) => ({ ...prev, ...updatedFields }));
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !characterData.name.trim()) {
      alert("Please give your adventurer a name before proceeding.");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 9));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleForgeCharacter = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const characterLevel = Number(characterData.level) || 1;
      const cleanCampaignName =
        typeof characterData.campaignName === "string"
          ? characterData.campaignName.trim()
          : "";

      const newCharacterRecord = {
        user_id: userId,
        name: characterData.name,
        level: characterLevel,
        campaign_name: cleanCampaignName || null,
        race_id: characterData.raceId || null,
        subrace_id: characterData.subraceId || null,
        background_id: characterData.backgroundId || null,
        alignment_code: characterData.alignmentCode,
        hp_current: characterData.hitPointsMax,
        hp_max: characterData.hitPointsMax,
        hp_temp: 0,
        portrait_url: characterData.portraitUrl || null,
        full_body_url: characterData.fullBodyUrl || null,
        equipment: characterData.equipment || [],
        languages: characterData.languages || ["Common"],
        ability_scores: characterData.abilityScores || {},
        personality_traits: characterData.personalityTraits || null,
        ideals: characterData.ideals || null,
        bonds: characterData.bonds || null,
        flaws: characterData.flaws || null,
      };

      const { data: newChar, error: charError } = await supabase
        .from("characters")
        .insert([newCharacterRecord])
        .select()
        .single();

      if (charError) throw charError;

      if (characterData.classId) {
        const classPayload = {
          character_id: newChar.id,
          class_id: characterData.classId,
          subclass_id: characterData.subclassId || null,
          level_in_class: characterLevel,
        };

        const { error: classInsertErr } = await supabase
          .from("character_classes")
          .insert([classPayload]);

        if (classInsertErr) {
          console.error("Error linking character class:", classInsertErr);
        }
      }

      const allProficientSkillNames = new Set([
        ...(characterData.skills || []),
        ...(computedCharacterPackage?.proficiencies || []),
      ]);

      if (allProficientSkillNames.size > 0) {
        const { data: masterSkills, error: masterSkillsErr } = await supabase
          .from("skills")
          .select("id, name");

        if (!masterSkillsErr && masterSkills) {
          const skillPayload = [];

          allProficientSkillNames.forEach((skillName) => {
            const matchedSkill = masterSkills.find(
              (ms) => ms.name.toLowerCase() === skillName.toLowerCase(),
            );
            if (matchedSkill) {
              skillPayload.push({
                character_id: newChar.id,
                skill_id: matchedSkill.id,
                is_proficient: true,
                has_expertise: false,
              });
            }
          });

          if (skillPayload.length > 0) {
            const { error: skillInsertErr } = await supabase
              .from("character_skills")
              .insert(skillPayload);

            if (skillInsertErr) {
              console.error("Error linking character skills:", skillInsertErr);
            }
          }
        }
      }

      if (
        characterData.selectedSpellIds &&
        characterData.selectedSpellIds.length > 0
      ) {
        const spellPayload = characterData.selectedSpellIds.map((spellId) => ({
          character_id: newChar.id,
          spell_id: spellId,
          is_prepared: true,
          is_always_prepared: false,
          origin: "class",
        }));

        const { error: spellInsertErr } = await supabase
          .from("character_spells")
          .insert(spellPayload);

        if (spellInsertErr) {
          console.error("Error linking character spells:", spellInsertErr);
        }
      }

      if (
        Array.isArray(characterData.equipment) &&
        characterData.equipment.length > 0
      ) {
        const [
          { data: masterEquipment, error: eqCatErr },
          { data: packContentsRows, error: packErr },
        ] = await Promise.all([
          supabase
            .from("equipment")
            .select(
              "id, name, category, rarity, is_magical, enchantment_bonus",
            ),
          supabase
            .from("pack_contents")
            .select("pack_name, item_name, quantity"),
        ]);

        if (!eqCatErr && masterEquipment) {
          const allPackRows =
            !packErr && packContentsRows ? packContentsRows : [];

          const inventoryByEquipmentId = new Map();

          const addCatalogItemToInventory = (rawName, qty = 1) => {
            const matchedItem = findMatchingCatalogItem(
              rawName,
              masterEquipment,
            );
            if (!matchedItem) {
              console.warn(
                `[CharacterCreatorWizard] No catalog match in 'equipment' for starting item: "${rawName}"`,
              );
              return;
            }

            if (characterLevel <= 5) {
              const isMagical = Boolean(matchedItem.is_magical);
              const enchantment = Number(matchedItem.enchantment_bonus || 0);
              const rarity = (matchedItem.rarity || "common").toLowerCase();

              if (isMagical || enchantment > 0) return;
              if (
                rarity !== "common" &&
                rarity !== "uncommon" &&
                rarity !== ""
              ) {
                return;
              }
            }

            const existingRow = inventoryByEquipmentId.get(matchedItem.id);
            const safeQty = Math.max(1, Number(qty) || 1);

            if (existingRow) {
              existingRow.quantity += safeQty;
            } else {
              inventoryByEquipmentId.set(matchedItem.id, {
                character_id: newChar.id,
                equipment_id: matchedItem.id,
                quantity: safeQty,
                is_offsite: false,
                is_equipped: false,
              });
            }
          };

          characterData.equipment.forEach((chosenEntry) => {
            const slotCandidates = extractSlotCandidates(chosenEntry);

            slotCandidates.forEach(({ name: rawItemText, quantity }) => {
              const cleanCandidate = stripArticlesAndCounts(rawItemText);
              if (!cleanCandidate) return;

              const matchingPackItems = allPackRows.filter((row) => {
                const packKey = stripArticlesAndCounts(row.pack_name);
                return (
                  packKey === cleanCandidate ||
                  cleanCandidate.includes(packKey) ||
                  packKey.includes(cleanCandidate)
                );
              });

              if (matchingPackItems.length > 0) {
                matchingPackItems.forEach((packRow) => {
                  addCatalogItemToInventory(
                    packRow.item_name,
                    (packRow.quantity || 1) * (quantity || 1),
                  );
                });
              } else {
                addCatalogItemToInventory(rawItemText, quantity);
              }
            });
          });

          const inventoryPayload = Array.from(inventoryByEquipmentId.values());

          if (inventoryPayload.length > 0) {
            const { error: invInsertErr } = await supabase
              .from("character_inventory")
              .insert(inventoryPayload);

            if (invInsertErr) {
              console.error(
                "Error populating starting inventory:",
                invInsertErr,
              );
            }
          }
        }
      }

      if (onComplete) {
        onComplete(newChar);
      }
    } catch (err) {
      console.error("Detailed error forging character:", err);
      setErrorMessage(
        `Failed to forge hero: ${err.message || "Check RLS policies."}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. LOOKUP HELPERS
  // ---------------------------------------------------------------------------
  const selectedRace = racesList.find((r) => r.id === characterData.raceId);
  const selectedClass = classesList.find((c) => c.id === characterData.classId);
  const selectedBackground = backgroundsList.find(
    (b) => b.id === characterData.backgroundId,
  );

  // ---------------------------------------------------------------------------
  // 6. RENDER RESPONSIVE WIZARD CONTAINER
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto bg-[#5f3426] border-2 border-[#a59075]/60 rounded-xl overflow-hidden text-[#938f71] shadow-2xl font-antiqua">
      {/* =====================================================================
        WIZARD HEADER & 9-STEP PROGRESS INDICATOR
        - Stacks vertically on mobile (`flex-col sm:flex-row`) so long step
          titles never squeeze or collide with the 9 progress pills.
        ===================================================================== */}
      <div className="relative p-4 sm:p-6 pb-4 sm:pb-5 overflow-hidden border-b border-[#a59075]/30">
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        >
          <img
            src={headerBgImage}
            alt=""
            className="w-full h-full object-cover opacity-20 mix-blend-luminosity filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#5f3426] via-transparent to-[#5f3426] opacity-80" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-medieval font-bold text-[#f0e6d2]">
              Forge a New Hero
            </h2>
            <p className="text-xs text-[#889c9b]">
              Step {currentStep} of 9: {getStepTitle(currentStep)}
            </p>
          </div>

          {/* 9-Step Progress Indicator Bar */}
          <div className="flex items-center gap-1.5 sm:gap-1 shrink-0">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
              <div
                key={step}
                className={`w-5 sm:w-4 h-2 rounded-full transition-all ${
                  step === currentStep
                    ? "bg-[#937460] shadow-md"
                    : step < currentStep
                      ? "bg-[#889c9b]/60"
                      : "bg-[#937460]/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="m-3.5 sm:m-6 mb-0 p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-xs text-red-200">
          {errorMessage}
        </div>
      )}

      {/* =====================================================================
        ACTIVE STEP CONTENT CANVAS (`p-3.5 sm:p-6`)
        ===================================================================== */}
      <div className="p-3.5 sm:p-6 min-h-[340px] sm:min-h-[400px]">
        {loadingData ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3 text-[#889c9b]">
            <span className="text-2xl animate-spin">⏳</span>
            <p className="text-xs uppercase tracking-widest">
              Consulting ancient archives from Supabase...
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            {currentStep === 1 && (
              <StepBasics
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                userId={userId}
              />
            )}
            {currentStep === 2 && (
              <StepLineageClass
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                racesList={racesList}
                subracesList={subracesList}
                classesList={classesList}
                subclassesList={subclassesList}
                userId={userId}
              />
            )}
            {currentStep === 3 && (
              <StepAbilityScores
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                computedStats={computedCharacterPackage}
              />
            )}
            {currentStep === 4 && (
              <StepBackgroundGear
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                backgroundsList={backgroundsList}
                userId={userId}
              />
            )}
            {currentStep === 5 && (
              <StepPersonality
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                backgroundsList={backgroundsList}
              />
            )}
            {currentStep === 6 && (
              <StepEquipmentProficiencies
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                selectedClass={selectedClass}
                selectedBackground={selectedBackground}
                selectedRace={selectedRace}
              />
            )}
            {currentStep === 7 && (
              <StepSkills
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                computedStats={computedCharacterPackage}
              />
            )}
            {currentStep === 8 && (
              <StepSpells
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                selectedClass={selectedClass}
                computedStats={computedCharacterPackage}
              />
            )}
            {currentStep === 9 && (
              <StepReviewForge
                characterData={characterData}
                racesList={racesList}
                subracesList={subracesList}
                classesList={classesList}
                subclassesList={subclassesList}
                backgroundsList={backgroundsList}
                activeEffects={activeEffects}
                computedStats={computedCharacterPackage}
                onForge={handleForgeCharacter}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
        WIZARD FOOTER NAVIGATION CONTROLS (TOUCH-SIZED BUTTONS)
        ===================================================================== */}
      <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-[#a59075]/30 flex justify-between items-center gap-3 bg-[#5f3426]">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={isSubmitting}
            className="px-4 py-2.5 sm:py-2 rounded bg-[#937460]/20 hover:bg-[#937460]/40 border border-[#a59075]/40 text-xs transition cursor-pointer"
          >
            ← Previous Step
          </button>
        ) : (
          <div />
        )}

        {currentStep < 9 ? (
          <button
            type="button"
            onClick={handleNextStep}
            disabled={loadingData}
            className="px-5 py-2.5 sm:py-2 rounded bg-[#937460]/40 hover:bg-[#937460]/60 border border-[#a59075]/60 font-bold text-xs text-[#f0e6d2] transition shadow-md cursor-pointer"
          >
            Next Step →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleForgeCharacter}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded bg-amber-700 hover:bg-amber-600 border border-amber-500 font-bold text-xs text-white transition shadow-lg flex items-center space-x-2 cursor-pointer"
          >
            <span>
              {isSubmitting ? "Forging in the Flames..." : "⚔️ Forge Hero"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function getStepTitle(step) {
  switch (step) {
    case 1:
      return "Basics & Identity";
    case 2:
      return "Lineage & Class";
    case 3:
      return "Ability Scores";
    case 4:
      return "Background";
    case 5:
      return "Personality & Defining Events";
    case 6:
      return "Equipment, Languages & Proficiencies";
    case 7:
      return "Skill Proficiencies";
    case 8:
      return "Spellcasting & Grimoire";
    case 9:
      return "Review & Forge";
    default:
      return "";
  }
}
