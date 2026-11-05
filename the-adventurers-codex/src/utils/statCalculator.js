/**
 * -----------------------------------------------------------------------------
 * UTILITY: statCalculator.js
 * -----------------------------------------------------------------------------
 * Description:
 * Pure, deterministic calculation engine for D&D 5e character attributes.
 * Evaluates raw character base state against an array of active JSONB effects
 * (accumulated from lineage, subraces, classes, subclasses, and feats) to compute
 * final scores, ability modifiers, breakdown histories, and granted bonuses.
 * -----------------------------------------------------------------------------
 */

/**
 * Calculates the standard D&D ability score modifier from a raw total score.
 * Formula: Math.floor((score - 10) / 2)
 *
 * @param {number} score - The total numerical ability score (e.g., 16).
 * @returns {string} The formatted modifier string with explicit signs (e.g., "+3", "-1").
 */
export function calculateModifier(score) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Calculates the standard D&D proficiency bonus based on overall character level.
 * Formula: Math.floor((level - 1) / 4) + 2
 *
 * @param {number} level - Character's overall level (1 to 20).
 * @returns {number} The calculated proficiency bonus (e.g., +2 for levels 1-4).
 */
export function calculateProficiencyBonus(level) {
  return Math.floor((level - 1) / 4) + 2;
}

/**
 * Main calculation engine function.
 * Processes character base state and an array of active effect objects to compute
 * final scores, breakdown histories, proficiency totals, and granted resources.
 *
 * @param {Object} characterState - Contains baseAbilityScores, level, baseProficiencies.
 * @param {Array} activeEffects - Flattened array of effect objects extracted from active features, feats, and lineage.
 * @returns {Object} Computed package including abilityScores, abilityModifiers, abilityBreakdowns, proficiencyBonus, proficiencies, bonusSpells, and grantedResources.
 */
export function computeCharacterStats(characterState = {}, activeEffects = []) {
  // 1. Destructure base state with safe fallback defaults for standard 6 abilities
  const {
    baseAbilityScores = {},
    level = 1,
    baseProficiencies = [],
  } = characterState;

  // Standardize input keys across short keys ('str') and full names ('strength')
  const rawStr = baseAbilityScores.str ?? baseAbilityScores.strength ?? 15;
  const rawDex = baseAbilityScores.dex ?? baseAbilityScores.dexterity ?? 14;
  const rawCon = baseAbilityScores.con ?? baseAbilityScores.constitution ?? 13;
  const rawInt = baseAbilityScores.int ?? baseAbilityScores.intelligence ?? 12;
  const rawWis = baseAbilityScores.wis ?? baseAbilityScores.wisdom ?? 10;
  const rawCha = baseAbilityScores.cha ?? baseAbilityScores.charisma ?? 8;

  // 2. Initialize mutable final ability scores with base values
  const finalAbilityScores = {
    str: Number(rawStr) || 15,
    dex: Number(rawDex) || 14,
    con: Number(rawCon) || 13,
    int: Number(rawInt) || 12,
    wis: Number(rawWis) || 10,
    cha: Number(rawCha) || 8,
  };

  // 3. Track breakdown history for UI breakdown badges
  const abilityBreakdowns = {
    str: { base: finalAbilityScores.str, bonuses: [] },
    dex: { base: finalAbilityScores.dex, bonuses: [] },
    con: { base: finalAbilityScores.con, bonuses: [] },
    int: { base: finalAbilityScores.int, bonuses: [] },
    wis: { base: finalAbilityScores.wis, bonuses: [] },
    cha: { base: finalAbilityScores.cha, bonuses: [] },
  };

  const grantedProficiencies = new Set(
    baseProficiencies.map((p) => p.toLowerCase()),
  );
  const bonusSpells = [];
  const grantedResources = [];

  // 4. Iterate through all active effects and route them dynamically based on effect type
  if (Array.isArray(activeEffects)) {
    activeEffects.forEach((effect) => {
      if (!effect || !effect.type) return;

      switch (effect.type) {
        case "STAT_MOD":
        case "ABILITY_SCORE_INCREASE": {
          let targetStat = effect.target
            ? String(effect.target).toLowerCase()
            : null;

          // Normalize full stat names or uppercase abbreviations to short keys
          if (targetStat === "strength" || targetStat === "str")
            targetStat = "str";
          if (targetStat === "dexterity" || targetStat === "dex")
            targetStat = "dex";
          if (targetStat === "constitution" || targetStat === "con")
            targetStat = "con";
          if (targetStat === "intelligence" || targetStat === "int")
            targetStat = "int";
          if (targetStat === "wisdom" || targetStat === "wis")
            targetStat = "wis";
          if (targetStat === "charisma" || targetStat === "cha")
            targetStat = "cha";

          const value = Number(effect.value) || 0;

          if (targetStat && finalAbilityScores[targetStat] !== undefined) {
            finalAbilityScores[targetStat] += value;
            abilityBreakdowns[targetStat].bonuses.push({
              source: effect.source || "Lineage / Feat",
              value: value,
            });
          }
          break;
        }

        case "PROFICIENCY_GRANT": {
          if (effect.target) {
            grantedProficiencies.add(effect.target.toLowerCase());
          }
          break;
        }

        case "SPELL_GRANT": {
          if (effect.spell || effect.target) {
            bonusSpells.push(effect);
          }
          break;
        }

        case "RESOURCE_GRANT": {
          grantedResources.push(effect);
          break;
        }

        default:
          break;
      }
    });
  }

  // 5. Compute final modifiers from aggregate ability scores
  const finalModifiers = {
    str: calculateModifier(finalAbilityScores.str),
    dex: calculateModifier(finalAbilityScores.dex),
    con: calculateModifier(finalAbilityScores.con),
    int: calculateModifier(finalAbilityScores.int),
    wis: calculateModifier(finalAbilityScores.wis),
    cha: calculateModifier(finalAbilityScores.cha),
  };

  // 6. Compute standard proficiency bonus based on level
  const proficiencyBonus = calculateProficiencyBonus(level);

  // 7. Return comprehensive computed package for UI rendering and final review forge
  return {
    abilityScores: finalAbilityScores,
    abilityModifiers: finalModifiers,
    abilityBreakdowns,
    proficiencyBonus,
    proficiencies: Array.from(grantedProficiencies),
    bonusSpells,
    grantedResources,
  };
}
