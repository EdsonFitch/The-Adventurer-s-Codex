import React, { useState, useMemo } from "react";
import { supabase } from "../../supabaseClient";

/**
 * StepLineageClass Component
 * -----------------------------------------------------------------------------
 * Manages Step 2 of Character Creation:
 * - Race & Subrace Selection (Official or Homebrew)
 * - Class & Subclass Selection (Official or Homebrew)
 * - Dynamic inline form toggles for inserting custom lineages or classes into Supabase.
 *
 * @param {Object} props
 * @param {Object} props.characterData - Master character payload state
 * @param {Function} props.updateCharacterData - Callback to update master state
 * @param {Array} props.racesList - Pre-fetched races from Supabase
 * @param {Array} props.subracesList - Pre-fetched subraces from Supabase
 * @param {Array} props.classesList - Pre-fetched classes from Supabase
 * @param {Array} props.subclassesList - Pre-fetched subclasses from Supabase
 * @param {string} props.userId - Authenticated user UUID for homebrew ownership
 */
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

  // Custom Race Form Payload
  const [customRace, setCustomRace] = useState({
    name: "",
    speed: 30,
    size: "Medium",
    description: "",
  });

  // Custom Class Form Payload
  const [customClass, setCustomClass] = useState({
    name: "",
    hit_die: 8,
    primary_ability: "STR",
    saving_throws: ["STR", "CON"],
  });

  // ---------------------------------------------------------------------------
  // 2. DYNAMIC SUB-OPTION FILTERING
  // ---------------------------------------------------------------------------

  // Filter subraces belonging to the currently selected race_id
  const filteredSubraces = useMemo(() => {
    if (!characterData.raceId) return [];
    return subracesList.filter((sub) => sub.race_id === characterData.raceId);
  }, [characterData.raceId, subracesList]);

  // Filter subclasses belonging to the currently selected class_id
  const filteredSubclasses = useMemo(() => {
    if (!characterData.classId) return [];
    return subclassesList.filter(
      (sub) => sub.class_id === characterData.classId,
    );
  }, [characterData.classId, subclassesList]);

  // Active selected entities for UI summary/preview
  const selectedRace = racesList.find((r) => r.id === characterData.raceId);
  const selectedClass = classesList.find((c) => c.id === characterData.classId);

  // ---------------------------------------------------------------------------
  // 3. HOMEBREW DATABASE INSERTION HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * Saves a new custom homebrew race directly to Supabase 'races' table
   */
  const handleSaveCustomRace = async () => {
    if (!customRace.name.trim()) {
      alert("Please provide a name for your custom lineage.");
      return;
    }

    try {
      setIsSavingCustom(true);
      const newRacePayload = {
        name: customRace.name,
        speed: parseInt(customRace.speed) || 30,
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

      // Update parent character data with newly created Race ID
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

  /**
   * Saves a new custom homebrew class directly to Supabase 'classes' table
   */
  const handleSaveCustomClass = async () => {
    if (!customClass.name.trim()) {
      alert("Please provide a name for your custom class.");
      return;
    }

    try {
      setIsSavingCustom(true);
      const newClassPayload = {
        name: customClass.name,
        hit_die: parseInt(customClass.hit_die) || 8,
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

      // Update parent character data with newly created Class ID
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
    <div className="space-y-8 animate-fadeIn">
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

      {/* =================================================================== */}
      {/* SECTION 1: LINEAGE & SUBRACE SELECTION                             */}
      {/* =================================================================== */}
      <div className="space-y-4 border-b border-[#a59075]/20 pb-6">
        <div className="flex justify-between items-center">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            1. Race / Lineage
          </label>
          <button
            type="button"
            onClick={() => setIsAddingCustomRace(!isAddingCustomRace)}
            className="text-xs text-amber-400 hover:text-amber-300 underline transition"
          >
            {isAddingCustomRace
              ? "← Select Standard Race"
              : "+ Add Custom Homebrew Race"}
          </button>
        </div>

        {/* Homebrew Inline Builder: Custom Race */}
        {isAddingCustomRace ? (
          <div className="p-4 bg-[#4a261c] border border-amber-500/40 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-amber-300 uppercase">
              Forge Custom Lineage
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-[#889c9b]">
                  Race Name *
                </label>
                <input
                  type="text"
                  value={customRace.name}
                  onChange={(e) =>
                    setCustomRace({ ...customRace, name: e.target.value })
                  }
                  placeholder="e.g. Dhampir"
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-xs text-[#f0e6d2]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#889c9b]">
                  Speed (ft)
                </label>
                <input
                  type="number"
                  value={customRace.speed}
                  onChange={(e) =>
                    setCustomRace({ ...customRace, speed: e.target.value })
                  }
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-xs text-[#f0e6d2]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#889c9b]">Size</label>
                <select
                  value={customRace.size}
                  onChange={(e) =>
                    setCustomRace({ ...customRace, size: e.target.value })
                  }
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-xs text-[#f0e6d2]"
                >
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-[#889c9b]">
                Description / Lore
              </label>
              <textarea
                value={customRace.description}
                onChange={(e) =>
                  setCustomRace({ ...customRace, description: e.target.value })
                }
                rows={2}
                className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-xs text-[#f0e6d2]"
              />
            </div>
            <button
              type="button"
              disabled={isSavingCustom}
              onClick={handleSaveCustomRace}
              className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 rounded text-xs text-white font-bold transition"
            >
              {isSavingCustom ? "Saving..." : "Save & Select Custom Race"}
            </button>
          </div>
        ) : (
          /* Standard Race Selection Grid */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {racesList.map((race) => (
              <button
                key={race.id}
                type="button"
                onClick={() =>
                  updateCharacterData({ raceId: race.id, subraceId: "" })
                }
                className={`p-3 rounded-lg border text-left transition-all ${
                  characterData.raceId === race.id
                    ? "bg-[#4a261c] border-amber-500 shadow-lg text-[#f0e6d2]"
                    : "bg-[#4a261c]/40 border-[#a59075]/30 hover:border-[#a59075]/60 text-[#938f71]"
                }`}
              >
                <div className="font-bold text-xs flex justify-between items-center">
                  <span>{race.name}</span>
                  {race.is_custom && (
                    <span className="text-[9px] bg-amber-900/60 text-amber-300 px-1 rounded">
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

        {/* Subrace Selector (Rendered if chosen race has available subraces) */}
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
                  className={`px-3 py-1.5 rounded text-xs transition border ${
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

      {/* =================================================================== */}
      {/* SECTION 2: CLASS & SUBCLASS SELECTION                             */}
      {/* =================================================================== */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            2. Class & Archetype
          </label>
          <button
            type="button"
            onClick={() => setIsAddingCustomClass(!isAddingCustomClass)}
            className="text-xs text-amber-400 hover:text-amber-300 underline transition"
          >
            {isAddingCustomClass
              ? "← Select Standard Class"
              : "+ Add Custom Homebrew Class"}
          </button>
        </div>

        {/* Homebrew Inline Builder: Custom Class */}
        {isAddingCustomClass ? (
          <div className="p-4 bg-[#4a261c] border border-amber-500/40 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-amber-300 uppercase">
              Forge Custom Class
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-[#889c9b]">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={customClass.name}
                  onChange={(e) =>
                    setCustomClass({ ...customClass, name: e.target.value })
                  }
                  placeholder="e.g. Blood Hunter"
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-xs text-[#f0e6d2]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#889c9b]">
                  Hit Die (d6, d8, d10, d12)
                </label>
                <select
                  value={customClass.hit_die}
                  onChange={(e) =>
                    setCustomClass({ ...customClass, hit_die: e.target.value })
                  }
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-xs text-[#f0e6d2]"
                >
                  <option value={6}>d6</option>
                  <option value={8}>d8</option>
                  <option value={10}>d10</option>
                  <option value={12}>d12</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#889c9b]">
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
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-xs text-[#f0e6d2]"
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
              className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 rounded text-xs text-white font-bold transition"
            >
              {isSavingCustom ? "Saving..." : "Save & Select Custom Class"}
            </button>
          </div>
        ) : (
          /* Standard Class Selection Grid */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {classesList.map((cls) => (
              <button
                key={cls.id}
                type="button"
                onClick={() =>
                  updateCharacterData({ classId: cls.id, subclassId: "" })
                }
                className={`p-3 rounded-lg border text-left transition-all ${
                  characterData.classId === cls.id
                    ? "bg-[#4a261c] border-amber-500 shadow-lg text-[#f0e6d2]"
                    : "bg-[#4a261c]/40 border-[#a59075]/30 hover:border-[#a59075]/60 text-[#938f71]"
                }`}
              >
                <div className="font-bold text-xs flex justify-between items-center">
                  <span>{cls.name}</span>
                  {cls.is_custom && (
                    <span className="text-[9px] bg-amber-900/60 text-amber-300 px-1 rounded">
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

        {/* Subclass Selector (Rendered if chosen class has available subclasses) */}
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
                  className={`px-3 py-1.5 rounded text-xs transition border ${
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
