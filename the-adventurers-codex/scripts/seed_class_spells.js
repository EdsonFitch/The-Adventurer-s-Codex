/**
 * -----------------------------------------------------------------------------
 * SCRIPT: seed_class_spells.js
 * -----------------------------------------------------------------------------
 * Purpose:
 * Reads local spell data from '../data/spells.json', matches each spell name
 * and class name to their respective UUIDs in Supabase ('spells' and 'classes' tables),
 * and bulk-inserts the relationships into the 'class_spells' junction table.
 *
 * How to run:
 * node scripts/seed_class_spells.js
 * -----------------------------------------------------------------------------
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables from the root .env file
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Note: Ensure you use your service_role key if RLS blocks public inserts,
// or standard anon key if your RLS policies allow insertion.
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "❌ Error: Supabase URL or Key missing in environment variables (.env)",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Resolve current directory path for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedClassSpells() {
  try {
    console.log("📂 Reading spells.json from data directory...");
    const jsonPath = path.join(__dirname, "../data/spells.json");

    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Could not find spells.json at path: ${jsonPath}`);
    }

    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const spellsJson = JSON.parse(rawData);

    console.log(`📥 Loaded ${spellsJson.length} entries from spells.json.`);

    // 1. Fetch all existing classes and spells from Supabase to map names to UUIDs
    console.log(
      "🌐 Fetching reference tables (classes & spells) from Supabase...",
    );
    const [
      { data: classesData, error: classErr },
      { data: spellsData, error: spellErr },
    ] = await Promise.all([
      supabase.from("classes").select("id, name"),
      supabase.from("spells").select("id, name"),
    ]);

    if (classErr) throw classErr;
    if (spellErr) throw spellErr;

    // Create lowercase lookup Maps for high-performance O(1) matching
    const classMap = new Map(
      classesData.map((c) => [c.name.trim().toLowerCase(), c.id]),
    );
    const spellMap = new Map(
      spellsData.map((s) => [s.name.trim().toLowerCase(), s.id]),
    );

    console.log(
      `✨ Found ${classesData.length} classes and ${spellsData.length} spells in Supabase database.`,
    );

    const linksToInsert = [];
    let skippedCount = 0;

    // 2. Iterate through JSON entries and match classes to spells
    for (const spellItem of spellsJson) {
      if (!spellItem.name || !spellItem.classes) {
        skippedCount++;
        continue;
      }

      // Filter out PDF parser artifacts (e.g. headers like "Cantrips", "Level 2", empty strings)
      const spellNameClean = spellItem.name.trim().toLowerCase();
      const spellId = spellMap.get(spellNameClean);

      if (!spellId) {
        skippedCount++;
        continue;
      }

      for (const className of spellItem.classes) {
        if (!className || typeof className !== "string") continue;

        const cleanClassName = className.trim().toLowerCase();
        const classId = classMap.get(cleanClassName);

        if (classId) {
          linksToInsert.push({
            class_id: classId,
            spell_id: spellId,
          });
        }
      }
    }

    // Remove potential duplicate pair definitions from JSON
    const uniqueLinks = Array.from(
      new Map(
        linksToInsert.map((item) => [
          `${item.class_id}-${item.spell_id}`,
          item,
        ]),
      ).values(),
    );

    console.log(
      `🔗 Prepared ${uniqueLinks.length} unique class-spell relationships for insertion (Skipped ${skippedCount} items/artifacts).`,
    );

    if (uniqueLinks.length === 0) {
      console.log(
        "⚠️ No links to insert. Check if your spells table is seeded first!",
      );
      return;
    }

    // 3. Batch insert relationships into Supabase class_spells table
    console.log("🚀 Inserting records into 'class_spells' table...");

    // Supabase recommends batching large arrays (e.g. chunks of 500)
    const chunkSize = 500;
    for (let i = 0; i < uniqueLinks.length; i += chunkSize) {
      const chunk = uniqueLinks.slice(i, i + chunkSize);

      const { error: insertError } = await supabase
        .from("class_spells")
        .upsert(chunk, { onConflict: "class_id,spell_id" });

      if (insertError) {
        console.error(
          `❌ Error inserting chunk ${i / chunkSize + 1}:`,
          insertError.message,
        );
      } else {
        console.log(
          `✅ Successfully inserted batch ${i / chunkSize + 1} (${chunk.length} links).`,
        );
      }
    }

    console.log("🎉 Class-spell seeding process completed successfully!");
  } catch (err) {
    console.error("❌ Fatal error during class-spells seeding:", err);
  }
}

seedClassSpells();
