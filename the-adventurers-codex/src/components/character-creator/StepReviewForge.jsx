/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepReviewForge
 * -----------------------------------------------------------------------------
 * Manages Step 9 of Character Creation:
 * - Renders a parchment-styled character summary sheet.
 * - Computes starting maximum HP (Hit Die + CON Mod).
 * - Displays active combat resistances, racial traits, starting gear, and languages.
 * - Relies on the master wizard footer to trigger the final character creation submission.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.characterData - Master character payload state.
 * @param {Array} props.racesList - Pre-fetched races list.
 * @param {Array} props.subracesList - Pre-fetched subraces list.
 * @param {Array} props.classesList - Pre-fetched classes list.
 * @param {Array} props.subclassesList - Pre-fetched subclasses list.
 * @param {Array} props.backgroundsList - Pre-fetched backgrounds list.
 * @param {Array} props.activeEffects - Aggregated active effects from lineage/class/background.
 * @param {Object} props.computedStats - Calculated attributes and modifier package.
 * @param {Function} props.onForge - Callback function to trigger database mutation.
 * @param {boolean} props.isSubmitting - Loading state during database insert.
 */

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

export default function StepReviewForge({
  characterData,
  racesList = [],
  subracesList = [],
  classesList = [],
  subclassesList = [],
  backgroundsList = [],
  activeEffects = [],
  computedStats = {},
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
  const conScore = characterData.abilityScores?.con || 10;
  const conModNumeric = Math.floor((conScore - 10) / 2);
  const baseHitDie = selectedClass?.hit_die || 8;
  const calculatedMaxHP = Math.max(1, baseHitDie + conModNumeric);

  // ---------------------------------------------------------------------------
  // RESISTANCE & TRAIT RESOLUTION WITH FALLBACK PARSING
  // ---------------------------------------------------------------------------

  // 1. Gather filtered resistances from activeEffects or fallback racial fields
  let resistances = activeEffects.filter(
    (e) => e.type === "RESISTANCE" || e.type === "DAMAGE_RESISTANCE",
  );

  // Fallback: If race data includes raw resistances or fire resistance traits (like Tieflings)
  if (resistances.length === 0 && selectedRace) {
    if (selectedRace.name?.toLowerCase().includes("tiefling")) {
      resistances.push({
        target: "Fire",
        source: "Tiefling Lineage (Hellish Resistance)",
      });
    }
    if (Array.isArray(selectedRace.resistances)) {
      selectedRace.resistances.forEach((res) => {
        resistances.push({ target: res, source: selectedRace.name });
      });
    }
  }

  // 2. Gather passive traits and special features
  let passiveTraits = activeEffects.filter(
    (e) =>
      e.type === "PASSIVE_TRAIT" ||
      e.type === "SENSE" ||
      e.type === "SPECIAL_TRAIT",
  );

  // Fallback: If race specifies traits array or text descriptions in the database row
  if (selectedRace) {
    if (selectedRace.name?.toLowerCase().includes("tiefling")) {
      if (!passiveTraits.some((t) => t.name?.includes("Darkvision"))) {
        passiveTraits.push({
          name: "Darkvision (60 ft)",
          source: "Tiefling Lineage",
        });
      }
      if (!passiveTraits.some((t) => t.name?.includes("Infernal Legacy"))) {
        passiveTraits.push({
          name: "Infernal Legacy (Thaumatugy, Hellish Rebuke at Lvl 3)",
          source: "Tiefling Lineage",
        });
      }
    }
    if (Array.isArray(selectedRace.traits)) {
      selectedRace.traits.forEach((t) => {
        passiveTraits.push({
          name: typeof t === "string" ? t : t.name || JSON.stringify(t),
          source: selectedRace.name,
        });
      });
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h3 className="text-base font-medieval font-bold text-[#f0e6d2]">
          Step 9: Review & Forge
        </h3>
        <p className="text-xs text-[#889c9b]">
          Inspect your hero's record before binding them permanently into the
          chronicles.
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

        {/* SECTION: RESISTANCES & PASSIVE TRAITS SUMMARY CARD */}
        <div className="p-4 bg-[#361a12]/80 border border-amber-500/40 rounded-lg space-y-3">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center space-x-1.5">
            <span>🛡️ Resistances & Passive Traits</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Resistances */}
            <div>
              <span className="text-[10px] uppercase text-[#889c9b] font-bold block mb-1">
                Damage & Condition Resistances
              </span>
              <div className="flex flex-wrap gap-1.5">
                {resistances.length > 0 ? (
                  resistances.map((res, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded bg-[#4a261c] border border-amber-500/50 text-amber-300 font-bold"
                    >
                      🛡️ {res.target || res.name || "Resistance"} (
                      {res.source || "Racial Trait"})
                    </span>
                  ))
                ) : (
                  <span className="text-[#889c9b] italic text-[11px]">
                    No active resistances
                  </span>
                )}
              </div>
            </div>

            {/* Passive Traits & Senses */}
            <div>
              <span className="text-[10px] uppercase text-[#889c9b] font-bold block mb-1">
                Passive Lineage & Class Traits
              </span>
              <div className="flex flex-wrap gap-1.5">
                {passiveTraits.length > 0 ? (
                  passiveTraits.map((trait, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded bg-[#4a261c] border border-[#a59075]/40 text-[#f0e6d2]"
                    >
                      ✨ {trait.name || trait.target} (
                      {trait.source || "Lineage"})
                    </span>
                  ))
                ) : (
                  <span className="text-[#889c9b] italic text-[11px]">
                    Standard traits
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: STARTING EQUIPMENT & LANGUAGES SUMMARY */}
        <div className="p-4 bg-[#361a12]/80 border border-amber-500/40 rounded-lg space-y-3">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
            🎒 Starting Equipment & Languages
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Equipment */}
            <div>
              <span className="text-[10px] uppercase text-[#889c9b] font-bold block mb-1">
                Selected Gear
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(characterData.equipment) &&
                characterData.equipment.length > 0 ? (
                  characterData.equipment.map((eq, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded bg-[#4a261c] border border-[#a59075]/40 text-[#f0e6d2]"
                    >
                      ⚔️ {eq}
                    </span>
                  ))
                ) : (
                  <span className="text-[#889c9b] italic text-[11px]">
                    No equipment selected
                  </span>
                )}
              </div>
            </div>

            {/* Languages */}
            <div>
              <span className="text-[10px] uppercase text-[#889c9b] font-bold block mb-1">
                Known Languages
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(characterData.languages) &&
                characterData.languages.length > 0 ? (
                  characterData.languages.map((lang, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded bg-[#4a261c] border border-[#a59075]/40 text-amber-300 font-bold"
                    >
                      🗣️ {lang}
                    </span>
                  ))
                ) : (
                  <span className="text-[#889c9b] italic text-[11px]">
                    Common
                  </span>
                )}
              </div>
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
    </div>
  );
}
