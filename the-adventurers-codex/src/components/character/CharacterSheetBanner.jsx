/**
 * -----------------------------------------------------------------------------
 * COMPONENT: CharacterSheetBanner.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Top header banner for the Character Sheet view. Styled with a dark-leather and
 * amber parchment aesthetic, displaying hero identity metadata on the left and
 * campaign badge, rest triggers, level-up button, and roster navigation on the
 * right.
 *
 * Responsive & Touch Behavior:
 * - Mobile (`< 768px` / below `md`): Stacks the identity cluster above the
 *   action button bar (`flex-col md:flex-row`), scales the portrait frame to
 *   `w-16 h-16` so text has room to breathe, aligns wrapped buttons to the left
 *   (`justify-start md:justify-end`), and increases button vertical padding
 *   (`py-2 sm:py-1.5`) for comfortable thumb taps.
 * - Tablet & Desktop (`>= 768px` / `md+`): Restores the horizontal side-by-side
 *   banner layout with `w-20 h-20` portrait and right-aligned action controls.
 * - Overflow Protection: Uses `min-w-0` and `truncate` on text blocks and the
 *   campaign pill so long hero or campaign names never push the banner wider
 *   than the viewport.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.character - Active character record with race, class, and level info.
 * @param {string} [props.userName="Adventurer"] - Player display name shown beside hero name.
 * @param {Function} props.onShortRest - Triggers short rest recovery workflow.
 * @param {Function} props.onLongRest - Triggers long rest recovery workflow.
 * @param {Function} props.onLevelUp - Triggers level-up workflow.
 * @param {Function} props.onBackToRoster - Navigates back to the Adventurers Roster grid.
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

  // Safely resolve joined relational names (supports both singular and plural Supabase join keys)
  const characterName = character.name || "Unnamed Hero";
  const raceName =
    character.race?.name || character.races?.name || "Unknown Race";
  const subraceName = character.subrace?.name || character.subraces?.name || "";
  const className = character.primaryClass?.name || "Unknown Class";
  const level = character.level || 1;
  const campaignName = character.campaign_name || "Standalone Campaign";
  const portraitUrl = character.portrait_url;

  return (
    <div className="p-3 sm:p-4 bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 relative overflow-hidden">
      {/* Decorative Background Shield Emblem (non-interactive) */}
      <div
        aria-hidden="true"
        className="absolute right-6 -bottom-4 text-7xl sm:text-8xl opacity-5 pointer-events-none select-none"
      >
        🛡️
      </div>

      {/* ---------------------------------------------------------------------
        LEFT CLUSTER: PORTRAIT THUMBNAIL & HERO IDENTITY METADATA
        - `min-w-0` on the flex container and text column ensures long names
          wrap or truncate cleanly instead of overflowing narrow phone screens.
        --------------------------------------------------------------------- */}
      <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto min-w-0">
        {/* Portrait Thumbnail Frame (`w-16 h-16` on phones, `w-20 h-20` on `sm+`) */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-amber-500/70 overflow-hidden bg-[#361a12] shrink-0 shadow-inner flex items-center justify-center">
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
            <span className="text-2xl sm:text-3xl">🛡️</span>
          )}
        </div>

        {/* Stacked Identity Metadata */}
        <div className="space-y-0.5 min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-medieval font-bold text-[#f0e6d2] tracking-wide leading-tight break-words">
            {characterName}{" "}
            <span className="block sm:inline text-xs font-sans text-amber-400 font-normal">
              — {userName}
            </span>
          </h2>
          <p className="text-[11px] sm:text-xs text-amber-300 font-bold uppercase tracking-wider leading-snug">
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

      {/* ---------------------------------------------------------------------
        RIGHT CLUSTER: CAMPAIGN BADGE, REST BUTTONS, LEVEL UP & BACK TO ROSTER
        - Left-aligned on mobile (`justify-start`) when wrapped across two rows,
          and right-aligned on tablet/desktop (`md:justify-end`).
        - Button padding uses `py-2 sm:py-1.5` for easier touchscreen tapping.
        --------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto justify-start md:justify-end">
        {/* Campaign Name Badge */}
        <div className="px-2.5 sm:px-3 py-1.5 sm:py-1 bg-[#361a12] border border-amber-500/30 rounded-lg text-xs text-[#f0e6d2] shadow-inner flex items-center space-x-1.5 max-w-full">
          <span className="shrink-0">📜</span>
          <span className="font-bold text-amber-300 truncate max-w-[180px] sm:max-w-[220px]">
            {campaignName}
          </span>
        </div>

        {/* Short Rest Action Button */}
        <button
          type="button"
          onClick={onShortRest}
          className="px-3 py-2 sm:py-1.5 bg-[#5f3426] hover:bg-amber-700/60 border border-amber-500/40 rounded-lg text-xs text-[#f0e6d2] font-bold transition shadow flex items-center space-x-1 cursor-pointer"
          title="Restore Warlock slots and short rest abilities"
        >
          <span>⛺ Short Rest</span>
        </button>

        {/* Long Rest Action Button */}
        <button
          type="button"
          onClick={onLongRest}
          className="px-3 py-2 sm:py-1.5 bg-[#5f3426] hover:bg-amber-700/60 border border-amber-500/40 rounded-lg text-xs text-amber-300 font-bold transition shadow flex items-center space-x-1 cursor-pointer"
          title="Restore full HP and reset all spell slots"
        >
          <span>🛏️ Long Rest</span>
        </button>

        {/* Level Up Wizard Trigger Button */}
        <button
          type="button"
          onClick={onLevelUp}
          className="px-3 py-2 sm:py-1.5 bg-amber-600 hover:bg-amber-500 border border-amber-400 rounded-lg text-xs text-[#361a12] font-black transition shadow flex items-center space-x-1 cursor-pointer"
          title="Open Level Up Wizard"
        >
          <span>⭐ Level Up</span>
        </button>

        {/* Back to Adventurers Roster Button */}
        <button
          type="button"
          onClick={onBackToRoster}
          className="px-3 py-2 sm:py-1.5 bg-[#361a12] hover:bg-[#5f3426] border border-[#a59075]/40 rounded-lg text-xs text-[#938f71] hover:text-[#f0e6d2] transition shadow cursor-pointer"
        >
          ← Roster
        </button>
      </div>
    </div>
  );
}
