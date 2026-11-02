import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

/**
 * MainContentArea Component
 * -----------------------------------------------------------------------------
 * Manages the rendering of the active content canvas, including the Adventurers
 * Roster grid containing character cards and the Character Creator card trigger.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onSelectCharacter - Callback when a character card is clicked.
 * @param {Function} props.onOpenCreator - Callback to switch view to the character creator wizard.
 * @param {number} props.refreshTrigger - Counter prop that forces a re-fetch when incremented.
 * @param {React.ReactNode} props.children - Sub-views (wizard, sheet, journal, etc.).
 */
export default function MainContentArea({
  onSelectCharacter,
  onOpenCreator,
  refreshTrigger,
  children,
}) {
  // Local state for fetched character records from Supabase
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Effect Hook: Fetches character cards from Supabase.
   * Re-runs whenever `refreshTrigger` changes (i.e., when a new hero is forged).
   */
  useEffect(() => {
    async function fetchCharactersRoster() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("characters")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCharacters(data || []);
      } catch (err) {
        console.error("Error loading roster cards:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCharactersRoster();
  }, [refreshTrigger]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#3d1c14] text-[#938f71]">
      {/* If children exist (meaning we are on a sub-tab like wizard, sheet, etc.), render them */}
      {children ? (
        children
      ) : (
        /* DEFAULT VIEW: Adventurers Roster Grid */
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-medieval font-bold text-[#f0e6d2]">
              Your Adventurers
            </h2>
            <p className="text-xs text-[#a59075]">
              Select an active hero to view their details or Forge a new hero
              for your next quest.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-[#889c9b]">
              Consulting archives for your heroes...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Render existing character cards from Supabase */}
              {characters.map((char) => (
                <div
                  key={char.id}
                  onClick={() => onSelectCharacter(char)}
                  className="bg-[#5f3426] border-2 border-[#a59075]/40 rounded-xl p-5 cursor-pointer hover:border-[#a59075] transition shadow-xl flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-lg bg-[#4a261c] border border-[#a59075]/40 overflow-hidden flex items-center justify-center">
                      {char.portrait_url ? (
                        <img
                          src={char.portrait_url}
                          alt={char.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">🛡️</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold font-medieval text-lg text-[#f0e6d2]">
                        {char.name}
                      </h3>
                      <p className="text-xs text-[#889c9b]">
                        Level {char.level || 1} • {char.alignment_code || "LN"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#a59075]/20 flex justify-between items-center text-xs">
                    <span className="text-[#a59075]">
                      HP: {char.hp_max || 10}
                    </span>
                    <span className="text-[#f0e6d2] font-bold hover:underline">
                      Open Sheet →
                    </span>
                  </div>
                </div>
              ))}

              {/* Character Creator Wizard Trigger Card */}
              <div
                onClick={onOpenCreator}
                className="border-2 border-dashed border-[#a59075]/50 rounded-xl p-6 cursor-pointer hover:border-[#a59075] hover:bg-[#5f3426]/30 transition flex flex-col items-center justify-center text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-[#5f3426] border border-[#a59075]/60 flex items-center justify-center text-amber-400 text-xl shadow">
                  ✨
                </div>
                <div>
                  <h3 className="font-bold font-medieval text-base text-[#f0e6d2]">
                    Character Creator
                  </h3>
                  <p className="text-[11px] text-[#a59075] mt-1">
                    Forge a brand new adventurer from the ground up, roll
                    ability scores, and craft backstories.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-400 pt-2">
                  Start Creation Wizard +
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
