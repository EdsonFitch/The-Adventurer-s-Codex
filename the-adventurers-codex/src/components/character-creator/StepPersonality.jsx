/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepPersonality.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Manages Step 5 of the Character Creator Wizard:
 * - Extracts structured background JSONB tables (personality_traits, ideals,
 *   bonds, flaws, defining_events) from the selected background.
 * - Provides interactive `🎲 Roll` buttons to draw randomly from official
 *   background tables alongside manual text editing.
 *
 * Responsive & Touch Behavior:
 * - Card Header Rows: Uses `flex-wrap gap-2` so dice-roll buttons wrap cleanly
 *   on narrow 375px screens without squeezing section labels.
 * - Touch-Sized Dice Buttons: Increases tap padding (`px-3 py-1.5 sm:px-2.5 sm:py-1`)
 *   for reliable mobile taps.
 * - Mobile Textareas: Uses `text-sm sm:text-xs` so mobile browsers do not auto-zoom
 *   when tapping into personality fields.
 *
 * @param {Object} props - Component props.
 * -----------------------------------------------------------------------------
 */

import React, { useState } from "react";

export default function StepPersonality({
  characterData,
  updateCharacterData,
  backgroundsList = [],
}) {
  const selectedBackground = Array.isArray(backgroundsList)
    ? backgroundsList.find((bg) => bg && bg.id === characterData.backgroundId)
    : null;

  const [personality, setPersonality] = useState({
    personalityTraits: characterData.personalityTraits || "",
    ideals: characterData.ideals || "",
    bonds: characterData.bonds || "",
    flaws: characterData.flaws || "",
    definingEvents: characterData.definingEvents || "",
  });

  const handleFieldChange = (fieldKey, value) => {
    const updated = { ...personality, [fieldKey]: value };
    setPersonality(updated);
    updateCharacterData({ [fieldKey]: value });
  };

  const handleRollRandom = (fieldKey, tableData) => {
    if (!tableData || !Array.isArray(tableData) || tableData.length === 0)
      return;

    let optionsList = tableData;
    if (tableData[0] && Array.isArray(tableData[0].options)) {
      optionsList = tableData[0].options;
    }

    if (optionsList.length === 0) return;

    const randomIndex = Math.floor(Math.random() * optionsList.length);
    const chosenOption = optionsList[randomIndex];

    const rollNumber =
      chosenOption.roll ||
      chosenOption.d6 ||
      chosenOption.d8 ||
      randomIndex + 1;
    const descriptionText =
      chosenOption.description ||
      chosenOption.text ||
      chosenOption.name ||
      String(chosenOption);

    const formattedOutput = `(Roll ${rollNumber}) ${descriptionText}`;

    handleFieldChange(fieldKey, formattedOutput);
  };

  const safelyExtractTable = (fieldData) => {
    if (!fieldData) return [];
    if (Array.isArray(fieldData)) return fieldData;
    if (typeof fieldData === "string") {
      try {
        const parsed = JSON.parse(fieldData);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const traitsTable = safelyExtractTable(
    selectedBackground?.personality_traits,
  );
  const idealsTable = safelyExtractTable(selectedBackground?.ideals);
  const bondsTable = safelyExtractTable(selectedBackground?.bonds);
  const flawsTable = safelyExtractTable(selectedBackground?.flaws);
  const definingEventsTable = safelyExtractTable(
    selectedBackground?.defining_events,
  );

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      {/* Header Info Banner */}
      <div className="border-b border-[#a59075]/20 pb-4">
        <h3 className="text-base font-medieval font-bold text-[#f0e6d2]">
          Step 5: Personality & Defining Events
        </h3>
        <p className="text-xs text-[#889c9b]">
          Define your character's mannerisms, code of honor, attachments, vices,
          and pivotal life events.
        </p>
      </div>

      {/* Selected Background Source Indicator */}
      {!selectedBackground ? (
        <div className="p-3 bg-amber-900/30 border border-amber-500/40 rounded-lg text-xs text-amber-300">
          ⚠️ No Background selected in Step 4. You can type custom personality
          details below or go back to select one.
        </div>
      ) : (
        <div className="p-3 bg-[#4a261c]/40 border border-[#a59075]/30 rounded-lg text-xs text-[#889c9b] flex flex-wrap justify-between items-center gap-2">
          <span>
            Active Background Archives:{" "}
            <strong className="text-[#f0e6d2]">
              {selectedBackground.name}
            </strong>
          </span>
          <span className="text-[10px] text-amber-400 italic">
            🎲 Roll buttons draw directly from official background tables
          </span>
        </div>
      )}

      {/* 1. PERSONALITY TRAITS */}
      <div className="space-y-2 p-3.5 sm:p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl shadow-inner">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            1. Personality Traits
          </label>
          {traitsTable.length > 0 && (
            <button
              type="button"
              onClick={() => handleRollRandom("personalityTraits", traitsTable)}
              className="px-3 py-1.5 sm:px-2.5 sm:py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-200 rounded text-xs sm:text-[10px] font-bold border border-amber-500/40 transition shadow cursor-pointer"
            >
              🎲 Roll Random Trait
            </button>
          )}
        </div>
        <textarea
          rows={2}
          value={personality.personalityTraits}
          onChange={(e) =>
            handleFieldChange("personalityTraits", e.target.value)
          }
          placeholder="Describe quirks, mannerisms, or habits (e.g. 'I always use big words to sound smart')..."
          className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2.5 text-sm sm:text-xs text-[#f0e6d2] focus:border-amber-500 outline-none transition"
        />
      </div>

      {/* 2. IDEALS */}
      <div className="space-y-2 p-3.5 sm:p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl shadow-inner">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            2. Ideals
          </label>
          {idealsTable.length > 0 && (
            <button
              type="button"
              onClick={() => handleRollRandom("ideals", idealsTable)}
              className="px-3 py-1.5 sm:px-2.5 sm:py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-200 rounded text-xs sm:text-[10px] font-bold border border-amber-500/40 transition shadow cursor-pointer"
            >
              🎲 Roll Random Ideal
            </button>
          )}
        </div>
        <textarea
          rows={2}
          value={personality.ideals}
          onChange={(e) => handleFieldChange("ideals", e.target.value)}
          placeholder="What core moral principle drives you? (e.g. Respect, Freedom, Greater Good)..."
          className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2.5 text-sm sm:text-xs text-[#f0e6d2] focus:border-amber-500 outline-none transition"
        />
      </div>

      {/* 3. BONDS */}
      <div className="space-y-2 p-3.5 sm:p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl shadow-inner">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            3. Bonds
          </label>
          {bondsTable.length > 0 && (
            <button
              type="button"
              onClick={() => handleRollRandom("bonds", bondsTable)}
              className="px-3 py-1.5 sm:px-2.5 sm:py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-200 rounded text-xs sm:text-[10px] font-bold border border-amber-500/40 transition shadow cursor-pointer"
            >
              🎲 Roll Random Bond
            </button>
          )}
        </div>
        <textarea
          rows={2}
          value={personality.bonds}
          onChange={(e) => handleFieldChange("bonds", e.target.value)}
          placeholder="What person, place, or artifact holds your deepest loyalty?..."
          className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2.5 text-sm sm:text-xs text-[#f0e6d2] focus:border-amber-500 outline-none transition"
        />
      </div>

      {/* 4. FLAWS */}
      <div className="space-y-2 p-3.5 sm:p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl shadow-inner">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            4. Flaws
          </label>
          {flawsTable.length > 0 && (
            <button
              type="button"
              onClick={() => handleRollRandom("flaws", flawsTable)}
              className="px-3 py-1.5 sm:px-2.5 sm:py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-200 rounded text-xs sm:text-[10px] font-bold border border-amber-500/40 transition shadow cursor-pointer"
            >
              🎲 Roll Random Flaw
            </button>
          )}
        </div>
        <textarea
          rows={2}
          value={personality.flaws}
          onChange={(e) => handleFieldChange("flaws", e.target.value)}
          placeholder="What fatal weakness or addiction threatens your downfall?..."
          className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2.5 text-sm sm:text-xs text-[#f0e6d2] focus:border-amber-500 outline-none transition"
        />
      </div>

      {/* 5. DEFINING EVENTS */}
      <div className="space-y-2 p-3.5 sm:p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl shadow-inner">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            5. Defining Events
          </label>
          {definingEventsTable.length > 0 && (
            <button
              type="button"
              onClick={() =>
                handleRollRandom("definingEvents", definingEventsTable)
              }
              className="px-3 py-1.5 sm:px-2.5 sm:py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-200 rounded text-xs sm:text-[10px] font-bold border border-amber-500/40 transition shadow cursor-pointer"
            >
              🎲 Roll Defining Event
            </button>
          )}
        </div>
        <textarea
          rows={2}
          value={personality.definingEvents}
          onChange={(e) => handleFieldChange("definingEvents", e.target.value)}
          placeholder="What specific historic event or turning point pushed you onto the path of adventure?..."
          className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2.5 text-sm sm:text-xs text-[#f0e6d2] focus:border-amber-500 outline-none transition"
        />
      </div>
    </div>
  );
}
