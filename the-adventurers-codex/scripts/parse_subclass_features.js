/**
 * Script Name: parse_subclass_features.js
 * Description: Reads raw subclass features text data from subclass_features_raw.txt,
 *              extracts subclass archetypes, levels, descriptions, and dynamic effect
 *              tokens, and compiles them into a structured subclass_features.json file
 *              without affecting core subclass definitions.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define input and output file paths relative to project root (saving to subclass_features.json)
const inputPath = path.join(__dirname, "../data/raw/subclass_features_raw.txt");
const outputPath = path.join(__dirname, "../data/subclass_features.json");

/**
 * Main execution function to read, parse, and structure subclass features data.
 */
function parseSubclassFeatures() {
  try {
    // Verify input file existence
    if (!fs.existsSync(inputPath)) {
      console.warn(
        `Input file not found at ${inputPath}. Skipping subclass parse.`,
      );
      return;
    }

    // Read the raw text data file
    const rawData = fs.readFileSync(inputPath, "utf8");
    const blocks = rawData
      .split(/\r?\n\r?\n/)
      .filter((block) => block.trim().length > 0);

    const subclasses = [];

    blocks.forEach((block) => {
      const lines = block.split(/\r?\n/);
      let entry = { effects: [] };

      // Line-by-line token parsing for subclass records
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("Subclass:") || trimmed.startsWith("Class:")) {
          const key = trimmed.includes("Subclass:") ? "subclass" : "class";
          entry[key] = trimmed.split(":")[1].trim();
        } else if (trimmed.startsWith("Name:")) {
          entry.name = trimmed.replace("Name:", "").trim();
        } else if (trimmed.startsWith("Level:")) {
          entry.level = parseInt(trimmed.replace("Level:", "").trim(), 10);
        } else if (trimmed.startsWith("Description:")) {
          entry.description = trimmed.replace("Description:", "").trim();
        } else if (trimmed.startsWith("Effect:")) {
          // Extract pipe-delimited parameters for specialized effect objects
          const effectContent = trimmed.replace("Effect:", "").trim();
          const parts = effectContent.split("|").map((p) => p.trim());

          const effectObj = {};
          parts.forEach((part) => {
            const kv = part.split(":").map((s) => s.trim());
            if (kv.length === 2) {
              effectObj[kv[0]] = kv[1];
            } else {
              effectObj.type = kv[0];
            }
          });
          entry.effects.push(effectObj);
        }
      });

      // Push valid entries into our master collection array
      if (entry.name) {
        subclasses.push(entry);
      }
    });

    // Write structured output array to target JSON file safely
    fs.writeFileSync(outputPath, JSON.stringify(subclasses, null, 2), "utf8");
    console.log(
      `Successfully parsed subclass features and saved to ${outputPath}`,
    );
  } catch (error) {
    console.error("Error parsing subclass features:", error);
  }
}

// Execute the subclass features parser script
parseSubclassFeatures();
