/**
 * -----------------------------------------------------------------------------
 * UTILITY: encumbranceCalculator.js
 * -----------------------------------------------------------------------------
 * Description:
 * Calculates total carried weight for items where `is_offsite === false`
 * and evaluates encumbrance thresholds against the character's Strength score.
 * -----------------------------------------------------------------------------
 */

/**
 * Calculates carried weight and encumbrance status.
 *
 * @param {Array} inventoryList - Full list of character inventory items.
 * @param {number} strengthScore - Character's Strength ability score (e.g., 10, 16).
 * @returns {Object} Encumbrance summary object.
 */
export function calculateEncumbrance(inventoryList = [], strengthScore = 10) {
  // Filter for items currently carried (not offsite in a lair/stash)
  const carriedItems = inventoryList.filter((item) => !item.is_offsite);

  // Sum up (item weight * quantity)
  const totalWeight = carriedItems.reduce((sum, item) => {
    const unitWeight = Number(item.equipment?.weight_lbs || 0);
    const qty = Number(item.quantity || 1);
    return sum + unitWeight * qty;
  }, 0);

  // D&D 5e Standard Encumbrance Rules
  const maxCapacity = strengthScore * 15;
  const encumberedThreshold = strengthScore * 5;
  const heavilyEncumberedThreshold = strengthScore * 10;

  let status = "Normal";
  let speedPenalty = 0;
  let hasDisadvantage = false;

  if (totalWeight > heavilyEncumberedThreshold) {
    status = "Heavily Encumbered";
    speedPenalty = 20;
    hasDisadvantage = true; // Disadvantage on ability checks, attack rolls, and saving throws that use Str, Dex, or Con
  } else if (totalWeight > encumberedThreshold) {
    status = "Encumbered";
    speedPenalty = 10; // Speed drops by 10 feet
  }

  return {
    totalWeight: Number(totalWeight.toFixed(1)),
    maxCapacity,
    encumberedThreshold,
    heavilyEncumberedThreshold,
    status,
    speedPenalty,
    hasDisadvantage,
  };
}
