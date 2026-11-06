/**
 * -----------------------------------------------------------------------------
 * SCRIPT: seed_background_personalities.js
 * -----------------------------------------------------------------------------
 * Description:
 * Reads the parsed personality data from `data/background_personalities.json`
 * and upserts the personality traits, ideals, bonds, and flaws directly into
 * the Supabase `backgrounds` table, matching each entry by its background name.
 *
 * Updates:
 * - Includes a name-cleaning function to strip sourcebook suffixes
 *   (e.g., "Smuggler (Ghosts of Saltmarsh)" -> "Smuggler") so they match
 *   clean database rows.
 * -----------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env file located at project root
dotenv.config();

// Define __filename and __dirname equivalents in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Retrieve Supabase configuration variables from process.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Error: Supabase URL or Key is missing in environment variables (.env)",
  );
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to parsed JSON file containing background personalities
const jsonFilePath = path.join(
  __dirname,
  "../data/background_personalities.json",
);

/**
 * Helper function to clean background names by removing parenthetical sourcebook tags.
 * Example: "Smuggler (Ghosts of Saltmarsh)" becomes "Smuggler"
 *
 * @param {string} rawName - The raw background name from JSON.
 * @returns {string} - The cleaned database-matching name.
 */
function cleanBackgroundName(rawName) {
  return rawName.replace(/\s*\([^)]*\)/g, "").trim();
}

/**
 * Main execution function to seed personality columns into Supabase.
 */
async function seedBackgroundPersonalities() {
  console.log("🌱 Reading parsed background personalities JSON file...");

  if (!fs.existsSync(jsonFilePath)) {
    console.error(`❌ Error: Parsed JSON file not found at ${jsonFilePath}`);
    console.error(
      'Please run "node scripts/parse_background_personalities.js" first.',
    );
    process.exit(1);
  }

  const fileData = fs.readFileSync(jsonFilePath, "utf8");
  const backgroundsData = JSON.parse(fileData);

  console.log(
    `🚀 Starting database upsert for ${backgroundsData.length} backgrounds...`,
  );

  let successCount = 0;
  let errorCount = 0;

  // Iterate over each background record and upsert into Supabase
  for (const bg of backgroundsData) {
    const databaseName = cleanBackgroundName(bg.name);

    const payload = {
      name: databaseName, // Use the cleaned name so it matches Supabase rows (e.g. "Smuggler")
      personality_traits: bg.personality_traits,
      ideals: bg.ideals,
      bonds: bg.bonds,
      flaws: bg.flaws,
    };

    // Upsert matching on the unique 'name' column of the backgrounds table
    const { error } = await supabase
      .from("backgrounds")
      .upsert(payload, { onConflict: "name" });

    if (error) {
      console.error(
        `❌ Failed to seed background "${databaseName}" (from original: "${bg.name}"):`,
        error.message,
      );
      errorCount++;
    } else {
      console.log(
        `✅ Successfully updated personality traits for: ${databaseName}`,
      );
      successCount++;
    }
  }

  console.log("\n----------------------------------------");
  console.log(`🎉 Seeding complete!`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed:     ${errorCount}`);
  console.log("----------------------------------------");
}

// Execute the seeder script
seedBackgroundPersonalities();
