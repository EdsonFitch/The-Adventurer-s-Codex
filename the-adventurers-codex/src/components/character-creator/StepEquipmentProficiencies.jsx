/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepEquipmentProficiencies
 * -----------------------------------------------------------------------------
 * Manages Step 6 of Character Creation:
 * - Displays armor, weapon, and tool proficiencies granted by class and background.
 * - Provides interactive choice selection for starting equipment packages.
 * - Enforces rules-based language slot limits and multi-select constraints.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.characterData - Master character payload state.
 * @param {Function} props.updateCharacterData - Callback to update master state.
 * @param {Object} props.selectedClass - Selected Class object from Supabase.
 * @param {Object} props.selectedBackground - Selected Background object from Supabase.
 * @param {Object} props.selectedRace - Selected Race object from Supabase.
 */

import React from "react";

/**
 * Standard D&D 5e Languages List for character selection.
 */
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

export default function StepEquipmentProficiencies({
  characterData,
  updateCharacterData,
  selectedClass,
  selectedBackground,
  selectedRace,
}) {
  /**
   * Safely normalizes JSONB proficiency arrays or strings into a clean string array.
   */
  const normalizeProficiencies = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) {
      return items.map((i) =>
        typeof i === "string" ? i : i.name || JSON.stringify(i),
      );
    }
    return [];
  };

  // Extract proficiencies from selected class and background records
  const armorProfs = normalizeProficiencies(selectedClass?.armor_proficiencies);
  const weaponProfs = normalizeProficiencies(
    selectedClass?.weapon_proficiencies,
  );
  const toolProfs = [
    ...normalizeProficiencies(selectedClass?.tool_proficiencies),
    ...normalizeProficiencies(selectedBackground?.tool_proficiencies),
  ];

  // Extract equipment options array from the class record
  const classEquipment = Array.isArray(selectedClass?.equipment)
    ? selectedClass.equipment
    : [];

  /**
   * Parses raw equipment option strings (e.g., "(a) a rapier, (b) a longsword, or (c) any simple weapon")
   * into an array of distinct selectable choice strings.
   */
  const parseEquipmentChoices = (eqItem) => {
    const text =
      typeof eqItem === "string"
        ? eqItem
        : eqItem?.item || JSON.stringify(eqItem);

    // Check if the string contains lettered choices like (a), (b), (c)
    const matches = text.match(/\([a-z]\)[^()]+/g);
    if (matches && matches.length > 0) {
      return matches.map((m) => m.replace(/\([a-z]\)\s*/, "").trim());
    }

    // Fallback: if no clear lettered choices, treat the whole string as a single selectable item
    return [text];
  };

  /**
   * Handles selecting a specific equipment choice for a given package row index.
   */
  const handleSelectEquipmentChoice = (rowIndex, choice) => {
    const currentGear = Array.isArray(characterData.equipment)
      ? [...characterData.equipment]
      : [];
    currentGear[rowIndex] = choice;
    updateCharacterData({ equipment: currentGear });
  };

  // ---------------------------------------------------------------------------
  // LANGUAGE LIMIT & SLOT LOGIC
  // ---------------------------------------------------------------------------

  // Calculate total allowed language slots based on race and background rules
  // Standard D&D 5e rule: Base 1 (Common) + 1-2 racial/background language slots (defaulting to 2 extra choices = 3 total)
  const calculateAllowedLanguageSlots = () => {
    let slots = 2; // Default extra selectable slots
    if (selectedRace?.languages) {
      // If race specifies additional language count or items
      if (typeof selectedRace.languages === "number") {
        slots = selectedRace.languages;
      }
    }
    return slots;
  };

  const maxLanguageChoices = calculateAllowedLanguageSlots();
  const currentLanguages = Array.isArray(characterData.languages)
    ? characterData.languages
    : ["Common"];

  /**
   * Toggles language selection while enforcing rules-based slot limits.
   */
  const toggleLanguage = (lang) => {
    const exists = currentLanguages.includes(lang);

    if (exists) {
      // Prevent unchecking mandatory "Common" if it's the base required language
      if (lang === "Common" && currentLanguages.length <= 1) {
        return;
      }
      const updated = currentLanguages.filter((l) => l !== lang);
      updateCharacterData({ languages: updated });
    } else {
      // Check if user has reached their maximum allowed language choices
      // (Counting extra choices beyond the mandatory 'Common' base)
      const extraChoicesCount = currentLanguages.filter(
        (l) => l !== "Common",
      ).length;

      if (extraChoicesCount >= maxLanguageChoices) {
        alert(
          `Your character background and lineage limit you to ${maxLanguageChoices} additional language choices.`,
        );
        return;
      }

      const updated = [...currentLanguages, lang];
      updateCharacterData({ languages: updated });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h3 className="text-base font-medieval font-bold text-[#f0e6d2]">
          Step 6: Equipment, Languages & Proficiencies
        </h3>
        <p className="text-xs text-[#889c9b]">
          Review your combat proficiencies, select starting equipment, and
          choose known languages.
        </p>
      </div>

      {/* =================================================================== */}
      {/* SECTION 1: COMBAT & TOOL PROFICIENCIES BADGES                       */}
      {/* =================================================================== */}
      <div className="p-4 bg-[#4a261c]/50 border border-[#a59075]/30 rounded-xl space-y-4">
        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
          Combat & Tool Proficiencies (
          {selectedClass?.name || "Unassigned Class"})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Armor Proficiencies */}
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

          {/* Weapon Proficiencies */}
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

          {/* Tool Proficiencies */}
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

      {/* =================================================================== */}
      {/* SECTION 2: INTERACTIVE STARTING EQUIPMENT CHOICES                   */}
      {/* =================================================================== */}
      <div className="p-4 bg-[#4a261c]/50 border border-[#a59075]/30 rounded-xl space-y-4">
        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
          Starting Equipment Options
        </h4>
        {classEquipment.length > 0 ? (
          <div className="space-y-3">
            {classEquipment.map((eqItem, idx) => {
              const choices = parseEquipmentChoices(eqItem);
              const selectedValue = characterData.equipment?.[idx];

              return (
                <div
                  key={idx}
                  className="p-3 bg-[#361a12] border border-[#a59075]/30 rounded-lg space-y-2 text-xs"
                >
                  <div className="font-bold text-[#f0e6d2] flex justify-between">
                    <span>Equipment Package Option {idx + 1}</span>
                    <span className="text-[10px] text-[#889c9b] font-normal truncate max-w-[250px]">
                      {typeof eqItem === "string" ? eqItem : eqItem?.item}
                    </span>
                  </div>

                  {/* Render interactive choice buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {choices.map((choice, cIdx) => {
                      const isSelected = selectedValue === choice;
                      return (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() =>
                            handleSelectEquipmentChoice(idx, choice)
                          }
                          className={`px-3 py-1.5 rounded text-xs border transition text-left ${
                            isSelected
                              ? "bg-amber-800 border-amber-500 text-white font-bold shadow-md"
                              : "bg-[#4a261c]/60 border-[#a59075]/40 text-[#938f71] hover:text-[#f0e6d2] hover:border-amber-500/50"
                          }`}
                        >
                          {isSelected ? `✓ ${choice}` : choice}
                        </button>
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

      {/* =================================================================== */}
      {/* SECTION 3: LANGUAGE SELECTION GRID WITH SLOT VALIDATION             */}
      {/* =================================================================== */}
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
        <p className="text-[11px] text-[#889c9b]">
          Select up to {maxLanguageChoices} additional languages granted by your
          lineage and background.
        </p>

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
