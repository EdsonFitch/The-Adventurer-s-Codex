/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepReviewForge.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Manages Step 9 of Character Creation:
 * - Renders the final parchment summary dossier before forging the hero into
 *   Supabase.
 * - Computes starting maximum HP (`Hit Die + CON Mod`), resolves resistances,
 *   passive traits, languages, ability scores, and cleanly formats starting
 *   equipment selections.
 *
 * Responsive & Touch Behavior:
 * - Adaptive Dossier Padding: Uses `p-3.5 sm:p-6` so mobile viewports retain
 *   generous horizontal space for identity details, traits, and gear tags.
 * - Ability Score Grid: Uses `grid-cols-2 sm:grid-cols-3 md:grid-cols-6` so
 *   all 6 ability tiles remain spacious and legible on 375px phones.
 * - Overflow Protection: Adds `min-w-0` and `break-words` to identity headings,
 *   trait badges, and equipment pills.
 *
 * @param {Object} props - Component properties.
 * -----------------------------------------------------------------------------
 */

import React from "react";
import { calculateModifier } from "./StepAbilityScores";

const ALIGNMENT_LABELS = {
  LG: "Lawful Good",
  NG: "Neutral Good",
  CG: "Chaotic Good",
  LN: "Lawful Neutral",
  TN: "True Neutral",
  N: "True Neutral",
  CN: "Chaotic Neutral",
  LE: "Lawful Evil",
  NE: "Neutral Evil",
  CE: "Chaotic Evil",
};

/**
 * Formats an entry from `characterData.equipment` (plain string or JSON-serialized
 * `{ choiceLabel, selections }`) into a clean display label.
 */
function formatEquipmentSummaryItem(entry) {
  if (!entry) return "";
  if (typeof entry === "object") {
    const picked = Object.values(entry.selections || {}).filter(Boolean);
    return picked.length > 0 ? picked.join(", ") : entry.choiceLabel || "";
  }
  if (typeof entry === "string") {
    try {
      const parsed = JSON.parse(entry);
      if (parsed && typeof parsed === "object") {
        const picked = Object.values(parsed.selections || {}).filter(Boolean);
        return picked.length > 0
          ? picked.join(", ")
          : parsed.choiceLabel || parsed.base || entry;
      }
    } catch {
      return entry;
    }
  }
  return String(entry);
}

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
  const finalAbilityScores =
    computedStats?.abilityScores || characterData.abilityScores || {};
  const conScore =
    finalAbilityScores.con ?? characterData.abilityScores?.con ?? 10;
  const conModNumeric = Math.floor((conScore - 10) / 2);
  const baseHitDie = selectedClass?.hit_die || 8;
  const calculatedMaxHP = Math.max(1, baseHitDie + conModNumeric);

  // 1. Gather filtered resistances from activeEffects or fallback racial fields
  let resistances = activeEffects.filter(
    (e) => e.type === "RESISTANCE" || e.type === "DAMAGE_RESISTANCE",
  );

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
          name: "Infernal Legacy (Thaumaturgy, Hellish Rebuke at Lvl 3)",
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

      {/* Main Parchment Summary Dossier (`p-3.5 sm:p-6`) */}
      <div className="p-3.5 sm:p-6 bg-[#4a261c]/80 border-2 border-amber-600/40 rounded-xl space-y-5 sm:space-y-6 shadow-2xl relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute top-2 right-4 text-7xl opacity-5 pointer-events-none select-none"
        >
          ⚔️
        </div>

        {/* Top Identity Grid */}
        <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 border-b border-[#a59075]/30 pb-5 sm:pb-6">
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

          <div className="space-y-1 text-center md:text-left flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-medieval font-bold text-[#f0e6d2] break-words">
              {characterData.name || "Unnamed Adventurer"}
            </h2>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider break-words">
              Level {characterData.level || 1}{" "}
              {selectedRace?.name || "Unknown Race"}{" "}
              {selectedSubrace ? `(${selectedSubrace.name})` : ""}{" "}
              {selectedClass?.name || "Unknown Class"}
            </p>
            <p className="text-xs text-[#889c9b] break-words">
              <span className="text-[#f0e6d2]">Alignment:</span>{" "}
              {ALIGNMENT_LABELS[characterData.alignmentCode] ||
                characterData.alignmentCode}{" "}
              • <span className="text-[#f0e6d2]">Campaign:</span>{" "}
              {characterData.campaignName || "Standalone"}
            </p>
          </div>

          <div className="p-3 bg-[#361a12] border border-amber-500/40 rounded-lg text-center min-w-[110px] shadow shrink-0">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 border-b border-[#a59075]/30 pb-5 sm:pb-6">
          <div className="space-y-2 min-w-0">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
              Class Features & Hit Dice
            </h4>
            <div className="p-3 bg-[#361a12]/60 rounded border border-[#a59075]/20 text-xs space-y-1 break-words">
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

          <div className="space-y-2 min-w-0">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
              Ancestry & Background
            </h4>
            <div className="p-3 bg-[#361a12]/60 rounded border border-[#a59075]/20 text-xs space-y-1 break-words">
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

        {/* Resistances & Passive Traits Summary Card */}
        <div className="p-3.5 sm:p-4 bg-[#361a12]/80 border border-amber-500/40 rounded-lg space-y-3">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center space-x-1.5">
            <span>🛡️ Resistances & Passive Traits</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] uppercase text-[#889c9b] font-bold block mb-1.5">
                Damage & Condition Resistances
              </span>
              <div className="flex flex-wrap gap-1.5">
                {resistances.length > 0 ? (
                  resistances.map((res, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded bg-[#4a261c] border border-amber-500/50 text-amber-300 font-bold break-words"
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

            <div className="min-w-0">
              <span className="text-[10px] uppercase text-[#889c9b] font-bold block mb-1.5">
                Passive Lineage & Class Traits
              </span>
              <div className="flex flex-wrap gap-1.5">
                {passiveTraits.length > 0 ? (
                  passiveTraits.map((trait, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded bg-[#4a261c] border border-[#a59075]/40 text-[#f0e6d2] break-words"
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

        {/* Starting Equipment & Languages Summary */}
        <div className="p-3.5 sm:p-4 bg-[#361a12]/80 border border-amber-500/40 rounded-lg space-y-3">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
            🎒 Starting Equipment & Languages
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] uppercase text-[#889c9b] font-bold block mb-1.5">
                Selected Gear
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(characterData.equipment) &&
                characterData.equipment.length > 0 ? (
                  characterData.equipment
                    .map((eq) => formatEquipmentSummaryItem(eq))
                    .filter(Boolean)
                    .map((label, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded bg-[#4a261c] border border-[#a59075]/40 text-[#f0e6d2] break-words"
                      >
                        ⚔️ {label}
                      </span>
                    ))
                ) : (
                  <span className="text-[#889c9b] italic text-[11px]">
                    No equipment selected
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <span className="text-[10px] uppercase text-[#889c9b] font-bold block mb-1.5">
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

        {/* Ability Scores Breakdown (`grid-cols-2 sm:grid-cols-3 md:grid-cols-6`) */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest">
            Allocated Ability Scores
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {Object.entries(characterData.abilityScores || {}).map(
              ([key, score]) => {
                const modifier = calculateModifier(score);
                return (
                  <div
                    key={key}
                    className="p-2.5 bg-[#361a12] border border-[#a59075]/30 rounded text-center space-y-0.5 shadow-inner min-w-0"
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
