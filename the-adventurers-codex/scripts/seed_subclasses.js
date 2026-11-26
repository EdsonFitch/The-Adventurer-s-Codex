/**
 * ============================================================================
 * SUBCLASSES SEEDER UTILITY (`scripts/seed_subclasses.js`)
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

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables in .env file!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const jsonPath = path.join(__dirname, "../data/subclasses.json");

async function seedSubclasses() {
  console.log("🌱 Starting subclasses seeding process...");

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Subclasses JSON file not found at: ${jsonPath}`);
    return;
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const subclasses = JSON.parse(rawData);

  // 1. Fetch parent classes from Supabase to build a name-to-UUID lookup map
  const { data: classesData, error: classesError } = await supabase
    .from("classes")
    .select("id, name");

  if (classesError) {
    console.error(
      "❌ Error fetching classes from Supabase:",
      classesError.message,
    );
    return;
  }

  const classMap = {};
  classesData.forEach((c) => {
    classMap[c.name.trim().toLowerCase()] = c.id;
  });

  console.log(
    `ℹ️ Loaded ${classesData.length} parent classes for foreign key mapping.`,
  );

  // 2. Map, sanitize, and filter out entries with missing class foreign keys
  const payload = subclasses
    .map((sub) => {
      let rawClassName = sub.class_name || "";
      const cleanClassName = rawClassName
        .replace(/\s*\(.*?\)/g, "")
        .trim()
        .toLowerCase();
      const classId = classMap[cleanClassName] || null;

      if (!classId) {
        console.warn(
          `⚠️ Skipping subclass "${sub.name}" because parent class "${sub.class_name}" was not found in the database.`,
        );
        return null;
      }

      return {
        class_id: classId,
        name: sub.name,
        flavor_text: sub.flavor_text,
        description: sub.description,
        features: sub.features,
        is_custom: sub.is_custom,
        created_by: sub.created_by,
      };
    })
    .filter(Boolean); // Removes null entries so NOT NULL constraints are respected

  if (payload.length === 0) {
    console.error("❌ No valid subclasses to upsert after mapping.");
    return;
  }

  // 3. Upsert into Supabase subclasses table
  const { data, error } = await supabase
    .from("subclasses")
    .upsert(payload, { onConflict: "name" });

  if (error) {
    console.error("❌ Error upserting subclasses:", error.message);
    return;
  }

  console.log(
    `✅ Successfully seeded ${payload.length} subclasses into Supabase!`,
  );
}

seedSubclasses();
