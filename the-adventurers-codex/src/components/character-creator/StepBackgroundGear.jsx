import React, { useState } from "react";
import { supabase } from "../../supabaseClient";

/**
 * Standard D&D 5e Skill List
 */
const ALL_SKILLS = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "History",
  "Insight",
  "Intimidation",
  "Investigation",
  "Medicine",
  "Nature",
  "Perception",
  "Performance",
  "Persuasion",
  "Religion",
  "Sleight of Hand",
  "Stealth",
  "Survival",
];

/**
 * StepBackgroundGear Component
 * -----------------------------------------------------------------------------
 * Manages Step 4 of Character Creation:
 * - Background Selection (Official or Homebrew)
 * - Skill Proficiencies Allocation
 * - Starting Equipment & Tool Proficiencies
 *
 * @param {Object} props
 * @param {Object} props.characterData - Master character payload state
 * @param {Function} props.updateCharacterData - Callback to update master state
 * @param {Array} props.backgroundsList - Pre-fetched backgrounds from Supabase
 * @param {string} props.userId - Authenticated user UUID for homebrew ownership
 */
export default function StepBackgroundGear({
  characterData,
  updateCharacterData,
  backgroundsList = [],
  userId,
}) {
  // ---------------------------------------------------------------------------
  // 1. HOMEBREW BACKGROUND BUILDER STATE
  // ---------------------------------------------------------------------------
  const [isAddingCustomBg, setIsAddingCustomBg] = useState(false);
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  const [customBg, setCustomBg] = useState({
    name: "",
    feature_name: "",
    feature_description: "",
    description: "",
    skill_proficiencies: [],
  });

  // Selected background object reference
  const selectedBackground = backgroundsList.find(
    (bg) => bg.id === characterData.backgroundId,
  );

  // ---------------------------------------------------------------------------
  // 2. HOMEBREW DATABASE INSERTION
  // ---------------------------------------------------------------------------

  /**
   * Saves a new custom background directly to Supabase 'backgrounds' table
   */
  const handleSaveCustomBackground = async () => {
    if (!customBg.name.trim()) {
      alert("Please provide a name for your custom background.");
      return;
    }

    try {
      setIsSavingCustom(true);
      const newBgPayload = {
        name: customBg.name,
        feature_name: customBg.feature_name || "Custom Feature",
        feature_description: customBg.feature_description || "",
        description: customBg.description || "",
        skill_proficiencies: customBg.skill_proficiencies,
        tool_proficiencies: [],
        languages: [],
        equipment: [],
        is_custom: true,
        created_by: userId,
      };

      const { data, error } = await supabase
        .from("backgrounds")
        .insert([newBgPayload])
        .select()
        .single();

      if (error) throw error;

      // Update master character data with new background UUID
      updateCharacterData({ backgroundId: data.id });
      setIsAddingCustomBg(false);
      setCustomBg({
        name: "",
        feature_name: "",
        feature_description: "",
        description: "",
        skill_proficiencies: [],
      });
    } catch (err) {
      console.error("Error creating custom background:", err);
      alert("Failed to save homebrew background to database.");
    } finally {
      setIsSavingCustom(false);
    }
  };

  /**
   * Toggle skills inside custom background form
   */
  const toggleCustomSkill = (skill) => {
    setCustomBg((prev) => {
      const exists = prev.skill_proficiencies.includes(skill);
      if (exists) {
        return {
          ...prev,
          skill_proficiencies: prev.skill_proficiencies.filter(
            (s) => s !== skill,
          ),
        };
      }
      if (prev.skill_proficiencies.length >= 2) {
        alert("Standard backgrounds grant a maximum of 2 skill proficiencies.");
        return prev;
      }
      return {
        ...prev,
        skill_proficiencies: [...prev.skill_proficiencies, skill],
      };
    });
  };

  // ---------------------------------------------------------------------------
  // 3. RENDER UI
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h3 className="text-base font-medieval font-bold text-[#f0e6d2]">
          Step 4: Background & Gear
        </h3>
        <p className="text-xs text-[#889c9b]">
          Select your character's backstory, core proficiencies, and starting
          equipment.
        </p>
      </div>

      {/* =================================================================== */}
      {/* SECTION 1: BACKGROUND SELECTION                                    */}
      {/* =================================================================== */}
      <div className="space-y-4 border-b border-[#a59075]/20 pb-6">
        <div className="flex justify-between items-center">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            1. Character Background
          </label>
          <button
            type="button"
            onClick={() => setIsAddingCustomBg(!isAddingCustomBg)}
            className="text-xs text-amber-400 hover:text-amber-300 underline transition"
          >
            {isAddingCustomBg
              ? "← Select Standard Background"
              : "+ Add Custom Homebrew Background"}
          </button>
        </div>

        {/* Custom Background Inline Form */}
        {isAddingCustomBg ? (
          <div className="p-4 bg-[#4a261c] border border-amber-500/40 rounded-lg space-y-4">
            <h4 className="text-xs font-bold text-amber-300 uppercase">
              Forge Custom Background
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#889c9b]">
                  Background Name *
                </label>
                <input
                  type="text"
                  value={customBg.name}
                  onChange={(e) =>
                    setCustomBg({ ...customBg, name: e.target.value })
                  }
                  placeholder="e.g. Bounty Hunter"
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-xs text-[#f0e6d2]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#889c9b]">
                  Feature Name
                </label>
                <input
                  type="text"
                  value={customBg.feature_name}
                  onChange={(e) =>
                    setCustomBg({ ...customBg, feature_name: e.target.value })
                  }
                  placeholder="e.g. Ear to the Ground"
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-xs text-[#f0e6d2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#889c9b]">
                Feature Description
              </label>
              <textarea
                value={customBg.feature_description}
                onChange={(e) =>
                  setCustomBg({
                    ...customBg,
                    feature_description: e.target.value,
                  })
                }
                rows={2}
                placeholder="Describe what unique perk or network this background offers..."
                className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-xs text-[#f0e6d2]"
              />
            </div>

            {/* Custom Skill Proficiency Selection */}
            <div>
              <label className="block text-[10px] text-[#889c9b] mb-1">
                Select 2 Skill Proficiencies (
                {customBg.skill_proficiencies.length}/2)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SKILLS.map((skill) => {
                  const isSelected =
                    customBg.skill_proficiencies.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleCustomSkill(skill)}
                      className={`px-2 py-1 rounded text-[10px] border transition ${
                        isSelected
                          ? "bg-amber-800 border-amber-500 text-white font-bold"
                          : "bg-[#361a12] border-[#a59075]/30 text-[#889c9b] hover:text-[#f0e6d2]"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={isSavingCustom}
              onClick={handleSaveCustomBackground}
              className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 rounded text-xs text-white font-bold transition"
            >
              {isSavingCustom ? "Saving..." : "Save & Select Custom Background"}
            </button>
          </div>
        ) : (
          /* Standard Background Selection Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {backgroundsList.map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => updateCharacterData({ backgroundId: bg.id })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  characterData.backgroundId === bg.id
                    ? "bg-[#4a261c] border-amber-500 shadow-lg text-[#f0e6d2]"
                    : "bg-[#4a261c]/40 border-[#a59075]/30 hover:border-[#a59075]/60 text-[#938f71]"
                }`}
              >
                <div className="font-bold text-xs flex justify-between items-center">
                  <span>{bg.name}</span>
                  {bg.is_custom && (
                    <span className="text-[9px] bg-amber-900/60 text-amber-300 px-1 rounded">
                      Homebrew
                    </span>
                  )}
                </div>
                {bg.feature_name && (
                  <div className="text-[10px] text-amber-400/80 mt-1 italic">
                    Feature: {bg.feature_name}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* SECTION 2: PROFICIENCIES & FEATURE PREVIEW                         */}
      {/* =================================================================== */}
      {selectedBackground && (
        <div className="p-4 bg-[#4a261c]/50 border border-[#a59075]/30 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wider">
            Background Details: {selectedBackground.name}
          </h4>

          {selectedBackground.feature_name && (
            <div>
              <span className="text-xs font-bold text-amber-400">
                {selectedBackground.feature_name}:
              </span>
              <p className="text-xs text-[#889c9b] mt-0.5">
                {selectedBackground.feature_description ||
                  "No detailed description available."}
              </p>
            </div>
          )}

          {/* Skill proficiencies granted */}
          {selectedBackground.skill_proficiencies && (
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#889c9b] block mb-1">
                Granted Skill Proficiencies:
              </span>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(selectedBackground.skill_proficiencies) ? (
                  selectedBackground.skill_proficiencies.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-[#361a12] border border-amber-500/40 text-xs text-amber-300 font-bold"
                    >
                      ✓ {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#889c9b]">
                    Standard background proficiencies applied.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
