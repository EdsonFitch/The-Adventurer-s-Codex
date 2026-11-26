/**
 * -----------------------------------------------------------------------------
 * COMPONENT: CharacterSheetView.jsx
 * -----------------------------------------------------------------------------
 * Master container and dashboard view for an active D&D 5e character sheet.
 *
 * Layout & Responsibilities:
 * - Fetches consolidated character sheet data via `fetchFullCharacterSheet`.
 * - Recomputes character stats and Armor Class dynamically upon state changes.
 * - Renders an optional, faded full-body artwork watermark clipped strictly
 *   inside the character sheet container when `character.full_body_url` exists.
 * - Left Column (Span 4): Slimmer Character Skills box.
 * - Right Column (Span 8): Saving Throws, Conditions, Resistances,
 *   and the multi-tab workspace (`SheetTabsSection`) placed underneath.
 * -----------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import {
  fetchFullCharacterSheet,
  updateCharacterLiveStats,
  executeRest,
} from "../../services/characterService";
import { computeCharacterStats } from "../../utils/statCalculator";
import CharacterSheetBanner from "./CharacterSheetBanner";
import UpperStatsRibbon from "./UpperStatsRibbon";
import MainStatsGrid from "./MainStatsGrid";
import SheetTabsSection from "./SheetTabsSection";

// Standard 5e Skills Mapping definition for the slimmed skills component
const SKILL_DEFINITIONS = [
  { name: "Acrobatics", stat: "dex" },
  { name: "Animal Handling", stat: "wis" },
  { name: "Arcana", stat: "int" },
  { name: "Athletics", stat: "str" },
  { name: "Deception", stat: "cha" },
  { name: "History", stat: "int" },
  { name: "Insight", stat: "wis" },
  { name: "Intimidation", stat: "cha" },
  { name: "Investigation", stat: "int" },
  { name: "Medicine", stat: "wis" },
  { name: "Nature", stat: "int" },
  { name: "Perception", stat: "wis" },
  { name: "Performance", stat: "cha" },
  { name: "Persuasion", stat: "cha" },
  { name: "Religion", stat: "int" },
  { name: "Sleight of Hand", stat: "dex" },
  { name: "Stealth", stat: "dex" },
  { name: "Survival", stat: "wis" },
];

/**
 * SlimmerCharacterSkills Component
 * Renders the compact skills column on the left side of the dashboard.
 */
function SlimmerCharacterSkills({ character }) {
  const stats = character.stats ||
    character.computed?.abilityScores || {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    };
  const proficiencyBonus =
    character.computed?.proficiencyBonus ||
    Math.floor(((character.level || 1) - 1) / 4) + 2;

  const getSkillMod = (skillName, statKey) => {
    const baseMod = Math.floor(((stats[statKey] || 10) - 10) / 2);
    const foundSkill = (character.skills || []).find(
      (s) =>
        s.skills?.name?.toLowerCase() === skillName.toLowerCase() ||
        s.name?.toLowerCase() === skillName.toLowerCase(),
    );
    const isProficient = foundSkill?.is_proficient || foundSkill?.isProficient;
    const hasExpertise = foundSkill?.has_expertise || foundSkill?.hasExpertise;

    let total = baseMod;
    if (hasExpertise) total += proficiencyBonus * 2;
    else if (isProficient) total += proficiencyBonus;
    return total;
  };

  return (
    <div className="p-3 bg-[#4a261c]/90 backdrop-blur-[1px] border-2 border-amber-600/50 rounded-xl shadow-md space-y-2">
      <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest border-b border-amber-500/30 pb-1">
        ✨ Character Skills ({SKILL_DEFINITIONS.length})
      </h3>
      <div className="space-y-1">
        {SKILL_DEFINITIONS.map(({ name, stat }) => {
          const skillModVal = getSkillMod(name, stat);
          const formattedMod =
            skillModVal >= 0 ? `+${skillModVal}` : `${skillModVal}`;

          const foundSkill = (character.skills || []).find(
            (s) =>
              s.skills?.name?.toLowerCase() === name.toLowerCase() ||
              s.name?.toLowerCase() === name.toLowerCase(),
          );
          const isProficient = Boolean(
            foundSkill?.is_proficient || foundSkill?.isProficient,
          );

          return (
            <div
              key={name}
              className="flex items-center justify-between text-[11px] px-2 py-0.5 bg-[#361a12]/85 rounded border border-amber-500/20"
            >
              <div className="flex items-center space-x-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isProficient ? "bg-amber-400 shadow-sm shadow-amber-400" : "bg-[#5f3426] border border-amber-500/40"}`}
                />
                <span className="text-[#f0e6d2]">
                  {name}{" "}
                  <span className="text-[9px] text-[#889c9b]">
                    ({stat.toUpperCase()})
                  </span>
                </span>
              </div>
              <span className="font-bold text-amber-300">{formattedMod}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CharacterSheetView({
  selectedCharacter,
  onBackToRoster,
  userName,
}) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Effect Hook: Fetches full character sheet record from Supabase
   */
  useEffect(() => {
    async function loadSheet() {
      if (!selectedCharacter?.id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await fetchFullCharacterSheet(selectedCharacter.id);
        setCharacter(data);
      } catch (err) {
        console.error("Failed to load full character sheet:", err);
        setError("Failed to load character sheet from database.");
      } finally {
        setLoading(false);
      }
    }
    loadSheet();
  }, [selectedCharacter?.id]);

  /**
   * Whenever character inventory or stats change, dynamically recompute stats (including AC)
   */
  const computedCharacter = character
    ? {
        ...character,
        computed: computeCharacterStats(
          {
            baseAbilityScores: character.stats,
            level: character.level || 1,
            baseProficiencies: character.languages || [],
            inventory: character.inventory || [],
          },
          [],
        ),
      }
    : null;

  const handleLiveUpdate = async (updates) => {
    if (!character?.id) return;
    try {
      setCharacter((prev) => ({ ...prev, ...updates }));
      await updateCharacterLiveStats(character.id, updates);
    } catch (err) {
      console.error("Failed to save updates:", err);
    }
  };

  const handleRest = async (restType) => {
    if (!character?.id) return;
    try {
      const updated = await executeRest(character.id, restType, character);
      setCharacter((prev) => ({ ...prev, ...updated }));
      alert(
        `${restType === "LONG" ? "Long Rest" : "Short Rest"} completed successfully!`,
      );
    } catch (err) {
      console.error("Failed to execute rest:", err);
      alert("Error executing rest.");
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[#f0e6d2] font-medieval text-lg">
        ⚔️ Conjuring character sheet from the chronicles...
      </div>
    );
  }

  if (error || !computedCharacter) {
    return (
      <div className="p-6 bg-red-950/60 border border-red-500 rounded-xl text-center text-red-300 space-y-3">
        <p>{error || "Character not found."}</p>
        <button
          type="button"
          onClick={onBackToRoster}
          className="px-4 py-1.5 bg-[#4a261c] border border-amber-500/40 rounded text-xs text-[#f0e6d2]"
        >
          ← Return to Roster
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* =================================================================== */}
      {/* FULL-BODY CHARACTER ARTWORK WATERMARK LAYER (CENTERED IN SHEET)     */}
      {/* =================================================================== */}
      {computedCharacter.full_body_url && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden flex items-center justify-center"
        >
          <img
            src={computedCharacter.full_body_url}
            alt=""
            className="h-full max-h-[900px] w-auto max-w-full object-contain opacity-[0.16] mix-blend-luminosity filter contrast-125"
            style={{
              maskImage:
                "radial-gradient(ellipse 70% 80% at 50% 50%, black 45%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 70% 80% at 50% 50%, black 45%, transparent 100%)",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      {/* =================================================================== */}
      {/* FOREGROUND CHARACTER SHEET CONTENT                                  */}
      {/* =================================================================== */}
      <div className="relative z-10 space-y-4">
        {/* 1. TOP BANNER */}
        <CharacterSheetBanner
          character={computedCharacter}
          userName={userName}
          onShortRest={() => handleRest("SHORT")}
          onLongRest={() => handleRest("LONG")}
          onLevelUp={() => alert("Level Up Wizard coming soon!")}
          onBackToRoster={onBackToRoster}
        />

        {/* 2. UPPER STATS & HEALTH RIBBON */}
        <UpperStatsRibbon
          character={computedCharacter}
          onUpdateHp={(hpUpdates) => handleLiveUpdate(hpUpdates)}
          onToggleInspiration={(val) => handleLiveUpdate({ inspiration: val })}
        />

        {/* 3. MASTER 12-COLUMN WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT COLUMN (Span 4): Slimmer Character Skills Box */}
          <div className="lg:col-span-4">
            <SlimmerCharacterSkills character={computedCharacter} />
          </div>

          {/* RIGHT COLUMN (Span 8): Saving Throws/Conditions on top, Multi-Tab Workspace directly below */}
          <div className="lg:col-span-8 space-y-4">
            <MainStatsGrid
              character={computedCharacter}
              onUpdateConditions={(conds) =>
                handleLiveUpdate({ active_conditions: conds })
              }
              onUpdateResistances={(res) =>
                handleLiveUpdate({ resistances: res })
              }
            />

            <SheetTabsSection
              character={computedCharacter}
              onUpdateSpellSlots={(slots) =>
                handleLiveUpdate({ spell_slots_used: slots })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
