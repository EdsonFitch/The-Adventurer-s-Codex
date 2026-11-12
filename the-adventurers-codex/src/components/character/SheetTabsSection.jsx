/**
 * -----------------------------------------------------------------------------
 * COMPONENT: SheetTabsSection.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Master interactive 5-tab workspace for the Character Sheet view.
 * Contains:
 * 1. Weapons & Attacks (Calculated To-Hit bonus, damage dice, type, properties)
 * 2. Spells (Cantrips, leveled spells, interactive spell slot trackers)
 * 3. Features & Traits (Class features, racial traits, feats)
 * 4. Background (Background name, personality traits, ideals, bonds, flaws)
 * 5. Quick Notes (Ephemeral session scratchpad stored in local state)
 * -----------------------------------------------------------------------------
 */

import React, { useState } from "react";
import { calculateModifier } from "../../utils/statCalculator";

export default function SheetTabsSection({ character, onUpdateSpellSlots }) {
  if (!character) return null;

  // Active tab state: 'weapons' | 'spells' | 'features' | 'background' | 'notes'
  const [activeTab, setActiveTab] = useState("weapons");

  // Quick notes local ephemeral state (wipes when component unmounts)
  const [quickNotes, setQuickNotes] = useState("");

  // Extract stats for weapon/spell calculations
  const stats = character.stats ||
    character.computed?.abilityScores || {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    };
  const proficiencyBonus =
    character.computed?.proficiencyBonus ||
    Math.floor(((character.level || 1) - 1) / 4) + 2;

  const strMod = Math.floor(((stats.str || 10) - 10) / 2);
  const dexMod = Math.floor(((stats.dex || 10) - 10) / 2);

  // Inventory / Weapons filtering
  const inventory = Array.isArray(character.inventory)
    ? character.inventory
    : [];
  const weapons = inventory.filter((item) => {
    const eqName = item.equipment?.name || item.custom_name || "";
    const eqType = item.equipment?.type || item.type || "";
    return (
      eqType.toLowerCase().includes("weapon") ||
      eqName.toLowerCase().includes("sword") ||
      eqName.toLowerCase().includes("bow") ||
      eqName.toLowerCase().includes("dagger") ||
      eqName.toLowerCase().includes("staff") ||
      item.is_equipped
    );
  });

  // Spells extraction
  const spells = Array.isArray(character.spells) ? character.spells : [];
  const spellSlotsUsed = character.spell_slots_used || {};

  return (
    <div className="bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-2xl overflow-hidden my-4">
      {/* TAB NAVIGATION HEADER */}
      <div className="flex flex-wrap border-b border-amber-600/40 bg-[#361a12]">
        {[
          { id: "weapons", label: "⚔️ Weapons", count: weapons.length },
          { id: "spells", label: "✨ Spells", count: spells.length },
          { id: "features", label: "🛡️ Features & Traits" },
          { id: "background", label: "📜 Background" },
          { id: "notes", label: "📝 Quick Notes" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition border-r border-amber-600/30 flex items-center space-x-1.5 ${
              activeTab === tab.id
                ? "bg-[#4a261c] text-amber-300 border-b-2 border-b-amber-400 shadow-inner"
                : "text-[#889c9b] hover:text-[#f0e6d2] hover:bg-[#4a261c]/40"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.5 bg-[#361a12] rounded-full text-[10px] text-amber-400 border border-amber-500/30">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT AREA */}
      <div className="p-5">
        {/* TAB 1: WEAPONS & ATTACKS */}
        {activeTab === "weapons" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-amber-500/30 pb-2">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-widest">
                Weapons & Combat Attacks
              </h3>
              <span className="text-xs text-[#889c9b]">
                Equipped & Owned Armament
              </span>
            </div>

            {weapons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {weapons.map((item, idx) => {
                  const name =
                    item.equipment?.name ||
                    item.custom_name ||
                    "Unnamed Weapon";
                  const damage = item.equipment?.damage_dice || "1d8";
                  const dmgType = item.equipment?.damage_type || "Slashing";
                  const isFinesse = (item.equipment?.properties || "")
                    .toLowerCase()
                    .includes("finesse");
                  const abilityMod = isFinesse
                    ? Math.max(strMod, dexMod)
                    : strMod;
                  const toHit = abilityMod + proficiencyBonus;
                  const formattedToHit = toHit >= 0 ? `+${toHit}` : `${toHit}`;
                  const totalDamage = `${damage} ${abilityMod >= 0 ? `+ ${abilityMod}` : `- ${Math.abs(abilityMod)}`} ${dmgType}`;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-[#361a12] border border-amber-500/40 rounded-lg space-y-2 shadow-inner"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-[#f0e6d2]">
                          {name}
                        </span>
                        <span className="px-2 py-0.5 bg-[#4a261c] border border-amber-500/30 rounded text-[10px] text-amber-300 font-bold">
                          {item.is_equipped ? "Equipped" : "In Pack"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-500/20">
                        <div>
                          <span className="text-[10px] text-[#889c9b] uppercase block">
                            To Hit / Attack
                          </span>
                          <span className="text-base font-bold text-amber-400">
                            {formattedToHit}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#889c9b] uppercase block">
                            Damage & Type
                          </span>
                          <span className="text-sm font-bold text-[#f0e6d2]">
                            {totalDamage}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-[#889c9b] italic text-xs bg-[#361a12] rounded-lg border border-amber-500/20">
                No weapons found in inventory. Add weapons via inventory or
                character creation.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SPELLS */}
        {activeTab === "spells" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-amber-500/30 pb-2">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-widest">
                Spellbook & Cantrips
              </h3>
              <div className="flex items-center space-x-2 text-xs text-[#889c9b]">
                <span>
                  Spell Save DC: <strong className="text-[#f0e6d2]">12</strong>
                </span>
                <span>•</span>
                <span>
                  Spell Attack: <strong className="text-amber-400">+4</strong>
                </span>
              </div>
            </div>

            {/* Spell Slots Trackers */}
            <div className="p-3 bg-[#361a12] border border-amber-500/30 rounded-lg flex flex-wrap gap-4 items-center">
              <span className="text-xs font-bold uppercase text-amber-300">
                Spell Slots:
              </span>
              {[1, 2, 3].map((lvl) => {
                const maxSlots = lvl === 1 ? 4 : lvl === 2 ? 2 : 0;
                if (maxSlots === 0) return null;
                const used = spellSlotsUsed[lvl] || 0;
                const available = maxSlots - used;

                return (
                  <div
                    key={lvl}
                    className="flex items-center space-x-2 text-xs bg-[#4a261c] px-2.5 py-1 rounded border border-amber-500/30"
                  >
                    <span className="text-[#f0e6d2] font-bold">Lvl {lvl}:</span>
                    <span className="text-amber-400 font-bold">
                      {available}/{maxSlots}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newUsed = Math.max(0, used - 1);
                        onUpdateSpellSlots({
                          ...spellSlotsUsed,
                          [lvl]: newUsed,
                        });
                      }}
                      className="w-4 h-4 bg-[#361a12] rounded text-xs text-amber-300 font-bold flex items-center justify-center hover:bg-amber-800"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newUsed = Math.min(maxSlots, used + 1);
                        onUpdateSpellSlots({
                          ...spellSlotsUsed,
                          [lvl]: newUsed,
                        });
                      }}
                      className="w-4 h-4 bg-[#361a12] rounded text-xs text-amber-300 font-bold flex items-center justify-center hover:bg-amber-800"
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Spells List */}
            {spells.length > 0 ? (
              <div className="space-y-2">
                {spells.map((s, idx) => {
                  const spellName = s.spells?.name || "Unknown Spell";
                  const school = s.spells?.school || "Evocation";
                  const level = s.spells?.level || 0;

                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#361a12] border border-amber-500/30 rounded flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#f0e6d2]">
                          {spellName}
                        </span>
                        <span className="text-[#889c9b] ml-2">
                          ({level === 0 ? "Cantrip" : `Level ${level}`} •{" "}
                          {school})
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.is_prepared ? "bg-amber-600/40 text-amber-300 border border-amber-500/50" : "bg-[#4a261c] text-[#889c9b]"}`}
                      >
                        {s.is_prepared ? "Prepared" : "Known"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-[#889c9b] italic text-xs bg-[#361a12] rounded-lg border border-amber-500/20">
                No spells recorded in character spellbook.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FEATURES & TRAITS */}
        {activeTab === "features" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="border-b border-amber-500/30 pb-2">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-widest">
                Class Features, Lineage & Feats
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#361a12] border border-amber-500/30 rounded space-y-1">
                <strong className="text-[#f0e6d2] block text-sm">
                  ✨ {character.race?.name || "Racial Trait"}
                </strong>
                <p className="text-[#889c9b]">
                  Standard racial attributes and darkvision granted by lineage.
                </p>
              </div>
              <div className="p-3 bg-[#361a12] border border-amber-500/30 rounded space-y-1">
                <strong className="text-[#f0e6d2] block text-sm">
                  🛡️ {character.primaryClass?.name || "Class"} Core Features
                </strong>
                <p className="text-[#889c9b]">
                  Active class proficiencies, saving throw proficiencies, and
                  starting abilities.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BACKGROUND */}
        {activeTab === "background" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="border-b border-amber-500/30 pb-2">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-widest">
                Background & Personality
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#361a12] border border-amber-500/30 rounded space-y-2">
                <div>
                  <span className="text-[10px] text-[#889c9b] uppercase block">
                    Background
                  </span>
                  <strong className="text-amber-300 text-sm">
                    {character.background?.name || "Custom Background"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#889c9b] uppercase block">
                    Alignment
                  </span>
                  <span className="text-[#f0e6d2]">
                    {character.alignment_code || "True Neutral"}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-[#361a12] border border-amber-500/30 rounded space-y-2">
                <div>
                  <span className="text-[10px] text-[#889c9b] uppercase block">
                    Personality Traits
                  </span>
                  <p className="text-[#f0e6d2] italic">
                    {character.personality_traits || "None recorded."}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#889c9b] uppercase block">
                    Ideals & Bonds
                  </span>
                  <p className="text-[#f0e6d2] italic">
                    {character.ideals || "None recorded."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: QUICK NOTES */}
        {activeTab === "notes" && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-amber-500/30 pb-2">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-widest">
                📝 Quick Session Scratchpad
              </h3>
              <span className="text-[10px] text-[#889c9b] italic">
                Ephemeral notes — wiped when closing character sheet.
              </span>
            </div>
            <textarea
              value={quickNotes}
              onChange={(e) => setQuickNotes(e.target.value)}
              placeholder="Jot down temporary combat counts, initiative reminders, or loot notes here before migrating them to your Journal..."
              rows={6}
              className="w-full p-3 bg-[#361a12] border border-amber-500/40 rounded-lg text-xs text-[#f0e6d2] placeholder-[#889c9b] focus:outline-none focus:border-amber-400 shadow-inner resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
