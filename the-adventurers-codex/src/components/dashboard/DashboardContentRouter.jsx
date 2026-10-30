import React, { useState } from "react";

// 1. Import structural layout and navigation sub-components
import DashboardLayout from "./DashboardLayout";
import TopNavbar from "./TopNavbar";
import LeftSidebar from "./LeftSidebar";
import MainContentArea from "./MainContentArea";

/**
 * DashboardContentRouter Component
 * -----------------------------------------------------------------------------
 * Acts as the master orchestrator and state controller for the player dashboard.
 * Coordinates active tabs, sidebar collapse state, and layout containment.
 */
export default function DashboardContentRouter() {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState("characters");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // ---------------------------------------------------------------------------
  // DYNAMIC SUBTITLE HELPER
  // ---------------------------------------------------------------------------
  const getNavbarSubtitle = () => {
    switch (activeTab) {
      case "characters":
        return "Dashboard / Characters";
      case "character-sheet":
        return "Character Sheet";
      case "journal":
        return "Journal Entries";
      case "inventory":
        return "Inventory Management";
      case "character-creation":
        return "Character Creation Wizard";
      case "profile":
        return "Adventurer Profile";
      default:
        return "Dashboard";
    }
  };

  // ---------------------------------------------------------------------------
  // DYNAMIC VIEW SWITCHER LOGIC
  // ---------------------------------------------------------------------------
  const renderActiveViewContent = () => {
    switch (activeTab) {
      case "characters":
        return null; // Handled by MainContentArea default card grid

      case "character-sheet":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-metamorphous text-[#938f71]">
              Character Sheet
            </h2>
            <p className="text-xs text-[#a59075] font-antiqua">
              {selectedCharacter
                ? `Viewing sheet for ${selectedCharacter.name} (${selectedCharacter.charClass}).`
                : "Please select a character from your dashboard to view their sheet."}
            </p>
          </div>
        );

      case "journal":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-metamorphous text-[#938f71]">
              Journal Entries
            </h2>
            <p className="text-xs text-[#a59075] font-antiqua">
              Chronicle campaign sessions, key NPC encounters, quest objectives,
              and lore notes.
            </p>
          </div>
        );

      case "inventory":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-metamorphous text-[#938f71]">
              Inventory Management
            </h2>
            <p className="text-xs text-[#a59075] font-antiqua">
              Manage equipment loadouts, track gold pieces, encumbrance, and
              magical artifacts.
            </p>
          </div>
        );

      case "character-creation":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-metamorphous text-[#938f71]">
              Character Creation
            </h2>
            <p className="text-xs text-[#a59075] font-antiqua">
              Step-by-step wizard to roll ability scores, select race/class, and
              forge a new adventurer.
            </p>
          </div>
        );

      case "profile":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-metamorphous text-[#938f71]">
              Adventurer Profile
            </h2>
            <p className="text-xs text-[#a59075] font-antiqua">
              Manage player profile details, account credentials, and display
              preferences.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // EVENT HANDLERS
  // ---------------------------------------------------------------------------
  const handleSelectCharacter = (character) => {
    setSelectedCharacter(character);
    setActiveTab("character-sheet");
  };

  const handleOpenCreator = () => {
    setActiveTab("character-creation");
  };

  return (
    // 1. Structural Layout Wrapper Shell
    <DashboardLayout>
      {/* 2. Persistent Top Navigation Bar (Placed at the root of the layout flex stack) */}
      <TopNavbar
        subtitle={getNavbarSubtitle()}
        selectedCharacter={selectedCharacter}
      />

      {/* 3. Lower Body Container holding Sidebar and Main Content side-by-side */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <LeftSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />

        {/* Main Scrollable Content Canvas */}
        <MainContentArea
          onSelectCharacter={handleSelectCharacter}
          onOpenCreator={handleOpenCreator}
        >
          {renderActiveViewContent()}
        </MainContentArea>
      </div>
    </DashboardLayout>
  );
}
