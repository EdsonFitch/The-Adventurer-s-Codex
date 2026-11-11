/**
 * -----------------------------------------------------------------------------
 * SERVICE: Journal Service
 * -----------------------------------------------------------------------------
 * Centralized data service layer for handling all Supabase CRUD operations
 * related to character session journal entries, including banner URLs and
 * 8-field campaign tracking.
 *
 * Responsibilities:
 * - Fetch all session logs for a given character ID.
 * - Create a new blank or initialized session entry (with default banner support).
 * - Update existing session logs safely by sanitizing payload fields.
 * - Delete unwanted or erroneous session entries.
 */

import { supabase } from "../supabaseClient";

/**
 * Fetches all journal entries for a specific character, ordered by session number ascending.
 *
 * @param {string} characterId - The UUID of the active character.
 * @returns {Promise<{data: Array|null, error: Error|null}>} The list of journal entries or an error object.
 */
export async function fetchJournalEntries(characterId) {
  try {
    if (!characterId) {
      throw new Error("Character ID is required to fetch journal entries.");
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("character_id", characterId)
      .order("session_number", { ascending: true });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (err) {
    console.error("Error fetching journal entries:", err.message);
    return { data: null, error: err };
  }
}

/**
 * Creates a new journal entry record for a specific character in Supabase.
 *
 * @param {string} characterId - The UUID of the character this session belongs to.
 * @param {Object} entryData - Initial data for the session (session_number, title, banner_url, etc.).
 * @returns {Promise<{data: Object|null, error: Error|null}>} The newly created record or an error object.
 */
export async function createJournalEntry(characterId, entryData = {}) {
  try {
    if (!characterId) {
      throw new Error("Character ID is required to create a journal entry.");
    }

    const payload = {
      character_id: characterId,
      session_number: entryData.session_number || 1,
      title: entryData.title || "New Session",
      entry_date:
        entryData.entry_date || new Date().toISOString().split("T")[0],
      banner_url: entryData.banner_url || "",
      recap: entryData.recap || "",
      locations: entryData.locations || "",
      npcs: entryData.npcs || "",
      loot_magical: entryData.loot_magical || "",
      clues_mysteries: entryData.clues_mysteries || "",
      decisions_quests: entryData.decisions_quests || "",
      todo_next: entryData.todo_next || "",
      party_watch: entryData.party_watch || "",
    };

    const { data, error } = await supabase
      .from("journal_entries")
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (err) {
    console.error("Error creating journal entry:", err.message);
    return { data: null, error: err };
  }
}

/**
 * Updates an existing journal entry by its unique ID.
 * Sanitizes incoming fields to prevent updating read-only identifiers or timestamps.
 *
 * @param {string} entryId - The UUID of the journal entry row to update.
 * @param {Object} updatedFields - An object containing the fields to update (including banner_url).
 * @returns {Promise<{data: Object|null, error: Error|null}>} The updated record or an error object.
 */
export async function updateJournalEntry(entryId, updatedFields) {
  try {
    if (!entryId) {
      throw new Error("Entry ID is required to update a journal entry.");
    }

    // Strip primary keys or timestamps out of the update payload to prevent schema/RLS conflicts
    const { id, created_at, character_id, ...cleanFields } = updatedFields;

    const { data, error } = await supabase
      .from("journal_entries")
      .update(cleanFields)
      .eq("id", entryId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (err) {
    console.error("Error updating journal entry:", err.message || err);
    return { data: null, error: err };
  }
}

/**
 * Deletes a specific journal entry by its unique ID.
 *
 * @param {string} entryId - The UUID of the journal entry to delete.
 * @returns {Promise<{success: boolean, error: Error|null}>} Success indicator or an error object.
 */
export async function deleteJournalEntry(entryId) {
  try {
    if (!entryId) {
      throw new Error("Entry ID is required to delete a journal entry.");
    }

    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryId);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("Error deleting journal entry:", err.message);
    return { success: false, error: err };
  }
}
