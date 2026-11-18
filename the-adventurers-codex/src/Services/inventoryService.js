/**
 * -----------------------------------------------------------------------------
 * SERVICE: inventoryService.js
 * -----------------------------------------------------------------------------
 * Description:
 * Data access and business logic for managing character inventory items,
 * supporting item creation, quantity adjustments, equipping, and offsite stashing.
 * -----------------------------------------------------------------------------
 */

import { supabase } from "../supabaseClient";

/**
 * Fetches all inventory items for a specific character, joined with the master equipment catalog.
 *
 * @param {string} characterId - The UUID of the character.
 * @returns {Promise<Array>} List of inventory records.
 */
export async function fetchCharacterInventory(characterId) {
  if (!characterId) return [];

  const { data, error } = await supabase
    .from("character_inventory")
    .select("*, equipment(*)")
    .eq("character_id", characterId);

  if (error) {
    console.error("Error fetching character inventory:", error);
    throw error;
  }

  return data || [];
}

/**
 * Adds a new item from the master equipment catalog to a character's inventory.
 *
 * @param {string} characterId - The UUID of the character.
 * @param {string} equipmentId - The UUID of the master equipment item.
 * @param {number} quantity - Quantity to add (default 1).
 * @param {boolean} isOffsite - Whether stored in lair/stash (true) or carried (false).
 * @returns {Promise<Object>} The newly created inventory record.
 */
export async function addInventoryItem(
  characterId,
  equipmentId,
  quantity = 1,
  isOffsite = false,
) {
  const { data, error } = await supabase
    .from("character_inventory")
    .insert([
      {
        character_id: characterId,
        equipment_id: equipmentId,
        quantity: quantity,
        is_offsite: isOffsite,
        is_equipped: false,
      },
    ])
    .select("*, equipment(*)")
    .single();

  if (error) {
    console.error("Error adding inventory item:", error);
    throw error;
  }

  return data;
}

/**
 * Updates an existing inventory item's properties (quantity, equipped status, offsite status, notes).
 *
 * @param {string} inventoryId - The UUID of the character_inventory record.
 * @param {Object} updates - Key-value pairs of fields to update.
 * @returns {Promise<Object>} The updated inventory record.
 */
export async function updateInventoryItem(inventoryId, updates) {
  const { data, error } = await supabase
    .from("character_inventory")
    .update(updates)
    .eq("id", inventoryId)
    .select("*, equipment(*)")
    .single();

  if (error) {
    console.error("Error updating inventory item:", error);
    throw error;
  }

  return data;
}

/**
 * Deletes an inventory record from a character's inventory.
 *
 * @param {string} inventoryId - The UUID of the inventory record to delete.
 * @returns {Promise<boolean>} True if successful.
 */
export async function deleteInventoryItem(inventoryId) {
  const { error } = await supabase
    .from("character_inventory")
    .delete()
    .eq("id", inventoryId);

  if (error) {
    console.error("Error deleting inventory item:", error);
    throw error;
  }

  return true;
}
