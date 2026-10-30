import React, { useState } from "react";

/**
 * LeftSidebar Component
 * -----------------------------------------------------------------------------
 * Renders the collapsible left navigation sidebar for the dashboard.
 * - Features expandable category groups with toggle arrows.
 * - Nests character-specific views (Character Sheets, Journal, Inventory)
 *   directly underneath the main Characters option with a clean borderless toggle arrow.
 *
 * @param {Object} props - Component properties.
 * @param {string} props.activeTab - Currently active navigation tab key.
 * @param {Function} props.setActiveTab - State setter to switch active tabs.
 * @param {boolean} props.isSidebarCollapsed - Boolean flag indicating if sidebar is in slim icon-only mode.
 * @param {Function} props.setIsSidebarCollapsed - State setter to toggle sidebar collapse state.
 */
export default function LeftSidebar({
  activeTab,
  setActiveTab,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}) {
  // State to manage collapsible section groups and character sub-menus
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
        isSidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* -----------------------------------------------------------------------
        SIDEBAR HEADER / BRANDING CONTEXT
        ----------------------------------------------------------------------- */}
      <div className="p-4 border-b border-[#a59075]/20 flex items-center justify-between">
        {!isSidebarCollapsed && (
          <span className="text-xs font-antiqua uppercase tracking-widest text-[#889c9b] font-semibold">
            Dashboard
          </span>
        )}
      </div>

      {/* -----------------------------------------------------------------------
        NAVIGATION SECTIONS & COLLAPSIBLE MENUS
        ----------------------------------------------------------------------- */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 font-antiqua text-xs">
        {/* ===================================================================
          SECTION 1: PARTY & HEROES (Includes Characters + Nested Journal & Inventory)
          =================================================================== */}
        <div className="space-y-1">
          {!isSidebarCollapsed ? (
            <button
              onClick={() => toggleSection("heroes")}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] uppercase tracking-widest text-[#889c9b] font-bold hover:text-[#938f71] transition"
            >
              <span>Party & Heroes</span>
              <span className="text-xs">{openSections.heroes ? "▾" : "▸"}</span>
            </button>
          ) : (
            <div className="text-center text-[10px] text-[#889c9b] uppercase">
              Heroes
            </div>
          )}

          {/* Main Heroes Section Content */}
          {(openSections.heroes || isSidebarCollapsed) && (
            <div className="space-y-1 pl-1">
              {/* Characters Parent Button with Clean Borderless Toggle Arrow */}
              <div className="space-y-1">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg transition border border-transparent">
                  <button
                    onClick={() => setActiveTab("characters")}
                    className={`flex-1 flex items-center space-x-3 text-left transition ${
                      activeTab === "characters"
                        ? "text-[#938f71] font-bold"
                        : "text-[#a59075] hover:text-[#938f71]"
                    }`}
                    title="Characters"
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

                {/* Nested Character Sub-Options (Character Sheets, Journal Entries, Inventory Management) */}
                {(isCharactersExpanded || isSidebarCollapsed) &&
                  !isSidebarCollapsed && (
                    <div className="pl-4 space-y-1 border-l-2 border-[#a59075]/20 ml-3 my-1">
                      {/* Character Sheets Sub-Tab */}
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
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
          SECTION 2: SYSTEM & TOOLS
          =================================================================== */}
        <div className="space-y-1 pt-2 border-t border-[#a59075]/20">
          {!isSidebarCollapsed ? (
            <button
              onClick={() => toggleSection("system")}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] uppercase tracking-widest text-[#889c9b] font-bold hover:text-[#938f71] transition"
            >
              <span>System & Profile</span>
              <span className="text-xs">{openSections.system ? "▾" : "▸"}</span>
            </button>
          ) : (
            <div className="text-center text-[10px] text-[#889c9b] uppercase">
              Sys
            </div>
          )}

          {/* Sub-items for System */}
          {(openSections.system || isSidebarCollapsed) && (
            <div className="space-y-1 pl-1">
              {/* Character Creation Wizard Tab */}
              <button
                onClick={() => setActiveTab("character-creation")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                  activeTab === "character-creation"
                    ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 shadow-inner font-bold"
                    : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                }`}
                title="Character Creation"
              >
                <span className="text-sm flex-shrink-0">✨</span>
                {!isSidebarCollapsed && (
                  <span className="truncate">Character Creation</span>
                )}
              </button>

              {/* Profile Tab */}
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                  activeTab === "profile"
                    ? "bg-[#937460]/40 text-[#938f71] border border-[#a59075]/50 shadow-inner font-bold"
                    : "text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                }`}
                title="Profile"
              >
                <span className="text-sm flex-shrink-0">🛡️</span>
                {!isSidebarCollapsed && (
                  <span className="truncate">Profile</span>
                )}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* -----------------------------------------------------------------------
        SIDEBAR FOOTER: COLLAPSE / EXPAND TOGGLE BUTTON
        ----------------------------------------------------------------------- */}
      <div className="p-3 border-t border-[#a59075]/20">
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-[#937460]/20 hover:bg-[#937460]/40 border border-[#a59075]/40 text-[#938f71] transition text-xs font-antiqua"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <span>{isSidebarCollapsed ? "→" : "‹"}</span>
          {!isSidebarCollapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
