/**
 * -----------------------------------------------------------------------------
 * SCRIPT: seed_class_progression.js
 * -----------------------------------------------------------------------------
 * Purpose:
 * Seeds the Supabase 'class_level_progression' table using the compiled JSON
 * data from 'data/class_level_progression.json'.
 * - Queries the 'classes' table to map class names to their corresponding database UUIDs.
 * - Bulk upserts the progression rows to prevent duplicate key collisions.
 * -----------------------------------------------------------------------------
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables from .env if present
dotenv.config();

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Error: Missing Supabase URL or Key in environment variables.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ESM directory path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonFilePath = path.join(
  __dirname,
  "../data/class_level_progression.json",
);

/**
 * -----------------------------------------------------------------------------
 * MAIN EXECUTION FUNCTION: seedClassProgression
 * -----------------------------------------------------------------------------
 */
async function seedClassProgression() {
  try {
    console.log(`🔍 Reading generated JSON from: ${jsonFilePath}`);

    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(
        `JSON file not found at ${jsonFilePath}. Please run parse_class_progression.js first.`,
      );
    }

    const fileContent = fs.readFileSync(jsonFilePath, "utf8");
    const progressionItems = JSON.parse(fileContent);

    console.log(
      `📦 Loaded ${progressionItems.length} progression records from JSON.`,
    );

    // 1. Fetch all classes from Supabase to map names to foreign key UUIDs
    console.log("🌐 Fetching classes reference table from Supabase...");
    const { data: classesData, error: classFetchErr } = await supabase
      .from("classes")
      .select("id, name");

    if (classFetchErr) throw classFetchErr;

    // Create a lookup map: { "Bard": "uuid-1234", "Cleric": "uuid-5678", ... }
    const classMap = {};
    (classesData || []).forEach((cls) => {
      // Store both normal case and lowercase for robust matching
      classMap[cls.name.trim()] = cls.id;
      classMap[cls.name.trim().toLowerCase()] = cls.id;
    });

    // 2. Map JSON records to match Supabase schema columns and foreign key UUIDs
    const payload = [];
    let skippedCount = 0;

    for (const item of progressionItems) {
      const classNameKey = item.class_name.trim();
      const classId =
        classMap[classNameKey] || classMap[classNameKey.toLowerCase()];

      if (!classId) {
        console.warn(
          `⚠️ Warning: Could not find class UUID in database for class name: "${item.class_name}". Skipping level ${item.level}.`,
        );
        skippedCount++;
        continue;
      }

      payload.push({
        class_id: classId,
        level: item.level,
        max_spell_level: item.max_spell_level,
        cantrips_known: item.cantrips_known,
        spells_known: item.spells_known, // Null for prepared casters
        prep_type: item.prep_type,
      });
    }

    if (payload.length === 0) {
      console.error(
        "❌ Error: No valid rows to insert. Check class name mappings.",
      );
      return;
    }

    console.log(
      `🚀 Upserting ${payload.length} rows into 'class_level_progression' table (${skippedCount} skipped)...`,
    );

    // 3. Perform bulk upsert into Supabase (conflicts handled on class_id + level unique constraint)
    const { data, error: upsertErr } = await supabase
      .from("class_level_progression")
      .upsert(payload, { onConflict: "class_id,level" })
      .select();

    if (upsertErr) throw upsertErr;

    console.log(
      `\n✅ Success! Seeded ${data ? data.length : payload.length} progression records into Supabase.`,
    );
  } catch (err) {
    console.error("❌ Seeding Error:", err.message);
  }
}

// Execute seeder
seedClassProgression();
