/**
 * Script Name: parse_class_features.js
 * Description: Reads raw class features text data, parses class entries,
 *              descriptions, and pipe-delimited or key-value effects,
 *              and outputs a structured class_features.json file.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define file paths
const inputPath = path.join(__dirname, "../data/raw/class_features_raw.txt");
const outputPath = path.join(__dirname, "../data/class_features.json");

/**
 * Main function to read, parse, and write class features data.
 */
function parseClassFeatures() {
  try {
    // Read the raw text file synchronously
    const rawData = fs.readFileSync(inputPath, "utf8");

    // Split entries by double newlines or blocks starting with 'Class:'
    const blocks = rawData
      .split(/\r?\n\r?\n/)
      .filter((block) => block.trim().startsWith("Class:"));

    const classFeaturesMap = {};

    blocks.forEach((block) => {
      const lines = block.split(/\r?\n/);
      let currentClass = "";
      let currentName = "";
      let currentLevel = 1;
      let currentDesc = "";
      const effects = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("Class:")) {
          currentClass = trimmed.replace("Class:", "").trim();
        } else if (trimmed.startsWith("Name:")) {
          currentName = trimmed.replace("Name:", "").trim();
        } else if (trimmed.startsWith("Level:")) {
          currentLevel = parseInt(trimmed.replace("Level:", "").trim(), 10);
        } else if (trimmed.startsWith("Description:")) {
          currentDesc = trimmed.replace("Description:", "").trim();
        } else if (trimmed.startsWith("Effect:")) {
          // Parse effect lines which might contain pipe-delimited sub-properties
          const effectContent = trimmed.replace("Effect:", "").trim();
          const parts = effectContent.split("|").map((p) => p.trim());

          const effectObj = {};
          parts.forEach((part) => {
            const kv = part.split(":").map((s) => s.trim());
            if (kv.length === 2) {
              effectObj[kv[0]] = kv[1];
            } else {
              if (!effectObj.type) {
                effectObj.type = kv[0];
              }
            }
          });
          effects.push(effectObj);
        }
      });

      if (currentClass) {
        if (!classFeaturesMap[currentClass]) {
          classFeaturesMap[currentClass] = [];
        }

        classFeaturesMap[currentClass].push({
          name: currentName,
          level: currentLevel,
          description: currentDesc,
          effects: effects,
        });
      }
    });

    // Write parsed data to JSON destination file with 2-space indentation
    fs.writeFileSync(
      outputPath,
      JSON.stringify(classFeaturesMap, null, 2),
      "utf8",
    );
    console.log(
      `Successfully parsed class features and saved to ${outputPath}`,
    );
  } catch (error) {
    console.error("Error parsing class features:", error);
  }
}

// Execute the parser function
parseClassFeatures();
