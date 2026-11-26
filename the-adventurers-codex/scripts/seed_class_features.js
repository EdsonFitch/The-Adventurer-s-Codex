/**
 * Script Name: seed_class_features.js
 * Description: Reads compiled class features from data/class_features.json,
 *              resolves class names to their corresponding class_id foreign keys,
 *              deduplicates rows within each batch, and upserts them into Supabase.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// Recreate __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase credentials provided from project environment
const SUPABASE_URL = "https://gtmonloakolnrgsjqwln.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bW9ubG9ha29sbnJnc2pxd2xuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjY5MjM2OCwiZXhwIjoyMTA4MjY4MzY4fQ.54TfFDE6QD51jm_hJZINQzjYxwQUP6aj18u4jX64_Wc";

// Initialize Supabase client with Service Role Key for administrative write access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Define path to JSON data file
const dataPath = path.join(__dirname, "../data/class_features.json");

/**
 * Main execution function to resolve foreign keys, deduplicate, and seed class features.
 */
async function seedClassFeatures() {
  try {
    console.log("Reading class features data file...");
    if (!fs.existsSync(dataPath)) {
      console.error(`Error: Data file not found at ${dataPath}`);
      return;
    }

    const rawData = fs.readFileSync(dataPath, "utf8");
    const classFeaturesMap = JSON.parse(rawData);

    // Fetch existing classes from Supabase to map class names to their UUIDs (class_id)
    console.log("Fetching classes reference table from Supabase...");
    const { data: classesData, error: classesError } = await supabase
      .from("classes")
      .select("id, name");

    if (classesError) {
      console.error("Error fetching classes table:", classesError.message);
      return;
    }

    // Create a lookup dictionary: { "barbarian": "uuid-string", ... }
    const classMap = {};
    classesData.forEach((cls) => {
      classMap[cls.name.toLowerCase().trim()] = cls.id;
    });

    const rawRows = [];
    let unmappedClasses = new Set();

    // Map class features data to match table columns
    Object.keys(classFeaturesMap).forEach((className) => {
      const normalizedClassName = className.toLowerCase().trim();
      const classId = classMap[normalizedClassName];

      if (!classId) {
        unmappedClasses.add(className);
        return;
      }

      const features = classFeaturesMap[className];
      features.forEach((feature) => {
        rawRows.push({
          class_id: classId,
          level_required: feature.level,
          name: feature.name,
          description: feature.description,
          effects: feature.effects,
        });
      });
    });

    if (unmappedClasses.size > 0) {
      console.warn(
        `Warning: Could not find matching UUIDs in 'classes' table for: ${Array.from(unmappedClasses).join(", ")}.`,
      );
    }

    // Deduplicate rows based on the unique constraint combination (class_id + name)
    const uniqueRowsMap = new Map();
    rawRows.forEach((row) => {
      const uniqueKey = `${row.class_id}_${row.name}`;
      uniqueRowsMap.set(uniqueKey, row); // Later entries overwrite duplicate earlier entries
    });
    const rowsToInsert = Array.from(uniqueRowsMap.values());

    console.log(
      `Prepared ${rowsToInsert.length} unique class feature records for seeding (${rawRows.length - rowsToInsert.length} duplicates removed).`,
    );

    // Insert records in batches using explicit onConflict targeting class_id and name
    const batchSize = 50;
    for (let i = 0; i < rowsToInsert.length; i += batchSize) {
      const batch = rowsToInsert.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("class_features")
        .upsert(batch, { onConflict: "class_id,name" });

      if (error) {
        console.error(
          `Error inserting batch ${i / batchSize + 1}:`,
          error.message,
        );
      } else {
        console.log(
          `Successfully seeded/updated batch ${i / batchSize + 1} (${batch.length} rows).`,
        );
      }
    }

    console.log("Class features seeding process completed successfully.");
  } catch (error) {
    console.error("Unexpected error during class features seeding:", error);
  }
}

// Execute the seeder
seedClassFeatures();
