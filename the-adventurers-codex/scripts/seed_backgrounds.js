/**
 * ============================================================================
 * SUPABASE BACKGROUNDS SEEDER (`scripts/seed_backgrounds.js`)
 * ============================================================================
 * Purpose: Reads the locally parsed `data/backgrounds.json` file and bulk-upserts
 * all background entries into your Supabase database table.
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Resolve directory paths safely for ES Modules (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root .env file
dotenv.config({ path: path.join(__dirname, "../.env") });

// Retrieve Supabase credentials from process.env (supports both Vite and standard naming)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Guard clause: Ensure credentials are present before attempting connection
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Anon Key in your .env file!");
  process.exit(1);
}

// Initialize the standalone Supabase client for pipeline automation
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to the locally compiled JSON file
const jsonPath = path.join(__dirname, "../data/backgrounds.json");

async function seedBackgrounds() {
  console.log("🔄 Reading local data/backgrounds.json...");

  // Guard clause: Ensure the parsed JSON file exists before seeding
  if (!fs.existsSync(jsonPath)) {
    console.error(
      '❌ data/backgrounds.json file not found! Please run "node scripts/parse_backgrounds.js" first.',
    );
    return;
  }

  // Parse the JSON data into a JavaScript object array
  const backgrounds = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(
    `📦 Found ${backgrounds.length} backgrounds ready for database seeding.`,
  );

  // Perform a batch upsert into the 'backgrounds' table
  // { onConflict: 'name' } ensures existing backgrounds are updated rather than duplicated
  const { data, error } = await supabase
    .from("backgrounds")
    .upsert(backgrounds, { onConflict: "name" });

  if (error) {
    console.error("❌ Supabase Seeding Error:", error.message);
  } else {
    console.log("🎉 Successfully seeded all backgrounds into Supabase!");
  }
}

// Execute the async seeding function
seedBackgrounds();
