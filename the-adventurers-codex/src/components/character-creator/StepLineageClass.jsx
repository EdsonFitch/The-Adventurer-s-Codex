/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepLineageClass.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Manages Step 2 of Character Creation:
 * - Official & Homebrew Race / Subrace selection.
 * - Official & Homebrew Class / Subclass selection.
 * - Inline homebrew builders that insert new lineages or classes into Supabase.
 *
 * Responsive & Touch Behavior:
 * - Section Header Toggles: Uses `flex-wrap gap-2` so `+ Add Custom Homebrew...`
 *   links wrap gracefully below section labels on narrow 375px screens.
 * - Card & Pill Tap Targets: Adds `min-w-0`, `break-words`, and generous
 *   vertical padding (`p-3.5 sm:p-3` on cards; `py-2 sm:py-1.5` on subrace/
 *   subclass pills) for easy thumb selection.
 * - Form Controls: Uses `text-sm sm:text-xs` on homebrew inputs/selects to
 *   prevent mobile browser auto-zoom.
 *
 * @param {Object} props - Component properties.
 * -----------------------------------------------------------------------------
 */

import React, { useState, useMemo } from "react";
import { supabase } from "../../supabaseClient";

export default function StepLineageClass({
  characterData,
  updateCharacterData,
  racesList = [],
  subracesList = [],
  classesList = [],
  subclassesList = [],
  userId,
}) {
  // ---------------------------------------------------------------------------
  // 1. HOMEBREW INLINE FORM TOGGLE STATES
  // ---------------------------------------------------------------------------
  const [isAddingCustomRace, setIsAddingCustomRace] = useState(false);
  const [isAddingCustomClass, setIsAddingCustomClass] = useState(false);
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  const [customRace, setCustomRace] = useState({
    name: "",
    speed: 30,
    size: "Medium",
    description: "",
  });

  const [customClass, setCustomClass] = useState({
    name: "",
    hit_die: 8,
    primary_ability: "STR",
    saving_throws: ["STR", "CON"],
  });

  // ---------------------------------------------------------------------------
  // 2. DYNAMIC SUB-OPTION FILTERING
  // ---------------------------------------------------------------------------
  const filteredSubraces = useMemo(() => {
    if (!characterData.raceId) return [];
    return subracesList.filter((sub) => sub.race_id === characterData.raceId);
  }, [characterData.raceId, subracesList]);

  const filteredSubclasses = useMemo(() => {
    if (!characterData.classId) return [];
    return subclassesList.filter(
      (sub) => sub.class_id === characterData.classId,
    );
  }, [characterData.classId, subclassesList]);

  const selectedRace = racesList.find((r) => r.id === characterData.raceId);
  const selectedClass = classesList.find((c) => c.id === characterData.classId);

  // ---------------------------------------------------------------------------
  // 3. HOMEBREW DATABASE INSERTION HANDLERS
  // ---------------------------------------------------------------------------
  const handleSaveCustomRace = async () => {
    if (!customRace.name.trim()) {
      alert("Please provide a name for your custom lineage.");
      return;
    }

    try {
      setIsSavingCustom(true);
      const newRacePayload = {
        name: customRace.name,
        speed: parseInt(customRace.speed, 10) || 30,
        size: customRace.size,
        description: customRace.description,
        is_custom: true,
        created_by: userId,
        ability_bonuses: [],
        traits: [],
      };

      const { data, error } = await supabase
        .from("races")
        .insert([newRacePayload])
        .select()
        .single();

      if (error) throw error;

      updateCharacterData({ raceId: data.id, subraceId: "" });
      setIsAddingCustomRace(false);
      setCustomRace({ name: "", speed: 30, size: "Medium", description: "" });
    } catch (err) {
      console.error("Error creating custom race:", err);
      alert("Failed to save homebrew race to database.");
    } finally {
      setIsSavingCustom(false);
    }
  };

  const handleSaveCustomClass = async () => {
    if (!customClass.name.trim()) {
      alert("Please provide a name for your custom class.");
      return;
    }

    try {
      setIsSavingCustom(true);
      const newClassPayload = {
        name: customClass.name,
        hit_die: parseInt(customClass.hit_die, 10) || 8,
        primary_ability: customClass.primary_ability,
        saving_throw_proficiencies: customClass.saving_throws,
        is_custom: true,
        created_by: userId,
      };

      const { data, error } = await supabase
        .from("classes")
        .insert([newClassPayload])
        .select()
        .single();

      if (error) throw error;

      updateCharacterData({ classId: data.id, subclassId: "" });
      setIsAddingCustomClass(false);
      setCustomClass({
        name: "",
        hit_die: 8,
        primary_ability: "STR",
        saving_throws: ["STR", "CON"],
      });
    } catch (err) {
      console.error("Error creating custom class:", err);
      alert("Failed to save homebrew class to database.");
    } finally {
      setIsSavingCustom(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. RENDER UI
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h3 className="text-base font-medieval font-bold text-[#f0e6d2]">
          Step 2: Lineage & Class
        </h3>
        <p className="text-xs text-[#889c9b]">
          Select your character's ancestry, class features, or forge custom
          homebrew options.
        </p>
      </div>

      {/* =====================================================================
        SECTION 1: LINEAGE & SUBRACE SELECTION
        ===================================================================== */}
      <div className="space-y-4 border-b border-[#a59075]/20 pb-6">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            1. Race / Lineage
          </label>
          <button
            type="button"
            onClick={() => setIsAddingCustomRace(!isAddingCustomRace)}
            className="py-1 text-xs text-amber-400 hover:text-amber-300 underline transition cursor-pointer"
          >
            {isAddingCustomRace
              ? "← Select Standard Race"
              : "+ Add Custom Homebrew Race"}
          </button>
        </div>

        {isAddingCustomRace ? (
          <div className="p-3.5 sm:p-4 bg-[#4a261c] border border-amber-500/40 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-amber-300 uppercase">
              Forge Custom Lineage
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-[#889c9b] mb-1">
                  Race Name *
                </label>
                <input
                  type="text"
                  value={customRace.name}
                  onChange={(e) =>
                    setCustomRace({ ...customRace, name: e.target.value })
                  }
                  placeholder="e.g. Dhampir"
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm sm:text-xs text-[#f0e6d2]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#889c9b] mb-1">
                  Speed (ft)
                </label>
                <input
                  type="number"
                  value={customRace.speed}
                  onChange={(e) =>
                    setCustomRace({ ...customRace, speed: e.target.value })
                  }
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm sm:text-xs text-[#f0e6d2]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#889c9b] mb-1">
                  Size
                </label>
                <select
                  value={customRace.size}
                  onChange={(e) =>
                    setCustomRace({ ...customRace, size: e.target.value })
                  }
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm sm:text-xs text-[#f0e6d2]"
                >
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-[#889c9b] mb-1">
                Description / Lore
              </label>
              <textarea
                value={customRace.description}
                onChange={(e) =>
                  setCustomRace({ ...customRace, description: e.target.value })
                }
                rows={2}
                className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm sm:text-xs text-[#f0e6d2]"
              />
            </div>
            <button
              type="button"
              disabled={isSavingCustom}
              onClick={handleSaveCustomRace}
              className="px-4 py-2 sm:py-1.5 bg-amber-700 hover:bg-amber-600 rounded text-xs text-white font-bold transition cursor-pointer"
            >
              {isSavingCustom ? "Saving..." : "Save & Select Custom Race"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            {racesList.map((race) => (
              <button
                key={race.id}
                type="button"
                onClick={() =>
                  updateCharacterData({ raceId: race.id, subraceId: "" })
                }
                className={`min-w-0 p-3.5 sm:p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  characterData.raceId === race.id
                    ? "bg-[#4a261c] border-amber-500 shadow-lg text-[#f0e6d2]"
                    : "bg-[#4a261c]/40 border-[#a59075]/30 hover:border-[#a59075]/60 text-[#938f71]"
                }`}
              >
                <div className="font-bold text-xs flex flex-wrap justify-between items-center gap-1">
                  <span className="break-words">{race.name}</span>
                  {race.is_custom && (
                    <span className="text-[9px] bg-amber-900/60 text-amber-300 px-1 rounded shrink-0">
                      Homebrew
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#889c9b] mt-1">
                  {race.size} • {race.speed} ft
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Subrace Pills */}
        {filteredSubraces.length > 0 && !isAddingCustomRace && (
          <div className="mt-4 p-3 bg-[#4a261c]/30 rounded-lg border border-[#a59075]/20">
            <label className="block text-xs uppercase tracking-wider text-[#889c9b] mb-2">
              Select Subrace for {selectedRace?.name}
            </label>
            <div className="flex flex-wrap gap-2">
              {filteredSubraces.map((subrace) => (
                <button
                  key={subrace.id}
                  type="button"
                  onClick={() => updateCharacterData({ subraceId: subrace.id })}
                  className={`px-3 py-2 sm:py-1.5 rounded text-xs transition border cursor-pointer ${
                    characterData.subraceId === subrace.id
                      ? "bg-amber-800 border-amber-500 text-white font-bold"
                      : "bg-[#4a261c] border-[#a59075]/30 text-[#938f71] hover:border-[#a59075]"
                  }`}
                >
                  {subrace.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
        SECTION 2: CLASS & SUBCLASS SELECTION
        ===================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            2. Class & Archetype
          </label>
          <button
            type="button"
            onClick={() => setIsAddingCustomClass(!isAddingCustomClass)}
            className="py-1 text-xs text-amber-400 hover:text-amber-300 underline transition cursor-pointer"
          >
            {isAddingCustomClass
              ? "← Select Standard Class"
              : "+ Add Custom Homebrew Class"}
          </button>
        </div>

        {isAddingCustomClass ? (
          <div className="p-3.5 sm:p-4 bg-[#4a261c] border border-amber-500/40 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-amber-300 uppercase">
              Forge Custom Class
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-[#889c9b] mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={customClass.name}
                  onChange={(e) =>
                    setCustomClass({ ...customClass, name: e.target.value })
                  }
                  placeholder="e.g. Blood Hunter"
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm sm:text-xs text-[#f0e6d2]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#889c9b] mb-1">
                  Hit Die (d6, d8, d10, d12)
                </label>
                <select
                  value={customClass.hit_die}
                  onChange={(e) =>
                    setCustomClass({ ...customClass, hit_die: e.target.value })
                  }
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm sm:text-xs text-[#f0e6d2]"
                >
                  <option value={6}>d6</option>
                  <option value={8}>d8</option>
                  <option value={10}>d10</option>
                  <option value={12}>d12</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#889c9b] mb-1">
                  Primary Ability
                </label>
                <select
                  value={customClass.primary_ability}
                  onChange={(e) =>
                    setCustomClass({
                      ...customClass,
                      primary_ability: e.target.value,
                    })
                  }
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm sm:text-xs text-[#f0e6d2]"
                >
                  {["STR", "DEX", "CON", "INT", "WIS", "CHA"].map((stat) => (
                    <option key={stat} value={stat}>
                      {stat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              disabled={isSavingCustom}
              onClick={handleSaveCustomClass}
              className="px-4 py-2 sm:py-1.5 bg-amber-700 hover:bg-amber-600 rounded text-xs text-white font-bold transition cursor-pointer"
            >
              {isSavingCustom ? "Saving..." : "Save & Select Custom Class"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            {classesList.map((cls) => (
              <button
                key={cls.id}
                type="button"
                onClick={() =>
                  updateCharacterData({ classId: cls.id, subclassId: "" })
                }
                className={`min-w-0 p-3.5 sm:p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  characterData.classId === cls.id
                    ? "bg-[#4a261c] border-amber-500 shadow-lg text-[#f0e6d2]"
                    : "bg-[#4a261c]/40 border-[#a59075]/30 hover:border-[#a59075]/60 text-[#938f71]"
                }`}
              >
                <div className="font-bold text-xs flex flex-wrap justify-between items-center gap-1">
                  <span className="break-words">{cls.name}</span>
                  {cls.is_custom && (
                    <span className="text-[9px] bg-amber-900/60 text-amber-300 px-1 rounded shrink-0">
                      Homebrew
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#889c9b] mt-1">
                  Hit Die: 1d{cls.hit_die} • Primary: {cls.primary_ability}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Subclass Pills */}
        {filteredSubclasses.length > 0 && !isAddingCustomClass && (
          <div className="mt-4 p-3 bg-[#4a261c]/30 rounded-lg border border-[#a59075]/20">
            <label className="block text-xs uppercase tracking-wider text-[#889c9b] mb-2">
              Select Subclass / Archetype for {selectedClass?.name}
            </label>
            <div className="flex flex-wrap gap-2">
              {filteredSubclasses.map((subclass) => (
                <button
                  key={subclass.id}
                  type="button"
                  onClick={() =>
                    updateCharacterData({ subclassId: subclass.id })
                  }
                  className={`px-3 py-2 sm:py-1.5 rounded text-xs transition border cursor-pointer ${
                    characterData.subclassId === subclass.id
                      ? "bg-amber-800 border-amber-500 text-white font-bold"
                      : "bg-[#4a261c] border-[#a59075]/30 text-[#938f71] hover:border-[#a59075]"
                  }`}
                >
                  {subclass.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
