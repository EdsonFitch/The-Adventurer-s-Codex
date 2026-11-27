/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepBackgroundGear.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Manages Step 4 of Character Creation:
 * - Official or Homebrew Background selection.
 * - Inline custom background builder inserting directly into Supabase.
 * - Safe type-checking and string normalization for background features and
 *   granted skill proficiencies.
 *
 * Responsive & Touch Behavior:
 * - Background Cards Grid: Uses `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` so
 *   phones show full-width cards without truncating feature subtitles.
 * - Touch-Friendly Skill Pills: Enlarges custom background skill pills
 *   (`px-2.5 py-1.5 sm:px-2 sm:py-1 text-xs sm:text-[10px]`) for reliable finger
 *   taps on mobile screens.
 * - Form Controls: Uses `text-sm sm:text-xs` on inputs and textareas to prevent
 *   mobile browser focus zoom.
 *
 * @param {Object} props - Component properties.
 * -----------------------------------------------------------------------------
 */

import React, { useState } from "react";
import { supabase } from "../../supabaseClient";

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

export default function StepBackgroundGear({
  characterData,
  updateCharacterData,
  backgroundsList = [],
  userId,
}) {
  const [isAddingCustomBg, setIsAddingCustomBg] = useState(false);
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  const [customBg, setCustomBg] = useState({
    name: "",
    feature_name: "",
    feature_description: "",
    description: "",
    skill_proficiencies: [],
  });

  const selectedBackground = Array.isArray(backgroundsList)
    ? backgroundsList.find((bg) => bg && bg.id === characterData.backgroundId)
    : null;

  const safeString = (value, fallback = "") => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    if (typeof value === "object") {
      try {
        return value.name || value.title || JSON.stringify(value);
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  const getNormalizedSkills = (skillsData) => {
    if (!skillsData) return [];
    if (Array.isArray(skillsData)) {
      return skillsData.map((s) => safeString(s)).filter(Boolean);
    }
    if (typeof skillsData === "string") {
      try {
        const parsed = JSON.parse(skillsData);
        if (Array.isArray(parsed)) {
          return parsed.map((s) => safeString(s)).filter(Boolean);
        }
      } catch {
        return skillsData
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    return [];
  };

  const handleSaveCustomBackground = async () => {
    if (!customBg.name.trim()) {
      alert("Please provide a name for your custom background.");
      return;
    }

    try {
      setIsSavingCustom(true);
      const newBgPayload = {
        name: customBg.name.trim(),
        feature_name: customBg.feature_name.trim() || "Custom Feature",
        feature_description: customBg.feature_description.trim() || "",
        description: customBg.description.trim() || "",
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

  const toggleCustomSkill = (skill) => {
    setCustomBg((prev) => {
      const currentSkills = Array.isArray(prev.skill_proficiencies)
        ? prev.skill_proficiencies
        : [];

      const exists = currentSkills.includes(skill);
      if (exists) {
        return {
          ...prev,
          skill_proficiencies: currentSkills.filter((s) => s !== skill),
        };
      }
      if (currentSkills.length >= 2) {
        alert("Standard backgrounds grant a maximum of 2 skill proficiencies.");
        return prev;
      }
      return {
        ...prev,
        skill_proficiencies: [...currentSkills, skill],
      };
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
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

      {/* =====================================================================
        SECTION 1: BACKGROUND SELECTION
        ===================================================================== */}
      <div className="space-y-4 border-b border-[#a59075]/20 pb-6">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            1. Character Background
          </label>
          <button
            type="button"
            onClick={() => setIsAddingCustomBg(!isAddingCustomBg)}
            className="py-1 text-xs text-amber-400 hover:text-amber-300 underline transition cursor-pointer"
          >
            {isAddingCustomBg
              ? "← Select Standard Background"
              : "+ Add Custom Homebrew Background"}
          </button>
        </div>

        {/* Custom Background Inline Form */}
        {isAddingCustomBg ? (
          <div className="p-3.5 sm:p-4 bg-[#4a261c] border border-amber-500/40 rounded-lg space-y-4">
            <h4 className="text-xs font-bold text-amber-300 uppercase">
              Forge Custom Background
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#889c9b] mb-1">
                  Background Name *
                </label>
                <input
                  type="text"
                  value={customBg.name}
                  onChange={(e) =>
                    setCustomBg({ ...customBg, name: e.target.value })
                  }
                  placeholder="e.g. Bounty Hunter"
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm sm:text-xs text-[#f0e6d2]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#889c9b] mb-1">
                  Feature Name
                </label>
                <input
                  type="text"
                  value={customBg.feature_name}
                  onChange={(e) =>
                    setCustomBg({ ...customBg, feature_name: e.target.value })
                  }
                  placeholder="e.g. Ear to the Ground"
                  className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm sm:text-xs text-[#f0e6d2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#889c9b] mb-1">
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
                className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm sm:text-xs text-[#f0e6d2]"
              />
            </div>

            {/* Touch-Sized Custom Skill Proficiency Pills */}
            <div>
              <label className="block text-[10px] text-[#889c9b] mb-1.5">
                Select 2 Skill Proficiencies (
                {Array.isArray(customBg.skill_proficiencies)
                  ? customBg.skill_proficiencies.length
                  : 0}
                /2)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SKILLS.map((skill) => {
                  const isSelected =
                    Array.isArray(customBg.skill_proficiencies) &&
                    customBg.skill_proficiencies.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleCustomSkill(skill)}
                      className={`px-2.5 py-1.5 sm:px-2 sm:py-1 rounded text-xs sm:text-[10px] border transition cursor-pointer ${
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
              className="px-4 py-2 sm:py-1.5 bg-amber-700 hover:bg-amber-600 rounded text-xs text-white font-bold transition cursor-pointer"
            >
              {isSavingCustom ? "Saving..." : "Save & Select Custom Background"}
            </button>
          </div>
        ) : (
          /* Standard Background Selection Grid (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3`) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            {backgroundsList.map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => updateCharacterData({ backgroundId: bg.id })}
                className={`min-w-0 p-3.5 sm:p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  characterData.backgroundId === bg.id
                    ? "bg-[#4a261c] border-amber-500 shadow-lg text-[#f0e6d2]"
                    : "bg-[#4a261c]/40 border-[#a59075]/30 hover:border-[#a59075]/60 text-[#938f71]"
                }`}
              >
                <div className="font-bold text-xs flex flex-wrap justify-between items-center gap-1">
                  <span className="break-words">
                    {safeString(bg.name, "Unnamed Background")}
                  </span>
                  {bg.is_custom && (
                    <span className="text-[9px] bg-amber-900/60 text-amber-300 px-1 rounded shrink-0">
                      Homebrew
                    </span>
                  )}
                </div>
                {bg.feature_name && (
                  <div className="text-[10px] text-amber-400/80 mt-1 italic truncate">
                    Feature: {safeString(bg.feature_name)}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================================
        SECTION 2: PROFICIENCIES & FEATURE PREVIEW
        ===================================================================== */}
      {selectedBackground && (
        <div className="p-3.5 sm:p-4 bg-[#4a261c]/50 border border-[#a59075]/30 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wider break-words">
            Background Details:{" "}
            {safeString(selectedBackground.name, "Selected Background")}
          </h4>

          {selectedBackground.feature_name && (
            <div>
              <span className="text-xs font-bold text-amber-400">
                {safeString(selectedBackground.feature_name)}:
              </span>
              <p className="text-xs text-[#889c9b] mt-0.5 break-words">
                {safeString(
                  selectedBackground.feature_description ||
                    selectedBackground.description,
                  "No detailed description available.",
                )}
              </p>
            </div>
          )}

          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#889c9b] block mb-1.5">
              Granted Skill Proficiencies:
            </span>
            <div className="flex flex-wrap gap-2">
              {getNormalizedSkills(selectedBackground.skill_proficiencies)
                .length > 0 ? (
                getNormalizedSkills(selectedBackground.skill_proficiencies).map(
                  (skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-[#361a12] border border-amber-500/40 text-xs text-amber-300 font-bold"
                    >
                      ✓ {skill}
                    </span>
                  ),
                )
              ) : (
                <span className="text-xs text-[#889c9b]">
                  Standard background proficiencies applied.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
