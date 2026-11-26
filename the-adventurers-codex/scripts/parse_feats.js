/**
 * Script Name: parse_feats.js
 * Description: Reads raw feat descriptions, prerequisites, and pipe-delimited
 *              effect structures from feats_raw.txt, normalizes them,
 *              and compiles them into a clean, searchable feats.json file.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define input and output file paths relative to project root
const inputPath = path.join(__dirname, "../data/raw/feats_raw.txt");
const outputPath = path.join(__dirname, "../data/feats.json");

/**
 * Main execution function to read the raw feats text file, parse each entry block,
 * and save the compiled JSON array to the data directory.
 */
function parseFeats() {
  try {
    // Verify input file existence before proceeding
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: Input file not found at ${inputPath}`);
      return;
    }

    // Read the raw feats text file synchronously
    const rawData = fs.readFileSync(inputPath, "utf8");

    // Split text entries into distinct blocks separated by double newlines, filtering for Name entries
    const blocks = rawData
      .split(/\r?\n\r?\n/)
      .filter((block) => block.trim().startsWith("Name:"));

    const feats = [];

    blocks.forEach((block) => {
      const lines = block.split(/\r?\n/);
      let feat = {
        name: "",
        prerequisite: "None",
        description: "",
        effects: [],
      };

      // Parse each line within the individual feat block
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("Name:")) {
          feat.name = trimmed.replace("Name:", "").trim();
        } else if (trimmed.startsWith("Prerequisite:")) {
          feat.prerequisite = trimmed.replace("Prerequisite:", "").trim();
        } else if (trimmed.startsWith("Description:")) {
          feat.description = trimmed.replace("Description:", "").trim();
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
              if (!effectObj.type) {
                effectObj.type = kv[0];
              }
            }
          });
          feat.effects.push(effectObj);
        }
      });

      // Push successfully parsed feat records into our master array
      if (feat.name) {
        feats.push(feat);
      }
    });

    // Write the structured array to the target JSON destination file
    fs.writeFileSync(outputPath, JSON.stringify(feats, null, 2), "utf8");
    console.log(
      `Successfully parsed ${feats.length} feats and saved to ${outputPath}`,
    );
  } catch (error) {
    console.error("Error parsing feats:", error);
  }
}

// Execute the feats parser script
parseFeats();
