/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepPersonality.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Manages Step 5 of the Character Creator Wizard.
 * - Extracts structured background JSONB fields (personality_traits, ideals,
 *   bonds, flaws, defining_events) from the background selected in Step 4.
 * - Displays interactive "Dice Roll" buttons (e.g. 🎲 Roll d6 / d8) that randomly
 *   pick options directly from the background's official tables.
 * - Allows full manual text input/editing for custom backstory creation.
 * - Synchronizes choices continuously back into the master `characterData` payload.
 * -----------------------------------------------------------------------------
 * @param {Object} props - Component props.
 * @param {Object} props.characterData - Master character payload state from wizard.
 * @param {Function} props.updateCharacterData - Function to update master state.
 * @param {Array} props.backgroundsList - List of pre-fetched Supabase background rows.
 */

import React, { useState } from "react";

export default function StepPersonality({
  characterData,
  updateCharacterData,
  backgroundsList = [],
}) {
  // ---------------------------------------------------------------------------
  // 1. BACKGROUND LOOKUP & RECOVERABLE SELECTION
  // ---------------------------------------------------------------------------
  // Locate the selected background object from reference list matching backgroundId
  const selectedBackground = Array.isArray(backgroundsList)
    ? backgroundsList.find((bg) => bg && bg.id === characterData.backgroundId)
    : null;

  // ---------------------------------------------------------------------------
  // 2. LOCAL FORM STATE
  // ---------------------------------------------------------------------------
  // Initialize local state with values already saved in characterData or fall back to empty strings
  const [personality, setPersonality] = useState({
    personalityTraits: characterData.personalityTraits || "",
    ideals: characterData.ideals || "",
    bonds: characterData.bonds || "",
    flaws: characterData.flaws || "",
    definingEvents: characterData.definingEvents || "",
  });

  /**
   * Helper function to mutate local state and update master wizard state simultaneously.
   *
   * @param {string} fieldKey - Field property name in characterData state.
   * @param {string} value - New text content.
   */
  const handleFieldChange = (fieldKey, value) => {
    const updated = { ...personality, [fieldKey]: value };
    setPersonality(updated);
    updateCharacterData({ [fieldKey]: value });
  };

  // ---------------------------------------------------------------------------
  // 3. INTERACTIVE DICE ROLLER HELPER
  // ---------------------------------------------------------------------------
  /**
   * Randomly selects an entry from a background's table and writes it to state.
   * Handles both flat array tables and nested option structures.
   *
   * @param {string} fieldKey - Target state field ('personalityTraits', 'ideals', etc.)
   * @param {Array} tableData - Table options array from database row.
   */
  const handleRollRandom = (fieldKey, tableData) => {
    if (!tableData || !Array.isArray(tableData) || tableData.length === 0)
      return;

    // Check if table contains nested tables (e.g. defining_events: [{ title: '...', options: [...] }])
    let optionsList = tableData;
    if (tableData[0] && Array.isArray(tableData[0].options)) {
      optionsList = tableData[0].options;
    }

    if (optionsList.length === 0) return;

    // Roll random index across available options
    const randomIndex = Math.floor(Math.random() * optionsList.length);
    const chosenOption = optionsList[randomIndex];

    // Format output string cleanly: "(Roll X) Description text"
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

  // ---------------------------------------------------------------------------
  // 4. SAFE JSONB TABLE EXTRACTION
  // ---------------------------------------------------------------------------
  /**
   * Safely parses JSONB fields if stored as raw JSON strings or returns native arrays.
   */
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

  // Extract structured background tables
  const traitsTable = safelyExtractTable(
    selectedBackground?.personality_traits,
  );
  const idealsTable = safelyExtractTable(selectedBackground?.ideals);
  const bondsTable = safelyExtractTable(selectedBackground?.bonds);
  const flawsTable = safelyExtractTable(selectedBackground?.flaws);
  const definingEventsTable = safelyExtractTable(
    selectedBackground?.defining_events,
  );

  // ---------------------------------------------------------------------------
  // 5. RENDER UI STRUCTURE
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-fadeIn">
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
        <div className="p-3 bg-[#4a261c]/40 border border-[#a59075]/30 rounded-lg text-xs text-[#889c9b] flex justify-between items-center">
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

      {/* =================================================================== */}
      {/* 1. PERSONALITY TRAITS SECTION                                       */}
      {/* =================================================================== */}
      <div className="space-y-2 p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl shadow-inner">
        <div className="flex justify-between items-center">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            1. Personality Traits
          </label>
          {traitsTable.length > 0 && (
            <button
              type="button"
              onClick={() => handleRollRandom("personalityTraits", traitsTable)}
              className="px-2.5 py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-200 rounded text-[10px] font-bold border border-amber-500/40 transition shadow"
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
          className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2.5 text-xs text-[#f0e6d2] focus:border-amber-500 outline-none transition"
        />
      </div>

      {/* =================================================================== */}
      {/* 2. IDEALS SECTION                                                   */}
      {/* =================================================================== */}
      <div className="space-y-2 p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl shadow-inner">
        <div className="flex justify-between items-center">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            2. Ideals
          </label>
          {idealsTable.length > 0 && (
            <button
              type="button"
              onClick={() => handleRollRandom("ideals", idealsTable)}
              className="px-2.5 py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-200 rounded text-[10px] font-bold border border-amber-500/40 transition shadow"
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
          className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2.5 text-xs text-[#f0e6d2] focus:border-amber-500 outline-none transition"
        />
      </div>

      {/* =================================================================== */}
      {/* 3. BONDS SECTION                                                    */}
      {/* =================================================================== */}
      <div className="space-y-2 p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl shadow-inner">
        <div className="flex justify-between items-center">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            3. Bonds
          </label>
          {bondsTable.length > 0 && (
            <button
              type="button"
              onClick={() => handleRollRandom("bonds", bondsTable)}
              className="px-2.5 py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-200 rounded text-[10px] font-bold border border-amber-500/40 transition shadow"
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
          className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2.5 text-xs text-[#f0e6d2] focus:border-amber-500 outline-none transition"
        />
      </div>

      {/* =================================================================== */}
      {/* 4. FLAWS SECTION                                                    */}
      {/* =================================================================== */}
      <div className="space-y-2 p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl shadow-inner">
        <div className="flex justify-between items-center">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            4. Flaws
          </label>
          {flawsTable.length > 0 && (
            <button
              type="button"
              onClick={() => handleRollRandom("flaws", flawsTable)}
              className="px-2.5 py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-200 rounded text-[10px] font-bold border border-amber-500/40 transition shadow"
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
          className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2.5 text-xs text-[#f0e6d2] focus:border-amber-500 outline-none transition"
        />
      </div>

      {/* =================================================================== */}
      {/* 5. DEFINING EVENTS SECTION                                          */}
      {/* =================================================================== */}
      <div className="space-y-2 p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl shadow-inner">
        <div className="flex justify-between items-center">
          <label className="text-xs uppercase tracking-widest font-bold text-[#f0e6d2]">
            5. Defining Events
          </label>
          {definingEventsTable.length > 0 && (
            <button
              type="button"
              onClick={() =>
                handleRollRandom("definingEvents", definingEventsTable)
              }
              className="px-2.5 py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-200 rounded text-[10px] font-bold border border-amber-500/40 transition shadow"
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
          className="w-full bg-[#361a12] border border-[#a59075]/40 rounded p-2.5 text-xs text-[#f0e6d2] focus:border-amber-500 outline-none transition"
        />
      </div>
    </div>
  );
}
