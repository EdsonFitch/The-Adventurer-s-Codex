/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepEquipmentProficiencies
 * -----------------------------------------------------------------------------
 * Manages Step 6 of Character Creation:
 * - Displays armor, weapon, and tool proficiencies granted by the chosen class and background.
 * - Allows customization and review of starting equipment packages and options.
 * - Provides an interactive multi-select interface for known character languages.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.characterData - Master character payload state.
 * @param {Function} props.updateCharacterData - Callback to update master state.
 * @param {Object} props.selectedClass - Selected Class object from Supabase.
 * @param {Object} props.selectedBackground - Selected Background object from Supabase.
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
}) {
  /**
   * Safely normalizes JSONB proficiency arrays or strings into a clean string array.
   * Handles objects (e.g., { name: "Light armor" }) or raw strings.
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
   * Toggles language inclusion in the master character state array.
   */
  const toggleLanguage = (lang) => {
    const currentLangs = Array.isArray(characterData.languages)
      ? characterData.languages
      : [];
    const exists = currentLangs.includes(lang);
    const updated = exists
      ? currentLangs.filter((l) => l !== lang)
      : [...currentLangs, lang];

    updateCharacterData({ languages: updated });
  };

  /**
   * Updates specific equipment option text strings in the master state.
   */
  const handleEquipmentChange = (index, value) => {
    const currentGear = Array.isArray(characterData.equipment)
      ? [...characterData.equipment]
      : [];
    currentGear[index] = value;
    updateCharacterData({ equipment: currentGear });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h3 className="text-base font-medieval font-bold text-[#f0e6d2]">
          Step 6: Equipment, Languages & Proficiencies
        </h3>
        <p className="text-xs text-[#889c9b]">
          Review your combat proficiencies, finalize starting gear, and choose
          known languages.
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
      {/* SECTION 2: STARTING EQUIPMENT CHOICES                               */}
      {/* =================================================================== */}
      <div className="p-4 bg-[#4a261c]/50 border border-[#a59075]/30 rounded-xl space-y-3">
        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
          Starting Equipment Options
        </h4>
        {classEquipment.length > 0 ? (
          <div className="space-y-2">
            {classEquipment.map((eq, idx) => {
              const itemText =
                typeof eq === "string" ? eq : eq.item || JSON.stringify(eq);
              return (
                <div
                  key={idx}
                  className="p-2.5 bg-[#361a12] border border-[#a59075]/20 rounded text-xs"
                >
                  <label className="block text-[10px] text-[#889c9b] mb-1">
                    Equipment Package Option {idx + 1}
                  </label>
                  <input
                    type="text"
                    defaultValue={itemText}
                    onChange={(e) => handleEquipmentChange(idx, e.target.value)}
                    className="w-full bg-[#4a261c] border border-[#a59075]/40 rounded p-1.5 text-[#f0e6d2]"
                  />
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
      {/* SECTION 3: LANGUAGE SELECTION GRID                                  */}
      {/* =================================================================== */}
      <div className="p-4 bg-[#4a261c]/50 border border-[#a59075]/30 rounded-xl space-y-3">
        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
          Known Languages
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {STANDARD_LANGUAGES.map((lang) => {
            const isSelected =
              Array.isArray(characterData.languages) &&
              characterData.languages.includes(lang);
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
