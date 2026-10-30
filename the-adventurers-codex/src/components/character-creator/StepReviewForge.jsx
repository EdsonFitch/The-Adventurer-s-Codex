import React from "react";
import { calculateModifier } from "./StepAbilityScores";

/**
 * Alignment Code Display Map
 */
const ALIGNMENT_LABELS = {
  LG: "Lawful Good",
  NG: "Neutral Good",
  CG: "Chaotic Good",
  LN: "Lawful Neutral",
  TN: "True Neutral",
  CN: "Chaotic Neutral",
  LE: "Lawful Evil",
  NE: "Neutral Evil",
  CE: "Chaotic Evil",
};

/**
 * StepReviewForge Component
 * -----------------------------------------------------------------------------
 * Manages Step 5 of Character Creation:
 * - Renders a parchment-styled character summary sheet.
 * - Computes starting maximum HP (Hit Die + CON Mod).
 * - Executes the final Supabase relational commit via master wizard trigger.
 *
 * @param {Object} props
 * @param {Object} props.characterData - Master character payload state
 * @param {Array} props.racesList - Pre-fetched races list
 * @param {Array} props.subracesList - Pre-fetched subraces list
 * @param {Array} props.classesList - Pre-fetched classes list
 * @param {Array} props.subclassesList - Pre-fetched subclasses list
 * @param {Array} props.backgroundsList - Pre-fetched backgrounds list
 * @param {Function} props.onForge - Callback function to trigger Supabase database mutation
 * @param {boolean} props.isSubmitting - Loading state during DB insert
 */
export default function StepReviewForge({
  characterData,
  racesList = [],
  subracesList = [],
  classesList = [],
  subclassesList = [],
  backgroundsList = [],
  onForge,
  isSubmitting = false,
}) {
  // Resolve chosen database entity objects
  const selectedRace = racesList.find((r) => r.id === characterData.raceId);
  const selectedSubrace = subracesList.find(
    (s) => s.id === characterData.subraceId,
  );
  const selectedClass = classesList.find((c) => c.id === characterData.classId);
  const selectedSubclass = subclassesList.find(
    (sc) => sc.id === characterData.subclassId,
  );
  const selectedBg = backgroundsList.find(
    (b) => b.id === characterData.backgroundId,
  );

  // Compute Constitution Modifier & Starting Max HP
  const conScore = characterData.abilityScores?.constitution || 10;
  const conModNumeric = Math.floor((conScore - 10) / 2);
  const baseHitDie = selectedClass?.hit_die || 8;
  const calculatedMaxHP = Math.max(1, baseHitDie + conModNumeric);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h3 className="text-base font-medieval font-bold text-[#f0e6d2]">
          Step 5: Review & Forge
        </h3>
        <p className="text-xs text-[#889c9b]">
          Inspect your hero's record before binding them permanently into the
          database logs.
        </p>
      </div>

      {/* Main Parchment Summary Dossier */}
      <div className="p-6 bg-[#4a261c]/80 border-2 border-amber-600/40 rounded-xl space-y-6 shadow-2xl relative overflow-hidden">
        {/* Background Emblem Watermark */}
        <div className="absolute top-2 right-4 text-7xl opacity-5 pointer-events-none select-none">
          ⚔️
        </div>

        {/* Top Identity Grid */}
        <div className="flex flex-col md:flex-row items-center gap-6 border-b border-[#a59075]/30 pb-6">
          {/* Hero Portrait Preview */}
          <div className="w-24 h-24 rounded-lg border-2 border-amber-500/60 overflow-hidden bg-[#361a12] shrink-0 shadow-lg">
            {characterData.portraitUrl ? (
              <img
                src={characterData.portraitUrl}
                alt={characterData.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/150?text=Hero";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">
                🛡️
              </div>
            )}
          </div>

          {/* Hero Core Info */}
          <div className="space-y-1 text-center md:text-left flex-1">
            <h2 className="text-2xl font-medieval font-bold text-[#f0e6d2]">
              {characterData.name || "Unnamed Adventurer"}
            </h2>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              Level 1 {selectedRace?.name || "Unknown Race"}{" "}
              {selectedSubrace ? `(${selectedSubrace.name})` : ""}{" "}
              {selectedClass?.name || "Unknown Class"}
            </p>
            <p className="text-xs text-[#889c9b]">
              <span className="text-[#f0e6d2]">Alignment:</span>{" "}
              {ALIGNMENT_LABELS[characterData.alignmentCode] ||
                characterData.alignmentCode}{" "}
              • <span className="text-[#f0e6d2]">Campaign:</span>{" "}
              {characterData.campaignName || "Standalone"}
            </p>
          </div>

          {/* Derived Starting HP Card */}
          <div className="p-3 bg-[#361a12] border border-amber-500/40 rounded-lg text-center min-w-[110px] shadow">
            <span className="block text-[10px] uppercase text-[#889c9b]">
              Starting HP
            </span>
            <span className="text-2xl font-bold text-red-400">
              {calculatedMaxHP}
            </span>
            <span className="block text-[9px] text-[#889c9b] mt-0.5">
              (d{baseHitDie} + CON Mod)
            </span>
          </div>
        </div>

        {/* Secondary Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-[#a59075]/30 pb-6">
          {/* Class & Subclass Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
              Class Features & Hit Dice
            </h4>
            <div className="p-3 bg-[#361a12]/60 rounded border border-[#a59075]/20 text-xs space-y-1">
              <p>
                <strong className="text-[#f0e6d2]">Primary Class:</strong>{" "}
                {selectedClass?.name || "N/A"}
              </p>
              {selectedSubclass && (
                <p>
                  <strong className="text-[#f0e6d2]">
                    Archetype / Subclass:
                  </strong>{" "}
                  {selectedSubclass.name}
                </p>
              )}
              <p>
                <strong className="text-[#f0e6d2]">Hit Die:</strong> 1d
                {baseHitDie}
              </p>
              <p>
                <strong className="text-[#f0e6d2]">Primary Stat:</strong>{" "}
                {selectedClass?.primary_ability || "N/A"}
              </p>
            </div>
          </div>

          {/* Lineage & Background Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
              Ancestry & Background
            </h4>
            <div className="p-3 bg-[#361a12]/60 rounded border border-[#a59075]/20 text-xs space-y-1">
              <p>
                <strong className="text-[#f0e6d2]">Lineage:</strong>{" "}
                {selectedRace?.name || "N/A"} ({selectedRace?.size || "Medium"},{" "}
                {selectedRace?.speed || 30} ft)
              </p>
              <p>
                <strong className="text-[#f0e6d2]">Background:</strong>{" "}
                {selectedBg?.name || "N/A"}
              </p>
              {selectedBg?.feature_name && (
                <p>
                  <strong className="text-[#f0e6d2]">Background Perk:</strong>{" "}
                  {selectedBg.feature_name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ability Scores Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
            Allocated Ability Scores
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {Object.entries(characterData.abilityScores || {}).map(
              ([key, score]) => {
                const modifier = calculateModifier(score);
                return (
                  <div
                    key={key}
                    className="p-2.5 bg-[#361a12] border border-[#a59075]/30 rounded text-center space-y-0.5 shadow-inner"
                  >
                    <span className="block text-[10px] uppercase text-[#889c9b]">
                      {key.substring(0, 3)}
                    </span>
                    <span className="block text-sm font-bold text-[#f0e6d2]">
                      {score}
                    </span>
                    <span className="block text-[10px] text-amber-400 font-bold">
                      {modifier}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Banner & Action */}
      <div className="flex justify-between items-center p-4 bg-[#4a261c]/40 border border-[#a59075]/30 rounded-lg">
        <span className="text-xs text-[#889c9b]">
          Ready to commit your character choices to Supabase?
        </span>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onForge}
          className="px-6 py-2.5 bg-amber-700 hover:bg-amber-600 rounded-lg text-xs font-bold text-white transition shadow-lg flex items-center space-x-2"
        >
          <span>
            {isSubmitting
              ? "Forging Character..."
              : "⚔️ Forge Hero into Database"}
          </span>
        </button>
      </div>
    </div>
  );
}
