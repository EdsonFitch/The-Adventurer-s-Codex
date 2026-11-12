/**
 * -----------------------------------------------------------------------------
 * COMPONENT: UpperStatsRibbon.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Upper horizontal ribbon for the Character Sheet view.
 * Displays Ability Score Squares, Proficiency Bonus, Inspiration, and Vitals,
 * Armor Class, Initiative, and Passive Senses.
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

  // Combat vitals & Senses calculations
  const dexModNum = Math.floor(((stats.dex || 10) - 10) / 2);
  const initiativeBonus = dexModNum >= 0 ? `+${dexModNum}` : `${dexModNum}`;
  const armorClass = character.armor_class_override || 10 + dexModNum;

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
        {/* Health / Vitals Box */}
        <div className="lg:col-span-3 flex flex-col items-center relative pt-3">
          <span className="absolute top-0 text-[10px] font-bold uppercase text-red-400 tracking-wider bg-[#361a12] px-1.5 rounded border border-red-500/30">
            Vitals / Health
          </span>
          <div className="w-full h-full p-2.5 bg-[#4a261c] border-2 border-red-600/50 rounded-lg flex items-center justify-between gap-2 shadow-md">
            <div className="flex flex-col items-center flex-1">
              <span className="text-[9px] uppercase text-[#889c9b]">
                Current / Max
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateHp({ hp_current: Math.max(0, hpCurrent - 1) })
                  }
                  className="w-5 h-5 bg-[#361a12] hover:bg-red-900/50 text-red-400 rounded border border-red-500/40 flex items-center justify-center text-xs font-bold"
                >
                  -
                </button>
                <span className="text-base font-bold text-red-400 min-w-[2.5rem] text-center">
                  {hpCurrent}/{hpMax}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateHp({ hp_current: Math.min(hpMax, hpCurrent + 1) })
                  }
                  className="w-5 h-5 bg-[#361a12] hover:bg-green-900/50 text-green-400 rounded border border-green-500/40 flex items-center justify-center text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>
            <div className="w-[1px] h-8 bg-red-500/30"></div>
            <div className="flex flex-col items-center flex-1">
              <span className="text-[9px] uppercase text-[#889c9b]">
                Temp HP
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateHp({ hp_temp: Math.max(0, hpTemp - 1) })
                  }
                  className="w-5 h-5 bg-[#361a12] hover:bg-amber-900/50 text-amber-400 rounded border border-amber-500/40 flex items-center justify-center text-xs font-bold"
                >
                  -
                </button>
                <span className="text-base font-bold text-amber-300 min-w-[2rem] text-center">
                  {hpTemp}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateHp({ hp_temp: hpTemp + 1 })}
                  className="w-5 h-5 bg-[#361a12] hover:bg-amber-900/50 text-amber-400 rounded border border-amber-500/40 flex items-center justify-center text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Armor Class Box */}
        <div className="lg:col-span-2 flex flex-col items-center relative pt-3">
          <span className="absolute top-0 text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-[#361a12] px-1.5 rounded border border-amber-500/30">
            Armor Class
          </span>
          <div className="w-full h-full p-2.5 bg-[#4a261c] border-2 border-amber-600/50 rounded-lg text-center flex flex-col justify-center shadow-md">
            <span className="text-xl font-bold text-[#f0e6d2]">
              {armorClass}
            </span>
            <span className="text-[9px] text-amber-400 block uppercase">
              AC Shield
            </span>
          </div>
        </div>

        {/* Initiative Box */}
        <div className="lg:col-span-2 flex flex-col items-center relative pt-3">
          <span className="absolute top-0 text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-[#361a12] px-1.5 rounded border border-amber-500/30">
            Initiative
          </span>
          <div className="w-full h-full p-2.5 bg-[#4a261c] border-2 border-amber-600/50 rounded-lg text-center flex flex-col justify-center shadow-md">
            <span className="text-xl font-bold text-amber-300">
              {initiativeBonus}
            </span>
            <span className="text-[9px] text-[#889c9b] block uppercase">
              DEX Modifier
            </span>
          </div>
        </div>

        {/* Passive Senses Box */}
        <div className="lg:col-span-5 flex flex-col items-center relative pt-3">
          <span className="absolute top-0 text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-[#361a12] px-1.5 rounded border border-amber-500/30">
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
            <div className="w-[1px] h-6 bg-amber-500/30"></div>
            <div>
              <span className="text-[9px] uppercase text-[#889c9b] block">
                Investigation
              </span>
              <span className="text-base font-bold text-[#f0e6d2]">
                {passiveInvestigation}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-amber-500/30"></div>
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
