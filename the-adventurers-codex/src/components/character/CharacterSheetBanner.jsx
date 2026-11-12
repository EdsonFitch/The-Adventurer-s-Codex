/**
 * -----------------------------------------------------------------------------
 * COMPONENT: CharacterSheetBanner.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Top header banner for the Character Sheet view. Styled with a dark-leather and
 * amber parchment aesthetic, constrained to the portrait height. Displays hero
 * identity details on the left and campaign name, rest buttons, level-up trigger,
 * and navigation controls on the right.
 * -----------------------------------------------------------------------------
 */

import React from "react";

export default function CharacterSheetBanner({
  character,
  userName = "Adventurer",
  onShortRest,
  onLongRest,
  onLevelUp,
  onBackToRoster,
}) {
  if (!character) return null;

  // Extract metadata safely with fallbacks
  const characterName = character.name || "Unnamed Hero";
  const raceName =
    character.race?.name || character.races?.name || "Unknown Race";
  const subraceName = character.subrace?.name || character.subraces?.name || "";
  const className = character.primaryClass?.name || "Unknown Class";
  const level = character.level || 1;
  const campaignName = character.campaign_name || "Standalone Campaign";
  const portraitUrl = character.portrait_url;

  return (
    <div className="p-4 bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
      {/* Background Emblem Watermark */}
      <div className="absolute right-6 -bottom-4 text-8xl opacity-5 pointer-events-none select-none">
        🛡️
      </div>

      {/* LEFT CLUSTER: Portrait & Identity Metadata */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        {/* Portrait Thumbnail Frame */}
        <div className="w-20 h-20 rounded-lg border-2 border-amber-500/70 overflow-hidden bg-[#361a12] shrink-0 shadow-inner flex items-center justify-center">
          {portraitUrl ? (
            <img
              src={portraitUrl}
              alt={characterName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/150?text=Hero";
              }}
            />
          ) : (
            <span className="text-3xl">🛡️</span>
          )}
        </div>

        {/* Stacked Identity Metadata */}
        <div className="space-y-0.5">
          <h2 className="text-xl md:text-2xl font-medieval font-bold text-[#f0e6d2] tracking-wide">
            {characterName}{" "}
            <span className="text-xs font-sans text-amber-400 font-normal">
              — {userName}
            </span>
          </h2>
          <p className="text-xs text-amber-300 font-bold uppercase tracking-wider">
            Level {level} {raceName} {subraceName ? `(${subraceName})` : ""}{" "}
            {className}
          </p>
          <p className="text-[11px] text-[#889c9b]">
            Alignment:{" "}
            <span className="text-[#f0e6d2]">
              {character.alignment_code || "N/A"}
            </span>
          </p>
        </div>
      </div>

      {/* RIGHT CLUSTER: Campaign, Rest Triggers, Level Up & Navigation */}
      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
        {/* Campaign Name Badge */}
        <div className="px-3 py-1 bg-[#361a12] border border-amber-500/30 rounded-lg text-xs text-[#f0e6d2] shadow-inner flex items-center space-x-1.5">
          <span>📜</span>
          <span className="font-bold text-amber-300">{campaignName}</span>
        </div>

        {/* Short Rest Button */}
        <button
          type="button"
          onClick={onShortRest}
          className="px-3 py-1.5 bg-[#5f3426] hover:bg-amber-700/60 border border-amber-500/40 rounded text-xs text-[#f0e6d2] font-bold transition shadow flex items-center space-x-1"
          title="Restore Warlock slots and short rest abilities"
        >
          <span>⛺ Short Rest</span>
        </button>

        {/* Long Rest Button */}
        <button
          type="button"
          onClick={onLongRest}
          className="px-3 py-1.5 bg-[#5f3426] hover:bg-amber-700/60 border border-amber-500/40 rounded text-xs text-amber-300 font-bold transition shadow flex items-center space-x-1"
          title="Restore full HP and reset all spell slots"
        >
          <span>🛏️ Long Rest</span>
        </button>

        {/* Level Up Button (Placeholder Wizard Hook) */}
        <button
          type="button"
          onClick={onLevelUp}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 border border-amber-400 rounded text-xs text-[#361a12] font-black transition shadow flex items-center space-x-1"
          title="Open Level Up Wizard"
        >
          <span>⭐ Level Up</span>
        </button>

        {/* Back to Roster Button */}
        <button
          type="button"
          onClick={onBackToRoster}
          className="px-3 py-1.5 bg-[#361a12] hover:bg-[#5f3426] border border-[#a59075]/40 rounded text-xs text-[#938f71] hover:text-[#f0e6d2] transition shadow"
        >
          ← Roster
        </button>
      </div>
    </div>
  );
}
