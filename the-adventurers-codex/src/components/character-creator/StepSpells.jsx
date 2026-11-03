/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepSpells.jsx
 * -----------------------------------------------------------------------------
 * Purpose:
 * Character creation wizard step for selecting cantrips and spells.
 * - Queries 'class_level_progression' for the active class and level budgets.
 * - Queries the 'class_spells' relation table to restrict available spells
 *   strictly to the class list (e.g., Bard spells only).
 * - Separates class-budgeted spells from bonus/racial/feat spells.
 * -----------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function StepSpells({ characterData, updateCharacterData }) {
  // -------------------------------------------------------------------------
  // 1. COMPONENT STATE MANAGEMENT
  // -------------------------------------------------------------------------
  const [progressionRules, setProgressionRules] = useState(null);
  const [availableSpells, setAvailableSpells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Character's chosen spells structure: { classSpells: [], bonusSpells: [] }
  const selectedSpells = characterData.spells || {
    classSpells: [],
    bonusSpells: [],
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
          setError("No class selected. Please go back to Step 1.");
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

        // B. Fetch ONLY the spells linked to this class via the 'class_spells' table
        // This uses Supabase relational joining to pull the spell details matching spell_id
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

        // Flatten the joined response to extract clean spell objects
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
  // 3. BUDGET CALCULATION HELPERS
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
  // 4. SELECTION & BUDGET ENFORCEMENT HANDLERS
  // -------------------------------------------------------------------------
  const toggleClassSpell = (spell) => {
    // Prevent selecting spells higher than the character's max accessible spell level
    if (spell.level > budgets.maxSpellLevel) {
      alert(
        `As a level ${characterData.level} caster, you cannot access level ${spell.level} spells yet (Max: Level ${budgets.maxSpellLevel}).`,
      );
      return;
    }

    const exists = selectedSpells.classSpells.some((s) => s.id === spell.id);
    let updatedClassSpells;

    if (exists) {
      // Remove spell if already selected
      updatedClassSpells = selectedSpells.classSpells.filter(
        (s) => s.id !== spell.id,
      );
    } else {
      // Enforce cantrip vs leveled spell limits
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

    updateCharacterData({
      ...characterData,
      spells: { ...selectedSpells, classSpells: updatedClassSpells },
    });
  };

  // -------------------------------------------------------------------------
  // 5. RENDER UI
  // -------------------------------------------------------------------------
  if (loading)
    return (
      <div className="p-6 text-center text-white">
        Loading valid spell lists...
      </div>
    );
  if (error) return <div className="p-6 text-center text-red-400">{error}</div>;

  return (
    <div className="p-6 space-y-6 text-white max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold">Spell Selection</h2>

      {/* Budget Status Header */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-400">
            Progression Type:{" "}
            <span className="text-indigo-400 font-semibold">
              {progressionRules?.prep_type}
            </span>
          </p>
          <p className="text-lg font-medium">{budgets.label}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">
            Cantrips:{" "}
            {selectedSpells.classSpells.filter((s) => s.level === 0).length} /{" "}
            {budgets.cantripsLimit}
          </p>
          <p className="text-sm text-slate-400">
            Class Spells:{" "}
            {selectedSpells.classSpells.filter((s) => s.level > 0).length} /{" "}
            {budgets.spellLimit}
          </p>
        </div>
      </div>

      {/* Class-Restricted Spell Picker Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Available Spells for Your Class
        </h3>
        {availableSpells.length === 0 ? (
          <p className="text-slate-400 text-sm italic">
            No spells found linked to this class in the database. Make sure your
            `class_spells` table is seeded.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
            {availableSpells.map((spell) => {
              const isSelected = selectedSpells.classSpells.some(
                (s) => s.id === spell.id,
              );
              const isLocked = spell.level > budgets.maxSpellLevel;

              return (
                <div
                  key={spell.id}
                  onClick={() => !isLocked && toggleClassSpell(spell)}
                  className={`p-3 rounded-lg border transition-all ${
                    isLocked
                      ? "bg-slate-900/40 border-slate-800 opacity-40 cursor-not-allowed"
                      : isSelected
                        ? "bg-indigo-900/40 border-indigo-500 cursor-pointer"
                        : "bg-slate-800/60 border-slate-700 hover:border-slate-500 cursor-pointer"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-semibold">{spell.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700">
                      {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{spell.school}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
