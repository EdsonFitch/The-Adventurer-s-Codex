/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepSpells.jsx
 * -----------------------------------------------------------------------------
 * Purpose:
 * Character creation wizard step for selecting cantrips and leveled spells.
 * - Queries 'class_level_progression' for active class and level budgets.
 * - Queries the 'class_spells' relation table to restrict available spells
 *   strictly to the class list.
 * - Reads `SPELL_GRANT` effects from `computedStats.bonusSpells` and automatically
 *   includes them in the character's grimoire.
 * - Separates Cantrips (Level 0) from Leveled Spells into distinct sections.
 * - Features individual expand/collapse toggles for viewing spell descriptions
 *   and casting metadata.
 * -----------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function StepSpells({
  characterData,
  updateCharacterData,
  computedStats,
}) {
  // -------------------------------------------------------------------------
  // 1. COMPONENT STATE MANAGEMENT
  // -------------------------------------------------------------------------
  const [progressionRules, setProgressionRules] = useState(null);
  const [availableSpells, setAvailableSpells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local state dictionary to track which spell IDs are currently expanded (showing description)
  const [expandedSpellIds, setExpandedSpellIds] = useState({});

  // Character's chosen spells structure: { classSpells: [], bonusSpells: [] }
  const selectedSpells = characterData.spells || {
    classSpells: [],
    bonusSpells: [],
  };

  /**
   * Toggles the expand/collapse state for a specific spell card's description view.
   * @param {string} spellId - Unique UUID of the spell card.
   */
  const toggleExpandSpell = (spellId, e) => {
    // Prevent clicking the details toggle from triggering the selection handler
    if (e) e.stopPropagation();
    setExpandedSpellIds((prev) => ({
      ...prev,
      [spellId]: !prev[spellId],
    }));
  };

  // -------------------------------------------------------------------------
  // 2. FETCH PROGRESSION RULES & CLASS-RESTRICTED SPELLS ON MOUNT / CHANGE
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function fetchSpellcastingData() {
      try {
        setLoading(true);
        const classId = characterData.classId;
        const level = characterData.level || 1;

        if (!classId) {
          setError("No class selected. Please go back to Step 1 or Step 2.");
          setLoading(false);
          return;
        }

        // A. Fetch official progression limits (cantrips known, spells known, prep type)
        const { data: progData, error: progErr } = await supabase
          .from("class_level_progression")
          .select("*")
          .eq("class_id", classId)
          .eq("level", level)
          .single();

        if (progErr) throw progErr;
        setProgressionRules(progData);

        // B. Fetch spells linked to this class via 'class_spells' table (includes description)
        const { data: classSpellsData, error: classSpellsErr } = await supabase
          .from("class_spells")
          .select(
            `
            spell_id,
            spells:spell_id (*)
          `,
          )
          .eq("class_id", classId);

        if (classSpellsErr) throw classSpellsErr;

        // Flatten joined response to extract clean spell objects carrying descriptions
        const validSpells = (classSpellsData || [])
          .map((item) => item.spells)
          .filter(Boolean);

        setAvailableSpells(validSpells);
      } catch (err) {
        console.error(
          "❌ Error loading spellcasting configuration:",
          err.message,
        );
        setError("Failed to load spellcasting data from the database.");
      } finally {
        setLoading(false);
      }
    }

    fetchSpellcastingData();
  }, [characterData.classId, characterData.level]);

  // -------------------------------------------------------------------------
  // 3. SYNCHRONIZE BONUS SPELLS (SPELL_GRANT EFFECT ENGINE)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const rawBonusGrants = computedStats?.bonusSpells || [];

    const resolvedBonusSpells = rawBonusGrants.map((grant) => ({
      id: grant.spell_id || grant.id || `bonus-${grant.spell || grant.target}`,
      name: grant.spell || grant.name || grant.target || "Granted Spell",
      level: grant.level !== undefined ? grant.level : 1,
      school: grant.school || "Lineage / Feat",
      origin: grant.source || "Racial Trait / Feat",
      description:
        grant.description ||
        "Granted automatically through special heritage or training.",
    }));

    const classSpellIds = selectedSpells.classSpells.map((s) => s.id);
    const bonusSpellIds = resolvedBonusSpells.map((s) => s.id);
    const combinedAllIds = Array.from(
      new Set([...classSpellIds, ...bonusSpellIds]),
    );

    const currentBonusIds = selectedSpells.bonusSpells.map((s) => s.id);
    const hasChanged =
      resolvedBonusSpells.length !== selectedSpells.bonusSpells.length ||
      !resolvedBonusSpells.every((s) => currentBonusIds.includes(s.id));

    if (hasChanged) {
      updateCharacterData({
        ...characterData,
        spells: {
          ...selectedSpells,
          bonusSpells: resolvedBonusSpells,
        },
        selectedSpellIds: combinedAllIds,
      });
    }
  }, [computedStats?.bonusSpells]);

  // -------------------------------------------------------------------------
  // 4. BUDGET CALCULATION HELPERS
  // -------------------------------------------------------------------------
  const calculateClassBudgets = () => {
    if (!progressionRules)
      return { cantripsLimit: 0, spellLimit: 0, label: "" };

    const { cantrips_known, spells_known, prep_type, max_spell_level } =
      progressionRules;
    const level = characterData.level || 1;
    const abilityScores = characterData.abilityScores || {};
    const getMod = (score) => Math.floor(((score || 10) - 10) / 2);

    let spellLimit = spells_known || 0;
    let label = "";

    switch (prep_type) {
      case "KNOWN":
        label = `${spellLimit} Known Spells`;
        break;
      case "PREPARED_STAT":
        const wisMod = getMod(abilityScores.wisdom);
        spellLimit = Math.max(1, level + wisMod);
        label = `${spellLimit} Prepared Spells (Level ${level} + WIS Mod)`;
        break;
      case "WIZARD":
        const intMod = getMod(abilityScores.intelligence);
        const preparedDaily = Math.max(1, level + intMod);
        label = `${spells_known} in Spellbook (${preparedDaily} Prepared Daily)`;
        break;
      default:
        label = `${spellLimit} Spells`;
    }

    return {
      cantripsLimit: cantrips_known,
      spellLimit: spellLimit,
      maxSpellLevel: max_spell_level,
      label,
    };
  };

  const budgets = calculateClassBudgets();

  // -------------------------------------------------------------------------
  // 5. SELECTION & BUDGET ENFORCEMENT HANDLERS
  // -------------------------------------------------------------------------
  const toggleClassSpell = (spell) => {
    if (spell.level > budgets.maxSpellLevel) {
      alert(
        `As a level ${characterData.level} caster, you cannot access level ${spell.level} spells yet (Max: Level ${budgets.maxSpellLevel}).`,
      );
      return;
    }

    const exists = selectedSpells.classSpells.some((s) => s.id === spell.id);
    let updatedClassSpells;

    if (exists) {
      updatedClassSpells = selectedSpells.classSpells.filter(
        (s) => s.id !== spell.id,
      );
    } else {
      if (spell.level === 0) {
        const currentCantrips = selectedSpells.classSpells.filter(
          (s) => s.level === 0,
        ).length;
        if (currentCantrips >= budgets.cantripsLimit) {
          alert(
            `You can only know ${budgets.cantripsLimit} cantrips at this level.`,
          );
          return;
        }
      } else {
        const currentSpells = selectedSpells.classSpells.filter(
          (s) => s.level > 0,
        ).length;
        if (currentSpells >= budgets.spellLimit) {
          alert(
            `You have reached your limit of ${budgets.spellLimit} class spells.`,
          );
          return;
        }
      }

      updatedClassSpells = [
        ...selectedSpells.classSpells,
        { ...spell, origin: "class" },
      ];
    }

    const newClassIds = updatedClassSpells.map((s) => s.id);
    const bonusIds = selectedSpells.bonusSpells.map((s) => s.id);
    const combinedIds = Array.from(new Set([...newClassIds, ...bonusIds]));

    updateCharacterData({
      ...characterData,
      spells: { ...selectedSpells, classSpells: updatedClassSpells },
      selectedSpellIds: combinedIds,
    });
  };

  // Separate available spells into Cantrips (level 0) and Leveled Spells (level > 0)
  const availableCantrips = availableSpells.filter((s) => s.level === 0);
  const availableLeveledSpells = availableSpells.filter((s) => s.level > 0);

  // -------------------------------------------------------------------------
  // 6. RENDER UI
  // -------------------------------------------------------------------------
  if (loading)
    return (
      <div className="p-6 text-center text-[#889c9b]">
        Loading valid spell lists from ancient archives...
      </div>
    );
  if (error) return <div className="p-6 text-center text-red-400">{error}</div>;

  return (
    <div className="space-y-6 text-[#938f71]">
      <div className="border-b border-[#a59075]/20 pb-4">
        <h3 className="text-base font-medieval font-bold text-[#f0e6d2]">
          Step 7: Spellcasting & Grimoire
        </h3>
        <p className="text-xs text-[#889c9b]">
          Select your cantrips and leveled spells. Click "📖 Details" on any
          spell card to read its full description.
        </p>
      </div>

      {/* Budget Status Header */}
      <div className="bg-[#4a261c]/60 p-4 rounded-lg border border-[#a59075]/40 flex justify-between items-center shadow-inner">
        <div>
          <p className="text-xs text-[#889c9b]">
            Progression Type:{" "}
            <span className="text-amber-300 font-semibold">
              {progressionRules?.prep_type || "Standard"}
            </span>
          </p>
          <p className="text-sm font-medium text-[#f0e6d2] mt-0.5">
            {budgets.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#889c9b]">
            Cantrips:{" "}
            {selectedSpells.classSpells.filter((s) => s.level === 0).length} /{" "}
            {budgets.cantripsLimit}
          </p>
          <p className="text-xs text-[#889c9b]">
            Class Spells:{" "}
            {selectedSpells.classSpells.filter((s) => s.level > 0).length} /{" "}
            {budgets.spellLimit}
          </p>
        </div>
      </div>

      {/* GRANTED SPELLS SECTION */}
      {selectedSpells.bonusSpells.length > 0 && (
        <div className="space-y-3 p-4 bg-[#361a12] border border-amber-500/40 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              ✨ Granted Spells (Lineage, Feats & Features)
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/40 text-amber-200 border border-amber-500/30">
              Automatic Grants
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedSpells.bonusSpells.map((bonusSpell) => {
              const isExpanded = expandedSpellIds[bonusSpell.id];
              return (
                <div
                  key={bonusSpell.id}
                  className="p-2.5 rounded bg-[#4a261c] border border-amber-500/30 shadow space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-[#f0e6d2]">
                        {bonusSpell.name}
                      </span>
                      <p className="text-[10px] text-amber-300/80 mt-0.5">
                        Source: {bonusSpell.origin}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={(e) => toggleExpandSpell(bonusSpell.id, e)}
                        className="text-[10px] text-amber-400 hover:underline px-1.5 py-0.5 bg-[#361a12] rounded border border-amber-500/20"
                      >
                        {isExpanded ? "▲ Hide" : "📖 Details"}
                      </button>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#361a12] text-amber-300 border border-amber-500/20">
                        {bonusSpell.level === 0
                          ? "Cantrip"
                          : `Level ${bonusSpell.level}`}
                      </span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="text-[11px] text-[#938f71] bg-[#361a12]/80 p-2 rounded border border-amber-500/20 mt-2 space-y-1">
                      <p>
                        {bonusSpell.description || "No description provided."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION A: CANTRIPS (LEVEL 0)                                       */}
      {/* =================================================================== */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wider flex justify-between items-center">
          <span>1. Cantrips (Level 0)</span>
          <span className="text-[10px] text-[#889c9b]">
            Known:{" "}
            {selectedSpells.classSpells.filter((s) => s.level === 0).length} /{" "}
            {budgets.cantripsLimit}
          </span>
        </h4>
        {availableCantrips.length === 0 ? (
          <p className="text-[#889c9b] text-xs italic">
            No cantrips found for this class.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2">
            {availableCantrips.map((spell) => {
              const isSelected = selectedSpells.classSpells.some(
                (s) => s.id === spell.id,
              );
              const isLocked = spell.level > budgets.maxSpellLevel;
              const isExpanded = expandedSpellIds[spell.id];

              return (
                <div
                  key={spell.id}
                  onClick={() => !isLocked && toggleClassSpell(spell)}
                  className={`p-3 rounded-lg border transition-all ${
                    isLocked
                      ? "bg-[#361a12]/40 border-[#a59075]/20 opacity-40 cursor-not-allowed"
                      : isSelected
                        ? "bg-[#937460]/40 border-amber-500 cursor-pointer shadow"
                        : "bg-[#4a261c]/60 border-[#a59075]/40 hover:border-[#a59075] cursor-pointer"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isSelected ? "bg-amber-600 border-amber-400 text-white text-[9px]" : "bg-[#361a12] border-[#a59075]/40"}`}
                      >
                        {isSelected && "✓"}
                      </div>
                      <span className="text-xs font-bold text-[#f0e6d2]">
                        {spell.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={(e) => toggleExpandSpell(spell.id, e)}
                        className="text-[10px] text-amber-400 hover:underline px-1.5 py-0.5 bg-[#361a12] rounded border border-amber-500/30"
                      >
                        {isExpanded ? "▲ Hide" : "📖 Details"}
                      </button>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#361a12] text-amber-400 border border-[#a59075]/30">
                        Cantrip
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#889c9b] mt-1 flex justify-between">
                    <span>School: {spell.school || "Universal"}</span>
                    <span>Casting: {spell.casting_time || "Action"}</span>
                  </div>
                  {/* Expanded Description Box */}
                  {isExpanded && (
                    <div className="text-[11px] text-[#938f71] bg-[#361a12]/90 p-2.5 rounded border border-amber-500/30 mt-2 space-y-1.5">
                      <p>
                        <strong className="text-[#f0e6d2]">Range:</strong>{" "}
                        {spell.range || "Self"}
                      </p>
                      <p>
                        <strong className="text-[#f0e6d2]">Description:</strong>{" "}
                        {spell.description ||
                          "No description recorded in archives."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* SECTION B: LEVELED SPELLS (LEVEL 1+)                                */}
      {/* =================================================================== */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wider flex justify-between items-center">
          <span>2. Leveled Spells (Level 1 - {budgets.maxSpellLevel})</span>
          <span className="text-[10px] text-[#889c9b]">
            Selected:{" "}
            {selectedSpells.classSpells.filter((s) => s.level > 0).length} /{" "}
            {budgets.spellLimit}
          </span>
        </h4>
        {availableLeveledSpells.length === 0 ? (
          <p className="text-[#889c9b] text-xs italic">
            No leveled spells found for this class.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
            {availableLeveledSpells.map((spell) => {
              const isSelected = selectedSpells.classSpells.some(
                (s) => s.id === spell.id,
              );
              const isLocked = spell.level > budgets.maxSpellLevel;
              const isExpanded = expandedSpellIds[spell.id];

              return (
                <div
                  key={spell.id}
                  onClick={() => !isLocked && toggleClassSpell(spell)}
                  className={`p-3 rounded-lg border transition-all ${
                    isLocked
                      ? "bg-[#361a12]/40 border-[#a59075]/20 opacity-40 cursor-not-allowed"
                      : isSelected
                        ? "bg-[#937460]/40 border-amber-500 cursor-pointer shadow"
                        : "bg-[#4a261c]/60 border-[#a59075]/40 hover:border-[#a59075] cursor-pointer"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isSelected ? "bg-amber-600 border-amber-400 text-white text-[9px]" : "bg-[#361a12] border-[#a59075]/40"}`}
                      >
                        {isSelected && "✓"}
                      </div>
                      <span className="text-xs font-bold text-[#f0e6d2]">
                        {spell.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={(e) => toggleExpandSpell(spell.id, e)}
                        className="text-[10px] text-amber-400 hover:underline px-1.5 py-0.5 bg-[#361a12] rounded border border-amber-500/30"
                      >
                        {isExpanded ? "▲ Hide" : "📖 Details"}
                      </button>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#361a12] text-amber-400 border border-[#a59075]/30">
                        Level {spell.level}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#889c9b] mt-1 flex justify-between">
                    <span>School: {spell.school || "Universal"}</span>
                    <span>Casting: {spell.casting_time || "Action"}</span>
                  </div>
                  {/* Expanded Description Box */}
                  {isExpanded && (
                    <div className="text-[11px] text-[#938f71] bg-[#361a12]/90 p-2.5 rounded border border-amber-500/30 mt-2 space-y-1.5">
                      <p>
                        <strong className="text-[#f0e6d2]">Range:</strong>{" "}
                        {spell.range || "Self"}
                      </p>
                      <p>
                        <strong className="text-[#f0e6d2]">Description:</strong>{" "}
                        {spell.description ||
                          "No description recorded in archives."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
