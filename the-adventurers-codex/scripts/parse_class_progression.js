/**
 * -----------------------------------------------------------------------------
 * SCRIPT: parse_class_progression.js
 * -----------------------------------------------------------------------------
 * Purpose:
 * Parses block-formatted raw text data representing D&D 5e class level progression
 * rules (Levels 1-20) and converts it into a structured JSON dataset ready to seed
 * the 'class_level_progression' table in Supabase.
 *
 * Requirements:
 * - Input File:  data/raw/class_progression_raw.txt
 * - Output File: data/class_level_progression.json
 * -----------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// -----------------------------------------------------------------------------
// 1. FILE PATH CONFIGURATION (ESM-compatible directory resolution)
// -----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawFilePath = path.join(
  __dirname,
  "../data/raw/class_progression_raw.txt",
);
const outputFilePath = path.join(
  __dirname,
  "../data/class_level_progression.json",
);

/**
 * Helper Function: determinePrepType
 * Categorizes the spell preparation mechanism based on class rules and text content.
 *
 * @param {string} className - Name of the active D&D class.
 * @param {string} line - Full text line containing level metrics.
 * @returns {string} Prep type flag ('KNOWN', 'PREPARED_STAT', or 'WIZARD')
 */
function determinePrepType(className, line) {
  const normalizedClass = className.trim().toUpperCase();

  if (normalizedClass === "WIZARD") {
    return "WIZARD"; // Dual mechanic: Spellbook growth + Level + INT mod
  }

  if (line.includes("Spells Prepared")) {
    return "PREPARED_STAT"; // Cleric, Druid, Paladin, Artificer
  }

  return "KNOWN"; // Bard, Ranger, Sorcerer, Warlock (Fixed Spells Known)
}

/**
 * -----------------------------------------------------------------------------
 * MAIN EXECUTION FUNCTION: parseClassProgression
 * -----------------------------------------------------------------------------
 */
function parseClassProgression() {
  try {
    console.log(`🔍 Reading raw text from: ${rawFilePath}`);

    // Check if the raw text file exists before attempting to read
    if (!fs.existsSync(rawFilePath)) {
      throw new Error(
        `Raw data file not found at ${rawFilePath}. Please create the file before running this parser.`,
      );
    }

    const rawContent = fs.readFileSync(rawFilePath, "utf8");
    const lines = rawContent.split("\n");

    const parsedRecords = [];
    let currentClass = "";

    // -------------------------------------------------------------------------
    // 2. LINE-BY-LINE REGEX PARSING
    // -------------------------------------------------------------------------
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines or comment lines starting with #
      if (!trimmedLine || trimmedLine.startsWith("#")) return;

      // Detect Class Header blocks (e.g., "=== BARD ===" or "=== CLERIC ===")
      if (trimmedLine.startsWith("===") && trimmedLine.endsWith("===")) {
        currentClass = trimmedLine.replace(/===/g, "").trim();
        console.log(`📌 Found Class Section: [${currentClass}]`);
        return;
      }

      // Parse Level Rows (e.g., "Level 1: Max Spell Level 1 | Spells Known 4 | Cantrips Known 2")
      if (trimmedLine.startsWith("Level")) {
        if (!currentClass) {
          console.warn(
            `⚠️ Warning: Level line found at index ${index} without a defined class header. Skipping.`,
          );
          return;
        }

        // Regular Expressions to extract individual numeric values
        const levelMatch = trimmedLine.match(/Level\s+(\d+):/i);
        const maxSpellLevelMatch = trimmedLine.match(
          /Max\s+Spell\s+Level\s+(\d+)/i,
        );
        const cantripsKnownMatch = trimmedLine.match(
          /Cantrips\s+Known\s+(\d+)/i,
        );
        const spellsKnownMatch = trimmedLine.match(/Spells\s+Known\s+(\d+)/i);

        // Fail-safe check for fundamental fields
        if (!levelMatch || !maxSpellLevelMatch) {
          console.warn(
            `⚠️ Could not parse metrics on line ${index + 1}: "${trimmedLine}"`,
          );
          return;
        }

        const level = parseInt(levelMatch[1], 10);
        const maxSpellLevel = parseInt(maxSpellLevelMatch[1], 10);
        const cantripsKnown = cantripsKnownMatch
          ? parseInt(cantripsKnownMatch[1], 10)
          : 0;
        const spellsKnown = spellsKnownMatch
          ? parseInt(spellsKnownMatch[1], 10)
          : null;

        // Determine preparation mode
        const prepType = determinePrepType(currentClass, trimmedLine);

        // Construct standardized JSON object matching Supabase database schema columns
        const record = {
          class_name: currentClass,
          level: level,
          max_spell_level: maxSpellLevel,
          cantrips_known: cantripsKnown,
          spells_known: spellsKnown, // null for Clerics/Druids/Paladins/Artificers
          prep_type: prepType,
        };

        parsedRecords.push(record);
      }
    });

    // -------------------------------------------------------------------------
    // 3. SAVE GENERATED JSON DATA
    // -------------------------------------------------------------------------
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(parsedRecords, null, 2),
      "utf8",
    );

    console.log(
      `\n✅ Success! Successfully parsed ${parsedRecords.length} level progression rows.`,
    );
    console.log(`📄 Output written to: ${outputFilePath}`);
  } catch (err) {
    console.error("❌ Parsing Error:", err.message);
  }
}

// Execute script
parseClassProgression();
