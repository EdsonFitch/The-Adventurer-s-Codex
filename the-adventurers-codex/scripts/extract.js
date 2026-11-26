/**
 * ============================================================================
 * PDF TEXT EXTRACTOR UTILITY (v2 API)
 * ============================================================================
 * Learning Concept: Using Class-Based Package APIs
 * The updated 'pdf-parse' library uses an instantiation pattern (new PDFParse)
 * where we pass a buffer object and call an asynchronous .getText() method.
 * ============================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFParse } from "pdf-parse"; // Import the new v2 class directly

// --- PATH RESOLUTION HELPERS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfDir = path.join(__dirname, "../pdf-source");
const outputDir = path.join(__dirname, "../data/raw");

// Ensure output directory exists ('data/raw')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function extractPdfs() {
  if (!fs.existsSync(pdfDir)) {
    console.error(`❌ Error: 'pdf-source' folder not found at ${pdfDir}`);
    return;
  }

  const files = fs.readdirSync(pdfDir).filter((file) => file.endsWith(".pdf"));

  if (files.length === 0) {
    console.log("⚠️ No PDF files found in the pdf-source folder.");
    return;
  }

  for (const file of files) {
    console.log(`🔄 Extracting text from: ${file}...`);
    const filePath = path.join(pdfDir, file);

    try {
      // Step 1: Read PDF file into a binary buffer
      const dataBuffer = fs.readFileSync(filePath);

      // Step 2: Instantiate the parser with the data buffer (v2 API standard)
      const parser = new PDFParse({ data: dataBuffer });

      // Step 3: Extract the text content asynchronously
      const pdfData = await parser.getText();

      // Always clean up resources when finished with the parser instance
      await parser.destroy();

      // Step 4: Set up output path for the raw text file
      const outputFileName = `${path.basename(file, ".pdf")}_raw.txt`;
      const outputPath = path.join(outputDir, outputFileName);

      // Step 5: Write text file to disk
      fs.writeFileSync(outputPath, pdfData.text, "utf-8");
      console.log(`✅ Saved raw text to: data/raw/${outputFileName}`);
    } catch (err) {
      console.error(`❌ Failed to parse ${file}:`, err.message);
    }
  }

  console.log("🎉 Extraction complete!");
}

// Execute the extraction function
extractPdfs();
