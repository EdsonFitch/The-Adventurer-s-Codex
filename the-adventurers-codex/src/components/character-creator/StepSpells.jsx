/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepSpells.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Manages Step 8 of Character Creation:
 * - Queries `class_level_progression` and `class_spells` for class budgets
 *   and valid spell pools.
 * - Automatically syncs `SPELL_GRANT` racial/feat spells into the grimoire.
 * - Separates Cantrips (Level 0) from Leveled Spells with collapsible details.
 *
 * Responsive & Touch Behavior:
 * - Budget Status Header: Stacks cleanly on narrow phones (`flex-col sm:flex-row`)
 *   with left-aligned mobile counts (`text-left sm:text-right`).
 * - Spell Cards & Accordion Controls: Applies `min-w-0`, `flex-wrap gap-2`, and
 *   `break-words` on spell names/descriptions, plus larger tap padding
 *   (`px-2.5 py-1 sm:px-1.5 sm:py-0.5`) on the `📖 Details` toggle button.
 *
 * @param {Object} props - Component properties.
 * -----------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function StepSpells({
  characterData,
  updateCharacterData,
  computedStats,
}) {
  const [progressionRules, setProgressionRules] = useState(null);
  const [availableSpells, setAvailableSpells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSpellIds, setExpandedSpellIds] = useState({});

  const selectedSpells = characterData.spells || {
    classSpells: [],
    bonusSpells: [],
  };

  const toggleExpandSpell = (spellId, e) => {
    if (e) e.stopPropagation();
    setExpandedSpellIds((prev) => ({
      ...prev,
      [spellId]: !prev[spellId],
    }));
  };

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

        const { data: progData, error: progErr } = await supabase
          .from("class_level_progression")
          .select("*")
          .eq("class_id", classId)
          .eq("level", level)
          .single();

        if (progErr) throw progErr;
        setProgressionRules(progData);

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
      case "PREPARED_STAT": {
        const wisMod = getMod(abilityScores.wisdom ?? abilityScores.wis);
        spellLimit = Math.max(1, level + wisMod);
        label = `${spellLimit} Prepared Spells (Level ${level} + WIS Mod)`;
        break;
      }
      case "WIZARD": {
        const intMod = getMod(abilityScores.intelligence ?? abilityScores.int);
        const preparedDaily = Math.max(1, level + intMod);
        label = `${spells_known} in Spellbook (${preparedDaily} Prepared Daily)`;
        break;
      }
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

  const availableCantrips = availableSpells.filter((s) => s.level === 0);
  const availableLeveledSpells = availableSpells.filter((s) => s.level > 0);

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
          Step 8: Spellcasting & Grimoire
        </h3>
        <p className="text-xs text-[#889c9b]">
          Select your cantrips and leveled spells. Tap &ldquo;📖 Details&rdquo;
          on any spell card to read its full description.
        </p>
      </div>

      {/* Budget Status Header */}
      <div className="bg-[#4a261c]/60 p-3.5 sm:p-4 rounded-lg border border-[#a59075]/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-inner">
        <div className="min-w-0">
          <p className="text-xs text-[#889c9b]">
            Progression Type:{" "}
            <span className="text-amber-300 font-semibold">
              {progressionRules?.prep_type || "Standard"}
            </span>
          </p>
          <p className="text-sm font-medium text-[#f0e6d2] mt-0.5 break-words">
            {budgets.label}
          </p>
        </div>
        <div className="text-left sm:text-right shrink-0">
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
        <div className="space-y-3 p-3.5 sm:p-4 bg-[#361a12] border border-amber-500/40 rounded-lg shadow">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              ✨ Granted Spells (Lineage, Feats & Features)
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/40 text-amber-200 border border-amber-500/30">
              Automatic Grants
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {selectedSpells.bonusSpells.map((bonusSpell) => {
              const isExpanded = expandedSpellIds[bonusSpell.id];
              return (
                <div
                  key={bonusSpell.id}
                  className="min-w-0 p-3 rounded bg-[#4a261c] border border-amber-500/30 shadow space-y-2"
                >
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#f0e6d2] break-words block">
                        {bonusSpell.name}
                      </span>
                      <p className="text-[10px] text-amber-300/80 mt-0.5 break-words">
                        Source: {bonusSpell.origin}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleExpandSpell(bonusSpell.id, e)}
                        className="text-[10px] text-amber-400 hover:underline px-2.5 py-1 sm:px-1.5 sm:py-0.5 bg-[#361a12] rounded border border-amber-500/20 cursor-pointer"
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
                    <div className="text-[11px] text-[#938f71] bg-[#361a12]/80 p-2.5 rounded border border-amber-500/20 mt-2 space-y-1 break-words">
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

      {/* =====================================================================
        SECTION A: CANTRIPS (LEVEL 0)
        ===================================================================== */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wider flex flex-wrap justify-between items-center gap-1">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
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
                  className={`min-w-0 p-3 rounded-lg border transition-all ${
                    isLocked
                      ? "bg-[#361a12]/40 border-[#a59075]/20 opacity-40 cursor-not-allowed"
                      : isSelected
                        ? "bg-[#937460]/40 border-amber-500 cursor-pointer shadow"
                        : "bg-[#4a261c]/60 border-[#a59075]/40 hover:border-[#a59075] cursor-pointer"
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-4 h-4 sm:w-3.5 sm:h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-amber-600 border-amber-400 text-white text-[9px]"
                            : "bg-[#361a12] border-[#a59075]/40"
                        }`}
                      >
                        {isSelected && "✓"}
                      </div>
                      <span className="text-xs font-bold text-[#f0e6d2] break-words">
                        {spell.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleExpandSpell(spell.id, e)}
                        className="text-[10px] text-amber-400 hover:underline px-2.5 py-1 sm:px-1.5 sm:py-0.5 bg-[#361a12] rounded border border-amber-500/30 cursor-pointer"
                      >
                        {isExpanded ? "▲ Hide" : "📖 Details"}
                      </button>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#361a12] text-amber-400 border border-[#a59075]/30">
                        Cantrip
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#889c9b] mt-1.5 flex flex-wrap justify-between gap-1">
                    <span>School: {spell.school || "Universal"}</span>
                    <span>Casting: {spell.casting_time || "Action"}</span>
                  </div>
                  {isExpanded && (
                    <div className="text-[11px] text-[#938f71] bg-[#361a12]/90 p-2.5 rounded border border-amber-500/30 mt-2 space-y-1.5 break-words">
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

      {/* =====================================================================
        SECTION B: LEVELED SPELLS (LEVEL 1+)
        ===================================================================== */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wider flex flex-wrap justify-between items-center gap-1">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
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
                  className={`min-w-0 p-3 rounded-lg border transition-all ${
                    isLocked
                      ? "bg-[#361a12]/40 border-[#a59075]/20 opacity-40 cursor-not-allowed"
                      : isSelected
                        ? "bg-[#937460]/40 border-amber-500 cursor-pointer shadow"
                        : "bg-[#4a261c]/60 border-[#a59075]/40 hover:border-[#a59075] cursor-pointer"
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-4 h-4 sm:w-3.5 sm:h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-amber-600 border-amber-400 text-white text-[9px]"
                            : "bg-[#361a12] border-[#a59075]/40"
                        }`}
                      >
                        {isSelected && "✓"}
                      </div>
                      <span className="text-xs font-bold text-[#f0e6d2] break-words">
                        {spell.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleExpandSpell(spell.id, e)}
                        className="text-[10px] text-amber-400 hover:underline px-2.5 py-1 sm:px-1.5 sm:py-0.5 bg-[#361a12] rounded border border-amber-500/30 cursor-pointer"
                      >
                        {isExpanded ? "▲ Hide" : "📖 Details"}
                      </button>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#361a12] text-amber-400 border border-[#a59075]/30">
                        Level {spell.level}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#889c9b] mt-1.5 flex flex-wrap justify-between gap-1">
                    <span>School: {spell.school || "Universal"}</span>
                    <span>Casting: {spell.casting_time || "Action"}</span>
                  </div>
                  {isExpanded && (
                    <div className="text-[11px] text-[#938f71] bg-[#361a12]/90 p-2.5 rounded border border-amber-500/30 mt-2 space-y-1.5 break-words">
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
