/**
 * -----------------------------------------------------------------------------
 * COMPONENT: DashboardContentRouter.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Master view router and layout coordinator for authenticated users.
 *
 * Responsibilities:
 * - Tracks the active navigation tab (`activeTab`) and selected hero record
 *   (`selectedCharacter`).
 * - Coordinates both desktop sidebar collapse state (`isSidebarCollapsed`) and
 *   mobile/tablet drawer open state (`isMobileMenuOpen`).
 * - Wraps the workspace in a `min-w-0` flex body so child grids and tables
 *   shrink properly inside narrow viewports without horizontal overflow.
 * -----------------------------------------------------------------------------
 */

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "./DashboardLayout";
import TopNavbar from "./TopNavbar";
import LeftSidebar from "./LeftSidebar";
import MainContentArea from "./MainContentArea";
import CharacterCreatorWizard from "../character-creator/CharacterCreatorWizard";
import JournalView from "../diary/JournalView";
import CharacterSheetView from "../character/CharacterSheetView";
import InventoryView from "../inventory/InventoryView";

export default function DashboardContentRouter() {
  // ---------------------------------------------------------------------------
  // 1. AUTHENTICATION & MASTER NAVIGATION STATE
  // ---------------------------------------------------------------------------
  const { user } = useAuth();

  // Active tab key ('characters', 'character-sheet', 'journal', 'inventory', etc.)
  const [activeTab, setActiveTab] = useState("characters");

  // Controls desktop icon-only collapsed mode (`lg` and up)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Controls off-canvas slide-over drawer visibility on phones & tablets (`< lg`)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Currently active character record passed into Sheet, Journal, and Inventory views
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // Incremented after forging a new hero so MainContentArea re-fetches the roster
  const [characterRefreshTrigger, setCharacterRefreshTrigger] = useState(0);

  // ---------------------------------------------------------------------------
  // 2. NAVIGATION & WORKFLOW HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * Opens the interactive Character Sheet when a roster card is tapped/clicked.
   */
  const handleSelectCharacter = (character) => {
    setSelectedCharacter(character);
    setActiveTab("character-sheet");
    setIsMobileMenuOpen(false);
  };

  /**
   * Handles completion of the Character Creator Wizard: stores the newly forged
   * character, triggers a roster refresh, and returns to the roster view.
   */
  const handleCharacterForged = (forgedCharacter) => {
    setSelectedCharacter(forgedCharacter);
    setCharacterRefreshTrigger((prev) => prev + 1);
    setActiveTab("characters");
    setIsMobileMenuOpen(false);
  };

  /**
   * Resolves the dynamic subtitle displayed in TopNavbar for the current tab.
   */
  const getHeaderSubtitle = () => {
    switch (activeTab) {
      case "character-creation":
        return "Forge Hero";
      case "character-sheet":
        return "Character Sheet";
      case "journal":
        return "Journal Entries";
      case "inventory":
        return "Inventory & Vault";
      case "profile":
        return "Account Profile";
      case "characters":
      default:
        return "Adventurers Roster";
    }
  };

  // ---------------------------------------------------------------------------
  // 3. RENDER RESPONSIVE DASHBOARD SHELL & ROUTED SUB-VIEWS
  // ---------------------------------------------------------------------------
  return (
    <DashboardLayout>
      {/* Persistent Sticky Top Navigation Bar */}
      <TopNavbar
        subtitle={getHeaderSubtitle()}
        selectedCharacter={selectedCharacter}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      {/* Main Layout Body:
          `min-w-0` is critical on flex rows so inner grids do not force the
          viewport wider than 100% on phones and tablets. */}
      <div className="flex flex-1 min-w-0 overflow-hidden relative">
        {/* Responsive Left Sidebar (Drawer on `< lg`, Persistent on `lg+`) */}
        <LeftSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        {/* Scrollable Content Canvas */}
        <MainContentArea
          onSelectCharacter={handleSelectCharacter}
          onOpenCreator={() => setActiveTab("character-creation")}
          refreshTrigger={characterRefreshTrigger}
        >
          {activeTab !== "characters" && (
            <>
              {/* VIEW 1: CHARACTER CREATOR WIZARD */}
              {activeTab === "character-creation" && (
                <div className="space-y-4 animate-fadeIn max-w-5xl mx-auto py-2">
                  <div className="flex justify-between items-center border-b border-[#a59075]/30 pb-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("characters")}
                      className="px-3 py-2 bg-[#5f3426] hover:bg-[#937460]/40 border border-[#a59075]/40 rounded text-xs text-[#938f71] transition flex items-center space-x-2 shadow"
                    >
                      <span>← Return to Adventurers</span>
                    </button>
                  </div>
                  <CharacterCreatorWizard
                    userId={user?.id}
                    onComplete={handleCharacterForged}
                  />
                </div>
              )}

              {/* VIEW 2: INTERACTIVE CHARACTER SHEET */}
              {activeTab === "character-sheet" && (
                <CharacterSheetView
                  selectedCharacter={selectedCharacter}
                  userName={
                    user?.user_metadata?.full_name ||
                    user?.email ||
                    "Adventurer"
                  }
                  onBackToRoster={() => setActiveTab("characters")}
                />
              )}

              {/* VIEW 3: CAMPAIGN & SESSION JOURNAL */}
              {activeTab === "journal" && (
                <JournalView selectedCharacter={selectedCharacter} />
              )}

              {/* VIEW 4: INVENTORY & EQUIPMENT VAULT */}
              {activeTab === "inventory" && (
                <InventoryView selectedCharacter={selectedCharacter} />
              )}

              {/* VIEW 5: ACCOUNT PROFILE */}
              {activeTab === "profile" && (
                <div className="p-4 sm:p-6 bg-[#5f3426]/80 border-2 border-[#a59075]/40 rounded-xl max-w-4xl mx-auto text-[#938f71] space-y-2 animate-fadeIn">
                  <h2 className="text-xl font-bold font-medieval text-[#f0e6d2]">
                    🛡️ Adventurer Profile
                  </h2>
                  <p className="text-xs text-[#a59075]">
                    Manage account credentials and preferences.
                  </p>
                </div>
              )}
            </>
          )}
        </MainContentArea>
      </div>
    </DashboardLayout>
  );
}
