/**
 * -----------------------------------------------------------------------------
 * COMPONENT: CharacterSheetView.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Master container and dashboard view for an active D&D 5e character sheet.
 *
 * Layout & Responsive Responsibilities:
 * - Fetches consolidated character sheet data via `fetchFullCharacterSheet`.
 * - Recomputes character stats and Armor Class dynamically upon state changes.
 * - Renders an optional, faded full-body artwork watermark clipped strictly
 *   inside the character sheet container (`overflow-hidden`) when
 *   `character.full_body_url` exists.
 * - Responsive Workspace Grid (`grid-cols-1 lg:grid-cols-12`):
 *   - Phone (`< 640px`): Single-column stacked layout; skills render in 1 clean
 *     column with comfortable row padding (`py-1`).
 *   - Tablet (`640px - 1023px` / `sm` to `lg`): Skills automatically switch to
 *     a 2-column grid (`sm:grid-cols-2`) so all 18 skills take half the vertical
 *     scroll height before the Saving Throws and Tabs section.
 *   - Desktop (`>= 1024px` / `lg+`): Restores the classic 12-column split with
 *     the slim 1-column skills rail (`lg:col-span-4 lg:grid-cols-1`) on the left
 *     and Saving Throws + Tabs (`lg:col-span-8`) on the right.
 * - Overflow Protection: Both grid columns include `min-w-0` so wide tables or
 *   spell lists inside `SheetTabsSection` never push the grid wider than 100%.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.selectedCharacter - Selected hero summary record from roster.
 * @param {Function} props.onBackToRoster - Callback to return to Adventurers Roster.
 * @param {string} props.userName - Authenticated player display name.
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

// Standard D&D 5e 18-skill list mapped to governing ability score keys
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
 * -----------------------------------------------------------------------------
 * Renders the 18 D&D 5e skills with proficiency indicators and computed
 * modifiers.
 * - Uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-1` so tablets display 2
 *   compact columns (reducing vertical scrolling) while phones use 1 roomy
 *   column and desktops keep the slim left sidebar column.
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

  /**
   * Computes total skill modifier including base ability mod, proficiency,
   * and expertise (double proficiency).
   */
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

      {/* Responsive Skill List Grid:
          - Phone (`< sm`): 1 column
          - Tablet (`sm` to `< lg`): 2 columns to halve scroll length
          - Desktop (`lg+`): 1 slim sidebar column */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5 lg:gap-1">
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
              className="flex items-center justify-between gap-2 text-xs lg:text-[11px] px-2.5 lg:px-2 py-1 lg:py-0.5 bg-[#361a12]/85 rounded border border-amber-500/20 min-w-0"
            >
              <div className="flex items-center space-x-1.5 min-w-0">
                <span
                  className={`w-2 h-2 lg:w-1.5 lg:h-1.5 rounded-full shrink-0 ${
                    isProficient
                      ? "bg-amber-400 shadow-sm shadow-amber-400"
                      : "bg-[#5f3426] border border-amber-500/40"
                  }`}
                />
                <span className="text-[#f0e6d2] truncate">
                  {name}{" "}
                  <span className="text-[10px] lg:text-[9px] text-[#889c9b]">
                    ({stat.toUpperCase()})
                  </span>
                </span>
              </div>
              <span className="font-bold text-amber-300 shrink-0">
                {formattedMod}
              </span>
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
   * Effect Hook: Fetches consolidated character sheet record (stats, skills,
   * inventory, spells, class/race metadata) from Supabase.
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
   * Dynamically recomputes derived stats (including equipped Armor Class and
   * proficiency bonus) whenever base stats, level, or inventory change.
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

  /**
   * Optimistically updates local character state and persists live stat changes
   * (HP, Temp HP, Hit Dice, Inspiration, Conditions, Spell Slots) to Supabase.
   */
  const handleLiveUpdate = async (updates) => {
    if (!character?.id) return;
    try {
      setCharacter((prev) => ({ ...prev, ...updates }));
      await updateCharacterLiveStats(character.id, updates);
    } catch (err) {
      console.error("Failed to save updates:", err);
    }
  };

  /**
   * Executes a Short Rest or Long Rest via `characterService` and refreshes state.
   */
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
      <div className="p-8 sm:p-12 text-center text-[#f0e6d2] font-medieval text-base sm:text-lg">
        ⚔️ Conjuring character sheet from the chronicles...
      </div>
    );
  }

  if (error || !computedCharacter) {
    return (
      <div className="p-4 sm:p-6 bg-red-950/60 border border-red-500 rounded-xl text-center text-red-300 space-y-3">
        <p className="text-sm">{error || "Character not found."}</p>
        <button
          type="button"
          onClick={onBackToRoster}
          className="px-4 py-2 bg-[#4a261c] border border-amber-500/40 rounded text-xs text-[#f0e6d2]"
        >
          ← Return to Roster
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl max-w-7xl mx-auto pb-8 sm:pb-12 animate-fadeIn">
      {/* ===================================================================
        FULL-BODY CHARACTER ARTWORK WATERMARK LAYER (CENTERED IN SHEET)
        - Strictly clipped by `overflow-hidden` on the outer sheet wrapper.
        =================================================================== */}
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

      {/* ===================================================================
        FOREGROUND INTERACTIVE CHARACTER SHEET CONTENT
        =================================================================== */}
      <div className="relative z-10 space-y-3 sm:space-y-4">
        {/* 1. TOP IDENTITY & REST BANNER */}
        <CharacterSheetBanner
          character={computedCharacter}
          userName={userName}
          onShortRest={() => handleRest("SHORT")}
          onLongRest={() => handleRest("LONG")}
          onLevelUp={() => alert("Level Up Wizard coming soon!")}
          onBackToRoster={onBackToRoster}
        />

        {/* 2. UPPER ABILITY SCORES, VITALS & PASSIVE SENSES RIBBON */}
        <UpperStatsRibbon
          character={computedCharacter}
          onUpdateHp={(hpUpdates) => handleLiveUpdate(hpUpdates)}
          onToggleInspiration={(val) => handleLiveUpdate({ inspiration: val })}
        />

        {/* 3. MASTER 12-COLUMN WORKSPACE GRID
            - `min-w-0` on both columns prevents wide tables/tabs inside
              `SheetTabsSection` from causing horizontal scroll on phones/tablets. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT COLUMN (Span 4 on desktop): Character Skills Box */}
          <div className="lg:col-span-4 min-w-0">
            <SlimmerCharacterSkills character={computedCharacter} />
          </div>

          {/* RIGHT COLUMN (Span 8 on desktop): Saving Throws/Conditions & Multi-Tab Workspace */}
          <div className="lg:col-span-8 min-w-0 space-y-4">
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
