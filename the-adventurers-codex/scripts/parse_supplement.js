/**
 * -----------------------------------------------------------------------------
 * SCRIPT: parse_supplement.js
 * -----------------------------------------------------------------------------
 * Description:
 * Reads the raw supplement text file (`data/raw/background_defining_events_raw.txt`),
 * parses out background names, languages, tool proficiencies, and defining event
 * dice tables, structures them into clean JSON objects, de-duplicates records by
 * background name, and saves the final result to `data/background_supplement.json`.
 * -----------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Define __filename and __dirname equivalents in ES module scope (required for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper function to clean language strings and convert them into structured
 * JSON arrays compatible with Supabase JSONB columns.
 *
 * @param {string} langStr - Raw language text line from the file.
 * @returns {Array} - Array of language objects (e.g., [{ name: "Common" }]).
 */
function parseLanguages(langStr) {
  if (
    !langStr ||
    langStr.toLowerCase() === "none" ||
    langStr.toLowerCase() === "none specified"
  ) {
    return [];
  }
  return [{ name: langStr.trim() }];
}

/**
 * Helper function to parse tool proficiency strings into structured JSON arrays.
 * Splits multi-tool strings by commas or the word "and".
 *
 * @param {string} toolStr - Raw tool proficiency text line from the file.
 * @returns {Array} - Array of tool objects (e.g., [{ name: "Thieves' tools" }]).
 */
function parseTools(toolStr) {
  if (!toolStr || toolStr.toLowerCase() === "none") {
    return [];
  }
  // Split by comma or word ' and ' to handle multi-tool entries cleanly
  const tools = toolStr
    .split(/,|\sand\s/i)
    .map((t) => t.trim())
    .filter(Boolean);
  return tools.map((tool) => ({ name: tool }));
}

/**
 * Main parsing routine that reads the raw text file, processes each background block,
 * extracts languages, tools, and defining event tables, and writes out the final JSON.
 */
function parseRawSupplementFile() {
  // Define absolute paths based on your project tree structure
  const rawPath = path.join(
    __dirname,
    "../data/raw/background_defining_events_raw.txt",
  );
  const outputPath = path.join(__dirname, "../data/background_supplement.json");

  // Verify that the input raw file exists before attempting to read
  if (!fs.existsSync(rawPath)) {
    console.error(`❌ Error: Raw file not found at ${rawPath}`);
    process.exit(1);
  }

  console.log(`📖 Reading raw file: ${rawPath}`);
  const fileContent = fs.readFileSync(rawPath, "utf8");

  // Split the file content into distinct blocks using "BACKGROUND:" as the delimiter
  const blocks = fileContent.split(/(?=BACKGROUND:\s*)/i);

  // Use a Map to automatically de-duplicate entries by background name
  const backgroundMap = new Map();

  for (const block of blocks) {
    if (!block.trim()) continue;

    // Split block into individual lines, trimming whitespace and filtering out blanks
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const bgHeaderLine = lines.find((l) =>
      l.toUpperCase().startsWith("BACKGROUND:"),
    );

    if (!bgHeaderLine) continue;

    // Extract the raw background name
    const rawBgName = bgHeaderLine.replace(/^BACKGROUND:\s*/i, "").trim();

    // Locate language and tool proficiency configuration lines
    const langLine = lines.find((l) =>
      l.toUpperCase().startsWith("LANGUAGES:"),
    );
    const toolLine = lines.find(
      (l) =>
        l.toUpperCase().startsWith("TOOL PROFICIENCIES:") ||
        l.toUpperCase().startsWith("TOOL PROficiencies:"),
    );

    const languages = langLine
      ? parseLanguages(langLine.replace(/^LANGUAGES:\s*/i, ""))
      : [];
    const tool_proficiencies = toolLine
      ? parseTools(
          toolLine.replace(
            /^TOOL PROFICIENCIES:\s*|^TOOL PROficiencies:\s*/i,
            "",
          ),
        )
      : [];

    // Parse Defining Events table block if present
    const definingEvents = [];
    const deStartIndex = lines.findIndex((l) =>
      l.toUpperCase().startsWith("DEFINING EVENTS:"),
    );

    if (deStartIndex !== -1) {
      let currentTable = null;

      for (let i = deStartIndex + 1; i < lines.length; i++) {
        const line = lines[i];

        // Stop parsing defining events if we hit the next background block header
        if (line.toUpperCase().startsWith("BACKGROUND:")) break;

        if (line.toUpperCase().startsWith("TITLE:")) {
          if (currentTable) definingEvents.push(currentTable);
          currentTable = {
            die: "d6", // Default fallback die size
            title: line.replace(/^TITLE:\s*/i, "").trim(),
            options: [],
          };
        } else if (line.toUpperCase().startsWith("DIE:")) {
          if (currentTable) {
            currentTable.die = line.replace(/^DIE:\s*/i, "").trim();
          }
        } else if (line.toUpperCase().startsWith("ROLL ")) {
          const match = line.match(/^ROLL\s+(\d+):\s*(.*)/i);
          if (match && currentTable) {
            currentTable.options.push({
              roll: match[1],
              description: match[2].trim(),
            });
          }
        }
      }
      // Push the final table object if initialized
      if (currentTable) definingEvents.push(currentTable);
    }

    // Build the structured background object
    backgroundMap.set(rawBgName, {
      name: rawBgName,
      languages,
      tool_proficiencies,
      defining_events: definingEvents,
    });
  }

  // Convert map values to an array for JSON export
  const resultList = Array.from(backgroundMap.values());

  // Ensure the output file directory exists
  const jsonDir = path.dirname(outputPath);
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }

  // Write out the clean JSON file to the project's data/ folder
  fs.writeFileSync(outputPath, JSON.stringify(resultList, null, 2), "utf8");
  console.log(`✅ JSON output successfully created at: ${outputPath}`);
  console.log(`   Total parsed backgrounds: ${resultList.length}`);
}

// Execute the parser
parseRawSupplementFile();
