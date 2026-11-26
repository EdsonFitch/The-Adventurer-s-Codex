/**
 * -----------------------------------------------------------------------------
 * COMPONENT: InventoryView.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Standalone view for managing a character's inventory and stronghold vault.
 * Supports dual tabs (Carried & Equipped vs. Offsite Lair Stash), live encumbrance
 * tracking, item equipping, quantity adjustment, and adding catalog items with
 * defensive property checks to prevent rendering crashes.
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

  // Search filter for adding items from catalog
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  useEffect(() => {
    if (selectedCharacter?.id) {
      loadInventoryData();
    }
  }, [selectedCharacter?.id]);

  /**
   * Fetches character inventory and master equipment catalog in parallel.
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
      <div className="p-8 text-center bg-[#5f3426] border-2 border-amber-600/40 rounded-xl text-amber-200">
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

  // Extract strength for encumbrance calculations
  const strengthScore =
    selectedCharacter.stats?.str ||
    selectedCharacter.computed?.abilityScores?.str ||
    10;

  const encumbrance = calculateEncumbrance(inventory, strengthScore);

  // Separate inventory into Carried vs Offsite Stash
  const carriedItems = inventory.filter((item) => !item.is_offsite);
  const stashItems = inventory.filter((item) => item.is_offsite);

  /**
   * Handles toggling item equipped state or offsite stash location.
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
   * Handles changing item quantity.
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
   * Removes an item entirely from inventory.
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
   * Adds an item from the master catalog into the character's inventory.
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

  // Filter catalog for search and category
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn font-antiqua">
      {/* HEADER BANNER */}
      <div className="p-5 bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-medieval font-bold text-[#f0e6d2]">
            🎒 Inventory & Stronghold Vault: {selectedCharacter.name}
          </h2>
          <p className="text-xs text-[#889c9b]">
            Manage carried gear, active armor/weapons, and secure lair stashes.
          </p>
        </div>

        {/* Encumbrance Mini-Widget */}
        <div className="px-4 py-2 bg-[#361a12] border border-amber-500/30 rounded-lg text-xs space-y-1">
          <div className="flex justify-between space-x-4">
            <span className="text-[#889c9b]">Carried Weight:</span>
            <strong className="text-amber-300">
              {encumbrance.totalWeight} / {encumbrance.maxCapacity} lbs
            </strong>
          </div>
          <div className="flex justify-between">
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

      {/* SUB-TAB NAVIGATION */}
      <div className="flex space-x-2 border-b border-amber-600/30 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab("carried")}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition border ${
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
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition border ${
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
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition border ${
            activeSubTab === "add-item"
              ? "bg-amber-700 border-amber-400 text-white shadow-md"
              : "bg-[#361a12] border-amber-600/30 text-amber-300 hover:bg-[#4a261c]"
          }`}
        >
          ➕ Add Item from Catalog
        </button>
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="p-12 text-center text-[#889c9b]">
          <span className="text-2xl animate-spin">⏳</span>
          <p className="text-xs uppercase tracking-widest mt-2">
            Opening vault doors...
          </p>
        </div>
      ) : (
        <div>
          {/* VIEW 1: CARRIED GEAR */}
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
                        className="p-3.5 bg-[#4a261c] border border-amber-600/40 rounded-xl space-y-2 shadow-inner"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-sm text-[#f0e6d2]">
                              {name}
                            </span>
                            <span className="text-[10px] text-amber-300 block">
                              {category}{" "}
                              {eq.rarity && eq.rarity !== "Common"
                                ? `• ${eq.rarity}`
                                : ""}
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            {category.toLowerCase().includes("weapon") ||
                            category.toLowerCase().includes("armor") ||
                            category.toLowerCase().includes("shield") ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleProperty(item, "is_equipped")
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
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
                          <p className="text-[11px] text-[#889c9b] italic line-clamp-2">
                            {eq.lore}
                          </p>
                        )}

                        <div className="flex justify-between items-center text-xs pt-2 border-t border-amber-600/30">
                          <div className="flex items-center space-x-2">
                            <span className="text-[#889c9b]">Qty:</span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item, -1)}
                              className="w-5 h-5 bg-[#361a12] rounded text-amber-300 font-bold flex items-center justify-center hover:bg-amber-800"
                            >
                              -
                            </button>
                            <span className="font-bold text-[#f0e6d2]">
                              {item.quantity || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item, 1)}
                              className="w-5 h-5 bg-[#361a12] rounded text-amber-300 font-bold flex items-center justify-center hover:bg-amber-800"
                            >
                              +
                            </button>
                            <span className="text-[10px] text-[#889c9b] ml-2">
                              ({weight} lbs)
                            </span>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleProperty(item, "is_offsite")
                              }
                              className="text-[10px] text-amber-400 hover:underline"
                            >
                              Store in Lair →
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-[10px] text-red-400 hover:underline"
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
                <div className="p-8 text-center text-[#889c9b] italic text-xs bg-[#4a261c]/40 rounded-xl border border-amber-600/30">
                  Your character is carrying no items. Switch to the catalog tab
                  to add gear!
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: STRONGHOLD / LAIR STASH */}
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
                        className="p-3.5 bg-[#361a12] border border-amber-600/40 rounded-xl space-y-2 shadow-inner opacity-90"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-sm text-[#f0e6d2]">
                              {name}
                            </span>
                            <span className="text-[10px] text-amber-300 block">
                              {eq.category} (Stored in Vault)
                            </span>
                          </div>
                        </div>

                        {eq.lore && (
                          <p className="text-[11px] text-[#889c9b] italic line-clamp-2">
                            {eq.lore}
                          </p>
                        )}

                        <div className="flex justify-between items-center text-xs pt-2 border-t border-amber-600/20">
                          <span className="text-[#889c9b]">
                            Quantity: {item.quantity || 1}
                          </span>
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleProperty(item, "is_offsite")
                              }
                              className="text-[10px] text-emerald-400 hover:underline font-bold"
                            >
                              ← Carry in Pack
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-[10px] text-red-400 hover:underline"
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
                <div className="p-8 text-center text-[#889c9b] italic text-xs bg-[#4a261c]/40 rounded-xl border border-amber-600/30">
                  Your stronghold stash is empty. Store items here to keep your
                  pack weight down!
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: ADD ITEM FROM CATALOG */}
          {activeSubTab === "add-item" && (
            <div className="space-y-4 animate-fadeIn bg-[#4a261c] p-4 rounded-xl border border-amber-600/40">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <input
                  type="text"
                  placeholder="Search master equipment catalog..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 bg-[#361a12] border border-amber-600/40 rounded-lg text-xs text-[#f0e6d2] w-full md:w-72 focus:outline-none focus:border-amber-400 shadow-inner"
                />

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition border ${
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredCatalog.slice(0, 50).map((eq) => (
                  <div
                    key={eq.id}
                    className="p-3 bg-[#361a12] border border-amber-600/30 rounded-lg flex flex-col justify-between space-y-2 hover:border-amber-500/60 transition"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#f0e6d2]">
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
                      className="w-full py-1 bg-amber-800 hover:bg-amber-700 rounded text-xs text-white font-bold transition"
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
