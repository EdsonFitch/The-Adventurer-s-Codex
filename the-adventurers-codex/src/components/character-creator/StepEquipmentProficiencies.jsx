/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepEquipmentProficiencies.jsx
 * -----------------------------------------------------------------------------
 * Manages Step 6 of Character Creation:
 * - Displays armor, weapon, and tool proficiencies granted by class and background.
 * - Provides interactive choice selection for starting equipment packages.
 * - Dynamically resolves compound options (e.g., Chain Mail + Holy Symbol with custom text,
 *   Martial Weapon + Shield, Two Martial Weapons) into precise selectors and text inputs.
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

export default function StepEquipmentProficiencies({
  characterData,
  updateCharacterData,
  selectedClass,
  selectedBackground,
  selectedRace,
}) {
  const [equipmentCatalog, setEquipmentCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Track which package row index currently has its sub-selector open
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);

  // Local state for custom text inputs (e.g. Holy Symbol description like "Cross")
  const [customTextInputs, setCustomTextInputs] = useState({});

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
      return matches.map((m) => m.replace(/\([a-z]\)\s*/, "").trim());
    }
    return [text];
  };

  const handleSelectPackageChoice = (rowIndex, choice) => {
    const currentGear = Array.isArray(characterData.equipment)
      ? [...characterData.equipment]
      : [];
    currentGear[rowIndex] = choice;
    updateCharacterData({ equipment: currentGear });

    // Toggle dropdown open if it requires configuration
    if (isGenericCategory(choice)) {
      setActiveDropdownIndex(
        activeDropdownIndex === rowIndex ? null : rowIndex,
      );
    } else {
      setActiveDropdownIndex(null);
    }
  };

  const handleUpdateSubItem = (rowIndex, subKey, value) => {
    const currentGear = Array.isArray(characterData.equipment)
      ? [...characterData.equipment]
      : [];

    // Parse existing stored sub-items or initialize object/string
    let existingConfig = {};
    try {
      existingConfig = JSON.parse(currentGear[rowIndex] || "{}");
    } catch {
      existingConfig = { base: currentGear[rowIndex] };
    }

    existingConfig[subKey] = value;
    currentGear[rowIndex] = JSON.stringify(existingConfig);
    updateCharacterData({ equipment: currentGear });
  };

  const isGenericCategory = (choiceText) => {
    if (!choiceText) return false;
    const lower = choiceText.toLowerCase();
    return (
      lower.includes("weapon") ||
      lower.includes("shield") ||
      lower.includes("armor") ||
      lower.includes("martial") ||
      lower.includes("simple") ||
      lower.includes("and") ||
      lower.includes("holy symbol")
    );
  };

  const getFilteredCatalogForChoice = (filterType) => {
    const lower = (filterType || "").toLowerCase();

    return equipmentCatalog.filter((eq) => {
      const cat = (eq.category || "").toLowerCase();
      const rarity = (eq.rarity || "common").toLowerCase();
      const isMagical = Boolean(eq.is_magical);
      const enchantment = Number(eq.enchantment_bonus || 0);

      if (characterLevel <= 5) {
        if (isMagical || enchantment > 0) return false;
        if (rarity && rarity !== "common" && rarity !== "uncommon")
          return false;
      }

      if (lower.includes("shield")) {
        return (
          cat.includes("shield") || eq.name.toLowerCase().includes("shield")
        );
      }
      if (lower.includes("armor") || lower.includes("mail")) {
        return (
          cat.includes("armor") ||
          eq.name.toLowerCase().includes("mail") ||
          eq.name.toLowerCase().includes("armor")
        );
      }
      if (
        lower.includes("weapon") ||
        lower.includes("martial") ||
        lower.includes("simple")
      ) {
        return (
          cat.includes("weapon") ||
          cat.includes("martial") ||
          cat.includes("simple") ||
          cat === ""
        );
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
              const rawSelected = characterData.equipment?.[idx];
              const isOpen = activeDropdownIndex === idx;

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

                  <div className="space-y-2">
                    {choices.map((choice, cIdx) => {
                      const isThisChoiceSelected =
                        rawSelected === choice ||
                        (rawSelected && rawSelected.includes(choice));
                      const isGeneric = isGenericCategory(choice);

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
                              {isThisChoiceSelected && !isGeneric
                                ? `✓ ${choice}`
                                : choice}
                            </span>
                            {isGeneric && (
                              <span className="text-[10px] text-amber-300 italic">
                                {isOpen
                                  ? "Close Config ▲"
                                  : "Configure Items ▼"}
                              </span>
                            )}
                          </button>

                          {/* Configuration Drawer */}
                          {isOpen && isThisChoiceSelected && (
                            <div className="p-3 bg-[#5f3426] border border-amber-500/40 rounded-lg space-y-3 animate-fadeIn">
                              <span className="text-[10px] uppercase font-bold text-amber-300 block">
                                Configure option: "{choice}"
                              </span>

                              {/* Case A: Armor / Mail + Holy Symbol */}
                              {choice.toLowerCase().includes("holy symbol") ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] uppercase text-amber-200 block mb-1">
                                      Select Armor / Chain Mail:
                                    </label>
                                    <select
                                      onChange={(e) =>
                                        handleUpdateSubItem(
                                          idx,
                                          "armor",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full p-2 bg-[#361a12] border border-amber-500/50 rounded text-xs text-[#f0e6d2]"
                                    >
                                      <option value="">
                                        -- Choose Armor --
                                      </option>
                                      {getFilteredCatalogForChoice("armor").map(
                                        (eq) => (
                                          <option key={eq.id} value={eq.name}>
                                            {eq.name}
                                          </option>
                                        ),
                                      )}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase text-amber-200 block mb-1">
                                      Holy Symbol Description (e.g. Cross,
                                      Locket):
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g., Silver Cross"
                                      onChange={(e) =>
                                        handleUpdateSubItem(
                                          idx,
                                          "symbol",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full p-2 bg-[#361a12] border border-amber-500/50 rounded text-xs text-[#f0e6d2]"
                                    />
                                  </div>
                                </div>
                              ) : choice.toLowerCase().includes("and") &&
                                choice.toLowerCase().includes("shield") ? (
                                /* Case B: Weapon + Shield */
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] uppercase text-amber-200 block mb-1">
                                      Select Weapon:
                                    </label>
                                    <select
                                      onChange={(e) =>
                                        handleUpdateSubItem(
                                          idx,
                                          "weapon",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full p-2 bg-[#361a12] border border-amber-500/50 rounded text-xs text-[#f0e6d2]"
                                    >
                                      <option value="">
                                        -- Choose Weapon --
                                      </option>
                                      {getFilteredCatalogForChoice(
                                        "weapon",
                                      ).map((eq) => (
                                        <option key={eq.id} value={eq.name}>
                                          {eq.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase text-amber-200 block mb-1">
                                      Select Shield:
                                    </label>
                                    <select
                                      onChange={(e) =>
                                        handleUpdateSubItem(
                                          idx,
                                          "shield",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full p-2 bg-[#361a12] border border-amber-500/50 rounded text-xs text-[#f0e6d2]"
                                    >
                                      <option value="">
                                        -- Choose Shield --
                                      </option>
                                      {getFilteredCatalogForChoice(
                                        "shield",
                                      ).map((eq) => (
                                        <option key={eq.id} value={eq.name}>
                                          {eq.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              ) : choice.toLowerCase().includes("two") ? (
                                /* Case C: Two Weapons */
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] uppercase text-amber-200 block mb-1">
                                      First Weapon:
                                    </label>
                                    <select
                                      onChange={(e) =>
                                        handleUpdateSubItem(
                                          idx,
                                          "weapon1",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full p-2 bg-[#361a12] border border-amber-500/50 rounded text-xs text-[#f0e6d2]"
                                    >
                                      <option value="">
                                        -- Choose Weapon 1 --
                                      </option>
                                      {getFilteredCatalogForChoice(
                                        "weapon",
                                      ).map((eq) => (
                                        <option key={eq.id} value={eq.name}>
                                          {eq.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase text-amber-200 block mb-1">
                                      Second Weapon:
                                    </label>
                                    <select
                                      onChange={(e) =>
                                        handleUpdateSubItem(
                                          idx,
                                          "weapon2",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full p-2 bg-[#361a12] border border-amber-500/50 rounded text-xs text-[#f0e6d2]"
                                    >
                                      <option value="">
                                        -- Choose Weapon 2 --
                                      </option>
                                      {getFilteredCatalogForChoice(
                                        "weapon",
                                      ).map((eq) => (
                                        <option key={eq.id} value={eq.name}>
                                          {eq.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              ) : (
                                /* Default Single Item Selector */
                                <div>
                                  <label className="text-[9px] uppercase text-amber-200 block mb-1">
                                    Select Item:
                                  </label>
                                  <select
                                    onChange={(e) =>
                                      handleUpdateSubItem(
                                        idx,
                                        "item",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full p-2 bg-[#361a12] border border-amber-500/50 rounded text-xs text-[#f0e6d2]"
                                  >
                                    <option value="">
                                      -- Select exact item from catalog --
                                    </option>
                                    {getFilteredCatalogForChoice(choice).map(
                                      (eq) => (
                                        <option key={eq.id} value={eq.name}>
                                          {eq.name} ({eq.category || "General"})
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </div>
                              )}
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
