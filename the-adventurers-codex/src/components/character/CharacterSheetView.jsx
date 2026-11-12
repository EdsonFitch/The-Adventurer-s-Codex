/**
 * -----------------------------------------------------------------------------
 * COMPONENT: CharacterSheetView.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Master container for the character sheet view. Restores the clean full-width
 * bottom layout for the multi-tab workspace while keeping stats organized on top.
 * -----------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import {
  fetchFullCharacterSheet,
  updateCharacterLiveStats,
  executeRest,
} from "../../services/characterService";
import CharacterSheetBanner from "./CharacterSheetBanner";
import UpperStatsRibbon from "./UpperStatsRibbon";
import MainStatsGrid from "./MainStatsGrid";
import SheetTabsSection from "./SheetTabsSection";

export default function CharacterSheetView({
  selectedCharacter,
  onBackToRoster,
  userName,
}) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSheet() {
      if (!selectedCharacter?.id) return;
      try {
        setLoading(true);
        const data = await fetchFullCharacterSheet(selectedCharacter.id);
        setCharacter(data);
      } catch (err) {
        console.error("Failed to load full character sheet:", err);
        setError("Failed to load character sheet from database.");
      } finally {
        setLoading(false);
      }
    }
    loadSheet();
  }, [selectedCharacter?.id]);

  const handleLiveUpdate = async (updates) => {
    if (!character?.id) return;
    try {
      setCharacter((prev) => ({ ...prev, ...updates }));
      await updateCharacterLiveStats(character.id, updates);
    } catch (err) {
      console.error("Failed to save updates:", err);
    }
  };

  const handleRest = async (restType) => {
    if (!character?.id) return;
    try {
      const updated = await executeRest(character.id, restType, character);
      setCharacter((prev) => ({ ...prev, ...updated }));
      alert(
        `${restType === "LONG" ? "Long Rest" : "Short Rest"} completed successfully!`,
      );
    } catch (err) {
      console.error("Failed to execute rest:", err);
      alert("Error executing rest.");
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[#f0e6d2] font-medieval text-lg">
        ⚔️ Conjuring character sheet from the chronicles...
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="p-6 bg-red-950/60 border border-red-500 rounded-xl text-center text-red-300 space-y-3">
        <p>{error || "Character not found."}</p>
        <button
          type="button"
          onClick={onBackToRoster}
          className="px-4 py-1.5 bg-[#4a261c] border border-amber-500/40 rounded text-xs text-[#f0e6d2]"
        >
          ← Return to Roster
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* 1. TOP BANNER */}
      <CharacterSheetBanner
        character={character}
        userName={userName}
        onShortRest={() => handleRest("SHORT")}
        onLongRest={() => handleRest("LONG")}
        onLevelUp={() => alert("Level Up Wizard coming soon!")}
        onBackToRoster={onBackToRoster}
      />

      {/* 2. UPPER STATS & HEALTH RIBBON */}
      <UpperStatsRibbon
        character={character}
        onUpdateHp={(hpUpdates) => handleLiveUpdate(hpUpdates)}
        onToggleInspiration={(val) => handleLiveUpdate({ inspiration: val })}
      />

      {/* 3. MAIN STATS & COMBAT GRID */}
      <MainStatsGrid
        character={character}
        onUpdateConditions={(conds) =>
          handleLiveUpdate({ active_conditions: conds })
        }
        onUpdateResistances={(res) => handleLiveUpdate({ resistances: res })}
      />

      {/* 4. FULL-WIDTH INTERACTIVE 5-TAB WORKSPACE AT THE BOTTOM */}
      <SheetTabsSection
        character={character}
        onUpdateSpellSlots={(slots) =>
          handleLiveUpdate({ spell_slots_used: slots })
        }
      />
    </div>
  );
}
