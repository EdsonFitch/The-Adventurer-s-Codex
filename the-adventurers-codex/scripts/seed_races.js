/**
 * ============================================================================
 * SUPABASE RACES SEEDER (`scripts/seed_races.js`)
 * ============================================================================
 * Purpose: Reads locally generated `data/races.json` and seeds records into
 * your Supabase database using process.env credentials.
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

// Load environment variables from .env file located at the project root
dotenv.config({ path: path.join(__dirname, "../.env") });

// Retrieve credentials from process.env (supports both Vite naming and standard naming)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Anon Key in .env file!");
  process.exit(1);
}

// Initialize standalone Supabase client for pipeline scripts
const supabase = createClient(supabaseUrl, supabaseKey);

const jsonPath = path.join(__dirname, "../data/races.json");

async function seedRaces() {
  console.log("🔄 Reading local data/races.json...");

  // Ensure source JSON exists
  if (!fs.existsSync(jsonPath)) {
    console.error(
      '❌ races.json file not found! Run "node scripts/fetch_races.js" first.',
    );
    return;
  }

  const races = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`📦 Found ${races.length} races ready for database insertion.`);

  // Upsert records into Supabase table
  const { data, error } = await supabase
    .from("races")
    .upsert(races, { onConflict: "name" });

  if (error) {
    console.error("❌ Supabase Seeding Error:", error.message);
  } else {
    console.log("🎉 Successfully seeded core races into Supabase!");
  }
}

seedRaces();
