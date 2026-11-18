/**
 * -----------------------------------------------------------------------------
 * COMPONENT: MainStatsGrid.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Right-hand column container for the Character Sheet view.
 * Houses:
 * 1. Saving Throws & Proficiencies & Languages strip
 * 2. Active Conditions & Resistances strip
 * -----------------------------------------------------------------------------
 */

import React from "react";
import { calculateModifier } from "../../utils/statCalculator";

export default function MainStatsGrid({
  character,
  onUpdateConditions,
  onUpdateResistances,
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

  // Conditions & Resistances arrays
  const conditions = Array.isArray(character.active_conditions)
    ? character.active_conditions
    : [];
  const resistances = Array.isArray(character.resistances)
    ? character.resistances
    : [];

  return (
    <div className="space-y-4">
      {/* Saving Throws & Proficiencies Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Saving Throws Box */}
        <div className="p-3 bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-md space-y-2">
          <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-widest border-b border-amber-500/30 pb-1">
            🛡️ Saving Throws
          </h3>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { key: "str", label: "Str" },
              { key: "dex", label: "Dex" },
              { key: "con", label: "Con" },
              { key: "int", label: "Int" },
              { key: "wis", label: "Wis" },
              { key: "cha", label: "Cha" },
            ].map(({ key, label }) => {
              const mod = calculateModifier(stats[key] || 10);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-1 bg-[#361a12] rounded border border-amber-500/20"
                >
                  <span className="text-[#f0e6d2] font-bold">{label}</span>
                  <span className="text-amber-400 font-bold">{mod}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Proficiencies & Languages Box */}
        <div className="p-3 bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-md space-y-2">
          <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-widest border-b border-amber-500/30 pb-1">
            📜 Proficiencies
          </h3>
          <div className="space-y-1 text-xs">
            <div>
              <strong className="text-[#889c9b] text-[9px] uppercase block">
                Languages:
              </strong>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {Array.isArray(character.languages) &&
                character.languages.length > 0 ? (
                  character.languages.map((lang, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 bg-[#361a12] border border-amber-500/30 rounded text-[10px] text-amber-300"
                    >
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="italic text-[10px] text-[#889c9b]">
                    Common
                  </span>
                )}
              </div>
            </div>
            <div>
              <strong className="text-[#889c9b] text-[9px] uppercase block">
                Armor & Weapons:
              </strong>
              <div className="flex flex-wrap gap-1 mt-0.5">
                <span className="px-1.5 py-0.5 bg-[#361a12] border border-amber-500/30 rounded text-[10px] text-[#f0e6d2]">
                  Standard Class
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions & Resistances Side-by-Side Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Active Conditions Box */}
        <div className="p-3 bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-md space-y-2">
          <div className="flex justify-between items-center border-b border-amber-500/30 pb-1">
            <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">
              ⚠️ Conditions
            </h3>
            <button
              type="button"
              onClick={() => {
                const conditionName = prompt(
                  "Enter new condition (e.g., Poisoned, Prone):",
                );
                if (conditionName) {
                  onUpdateConditions([...conditions, conditionName]);
                }
              }}
              className="px-1.5 py-0.5 bg-[#361a12] hover:bg-amber-700/50 border border-amber-500/40 rounded text-[9px] text-amber-300 font-bold"
            >
              + Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {conditions.length > 0 ? (
              conditions.map((cond, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 bg-[#361a12] border border-red-500/40 rounded text-[11px] text-red-300 flex items-center space-x-1"
                >
                  <span>{cond}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConditions(
                        conditions.filter((_, idx) => idx !== i),
                      )
                    }
                    className="text-red-400 hover:text-white font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-[11px] text-[#889c9b] italic">None.</span>
            )}
          </div>
        </div>

        {/* Resistances Box */}
        <div className="p-3 bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-md space-y-2">
          <div className="flex justify-between items-center border-b border-amber-500/30 pb-1">
            <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">
              🛡️ Resistances
            </h3>
            <button
              type="button"
              onClick={() => {
                const resName = prompt(
                  "Enter resistance or immunity (e.g., Fire, Poison):",
                );
                if (resName) {
                  onUpdateResistances([...resistances, resName]);
                }
              }}
              className="px-1.5 py-0.5 bg-[#361a12] hover:bg-amber-700/50 border border-amber-500/40 rounded text-[9px] text-amber-300 font-bold"
            >
              + Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {resistances.length > 0 ? (
              resistances.map((res, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 bg-[#361a12] border border-amber-500/40 rounded text-[11px] text-amber-300 flex items-center space-x-1"
                >
                  <span>{res}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateResistances(
                        resistances.filter((_, idx) => idx !== i),
                      )
                    }
                    className="text-amber-400 hover:text-white font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-[11px] text-[#889c9b] italic">None.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
