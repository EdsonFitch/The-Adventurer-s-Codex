/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepAbilityScores
 * -----------------------------------------------------------------------------
 * Description:
 * Manages Step 3 of the character creation wizard:
 * - Allocates character ability scores using Standard Array, Point Buy, or 4d6 Roller.
 * - Displays live calculation of ability modifiers.
 * - Integrates computed results from `statCalculator.js` to render active JSONB effect
 *   breakdown badges and mathematically accurate equation displays (`Base + Bonuses = Total`).
 * -----------------------------------------------------------------------------
 */

import React, { useState } from "react";

/**
 * Standard D&D 5e Ability Scores configuration metadata mapping long and short keys.
 */
const ABILITY_KEYS = [
  { key: "strength", abbrKey: "str", label: "Strength", abbr: "STR" },
  { key: "dexterity", abbrKey: "dex", label: "Dexterity", abbr: "DEX" },
  { key: "constitution", abbrKey: "con", label: "Constitution", abbr: "CON" },
  { key: "intelligence", abbrKey: "int", label: "Intelligence", abbr: "INT" },
  { key: "wisdom", abbrKey: "wis", label: "Wisdom", abbr: "WIS" },
  { key: "charisma", abbrKey: "cha", label: "Charisma", abbr: "CHA" },
];

// Pre-defined Standard Array values for D&D 5e
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

/**
 * Calculates the D&D ability modifier from a raw score.
 * Formula: Math.floor((score - 10) / 2)
 *
 * @param {number} score - Raw ability score value.
 * @returns {string} Formatted modifier string with explicit sign (e.g., "+3", "-1").
 */
export function calculateModifier(score) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * StepAbilityScores Component definition.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.characterData - Master character payload state.
 * @param {Function} props.updateCharacterData - Callback function to update master state.
 * @param {Object} props.computedStats - Computed stats package returned by statCalculator.js.
 */
export default function StepAbilityScores({
  characterData,
  updateCharacterData,
  computedStats,
}) {
  // Generation mode state: 'standard', 'pointBuy', or 'roll'
  const [method, setMethod] = useState("standard");

  // 4d6 Roller state: stores objects containing the final sum + the 4 raw dice rolls
  const [rolledScores, setRolledScores] = useState([]);
  const [isRolling, setIsRolling] = useState(false);

  // Normalize raw scores object keys from master state with robust fallbacks
  const rawScores = characterData.abilityScores || {};
  const scores = {
    strength: rawScores.strength ?? rawScores.str ?? 15,
    dexterity: rawScores.dexterity ?? rawScores.dex ?? 14,
    constitution: rawScores.constitution ?? rawScores.con ?? 13,
    intelligence: rawScores.intelligence ?? rawScores.int ?? 12,
    wisdom: rawScores.wisdom ?? rawScores.wis ?? 10,
    charisma: rawScores.charisma ?? rawScores.cha ?? 8,
  };

  /**
   * Safely updates an individual ability score value in master state.
   * @param {string} abilityKey - Key of the ability score (e.g., 'strength').
   * @param {string|number} value - New numeric value.
   */
  const handleScoreChange = (abilityKey, value) => {
    const numValue = parseInt(value, 10) || 8;

    // Map long component keys to unified short state keys
    const shortKeyMap = {
      strength: "str",
      dexterity: "dex",
      constitution: "con",
      intelligence: "int",
      wisdom: "wis",
      charisma: "cha",
    };

    const targetKey = shortKeyMap[abilityKey] || abilityKey;

    const currentBase = {
      str: rawScores.str ?? rawScores.strength ?? 15,
      dex: rawScores.dex ?? rawScores.dexterity ?? 14,
      con: rawScores.con ?? rawScores.constitution ?? 13,
      int: rawScores.int ?? rawScores.intelligence ?? 12,
      wis: rawScores.wis ?? rawScores.wisdom ?? 10,
      cha: rawScores.cha ?? rawScores.charisma ?? 8,
    };

    const updated = { ...currentBase, [targetKey]: numValue };
    updateCharacterData({ abilityScores: updated });
  };

  /**
   * Simulates rolling 4d6 drop lowest for all 6 ability score slots.
   */
  const handleRoll4d6 = () => {
    setIsRolling(true);
    setTimeout(() => {
      const generatedScores = [];

      for (let i = 0; i < 6; i++) {
        const rolls = Array.from(
          { length: 4 },
          () => Math.floor(Math.random() * 6) + 1,
        );

        rolls.sort((a, b) => a - b);
        const dropped = rolls[0];
        const kept = rolls.slice(1);
        const sum = kept.reduce((acc, curr) => acc + curr, 0);

        generatedScores.push({
          total: sum,
          rolls: rolls,
          dropped: dropped,
        });
      }

      setRolledScores(generatedScores);
      setIsRolling(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Method Switcher Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#a59075]/20 pb-4">
        <div>
          <h3 className="text-base font-medieval font-bold text-[#f0e6d2]">
            Step 3: Ability Scores & Lineage Modifiers
          </h3>
          <p className="text-xs text-[#889c9b]">
            Allocate foundational attributes and view active racial and feat
            bonuses.
          </p>
        </div>

        {/* Method Switcher Button Group */}
        <div className="flex bg-[#4a261c] border border-[#a59075]/40 rounded-lg p-1 space-x-1">
          <button
            type="button"
            onClick={() => setMethod("standard")}
            className={`px-3 py-1 rounded text-xs transition ${
              method === "standard"
                ? "bg-[#937460] text-white font-bold"
                : "text-[#889c9b] hover:text-[#f0e6d2]"
            }`}
          >
            Standard Array
          </button>
          <button
            type="button"
            onClick={() => setMethod("pointBuy")}
            className={`px-3 py-1 rounded text-xs transition ${
              method === "pointBuy"
                ? "bg-[#937460] text-white font-bold"
                : "text-[#889c9b] hover:text-[#f0e6d2]"
            }`}
          >
            Point Buy
          </button>
          <button
            type="button"
            onClick={() => setMethod("roll")}
            className={`px-3 py-1 rounded text-xs transition ${
              method === "roll"
                ? "bg-[#937460] text-white font-bold"
                : "text-[#889c9b] hover:text-[#f0e6d2]"
            }`}
          >
            4d6 Roller
          </button>
        </div>
      </div>

      {/* 4d6 Roller Engine Sub-Panel */}
      {method === "roll" && (
        <div className="p-4 bg-[#4a261c]/50 border border-amber-500/30 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-amber-300 uppercase">
              4d6 Drop Lowest Engine (6 Stat Generation)
            </h4>
            <p className="text-[10px] text-[#889c9b]">
              Rolls 4d6 and drops the lowest die for each of your 6 core
              attributes.
            </p>
          </div>
          <button
            type="button"
            disabled={isRolling}
            onClick={handleRoll4d6}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded text-xs text-white font-bold transition shadow whitespace-nowrap"
          >
            {isRolling ? "Rolling Dice..." : "🎲 Roll 6 Stats"}
          </button>
        </div>
      )}

      {/* Visual Breakdown of Rolled Dice Pools */}
      {rolledScores.length > 0 && method === "roll" && (
        <div className="p-3 bg-[#361a12] border border-[#a59075]/30 rounded-lg space-y-2">
          <span className="text-xs text-[#889c9b] font-bold uppercase tracking-wider">
            Generated Stat Pool:
          </span>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {rolledScores.map((item, idx) => (
              <div
                key={idx}
                className="p-2 bg-[#4a261c] border border-amber-500/50 rounded text-center shadow"
              >
                <div className="text-base font-bold text-amber-300">
                  {item.total}
                </div>
                <div className="text-[9px] text-[#889c9b] mt-1">
                  Rolls: [{item.rolls.join(", ")}]
                </div>
                <div className="text-[8px] text-red-300">
                  Dropped: {item.dropped}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ability Scores Grid Inputs & Calculation Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ABILITY_KEYS.map(({ key, abbrKey, label, abbr }) => {
          const baseScore = scores[key] || 10;

          // Pull computed breakdown package from statCalculator results
          const breakdown = computedStats?.abilityBreakdowns?.[abbrKey] || {
            base: baseScore,
            bonuses: [],
          };
          const finalScore =
            computedStats?.abilityScores?.[abbrKey] ?? baseScore;
          const modifierStr = calculateModifier(finalScore);
          const totalBonusSum = breakdown.bonuses.reduce(
            (acc, b) => acc + b.value,
            0,
          );

          return (
            <div
              key={key}
              className="p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl space-y-3 shadow-inner"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
                  {label} ({abbr})
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#361a12] text-amber-400 font-bold border border-[#a59075]/30">
                  Total: {finalScore} ({modifierStr})
                </span>
              </div>

              {/* Base Score Input Control */}
              <div className="flex items-center space-x-3">
                {method === "standard" ? (
                  <select
                    value={baseScore}
                    onChange={(e) => handleScoreChange(key, e.target.value)}
                    className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm text-[#f0e6d2] focus:outline-none"
                  >
                    {STANDARD_ARRAY.map((val) => (
                      <option key={val} value={val}>
                        Base: {val}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min={3}
                    max={20}
                    value={baseScore}
                    onChange={(e) => handleScoreChange(key, e.target.value)}
                    className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm text-[#f0e6d2] focus:outline-none"
                  />
                )}
              </div>

              {/* Active Bonus Breakdown Badges & Equation Display */}
              <div className="pt-2 border-t border-[#a59075]/20 space-y-1">
                <div className="text-[10px] text-[#889c9b] flex flex-wrap gap-1 items-center">
                  <span>Base: {breakdown.base}</span>
                  {breakdown.bonuses.map((b, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 bg-[#361a12] border border-amber-500/30 rounded text-[9px] text-amber-300"
                    >
                      +{b.value} {b.source}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-[#f0e6d2] font-semibold tracking-wide">
                  {breakdown.base} {abbr}
                  {totalBonusSum > 0 &&
                    ` + ${totalBonusSum} (Lineage/Feats)`} ={" "}
                  <strong className="text-amber-300">
                    {finalScore} ({modifierStr})
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
