/**
 * -----------------------------------------------------------------------------
 * COMPONENT: LeftSidebar.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Responsive primary navigation sidebar for the authenticated dashboard.
 *
 * Dual-Mode Architecture:
 * 1. Desktop (`lg` / >= 1024px): Renders inline (`lg:static`) beside
 *    `MainContentArea`. Supports toggling between full width (`w-64`) and
 *    slim icon-only rail (`w-10`) with hover tooltips.
 * 2. Mobile & Tablet (`< 1024px`): Renders as a fixed slide-over drawer
 *    (`fixed inset-y-0 left-0 z-50`) backed by a dimmed overlay. Always shows
 *    full text labels when opened on touchscreens (`effectiveCollapsed`) and
 *    automatically closes after selecting any navigation destination.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.activeTab - Active route key ('characters', 'character-sheet', etc.).
 * @param {Function} props.setActiveTab - Updates active route key in parent router.
 * @param {boolean} props.isSidebarCollapsed - Desktop icon-only collapsed state.
 * @param {Function} props.setIsSidebarCollapsed - Toggles desktop collapsed state.
 * @param {boolean} [props.isMobileMenuOpen=false] - Controls mobile/tablet drawer visibility.
 * @param {Function} [props.onCloseMobileMenu] - Closes mobile/tablet drawer.
 * -----------------------------------------------------------------------------
 */

import React, { useState } from "react";

export default function LeftSidebar({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMobileMenuOpen = false,
  onCloseMobileMenu,
}) {
  // Tracks collapsible accordion sections ("Party & Heroes", "System & Profile")
  const [openSections, setOpenSections] = useState({
    heroes: true,
    system: true,
  });

  // Tracks whether nested character sub-links (Sheet, Journal, Inventory) are expanded
  const [isCharactersExpanded, setIsCharactersExpanded] = useState(true);

  /**
   * Toggles a top-level accordion section when sidebar is in expanded mode.
   */
  const toggleSection = (sectionKey) => {
    if (effectiveCollapsed) return;
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  /**
   * Selects a navigation tab and dismisses the mobile/tablet drawer if open.
   */
  const handleSelectTab = (tabKey) => {
    setActiveTab(tabKey);
    if (onCloseMobileMenu) {
      onCloseMobileMenu();
    }
  };

  // Prevents icon-only mode from hiding text labels inside the mobile slide-over drawer
  const effectiveCollapsed = isSidebarCollapsed && !isMobileMenuOpen;

  return (
    <>
      {/* ---------------------------------------------------------------------
        MOBILE & TABLET BACKDROP OVERLAY (`lg:hidden`)
        Tapping outside the drawer closes it cleanly.
        --------------------------------------------------------------------- */}
      {isMobileMenuOpen && (
        <div
          onClick={onCloseMobileMenu}
          aria-hidden="true"
          className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 lg:hidden"
        />
      )}

      {/* ---------------------------------------------------------------------
        SIDEBAR / DRAWER ASIDE CONTAINER
        - Below `lg`: Off-screen (`-translate-x-full`) until `isMobileMenuOpen`
          slides it in (`translate-x-0 w-64`).
        - At `lg+`: Resets transform (`lg:translate-x-0`) and sits inline (`lg:static`).
        --------------------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-20 bg-[#5f3426] border-r border-[#a59075]/40 flex flex-col transition-all duration-300 ${
          isMobileMenuOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full lg:translate-x-0"
        } ${effectiveCollapsed ? "lg:w-10 lg:min-w-[2.5rem]" : "lg:w-64 lg:min-w-[16rem]"}`}
      >
        {/* -------------------------------------------------------------------
          SIDEBAR HEADER: DESKTOP COLLAPSE BUTTON / MOBILE CLOSE BUTTON
          ------------------------------------------------------------------- */}
        <div className="h-14 lg:h-auto p-2.5 border-b border-[#a59075]/20 flex items-center justify-between lg:justify-start gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Desktop Collapse/Expand Toggle (`hidden lg:flex`) */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex w-7 h-7 rounded-lg bg-[#937460]/20 hover:bg-[#937460]/40 border border-[#a59075]/40 text-[#938f71] transition text-xs items-center justify-center flex-shrink-0 cursor-pointer"
              title={effectiveCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <span className="leading-none">
                {effectiveCollapsed ? "»" : "«"}
              </span>
            </button>

            {!effectiveCollapsed && (
              <span className="text-xs font-antiqua uppercase tracking-widest text-[#889c9b] font-semibold truncate">
                Dashboard
              </span>
            )}
          </div>

          {/* Mobile/Tablet Drawer Close Button (`lg:hidden`) */}
          {onCloseMobileMenu && (
            <button
              type="button"
              onClick={onCloseMobileMenu}
              aria-label="Close navigation menu"
              className="lg:hidden w-8 h-8 rounded-lg bg-[#937460]/20 hover:bg-[#937460]/40 border border-[#a59075]/40 text-[#f0e6d2] flex items-center justify-center text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* -------------------------------------------------------------------
          NAVIGATION LINKS & COLLAPSIBLE GROUPS
          - Uses `overflow-visible` in collapsed desktop mode so floating hover
            tooltips are not clipped by the `w-10` container.
          ------------------------------------------------------------------- */}
        <nav
          className={`flex-1 py-4 space-y-4 font-antiqua text-xs ${
            effectiveCollapsed
              ? "overflow-visible px-1"
              : "overflow-y-auto px-2"
          }`}
        >
          {/* =================================================================
            SECTION 1: PARTY & HEROES
            ================================================================= */}
          <div className="space-y-1">
            {!effectiveCollapsed && (
              <button
                type="button"
                onClick={() => toggleSection("heroes")}
                className="w-full flex items-center justify-between px-2 py-2 text-[10px] uppercase tracking-widest text-[#889c9b] font-bold hover:text-[#938f71] transition"
              >
                <span>Party & Heroes</span>
                <span className="text-xs">
                  {openSections.heroes ? "▾" : "▸"}
                </span>
              </button>
            )}

            {(openSections.heroes || effectiveCollapsed) && (
              <div className="space-y-1">
                {/* Parent Item: Characters Roster */}
                <div className="relative group">
                  <div
                    className={`flex items-center ${
                      effectiveCollapsed
                        ? "justify-center px-0 py-1.5"
                        : "justify-between px-3 py-2"
                    } rounded-lg transition border border-transparent`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectTab("characters")}
                      className={`flex items-center text-left transition ${
                        activeTab === "characters"
                          ? "text-[#938f71] font-bold"
                          : "text-[#a59075] hover:text-[#938f71]"
                      } ${effectiveCollapsed ? "w-full justify-center" : "flex-1 space-x-3"}`}
                      title={!effectiveCollapsed ? "Characters" : ""}
                    >
                      <span className="text-sm flex-shrink-0">⚔️</span>
                      {!effectiveCollapsed && (
                        <span className="truncate">Characters</span>
                      )}
                    </button>

                    {/* Sub-tree Expand/Collapse Caret */}
                    {!effectiveCollapsed && (
                      <button
                        type="button"
                        onClick={() =>
                          setIsCharactersExpanded(!isCharactersExpanded)
                        }
                        className="text-[#a59075] hover:text-[#938f71] transition px-2 py-1"
                        title={
                          isCharactersExpanded
                            ? "Collapse Character Options"
                            : "Expand Character Options"
                        }
                      >
                        <span className="text-[10px]">
                          {isCharactersExpanded ? "▾" : "▸"}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Desktop Icon-Only Floating Tooltip */}
                  {effectiveCollapsed && (
                    <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#3d1c14] border border-[#a59075]/60 text-[#f0e6d2] text-xs rounded-md shadow-2xl whitespace-nowrap z-[9999] pointer-events-none hidden group-hover:block">
                      Characters
                    </div>
                  )}
                </div>

                {/* Expanded Sub-Navigation (Character Sheet, Journal, Inventory) */}
                {isCharactersExpanded && !effectiveCollapsed && (
                  <div className="pl-4 space-y-1 border-l-2 border-[#a59075]/20 ml-3 my-1">
                    <button
                      type="button"
                      onClick={() => handleSelectTab("character-sheet")}
                      className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg transition text-xs ${
                        activeTab === "character-sheet"
                          ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 font-bold"
                          : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                      }`}
                    >
                      <span className="text-xs">📜</span>
                      <span className="truncate">Character Sheet</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTab("journal")}
                      className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg transition text-xs ${
                        activeTab === "journal"
                          ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 font-bold"
                          : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                      }`}
                    >
                      <span className="text-xs">📖</span>
                      <span className="truncate">Journal Entries</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTab("inventory")}
                      className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg transition text-xs ${
                        activeTab === "inventory"
                          ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 font-bold"
                          : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                      }`}
                    >
                      <span className="text-xs">🎒</span>
                      <span className="truncate">Inventory</span>
                    </button>
                  </div>
                )}

                {/* Collapsed Desktop Icon-Only Sub-Navigation */}
                {effectiveCollapsed && (
                  <div className="space-y-1 pt-1 border-t border-[#a59075]/20">
                    {/* Character Sheet Icon */}
                    <div className="relative group flex justify-center py-1">
                      <button
                        type="button"
                        onClick={() => handleSelectTab("character-sheet")}
                        className={`p-2 rounded-lg transition flex items-center justify-center ${
                          activeTab === "character-sheet"
                            ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 font-bold"
                            : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                        }`}
                      >
                        <span className="text-xs">📜</span>
                      </button>
                      <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#3d1c14] border border-[#a59075]/60 text-[#f0e6d2] text-xs rounded-md shadow-2xl whitespace-nowrap z-[9999] pointer-events-none hidden group-hover:block">
                        Character Sheet
                      </div>
                    </div>

                    {/* Journal Entries Icon */}
                    <div className="relative group flex justify-center py-1">
                      <button
                        type="button"
                        onClick={() => handleSelectTab("journal")}
                        className={`p-2 rounded-lg transition flex items-center justify-center ${
                          activeTab === "journal"
                            ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 font-bold"
                            : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                        }`}
                      >
                        <span className="text-xs">📖</span>
                      </button>
                      <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#3d1c14] border border-[#a59075]/60 text-[#f0e6d2] text-xs rounded-md shadow-2xl whitespace-nowrap z-[9999] pointer-events-none hidden group-hover:block">
                        Journal Entries
                      </div>
                    </div>

                    {/* Inventory Icon */}
                    <div className="relative group flex justify-center py-1">
                      <button
                        type="button"
                        onClick={() => handleSelectTab("inventory")}
                        className={`p-2 rounded-lg transition flex items-center justify-center ${
                          activeTab === "inventory"
                            ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 font-bold"
                            : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                        }`}
                      >
                        <span className="text-xs">🎒</span>
                      </button>
                      <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#3d1c14] border border-[#a59075]/60 text-[#f0e6d2] text-xs rounded-md shadow-2xl whitespace-nowrap z-[9999] pointer-events-none hidden group-hover:block">
                        Inventory
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =================================================================
            SECTION 2: SYSTEM & PROFILE
            ================================================================= */}
          <div className="space-y-1 pt-2 border-t border-[#a59075]/20">
            {!effectiveCollapsed && (
              <button
                type="button"
                onClick={() => toggleSection("system")}
                className="w-full flex items-center justify-between px-2 py-2 text-[10px] uppercase tracking-widest text-[#889c9b] font-bold hover:text-[#938f71] transition"
              >
                <span>System & Profile</span>
                <span className="text-xs">
                  {openSections.system ? "▾" : "▸"}
                </span>
              </button>
            )}

            {(openSections.system || effectiveCollapsed) && (
              <div className="space-y-1">
                {/* Character Creation Wizard Link */}
                <div className="relative group py-0.5">
                  <button
                    type="button"
                    onClick={() => handleSelectTab("character-creation")}
                    className={`w-full flex items-center ${
                      effectiveCollapsed
                        ? "justify-center px-0 py-2"
                        : "px-3 py-2"
                    } rounded-lg transition ${
                      activeTab === "character-creation"
                        ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 shadow-inner font-bold"
                        : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                    }`}
                    title={!effectiveCollapsed ? "Character Creation" : ""}
                  >
                    <span className="text-sm flex-shrink-0">✨</span>
                    {!effectiveCollapsed && (
                      <span className="truncate ml-3">Character Creation</span>
                    )}
                  </button>
                  {effectiveCollapsed && (
                    <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#3d1c14] border border-[#a59075]/60 text-[#f0e6d2] text-xs rounded-md shadow-2xl whitespace-nowrap z-[9999] pointer-events-none hidden group-hover:block">
                      Character Creation
                    </div>
                  )}
                </div>

                {/* User Profile Link */}
                <div className="relative group py-0.5">
                  <button
                    type="button"
                    onClick={() => handleSelectTab("profile")}
                    className={`w-full flex items-center ${
                      effectiveCollapsed
                        ? "justify-center px-0 py-2"
                        : "px-3 py-2"
                    } rounded-lg transition ${
                      activeTab === "profile"
                        ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 shadow-inner font-bold"
                        : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                    }`}
                    title={!effectiveCollapsed ? "Profile" : ""}
                  >
                    <span className="text-sm flex-shrink-0">🛡️</span>
                    {!effectiveCollapsed && (
                      <span className="truncate ml-3">Profile</span>
                    )}
                  </button>
                  {effectiveCollapsed && (
                    <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#3d1c14] border border-[#a59075]/60 text-[#f0e6d2] text-xs rounded-md shadow-2xl whitespace-nowrap z-[9999] pointer-events-none hidden group-hover:block">
                      Profile
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
