/**
 * -----------------------------------------------------------------------------
 * SCRIPT: seed_supplement.js
 * -----------------------------------------------------------------------------
 * Description:
 * Reads the structured JSON data (`data/background_supplement.json`), normalizes
 * background names by stripping sourcebook suffixes in parentheticals (e.g.,
 * "Acolyte (Player's Handbook)" -> "Acolyte"), matches them against existing
 * database rows, and updates languages, tool proficiencies, and defining event
 * tables directly in your Supabase `backgrounds` table.
 * -----------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env file located at the project root
dotenv.config();

// Define __filename and __dirname equivalents in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Retrieve Supabase credentials (uses .env variables or explicit fallbacks)
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || "https://gtmonloakolnrgsjqwln.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bW9ubG9ha29sbnJnc2pxd2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2OTIzNjgsImV4cCI6MjEwODI2ODM2OH0.eCrzNhIj-AHLHpaRb_GcdNNhSNG-W9QThBxMD1_QgY8";

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Error: Supabase URL or Key missing in environment variables (.env)",
  );
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Normalizes background names by removing parenthetical sourcebook suffixes.
 * E.g., "Acolyte (Player's Handbook)" -> "Acolyte"
 *       "Marine (Ghosts of Saltmarsh)" -> "Marine"
 *
 * @param {string} rawName - The raw background name from JSON.
 * @returns {string} - Cleaned name for matching with database records.
 */
function normalizeBackgroundName(rawName) {
  if (!rawName) return "";
  // Strips any parenthetical expression at the end of the name and trims whitespace
  return rawName.replace(/\s*\([^)]*\)/g, "").trim();
}

/**
 * Main asynchronous function to execute the database seeding process.
 */
async function seedSupplementData() {
  // Path pointing to the generated JSON file in your project data directory
  const jsonPath = path.join(__dirname, "../data/background_supplement.json");

  if (!fs.existsSync(jsonPath)) {
    console.error(
      `❌ Error: Parsed JSON file not found at ${jsonPath}. Please run 'node scripts/parse_supplement.js' first.`,
    );
    process.exit(1);
  }

  console.log(`📖 Reading parsed JSON data from: ${jsonPath}`);
  const parsedBackgrounds = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  console.log(
    `🔍 Fetching existing backgrounds from Supabase for name matching...`,
  );
  const { data: dbBackgrounds, error: fetchError } = await supabase
    .from("backgrounds")
    .select("id, name");

  if (fetchError) {
    console.error(
      "❌ Error fetching backgrounds from Supabase:",
      fetchError.message,
    );
    process.exit(1);
  }

  // Create a lookup map for matching both exact names and normalized names to DB IDs
  const dbNameMap = new Map();
  dbBackgrounds.forEach((bg) => {
    dbNameMap.set(bg.name.trim(), bg.id);
    dbNameMap.set(normalizeBackgroundName(bg.name), bg.id);
  });

  console.log(`📦 Ready to process ${parsedBackgrounds.length} entries...`);

  let updatedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const bgData of parsedBackgrounds) {
    const rawName = bgData.name;
    const cleanName = normalizeBackgroundName(rawName);

    // Look up matching database ID using exact name first, falling back to normalized name
    const targetId = dbNameMap.get(rawName) || dbNameMap.get(cleanName);

    if (!targetId) {
      console.warn(
        `⚠️ Warning: Could not find database match for background "${rawName}" (Cleaned: "${cleanName}"). Skipping.`,
      );
      skippedCount++;
      continue;
    }

    // Build update payload dynamically (only include non-empty properties)
    const updatePayload = {};
    if (bgData.languages && bgData.languages.length > 0) {
      updatePayload.languages = bgData.languages;
    }
    if (bgData.tool_proficiencies && bgData.tool_proficiencies.length > 0) {
      updatePayload.tool_proficiencies = bgData.tool_proficiencies;
    }
    if (bgData.defining_events && bgData.defining_events.length > 0) {
      updatePayload.defining_events = bgData.defining_events;
    }

    if (Object.keys(updatePayload).length === 0) {
      console.log(
        `   ⏭️ Skipping "${cleanName}" (no non-empty attributes to update).`,
      );
      skippedCount++;
      continue;
    }

    console.log(
      `🛠️ Seeding background: "${cleanName}" (Match: "${rawName}")...`,
    );

    // Execute update query against Supabase using target ID
    const { error: updateError } = await supabase
      .from("backgrounds")
      .update(updatePayload)
      .eq("id", targetId);

    if (updateError) {
      console.error(
        `   ❌ Failed to update "${cleanName}":`,
        updateError.message,
      );
      errorCount++;
    } else {
      console.log(`   ✅ Successfully seeded "${cleanName}"!`);
      updatedCount++;
    }
  }

  console.log("\n----------------------------------------");
  console.log(`🎉 Supabase Seeding Complete!`);
  console.log(`   Successfully Seeded: ${updatedCount}`);
  console.log(`   Skipped / Unmatched: ${skippedCount}`);
  console.log(`   Errors Encountered:   ${errorCount}`);
  console.log("----------------------------------------");
}

// Execute the seeder script
seedSupplementData();
