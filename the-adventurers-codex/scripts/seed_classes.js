/**
 * ============================================================================
 * CLASSES SEEDER UTILITY (`scripts/seed_classes.js`)
 * ============================================================================
 * Purpose: Reads data/classes.json and upserts records into the Supabase
 * classes table matching the schema (id, name, hit_die, primary_ability, etc.).
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables in .env file!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const jsonPath = path.join(__dirname, "../data/classes.json");

async function seedClasses() {
  console.log("🌱 Starting classes seeding process...");

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Classes JSON file not found at: ${jsonPath}`);
    return;
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const classes = JSON.parse(rawData);

  // Upsert into Supabase classes table based on unique name conflict
  const { data, error } = await supabase
    .from("classes")
    .upsert(classes, { onConflict: "name" });

  if (error) {
    console.error("❌ Error upserting classes:", error.message);
    return;
  }

  console.log(
    `✅ Successfully seeded ${classes.length} class(es) into Supabase!`,
  );
}

seedClasses();
