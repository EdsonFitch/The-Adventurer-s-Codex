/**
 * -----------------------------------------------------------------------------
 * SERVICE: characterService.js
 * -----------------------------------------------------------------------------
 * Description:
 * Data access and business logic layer for the Character Sheet view.
 * Handles consolidated relational fetches across characters, stats, skills,
 * classes, spells, and inventory, as well as live combat updates and rest logic.
 * -----------------------------------------------------------------------------
 */

import { supabase } from "../supabaseClient";
import { computeCharacterStats } from "../utils/statCalculator";

/**
 * Fetches the complete, consolidated character record from Supabase including
 * all relational dependencies (race, class, stats, skills, spells, inventory).
 *
 * @param {string} characterId - The UUID of the active character.
 * @returns {Promise<Object>} The fully assembled character object with computed stats.
 */
export async function fetchFullCharacterSheet(characterId) {
  if (!characterId)
    throw new Error("A character ID is required to fetch the sheet.");

  // 1. Fetch main character row along with foreign key relations for race and background
  const { data: character, error: charError } = await supabase
    .from("characters")
    .select(
      `
      *,
      races:race_id (*),
      subraces:subrace_id (*),
      backgrounds:background_id (*)
    `,
    )
    .eq("id", characterId)
    .single();

  if (charError) throw charError;

  // 2. Fetch parallel relational tables concurrently for performance
  const [
    statsRes,
    skillsRes,
    classesRes,
    spellsRes,
    inventoryRes,
    progressionRes,
  ] = await Promise.all([
    supabase
      .from("character_stats")
      .select("*")
      .eq("character_id", characterId)
      .maybeSingle(),
    supabase
      .from("character_skills")
      .select("*, skills(*)")
      .eq("character_id", characterId),
    supabase
      .from("character_classes")
      .select("*, classes(*), subclasses(*)")
      .eq("character_id", characterId),
    supabase
      .from("character_spells")
      .select("*, spells(*)")
      .eq("character_id", characterId),
    supabase
      .from("character_inventory")
      .select("*, equipment(*)")
      .eq("character_id", characterId),
    supabase.from("class_level_progression").select("*"),
  ]);

  // 3. Extract data results with safe fallbacks
  const stats = statsRes.data || {};
  const skillsList = skillsRes.data || [];
  const classesList = classesRes.data || [];
  const spellsList = spellsRes.data || [];
  const inventoryList = inventoryRes.data || [];
  const progressions = progressionRes.data || [];

  // Determine primary class and level
  const primaryClassRelation = classesList[0] || {};
  const primaryClass = primaryClassRelation.classes || {};
  const subClass = primaryClassRelation.subclasses || null;
  const level = character.level || primaryClassRelation.level_in_class || 1;

  // Format base ability scores for stat calculator
  const baseAbilityScores = {
    str: stats.strength ?? character.ability_scores?.str ?? 10,
    dex: stats.dexterity ?? character.ability_scores?.dex ?? 10,
    con: stats.constitution ?? character.ability_scores?.con ?? 10,
    int: stats.intelligence ?? character.ability_scores?.int ?? 10,
    wis: stats.wisdom ?? character.ability_scores?.wis ?? 10,
    cha: stats.charisma ?? character.ability_scores?.cha ?? 10,
  };

  // Run through master stat calculation utility
  const computedStats = computeCharacterStats(
    { baseAbilityScores, level, baseProficiencies: character.languages || [] },
    [],
  );

  // 4. Assemble consolidated character sheet package
  return {
    ...character,
    race: character.races,
    subrace: character.subraces,
    background: character.backgrounds,
    primaryClass,
    subClass,
    classes: classesList,
    stats: baseAbilityScores,
    computed: computedStats,
    skills: skillsList,
    spells: spellsList,
    inventory: inventoryList,
    progressions,
  };
}

/**
 * Updates live combat metrics (HP, Temp HP, Inspiration, Conditions, Spell Slots)
 * in Supabase with debounced optimistic state support.
 *
 * @param {string} characterId - The UUID of the character.
 * @param {Object} updates - Key-value pair of columns to update.
 * @returns {Promise<Object>} The updated character record.
 */
export async function updateCharacterLiveStats(characterId, updates) {
  const { data, error } = await supabase
    .from("characters")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", characterId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update character live stats:", error);
    throw error;
  }

  return data;
}

/**
 * Executes Short Rest or Long Rest rules, updating HP recovery, resetting expended
 * spell slots, and syncing changes back to Supabase.
 *
 * @param {string} characterId - The UUID of the character.
 * @param {string} restType - "SHORT" or "LONG".
 * @param {Object} currentState - Current character state (HP, Max HP, Spell Slots Used, etc.).
 * @returns {Promise<Object>} The updated character record after resting.
 */
export async function executeRest(characterId, restType, currentState) {
  let updates = {};

  if (restType === "LONG") {
    // Long Rest: Restore full HP, clear temp HP, reset all expended spell slots
    updates = {
      hp_current: currentState.hp_max,
      hp_temp: 0,
      spell_slots_used: {},
    };
  } else if (restType === "SHORT") {
    // Short Rest: Keep current HP/Temp HP as is, but can be expanded for Warlock pact slots if needed
    updates = {};
  }

  return await updateCharacterLiveStats(characterId, updates);
}
