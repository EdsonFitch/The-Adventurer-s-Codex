/**
 * -----------------------------------------------------------------------------
 * COMPONENT: UpperStatsRibbon.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Upper horizontal ribbon for the Character Sheet view.
 * Displays Ability Score Squares, Proficiency Bonus, Inspiration, and Vitals
 * (including Current/Max HP, Temp HP, and a compact Hit Dice strip), Armor Class
 * (reading dynamically from computed inventory stats), Initiative, and Passive
 * Senses.
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

  // Extract base stats and computed modifiers safely
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

  // Health values
  const hpCurrent = character.hp_current ?? character.hp_max ?? 10;
  const hpMax = character.hp_max ?? 10;
  const hpTemp = character.hp_temp ?? 0;

  // Hit Dice values derived from character level, primaryClass.hit_die, and characters.hit_dice_used
  const totalHitDice = Math.max(1, Number(character.level) || 1);
  const hitDieSize = Number(character.primaryClass?.hit_die) || 8;
  const hitDiceUsed = Math.min(
    totalHitDice,
    Math.max(0, Number(character.hit_dice_used) || 0),
  );
  const hitDiceRemaining = Math.max(0, totalHitDice - hitDiceUsed);

  // Combat vitals & Senses calculations
  const dexModNum = Math.floor(((stats.dex || 10) - 10) / 2);
  const initiativeBonus = dexModNum >= 0 ? `+${dexModNum}` : `${dexModNum}`;

  // Read dynamic Armor Class from computed inventory stats (or override/fallback)
  const armorClass =
    character.computed?.armorClass ||
    character.armor_class_override ||
    10 + dexModNum;

  /**
   * Computes a skill modifier including proficiency and expertise bonuses.
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
    <div className="space-y-3 my-4">
      {/* ROW 1: ABILITY SCORES, PROFICIENCY & INSPIRATION */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {abilityList.map(({ key, label }) => {
          const score = stats[key] || 10;
          const modifier = calculateModifier(score);

          return (
            <div key={key} className="flex flex-col items-center relative pt-3">
              <span className="absolute top-0 text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-[#361a12] px-1.5 rounded border border-amber-500/30">
                {label.substring(0, 3)}
              </span>
              <div className="w-full p-2 bg-[#4a261c] border-2 border-amber-600/50 rounded-lg text-center space-y-1 shadow-md">
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

        {/* Inspiration Square */}
        <div className="flex flex-col items-center relative pt-3">
          <span className="absolute top-0 text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-[#361a12] px-1.5 rounded border border-amber-500/30">
            Inspiration
          </span>
          <button
            type="button"
            onClick={() => onToggleInspiration(!inspirationActive)}
            className={`w-full h-full p-2 rounded-lg border-2 flex flex-col items-center justify-center transition shadow-md ${
              inspirationActive
                ? "bg-amber-600/40 border-amber-400 text-amber-300 shadow-amber-500/20"
                : "bg-[#4a261c] border-amber-600/50 text-[#889c9b] hover:text-[#f0e6d2]"
            }`}
            title="Click to toggle Heroic Inspiration"
          >
            <span className="text-lg">🎲</span>
            <span className="text-[10px] font-bold uppercase">
              {inspirationActive ? "Active" : "None"}
            </span>
          </button>
        </div>
      </div>

      {/* ROW 2: VITALS, ARMOR CLASS, INITIATIVE & PASSIVE SENSES SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Health / Vitals Box: Current/Max + Temp HP on top, compact Hit Dice strip below */}
        <div className="lg:col-span-4 min-w-0 flex flex-col items-center relative pt-3">
          <span className="absolute top-0 text-[10px] font-bold uppercase text-red-400 tracking-wider bg-[#361a12] px-1.5 rounded border border-red-500/30 z-10">
            Vitals / Health
          </span>
          <div className="w-full h-full min-w-0 px-2 py-2 bg-[#4a261c] border-2 border-red-600/50 rounded-lg flex flex-col justify-between gap-1.5 shadow-md overflow-hidden">
            {/* Top Row: Current / Max HP & Temp HP */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
              {/* Left Half: Current / Max HP */}
              <div className="min-w-0 flex flex-col items-center justify-center gap-0.5">
                <span className="text-[9px] uppercase text-[#889c9b] whitespace-nowrap">
                  Current / Max
                </span>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateHp({ hp_current: Math.max(0, hpCurrent - 1) })
                    }
                    className="w-5 h-5 shrink-0 bg-[#361a12] hover:bg-red-900/50 text-red-400 rounded border border-red-500/40 flex items-center justify-center text-xs font-bold"
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
                    className="w-5 h-5 shrink-0 bg-[#361a12] hover:bg-green-900/50 text-green-400 rounded border border-green-500/40 flex items-center justify-center text-xs font-bold"
                    aria-label="Increase Current HP"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Center Divider */}
              <div className="w-[1px] h-7 bg-red-500/30 shrink-0" />

              {/* Right Half: Temporary HP */}
              <div className="min-w-0 flex flex-col items-center justify-center gap-0.5">
                <span className="text-[9px] uppercase text-[#889c9b] whitespace-nowrap">
                  Temp HP
                </span>
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateHp({ hp_temp: Math.max(0, hpTemp - 1) })
                    }
                    className="w-5 h-5 shrink-0 bg-[#361a12] hover:bg-amber-900/50 text-amber-400 rounded border border-amber-500/40 flex items-center justify-center text-xs font-bold"
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
                    className="w-5 h-5 shrink-0 bg-[#361a12] hover:bg-amber-900/50 text-amber-400 rounded border border-amber-500/40 flex items-center justify-center text-xs font-bold"
                    aria-label="Increase Temp HP"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Compact Strip: Hit Dice (Remaining / Total & Die Face) */}
            <div className="pt-1.5 border-t border-red-500/30 flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-[#889c9b] font-bold whitespace-nowrap">
                  Hit Dice
                </span>
                <span className="px-1.5 py-0.2 bg-[#361a12] border border-amber-500/30 rounded text-[10px] font-bold text-amber-300 whitespace-nowrap">
                  d{hitDieSize}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateHp({
                      hit_dice_used: Math.min(totalHitDice, hitDiceUsed + 1),
                    })
                  }
                  disabled={hitDiceRemaining <= 0}
                  className="w-4 h-4 shrink-0 bg-[#361a12] hover:bg-red-900/50 disabled:opacity-40 text-red-400 rounded border border-red-500/40 flex items-center justify-center text-[11px] font-bold"
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
                  className="w-4 h-4 shrink-0 bg-[#361a12] hover:bg-green-900/50 disabled:opacity-40 text-green-400 rounded border border-green-500/40 flex items-center justify-center text-[11px] font-bold"
                  aria-label="Recover Hit Die"
                  title="Recover 1 Hit Die"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Armor Class Box */}
        <div className="lg:col-span-2 min-w-0 flex flex-col items-center relative pt-3">
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

        {/* Initiative Box */}
        <div className="lg:col-span-1 min-w-0 flex flex-col items-center relative pt-3">
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

        {/* Passive Senses Box */}
        <div className="lg:col-span-5 min-w-0 flex flex-col items-center relative pt-3">
          <span className="absolute top-0 text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-[#361a12] px-1.5 rounded border border-amber-500/30 z-10">
            Passive Senses
          </span>
          <div className="w-full h-full p-2.5 bg-[#4a261c] border-2 border-amber-600/50 rounded-lg flex items-center justify-around text-center text-xs shadow-md">
            <div>
              <span className="text-[9px] uppercase text-[#889c9b] block">
                Perception
              </span>
              <span className="text-base font-bold text-[#f0e6d2]">
                {passivePerception}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-amber-500/30" />
            <div>
              <span className="text-[9px] uppercase text-[#889c9b] block">
                Investigation
              </span>
              <span className="text-base font-bold text-[#f0e6d2]">
                {passiveInvestigation}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-amber-500/30" />
            <div>
              <span className="text-[9px] uppercase text-[#889c9b] block">
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
