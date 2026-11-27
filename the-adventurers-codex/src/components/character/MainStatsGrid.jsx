/**
 * -----------------------------------------------------------------------------
 * COMPONENT: MainStatsGrid.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Right-hand workspace header grid for the Character Sheet view.
 * Houses two responsive two-column rows:
 * 1. Saving Throws & Proficiencies / Languages
 * 2. Active Conditions & Damage Resistances / Immunities
 *
 * Responsive & Touch Behavior:
 * - Mobile (`< 640px` / below `sm`): Stacks each card full-width (`grid-cols-1`)
 *   so Saving Throws, Proficiencies, Conditions, and Resistances each have
 *   generous horizontal breathing room.
 * - Tablet & Desktop (`>= 640px` / `sm+`): Arranges each pair side-by-side
 *   (`sm:grid-cols-2`).
 * - Touchscreen Targets: Enlarges `+ Add` buttons (`px-2.5 py-1`) and chip
 *   dismiss buttons (`×`) so touch users can add or remove conditions and
 *   resistances accurately without accidental taps.
 * - Overflow Protection: Applies `min-w-0` to every grid card and `break-words`
 *   to condition/resistance badges so custom long strings wrap cleanly.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.character - Computed character sheet record.
 * @param {Function} props.onUpdateConditions - Persists updated `active_conditions` array.
 * @param {Function} props.onUpdateResistances - Persists updated `resistances` array.
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

  // Safely extract base ability scores with D&D 5e default 10s
  const stats = character.stats ||
    character.computed?.abilityScores || {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    };

  // Normalize active conditions and resistances into safe arrays
  const conditions = Array.isArray(character.active_conditions)
    ? character.active_conditions
    : [];
  const resistances = Array.isArray(character.resistances)
    ? character.resistances
    : [];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* =====================================================================
        ROW 1: SAVING THROWS & PROFICIENCIES / LANGUAGES
        - 1 column on phones (`grid-cols-1`), 2 columns on tablets/desktops (`sm:grid-cols-2`).
        ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. SAVING THROWS CARD */}
        <div className="min-w-0 p-3 bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-md space-y-2">
          <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-widest border-b border-amber-500/30 pb-1">
            🛡️ Saving Throws
          </h3>

          {/* 2x3 Compact Saving Throw Grid */}
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
                  className="flex items-center justify-between px-2 py-1.5 sm:py-1 bg-[#361a12] rounded border border-amber-500/20 min-w-0"
                >
                  <span className="text-[#f0e6d2] font-bold">{label}</span>
                  <span className="text-amber-400 font-bold">{mod}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. PROFICIENCIES & LANGUAGES CARD */}
        <div className="min-w-0 p-3 bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-md space-y-2">
          <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-widest border-b border-amber-500/30 pb-1">
            📜 Proficiencies
          </h3>

          <div className="space-y-2 text-xs">
            {/* Known Languages Tag List */}
            <div>
              <strong className="text-[#889c9b] text-[9px] uppercase block">
                Languages:
              </strong>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Array.isArray(character.languages) &&
                character.languages.length > 0 ? (
                  character.languages.map((lang, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-[#361a12] border border-amber-500/30 rounded text-[11px] sm:text-[10px] text-amber-300 break-words"
                    >
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="italic text-[11px] sm:text-[10px] text-[#889c9b]">
                    Common
                  </span>
                )}
              </div>
            </div>

            {/* Armor & Weapon Proficiencies */}
            <div>
              <strong className="text-[#889c9b] text-[9px] uppercase block">
                Armor & Weapons:
              </strong>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="px-2 py-0.5 bg-[#361a12] border border-amber-500/30 rounded text-[11px] sm:text-[10px] text-[#f0e6d2]">
                  Standard Class
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
        ROW 2: ACTIVE CONDITIONS & RESISTANCES
        - Touch-friendly `+ Add` buttons (`px-2.5 py-1`) and chip dismiss targets.
        ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 3. ACTIVE CONDITIONS CARD */}
        <div className="min-w-0 p-3 bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-md space-y-2">
          <div className="flex justify-between items-center gap-2 border-b border-amber-500/30 pb-1.5">
            <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">
              ⚠️ Conditions
            </h3>
            <button
              type="button"
              onClick={() => {
                const conditionName = prompt(
                  "Enter new condition (e.g., Poisoned, Prone):",
                );
                if (conditionName && conditionName.trim()) {
                  onUpdateConditions([...conditions, conditionName.trim()]);
                }
              }}
              className="px-2.5 py-1 sm:py-0.5 bg-[#361a12] hover:bg-amber-700/50 border border-amber-500/40 rounded text-[10px] text-amber-300 font-bold transition cursor-pointer shrink-0"
            >
              + Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {conditions.length > 0 ? (
              conditions.map((cond, i) => (
                <span
                  key={i}
                  className="px-2 py-1 sm:py-0.5 bg-[#361a12] border border-red-500/40 rounded text-xs sm:text-[11px] text-red-300 flex items-center gap-1.5 max-w-full"
                >
                  <span className="break-words">{cond}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${cond}`}
                    onClick={() =>
                      onUpdateConditions(
                        conditions.filter((_, idx) => idx !== i),
                      )
                    }
                    className="px-1 text-red-400 hover:text-white font-bold cursor-pointer shrink-0"
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

        {/* 4. RESISTANCES & IMMUNITIES CARD */}
        <div className="min-w-0 p-3 bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-md space-y-2">
          <div className="flex justify-between items-center gap-2 border-b border-amber-500/30 pb-1.5">
            <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">
              🛡️ Resistances
            </h3>
            <button
              type="button"
              onClick={() => {
                const resName = prompt(
                  "Enter resistance or immunity (e.g., Fire, Poison):",
                );
                if (resName && resName.trim()) {
                  onUpdateResistances([...resistances, resName.trim()]);
                }
              }}
              className="px-2.5 py-1 sm:py-0.5 bg-[#361a12] hover:bg-amber-700/50 border border-amber-500/40 rounded text-[10px] text-amber-300 font-bold transition cursor-pointer shrink-0"
            >
              + Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {resistances.length > 0 ? (
              resistances.map((res, i) => (
                <span
                  key={i}
                  className="px-2 py-1 sm:py-0.5 bg-[#361a12] border border-amber-500/40 rounded text-xs sm:text-[11px] text-amber-300 flex items-center gap-1.5 max-w-full"
                >
                  <span className="break-words">{res}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${res}`}
                    onClick={() =>
                      onUpdateResistances(
                        resistances.filter((_, idx) => idx !== i),
                      )
                    }
                    className="px-1 text-amber-400 hover:text-white font-bold cursor-pointer shrink-0"
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
