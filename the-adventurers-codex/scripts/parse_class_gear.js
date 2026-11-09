/**
 * -----------------------------------------------------------------------------
 * SCRIPT: parse_class_gear.js
 * -----------------------------------------------------------------------------
 * Purpose:
 * Parses the raw text file containing class equipment, armor, weapon, and tool
 * proficiencies, transforming it into a structured JSON object (`class_equipment.json`)
 * ready for database seeding or application consumption.
 * -----------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Define directory paths using ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawFilePath = path.join(
  __dirname,
  "../data/raw/class_equipment_proficiencies_raw.txt",
);
const outputJsonPath = path.join(__dirname, "../data/class_equipment.json");

/**
 * Helper function to split comma-separated strings into cleaned JSONB arrays of objects.
 * Example: "Light armor, medium armor" -> [{ name: "Light armor" }, { name: "Medium armor" }]
 */
function parseListToObjects(textLine) {
  if (!textLine || textLine.toLowerCase() === "none") return [];
  return textLine
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({ name: item }));
}

/**
 * Main execution function to read, parse, and output the class gear data.
 */
function parseClassEquipmentFile() {
  try {
    console.log("📖 Reading raw class equipment file...");
    const rawData = fs.readFileSync(rawFilePath, "utf8");

    // Split the file by class blocks using the '=== CLASS: [Name] ===' separator
    const classBlocks = rawData.split("=== CLASS:").filter(Boolean);
    const parsedClasses = [];

    for (const block of classBlocks) {
      const lines = block.split("\n").map((l) => l.trim());

      // FIX: Clean up the class name by removing any trailing '=' characters and extra spaces
      const rawClassName = lines[0] || "";
      const className = rawClassName.replace(/={2,}/g, "").trim();

      let armorLine = "";
      let weaponLine = "";
      let toolLine = "";
      let equipmentLines = [];
      let capturingEquipment = false;

      // Iterate through block lines to extract categorized properties
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith("ARMOR:")) {
          armorLine = line.replace("ARMOR:", "").trim();
          capturingEquipment = false;
        } else if (line.startsWith("WEAPON:")) {
          weaponLine = line.replace("WEAPON:", "").trim();
          capturingEquipment = false;
        } else if (line.startsWith("TOOL:")) {
          toolLine = line.replace("TOOL:", "").trim();
          capturingEquipment = false;
        } else if (line.startsWith("EQUIPMENT:")) {
          capturingEquipment = true;
        } else if (capturingEquipment && line) {
          // Collect non-empty equipment item / choice lines
          equipmentLines.push({ item: line });
        }
      }

      // Construct structured object for the current class
      const classEntry = {
        name: className,
        armor_proficiencies: parseListToObjects(armorLine),
        weapon_proficiencies: parseListToObjects(weaponLine),
        tool_proficiencies: parseListToObjects(toolLine),
        equipment: equipmentLines,
      };

      parsedClasses.push(classEntry);
      console.log(
        `✅ Successfully parsed equipment & proficiencies for: ${className}`,
      );
    }

    // Write output to target JSON file
    fs.writeFileSync(
      outputJsonPath,
      JSON.stringify(parsedClasses, null, 2),
      "utf8",
    );
    console.log(`\n🎉 Parsing complete! Saved output to: ${outputJsonPath}`);
  } catch (err) {
    console.error("❌ Error parsing class equipment raw file:", err.message);
  }
}

// Execute the parser
parseClassEquipmentFile();
