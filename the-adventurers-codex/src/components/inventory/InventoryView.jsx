/**
 * -----------------------------------------------------------------------------
 * COMPONENT: InventoryView.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Standalone view for managing a character's carried inventory and stronghold
 * lair stash. Supports live encumbrance calculations, equipping armor/weapons,
 * adjusting item quantities, transferring items between pack and lair, and
 * adding items from the master Supabase equipment catalog.
 *
 * Responsive & Touch Behavior:
 * - Header & Encumbrance Widget: Stacks cleanly on phones (`flex-col md:flex-row`)
 *   with `min-w-0` and `break-words` so long hero names never overflow.
 * - Scrollable Sub-Tab Strip: Uses `flex-nowrap overflow-x-auto` with
 *   `min-w-max` so all 3 sub-tabs stay on one swipeable row on 375px phones.
 * - Touchscreen Steppers & Actions: Enlarges quantity `-`/`+` buttons to
 *   `w-7 h-7 sm:w-6 sm:h-6` and increases padding on `Equip`, `Store in Lair`,
 *   `Discard`, and `+ Add to Inventory` controls.
 * - Catalog Grid: Uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` so tablets
 *   get 2 roomy columns instead of 3 cramped columns at `768px`.
 * - Mobile Search Input: Uses `text-sm sm:text-xs` to prevent mobile browser
 *   auto-zoom when focusing the search bar.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.selectedCharacter - Active character record from router.
 * -----------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import {
  fetchCharacterInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "../../services/inventoryService";
import { calculateEncumbrance } from "../../utils/encumbranceCalculator";
import { supabase } from "../../supabaseClient";

export default function InventoryView({ selectedCharacter }) {
  const [inventory, setInventory] = useState([]);
  const [equipmentCatalog, setEquipmentCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Sub-tab view: 'carried' | 'stash' | 'add-item'
  const [activeSubTab, setActiveSubTab] = useState("carried");

  // Search and category filters for the master equipment catalog tab
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  useEffect(() => {
    if (selectedCharacter?.id) {
      loadInventoryData();
    }
  }, [selectedCharacter?.id]);

  /**
   * Fetches the character's inventory rows and master equipment catalog in parallel.
   */
  async function loadInventoryData() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [invData, { data: catalogData, error: catErr }] = await Promise.all(
        [
          fetchCharacterInventory(selectedCharacter.id),
          supabase.from("equipment").select("*").order("name"),
        ],
      );

      if (catErr) throw catErr;

      setInventory(invData || []);
      setEquipmentCatalog(catalogData || []);
    } catch (err) {
      console.error("Failed to load inventory:", err);
      setErrorMsg("Failed to load inventory vault from Supabase.");
    } finally {
      setLoading(false);
    }
  }

  if (!selectedCharacter) {
    return (
      <div className="p-6 sm:p-8 text-center bg-[#5f3426] border-2 border-amber-600/40 rounded-xl text-amber-200 max-w-3xl mx-auto">
        <h3 className="text-lg font-medieval font-bold">
          No Adventurer Selected
        </h3>
        <p className="text-xs text-[#889c9b] mt-1">
          Please select an active hero from your Roster to manage their
          inventory vault.
        </p>
      </div>
    );
  }

  // Extract Strength score to calculate carrying capacity and encumbrance status
  const strengthScore =
    selectedCharacter.stats?.str ||
    selectedCharacter.computed?.abilityScores?.str ||
    10;

  const encumbrance = calculateEncumbrance(inventory, strengthScore);

  // Partition items between carried gear and offsite stronghold/lair stash
  const carriedItems = inventory.filter((item) => !item.is_offsite);
  const stashItems = inventory.filter((item) => item.is_offsite);

  /**
   * Toggles boolean item flags (`is_equipped` or `is_offsite`) in Supabase.
   */
  async function handleToggleProperty(item, propertyKey) {
    try {
      const newValue = !item[propertyKey];
      const updated = await updateInventoryItem(item.id, {
        [propertyKey]: newValue,
      });
      setInventory((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      alert("Failed to update item state.");
    }
  }

  /**
   * Increments or decrements item stack quantity; prompts removal if reduced to 0.
   */
  async function handleQuantityChange(item, delta) {
    const newQty = (item.quantity || 1) + delta;
    if (newQty <= 0) {
      if (
        confirm(
          `Remove ${item.equipment?.name || item.custom_name} from inventory?`,
        )
      ) {
        await handleRemoveItem(item.id);
      }
      return;
    }

    try {
      const updated = await updateInventoryItem(item.id, { quantity: newQty });
      setInventory((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      alert("Failed to update quantity.");
    }
  }

  /**
   * Permanently deletes an item row from `character_inventory`.
   */
  async function handleRemoveItem(itemId) {
    try {
      await deleteInventoryItem(itemId);
      setInventory((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      alert("Failed to delete item.");
    }
  }

  /**
   * Inserts a selected catalog equipment item into the character's inventory.
   */
  async function handleAddCatalogItem(catalogItem) {
    try {
      const isOffsite = activeSubTab === "stash";
      const newItem = await addInventoryItem(
        selectedCharacter.id,
        catalogItem.id,
        1,
        isOffsite,
      );
      setInventory((prev) => [...prev, newItem]);
      alert(
        `Added ${catalogItem.name} to ${isOffsite ? "Lair Stash" : "Carried Gear"}!`,
      );
    } catch (err) {
      alert("Failed to add item to inventory.");
    }
  }

  // Catalog filter options
  const categories = [
    "All",
    "Weapon",
    "Armor",
    "Potion",
    "Scroll",
    "Adventuring Gear",
    "Tools",
  ];

  const filteredCatalog = equipmentCatalog.filter((eq) => {
    const matchesSearch = eq.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCat =
      selectedCategoryFilter === "All" ||
      eq.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase());
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 animate-fadeIn font-antiqua">
      {/* =====================================================================
        HEADER BANNER & LIVE ENCUMBRANCE WIDGET
        ===================================================================== */}
      <div className="p-3.5 sm:p-5 bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-medieval font-bold text-[#f0e6d2] break-words">
            🎒 Inventory & Stronghold Vault: {selectedCharacter.name}
          </h2>
          <p className="text-xs text-[#889c9b] mt-0.5">
            Manage carried gear, active armor/weapons, and secure lair stashes.
          </p>
        </div>

        {/* Encumbrance Summary Box (full-width on phones, auto-sized on `md+`) */}
        <div className="w-full md:w-auto px-3.5 py-2 bg-[#361a12] border border-amber-500/30 rounded-lg text-xs space-y-1 shrink-0">
          <div className="flex justify-between gap-4">
            <span className="text-[#889c9b]">Carried Weight:</span>
            <strong className="text-amber-300">
              {encumbrance.totalWeight} / {encumbrance.maxCapacity} lbs
            </strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#889c9b]">Status:</span>
            <span
              className={`font-bold ${
                encumbrance.status === "Normal"
                  ? "text-emerald-400"
                  : encumbrance.status === "Encumbered"
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {encumbrance.status}
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-900/40 border border-red-500 rounded text-xs text-red-200">
          {errorMsg}
        </div>
      )}

      {/* =====================================================================
        SUB-TAB NAVIGATION BAR — HORIZONTALLY SCROLLABLE ON MOBILE
        - `flex-nowrap overflow-x-auto` with `min-w-max` prevents the 3 tab
          buttons from overflowing 375px screens while remaining easy to tap.
        ===================================================================== */}
      <div className="flex flex-nowrap overflow-x-auto gap-2 border-b border-amber-600/30 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab("carried")}
          className={`min-w-max px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold uppercase transition border cursor-pointer ${
            activeSubTab === "carried"
              ? "bg-amber-800 border-amber-500 text-white shadow-md"
              : "bg-[#4a261c] border-amber-600/30 text-[#889c9b] hover:text-[#f0e6d2]"
          }`}
        >
          ⚔️ Carried & Equipped ({carriedItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("stash")}
          className={`min-w-max px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold uppercase transition border cursor-pointer ${
            activeSubTab === "stash"
              ? "bg-amber-800 border-amber-500 text-white shadow-md"
              : "bg-[#4a261c] border-amber-600/30 text-[#889c9b] hover:text-[#f0e6d2]"
          }`}
        >
          🏰 Stronghold / Lair Stash ({stashItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("add-item")}
          className={`min-w-max px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold uppercase transition border cursor-pointer ${
            activeSubTab === "add-item"
              ? "bg-amber-700 border-amber-400 text-white shadow-md"
              : "bg-[#361a12] border-amber-600/30 text-amber-300 hover:bg-[#4a261c]"
          }`}
        >
          ➕ Add Item from Catalog
        </button>
      </div>

      {/* =====================================================================
        MAIN TAB CONTENT WORKSPACE
        ===================================================================== */}
      {loading ? (
        <div className="p-10 sm:p-12 text-center text-[#889c9b]">
          <span className="text-2xl animate-spin inline-block">⏳</span>
          <p className="text-xs uppercase tracking-widest mt-2">
            Opening vault doors...
          </p>
        </div>
      ) : (
        <div>
          {/* -----------------------------------------------------------------
            VIEW 1: CARRIED & EQUIPPED GEAR
            ----------------------------------------------------------------- */}
          {activeSubTab === "carried" && (
            <div className="space-y-3 animate-fadeIn">
              {carriedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {carriedItems.map((item) => {
                    const eq = item.equipment || {};
                    const name = eq.name || item.custom_name || "Custom Item";
                    const weight = (
                      Number(eq.weight_lbs || 0) * Number(item.quantity || 1)
                    ).toFixed(1);
                    const category = eq.category || "Adventuring Gear";

                    return (
                      <div
                        key={item.id}
                        className="min-w-0 p-3 sm:p-3.5 bg-[#4a261c] border border-amber-600/40 rounded-xl space-y-2 shadow-inner flex flex-col justify-between"
                      >
                        {/* Item Title, Category & Equip Button */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-[#f0e6d2] break-words block">
                              {name}
                            </span>
                            <span className="text-[10px] text-amber-300 block">
                              {category}{" "}
                              {eq.rarity && eq.rarity !== "Common"
                                ? `• ${eq.rarity}`
                                : ""}
                            </span>
                          </div>

                          <div className="flex shrink-0">
                            {category.toLowerCase().includes("weapon") ||
                            category.toLowerCase().includes("armor") ||
                            category.toLowerCase().includes("shield") ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleProperty(item, "is_equipped")
                                }
                                className={`px-2.5 py-1 sm:py-0.5 rounded text-[11px] sm:text-[10px] font-bold border transition cursor-pointer ${
                                  item.is_equipped
                                    ? "bg-amber-600 text-white border-amber-400 shadow"
                                    : "bg-[#361a12] text-[#889c9b] border-amber-600/30 hover:text-white"
                                }`}
                              >
                                {item.is_equipped ? "✓ Equipped" : "Equip"}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {eq.lore && (
                          <p className="text-[11px] text-[#889c9b] italic line-clamp-2 break-words">
                            {eq.lore}
                          </p>
                        )}

                        {/* Card Footer: Touch-Sized Quantity Stepper & Stash/Discard Actions */}
                        <div className="flex flex-wrap justify-between items-center gap-2 text-xs pt-2 border-t border-amber-600/30">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-[#889c9b]">Qty:</span>
                            <button
                              type="button"
                              aria-label={`Decrease ${name} quantity`}
                              onClick={() => handleQuantityChange(item, -1)}
                              className="w-7 h-7 sm:w-6 sm:h-6 bg-[#361a12] rounded text-amber-300 font-bold flex items-center justify-center hover:bg-amber-800 border border-amber-600/30 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-bold text-[#f0e6d2] min-w-[1.25rem] text-center">
                              {item.quantity || 1}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase ${name} quantity`}
                              onClick={() => handleQuantityChange(item, 1)}
                              className="w-7 h-7 sm:w-6 sm:h-6 bg-[#361a12] rounded text-amber-300 font-bold flex items-center justify-center hover:bg-amber-800 border border-amber-600/30 cursor-pointer"
                            >
                              +
                            </button>
                            <span className="text-[10px] text-[#889c9b] ml-1">
                              ({weight} lbs)
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleProperty(item, "is_offsite")
                              }
                              className="py-1 text-[11px] sm:text-[10px] text-amber-400 hover:underline cursor-pointer"
                            >
                              Store in Lair →
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="py-1 text-[11px] sm:text-[10px] text-red-400 hover:underline cursor-pointer"
                            >
                              Discard
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 sm:p-8 text-center text-[#889c9b] italic text-xs bg-[#4a261c]/40 rounded-xl border border-amber-600/30">
                  Your character is carrying no items. Switch to the catalog tab
                  to add gear!
                </div>
              )}
            </div>
          )}

          {/* -----------------------------------------------------------------
            VIEW 2: STRONGHOLD / LAIR STASH
            ----------------------------------------------------------------- */}
          {activeSubTab === "stash" && (
            <div className="space-y-3 animate-fadeIn">
              {stashItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stashItems.map((item) => {
                    const eq = item.equipment || {};
                    const name = eq.name || item.custom_name || "Custom Item";

                    return (
                      <div
                        key={item.id}
                        className="min-w-0 p-3 sm:p-3.5 bg-[#361a12] border border-amber-600/40 rounded-xl space-y-2 shadow-inner opacity-95 flex flex-col justify-between"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-[#f0e6d2] break-words block">
                            {name}
                          </span>
                          <span className="text-[10px] text-amber-300 block">
                            {eq.category} (Stored in Vault)
                          </span>
                        </div>

                        {eq.lore && (
                          <p className="text-[11px] text-[#889c9b] italic line-clamp-2 break-words">
                            {eq.lore}
                          </p>
                        )}

                        <div className="flex flex-wrap justify-between items-center gap-2 text-xs pt-2 border-t border-amber-600/20">
                          <span className="text-[#889c9b]">
                            Quantity: {item.quantity || 1}
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleProperty(item, "is_offsite")
                              }
                              className="py-1 text-[11px] sm:text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                            >
                              ← Carry in Pack
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="py-1 text-[11px] sm:text-[10px] text-red-400 hover:underline cursor-pointer"
                            >
                              Discard
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 sm:p-8 text-center text-[#889c9b] italic text-xs bg-[#4a261c]/40 rounded-xl border border-amber-600/30">
                  Your stronghold stash is empty. Store items here to keep your
                  pack weight down!
                </div>
              )}
            </div>
          )}

          {/* -----------------------------------------------------------------
            VIEW 3: ADD ITEM FROM MASTER CATALOG
            ----------------------------------------------------------------- */}
          {activeSubTab === "add-item" && (
            <div className="space-y-4 animate-fadeIn bg-[#4a261c] p-3 sm:p-4 rounded-xl border border-amber-600/40">
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                {/* Search Input (`text-sm sm:text-xs` prevents mobile auto-zoom) */}
                <input
                  type="text"
                  placeholder="Search master equipment catalog..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 bg-[#361a12] border border-amber-600/40 rounded-lg text-sm sm:text-xs text-[#f0e6d2] w-full md:w-72 focus:outline-none focus:border-amber-400 shadow-inner"
                />

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-2.5 py-1.5 sm:py-1 rounded text-[11px] sm:text-[10px] font-bold transition border cursor-pointer ${
                        selectedCategoryFilter === cat
                          ? "bg-amber-700 border-amber-400 text-white"
                          : "bg-[#361a12] border-amber-600/30 text-[#889c9b] hover:text-[#f0e6d2]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsive Catalog Cards: 1 col (phone) -> 2 cols (tablet) -> 3 cols (desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[26rem] overflow-y-auto pr-1">
                {filteredCatalog.slice(0, 50).map((eq) => (
                  <div
                    key={eq.id}
                    className="min-w-0 p-3 bg-[#361a12] border border-amber-600/30 rounded-lg flex flex-col justify-between space-y-2.5 hover:border-amber-500/60 transition"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-[#f0e6d2] break-words">
                        {eq.name}
                      </div>
                      <div className="text-[10px] text-amber-400">
                        {eq.category}{" "}
                        {eq.rarity && eq.rarity !== "Common"
                          ? `• ${eq.rarity}`
                          : ""}
                      </div>
                      <div className="text-[10px] text-[#889c9b] mt-1">
                        Cost: {eq.cost_gp || 0} gp • Weight:{" "}
                        {eq.weight_lbs || 0} lbs
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddCatalogItem(eq)}
                      className="w-full py-2 sm:py-1.5 bg-amber-800 hover:bg-amber-700 rounded text-xs text-white font-bold transition cursor-pointer"
                    >
                      + Add to Inventory
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
