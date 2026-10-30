import React, { useState } from "react";
// Import custom useAuth hook for user metadata and authentication actions
import { useAuth } from "../../context/AuthContext";

/**
 * TopNavbar Component
 * -----------------------------------------------------------------------------
 * Renders an ultra-slim, fixed-height navigation header (h-14 / 56px).
 * Designed to be reused across all screens in the application.
 * - Left side: Displays application title, divider, and dynamic subtitle.
 * - Right side: Displays active campaign and hover-activated user dropdown menu.
 *
 * @param {Object} props - Component properties.
 * @param {string} [props.subtitle="Dashboard"] - Dynamic subtitle reflecting the current active view.
 * @param {Object} [props.selectedCharacter] - The currently active character object (used for campaign tracking).
 */
export default function TopNavbar({
  subtitle = "Dashboard",
  selectedCharacter,
}) {
  // Destructure user metadata and signOut function from AuthContext
  const { user, signOut } = useAuth();

  // State hook to toggle the user profile dropdown menu on hover
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Extract user display name with a fallback default
  const displayName = user?.user_metadata?.display_name || "Brave Adventurer";

  return (
    // Top Navbar Header Container:
    // - Fixed slim height (h-14 / 56px)
    // - relative and z-50 ensure dropdowns render cleanly above the main content area
    <header className="h-14 bg-[#5f3426] border-b border-[#a59075]/40 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50 shadow-md relative">
      {/* -----------------------------------------------------------------------
        TOP LEFT: BRANDING & SUBTITLE INLINE WITH ISOLATED DIVIDER
        ----------------------------------------------------------------------- */}
      <div className="flex items-center space-x-4 sm:space-x-5">
        {/* Main App Title in MedievalSharp font */}
        <h1 className="text-sm sm:text-base font-bold font-medieval text-[#938f71] leading-none whitespace-nowrap pr-4 sm:pr-6">
          The Adventurer's Codex
        </h1>

        {/* Dedicated Standalone Divider Element to guarantee physical separation */}
        <span
          className="h-4 w-[1px] bg-[#a59075]/40 flex-shrink-0"
          aria-hidden="true"
        />

        {/* Dynamic Subtitle reflecting the active screen/view */}
        <span className="text-[8px] font-antiqua uppercase tracking-widest text-[#889c9b] whitespace-nowrap">
          {subtitle}
        </span>
      </div>

      {/* -----------------------------------------------------------------------
        TOP RIGHT: ACTIVE CAMPAIGN & USER HOVER DROPDOWN MENU
        ----------------------------------------------------------------------- */}
      <div className="flex items-center space-x-4">
        {/* Active Campaign Badge: Displays campaign name if a character is selected */}
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

        {/* User Account Dropdown Container with Hover Listeners */}
        <div
          className="relative"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          {/* Dropdown Trigger Area (Highlights on hover) */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#937460]/20 hover:bg-[#937460]/40 border border-[#a59075]/40 text-[#938f71] transition cursor-pointer">
            <span className="text-xs font-semibold">{displayName}</span>
            <span className="text-[8px] text-[#889c9b]">▼</span>
          </div>

          {/* Dropdown Menu Items (Opens automatically when hovering over the container) */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-[#5f3426] border-2 border-[#a59075]/60 rounded-lg shadow-2xl py-1 z-50 text-xs font-antiqua">
              {/* User Email Info Header (Non-interactive) */}
              <div className="px-3 py-1.5 border-b border-[#a59075]/20 text-[#889c9b] truncate">
                {user?.email}
              </div>

              {/* Manage Account Option */}
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  console.log("Navigate to Manage Account");
                }}
                className="w-full text-left px-3 py-1 text-[#a59075] hover:bg-[#937460]/30 hover:text-[#938f71] transition"
              >
                ⚙️ Manage Account
              </button>

              {/* Switch User Option */}
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  console.log("Trigger Switch User action");
                }}
                className="w-full text-left px-3 py-1 text-[#a59075] hover:bg-[#937460]/30 hover:text-[#938f71] transition"
              >
                🔄 Switch user
              </button>

              {/* Logout Option */}
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  signOut();
                }}
                className="w-full text-left px-3 py-1 text-red-300 hover:bg-red-950/40 hover:text-red-200 border-t border-[#a59075]/20 transition font-semibold"
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
