/**
 * -----------------------------------------------------------------------------
 * COMPONENT: DashboardContentRouter.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Master view router and layout coordinator for authenticated users.
 * Manages the active sidebar navigation tab state, holds the currently selected
 * character object for the character sheet, coordinates roster refresh triggers,
 * and integrates the newly built interactive CharacterSheetView component.
 * -----------------------------------------------------------------------------
 */

import React, { useState } from "react";
// Import useAuth hook to supply user ID and metadata for RLS and display
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "./DashboardLayout";
import TopNavbar from "./TopNavbar";
import LeftSidebar from "./LeftSidebar";
import MainContentArea from "./MainContentArea";
import CharacterCreatorWizard from "../character-creator/CharacterCreatorWizard";
import JournalView from "../diary/JournalView";
// Import master interactive CharacterSheetView component
import CharacterSheetView from "../character/CharacterSheetView";

export default function DashboardContentRouter() {
  // ---------------------------------------------------------------------------
  // 1. AUTHENTICATION & MASTER STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  const { user } = useAuth();

  // Active navigation tab key matching LeftSidebar items ('characters', 'character-sheet', etc.)
  const [activeTab, setActiveTab] = useState("characters");

  // Controls collapsed vs expanded state for LeftSidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Holds the active character object selected for the sheet and campaign views
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // Trigger state counter to instruct MainContentArea to re-fetch roster cards after hero creation
  const [characterRefreshTrigger, setCharacterRefreshTrigger] = useState(0);

  // ---------------------------------------------------------------------------
  // 2. NAVIGATION & EVENT HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * Triggers when a character card is clicked in the roster grid.
   * Sets the active character and switches view to the character sheet.
   *
   * @param {Object} character - The selected character record.
   */
  const handleSelectCharacter = (character) => {
    setSelectedCharacter(character);
    setActiveTab("character-sheet");
  };

  /**
   * Triggers when a new character is successfully forged in the creation wizard.
   * Updates selected hero state, increments refresh trigger, and returns to roster.
   *
   * @param {Object} forgedCharacter - Newly created character record from Supabase.
   */
  const handleCharacterForged = (forgedCharacter) => {
    setSelectedCharacter(forgedCharacter);
    setCharacterRefreshTrigger((prev) => prev + 1);
    setActiveTab("characters");
  };

  /**
   * Computes top navbar subtitle dynamically based on the currently active tab.
   *
   * @returns {string} Dynamic header subtitle string.
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
        return "Inventory";
      case "profile":
        return "Account Profile";
      case "characters":
      default:
        return "Adventurers Roster";
    }
  };

  // ---------------------------------------------------------------------------
  // 3. RENDER UI LAYOUT & ROUTED CONTENT VIEWS
  // ---------------------------------------------------------------------------
  return (
    <DashboardLayout>
      {/* Persistent Top Navigation Bar with dynamic subtitle */}
      <TopNavbar
        subtitle={getHeaderSubtitle()}
        selectedCharacter={selectedCharacter}
      />

      {/* Main Layout Body: Left Sidebar + Dynamic Content Canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Left Navigation Sidebar */}
        <LeftSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />

        {/* Main Content Area Canvas */}
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
                      className="px-3 py-1.5 bg-[#5f3426] hover:bg-[#937460]/40 border border-[#a59075]/40 rounded text-xs text-[#938f71] transition flex items-center space-x-2 shadow"
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

              {/* VIEW 2: MASTER INTERACTIVE CHARACTER SHEET */}
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

              {/* VIEW 3: JOURNAL ENTRIES */}
              {activeTab === "journal" && (
                <JournalView selectedCharacter={selectedCharacter} />
              )}

              {/* VIEW 4: INVENTORY VAULT */}
              {activeTab === "inventory" && (
                <div className="p-6 bg-[#5f3426]/80 border-2 border-[#a59075]/40 rounded-xl max-w-4xl mx-auto text-[#938f71] space-y-2 animate-fadeIn">
                  <h2 className="text-xl font-bold font-medieval text-[#f0e6d2]">
                    🎒 Party Inventory & Vault
                  </h2>
                  <p className="text-xs text-[#a59075]">
                    Track gold, equipment, and items.
                  </p>
                </div>
              )}

              {/* VIEW 5: ACCOUNT PROFILE */}
              {activeTab === "profile" && (
                <div className="p-6 bg-[#5f3426]/80 border-2 border-[#a59075]/40 rounded-xl max-w-4xl mx-auto text-[#938f71] space-y-2 animate-fadeIn">
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
