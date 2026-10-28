/**
 * ============================================================================
 * SUBRACES PARSER UTILITY (`scripts/parse_subraces.js`)
 * ============================================================================
 * Purpose: Reads data/raw/subraces_raw.txt, parses structured blocks, and
 * generates data/subraces.json.
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawFilePath = path.join(__dirname, "../data/raw/subraces_raw.txt");
const outputJsonPath = path.join(__dirname, "../data/subraces.json");

function parseSubraces() {
  console.log("🔄 Parsing raw subraces text file...");

  if (!fs.existsSync(rawFilePath)) {
    console.error(`❌ Raw subraces file not found at: ${rawFilePath}`);
    return;
  }

  const rawData = fs.readFileSync(rawFilePath, "utf-8");

  // Split entries by the '===' delimiter
  const rawEntries = rawData
    .split("===")
    .map((e) => e.trim())
    .filter(Boolean);
  const subraces = [];

  for (const entry of rawEntries) {
    try {
      // Extract fields using regex matching line-by-line or multiline for description
      const subraceMatch = entry.match(/^SUBRACE:\s*(.+)$/m);
      const raceMatch = entry.match(/^RACE:\s*(.+)$/m);
      const abilityMatch = entry.match(/^ABILITY:\s*(\{.*?\})/ms);
      const traitsMatch =
        entry.match(/^TRAITS:\s*(\[.*?\])\s*\n[A-Z]+:/ms) ||
        entry.match(/^TRAITS:\s*(\[.*?\])\s*$/ms);
      const descMatch = entry.match(/^DESCRIPTION:\s*([\s\S]*)$/m);

      if (!subraceMatch || !raceMatch) {
        console.warn(
          "⚠️ Skipping an entry due to missing SUBRACE or RACE header.",
        );
        continue;
      }

      const name = subraceMatch[1].trim();
      const parentRace = raceMatch[1].trim();

      // Parse ability bonuses JSON safely
      let ability_bonuses = {};
      if (abilityMatch) {
        try {
          ability_bonuses = JSON.parse(abilityMatch[1].trim());
        } catch (e) {
          console.warn(
            `⚠️ Failed to parse ability bonuses JSON for subrace: ${name}`,
          );
        }
      }

      // Parse traits JSON array safely
      let traits = [];
      if (traitsMatch) {
        try {
          traits = JSON.parse(traitsMatch[1].trim());
        } catch (e) {
          console.warn(`⚠️ Failed to parse traits JSON for subrace: ${name}`);
        }
      }

      const description = descMatch ? descMatch[1].trim() : "";

      subraces.push({
        name,
        parent_race: parentRace, // temporary field used by the seeder for foreign key lookup
        ability_bonuses,
        traits,
        description,
      });
    } catch (err) {
      console.error("❌ Error parsing entry:", err.message);
    }
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputJsonPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputJsonPath, JSON.stringify(subraces, null, 2), "utf-8");
  console.log(
    `✅ Successfully parsed ${subraces.length} subraces into ${outputJsonPath}`,
  );
}

parseSubraces();
