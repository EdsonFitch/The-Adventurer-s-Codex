/**
 * Script Name: seed_feats.js
 * Description: Reads compiled feats from data/feats.json and seeds
 *              them into the Supabase feats table using the service role key.
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

// Initialize Supabase client with Service Role Key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Define path to JSON data file
const dataPath = path.join(__dirname, "../data/feats.json");

/**
 * Main execution function to seed feats into Supabase.
 */
async function seedFeats() {
  try {
    console.log("Reading feats data file...");
    if (!fs.existsSync(dataPath)) {
      console.error(`Error: Data file not found at ${dataPath}`);
      return;
    }

    const rawData = fs.readFileSync(dataPath, "utf8");
    const feats = JSON.parse(rawData);

    console.log(`Prepared ${feats.length} feat records for seeding.`);

    // Insert records in batches
    const batchSize = 50;
    for (let i = 0; i < feats.length; i += batchSize) {
      const batch = feats.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("feats")
        .upsert(batch, { onConflict: "name" });

      if (error) {
        console.error(
          `Error inserting batch ${i / batchSize + 1}:`,
          error.message,
        );
      } else {
        console.log(
          `Successfully seeded batch ${i / batchSize + 1} (${batch.length} rows).`,
        );
      }
    }

    console.log("Feats seeding process completed.");
  } catch (error) {
    console.error("Unexpected error during feats seeding:", error);
  }
}

// Execute the seeder
seedFeats();
