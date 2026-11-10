/**
 * -----------------------------------------------------------------------------
 * COMPONENT: LeftSidebar
 * -----------------------------------------------------------------------------
 * Renders the collapsible left navigation sidebar for the dashboard.
 *
 * Architecture & Responsibilities:
 * - Features an ultra-slim collapsed icon-only mode (w-10 / 40px) with zero text labels.
 * - Single left-anchored top header toggle button with a full-box hit area for instant collapse/expand control.
 * - Implements fixed hover tooltips for icon-only mode without container clipping.
 * - Supports expandable category groups ("Party & Heroes", "System & Profile") when fully open.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.activeTab - Currently active navigation tab key.
 * @param {Function} props.setActiveTab - State setter to switch active tabs.
 * @param {boolean} props.isSidebarCollapsed - Boolean flag indicating if sidebar is in slim icon-only mode.
 * @param {Function} props.setIsSidebarCollapsed - State setter to toggle sidebar collapse state.
 */

import React, { useState } from "react";

export default function LeftSidebar({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}) {
  // State to manage collapsible section groups
  const [openSections, setOpenSections] = useState({
    heroes: true,
    system: true,
  });

  // State specifically for toggling the nested character sub-options (Journal, Inventory, Sheets)
  const [isCharactersExpanded, setIsCharactersExpanded] = useState(true);

  /**
   * Toggles the open/closed state of a main sidebar section group.
   * @param {string} sectionKey - The key of the section to toggle ('heroes', 'system')
   */
  const toggleSection = (sectionKey) => {
    if (isSidebarCollapsed) return; // Do nothing if sidebar is fully collapsed
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  return (
    <aside
      className={`bg-[#5f3426] border-r border-[#a59075]/40 flex flex-col transition-all duration-300 z-20 ${
        isSidebarCollapsed ? "w-10 min-w-[2.5rem]" : "w-64 min-w-[16rem]"
      }`}
    >
      {/* -----------------------------------------------------------------------
        SIDEBAR HEADER / LEFT-ANCHORED TOP TOGGLE BUTTON
        ----------------------------------------------------------------------- */}
      <div className="p-2.5 border-b border-[#a59075]/20 flex items-center justify-start space-x-2">
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="w-7 h-7 rounded-lg bg-[#937460]/20 hover:bg-[#937460]/40 border border-[#a59075]/40 text-[#938f71] transition text-xs flex items-center justify-center flex-shrink-0 cursor-pointer"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <span className="leading-none">{isSidebarCollapsed ? "»" : "«"}</span>
        </button>
        {!isSidebarCollapsed && (
          <span className="text-xs font-antiqua uppercase tracking-widest text-[#889c9b] font-semibold truncate">
            Dashboard
          </span>
        )}
      </div>

      {/* -----------------------------------------------------------------------
        NAVIGATION SECTIONS & COLLAPSIBLE MENUS
        ----------------------------------------------------------------------- */}
      <nav
        className={`flex-1 py-4 space-y-4 font-antiqua text-xs ${isSidebarCollapsed ? "overflow-visible px-1" : "overflow-y-auto px-2"}`}
      >
        {/* ===================================================================
          SECTION 1: PARTY & HEROES (Characters, Sheets, Journal, Inventory)
          =================================================================== */}
        <div className="space-y-1">
          {!isSidebarCollapsed && (
            <button
              onClick={() => toggleSection("heroes")}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] uppercase tracking-widest text-[#889c9b] font-bold hover:text-[#938f71] transition"
            >
              <span>Party & Heroes</span>
              <span className="text-xs">{openSections.heroes ? "▾" : "▸"}</span>
            </button>
          )}

          {/* Main Heroes Section Content */}
          {(openSections.heroes || isSidebarCollapsed) && (
            <div className="space-y-1">
              {/* Characters Parent Button */}
              <div className="relative group">
                <div
                  className={`flex items-center ${
                    isSidebarCollapsed
                      ? "justify-center px-0 py-1.5"
                      : "justify-between px-3 py-2"
                  } rounded-lg transition border border-transparent`}
                >
                  <button
                    onClick={() => setActiveTab("characters")}
                    className={`flex items-center text-left transition ${
                      activeTab === "characters"
                        ? "text-[#938f71] font-bold"
                        : "text-[#a59075] hover:text-[#938f71]"
                    } ${isSidebarCollapsed ? "w-full justify-center" : "flex-1 space-x-3"}`}
                    title={!isSidebarCollapsed ? "Characters" : ""}
                  >
                    <span className="text-sm flex-shrink-0">⚔️</span>
                    {!isSidebarCollapsed && (
                      <span className="truncate">Characters</span>
                    )}
                  </button>

                  {!isSidebarCollapsed && (
                    <button
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

                {/* Collapsed Hover Tooltip for Characters */}
                {isSidebarCollapsed && (
                  <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#3d1c14] border border-[#a59075]/60 text-[#f0e6d2] text-xs rounded-md shadow-2xl whitespace-nowrap z-[9999] pointer-events-none hidden group-hover:block">
                    Characters
                  </div>
                )}
              </div>

              {/* Nested Character Sub-Options (Expanded Mode) */}
              {(isCharactersExpanded || isSidebarCollapsed) &&
                !isSidebarCollapsed && (
                  <div className="pl-4 space-y-1 border-l-2 border-[#a59075]/20 ml-3 my-1">
                    {/* Character Sheet Sub-Tab */}
                    <button
                      onClick={() => setActiveTab("character-sheet")}
                      className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg transition text-[11px] ${
                        activeTab === "character-sheet"
                          ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 font-bold"
                          : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                      }`}
                    >
                      <span className="text-xs">📜</span>
                      <span className="truncate">Character Sheet</span>
                    </button>

                    {/* Journal Entries Sub-Tab */}
                    <button
                      onClick={() => setActiveTab("journal")}
                      className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg transition text-[11px] ${
                        activeTab === "journal"
                          ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 font-bold"
                          : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                      }`}
                    >
                      <span className="text-xs">📖</span>
                      <span className="truncate">Journal Entries</span>
                    </button>

                    {/* Inventory Management Sub-Tab */}
                    <button
                      onClick={() => setActiveTab("inventory")}
                      className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg transition text-[11px] ${
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

              {/* Nested Character Sub-Options (Collapsed Mode: Icon-only with fixed tooltips) */}
              {isSidebarCollapsed && (
                <div className="space-y-1 pt-1 border-t border-[#a59075]/20">
                  {/* Character Sheet Icon */}
                  <div className="relative group flex justify-center py-1">
                    <button
                      onClick={() => setActiveTab("character-sheet")}
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

                  {/* Journal Icon */}
                  <div className="relative group flex justify-center py-1">
                    <button
                      onClick={() => setActiveTab("journal")}
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
                      onClick={() => setActiveTab("inventory")}
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

        {/* ===================================================================
          SECTION 2: SYSTEM & TOOLS (Character Creation, Profile)
          =================================================================== */}
        <div className="space-y-1 pt-2 border-t border-[#a59075]/20">
          {!isSidebarCollapsed && (
            <button
              onClick={() => toggleSection("system")}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] uppercase tracking-widest text-[#889c9b] font-bold hover:text-[#938f71] transition"
            >
              <span>System & Profile</span>
              <span className="text-xs">{openSections.system ? "▾" : "▸"}</span>
            </button>
          )}

          {/* Sub-items for System */}
          {(openSections.system || isSidebarCollapsed) && (
            <div className="space-y-1">
              {/* Character Creation Wizard Tab */}
              <div className="relative group py-1">
                <button
                  onClick={() => setActiveTab("character-creation")}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed
                      ? "justify-center px-0 py-2"
                      : "px-3 py-2"
                  } rounded-lg transition ${
                    activeTab === "character-creation"
                      ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 shadow-inner font-bold"
                      : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                  }`}
                  title={!isSidebarCollapsed ? "Character Creation" : ""}
                >
                  <span className="text-sm flex-shrink-0">✨</span>
                  {!isSidebarCollapsed && (
                    <span className="truncate ml-3">Character Creation</span>
                  )}
                </button>
                {isSidebarCollapsed && (
                  <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#3d1c14] border border-[#a59075]/60 text-[#f0e6d2] text-xs rounded-md shadow-2xl whitespace-nowrap z-[9999] pointer-events-none hidden group-hover:block">
                    Character Creation
                  </div>
                )}
              </div>

              {/* Profile Tab */}
              <div className="relative group py-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed
                      ? "justify-center px-0 py-2"
                      : "px-3 py-2"
                  } rounded-lg transition ${
                    activeTab === "profile"
                      ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 shadow-inner font-bold"
                      : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                  }`}
                  title={!isSidebarCollapsed ? "Profile" : ""}
                >
                  <span className="text-sm flex-shrink-0">🛡️</span>
                  {!isSidebarCollapsed && (
                    <span className="truncate ml-3">Profile</span>
                  )}
                </button>
                {isSidebarCollapsed && (
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
  );
}
