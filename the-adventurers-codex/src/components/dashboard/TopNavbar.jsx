/**
 * -----------------------------------------------------------------------------
 * COMPONENT: TopNavbar.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Renders a responsive, sticky top navigation header (`h-14` / 56px) shared
 * across all authenticated dashboard views.
 *
 * Responsive & Touch Behavior:
 * - Mobile & Tablet (`< 1024px` / below `lg`): Displays a hamburger toggle
 *   button (`onToggleMobileMenu`) on the far left to open the slide-over
 *   navigation drawer, and hides secondary subtitles/campaign badges when
 *   space is tight so the header never wraps onto two lines.
 * - Desktop (`>= 1024px` / `lg` and up): Hides the hamburger button since
 *   `LeftSidebar` is persistently visible.
 * - Touchscreen Dropdown: Replaces hover-only menu triggers (`onMouseEnter`)
 *   with click/tap state (`onClick`) plus outside-click/touch detection so
 *   phones and tablets can open and dismiss the user menu reliably.
 *
 * @param {Object} props - Component properties.
 * @param {string} [props.subtitle="Dashboard"] - Dynamic view label shown beside title on `sm+` screens.
 * @param {Object} [props.selectedCharacter] - Active character record (displays campaign badge on `md+`).
 * @param {Function} [props.onToggleMobileMenu] - Callback to open/close the mobile navigation drawer.
 * -----------------------------------------------------------------------------
 */

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

export default function TopNavbar({
  subtitle = "Dashboard",
  selectedCharacter,
  onToggleMobileMenu,
}) {
  // Retrieve authenticated user object and sign-out handler from global AuthContext
  const { user, signOut } = useAuth();

  // Controls open/closed visibility of the user account dropdown menu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Ref attached to the dropdown wrapper to detect outside clicks/taps
  const dropdownRef = useRef(null);

  // Fallback display name if user metadata does not include a custom display_name
  const displayName = user?.user_metadata?.display_name || "Brave Adventurer";

  /**
   * Effect Hook: Outside Click & Touch Listener
   * Closes the user account dropdown whenever the user clicks or taps anywhere
   * outside `dropdownRef` (works on both desktop mice and mobile touchscreens).
   */
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <header className="h-14 bg-[#5f3426] border-b border-[#a59075]/40 px-3 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-50 shadow-md">
      {/* ---------------------------------------------------------------------
        TOP LEFT: MOBILE DRAWER TOGGLE, APP TITLE & DYNAMIC VIEW SUBTITLE
        - `min-w-0` allows flex children (`truncate`) to shrink cleanly on
          narrow 360px-375px phone screens without pushing the right menu offscreen.
        --------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile & Tablet Navigation Drawer Toggle (`lg:hidden` hides on desktop) */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden w-9 h-9 rounded-lg bg-[#937460]/25 hover:bg-[#937460]/45 border border-[#a59075]/40 text-[#f0e6d2] flex items-center justify-center flex-shrink-0 transition cursor-pointer"
          >
            <span className="text-base leading-none">☰</span>
          </button>
        )}

        {/* Application Title */}
        <h1 className="text-sm sm:text-base font-bold font-medieval text-[#938f71] leading-none truncate">
          The Adventurer's Codex
        </h1>

        {/* Vertical Divider (hidden on extra-small phones where subtitle is hidden) */}
        <span
          className="hidden sm:inline-block h-4 w-[1px] bg-[#a59075]/40 flex-shrink-0"
          aria-hidden="true"
        />

        {/* Active View Subtitle (shown from `sm` / 640px upward) */}
        <span className="hidden sm:inline-block text-[10px] font-antiqua uppercase tracking-widest text-[#889c9b] whitespace-nowrap">
          {subtitle}
        </span>
      </div>

      {/* ---------------------------------------------------------------------
        TOP RIGHT: ACTIVE CAMPAIGN BADGE & USER ACCOUNT DROPDOWN
        - `flex-shrink-0` prevents the user button from compressing awkwardly.
        --------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Campaign Indicator (shown on `md` / 768px tablets and desktops) */}
        {selectedCharacter?.campaignName && (
          <div className="hidden md:flex flex-col text-right border-r border-[#a59075]/30 pr-3">
            <span className="text-[8px] uppercase tracking-wider text-[#889c9b] font-semibold leading-none">
              Active Campaign
            </span>
            <span className="text-[10px] font-bold text-[#938f71] truncate max-w-[140px]">
              {selectedCharacter.campaignName}
            </span>
          </div>
        )}

        {/* Click/Tap User Account Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#937460]/20 hover:bg-[#937460]/40 border border-[#a59075]/40 text-[#938f71] transition cursor-pointer"
          >
            {/* Truncates long usernames on small phones while expanding on larger screens */}
            <span className="text-xs font-semibold truncate max-w-[100px] sm:max-w-[160px]">
              {displayName}
            </span>
            <span className="text-[9px] text-[#889c9b]">
              {isDropdownOpen ? "▲" : "▼"}
            </span>
          </button>

          {/* Dropdown Menu Panel */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-[#5f3426] border-2 border-[#a59075]/60 rounded-lg shadow-2xl py-1 z-50 text-xs font-antiqua">
              {/* Authenticated User Email Header */}
              <div className="px-3 py-2 border-b border-[#a59075]/20 text-[#889c9b] truncate">
                {user?.email}
              </div>

              {/* Manage Account Action */}
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  console.log("Navigate to Manage Account");
                }}
                className="w-full text-left px-3 py-2 text-[#a59075] hover:bg-[#937460]/30 hover:text-[#938f71] transition"
              >
                ⚙️ Manage Account
              </button>

              {/* Switch User Action */}
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  console.log("Trigger Switch User action");
                }}
                className="w-full text-left px-3 py-2 text-[#a59075] hover:bg-[#937460]/30 hover:text-[#938f71] transition"
              >
                🔄 Switch user
              </button>

              {/* Sign Out Action */}
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  signOut();
                }}
                className="w-full text-left px-3 py-2 text-red-300 hover:bg-red-950/40 hover:text-red-200 border-t border-[#a59075]/20 transition font-semibold"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
