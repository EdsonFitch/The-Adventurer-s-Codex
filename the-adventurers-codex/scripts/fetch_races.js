/**
 * ============================================================================
 * RACE DATA FETCH UTILITY (`scripts/fetch_races.js`)
 * ============================================================================
 * Purpose: Connects to the public D&D 5e SRD API, retrieves official core race
 * data, structures it into local JSON format, and tags them for Supabase seeding.
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve directory paths safely for ES Modules (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.join(__dirname, "../data/races.json");

// List of official core D&D 5e SRD race indexes used by the API endpoint
const CORE_RACE_INDEXES = [
  "dwarf",
  "elf",
  "halfling",
  "human",
  "dragonborn",
  "gnome",
  "half-elf",
  "half-orc",
  "tiefling",
];

async function fetchRaces() {
  console.log("🔄 Fetching core races from 5e API...");
  const racesData = [];

  // Loop through each official race index to fetch its complete data packet
  for (const index of CORE_RACE_INDEXES) {
    try {
      console.log(`Fetching ${index}...`);
      const response = await fetch(
        `https://www.dnd5eapi.co/api/2014/races/${index}`,
      );

      // Throw an error if the network request fails
      if (!response.ok)
        throw new Error(`HTTP error status: ${response.status}`);

      const raw = await response.json();

      // Transform and sanitize the raw API data to precisely match your Supabase columns
      racesData.push({
        name: raw.name, // Race name (e.g., "Elf")
        speed: raw.speed, // Movement speed in feet (e.g., 30)
        size: raw.size, // Size category (e.g., "Medium")
        ability_bonuses: raw.ability_bonuses || [], // JSONB: Fixed or conditional stat bonuses
        traits: raw.traits || [], // JSONB: Array of racial traits & features
        description: raw.alignment || raw.size_description || "", // Narrative text / flavor overview
        is_custom: false, // Hybrid flag: false = official core rulebook data
        created_by: null, // Null for official content; stores user UUID if homebrew
      });
    } catch (err) {
      console.error(`❌ Failed to fetch race "${index}":`, err.message);
    }
  }

  // Ensure output directory exists and write the structured data to a local JSON file
  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(racesData, null, 2), "utf-8");
  console.log(
    `✅ Successfully saved ${racesData.length} core races to data/races.json`,
  );
}

// Execute the async fetch function
fetchRaces();
