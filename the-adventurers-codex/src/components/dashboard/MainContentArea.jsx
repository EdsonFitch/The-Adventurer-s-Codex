/**
 * -----------------------------------------------------------------------------
 * COMPONENT: MainContentArea
 * -----------------------------------------------------------------------------
 * Manages the main dashboard content canvas. It renders either sub-views
 * (like the Character Creator Wizard or Character Sheet) or defaults to
 * displaying the user's active adventurer cards roster fetched from Supabase.
 *
 * Includes optimistic roster synchronization and robust cascading character
 * deletion from Supabase (clearing relational tables, journal entries, and
 * cleaning up Supabase Storage artwork and session banners).
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onSelectCharacter - Callback triggered when clicking a character card to open their sheet.
 * @param {Function} props.onOpenCreator - Callback triggered to switch the view to the Character Creator Wizard.
 * @param {number} props.refreshTrigger - Counter prop that forces the roster effect hook to re-fetch when incremented.
 * @param {React.ReactNode} props.children - Sub-views rendered inside the container if active.
 */

import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export default function MainContentArea({
  onSelectCharacter,
  onOpenCreator,
  refreshTrigger,
  children,
}) {
  // Local state for fetched character records from Supabase
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tracks which individual character card is currently executing a deletion query
  const [deletingId, setDeletingId] = useState(null);

  /**
   * ---------------------------------------------------------------------------
   * EFFECT HOOK: fetchCharactersRoster
   * ---------------------------------------------------------------------------
   * Fetches all character records belonging to the user from the Supabase
   * 'characters' table, sorted by creation date descending.
   * Re-runs whenever `refreshTrigger` changes (e.g., after forging a new hero).
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
   * Helper utility to safely extract bucket relative path from full public Supabase URL.
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
   * ---------------------------------------------------------------------------
   * HANDLER: handleDeleteCharacter
   * ---------------------------------------------------------------------------
   * Permanently deletes a character record, all dependent database rows
   * (spells, journal entries), and cleans up all associated images in
   * Supabase Storage ('character-artwork' and 'journal-banners' buckets).
   *
   * @param {Event} e - Mouse click event object (stopped from propagating to card click).
   * @param {Object} character - The character record targeted for deletion.
   */
  const handleDeleteCharacter = async (e, character) => {
    // 1. Stop event bubbling so clicking delete doesn't trigger card's `onSelectCharacter`
    e.stopPropagation();

    // 2. Prompt user confirmation to prevent accidental deletions
    const confirmed = window.confirm(
      `Are you sure you want to banish ${character.name} to the void? All journal entries, stats, and stored artwork will be permanently deleted.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(character.id);

      // Get authenticated user ID for scoped storage cleanup
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id || character.user_id;

      // -----------------------------------------------------------------------
      // STEP A: Clean up Storage Bucket ('journal-banners')
      // -----------------------------------------------------------------------
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

      // -----------------------------------------------------------------------
      // STEP B: Clean up Storage Bucket ('character-artwork')
      // -----------------------------------------------------------------------
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

      // -----------------------------------------------------------------------
      // STEP C: Clear Relational DB Tables
      // -----------------------------------------------------------------------
      // 1. Clear character spells
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

      // 2. Clear journal entries
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

      // -----------------------------------------------------------------------
      // STEP D: Delete Main Character Record
      // -----------------------------------------------------------------------
      const { error: charDeleteErr } = await supabase
        .from("characters")
        .delete()
        .eq("id", character.id);

      if (charDeleteErr) throw charDeleteErr;

      // -----------------------------------------------------------------------
      // STEP E: Optimistic State Update
      // -----------------------------------------------------------------------
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
    <div className="flex-1 overflow-y-auto p-6 bg-[#3d1c14] text-[#938f71]">
      {/* Conditional Rendering: If child view exists (Wizard/Sheet), render it */}
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
              {/* Map through fetched character records and render card components */}
              {characters.map((char) => (
                <div
                  key={char.id}
                  onClick={() => onSelectCharacter(char)}
                  className="group relative bg-[#5f3426] border-2 border-[#a59075]/40 rounded-xl p-5 cursor-pointer hover:border-[#a59075] transition shadow-xl flex flex-col justify-between"
                >
                  {/* Card Header: Portrait, Info, and Delete Button */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Thumbnail Container */}
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
                          Level {char.level || 1} •{" "}
                          {char.alignment_code || "LN"}
                        </p>
                      </div>
                    </div>

                    {/* Delete Action Icon Button */}
                    <button
                      type="button"
                      title="Delete Character"
                      disabled={deletingId === char.id}
                      onClick={(e) => handleDeleteCharacter(e, char)}
                      className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-800/60 border border-red-500/30 text-red-300 opacity-80 group-hover:opacity-100 transition shadow"
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
