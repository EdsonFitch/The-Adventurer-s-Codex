/**
 * -----------------------------------------------------------------------------
 * UTILITY: statCalculator.js
 * -----------------------------------------------------------------------------
 * Description:
 * Pure, deterministic calculation engine for D&D 5e character attributes.
 * Evaluates raw character base state against an array of active JSONB effects
 * (accumulated from lineage, subraces, classes, subclasses, and feats) to compute
 * final scores, ability modifiers, breakdown histories, granted bonuses, and
 * dynamic Armor Class (AC) derived from equipped armor and shields.
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
 * Processes character base state, active effects, and equipped inventory items
 * to compute final scores, modifiers, AC, and granted resources.
 *
 * @param {Object} characterState - Contains baseAbilityScores, level, baseProficiencies, inventory.
 * @param {Array} activeEffects - Flattened array of effect objects extracted from active features, feats, and lineage.
 * @returns {Object} Computed package including abilityScores, abilityModifiers, armorClass, proficiencyBonus, etc.
 */
export function computeCharacterStats(characterState = {}, activeEffects = []) {
  // 1. Destructure base state with safe fallback defaults for standard 6 abilities
  const {
    baseAbilityScores = {},
    level = 1,
    baseProficiencies = [],
    inventory = [],
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

  const dexModVal = Math.floor((finalAbilityScores.dex - 10) / 2);

  // ---------------------------------------------------------------------------
  // 6. DYNAMIC ARMOR CLASS (AC) CALCULATION FROM EQUIPPED INVENTORY
  // ---------------------------------------------------------------------------
  let computedAC = 10 + dexModVal; // Default unarmored AC (10 + Dex mod)
  let equippedArmorFound = false;

  if (Array.isArray(inventory)) {
    inventory.forEach((item) => {
      if (!item || !item.is_equipped) return;
      const eq = item.equipment || {};
      const category = (eq.category || "").toLowerCase();
      const name = (eq.name || item.custom_name || "").toLowerCase();

      // Check if item is a Shield
      if (category.includes("shield") || name.includes("shield")) {
        const shieldBonus =
          Number(eq.base_ac || 2) + Number(eq.enchantment_bonus || 0);
        computedAC += shieldBonus;
        return;
      }

      // Check if item is Armor
      if (
        category.includes("armor") ||
        eq.base_ac !== null ||
        eq.base_ac !== undefined
      ) {
        const baseAC = Number(eq.base_ac || 10);
        const enchantment = Number(eq.enchantment_bonus || 0);

        // Determine armor weight class based on base AC or name to apply D&D 5e Dex modifier rules
        // Light armor: adds full Dex mod (e.g. Padded 11, Leather 11, Studded Leather 12)
        // Medium armor: adds Dex mod up to +2 max (e.g. Hide 12, Chain Shirt 13, Scale Mail 14, Breastplate 14, Half Plate 15)
        // Heavy armor: adds NO Dex mod (e.g. Ring Mail 14, Chain Mail 16, Splint 17, Plate 18)
        if (baseAC >= 16) {
          // Heavy Armor (No Dex modifier)
          computedAC = baseAC + enchantment;
        } else if (
          baseAC >= 13 ||
          name.includes("hide") ||
          name.includes("scale") ||
          name.includes("breastplate") ||
          name.includes("half plate")
        ) {
          // Medium Armor (Max +2 Dex)
          const cappedDex = Math.min(dexModVal, 2);
          computedAC = baseAC + cappedDex + enchantment;
        } else {
          // Light Armor (Full Dex mod)
          computedAC = baseAC + dexModVal + enchantment;
        }
        equippedArmorFound = true;
      }
    });
  }

  // Fallback to manual character override AC if present and no armor equipped
  const finalAC =
    characterState.armor_class_override && !equippedArmorFound
      ? characterState.armor_class_override
      : computedAC;

  // 7. Compute standard proficiency bonus based on level
  const proficiencyBonus = calculateProficiencyBonus(level);

  // 8. Return comprehensive computed package for UI rendering
  return {
    abilityScores: finalAbilityScores,
    abilityModifiers: finalModifiers,
    abilityBreakdowns,
    armorClass: finalAC,
    proficiencyBonus,
    proficiencies: Array.from(grantedProficiencies),
    bonusSpells,
    grantedResources,
  };
}
