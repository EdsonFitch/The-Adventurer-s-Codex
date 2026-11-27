/**
 * -----------------------------------------------------------------------------
 * COMPONENT: MainContentArea.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Scrollable main dashboard canvas. Renders either the active routed child
 * view (Character Sheet, Creator Wizard, Journal, Inventory) or the default
 * Adventurers Roster grid fetched from Supabase.
 *
 * Responsive Breakpoints & Touch Updates:
 * - Outer Canvas Padding: `p-3 sm:p-4 lg:p-6` preserves screen real estate on
 *   375px phones while keeping comfortable margins on tablets and desktops.
 * - Roster Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` gives phones 1
 *   full-width column, tablets 2 roomy columns, and desktops 3 columns.
 * - Touch-Friendly Delete Action: Always visible (`opacity-90`) with `p-2`
 *   tap padding rather than relying solely on desktop hover states.
 * - Overflow Protection: `min-w-0` and `truncate` prevent long character names
 *   from stretching cards past the screen edge.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onSelectCharacter - Opens selected character's sheet.
 * @param {Function} props.onOpenCreator - Opens Character Creator Wizard.
 * @param {number} props.refreshTrigger - Re-fetches character roster when incremented.
 * @param {React.ReactNode} props.children - Active sub-view rendered instead of roster.
 * -----------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export default function MainContentArea({
  onSelectCharacter,
  onOpenCreator,
  refreshTrigger,
  children,
}) {
  // Fetched adventurer records from Supabase
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tracks which character ID is currently undergoing cascading deletion
  const [deletingId, setDeletingId] = useState(null);

  /**
   * Effect Hook: Fetches user's characters sorted newest-first whenever
   * `refreshTrigger` increments.
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
        console.error("Error loading adventurer roster cards:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCharactersRoster();
  }, [refreshTrigger]);

  /**
   * Extracts the bucket-relative storage path from a full Supabase public URL.
   */
  const getStoragePathFromUrl = (url, bucketName) => {
    if (!url) return null;
    try {
      const parts = url.split(`${bucketName}/`);
      return parts.length > 1 ? parts[1] : null;
    } catch {
      return null;
    }
  };

  /**
   * Cascading Character Deletion Handler:
   * 1. Removes journal banner files from `journal-banners` storage bucket.
   * 2. Removes character portrait from `character-artwork` storage bucket.
   * 3. Deletes dependent rows in `character_spells` and `journal_entries`.
   * 4. Deletes the character row in `characters` and updates local state.
   */
  const handleDeleteCharacter = async (e, character) => {
    // Prevent card click from opening the character sheet
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to banish ${character.name} to the void? All journal entries, stats, and stored artwork will be permanently deleted.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(character.id);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id || character.user_id;

      // STEP A: Remove session banners from Supabase Storage
      if (userId && character.id) {
        const folderPath = `${userId}/${character.id}/banners`;
        const { data: bannerFiles, error: listBannerErr } =
          await supabase.storage.from("journal-banners").list(folderPath);

        if (!listBannerErr && bannerFiles && bannerFiles.length > 0) {
          const filesToRemove = bannerFiles.map(
            (file) => `${folderPath}/${file.name}`,
          );
          const { error: removeBannersErr } = await supabase.storage
            .from("journal-banners")
            .remove(filesToRemove);

          if (removeBannersErr) {
            console.error(
              "Error removing session banners from storage:",
              removeBannersErr,
            );
          }
        }
      }

      // STEP B: Remove character portrait from Supabase Storage
      if (character.portrait_url) {
        const portraitPath = getStoragePathFromUrl(
          character.portrait_url,
          "character-artwork",
        );
        if (portraitPath) {
          await supabase.storage
            .from("character-artwork")
            .remove([portraitPath]);
        }
      }

      // STEP C: Clear relational database records
      const { error: spellDeleteErr } = await supabase
        .from("character_spells")
        .delete()
        .eq("character_id", character.id);

      if (spellDeleteErr) {
        console.error(
          "Error clearing character spells during deletion:",
          spellDeleteErr,
        );
      }

      const { error: journalDeleteErr } = await supabase
        .from("journal_entries")
        .delete()
        .eq("character_id", character.id);

      if (journalDeleteErr) {
        console.error(
          "Error clearing journal entries during deletion:",
          journalDeleteErr,
        );
      }

      // STEP D: Delete primary character record
      const { error: charDeleteErr } = await supabase
        .from("characters")
        .delete()
        .eq("id", character.id);

      if (charDeleteErr) throw charDeleteErr;

      // STEP E: Optimistically remove deleted card from UI
      setCharacters((prevCharacters) =>
        prevCharacters.filter((c) => c.id !== character.id),
      );

      console.log(
        `Character ${character.name} and all associated files wiped successfully.`,
      );
    } catch (err) {
      console.error("Error deleting character from Supabase:", err);
      alert(`Failed to delete character: ${err.message || "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 bg-[#3d1c14] text-[#938f71]">
      {/* Render active sub-view if selected; otherwise display Adventurers Roster */}
      {children ? (
        children
      ) : (
        <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
          {/* Roster Heading */}
          <div className="text-center space-y-1 px-2">
            <h2 className="text-xl sm:text-2xl font-medieval font-bold text-[#f0e6d2]">
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
            /* Responsive Roster Grid: 1 col (phone) -> 2 cols (tablet) -> 3 cols (desktop) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {characters.map((char) => (
                <div
                  key={char.id}
                  onClick={() => onSelectCharacter(char)}
                  className="group relative bg-[#5f3426] border-2 border-[#a59075]/40 rounded-xl p-4 sm:p-5 cursor-pointer hover:border-[#a59075] transition shadow-xl flex flex-col justify-between min-w-0"
                >
                  {/* Card Header: Portrait Thumbnail, Name/Level, and Delete Button */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-[#4a261c] border border-[#a59075]/40 overflow-hidden flex items-center justify-center flex-shrink-0">
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
                      <div className="min-w-0">
                        <h3 className="font-bold font-medieval text-base sm:text-lg text-[#f0e6d2] truncate">
                          {char.name}
                        </h3>
                        <p className="text-xs text-[#889c9b]">
                          Level {char.level || 1} •{" "}
                          {char.alignment_code || "LN"}
                        </p>
                      </div>
                    </div>

                    {/* Touch-Accessible Delete Button */}
                    <button
                      type="button"
                      title="Delete Character"
                      disabled={deletingId === char.id}
                      onClick={(e) => handleDeleteCharacter(e, char)}
                      className="p-2 rounded-lg bg-red-950/40 hover:bg-red-800/60 border border-red-500/30 text-red-300 opacity-90 sm:opacity-80 group-hover:opacity-100 transition shadow flex-shrink-0"
                    >
                      {deletingId === char.id ? (
                        <span className="text-xs animate-spin">⏳</span>
                      ) : (
                        <span className="text-xs">🗑️</span>
                      )}
                    </button>
                  </div>

                  {/* Card Footer */}
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

              {/* Character Creator Wizard Launch Card */}
              <div
                onClick={onOpenCreator}
                className="border-2 border-dashed border-[#a59075]/50 rounded-xl p-5 sm:p-6 cursor-pointer hover:border-[#a59075] hover:bg-[#5f3426]/30 transition flex flex-col items-center justify-center text-center space-y-3 min-h-[160px]"
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
                <span className="text-xs font-bold text-amber-400 pt-1">
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
