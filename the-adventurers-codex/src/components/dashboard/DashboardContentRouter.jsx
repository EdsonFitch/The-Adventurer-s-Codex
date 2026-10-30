import React, { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import TopNavbar from "./TopNavbar";
import LeftSidebar from "./LeftSidebar";
import MainContentArea from "./MainContentArea";
import CharacterCreatorWizard from "../character-creator/CharacterCreatorWizard";

/**
 * DashboardContentRouter Component
 * -----------------------------------------------------------------------------
 * Master view router for authenticated users. Manages active tab state and
 * coordinates the layout shell, sidebars, and active child content.
 *
 * @returns {JSX.Element} The rendered dashboard layout container.
 */
export default function DashboardContentRouter() {
  // ---------------------------------------------------------------------------
  // 1. STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  // Active navigation tab matching LeftSidebar keys ('characters', 'character-creation', etc.)
  const [activeTab, setActiveTab] = useState("characters");

  // Controls collapsed vs expanded state for LeftSidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Holds currently selected character object for sheet and campaign tracking
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // ---------------------------------------------------------------------------
  // 2. VIEW TRANSITION HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * Triggers when a character card is clicked in the roster grid.
   * Switches active view to the character sheet.
   */
  const handleSelectCharacter = (character) => {
    setSelectedCharacter(character);
    setActiveTab("character-sheet");
  };

  /**
   * Triggers when a new character is forged in the wizard.
   * Switches view back to the character roster grid.
   */
  const handleCharacterForged = (forgedCharacter) => {
    console.log("Hero successfully forged in Supabase:", forgedCharacter);
    setSelectedCharacter(forgedCharacter);
    setActiveTab("characters");
  };

  /**
   * Computes top navbar subtitle dynamically based on active tab.
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
  // 3. RENDER UI STRUCTURE
  // ---------------------------------------------------------------------------
  return (
    <DashboardLayout>
      {/* Persistent Top Navigation Bar */}
      <TopNavbar
        subtitle={getHeaderSubtitle()}
        selectedCharacter={selectedCharacter}
      />

      {/* Main Layout Body (Sidebar + Content Area) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Left Navigation Sidebar */}
        <LeftSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />

        {/* 
          Main Content Canvas:
          - When activeTab is 'characters', children is falsy, triggering MainContentArea's 
            default grid view (containing mock character cards + the Character Creator card).
          - When activeTab is a sub-view, renders the requested component.
        */}
        <MainContentArea
          onSelectCharacter={handleSelectCharacter}
          onOpenCreator={() => setActiveTab("character-creation")}
        >
          {activeTab !== "characters" && (
            <>
              {/* VIEW: CHARACTER CREATOR WIZARD */}
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

                  <CharacterCreatorWizard onComplete={handleCharacterForged} />
                </div>
              )}

              {/* VIEW: CHARACTER SHEET */}
              {activeTab === "character-sheet" && (
                <div className="p-6 bg-[#5f3426]/80 border-2 border-[#a59075]/40 rounded-xl max-w-4xl mx-auto space-y-4 text-[#938f71] shadow-2xl animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-[#a59075]/30 pb-3">
                    <h2 className="text-xl font-bold font-medieval text-[#f0e6d2]">
                      {selectedCharacter?.name || "Hero Sheet"}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("characters")}
                      className="px-3 py-1.5 bg-[#4a261c] hover:bg-[#5f3426] border border-[#a59075]/40 rounded text-xs text-[#f0e6d2] transition"
                    >
                      ← Back to Roster
                    </button>
                  </div>
                  <p className="text-xs text-[#a59075]">
                    Viewing character record for{" "}
                    <strong className="text-[#f0e6d2]">
                      {selectedCharacter?.name || "Selected Hero"}
                    </strong>
                    .
                  </p>
                </div>
              )}

              {/* VIEW: JOURNAL ENTRIES */}
              {activeTab === "journal" && (
                <div className="p-6 bg-[#5f3426]/80 border-2 border-[#a59075]/40 rounded-xl max-w-4xl mx-auto text-[#938f71] space-y-2 animate-fadeIn">
                  <h2 className="text-xl font-bold font-medieval text-[#f0e6d2]">
                    📖 Campaign Journal
                  </h2>
                  <p className="text-xs text-[#a59075]">
                    Record campaign logs and session notes.
                  </p>
                </div>
              )}

              {/* VIEW: INVENTORY */}
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

              {/* VIEW: PROFILE */}
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
