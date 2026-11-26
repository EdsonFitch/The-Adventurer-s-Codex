/**
 * -----------------------------------------------------------------------------
 * SCRIPT: patch_background_variants.js
 * -----------------------------------------------------------------------------
 * Description:
 * Scans the Supabase `backgrounds` table for variant backgrounds that contain
 * empty columns (such as `skill_proficiencies`, `tool_proficiencies`, `languages`,
 * `equipment`, `feature_name`, `feature_description`, and `description`).
 *
 * Logic:
 * 1. Defines a comprehensive mapping linking variant background names to their
 *    official 5e parent background templates (e.g., Marine -> Soldier, Courtier -> Guild Artisan).
 * 2. Fetches all records from Supabase.
 * 3. Identifies records with missing data fields.
 * 4. Merges missing template data into the variant record while keeping any
 *    existing background-specific data (like unique personality traits, ideals, bonds, flaws).
 * 5. Updates the corresponding rows directly in Supabase.
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

// Retrieve Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Error: Supabase URL or Key missing in environment variables (.env)",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Variant-to-Parent background template mapping rules according to D&D 5e sourcebooks.
 * Maps exact database names or base names to their canonical core template.
 */
const VARIANT_PARENT_MAP = {
  // Sword Coast Adventurer's Guide (SCAG)
  "City Watch": "Soldier",
  "Clan Crafter": "Guild Artisan",
  "Cloistered Scholar": "Sage",
  Courtier: "Guild Artisan",
  "Faction Agent": "Acolyte",
  "Far Traveler": "Outlander",
  Inheritor: "Folk Hero",
  "Knight of the Order": "Soldier",
  "Mercenary Veteran": "Soldier",
  "Urban Bounty Hunter": "Criminal",
  "Uthgardt Tribe Member": "Outlander",
  "Waterdhavian Noble": "Noble",

  // Ghosts of Saltmarsh (GoS)
  Fisher: "Sailor",
  Marine: "Soldier",
  Shipwright: "Guild Artisan",
  Smuggler: "Sailor",

  // Tomb of Annihilation (ToA)
  Anthropologist: "Sage",
  Archaeologist: "Sage",

  // Acquisitions Incorporated & Eberron
  "Celebrity Adventurer's Scion": "Folk Hero",
  "House Agent": "Guild Artisan",
};

/**
 * Checks if a database value is empty (null, undefined, empty array, or empty string).
 *
 * @param {any} val - Value to check.
 * @returns {boolean} - True if value is empty.
 */
function isEmpty(val) {
  if (val === null || val === undefined) return true;
  if (typeof val === "string" && val.trim() === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  if (typeof val === "object" && Object.keys(val).length === 0) return true;
  return false;
}

/**
 * Helper function to normalize background names for matching.
 * Removes parenthetical source tags if present (e.g., "Marine (Ghosts of Saltmarsh)" -> "Marine").
 *
 * @param {string} name - Raw background name.
 * @returns {string} - Cleaned name.
 */
function normalizeName(name) {
  return name.replace(/\s*\([^)]*\)/g, "").trim();
}

/**
 * Main execution function to patch missing database fields.
 */
async function patchBackgroundVariants() {
  console.log("🔍 Fetching all backgrounds from Supabase...");

  // Fetch all existing backgrounds from Supabase
  const { data: allBackgrounds, error } = await supabase
    .from("backgrounds")
    .select("*");

  if (error) {
    console.error("❌ Error fetching backgrounds:", error.message);
    process.exit(1);
  }

  console.log(
    `📦 Loaded ${allBackgrounds.length} total backgrounds from database.`,
  );

  // Create a quick lookup map of base backgrounds by normalized name
  const backgroundLookup = new Map();
  allBackgrounds.forEach((bg) => {
    backgroundLookup.set(bg.name.trim(), bg);
    backgroundLookup.set(normalizeName(bg.name), bg);
  });

  let patchedCount = 0;
  let skippedCount = 0;

  // Key fields that must be populated
  const fieldsToPatch = [
    "skill_proficiencies",
    "tool_proficiencies",
    "languages",
    "equipment",
    "feature_name",
    "feature_description",
    "description",
  ];

  for (const bg of allBackgrounds) {
    const cleanName = normalizeName(bg.name);
    const parentName =
      VARIANT_PARENT_MAP[cleanName] || VARIANT_PARENT_MAP[bg.name];

    // Determine if this background has missing critical fields
    const missingFields = fieldsToPatch.filter((field) => isEmpty(bg[field]));

    if (missingFields.length === 0) {
      skippedCount++;
      continue;
    }

    if (!parentName) {
      console.warn(
        `⚠️ Background "${bg.name}" has missing fields [${missingFields.join(", ")}], but no parent template mapping was found.`,
      );
      continue;
    }

    const parentBg = backgroundLookup.get(parentName);

    if (!parentBg) {
      console.error(
        `❌ Parent background "${parentName}" not found in database for variant "${bg.name}".`,
      );
      continue;
    }

    console.log(
      `🛠️ Patching "${bg.name}" using template from "${parentName}" for fields: [${missingFields.join(", ")}]...`,
    );

    // Prepare update payload with missing data copied from parent template
    const updatePayload = {};
    missingFields.forEach((field) => {
      if (!isEmpty(parentBg[field])) {
        updatePayload[field] = parentBg[field];
      }
    });

    if (Object.keys(updatePayload).length === 0) {
      console.warn(
        `⚠️ Parent background "${parentName}" also lacked data for missing fields on "${bg.name}".`,
      );
      continue;
    }

    // Execute update query in Supabase
    const { error: updateError } = await supabase
      .from("backgrounds")
      .update(updatePayload)
      .eq("id", bg.id);

    if (updateError) {
      console.error(`❌ Failed to update "${bg.name}":`, updateError.message);
    } else {
      console.log(`✅ Successfully patched "${bg.name}"!`);
      patchedCount++;
    }
  }

  console.log("\n----------------------------------------");
  console.log(`🎉 Background Variant Patching Complete!`);
  console.log(`   Patched Rows: ${patchedCount}`);
  console.log(`   Already Complete: ${skippedCount}`);
  console.log("----------------------------------------");
}

// Execute the patch script
patchBackgroundVariants();
