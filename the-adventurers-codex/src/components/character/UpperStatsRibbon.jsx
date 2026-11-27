/**
 * -----------------------------------------------------------------------------
 * COMPONENT: UpperStatsRibbon.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Upper horizontal ribbon for the Character Sheet view.
 * - Row 1: Six Ability Score squares (STR, DEX, CON, INT, WIS, CHA),
 *   Proficiency Bonus, and Heroic Inspiration toggle.
 * - Row 2: Vitals / Health (Current/Max HP, Temp HP, and Hit Dice tracker),
 *   Armor Class (dynamically computed from equipped gear), Initiative, and
 *   Passive Senses (Perception, Investigation, Insight).
 *
 * Responsive & Touch Behavior:
 * - Row 1 Breakpoints: `grid-cols-2 sm:grid-cols-4 lg:grid-cols-8` gives phones
 *   4 clean rows of 2 cards, tablets 2 clean rows of 4 cards, and desktops 1
 *   single row of 8 cards.
 * - Row 2 Breakpoints (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-12`):
 *   - Phone (`< sm`): Stacks all 4 boxes cleanly in 1 column.
 *   - Tablet (`sm` to `< lg`): Vitals spans full width (`sm:col-span-2`), Armor
 *     Class and Initiative sit side-by-side (`sm:col-span-1` each), and
 *     Passive Senses spans full width (`sm:col-span-2`) so no card gets squeezed.
 *   - Desktop (`lg+`): Restores the exact 4 / 2 / 1 / 5 12-column row.
 * - Touchscreen Targets: Enlarges HP and Hit Dice `-`/`+` buttons to
 *   `w-7 h-7 sm:w-6 sm:h-6` (and `w-6 h-6 sm:w-5 sm:h-5` for Hit Dice) so
 *   mobile and tablet users can tap them accurately without mis-taps.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.character - Computed character record.
 * @param {Function} props.onUpdateHp - Persists `hp_current`, `hp_temp`, or `hit_dice_used`.
 * @param {Function} props.onToggleInspiration - Persists boolean `inspiration` state.
 * -----------------------------------------------------------------------------
 */

import React from "react";
import { calculateModifier } from "../../utils/statCalculator";

export default function UpperStatsRibbon({
  character,
  onUpdateHp,
  onToggleInspiration,
}) {
  if (!character) return null;

  // Extract base ability scores safely with D&D 5e default 10s
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

  const inspirationActive = Boolean(character.inspiration);

  // Current, Maximum, and Temporary Hit Points
  const hpCurrent = character.hp_current ?? character.hp_max ?? 10;
  const hpMax = character.hp_max ?? 10;
  const hpTemp = character.hp_temp ?? 0;

  // Hit Dice calculation derived from level, primaryClass.hit_die, and hit_dice_used
  const totalHitDice = Math.max(1, Number(character.level) || 1);
  const hitDieSize = Number(character.primaryClass?.hit_die) || 8;
  const hitDiceUsed = Math.min(
    totalHitDice,
    Math.max(0, Number(character.hit_dice_used) || 0),
  );
  const hitDiceRemaining = Math.max(0, totalHitDice - hitDiceUsed);

  // Initiative & Dynamic Armor Class
  const dexModNum = Math.floor(((stats.dex || 10) - 10) / 2);
  const initiativeBonus = dexModNum >= 0 ? `+${dexModNum}` : `${dexModNum}`;

  const armorClass =
    character.computed?.armorClass ||
    character.armor_class_override ||
    10 + dexModNum;

  /**
   * Computes a skill modifier including proficiency and expertise bonuses
   * for Passive Perception, Investigation, and Insight.
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

  const passivePerception = 10 + getSkillMod("Perception", "wis");
  const passiveInvestigation = 10 + getSkillMod("Investigation", "int");
  const passiveInsight = 10 + getSkillMod("Insight", "wis");

  const abilityList = [
    { key: "str", label: "Strength" },
    { key: "dex", label: "Dexterity" },
    { key: "con", label: "Constitution" },
    { key: "int", label: "Intelligence" },
    { key: "wis", label: "Wisdom" },
    { key: "cha", label: "Charisma" },
  ];

  return (
    <div className="space-y-3 my-3 sm:my-4">
      {/* =====================================================================
        ROW 1: ABILITY SCORES, PROFICIENCY & INSPIRATION
        - 2 columns on phones, 4 columns on tablets, 8 columns on desktops.
        ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-2.5">
        {abilityList.map(({ key, label }) => {
          const score = stats[key] || 10;
          const modifier = calculateModifier(score);

          return (
            <div key={key} className="flex flex-col items-center relative pt-3">
              <span className="absolute top-0 text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-[#361a12] px-1.5 rounded border border-amber-500/30">
                {label.substring(0, 3)}
              </span>
              <div className="w-full h-full p-2 bg-[#4a261c] border-2 border-amber-600/50 rounded-lg text-center space-y-1 shadow-md flex flex-col justify-center">
                <span className="block text-xl font-bold text-[#f0e6d2]">
                  {modifier}
                </span>
                <div className="w-8 mx-auto py-0.5 bg-[#361a12] rounded border border-amber-500/30 text-[11px] font-bold text-amber-400 shadow-inner">
                  {score}
                </div>
              </div>
            </div>
          );
        })}

        {/* Proficiency Bonus Square */}
        <div className="flex flex-col items-center relative pt-3">
          <span className="absolute top-0 text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-[#361a12] px-1.5 rounded border border-amber-500/30">
            Proficiency
          </span>
          <div className="w-full h-full p-2 bg-[#4a261c] border-2 border-amber-600/50 rounded-lg flex flex-col items-center justify-center shadow-md">
            <span className="text-xl font-bold text-[#f0e6d2]">
              +{proficiencyBonus}
            </span>
            <span className="text-[9px] text-[#889c9b] uppercase">Bonus</span>
          </div>
        </div>

        {/* Heroic Inspiration Toggle Square */}
        <div className="flex flex-col items-center relative pt-3">
          <span className="absolute top-0 text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-[#361a12] px-1.5 rounded border border-amber-500/30">
            Inspiration
          </span>
          <button
            type="button"
            onClick={() => onToggleInspiration(!inspirationActive)}
            className={`w-full h-full p-2 rounded-lg border-2 flex flex-col items-center justify-center transition shadow-md cursor-pointer ${
              inspirationActive
                ? "bg-amber-600/40 border-amber-400 text-amber-300 shadow-amber-500/20"
                : "bg-[#4a261c] border-amber-600/50 text-[#889c9b] hover:text-[#f0e6d2]"
            }`}
            title="Click or tap to toggle Heroic Inspiration"
          >
            <span className="text-lg">🎲</span>
            <span className="text-[10px] font-bold uppercase">
              {inspirationActive ? "Active" : "None"}
            </span>
          </button>
        </div>
      </div>

      {/* =====================================================================
        ROW 2: VITALS, ARMOR CLASS, INITIATIVE & PASSIVE SENSES
        - Phone (`< sm`): 1 column stack.
        - Tablet (`sm` to `< lg`): Vitals spans 2 cols (`sm:col-span-2`), AC &
          Initiative sit side-by-side (`sm:col-span-1` each), and Passive Senses
          spans 2 cols (`sm:col-span-2`).
        - Desktop (`lg+`): 12-column row (4 / 2 / 1 / 5).
        ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* 1. HEALTH / VITALS BOX */}
        <div className="sm:col-span-2 lg:col-span-4 min-w-0 flex flex-col items-center relative pt-3">
          <span className="absolute top-0 text-[10px] font-bold uppercase text-red-400 tracking-wider bg-[#361a12] px-1.5 rounded border border-red-500/30 z-10">
            Vitals / Health
          </span>
          <div className="w-full h-full min-w-0 px-2.5 py-2.5 sm:py-2 bg-[#4a261c] border-2 border-red-600/50 rounded-lg flex flex-col justify-between gap-2 sm:gap-1.5 shadow-md overflow-hidden">
            {/* Top Half: Current / Max HP & Temporary HP */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-1.5">
              {/* Current / Max HP Stepper */}
              <div className="min-w-0 flex flex-col items-center justify-center gap-1 sm:gap-0.5">
                <span className="text-[9px] uppercase text-[#889c9b] whitespace-nowrap">
                  Current / Max
                </span>
                <div className="flex items-center justify-center gap-1.5 sm:gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateHp({ hp_current: Math.max(0, hpCurrent - 1) })
                    }
                    className="w-7 h-7 sm:w-6 sm:h-6 shrink-0 bg-[#361a12] hover:bg-red-900/50 text-red-400 rounded border border-red-500/40 flex items-center justify-center text-sm sm:text-xs font-bold cursor-pointer"
                    aria-label="Decrease Current HP"
                  >
                    -
                  </button>
                  <span className="text-sm xl:text-base font-bold text-red-400 whitespace-nowrap text-center px-0.5">
                    {hpCurrent}/{hpMax}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateHp({
                        hp_current: Math.min(hpMax, hpCurrent + 1),
                      })
                    }
                    className="w-7 h-7 sm:w-6 sm:h-6 shrink-0 bg-[#361a12] hover:bg-green-900/50 text-green-400 rounded border border-green-500/40 flex items-center justify-center text-sm sm:text-xs font-bold cursor-pointer"
                    aria-label="Increase Current HP"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="w-[1px] h-8 sm:h-7 bg-red-500/30 shrink-0" />

              {/* Temporary HP Stepper */}
              <div className="min-w-0 flex flex-col items-center justify-center gap-1 sm:gap-0.5">
                <span className="text-[9px] uppercase text-[#889c9b] whitespace-nowrap">
                  Temp HP
                </span>
                <div className="flex items-center justify-center gap-1.5 sm:gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateHp({ hp_temp: Math.max(0, hpTemp - 1) })
                    }
                    className="w-7 h-7 sm:w-6 sm:h-6 shrink-0 bg-[#361a12] hover:bg-amber-900/50 text-amber-400 rounded border border-amber-500/40 flex items-center justify-center text-sm sm:text-xs font-bold cursor-pointer"
                    aria-label="Decrease Temp HP"
                  >
                    -
                  </button>
                  <span className="text-sm xl:text-base font-bold text-amber-300 min-w-[1.5rem] whitespace-nowrap text-center px-0.5">
                    {hpTemp}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateHp({ hp_temp: hpTemp + 1 })}
                    className="w-7 h-7 sm:w-6 sm:h-6 shrink-0 bg-[#361a12] hover:bg-amber-900/50 text-amber-400 rounded border border-amber-500/40 flex items-center justify-center text-sm sm:text-xs font-bold cursor-pointer"
                    aria-label="Increase Temp HP"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Strip: Hit Dice Remaining / Total & Die Face */}
            <div className="pt-2 sm:pt-1.5 border-t border-red-500/30 flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-[#889c9b] font-bold whitespace-nowrap">
                  Hit Dice
                </span>
                <span className="px-1.5 py-0.5 bg-[#361a12] border border-amber-500/30 rounded text-[10px] font-bold text-amber-300 whitespace-nowrap">
                  d{hitDieSize}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateHp({
                      hit_dice_used: Math.min(totalHitDice, hitDiceUsed + 1),
                    })
                  }
                  disabled={hitDiceRemaining <= 0}
                  className="w-6 h-6 sm:w-5 sm:h-5 shrink-0 bg-[#361a12] hover:bg-red-900/50 disabled:opacity-40 text-red-400 rounded border border-red-500/40 flex items-center justify-center text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Spend Hit Die"
                  title="Spend 1 Hit Die"
                >
                  -
                </button>
                <span className="text-xs font-bold text-[#f0e6d2] whitespace-nowrap px-0.5">
                  {hitDiceRemaining}/{totalHitDice}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateHp({
                      hit_dice_used: Math.max(0, hitDiceUsed - 1),
                    })
                  }
                  disabled={hitDiceUsed <= 0}
                  className="w-6 h-6 sm:w-5 sm:h-5 shrink-0 bg-[#361a12] hover:bg-green-900/50 disabled:opacity-40 text-green-400 rounded border border-green-500/40 flex items-center justify-center text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Recover Hit Die"
                  title="Recover 1 Hit Die"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ARMOR CLASS BOX */}
        <div className="sm:col-span-1 lg:col-span-2 min-w-0 flex flex-col items-center relative pt-3">
          <span className="absolute top-0 text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-[#361a12] px-1.5 rounded border border-amber-500/30 z-10">
            Armor Class
          </span>
          <div className="w-full h-full p-2.5 bg-[#4a261c] border-2 border-amber-600/50 rounded-lg text-center flex flex-col justify-center shadow-md">
            <span className="text-xl font-bold text-[#f0e6d2]">
              {armorClass}
            </span>
            <span className="text-[9px] text-amber-400 block uppercase">
              AC Equipped
            </span>
          </div>
        </div>

        {/* 3. INITIATIVE BOX */}
        <div className="sm:col-span-1 lg:col-span-1 min-w-0 flex flex-col items-center relative pt-3">
          <span className="absolute top-0 text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-[#361a12] px-1.5 rounded border border-amber-500/30 z-10">
            Initiative
          </span>
          <div className="w-full h-full p-2.5 bg-[#4a261c] border-2 border-amber-600/50 rounded-lg text-center flex flex-col justify-center shadow-md">
            <span className="text-xl font-bold text-amber-300">
              {initiativeBonus}
            </span>
            <span className="text-[9px] text-[#889c9b] block uppercase">
              DEX
            </span>
          </div>
        </div>

        {/* 4. PASSIVE SENSES BOX */}
        <div className="sm:col-span-2 lg:col-span-5 min-w-0 flex flex-col items-center relative pt-3">
          <span className="absolute top-0 text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-[#361a12] px-1.5 rounded border border-amber-500/30 z-10">
            Passive Senses
          </span>
          <div className="w-full h-full p-2.5 bg-[#4a261c] border-2 border-amber-600/50 rounded-lg flex items-center justify-around gap-1 text-center text-xs shadow-md">
            <div className="min-w-0">
              <span className="text-[9px] uppercase text-[#889c9b] block truncate">
                Perception
              </span>
              <span className="text-base font-bold text-[#f0e6d2]">
                {passivePerception}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-amber-500/30 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] uppercase text-[#889c9b] block truncate">
                Investigation
              </span>
              <span className="text-base font-bold text-[#f0e6d2]">
                {passiveInvestigation}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-amber-500/30 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] uppercase text-[#889c9b] block truncate">
                Insight
              </span>
              <span className="text-base font-bold text-[#f0e6d2]">
                {passiveInsight}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
