/**
 * -----------------------------------------------------------------------------
 * COMPONENT: SheetTabsSection.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Master interactive 5-tab workspace for the Character Sheet view:
 * 1. Weapons & Attacks (To-Hit bonus, damage dice, damage type, equipped status)
 * 2. Spells (Grouped Cantrips -> Level 1 -> Level 2 -> ..., interactive spell
 *    slot steppers, and collapsible spell mechanics/descriptions)
 * 3. Features & Traits (Racial lineage traits, core class features)
 * 4. Background (Background title, alignment, personality traits, ideals/bonds)
 * 5. Quick Notes (Ephemeral session scratchpad stored in component state)
 *
 * Responsive & Touch Behavior:
 * - Scrollable Single-Row Tab Strip: Uses `overflow-x-auto flex-nowrap` with
 *   `min-w-max sm:flex-1` and `py-2.5 px-3` so phones can swipe smoothly across
 *   all 5 tabs on a single row without awkward two-line wrapping, while tablets
 *   and desktops stretch the 5 tabs evenly across 100% width.
 * - Adaptive Content Padding: Uses `p-3 sm:p-5` so mobile cards and spell
 *   details keep wide readable text blocks.
 * - Touch-Friendly Spell Slot Steppers: Enlarges `-` and `+` slot buttons to
 *   `w-7 h-7 sm:w-6 sm:h-6` for reliable thumb taps during live table play.
 * - Overflow Protection: Applies `min-w-0` and `break-words` to weapon cards,
 *   spell headers, and expanded mechanics grids so long titles never stretch
 *   the container horizontally.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.character - Computed character sheet record.
 * @param {Function} props.onUpdateSpellSlots - Persists updated `spell_slots_used` map.
 * -----------------------------------------------------------------------------
 */

import React, { useMemo, useState } from "react";

/**
 * Normalizes a spell's level value into a numeric tier where 0 = Cantrips
 * and positive integers represent spell levels (1, 2, 3, ...).
 *
 * @param {number|string|undefined|null} rawLevel - Raw level from spells table.
 * @returns {number} Normalized numeric spell level (defaults to 0 / 99 if unparseable).
 */
function normalizeSpellLevel(rawLevel) {
  if (rawLevel === 0 || rawLevel === "0") return 0;
  if (typeof rawLevel === "string") {
    const trimmed = rawLevel.trim().toLowerCase();
    if (trimmed === "cantrip" || trimmed === "cantrips") return 0;
    const parsed = parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? 99 : parsed;
  }
  const numeric = Number(rawLevel);
  return Number.isNaN(numeric) ? 99 : numeric;
}

/**
 * Formats a numeric spell level into a human-readable section heading.
 *
 * @param {number} level - Normalized spell level.
 * @returns {string} Section heading ("Cantrips" or "Level N").
 */
function formatSpellTierHeading(level) {
  return level === 0 ? "Cantrips" : `Level ${level}`;
}

/**
 * Formats the `components` JSONB column (array or string) into readable text.
 *
 * @param {Array|string|null|undefined} components - Components value from spells table.
 * @returns {string} Human-readable components string (e.g., "V, S, M").
 */
function formatComponents(components) {
  if (!components) return "None";
  if (Array.isArray(components)) {
    return components.length > 0 ? components.join(", ") : "None";
  }
  if (typeof components === "string") {
    return components.trim() || "None";
  }
  return String(components);
}

export default function SheetTabsSection({ character, onUpdateSpellSlots }) {
  if (!character) return null;

  // Active tab state: 'weapons' | 'spells' | 'features' | 'background' | 'notes'
  const [activeTab, setActiveTab] = useState("weapons");

  // Tracks which individual spell entries are expanded to reveal full mechanics
  const [expandedSpellKeys, setExpandedSpellKeys] = useState(() => new Set());

  // Ephemeral local scratchpad text (cleared on unmount)
  const [quickNotes, setQuickNotes] = useState("");

  /**
   * Toggles the expanded/collapsed state for a single spell card.
   */
  const toggleSpellExpanded = (spellKey) => {
    setExpandedSpellKeys((prev) => {
      const next = new Set(prev);
      if (next.has(spellKey)) {
        next.delete(spellKey);
      } else {
        next.add(spellKey);
      }
      return next;
    });
  };

  // Extract base ability scores and proficiency bonus for attack/damage math
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

  // Filter inventory items for weapons while strictly excluding armor and shields
  const inventory = Array.isArray(character.inventory)
    ? character.inventory
    : [];

  const weapons = inventory.filter((item) => {
    const eqName = item?.equipment?.name || item?.custom_name || "";
    const eqCategory = item?.equipment?.category || item?.category || "";

    if (
      eqCategory.toLowerCase().includes("armor") ||
      eqCategory.toLowerCase().includes("shield")
    ) {
      return false;
    }

    return (
      eqCategory.toLowerCase().includes("weapon") ||
      eqName.toLowerCase().includes("sword") ||
      eqName.toLowerCase().includes("bow") ||
      eqName.toLowerCase().includes("dagger") ||
      eqName.toLowerCase().includes("staff") ||
      eqName.toLowerCase().includes("axe") ||
      eqName.toLowerCase().includes("hammer") ||
      eqName.toLowerCase().includes("mace")
    );
  });

  // Spells extraction and slot usage state
  const spells = Array.isArray(character.spells) ? character.spells : [];
  const spellSlotsUsed = character.spell_slots_used || {};

  /**
   * Groups character spells by spell level (Cantrips = 0 first, then Level 1,
   * Level 2, ...) and sorts spells alphabetically within each tier.
   */
  const groupedSpellsByTier = useMemo(() => {
    const tierMap = new Map();

    spells.forEach((entry, idx) => {
      const spellObj =
        entry?.spells && typeof entry.spells === "object"
          ? entry.spells
          : entry;
      if (!spellObj) return;

      const level = normalizeSpellLevel(spellObj.level);
      const rowKey =
        entry?.id ?? spellObj?.id ?? `${spellObj?.name || "spell"}-${idx}`;

      if (!tierMap.has(level)) {
        tierMap.set(level, []);
      }

      tierMap.get(level).push({
        key: rowKey,
        entry,
        spell: spellObj,
      });
    });

    return Array.from(tierMap.entries())
      .sort(([levelA], [levelB]) => levelA - levelB)
      .map(([level, items]) => ({
        level,
        heading: formatSpellTierHeading(level),
        items: items.sort((a, b) =>
          String(a.spell?.name || "").localeCompare(
            String(b.spell?.name || ""),
          ),
        ),
      }));
  }, [spells]);

  return (
    <div className="bg-[#4a261c] border-2 border-amber-600/50 rounded-xl shadow-2xl overflow-hidden my-3 sm:my-4">
      {/* =====================================================================
        TAB NAVIGATION HEADER — SINGLE-ROW HORIZONTALLY SCROLLABLE ON MOBILE
        - `overflow-x-auto flex-nowrap` keeps all 5 tabs on one clean horizontal
          strip on phones (swipeable) instead of wrapping into uneven rows.
        - `min-w-max sm:flex-1` lets tabs size naturally on phones and expand
          to fill equal widths from `sm` (640px) upward.
        ===================================================================== */}
      <div
        role="tablist"
        aria-label="Character sheet sections"
        className="flex flex-nowrap overflow-x-auto border-b border-amber-600/40 bg-[#361a12]"
      >
        {[
          { id: "weapons", label: "⚔️ Weapons", count: weapons.length },
          { id: "spells", label: "✨ Spells", count: spells.length },
          { id: "features", label: "🛡️ Features" },
          { id: "background", label: "📜 Background" },
          { id: "notes", label: "📝 Notes" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-w-max sm:flex-1 px-3 sm:px-2 py-2.5 sm:py-2 text-[11px] sm:text-[10px] font-bold uppercase tracking-tight transition border-r border-amber-600/30 last:border-r-0 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#4a261c] text-amber-300 border-b-2 border-b-amber-400 shadow-inner"
                : "text-[#889c9b] hover:text-[#f0e6d2] hover:bg-[#4a261c]/40"
            }`}
          >
            <span className="whitespace-nowrap">{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.5 bg-[#361a12] rounded-full text-[9px] text-amber-400 border border-amber-500/30">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* =====================================================================
        ACTIVE TAB PANEL CONTENT AREA (`p-3 sm:p-5`)
        ===================================================================== */}
      <div className="p-3 sm:p-5">
        {/* -------------------------------------------------------------------
          TAB 1: WEAPONS & COMBAT ATTACKS
          ------------------------------------------------------------------- */}
        {activeTab === "weapons" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-wrap justify-between items-center gap-1 border-b border-amber-500/30 pb-2">
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
                  const eq = item?.equipment || {};
                  const name = eq.name || item?.custom_name || "Unnamed Weapon";
                  const damage = eq.damage_dice || "1d8";
                  const dmgType = eq.damage_type || "Slashing";

                  const propertiesObj = eq.properties;
                  const propertiesStr =
                    typeof propertiesObj === "string"
                      ? propertiesObj
                      : JSON.stringify(propertiesObj || "");

                  const isFinesse = propertiesStr
                    .toLowerCase()
                    .includes("finesse");
                  const abilityMod = isFinesse
                    ? Math.max(strMod, dexMod)
                    : strMod;
                  const toHit = abilityMod + proficiencyBonus;
                  const formattedToHit = toHit >= 0 ? `+${toHit}` : `${toHit}`;
                  const totalDamage = `${damage} ${
                    abilityMod >= 0
                      ? `+ ${abilityMod}`
                      : `- ${Math.abs(abilityMod)}`
                  } ${dmgType}`;

                  return (
                    <div
                      key={idx}
                      className="min-w-0 p-3 bg-[#361a12] border border-amber-500/40 rounded-lg space-y-2 shadow-inner"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-sm text-[#f0e6d2] break-words min-w-0">
                          {name}
                        </span>
                        <span className="px-2 py-0.5 bg-[#4a261c] border border-amber-500/30 rounded text-[10px] text-amber-300 font-bold shrink-0">
                          {item?.is_equipped ? "Equipped" : "In Pack"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-amber-500/20">
                        <div className="min-w-0">
                          <span className="text-[10px] text-[#889c9b] uppercase block">
                            To Hit / Attack
                          </span>
                          <span className="text-base font-bold text-amber-400">
                            {formattedToHit}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-[#889c9b] uppercase block">
                            Damage & Type
                          </span>
                          <span className="text-sm font-bold text-[#f0e6d2] break-words">
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

        {/* -------------------------------------------------------------------
          TAB 2: SPELLBOOK & CANTRIPS
          ------------------------------------------------------------------- */}
        {activeTab === "spells" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-amber-500/30 pb-2">
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

            {/* Interactive Spell Slot Trackers (Touch-Sized `-` / `+` Buttons) */}
            <div className="p-3 bg-[#361a12] border border-amber-500/30 rounded-lg flex flex-wrap gap-2.5 sm:gap-4 items-center">
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
                    className="flex items-center gap-2 text-xs bg-[#4a261c] px-2.5 py-1.5 sm:py-1 rounded border border-amber-500/30"
                  >
                    <span className="text-[#f0e6d2] font-bold">Lvl {lvl}:</span>
                    <span className="text-amber-400 font-bold">
                      {available}/{maxSlots}
                    </span>
                    <button
                      type="button"
                      aria-label={`Spend Level ${lvl} Spell Slot`}
                      onClick={() => {
                        const newUsed = Math.max(0, used - 1);
                        onUpdateSpellSlots({
                          ...spellSlotsUsed,
                          [lvl]: newUsed,
                        });
                      }}
                      className="w-7 h-7 sm:w-6 sm:h-6 bg-[#361a12] rounded text-xs text-amber-300 font-bold flex items-center justify-center hover:bg-amber-800 border border-amber-500/30 cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      aria-label={`Restore Level ${lvl} Spell Slot`}
                      onClick={() => {
                        const newUsed = Math.min(maxSlots, used + 1);
                        onUpdateSpellSlots({
                          ...spellSlotsUsed,
                          [lvl]: newUsed,
                        });
                      }}
                      className="w-7 h-7 sm:w-6 sm:h-6 bg-[#361a12] rounded text-xs text-amber-300 font-bold flex items-center justify-center hover:bg-amber-800 border border-amber-500/30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Spells Grouped by Tier (Cantrips -> Level 1 -> Level 2 -> ...) */}
            {groupedSpellsByTier.length > 0 ? (
              <div className="space-y-4">
                {groupedSpellsByTier.map((tierGroup) => (
                  <div key={tierGroup.level} className="space-y-2">
                    {/* Tier Section Header */}
                    <div className="flex items-center justify-between border-b border-amber-500/25 pb-1">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-amber-300">
                        {tierGroup.heading}
                      </h4>
                      <span className="text-[10px] text-[#889c9b]">
                        {tierGroup.items.length}{" "}
                        {tierGroup.items.length === 1 ? "spell" : "spells"}
                      </span>
                    </div>

                    {/* Collapsible Spell Cards */}
                    <div className="space-y-2">
                      {tierGroup.items.map(({ key, entry, spell }) => {
                        const isExpanded = expandedSpellKeys.has(key);
                        const spellName = spell.name || "Unknown Spell";
                        const school = spell.school || "Evocation";
                        const castingTime = spell.casting_time || "—";
                        const spellRange = spell.range || "—";
                        const duration = spell.duration || "—";
                        const componentsText = formatComponents(
                          spell.components,
                        );
                        const isConcentration = Boolean(spell.concentration);
                        const isRitual = Boolean(spell.ritual);
                        const isContactSpell =
                          typeof spellRange === "string" &&
                          spellRange.toLowerCase().includes("touch");
                        const description =
                          spell.description ||
                          "No description recorded for this spell.";

                        return (
                          <div
                            key={key}
                            className="bg-[#361a12] border border-amber-500/30 rounded-lg overflow-hidden transition"
                          >
                            {/* Clickable/Tappable Accordion Header */}
                            <button
                              type="button"
                              onClick={() => toggleSpellExpanded(key)}
                              aria-expanded={isExpanded}
                              className="w-full px-3 py-3 sm:py-2.5 flex items-start sm:items-center justify-between gap-2 text-left text-xs hover:bg-[#4a261c]/50 transition cursor-pointer"
                            >
                              <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                                <span className="font-bold text-[#f0e6d2] break-words">
                                  {spellName}
                                </span>
                                <span className="text-[#889c9b] text-[11px]">
                                  ({school})
                                </span>
                                {isContactSpell && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-900/60 text-amber-300 border border-amber-500/40">
                                    Touch / Contact
                                  </span>
                                )}
                                {isConcentration && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#4a261c] text-amber-200 border border-amber-500/30">
                                    Concentration
                                  </span>
                                )}
                                {isRitual && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#4a261c] text-[#c9b99a] border border-[#a59075]/30">
                                    Ritual
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    entry?.is_prepared
                                      ? "bg-amber-600/40 text-amber-300 border border-amber-500/50"
                                      : "bg-[#4a261c] text-[#889c9b]"
                                  }`}
                                >
                                  {entry?.is_prepared ? "Prepared" : "Known"}
                                </span>
                                <span className="text-amber-300 font-bold text-[11px]">
                                  {isExpanded ? "▲" : "▼"}
                                </span>
                              </div>
                            </button>

                            {/* Expanded Spell Mechanics & Description */}
                            {isExpanded && (
                              <div className="px-3 sm:px-3.5 py-3 bg-[#28120c] border-t border-amber-500/25 space-y-3 text-xs text-[#e8dcc4]">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded bg-[#361a12]/90 border border-amber-500/20">
                                  <div className="min-w-0">
                                    <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold block">
                                      Casting Time
                                    </span>
                                    <span className="text-[11px] text-[#f0e6d2] break-words">
                                      {castingTime}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold block">
                                      Range / Contact
                                    </span>
                                    <span className="text-[11px] text-[#f0e6d2] break-words">
                                      {spellRange}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold block">
                                      Components
                                    </span>
                                    <span className="text-[11px] text-[#f0e6d2] break-words">
                                      {componentsText}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold block">
                                      Duration
                                    </span>
                                    <span className="text-[11px] text-[#f0e6d2] break-words">
                                      {duration}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1 leading-relaxed whitespace-pre-line break-words">
                                  <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold block">
                                    Spell Description & Effects
                                  </span>
                                  <p className="text-xs sm:text-[11px] text-[#f0e6d2]/95">
                                    {description}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-[#889c9b] italic text-xs bg-[#361a12] rounded-lg border border-amber-500/20">
                No spells recorded in character spellbook.
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
          TAB 3: FEATURES & TRAITS
          ------------------------------------------------------------------- */}
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

        {/* -------------------------------------------------------------------
          TAB 4: BACKGROUND & PERSONALITY
          ------------------------------------------------------------------- */}
        {activeTab === "background" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="border-b border-amber-500/30 pb-2">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-widest">
                Background & Personality
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="min-w-0 p-3 bg-[#361a12] border border-amber-500/30 rounded space-y-2">
                <div>
                  <span className="text-[10px] text-[#889c9b] uppercase block">
                    Background
                  </span>
                  <strong className="text-amber-300 text-sm break-words">
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
              <div className="min-w-0 p-3 bg-[#361a12] border border-amber-500/30 rounded space-y-2">
                <div>
                  <span className="text-[10px] text-[#889c9b] uppercase block">
                    Personality Traits
                  </span>
                  <p className="text-[#f0e6d2] italic break-words">
                    {character.personality_traits || "None recorded."}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#889c9b] uppercase block">
                    Ideals & Bonds
                  </span>
                  <p className="text-[#f0e6d2] italic break-words">
                    {character.ideals || "None recorded."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
          TAB 5: QUICK SESSION SCRATCHPAD
          ------------------------------------------------------------------- */}
        {activeTab === "notes" && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex flex-wrap justify-between items-center gap-1 border-b border-amber-500/30 pb-2">
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
              className="w-full p-3 bg-[#361a12] border border-amber-500/40 rounded-lg text-sm sm:text-xs text-[#f0e6d2] placeholder-[#889c9b] focus:outline-none focus:border-amber-400 shadow-inner resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
