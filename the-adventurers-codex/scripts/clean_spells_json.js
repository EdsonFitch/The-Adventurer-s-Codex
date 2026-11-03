/**
 * -----------------------------------------------------------------------------
 * SCRIPT: clean_spells_json.js
 * -----------------------------------------------------------------------------
 * Purpose:
 * Sanitizes the raw scraped spells JSON file to remove PDF extraction artifacts:
 * - Removes headers, levels, and class list strings parsed as spells (e.g., "Level 1", "(TCoE)").
 * - Filters out entries with an "Unknown" school of magic.
 * - Cleans and normalizes classes, components, and description texts.
 * -----------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// -----------------------------------------------------------------------------
// 1. FILE PATH CONFIGURATION
// -----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFilePath = path.join(__dirname, "../data/spells.json");
const outputFilePath = path.join(__dirname, "../data/spells_cleaned.json");

/**
 * -----------------------------------------------------------------------------
 * 2. MAIN SANITIZATION FUNCTION
 * -----------------------------------------------------------------------------
 */
function cleanSpellsData() {
  try {
    console.log(`🔍 Reading raw spells JSON from: ${inputFilePath}`);

    if (!fs.existsSync(inputFilePath)) {
      throw new Error(
        `File not found at ${inputFilePath}. Please ensure spells.json exists in the data directory.`,
      );
    }

    const rawData = fs.readFileSync(inputFilePath, "utf8");
    const spells = JSON.parse(rawData);

    const cleanedSpells = [];
    let removedCount = 0;

    spells.forEach((spell) => {
      const spellName = (spell.name || "").trim();
      const school = (spell.school || "").trim();

      // -----------------------------------------------------------------------
      // HEURISTIC ARTIFACT DETECTION:
      // Filter out non-spell entries created during PDF text scraping:
      // - Schools marked as "Unknown"
      // - Names containing source book tags like "(TCoE)"
      // - Section titles starting with "Level " or matching generic headers
      // - Names containing commas (which usually denote multi-class header blocks)
      // -----------------------------------------------------------------------
      const isArtifact =
        school.toLowerCase() === "unknown" ||
        spellName.includes("(TCoE)") ||
        spellName.toLowerCase().startsWith("level ") ||
        spellName.toLowerCase() === "cantrips" ||
        spellName.toLowerCase() === "wizard" ||
        spellName.toLowerCase() === "ranger" ||
        spellName.includes(",");

      if (isArtifact) {
        console.warn(`🗑️ Removing parsing artifact: "${spellName}"`);
        removedCount++;
        return;
      }

      // -----------------------------------------------------------------------
      // DATA CLEANING & NORMALIZATION
      // -----------------------------------------------------------------------

      // Clean classes array (strip accidental book tags like "(TCoE)" and empty strings)
      const cleanClasses = (spell.classes || [])
        .map((c) => c.replace(/\(TCoE\)/g, "").trim())
        .filter((c) => c.length > 0);

      // Normalize components array
      const cleanComponents = (spell.components || [])
        .map((comp) => comp.replace(/\n/g, " ").trim())
        .filter((comp) => comp.length > 0);

      // Format description text
      let cleanDescription = (spell.description || "")
        .replace(/\r\n/g, "\n")
        .replace(/\n+/g, "\n")
        .trim();

      // Push valid, sanitized spell object
      cleanedSpells.push({
        ...spell,
        name: spellName,
        school: school,
        classes: cleanClasses,
        components: cleanComponents,
        description: cleanDescription,
      });
    });

    // Write sanitized output file
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(cleanedSpells, null, 2),
      "utf8",
    );

    console.log(`\n✅ Cleaning Complete!`);
    console.log(`📊 Total Processed: ${spells.length} entries`);
    console.log(`🗑️ Total Artifacts Removed: ${removedCount} entries`);
    console.log(`📄 Clean dataset successfully saved to: ${outputFilePath}`);
  } catch (err) {
    console.error("❌ Error cleaning spells dataset:", err.message);
  }
}

// Execute the cleaning utility
cleanSpellsData();
