import React, { useRef } from "react";

/**
 * Standard D&D 5e Alignments for selection
 */
const ALIGNMENT_OPTIONS = [
  { code: "LG", label: "Lawful Good" },
  { code: "NG", label: "Neutral Good" },
  { code: "CG", label: "Chaotic Good" },
  { code: "LN", label: "Lawful Neutral" },
  { code: "TN", label: "True Neutral" },
  { code: "CN", label: "Chaotic Neutral" },
  { code: "LE", label: "Lawful Evil" },
  { code: "NE", label: "Neutral Evil" },
  { code: "CE", label: "Chaotic Evil" },
];

/**
 * Preset avatar templates for quick hero selection
 */
const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=150",
];

/**
 * StepBasics Component
 * -----------------------------------------------------------------------------
 * Manages Step 1 of Character Creation:
 * - Character Name & Title
 * - Campaign Association
 * - Alignment Code Selection
 * - Portrait / Avatar Selection (Local File Upload, Image URL, or Preset)
 *
 * @param {Object} props
 * @param {Object} props.characterData - Master character payload from wizard state
 * @param {Function} props.updateCharacterData - Callback to update master character state
 */
export default function StepBasics({ characterData, updateCharacterData }) {
  const fileInputRef = useRef(null);

  /**
   * Handles local image file uploads and reads them as Base64 Data URLs
   * @param {Event} e - File input change event
   */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file (PNG, JPG, WebP).");
        return;
      }

      // Convert file to Base64 string for preview and storage
      const reader = new FileReader();
      reader.onloadend = () => {
        updateCharacterData({ portraitUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section Title */}
      <div>
        <h3 className="text-base font-medieval font-bold text-[#f0e6d2]">
          Step 1: Identity & Origins
        </h3>
        <p className="text-xs text-[#889c9b]">
          Establish your adventurer's core name, moral compass, and custom
          portrait before stepping into the realm.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Text Metadata */}
        <div className="space-y-4">
          {/* Character Name */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#889c9b] mb-1">
              Character Name <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              value={characterData.name}
              onChange={(e) => updateCharacterData({ name: e.target.value })}
              placeholder="e.g. Baggi the Unyielding"
              className="w-full bg-[#4a261c] border border-[#a59075]/40 rounded-lg p-2.5 text-[#f0e6d2] text-sm focus:outline-none focus:border-[#938f71]"
            />
          </div>

          {/* Campaign Name */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#889c9b] mb-1">
              Campaign Association
            </label>
            <input
              type="text"
              value={characterData.campaignName}
              onChange={(e) =>
                updateCharacterData({ campaignName: e.target.value })
              }
              placeholder="e.g. Hoard of the Dragon Queen"
              className="w-full bg-[#4a261c] border border-[#a59075]/40 rounded-lg p-2.5 text-[#f0e6d2] text-sm focus:outline-none focus:border-[#938f71]"
            />
          </div>

          {/* Alignment Selection */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#889c9b] mb-1">
              Alignment
            </label>
            <select
              value={characterData.alignmentCode}
              onChange={(e) =>
                updateCharacterData({ alignmentCode: e.target.value })
              }
              className="w-full bg-[#4a261c] border border-[#a59075]/40 rounded-lg p-2.5 text-[#f0e6d2] text-sm focus:outline-none focus:border-[#938f71]"
            >
              {ALIGNMENT_OPTIONS.map((alignment) => (
                <option key={alignment.code} value={alignment.code}>
                  {alignment.label} ({alignment.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column: Avatar / Portrait Selection */}
        <div className="space-y-4">
          <label className="block text-xs uppercase tracking-widest text-[#889c9b] mb-1">
            Hero Portrait
          </label>

          {/* Current Avatar Preview & Upload Trigger */}
          <div className="flex items-center space-x-4">
            <div className="relative w-24 h-24 rounded-lg border-2 border-[#a59075]/60 overflow-hidden bg-[#4a261c] flex items-center justify-center shrink-0 shadow-inner group">
              {characterData.portraitUrl ? (
                <img
                  src={characterData.portraitUrl}
                  alt="Character Portrait"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/150?text=Hero";
                  }}
                />
              ) : (
                <span className="text-3xl">🛡️</span>
              )}

              {/* Hover overlay for quick upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-[#f0e6d2] font-bold transition-opacity"
              >
                Change Image
              </button>
            </div>

            {/* Upload Options */}
            <div className="flex-1 space-y-2">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              {/* Upload Local File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 bg-[#937460]/30 hover:bg-[#937460]/50 border border-[#a59075]/40 rounded-lg text-xs font-bold text-[#f0e6d2] transition flex items-center justify-center space-x-2"
              >
                <span>📁 Upload Image File</span>
              </button>

              {/* Image URL Fallback Input */}
              <div>
                <span className="block text-[10px] text-[#889c9b] mb-1">
                  Or paste Image URL
                </span>
                <input
                  type="text"
                  value={characterData.portraitUrl}
                  onChange={(e) =>
                    updateCharacterData({ portraitUrl: e.target.value })
                  }
                  placeholder="https://example.com/portrait.jpg"
                  className="w-full bg-[#4a261c] border border-[#a59075]/40 rounded-lg p-2 text-[#f0e6d2] text-xs focus:outline-none focus:border-[#938f71]"
                />
              </div>
            </div>
          </div>

          {/* Quick Preset Selection */}
          <div>
            <span className="block text-[10px] text-[#889c9b] uppercase mb-1.5">
              Or Select Preset
            </span>
            <div className="flex space-x-2">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => updateCharacterData({ portraitUrl: url })}
                  className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                    characterData.portraitUrl === url
                      ? "border-amber-500 scale-105 shadow-md"
                      : "border-[#a59075]/30 hover:border-[#a59075]"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Preset ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
