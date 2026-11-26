/**
 * ============================================================================
 * SUBRACES SEEDER UTILITY (`scripts/seed_subraces.js`)
 * ============================================================================
 * Purpose: Reads data/subraces.json, maps parent race names to foreign key UUIDs
 * from the races table, and upserts records into the Supabase subraces table.
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables in .env file!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const jsonPath = path.join(__dirname, "../data/subraces.json");

async function seedSubraces() {
  console.log("🌱 Starting subraces seeding process...");

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Subraces JSON file not found at: ${jsonPath}`);
    return;
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const subraces = JSON.parse(rawData);

  // 1. Fetch parent races from Supabase to build a name-to-UUID lookup map
  const { data: racesData, error: racesError } = await supabase
    .from("races")
    .select("id, name");

  if (racesError) {
    console.error("❌ Error fetching races from Supabase:", racesError.message);
    return;
  }

  const raceMap = {};
  racesData.forEach((r) => {
    raceMap[r.name.trim().toLowerCase()] = r.id;
  });

  console.log(
    `ℹ️ Loaded ${racesData.length} parent races for foreign key mapping.`,
  );

  // 2. Map and format payload for Supabase with foreign key lookups
  const payload = subraces
    .map((sub) => {
      const rawParentRace = sub.parent_race || "";
      const cleanParentRace = rawParentRace.trim().toLowerCase();
      const raceId = raceMap[cleanParentRace] || null;

      if (!raceId) {
        console.warn(
          `⚠️ Skipping subrace "${sub.name}" because parent race "${sub.parent_race}" was not found in the database.`,
        );
        return null;
      }

      return {
        race_id: raceId,
        name: sub.name,
        ability_bonuses: sub.ability_bonuses,
        traits: sub.traits,
        description: sub.description,
      };
    })
    .filter(Boolean); // Removes null entries

  if (payload.length === 0) {
    console.error("❌ No valid subraces to upsert after mapping.");
    return;
  }

  // 3. Upsert into Supabase subraces table (on conflict by name)
  const { data, error } = await supabase
    .from("subraces")
    .upsert(payload, { onConflict: "name" });

  if (error) {
    console.error("❌ Error upserting subraces:", error.message);
    return;
  }

  console.log(
    `✅ Successfully seeded ${payload.length} subraces into Supabase!`,
  );
}

seedSubraces();
