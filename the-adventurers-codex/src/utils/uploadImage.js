import { supabase } from "../supabaseClient";

/**
 * -----------------------------------------------------------------------------
 * HELPER: compressAndResizeImage
 * -----------------------------------------------------------------------------
 * Resizes and compresses an uploaded image file client-side using an HTML5 Canvas.
 *
 * WHY USE THIS?
 * Users often upload raw 10MB+ photos from smartphones or high-res cameras.
 * This helper shrinks the pixel dimensions and compresses the output into a
 * lightweight WebP format (typically reducing file size by 80-90%), preventing
 * server storage bloat and ensuring lightning-fast dashboard load times.
 *
 * @param {File} file - The raw image file selected from the user's local device.
 * @param {number} maxWidth - Maximum allowable width in pixels.
 * @param {number} maxHeight - Maximum allowable height in pixels.
 * @param {number} quality - WebP compression ratio between 0.1 (low) and 1.0 (maximum).
 * @returns {Promise<Blob>} A promise that resolves to the compressed WebP image Blob.
 */
function compressAndResizeImage(file, maxWidth, maxHeight, quality = 0.82) {
  return new Promise((resolve, reject) => {
    // 1. Read the raw file into memory as a Data URL
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // 2. Calculate proportional dimensions to maintain aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        // 3. Create an off-screen HTML5 Canvas to draw and downscale the image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // 4. Export canvas contents as a highly compressed WebP Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(
                new Error(
                  "Canvas image compression failed to generate a blob.",
                ),
              );
            }
          },
          "image/webp",
          quality,
        );
      };

      img.onerror = (err) =>
        reject(new Error(`Failed to load image element: ${err}`));
    };

    reader.onerror = (err) =>
      reject(new Error(`Failed to read file reader: ${err}`));
  });
}

/**
 * -----------------------------------------------------------------------------
 * MAIN UTILITY: uploadCharacterImage
 * -----------------------------------------------------------------------------
 * Validates, compresses, and uploads character artwork files directly to
 * Supabase Storage using structured subfolders.
 *
 * @param {File} file - Raw image file selected from device file picker.
 * @param {string} userId - Unique UUID of the authenticated user (for RLS scoping).
 * @param {('portraits'|'full-body')} subfolder - Destination subfolder category.
 * @returns {Promise<string|null>} Returns the permanent public URL of the asset, or null on failure.
 */
export async function uploadCharacterImage(
  file,
  userId,
  subfolder = "portraits",
) {
  // Define strict security and storage guardrails
  const MAX_RAW_FILE_SIZE = 5 * 1024 * 1024; // 5 MB hard upload cap on raw file input
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  // Return early if no file was provided
  if (!file) return null;

  // 1. Validate file MIME type against allowed list
  if (!ALLOWED_TYPES.includes(file.type)) {
    alert(
      "Invalid file format. Please select a valid JPEG, PNG, or WebP image.",
    );
    return null;
  }

  // 2. Validate raw file size against maximum upload limits
  if (file.size > MAX_RAW_FILE_SIZE) {
    alert(
      `File size exceeds 5 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a smaller image.`,
    );
    return null;
  }

  try {
    // 3. Determine maximum pixel constraints based on image destination type
    // - Portraits (Square dashboard cards): Max 400x400 px
    // - Full-Body (Character sheet view): Max 800x1200 px
    const isPortrait = subfolder === "portraits";
    const maxWidth = isPortrait ? 400 : 800;
    const maxHeight = isPortrait ? 400 : 1200;

    // 4. Execute client-side compression and resizing
    const compressedBlob = await compressAndResizeImage(
      file,
      maxWidth,
      maxHeight,
      0.82,
    );

    // 5. Construct a unique, collision-resistant storage file path:
    // Structure: {userId}/{subfolder}/{timestamp}-{randomString}.webp
    const uniqueHash = Math.random().toString(36).substring(2, 7);
    const fileName = `${Date.now()}-${uniqueHash}.webp`;
    const filePath = `${userId || "guest"}/${subfolder}/${fileName}`;

    // 6. Upload the compressed blob to the public Supabase bucket ('character-artwork')
    const { error: uploadError } = await supabase.storage
      .from("character-artwork")
      .upload(filePath, compressedBlob, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // 7. Retrieve and return the permanent public URL for rendering via <img /> tags
    const { data: publicURLData } = supabase.storage
      .from("character-artwork")
      .getPublicUrl(filePath);

    if (!publicURLData?.publicUrl) {
      throw new Error(
        "Failed to generate public retrieval URL from Supabase Storage.",
      );
    }

    return publicURLData.publicUrl;
  } catch (err) {
    console.error(`Error uploading artwork to folder '${subfolder}':`, err);
    alert(`Upload failed: ${err.message || "Unknown error occurred"}`);
    return null;
  }
}
