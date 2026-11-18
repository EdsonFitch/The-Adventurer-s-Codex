/**
 * -----------------------------------------------------------------------------
 * SCRIPT: seed_equipment.js
 * -----------------------------------------------------------------------------
 * Purpose:
 * Reads local detailed equipment data from '../data/equipment_detailed.json',
 * deduplicates entries by name to prevent PostgreSQL batch conflict errors,
 * and upserts all items into the Supabase 'equipment' table.
 *
 * How to run:
 * node scripts/seed_equipment.js
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
// Use service_role key to bypass RLS policies during bulk data seeding
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "❌ Error: Supabase URL or Service Role Key missing in environment variables (.env)",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Resolve current directory path for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedEquipment() {
  try {
    console.log("📂 Reading equipment_detailed.json from data directory...");
    const jsonPath = path.join(__dirname, "../data/equipment_detailed.json");

    if (!fs.existsSync(jsonPath)) {
      throw new Error(
        `Could not find equipment_detailed.json at path: ${jsonPath}. Run the parser script first!`,
      );
    }

    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const equipmentJson = JSON.parse(rawData);

    console.log(`📥 Loaded ${equipmentJson.length} total entries from JSON.`);

    if (equipmentJson.length === 0) {
      console.log("⚠️ No equipment records found to seed.");
      return;
    }

    // 1. Prepare equipment payload items ensuring data type integrity
    const mappedPayload = equipmentJson.map((item) => ({
      name: item.name,
      category: item.category || "Adventuring Gear",
      rarity: item.rarity || "Common",
      is_magical: Boolean(item.is_magical),
      enchantment_bonus:
        item.enchantment_bonus !== null ? Number(item.enchantment_bonus) : 0,
      damage_dice: item.damage_dice || null,
      damage_type: item.damage_type || null,
      weapon_range_type: item.weapon_range_type || null,
      extra_damage: item.extra_damage || null,
      base_ac: item.base_ac !== null ? Number(item.base_ac) : null,
      stealth_disadvantage: Boolean(item.stealth_disadvantage),
      cost_gp: item.cost_gp !== null ? Number(item.cost_gp) : 0.0,
      weight_lbs: item.weight_lbs !== null ? Number(item.weight_lbs) : 0.0,
      consumable_effect: item.consumable_effect || {},
      lore: item.lore || null,
    }));

    // 2. DEDUPLICATE PAYLOAD BY NAME
    // Uses a Map keyed by lowercase item name to ensure each item is unique per batch
    const uniqueEquipmentMap = new Map();
    mappedPayload.forEach((item) => {
      const key = item.name.trim().toLowerCase();
      uniqueEquipmentMap.set(key, item);
    });

    const equipmentPayload = Array.from(uniqueEquipmentMap.values());
    console.log(
      `🧹 Deduplicated entries: ${equipmentPayload.length} unique items ready for seeding.`,
    );

    // 3. Batch upsert records into Supabase equipment table
    console.log("🚀 Upserting records into 'equipment' table in Supabase...");

    // Supabase recommends chunking large arrays (e.g., batches of 500)
    const chunkSize = 500;
    for (let i = 0; i < equipmentPayload.length; i += chunkSize) {
      const chunk = equipmentPayload.slice(i, i + chunkSize);

      const { error: insertError } = await supabase
        .from("equipment")
        .upsert(chunk, { onConflict: "name" }); // Matches unique 'name' constraint on equipment table

      if (insertError) {
        console.error(
          `❌ Error upserting chunk ${i / chunkSize + 1}:`,
          insertError.message,
        );
      } else {
        console.log(
          `✅ Successfully upserted batch ${i / chunkSize + 1} (${chunk.length} items).`,
        );
      }
    }

    console.log("🎉 Equipment database seeding completed successfully!");
  } catch (err) {
    console.error("❌ Fatal error during equipment seeding:", err);
  }
}

seedEquipment();
