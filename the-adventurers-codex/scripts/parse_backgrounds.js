/**
 * ============================================================================
 * BACKGROUNDS PARSER UTILITY (`scripts/parse_backgrounds.js`)
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawPath = path.join(__dirname, "../data/raw/backgrounds_raw.txt");
const outputPath = path.join(__dirname, "../data/backgrounds.json");

function parseBackgrounds() {
  console.log("🔄 Parsing backgrounds raw text...");

  if (!fs.existsSync(rawPath)) {
    console.error(`❌ Raw file not found at: ${rawPath}`);
    return;
  }

  const rawText = fs.readFileSync(rawPath, "utf-8");
  const blocks = rawText
    .split(/=== BACKGROUND:\s*/i)
    .filter((b) => b.trim().length > 0);

  const backgrounds = blocks.map((block) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const rawName = lines[0].trim();
    const name = rawName.replace(/===/g, "").trim();

    const extractField = (label) => {
      const match = block.match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"));
      return match ? match[1].trim() : "";
    };

    const parseList = (rawStr) => {
      if (!rawStr || rawStr.toLowerCase() === "none") return [];
      return rawStr
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    };

    const skillProf = parseList(extractField("Skill Proficiencies"));
    const toolProf = parseList(extractField("Tool Proficiencies"));
    const languages = parseList(extractField("Languages"));
    const equipment = parseList(extractField("Equipment"));

    const featureName = extractField("Feature Name");
    const featureDescription = extractField("Feature Description");
    const description =
      featureDescription || `A standard background for ${name}.`;

    // Improved Defining Event Table Parser
    const definingEvents = [];
    const blockLines = block.split("\n").map((l) => l.trim());

    let currentTable = null;

    for (let i = 0; i < blockLines.length; i++) {
      const line = blockLines[i];

      // Check if a line starts with "Defining Event:" (or similar table headers)
      if (line.toLowerCase().startsWith("defining event:")) {
        const headerValue = line.substring("defining event:".length).trim();

        // If it's not "None", initialize a new table
        if (headerValue && !headerValue.toLowerCase().includes("none")) {
          const [die, ...titleParts] = headerValue.split("|");
          currentTable = {
            title: titleParts.join("|").trim() || "Defining Event",
            die: die ? die.trim().toLowerCase() : "d8",
            options: [],
          };
          definingEvents.push(currentTable);
        } else {
          currentTable = null;
        }
      } else if (currentTable) {
        // If we are actively inside a table, check if the line is a numbered option (e.g., "1 | Aarakocra")
        const rowMatch = line.match(/^(\d+(?:-\d+)?)\s*\|\s*(.+)$/);
        if (rowMatch) {
          currentTable.options.push({
            roll: rowMatch[1].trim(),
            description: rowMatch[2].trim(),
          });
        } else if (line.includes("===") || line.includes(":")) {
          // If we hit another field or header, stop capturing for this table
          currentTable = null;
        }
      }
    }

    return {
      name,
      skill_proficiencies: skillProf.map((s) => ({ name: s })),
      tool_proficiencies: toolProf.map((t) => ({ name: t })),
      languages: languages.map((l) => ({ name: l })),
      equipment: equipment.map((e) => ({ item: e })),
      feature_name: featureName,
      feature_description: featureDescription,
      description: description,
      defining_events: definingEvents,
      is_custom: false,
      created_by: null,
    };
  });

  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(backgrounds, null, 2), "utf-8");
  console.log(
    `✅ Successfully parsed ${backgrounds.length} backgrounds into data/backgrounds.json`,
  );
}

parseBackgrounds();
