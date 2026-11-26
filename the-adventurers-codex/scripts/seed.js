/**
 * ============================================================================
 * SUPABASE DATABASE SEEDER SCRIPT
 * ============================================================================
 * Learning Concept: Batch Operations and Upserts with Supabase
 * Inserting hundreds of rows in small chunks (batches) prevents payload size
 * errors and request timeouts while ensuring reliable seeding.
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase environment variables in .env file!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to split an array into smaller chunks
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

async function seedSpells() {
  const spellsPath = path.join(__dirname, "../data/spells.json");

  if (!fs.existsSync(spellsPath)) {
    console.error(`❌ File not found: ${spellsPath}`);
    return;
  }

  console.log("🔄 Reading data/spells.json...");
  const spellsData = JSON.parse(fs.readFileSync(spellsPath, "utf-8"));

  // Clean or map fields to match exact Supabase column names
  const formattedSpells = spellsData.map((spell) => ({
    name: spell.name,
    level: spell.level,
    school: spell.school,
    casting_time: spell.casting_time,
    range: spell.range,
    components: spell.components || [],
    duration: spell.duration,
    concentration: spell.concentration || false,
    ritual: spell.ritual || false,
    description: spell.description,
  }));

  console.log(
    `📦 Preparing to seed ${formattedSpells.length} spells into Supabase...`,
  );

  // Split into batches of 50 for optimal payload size
  const BATCH_SIZE = 50;
  const batches = chunkArray(formattedSpells, BATCH_SIZE);

  let insertedCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(
      `🚀 Seeding batch ${i + 1} of ${batches.length} (${batch.length} spells)...`,
    );

    // Upsert using 'name' as the unique conflict target
    const { data, error } = await supabase
      .from("spells")
      .upsert(batch, { onConflict: "name" });

    if (error) {
      console.error(`❌ Error seeding batch ${i + 1}:`, error.message);
    } else {
      insertedCount += batch.length;
    }
  }

  console.log(`🎉 Successfully seeded ${insertedCount} spells into Supabase!`);
}

// Execute the seeder
seedSpells();
