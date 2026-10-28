/**
 * ============================================================================
 * SUBCLASSES PARSER UTILITY (`scripts/parse_subclasses.js`)
 * ============================================================================
 * Purpose: Reads data/raw/subclasses_raw.txt, parses subclass attributes,
 * flavor text, descriptions, DM guidelines, and features into data/subclasses.json.
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawPath = path.join(__dirname, "../data/raw/subclasses_raw.txt");
const outputPath = path.join(__dirname, "../data/subclasses.json");

function parseSubclasses() {
  console.log("🔄 Parsing subclasses raw text...");

  if (!fs.existsSync(rawPath)) {
    console.error(`❌ Raw file not found at: ${rawPath}`);
    return;
  }

  const rawText = fs.readFileSync(rawPath, "utf-8");
  // Split document by subclass section headers, ignoring empty blocks or template placeholders
  const blocks = rawText
    .split(/=== SUBCLASS:\s*/i)
    .filter((b) => b.trim().length > 0);

  const subclasses = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    // Extract name and strip trailing "===" characters and whitespace
    const rawName = lines[0].trim();
    const name = rawName.replace(/===/g, "").trim();

    // Skip empty template header if present
    if (!name || name === "") continue;

    // Helper to extract standard single-line or multi-line fields
    const extractField = (label) => {
      const regex = new RegExp(
        `${label}:\\s*([^\\n]+(?:\\n(?!Class:|Flavor Text:|Description:|DM Guidelines:|Features:)[^\\n]+)*)`,
        "i",
      );
      const match = block.match(regex);
      return match ? match[1].trim().replace(/\s+/g, " ") : "";
    };

    const className = extractField("Class");
    const flavorText = extractField("Flavor Text");
    const description = extractField("Description");
    const dmGuidelines = extractField("DM Guidelines");

    // Parse Features block
    const features = [];
    const featuresMatch = block.match(/Features:\s*([\s\S]*)/i);

    if (featuresMatch && featuresMatch[1]) {
      const featuresText = featuresMatch[1].trim();
      // Split features by lines starting with standard feature headers (e.g., "Name (Level):" or bullet points)
      // We look for patterns like "Feature Name (Level):" or lines starting with "- "
      const featureLines = featuresText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      let currentFeature = null;

      for (const line of featureLines) {
        // Check if line matches a feature title pattern like "Feature Name (Level):" or similar
        const headerMatch = line.match(
          /^([A-Za-z\s'\-]+(?:\([^)]+\))?):\s*(.*)$/,
        );
        const bulletMatch = line.match(/^[-\*]\s+(.*)$/);

        if (headerMatch && !line.startsWith("-") && !line.startsWith("*")) {
          if (currentFeature) {
            features.push(currentFeature);
          }
          currentFeature = {
            name: headerMatch[1].trim(),
            description: headerMatch[2].trim(),
          };
        } else if (bulletMatch) {
          if (currentFeature) {
            features.push(currentFeature);
          }
          currentFeature = {
            name: "Feature Item",
            description: bulletMatch[1].trim(),
          };
        } else if (currentFeature) {
          // Append continuation text to the current feature description
          currentFeature.description += " " + line;
        } else {
          // Fallback if no header caught yet
          features.push({
            name: "General Feature",
            description: line,
          });
        }
      }
      if (currentFeature) {
        features.push(currentFeature);
      }
    }

    subclasses.push({
      name,
      class_name: className,
      flavor_text: flavorText,
      description: description,
      dm_guidelines: dmGuidelines,
      features: features,
      is_custom: false,
      created_by: null,
    });
  }

  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(subclasses, null, 2), "utf-8");
  console.log(
    `✅ Successfully parsed ${subclasses.length} subclasses into data/subclasses.json`,
  );
}

parseSubclasses();
