/**
 * Script Name: seed_subclass_features.js
 * Description: Reads compiled subclass features from data/subclass_features.json,
 *              resolves subclass names to their corresponding subclass_id foreign keys,
 *              clears existing rows, and performs a clean batch insert into Supabase.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// Recreate __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load credentials safely from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Error: Supabase URL or Service Role Key is missing from environment variables.",
  );
  process.exit(1);
}

// Initialize Supabase client with Service Role Key for administrative write access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Define path to JSON data file
const dataPath = path.join(__dirname, "../data/subclass_features.json");

/**
 * Main execution function to clear table, resolve foreign keys, and seed subclass features.
 */
async function seedSubclassFeatures() {
  try {
    console.log("Reading subclass features data file...");
    if (!fs.existsSync(dataPath)) {
      console.error(`Error: Data file not found at ${dataPath}`);
      return;
    }

    const rawData = fs.readFileSync(dataPath, "utf8");
    const subclassFeatures = JSON.parse(rawData);

    // Fetch existing subclasses from Supabase to map subclass names to their UUIDs (subclass_id)
    console.log("Fetching subclasses reference table from Supabase...");
    const { data: subclassesData, error: subclassesError } = await supabase
      .from("subclasses")
      .select("id, name");

    if (subclassesError) {
      console.error(
        "Error fetching subclasses table:",
        subclassesError.message,
      );
      return;
    }

    // Create a lookup dictionary: { "champion": "uuid-string", ... }
    const subclassMap = {};
    subclassesData.forEach((sub) => {
      if (sub.name) {
        subclassMap[sub.name.toLowerCase().trim()] = sub.id;
      }
    });

    const rawRows = [];
    let unmappedSubclasses = new Set();

    // Map subclass features data to match actual table columns
    subclassFeatures.forEach((feature) => {
      const subName = feature.subclass
        ? feature.subclass.toLowerCase().trim()
        : "";
      const subclassId = subclassMap[subName];

      if (!subclassId && feature.subclass) {
        unmappedSubclasses.add(feature.subclass);
      }

      rawRows.push({
        subclass_id: subclassId || null,
        level: feature.level || 1,
        name: feature.name,
        description: feature.description,
        effects: feature.effects,
      });
    });

    if (unmappedSubclasses.size > 0) {
      console.warn(
        `Warning: Could not find matching UUIDs in 'subclasses' table for: ${Array.from(unmappedSubclasses).slice(0, 10).join(", ")}...`,
      );
    }

    // Deduplicate rows locally based on subclass_id and name
    const uniqueRowsMap = new Map();
    rawRows.forEach((row) => {
      const uniqueKey = `${row.subclass_id}_${row.name}`;
      uniqueRowsMap.set(uniqueKey, row);
    });
    const rowsToInsert = Array.from(uniqueRowsMap.values());

    console.log(
      `Prepared ${rowsToInsert.length} unique subclass feature records for seeding (${rawRows.length - rowsToInsert.length} duplicates removed).`,
    );

    // Clear existing subclass_features table to prevent duplicate build-up
    console.log("Clearing existing records from subclass_features table...");
    const { error: deleteError } = await supabase
      .from("subclass_features")
      .delete()
      .not("id", "is", null);

    if (deleteError) {
      console.error("Error clearing table:", deleteError.message);
      return;
    }

    // Insert records in batches using clean insert
    const batchSize = 50;
    for (let i = 0; i < rowsToInsert.length; i += batchSize) {
      const batch = rowsToInsert.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("subclass_features")
        .insert(batch);

      if (error) {
        console.error(
          `Error inserting batch ${i / batchSize + 1}:`,
          error.message,
        );
      } else {
        console.log(
          `Successfully inserted batch ${i / batchSize + 1} (${batch.length} rows).`,
        );
      }
    }

    console.log("Subclass features seeding process completed successfully.");
  } catch (error) {
    console.error("Unexpected error during subclass features seeding:", error);
  }
}

// Execute the seeder
seedSubclassFeatures();
