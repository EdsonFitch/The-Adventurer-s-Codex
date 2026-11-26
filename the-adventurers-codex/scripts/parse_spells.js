/**
 * ============================================================================
 * SPELL TEXT-TO-JSON PARSER UTILITY (Fixed State Machine)
 * ============================================================================
 * Correctly maps the text order: Name -> School/Level -> Metadata -> Description -> End
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawDir = path.join(__dirname, "../data/raw");
const outputJsonPath = path.join(__dirname, "../data/spells.json");

function parseSchoolAndLevel(line) {
  const lower = line.toLowerCase();
  let level = 0;

  if (!lower.includes("cantrip")) {
    const match = lower.match(/(\d+)(?:st|nd|rd|th)?-level/);
    if (match) {
      level = parseInt(match[1], 10);
    }
  }

  const schools = [
    "abjuration",
    "conjuration",
    "divination",
    "enchantment",
    "evocation",
    "illusion",
    "necromancy",
    "transmutation",
  ];
  let school = "Unknown";

  for (const s of schools) {
    if (lower.includes(s)) {
      school = s.charAt(0).toUpperCase() + s.slice(1);
      break;
    }
  }

  return { level, school };
}

async function parseAllRawFiles() {
  console.log(
    "🔄 Starting spell text parsing with fixed description capture...",
  );

  if (!fs.existsSync(rawDir)) {
    console.error(`❌ Error: Raw data directory not found at ${rawDir}`);
    return;
  }

  const rawFiles = fs
    .readdirSync(rawDir)
    .filter((file) => file.endsWith("_raw.txt"));

  if (rawFiles.length === 0) {
    console.log("⚠️ No raw text files found in data/raw/.");
    return;
  }

  let allSpells = [];

  for (const file of rawFiles) {
    console.log(`📄 Parsing file: ${file}...`);
    const filePath = path.join(rawDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    const lines = content.split(/\r?\n/);

    let currentSpell = null;
    let descriptionLines = [];
    let parsingState = "NAME"; // States: NAME, SCHOOL_LEVEL, METADATA, DESCRIPTION

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Filter out artifacts, headers, footers, pagination
      if (
        !line ||
        line.includes("Bogsy's Magical Scrolls") ||
        line.includes("https://") ||
        line.includes("Open Game License") ||
        /^\d+\/\d+\/\d+/.test(line) ||
        /^\d+\s*\/\s*\d+$/.test(line) ||
        /^--\s*\d+\s+of\s+\d+\s*--$/i.test(line)
      ) {
        continue;
      }

      // Check for end marker
      if (line.startsWith("Available to:")) {
        if (currentSpell) {
          currentSpell.classes = line
            .replace("Available to:", "")
            .trim()
            .split(",")
            .map((c) => c.trim());
          currentSpell.description = descriptionLines.join("\n").trim();
          allSpells.push(currentSpell);
        }
        currentSpell = null;
        descriptionLines = [];
        parsingState = "NAME";
        continue;
      }

      if (line.startsWith("Found in:")) {
        continue;
      }

      // State machine logic
      if (parsingState === "NAME") {
        currentSpell = {
          name: line,
          level: 0,
          school: "Evocation",
          casting_time: "1 action",
          range: "Self",
          components: ["V", "S"],
          duration: "Instantaneous",
          concentration: false,
          ritual: false,
          description: "",
          classes: [],
        };
        parsingState = "SCHOOL_LEVEL";
      } else if (parsingState === "SCHOOL_LEVEL") {
        const parsed = parseSchoolAndLevel(line);
        currentSpell.level = parsed.level;
        currentSpell.school = parsed.school;
        parsingState = "METADATA";
      } else if (parsingState === "METADATA") {
        if (line.startsWith("Casting Time:")) {
          currentSpell.casting_time = line.replace("Casting Time:", "").trim();
        } else if (line.startsWith("Range:")) {
          currentSpell.range = line.replace("Range:", "").trim();
        } else if (line.startsWith("Components:")) {
          currentSpell.components = line
            .replace("Components:", "")
            .trim()
            .split(",")
            .map((c) => c.trim());
        } else if (line.startsWith("Duration:")) {
          currentSpell.duration = line.replace("Duration:", "").trim();
          currentSpell.concentration = currentSpell.duration
            .toLowerCase()
            .includes("concentration");
          // Once Duration is read, the next lines are part of the Description block!
          parsingState = "DESCRIPTION";
        }
      } else if (parsingState === "DESCRIPTION") {
        descriptionLines.push(line);
      }
    }
  }

  const uniqueSpellsMap = new Map();
  allSpells.forEach((spell) => {
    uniqueSpellsMap.set(spell.name, spell);
  });
  const finalSpellsList = Array.from(uniqueSpellsMap.values());

  fs.writeFileSync(
    outputJsonPath,
    JSON.stringify(finalSpellsList, null, 2),
    "utf-8",
  );
  console.log(
    `✅ Successfully generated ${finalSpellsList.length} spells with descriptions at: data/spells.json`,
  );
}

parseAllRawFiles();
