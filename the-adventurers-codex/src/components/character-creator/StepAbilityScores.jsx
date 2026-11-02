import React, { useState } from "react";

/**
 * Standard D&D 5e Ability Scores configuration metadata
 */
const ABILITY_KEYS = [
  { key: "strength", label: "Strength", abbr: "STR" },
  { key: "dexterity", label: "Dexterity", abbr: "DEX" },
  { key: "constitution", label: "Constitution", abbr: "CON" },
  { key: "intelligence", label: "Intelligence", abbr: "INT" },
  { key: "wisdom", label: "Wisdom", abbr: "WIS" },
  { key: "charisma", label: "Charisma", abbr: "CHA" },
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
 * StepAbilityScores Component
 * -----------------------------------------------------------------------------
 * Manages Step 3 of Character Creation:
 * - Allocates character ability scores using Standard Array, Point Buy, or 4d6 Roller.
 * - Displays live calculation of ability modifiers.
 * - Tracks individual dice breakdowns for the 4d6 drop-lowest generation method.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.characterData - Master character payload state.
 * @param {Function} props.updateCharacterData - Callback to update master state.
 */
export default function StepAbilityScores({
  characterData,
  updateCharacterData,
}) {
  // Generation mode state: 'standard', 'pointBuy', or 'roll'
  const [method, setMethod] = useState("standard");

  // 4d6 Roller state: stores objects containing the final sum + the 4 raw dice rolls
  const [rolledScores, setRolledScores] = useState([]);
  const [isRolling, setIsRolling] = useState(false);

  // Local scores fallback from master state
  const scores = characterData.abilityScores || {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  };

  /**
   * Safely updates an individual ability score value in master state.
   * @param {string} abilityKey - Key of the ability score (e.g., 'strength').
   * @param {string|number} value - New numeric value.
   */
  const handleScoreChange = (abilityKey, value) => {
    const numValue = parseInt(value) || 8;
    const updated = { ...scores, [abilityKey]: numValue };
    updateCharacterData({ abilityScores: updated });
  };

  /**
   * Simulates rolling 4d6 drop lowest for all 6 ability score slots.
   * Preserves the individual dice array so players can see how each score was calculated.
   */
  const handleRoll4d6 = () => {
    setIsRolling(true);
    setTimeout(() => {
      const generatedScores = [];

      // Loop 6 times to generate 6 independent ability scores
      for (let i = 0; i < 6; i++) {
        // Roll 4 standard 6-sided dice (values 1 through 6)
        const rolls = Array.from(
          { length: 4 },
          () => Math.floor(Math.random() * 6) + 1,
        );

        // Sort ascending to easily drop the lowest die
        rolls.sort((a, b) => a - b);
        const dropped = rolls[0]; // Lowest die
        const kept = rolls.slice(1); // Remaining 3 dice
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
            Step 3: Ability Scores
          </h3>
          <p className="text-xs text-[#889c9b]">
            Determine your character's foundational physical and mental
            attributes.
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
            Generated Stat Pool (Click or Assign to Stats Below):
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

      {/* Ability Scores Grid Inputs */}
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
                    min={3}
                    max={20}
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
