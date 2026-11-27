/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepBasics.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Manages Step 1 of the D&D Character Creator Wizard:
 * - Foundational identity inputs (Character Name, Level 1–20, Alignment, Campaign).
 * - Dual image upload controls with automatic compression and live previews for
 *   the Dashboard Roster Portrait (1:1) and Full-Body Sheet Artwork (2:3).
 *
 * Responsive & Touch Behavior:
 * - Form Controls: Uses `text-sm sm:text-xs` and `py-2.5 sm:py-2` on inputs and
 *   select dropdowns so mobile browsers do not zoom on focus and controls are
 *   comfortable to tap.
 * - Image Upload Rows: Stacks vertically (`flex-col sm:flex-row`) on phones so
 *   file input buttons have full width and never get cramped next to preview
 *   thumbnails.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.characterData - Cumulative wizard character state.
 * @param {Function} props.updateCharacterData - Merges updated fields into state.
 * @param {string} props.userId - Authenticated user UUID for storage scoping.
 * -----------------------------------------------------------------------------
 */

import React, { useState } from "react";
import { uploadCharacterImage } from "../../utils/uploadImage";

export default function StepBasics({
  characterData,
  updateCharacterData,
  userId,
}) {
  // Local upload status flags for visual progress feedback
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [uploadingFullBody, setUploadingFullBody] = useState(false);

  /**
   * Compresses and uploads the square dashboard roster portrait.
   */
  const handlePortraitChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPortrait(true);
      const publicUrl = await uploadCharacterImage(file, userId, "portraits");

      if (publicUrl) {
        updateCharacterData({ portraitUrl: publicUrl });
      }
    } catch (err) {
      console.error("Error handling portrait upload:", err);
    } finally {
      setUploadingPortrait(false);
    }
  };

  /**
   * Compresses and uploads the vertical full-body sheet artwork.
   */
  const handleFullBodyChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFullBody(true);
      const publicUrl = await uploadCharacterImage(file, userId, "full-body");

      if (publicUrl) {
        updateCharacterData({ fullBodyUrl: publicUrl });
      }
    } catch (err) {
      console.error("Error handling full-body upload:", err);
    } finally {
      setUploadingFullBody(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section Header */}
      <h3 className="text-sm font-bold text-[#f0e6d2] uppercase tracking-wider">
        1. Basics & Visual Identity
      </h3>

      {/* =====================================================================
        SECTION A: IDENTITY TEXT INPUTS & DROPDOWNS
        - `text-sm sm:text-xs` prevents iOS/Android auto-zoom on focus.
        ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Character Name */}
        <div className="space-y-1 md:col-span-2 min-w-0">
          <label className="block text-xs font-bold text-[#a59075]">
            Character Name *
          </label>
          <input
            type="text"
            required
            value={characterData.name || ""}
            onChange={(e) => updateCharacterData({ name: e.target.value })}
            placeholder="e.g., Lyra Shadowwhisper"
            className="w-full px-3 py-2.5 sm:py-2 bg-[#4a261c] border border-[#a59075]/40 rounded text-sm sm:text-xs text-[#f0e6d2] focus:outline-none focus:border-[#a59075]"
          />
        </div>

        {/* Character Level (1 - 20) */}
        <div className="space-y-1 min-w-0">
          <label className="block text-xs font-bold text-[#a59075]">
            Character Level
          </label>
          <select
            value={characterData.level || 1}
            onChange={(e) =>
              updateCharacterData({ level: parseInt(e.target.value, 10) })
            }
            className="w-full px-3 py-2.5 sm:py-2 bg-[#4a261c] border border-[#a59075]/40 rounded text-sm sm:text-xs text-[#f0e6d2] focus:outline-none focus:border-[#a59075]"
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
              <option key={lvl} value={lvl}>
                Level {lvl}
              </option>
            ))}
          </select>
        </div>

        {/* Alignment Dropdown */}
        <div className="space-y-1 min-w-0">
          <label className="block text-xs font-bold text-[#a59075]">
            Alignment
          </label>
          <select
            value={characterData.alignmentCode || "LN"}
            onChange={(e) =>
              updateCharacterData({ alignmentCode: e.target.value })
            }
            className="w-full px-3 py-2.5 sm:py-2 bg-[#4a261c] border border-[#a59075]/40 rounded text-sm sm:text-xs text-[#f0e6d2] focus:outline-none focus:border-[#a59075]"
          >
            <option value="LG">Lawful Good</option>
            <option value="NG">Neutral Good</option>
            <option value="CG">Chaotic Good</option>
            <option value="LN">Lawful Neutral</option>
            <option value="N">True Neutral</option>
            <option value="CN">Chaotic Neutral</option>
            <option value="LE">Lawful Evil</option>
            <option value="NE">Neutral Evil</option>
            <option value="CE">Chaotic Evil</option>
          </select>
        </div>

        {/* Campaign Name */}
        <div className="space-y-1 md:col-span-4 min-w-0">
          <label className="block text-xs font-bold text-[#a59075]">
            Campaign Name
          </label>
          <input
            type="text"
            value={characterData.campaignName || ""}
            onChange={(e) =>
              updateCharacterData({ campaignName: e.target.value })
            }
            placeholder="e.g., Hoard of the Dragon Queen"
            className="w-full px-3 py-2.5 sm:py-2 bg-[#4a261c] border border-[#a59075]/40 rounded text-sm sm:text-xs text-[#f0e6d2] focus:outline-none focus:border-[#a59075]"
          />
        </div>
      </div>

      {/* =====================================================================
        SECTION B: DUAL IMAGE UPLOAD INPUTS (PORTRAIT & FULL-BODY)
        - Stacks on narrow mobile viewports (`flex-col sm:flex-row`) so file
          buttons remain roomy and easy to tap.
        ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#a59075]/30">
        {/* 1. Dashboard Roster Portrait (Square 1:1) */}
        <div className="space-y-3 min-w-0">
          <div>
            <label className="block text-xs font-bold text-[#f0e6d2]">
              Dashboard Roster Portrait (Square)
            </label>
            <p className="text-[10px] text-[#a59075]">
              Renders on dashboard card. Resized automatically.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-16 h-16 rounded-lg bg-[#4a261c] border border-[#a59075]/40 overflow-hidden flex items-center justify-center shrink-0">
              {characterData.portraitUrl ? (
                <img
                  src={characterData.portraitUrl}
                  alt="Portrait Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl">🛡️</span>
              )}
            </div>

            <div className="w-full sm:flex-1 min-w-0">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handlePortraitChange}
                disabled={uploadingPortrait}
                className="block w-full text-xs text-[#a59075] file:mr-3 file:py-2 sm:file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#937460]/30 file:text-[#f0e6d2] hover:file:bg-[#937460]/50 cursor-pointer"
              />
              {uploadingPortrait && (
                <span className="text-[10px] text-amber-400 mt-1 block animate-pulse">
                  Compressing & uploading portrait...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Full-Body Sheet Artwork (Vertical 2:3) */}
        <div className="space-y-3 min-w-0">
          <div>
            <label className="block text-xs font-bold text-[#f0e6d2]">
              Full-Body Artwork (Character Sheet)
            </label>
            <p className="text-[10px] text-[#a59075]">
              Renders on character sheet. Resized automatically.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-16 h-20 rounded-lg bg-[#4a261c] border border-[#a59075]/40 overflow-hidden flex items-center justify-center shrink-0">
              {characterData.fullBodyUrl ? (
                <img
                  src={characterData.fullBodyUrl}
                  alt="Full-body Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl">📜</span>
              )}
            </div>

            <div className="w-full sm:flex-1 min-w-0">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFullBodyChange}
                disabled={uploadingFullBody}
                className="block w-full text-xs text-[#a59075] file:mr-3 file:py-2 sm:file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#937460]/30 file:text-[#f0e6d2] hover:file:bg-[#937460]/50 cursor-pointer"
              />
              {uploadingFullBody && (
                <span className="text-[10px] text-amber-400 mt-1 block animate-pulse">
                  Compressing & uploading full-body art...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
