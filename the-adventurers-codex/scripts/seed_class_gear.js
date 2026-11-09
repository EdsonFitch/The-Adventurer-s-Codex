/**
 * -----------------------------------------------------------------------------
 * SCRIPT: seed_class_gear.js
 * -----------------------------------------------------------------------------
 * Purpose:
 * Reads the structured `class_equipment.json` file and updates the existing
 * rows in the Supabase `classes` table with equipment, armor, weapon, and tool
 * proficiencies.
 * -----------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config"; // Loads environment variables from .env file

// Define directory paths using ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, "../data/class_equipment.json");

// Retrieve Supabase configuration from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate that environment variables are present before initializing the client
if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Missing Supabase URL or Service Role Key in environment variables.",
  );
  process.exit(1);
}

// Initialize Supabase client with the Service Role Key for full database update privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Main execution function to seed parsed class equipment data into Supabase.
 */
async function seedClassEquipment() {
  try {
    console.log("📖 Reading class equipment JSON file...");

    // Check if the JSON file exists before proceeding
    if (!fs.existsSync(jsonPath)) {
      console.error(
        `❌ JSON file not found at ${jsonPath}. Please run 'node scripts/parse_class_gear.js' first!`,
      );
      process.exit(1);
    }

    const rawData = fs.readFileSync(jsonPath, "utf8");
    const classDataList = JSON.parse(rawData);

    console.log(
      `🚀 Starting Supabase seed process for ${classDataList.length} classes...\n`,
    );

    // Iterate through each class in the JSON and update its record in Supabase
    for (const classItem of classDataList) {
      const {
        name,
        armor_proficiencies,
        weapon_proficiencies,
        tool_proficiencies,
        equipment,
      } = classItem;

      console.log(`⏳ Updating record for: ${name}...`);

      // Perform an update on the 'classes' table where the class name matches
      const { data, error } = await supabase
        .from("classes")
        .update({
          armor_proficiencies,
          weapon_proficiencies,
          tool_proficiencies,
          equipment,
        })
        .eq("name", name)
        .select();

      if (error) {
        console.error(`❌ Error updating ${name}:`, error.message);
      } else if (!data || data.length === 0) {
        console.warn(
          `⚠️ Warning: Class "${name}" was not found in the Supabase 'classes' table. Check spelling.`,
        );
      } else {
        console.log(`✅ Successfully updated ${name} in Supabase.`);
      }
    }

    console.log("\n🎉 Seeding process completed successfully!");
  } catch (err) {
    console.error("❌ Unexpected error during seeding execution:", err.message);
  }
}

// Execute the seeder function
seedClassEquipment();
