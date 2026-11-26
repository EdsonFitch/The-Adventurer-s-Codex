/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepEquipmentProficiencies.jsx
 * -----------------------------------------------------------------------------
 * Manages Step 6 of Character Creation:
 * - Displays armor, weapon, and tool proficiencies granted by class and background.
 * - Provides interactive choice selection for starting equipment packages.
 * - Splits compound phrases, provides a text input for open-ended/custom items
 *   (such as "any other musical instrument"), and enforces strict category
 *   filtering on catalog dropdowns.
 * - Enforces level-based catalog restrictions for characters at levels 1–5
 *   (common/uncommon, non-magical, 0 enchantment).
 * -----------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const STANDARD_LANGUAGES = [
  "Common",
  "Dwarvish",
  "Elvish",
  "Giant",
  "Gnomish",
  "Goblin",
  "Halfling",
  "Orc",
  "Abyssal",
  "Celestial",
  "Draconic",
  "Deep Speech",
  "Infernal",
  "Primordial",
  "Sylvan",
  "Undercommon",
];

/**
 * Safely normalizes a slot entry from `characterData.equipment` into:
 * `{ choiceLabel: string, selections: Record<string, string> }`.
 */
function parseSlotEntry(rawEntry) {
  if (!rawEntry) {
    return { choiceLabel: "", selections: {} };
  }
  if (typeof rawEntry === "object") {
    return {
      choiceLabel: rawEntry.choiceLabel || "",
      selections:
        rawEntry.selections && typeof rawEntry.selections === "object"
          ? rawEntry.selections
          : {},
    };
  }
  if (typeof rawEntry === "string") {
    try {
      const parsed = JSON.parse(rawEntry);
      if (parsed && typeof parsed === "object") {
        return {
          choiceLabel: parsed.choiceLabel || parsed.base || "",
          selections:
            parsed.selections && typeof parsed.selections === "object"
              ? parsed.selections
              : {},
        };
      }
    } catch {
      // Plain string choice fallback
    }
    return { choiceLabel: rawEntry, selections: {} };
  }
  return { choiceLabel: "", selections: {} };
}

/**
 * Splits a choice string on commas, conjunctions ("and", "or"), or "with"
 * into individual item/category clauses.
 */
function splitCompoundClauses(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/,\s*(?:and\s+|or\s+)?|\s+\band\b\s+|\s+\bor\b\s+|\s+\bwith\b\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Returns true when a clause should render a free-text input rather than a
 * strict catalog dropdown.
 */
function clauseUsesTextInput(clause) {
  if (!clause) return false;
  const lower = clause.toLowerCase();
  return (
    lower.includes("holy symbol") ||
    lower.includes("any other") ||
    lower.includes("other musical instrument") ||
    lower.includes("musical instrument")
  );
}

/**
 * Determines whether a clause requires a configuration control (dropdown or text input).
 */
function clauseNeedsConfig(clause) {
  if (!clause) return false;
  const lower = clause.toLowerCase();
  return (
    clauseUsesTextInput(clause) ||
    lower.includes("weapon") ||
    lower.includes("shield") ||
    lower.includes("armor") ||
    lower.includes("mail") ||
    lower.includes("martial") ||
    lower.includes("simple") ||
    lower.includes("tool") ||
    lower.includes("focus") ||
    lower.includes("pack")
  );
}

export default function StepEquipmentProficiencies({
  characterData,
  updateCharacterData,
  selectedClass,
  selectedBackground,
  selectedRace,
}) {
  const [equipmentCatalog, setEquipmentCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);

  const characterLevel = Number(characterData?.level) || 1;

  useEffect(() => {
    async function fetchCatalog() {
      try {
        setLoadingCatalog(true);
        const { data, error } = await supabase
          .from("equipment")
          .select("id, name, category, rarity, is_magical, enchantment_bonus")
          .order("name");

        if (error) throw error;
        setEquipmentCatalog(data || []);
      } catch (err) {
        console.error("Failed to load equipment catalog for picker:", err);
      } finally {
        setLoadingCatalog(false);
      }
    }
    fetchCatalog();
  }, []);

  const normalizeProficiencies = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) {
      return items.map((i) =>
        typeof i === "string" ? i : i.name || JSON.stringify(i),
      );
    }
    return [];
  };

  const armorProfs = normalizeProficiencies(selectedClass?.armor_proficiencies);
  const weaponProfs = normalizeProficiencies(
    selectedClass?.weapon_proficiencies,
  );
  const toolProfs = [
    ...normalizeProficiencies(selectedClass?.tool_proficiencies),
    ...normalizeProficiencies(selectedBackground?.tool_proficiencies),
  ];

  const classEquipment = Array.isArray(selectedClass?.equipment)
    ? selectedClass.equipment
    : [];

  const parseEquipmentChoices = (eqItem) => {
    const text =
      typeof eqItem === "string"
        ? eqItem
        : eqItem?.item || JSON.stringify(eqItem);

    const matches = text.match(/\([a-z]\)[^()]+/g);
    if (matches && matches.length > 0) {
      return matches.map((m) =>
        m
          .replace(/\([a-z]\)\s*/, "")
          .replace(/\s+or\s*$/i, "")
          .trim(),
      );
    }
    return [text.trim()];
  };

  const choiceHasConfigurableParts = (choiceText) => {
    const clauses = splitCompoundClauses(choiceText);
    return clauses.some((c) => clauseNeedsConfig(c));
  };

  const handleSelectPackageChoice = (rowIndex, choice) => {
    const currentGear = Array.isArray(characterData.equipment)
      ? [...characterData.equipment]
      : [];

    const existing = parseSlotEntry(currentGear[rowIndex]);
    const isSameChoice = existing.choiceLabel === choice;
    const nextSelections = isSameChoice ? existing.selections : {};

    currentGear[rowIndex] = JSON.stringify({
      choiceLabel: choice,
      selections: nextSelections,
    });

    updateCharacterData({ equipment: currentGear });

    if (choiceHasConfigurableParts(choice)) {
      setActiveDropdownIndex((prev) =>
        prev === rowIndex && isSameChoice ? null : rowIndex,
      );
    } else {
      setActiveDropdownIndex(null);
    }
  };

  const handleUpdateSubItem = (rowIndex, subKey, value) => {
    const currentGear = Array.isArray(characterData.equipment)
      ? [...characterData.equipment]
      : [];

    const existing = parseSlotEntry(currentGear[rowIndex]);
    const updatedSelections = { ...existing.selections };

    if (!value || value.trim() === "" || value.trim().startsWith("--")) {
      delete updatedSelections[subKey];
    } else {
      updatedSelections[subKey] = value;
    }

    currentGear[rowIndex] = JSON.stringify({
      choiceLabel: existing.choiceLabel,
      selections: updatedSelections,
    });

    updateCharacterData({ equipment: currentGear });
  };

  /**
   * Strictly filters `equipmentCatalog` to match the category requested by `clauseText`,
   * and enforces level 1–5 non-magical / common-uncommon restrictions.
   */
  const getFilteredCatalogForClause = (clauseText) => {
    const lower = (clauseText || "").toLowerCase();

    return equipmentCatalog.filter((eq) => {
      const cat = (eq.category || "").toLowerCase();
      const nameLower = (eq.name || "").toLowerCase();
      const rarity = (eq.rarity || "common").toLowerCase();
      const isMagical = Boolean(eq.is_magical);
      const enchantment = Number(eq.enchantment_bonus || 0);

      if (characterLevel <= 5) {
        if (isMagical || enchantment > 0) return false;
        if (rarity && rarity !== "common" && rarity !== "uncommon")
          return false;
      }

      if (lower.includes("shield")) {
        return cat.includes("shield") || nameLower === "shield";
      }

      if (
        lower.includes("armor") ||
        lower.includes("mail") ||
        lower.includes("leather") ||
        lower.includes("scale") ||
        lower.includes("plate") ||
        lower.includes("hide")
      ) {
        return cat.includes("armor") && !cat.includes("shield");
      }

      if (
        lower.includes("weapon") ||
        lower.includes("martial") ||
        lower.includes("simple") ||
        lower.includes("dagger") ||
        lower.includes("sword") ||
        lower.includes("axe") ||
        lower.includes("bow") ||
        lower.includes("rapier") ||
        lower.includes("spear") ||
        lower.includes("mace") ||
        lower.includes("club")
      ) {
        return cat.includes("weapon") && !cat.includes("shield");
      }

      if (lower.includes("tool")) {
        return cat.includes("tool");
      }

      if (lower.includes("pack")) {
        return nameLower.includes("pack");
      }

      return true;
    });
  };

  const calculateAllowedLanguageSlots = () => {
    let slots = 2;
    if (selectedRace?.languages && typeof selectedRace.languages === "number") {
      slots = selectedRace.languages;
    }
    return slots;
  };

  const maxLanguageChoices = calculateAllowedLanguageSlots();
  const currentLanguages = Array.isArray(characterData.languages)
    ? characterData.languages
    : ["Common"];

  const toggleLanguage = (lang) => {
    const exists = currentLanguages.includes(lang);
    if (exists) {
      if (lang === "Common" && currentLanguages.length <= 1) return;
      updateCharacterData({
        languages: currentLanguages.filter((l) => l !== lang),
      });
    } else {
      const extraChoicesCount = currentLanguages.filter(
        (l) => l !== "Common",
      ).length;
      if (extraChoicesCount >= maxLanguageChoices) {
        alert(
          `Your character limits you to ${maxLanguageChoices} additional language choices.`,
        );
        return;
      }
      updateCharacterData({ languages: [...currentLanguages, lang] });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-antiqua">
      <div>
        <h3 className="text-base font-medieval font-bold text-[#f0e6d2]">
          Step 6: Equipment, Languages & Proficiencies
        </h3>
        <p className="text-xs text-[#889c9b]">
          Review combat proficiencies, select starting equipment options, and
          choose known languages.
        </p>
      </div>

      {/* COMBAT & TOOL PROFICIENCIES */}
      <div className="p-4 bg-[#4a261c]/50 border border-[#a59075]/30 rounded-xl space-y-4">
        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
          Combat & Tool Proficiencies (
          {selectedClass?.name || "Unassigned Class"})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-[#889c9b] font-bold block">
              Armor
            </span>
            <div className="flex flex-wrap gap-1">
              {armorProfs.length > 0 ? (
                armorProfs.map((arm, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-[#361a12] border border-[#a59075]/30 text-[#f0e6d2]"
                  >
                    {arm}
                  </span>
                ))
              ) : (
                <span className="text-[#889c9b] italic">None</span>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-[#889c9b] font-bold block">
              Weapons
            </span>
            <div className="flex flex-wrap gap-1">
              {weaponProfs.length > 0 ? (
                weaponProfs.map((wep, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-[#361a12] border border-[#a59075]/30 text-[#f0e6d2]"
                  >
                    {wep}
                  </span>
                ))
              ) : (
                <span className="text-[#889c9b] italic">None</span>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-[#889c9b] font-bold block">
              Tools & Instruments
            </span>
            <div className="flex flex-wrap gap-1">
              {toolProfs.length > 0 ? (
                toolProfs.map((tool, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-[#361a12] border border-amber-500/40 text-amber-300 font-bold"
                  >
                    🛠️ {tool}
                  </span>
                ))
              ) : (
                <span className="text-[#889c9b] italic">None</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STARTING EQUIPMENT OPTIONS */}
      <div className="p-4 bg-[#4a261c]/50 border border-[#a59075]/30 rounded-xl space-y-4">
        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
          Starting Equipment Options
        </h4>
        {classEquipment.length > 0 ? (
          <div className="space-y-3">
            {classEquipment.map((eqItem, idx) => {
              const choices = parseEquipmentChoices(eqItem);
              const { choiceLabel, selections } = parseSlotEntry(
                characterData.equipment?.[idx],
              );
              const isOpen = activeDropdownIndex === idx;
              const activeSubValues = Object.values(selections).filter(Boolean);
              const clauses = splitCompoundClauses(choiceLabel);

              return (
                <div
                  key={idx}
                  className="p-3 bg-[#361a12] border border-[#a59075]/30 rounded-lg space-y-2 text-xs"
                >
                  <div className="font-bold text-[#f0e6d2] flex justify-between items-center gap-2">
                    <span>Equipment Package Option {idx + 1}</span>
                    {activeSubValues.length > 0 ? (
                      <span className="text-[10px] text-amber-300 font-normal truncate max-w-[320px]">
                        Picked: {activeSubValues.join(", ")}
                      </span>
                    ) : (
                      choiceLabel && (
                        <span className="text-[10px] text-amber-300 font-normal truncate max-w-[320px]">
                          Selected: {choiceLabel}
                        </span>
                      )
                    )}
                  </div>

                  <div className="space-y-2">
                    {choices.map((choice, cIdx) => {
                      const isThisChoiceSelected = choiceLabel === choice;
                      const isConfigurable = choiceHasConfigurableParts(choice);

                      return (
                        <div key={cIdx} className="space-y-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectPackageChoice(idx, choice)
                            }
                            className={`w-full px-3 py-2 rounded text-xs border transition text-left flex justify-between items-center ${
                              isThisChoiceSelected
                                ? "bg-amber-800 border-amber-500 text-white font-bold shadow-md"
                                : "bg-[#4a261c]/60 border-[#a59075]/40 text-[#938f71] hover:text-[#f0e6d2] hover:border-amber-500/50"
                            }`}
                          >
                            <span>
                              {isThisChoiceSelected && !isConfigurable
                                ? `✓ ${choice}`
                                : choice}
                            </span>
                            {isConfigurable && (
                              <span className="text-[10px] text-amber-300 italic shrink-0 ml-2">
                                {isOpen && isThisChoiceSelected
                                  ? "Close Config ▲"
                                  : "Configure Items ▼"}
                              </span>
                            )}
                          </button>

                          {isOpen &&
                            isThisChoiceSelected &&
                            !loadingCatalog && (
                              <div className="p-3 bg-[#5f3426] border border-amber-500/40 rounded-lg space-y-3 animate-fadeIn">
                                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                                  Configure option: &ldquo;{choice}&rdquo;
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {clauses.map((clause, clIdx) => {
                                    const slotKey = `clause_${clIdx}`;
                                    const useTextInput =
                                      clauseUsesTextInput(clause);
                                    const filteredOptions =
                                      getFilteredCatalogForClause(clause);

                                    return (
                                      <div key={slotKey}>
                                        <label className="text-[9px] uppercase text-amber-200 block mb-1">
                                          {clause}
                                        </label>

                                        {useTextInput ? (
                                          <input
                                            type="text"
                                            placeholder={
                                              clause
                                                .toLowerCase()
                                                .includes("holy symbol")
                                                ? "e.g., Silver Cross or Locket"
                                                : "Write your custom instrument or item..."
                                            }
                                            value={selections[slotKey] || ""}
                                            onChange={(e) =>
                                              handleUpdateSubItem(
                                                idx,
                                                slotKey,
                                                e.target.value,
                                              )
                                            }
                                            className="w-full p-2 bg-[#361a12] border border-amber-500/50 rounded text-xs text-[#f0e6d2]"
                                          />
                                        ) : (
                                          <select
                                            value={selections[slotKey] || ""}
                                            onChange={(e) =>
                                              handleUpdateSubItem(
                                                idx,
                                                slotKey,
                                                e.target.value,
                                              )
                                            }
                                            className="w-full p-2 bg-[#361a12] border border-amber-500/50 rounded text-xs text-[#f0e6d2]"
                                          >
                                            <option value="">
                                              -- Use &ldquo;{clause}&rdquo; or
                                              pick item --
                                            </option>
                                            {filteredOptions.map((eq) => (
                                              <option
                                                key={eq.id}
                                                value={eq.name}
                                              >
                                                {eq.name} (
                                                {eq.category || "General"})
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#889c9b] italic">
            No default equipment package specified for this class.
          </p>
        )}
      </div>

      {/* LANGUAGE SELECTION GRID */}
      <div className="p-4 bg-[#4a261c]/50 border border-[#a59075]/30 rounded-xl space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
            Known Languages
          </h4>
          <span className="text-[10px] text-amber-400 font-bold">
            Extra Slots Selected:{" "}
            {currentLanguages.filter((l) => l !== "Common").length} /{" "}
            {maxLanguageChoices}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {STANDARD_LANGUAGES.map((lang) => {
            const isSelected = currentLanguages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`px-2.5 py-1 rounded text-xs border transition ${
                  isSelected
                    ? "bg-amber-800 border-amber-500 text-white font-bold shadow-md"
                    : "bg-[#361a12] border-[#a59075]/30 text-[#889c9b] hover:text-[#f0e6d2]"
                }`}
              >
                {isSelected ? `✓ ${lang}` : lang}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
