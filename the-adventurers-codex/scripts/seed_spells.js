/**
 * -----------------------------------------------------------------------------
 * SCRIPT: seed_spells.js (Resilient & Logged Version)
 * -----------------------------------------------------------------------------
 * Purpose:
 * Seeds the Supabase 'spells' table and maps them to classes in the 'class_spells'
 * join table using the sanitized dataset from 'data/spells_cleaned.json'.
 * -----------------------------------------------------------------------------
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cleanedJsonPath = path.join(__dirname, "../data/spells_cleaned.json");

async function seedSpells() {
  try {
    console.log(`🔍 Reading cleaned spells from: ${cleanedJsonPath}`);

    if (!fs.existsSync(cleanedJsonPath)) {
      throw new Error(
        `Cleaned JSON not found at ${cleanedJsonPath}. Run clean_spells_json.js first.`,
      );
    }

    const spellsData = JSON.parse(fs.readFileSync(cleanedJsonPath, "utf8"));
    console.log(
      `📦 Loaded ${spellsData.length} spells. Fetching classes reference table from Supabase...`,
    );

    // 1. Fetch classes to map names to UUIDs
    const { data: classesData, error: classErr } = await supabase
      .from("classes")
      .select("id, name");
    if (classErr) throw classErr;

    const classMap = {};
    (classesData || []).forEach((cls) => {
      classMap[cls.name.trim().toLowerCase()] = cls.id;
    });

    console.log(
      `✅ Classes fetched successfully (${Object.keys(classMap).length} classes found). Starting spell upserts...\n`,
    );

    let insertedSpellsCount = 0;
    let mappedRelationsCount = 0;

    // 2. Process spells with live progress logging
    for (let i = 0; i < spellsData.length; i++) {
      const spell = spellsData[i];
      process.stdout.write(
        `Processing [${i + 1}/${spellsData.length}]: ${spell.name}...\r`,
      );

      // Insert spell into 'spells' table
      const { data: insertedSpell, error: spellErr } = await supabase
        .from("spells")
        .upsert(
          {
            name: spell.name,
            level: spell.level,
            school: spell.school,
            casting_time: spell.casting_time,
            range: spell.range,
            components: spell.components,
            duration: spell.duration,
            concentration: spell.concentration,
            ritual: spell.ritual,
            description: spell.description,
          },
          { onConflict: "name" },
        )
        .select("id")
        .single();

      if (spellErr) {
        console.warn(
          `\n⚠️ Error inserting spell "${spell.name}":`,
          spellErr.message,
        );
        continue;
      }

      insertedSpellsCount++;
      const spellId = insertedSpell.id;

      // 3. Insert into 'class_spells' relation table
      if (spell.classes && Array.isArray(spell.classes)) {
        for (const className of spell.classes) {
          const classId = classMap[className.trim().toLowerCase()];
          if (classId) {
            const { error: linkErr } = await supabase
              .from("class_spells")
              .upsert(
                { class_id: classId, spell_id: spellId },
                { onConflict: "class_id,spell_id" },
              );

            if (!linkErr) {
              mappedRelationsCount++;
            }
          }
        }
      }
    }

    console.log(`\n\n✨ Spells Seeding Complete!`);
    console.log(
      `🚀 Successfully inserted/updated ${insertedSpellsCount} spells.`,
    );
    console.log(`🔗 Created ${mappedRelationsCount} class-to-spell mappings.`);
  } catch (err) {
    console.error("\n❌ Seeding Error:", err.message);
  }
}

seedSpells();
