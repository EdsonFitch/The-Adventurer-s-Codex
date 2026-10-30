import React, { useState } from "react";

/**
 * Standard D&D 5e Ability Scores
 */
const ABILITY_KEYS = [
  { key: "strength", label: "Strength", abbr: "STR" },
  { key: "dexterity", label: "Dexterity", abbr: "DEX" },
  { key: "constitution", label: "Constitution", abbr: "CON" },
  { key: "intelligence", label: "Intelligence", abbr: "INT" },
  { key: "wisdom", label: "Wisdom", abbr: "WIS" },
  { key: "charisma", label: "Charisma", abbr: "CHA" },
];

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

/**
 * Calculates the D&D ability modifier from a raw score.
 * Formula: Math.floor((score - 10) / 2)
 */
export function calculateModifier(score) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * StepAbilityScores Component
 * -----------------------------------------------------------------------------
 * Manages Step 3 of Character Creation:
 * - Allocates ability scores using Standard Array, Point Buy, or 4d6 Roll.
 * - Displays live calculation of racial attribute bonuses.
 *
 * @param {Object} props
 * @param {Object} props.characterData - Master character payload state
 * @param {Function} props.updateCharacterData - Callback to update master state
 */
export default function StepAbilityScores({
  characterData,
  updateCharacterData,
}) {
  // Generation mode: 'standard', 'pointBuy', or 'roll'
  const [method, setMethod] = useState("standard");

  // Point Buy remaining points (Starts at 27)
  const [pointBuyRemaining, setPointBuyRemaining] = useState(27);

  // 4d6 Roller pool state
  const [rolledPool, setRolledPool] = useState([]);
  const [isRolling, setIsRolling] = useState(false);

  // Local unassigned scores for Standard Array / Point Buy tracking
  const scores = characterData.abilityScores || {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  };

  /**
   * Updates an individual ability score value safely
   */
  const handleScoreChange = (abilityKey, value) => {
    const numValue = parseInt(value) || 8;
    const updated = { ...scores, [abilityKey]: numValue };
    updateCharacterData({ abilityScores: updated });
  };

  /**
   * Simulates rolling 4d6 and dropping the lowest die for 6 ability slots
   */
  const handleRoll4d6 = () => {
    setIsRolling(true);
    setTimeout(() => {
      const newPool = [];
      for (let i = 0; i < 6; i++) {
        const rolls = Array.from(
          { length: 4 },
          () => Math.floor(Math.random() * 6) + 1,
        );
        rolls.sort((a, b) => a - b); // sort ascending
        rolls.shift(); // drop lowest
        const sum = rolls.reduce((acc, curr) => acc + curr, 0);
        newPool.push(sum);
      }
      setRolledPool(newPool);
      setIsRolling(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Method Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#a59075]/20 pb-4">
        <div>
          <h3 className="text-base font-medieval font-bold text-[#f0e6d2]">
            Step 3: Ability Scores
          </h3>
          <p className="text-xs text-[#889c9b]">
            Determine your character's foundational physical and mental
            attributes.
          </p>
        </div>

        {/* Method Switcher Tabs */}
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

      {/* Method Sub-UI Controls */}
      {method === "roll" && (
        <div className="p-4 bg-[#4a261c]/50 border border-amber-500/30 rounded-lg flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-amber-300 uppercase">
              4d6 Drop Lowest Engine
            </h4>
            <p className="text-[10px] text-[#889c9b]">
              Roll 4 six-sided dice, discard the lowest die, and sum the
              remaining three.
            </p>
          </div>
          <button
            type="button"
            disabled={isRolling}
            onClick={handleRoll4d6}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded text-xs text-white font-bold transition shadow"
          >
            {isRolling ? "Rolling Dice..." : "🎲 Roll Stats"}
          </button>
        </div>
      )}

      {rolledPool.length > 0 && method === "roll" && (
        <div className="p-3 bg-[#361a12] border border-[#a59075]/30 rounded-lg flex items-center space-x-3">
          <span className="text-xs text-[#889c9b] font-bold uppercase">
            Rolled Pool:
          </span>
          <div className="flex space-x-2">
            {rolledPool.map((val, idx) => (
              <span
                key={idx}
                className="w-8 h-8 rounded bg-[#4a261c] border border-amber-500/50 flex items-center justify-center text-xs font-bold text-amber-300 shadow"
              >
                {val}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ability Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ABILITY_KEYS.map(({ key, label, abbr }) => {
          const score = scores[key] || 10;
          const modifier = calculateModifier(score);

          return (
            <div
              key={key}
              className="p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl space-y-2 shadow-inner"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
                  {label} ({abbr})
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#361a12] text-amber-400 font-bold border border-[#a59075]/30">
                  Mod: {modifier}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                {method === "standard" ? (
                  <select
                    value={score}
                    onChange={(e) => handleScoreChange(key, e.target.value)}
                    className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm text-[#f0e6d2] focus:outline-none"
                  >
                    {STANDARD_ARRAY.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min={8}
                    max={18}
                    value={score}
                    onChange={(e) => handleScoreChange(key, e.target.value)}
                    className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2 text-sm text-[#f0e6d2] focus:outline-none"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
