/**
 * -----------------------------------------------------------------------------
 * COMPONENT: CharacterCreatorWizard
 * -----------------------------------------------------------------------------
 * Master container and state manager for the multi-step D&D character creator.
 *
 * Architecture & Responsibilities:
 * - Manages active wizard step progression across 9 distinct steps.
 * - Centralizes master character payload state (`characterData`) shared across all steps.
 * - Pre-fetches relational reference data from Supabase in parallel.
 * - Dynamically parses `effects`, `ability_bonuses`, and `skill_proficiencies` JSONB arrays
 *   from background, race, and subrace rows into standardized effect objects.
 * - Invokes `statCalculator.js` (`computeCharacterStats`) to calculate stats and skill grants.
 * - Executes final database insertion into 'characters', 'character_skills', and 'character_spells'.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onComplete - Callback fired after a successful character forge.
 * @param {string} props.userId - Active authenticated user UUID.
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

// -----------------------------------------------------------------------------
// ENGINE IMPORT: Dynamic Stat & Effect Calculator
// -----------------------------------------------------------------------------
import { computeCharacterStats } from "../../utils/statCalculator";

// -----------------------------------------------------------------------------
// ASSET IMPORT: Faded Background Header Asset
// -----------------------------------------------------------------------------
import headerBgImage from "../../assets/hero/hero-bg.png";

export default function CharacterCreatorWizard({ onComplete, userId }) {
  // ---------------------------------------------------------------------------
  // 1. WIZARD NAVIGATION & FORM STATE HOOKS
  // ---------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Active effect array populated dynamically from selected entity JSONB columns
  const [activeEffects, setActiveEffects] = useState([]);

  // Master character data payload object matching the Supabase schema requirements
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
    // Personality and background narrative fields (Step 5)
    personalityTraits: "",
    ideals: "",
    bonds: "",
    flaws: "",
    definingEvents: "",
    equipment: [], // Starting gear choices (Step 6)
    languages: ["Common"], // Known languages array (Step 6)
    skills: [], // Selected class skill proficiencies array (Step 7)
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

  /**
   * ---------------------------------------------------------------------------
   * EFFECT HOOK: fetchReferenceData
   * ---------------------------------------------------------------------------
   * Fetches all core relational tables from Supabase in parallel when mounting.
   */
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

  /**
   * ---------------------------------------------------------------------------
   * EFFECT HOOK: Aggregate Active JSONB Effects, Ability Bonuses & Skill Grants
   * ---------------------------------------------------------------------------
   * Parses modern `effects` arrays, `ability_bonuses` JSONB objects, and
   * `skill_proficiencies` JSONB arrays into PROFICIENCY_GRANT effects.
   */
  useEffect(() => {
    const extractedEffects = [];

    const appendEntityData = (entity, defaultSource) => {
      if (!entity) return;

      // 1. Process modern `effects` JSONB array if populated
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

      // 2. Process database `ability_bonuses` JSONB
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

      // 3. Process database `skill_proficiencies` JSONB arrays
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
    setCurrentStep((prev) => Math.min(prev + 1, 9)); // Extended to 9 steps max
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  /**
   * Submits the complete character record to Supabase, writing basic info,
   * linking proficient skills into character_skills, and mapping spells into character_spells.
   */
  const handleForgeCharacter = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // 1. Master character payload mapping all wizard state into Supabase columns
      const newCharacterRecord = {
        user_id: userId,
        name: characterData.name,
        level: characterData.level || 1,
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

      // 2. LINK SKILLS INTO character_skills TABLE
      // Gather all proficient skill names (combining user choices and auto-granted background/lineage skills)
      const allProficientSkillNames = new Set([
        ...(characterData.skills || []),
        ...(computedCharacterPackage?.proficiencies || []),
      ]);

      if (allProficientSkillNames.size > 0) {
        // Fetch master skills list to map names to their UUIDs from the 'skills' table
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

      // 3. Link selected spells into the character_spells relational table
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
  // 6. RENDER UI STRUCTURE
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto bg-[#5f3426] border-2 border-[#a59075]/60 rounded-xl overflow-hidden text-[#938f71] shadow-2xl font-antiqua">
      {/* HEADER SECTION */}
      <div className="relative p-6 pb-5 overflow-hidden border-b border-[#a59075]/30">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            src={headerBgImage}
            alt=""
            className="w-full h-full object-cover opacity-20 mix-blend-luminosity filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#5f3426] via-transparent to-[#5f3426] opacity-80" />
        </div>

        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-medieval font-bold text-[#f0e6d2]">
              Forge a New Hero
            </h2>
            <p className="text-xs text-[#889c9b]">
              Step {currentStep} of 9: {getStepTitle(currentStep)}
            </p>
          </div>

          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
              <div
                key={step}
                className={`w-4 h-2 rounded-full transition-all ${
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
        <div className="m-6 mb-0 p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-xs text-red-200">
          {errorMessage}
        </div>
      )}

      {/* MAIN CONTENT VIEWPORT */}
      <div className="p-6 min-h-[400px]">
        {loadingData ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3 text-[#889c9b]">
            <span className="text-2xl animate-spin">⏳</span>
            <p className="text-xs uppercase tracking-widest">
              Consulting ancient archives from Supabase...
            </p>
          </div>
        ) : (
          <div>
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
            {/* STEP 6: EQUIPMENT, LANGUAGES & PROFICIENCIES */}
            {currentStep === 6 && (
              <StepEquipmentProficiencies
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                selectedClass={selectedClass}
                selectedBackground={selectedBackground}
                selectedRace={selectedRace}
              />
            )}
            {/* STEP 7: SKILLS */}
            {currentStep === 7 && (
              <StepSkills
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                computedStats={computedCharacterPackage}
              />
            )}
            {/* STEP 8: SPELLS */}
            {currentStep === 8 && (
              <StepSpells
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                selectedClass={selectedClass}
                computedStats={computedCharacterPackage}
              />
            )}
            {/* STEP 9: FINAL REVIEW & FORGE */}
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

      {/* FOOTER NAVIGATION CONTROLS */}
      <div className="p-6 pt-4 border-t border-[#a59075]/30 flex justify-between items-center bg-[#5f3426]">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={isSubmitting}
            className="px-4 py-2 rounded bg-[#937460]/20 hover:bg-[#937460]/40 border border-[#a59075]/40 text-xs transition"
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
            className="px-5 py-2 rounded bg-[#937460]/40 hover:bg-[#937460]/60 border border-[#a59075]/60 font-bold text-xs text-[#f0e6d2] transition shadow-md"
          >
            Next Step →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleForgeCharacter}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded bg-amber-700 hover:bg-amber-600 border border-amber-500 font-bold text-xs text-white transition shadow-lg flex items-center space-x-2"
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

/**
 * Helper function to retrieve step titles based on step index.
 *
 * @param {number} step - Current wizard step number.
 * @returns {string} Human-readable title of the step.
 */
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
