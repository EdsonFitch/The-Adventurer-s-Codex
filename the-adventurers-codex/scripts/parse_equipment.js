/**
 * -----------------------------------------------------------------------------
 * SCRIPT: parse_equipment.js
 * -----------------------------------------------------------------------------
 * Purpose:
 * Parses the raw text file containing weapons, armor, potions, scrolls, and
 * adventuring gear (`equipment_raw.txt`), transforming it into a structured
 * JSON file (`equipment_detailed.json`) matching our upgraded Supabase schema.
 * -----------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Define directory paths using ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawFilePath = path.join(__dirname, "../data/raw/equipment_raw.txt");
const outputJsonPath = path.join(__dirname, "../data/equipment_detailed.json");

/**
 * Helper function to clean up raw value fields.
 * Converts dash placeholders ("—" or "-") or empty values to null or appropriate defaults.
 */
function cleanValue(val) {
  if (!val || val === "—" || val === "-") return null;
  return val.trim();
}

/**
 * Helper function to parse boolean fields from strings ("true" / "false").
 */
function parseBoolean(val) {
  const cleaned = cleanValue(val);
  if (cleaned === "true") return true;
  if (cleaned === "false") return false;
  return false;
}

/**
 * Helper function to parse numeric values (integers or floats).
 */
function parseNumber(val, isFloat = false) {
  const cleaned = cleanValue(val);
  if (cleaned === null) return null;
  const parsed = isFloat ? parseFloat(cleaned) : parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Helper function to parse JSONB consumable effects or fallback to empty object.
 */
function parseJsonField(val) {
  const cleaned = cleanValue(val);
  if (!cleaned) return {};
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // If it's a plain string instead of valid JSON, wrap it safely
    return { note: cleaned };
  }
}

/**
 * Main execution function to read, parse, and output the equipment catalog data.
 */
function parseEquipmentFile() {
  try {
    console.log("📖 Reading raw equipment file...");
    const rawData = fs.readFileSync(rawFilePath, "utf8");

    // Split the file by blocks using double newlines or item headers
    // Each item starts with "NAME:"
    const rawBlocks = rawData.split(/\n\s*\n/).filter(Boolean);
    const parsedEquipment = [];

    for (const block of rawBlocks) {
      // Skip chunk markers or metadata lines that do not start with NAME:
      if (!block.includes("NAME:")) continue;

      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      let itemData = {
        name: "",
        category: "Adventuring Gear",
        rarity: "Common",
        is_magical: false,
        enchantment_bonus: 0,
        damage_dice: null,
        damage_type: null,
        weapon_range_type: null,
        extra_damage: null,
        base_ac: null,
        stealth_disadvantage: false,
        cost_gp: 0.0,
        weight_lbs: 0.0,
        consumable_effect: {},
        lore: null,
      };

      for (const line of lines) {
        // Split each line strictly at the first colon
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) continue;

        const key = line.substring(0, colonIndex).trim().toUpperCase();
        const rawVal = line.substring(colonIndex + 1).trim();

        switch (key) {
          case "NAME":
            itemData.name = cleanValue(rawVal);
            break;
          case "CATEGORY":
            itemData.category = cleanValue(rawVal) || "Adventuring Gear";
            break;
          case "RARITY":
            itemData.rarity = cleanValue(rawVal) || "Common";
            break;
          case "MAGICAL":
            itemData.is_magical = parseBoolean(rawVal);
            break;
          case "ENCHANTMENT":
            itemData.enchantment_bonus = parseNumber(rawVal) || 0;
            break;
          case "DAMAGE_DICE":
            itemData.damage_dice = cleanValue(rawVal);
            break;
          case "DAMAGE_TYPE":
            itemData.damage_type = cleanValue(rawVal);
            break;
          case "RANGE_TYPE":
            itemData.weapon_range_type = cleanValue(rawVal);
            break;
          case "EXTRA_DAMAGE":
            itemData.extra_damage = cleanValue(rawVal);
            break;
          case "BASE_AC":
            itemData.base_ac = parseNumber(rawVal);
            break;
          case "STEALTH_DISADVANTAGE":
            itemData.stealth_disadvantage = parseBoolean(rawVal);
            break;
          case "COST_GP":
            itemData.cost_gp = parseNumber(rawVal, true) || 0.0;
            break;
          case "WEIGHT_LBS":
            itemData.weight_lbs = parseNumber(rawVal, true) || 0.0;
            break;
          case "CONSUMABLE_EFFECT":
            itemData.consumable_effect = parseJsonField(rawVal);
            break;
          case "LORE":
            itemData.lore = cleanValue(rawVal);
            break;
          default:
            break;
        }
      }

      if (itemData.name) {
        parsedEquipment.push(itemData);
        console.log(`✅ Parsed: [${itemData.category}] ${itemData.name}`);
      }
    }

    // Write output to target JSON file in data/
    fs.writeFileSync(
      outputJsonPath,
      JSON.stringify(parsedEquipment, null, 2),
      "utf8",
    );
    console.log(
      `\n🎉 Parsing complete! Successfully parsed ${parsedEquipment.length} items.`,
    );
    console.log(`📁 Saved output to: ${outputJsonPath}`);
  } catch (err) {
    console.error("❌ Error parsing equipment raw file:", err.message);
  }
}

// Execute the parser
parseEquipmentFile();
