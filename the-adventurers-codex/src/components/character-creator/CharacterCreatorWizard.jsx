import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

/**
 * CharacterCreatorWizard Component
 * -----------------------------------------------------------------------------
 * Master container and state manager for the multi-step D&D character creator.
 *
 * - Manages wizard step progression (Step 1 through 5).
 * - Stores comprehensive character payload state across identity, lineage,
 *   classes, ability scores, background, and equipment.
 * - Pre-fetches relational reference data from Supabase (races, classes, backgrounds).
 * - Handles final database insertion into the 'characters' table.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onComplete - Callback fired after a successful character forge.
 * @param {string} props.userId - Active authenticated user UUID.
 */
export default function CharacterCreatorWizard({ onComplete, userId }) {
  // ---------------------------------------------------------------------------
  // 1. WIZARD NAVIGATION & FORM STATE
  // ---------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Core character payload matching your Supabase schema
  const [characterData, setCharacterData] = useState({
    name: "",
    campaignName: "",
    alignmentCode: "LN",
    portraitUrl: "",
    raceId: "",
    subraceId: "",
    classId: "",
    subclassId: "",
    backgroundId: "",
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    hitPointsMax: 10,
  });

  // ---------------------------------------------------------------------------
  // 2. SUPABASE REFERENCE DATA STATES
  // ---------------------------------------------------------------------------
  const [racesList, setRacesList] = useState([]);
  const [subracesList, setSubracesList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [subclassesList, setSubclassesList] = useState([]);
  const [backgroundsList, setBackgroundsList] = useState([]);

  // Fetch reference datasets from Supabase on component mount
  useEffect(() => {
    async function fetchReferenceData() {
      try {
        setLoadingData(true);
        setErrorMessage(null);

        // Parallel fetch from core Supabase tables
        const [
          { data: races, error: raceErr },
          { data: subraces, error: subraceErr },
          { data: classes, error: classErr },
          { data: subclasses, error: subclassErr },
          { data: backgrounds, error: bgErr },
        ] = await Promise.all([
          supabase.from("races").select("*"),
          supabase.from("subraces").select("*"),
          supabase.from("classes").select("*"),
          supabase.from("subclasses").select("*"),
          supabase.from("backgrounds").select("*"),
        ]);

        if (raceErr) throw raceErr;
        if (subraceErr) throw subraceErr;
        if (classErr) throw classErr;
        if (subclassErr) throw subclassErr;
        if (bgErr) throw bgErr;

        setRacesList(races || []);
        setSubracesList(subraces || []);
        setClassesList(classes || []);
        setSubclassesList(subclasses || []);
        setBackgroundsList(backgrounds || []);
      } catch (err) {
        console.error("Error fetching creator reference data:", err);
        setErrorMessage(
          "Failed to load ancient archives from Supabase. Please check your connection.",
        );
      } finally {
        setLoadingData(false);
      }
    }

    fetchReferenceData();
  }, []);

  // ---------------------------------------------------------------------------
  // 3. HANDLERS & STEP NAVIGATION
  // ---------------------------------------------------------------------------

  /**
   * Updates partial properties within the master character payload.
   * @param {Object} updatedFields - Key-value pairs to update in characterData.
   */
  const updateCharacterData = (updatedFields) => {
    setCharacterData((prev) => ({ ...prev, ...updatedFields }));
  };

  /**
   * Validates and advances to the next wizard step.
   */
  const handleNextStep = () => {
    // Basic validation check for Step 1 (Name)
    if (currentStep === 1 && !characterData.name.trim()) {
      alert("Please give your adventurer a name before proceeding.");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  /**
   * Returns to the previous wizard step.
   */
  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  /**
   * Final Submission: Commits the complete character record to Supabase.
   */
  const handleForgeCharacter = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Construct payload for Supabase 'characters' table
      const newCharacterRecord = {
        user_id: userId,
        name: characterData.name,
        level: 1,
        race_id: characterData.raceId || null,
        subrace_id: characterData.subraceId || null,
        background_id: characterData.backgroundId || null,
        alignment_code: characterData.alignmentCode,
        hp_current: characterData.hitPointsMax,
        hp_max: characterData.hitPointsMax,
        hp_temp: 0,
        portrait_url: characterData.portraitUrl || null,
      };

      const { data, error } = await supabase
        .from("characters")
        .insert([newCharacterRecord])
        .select()
        .single();

      if (error) throw error;

      // Trigger completion callback (e.g., redirect to character sheet)
      if (onComplete) {
        onComplete(data);
      }
    } catch (err) {
      console.error("Error forging character:", err);
      setErrorMessage(
        "Failed to forge hero into the database. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. RENDER UI
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto bg-[#5f3426] border-2 border-[#a59075]/60 rounded-xl p-6 text-[#938f71] shadow-2xl font-antiqua">
      {/* Wizard Header & Progress Bar */}
      <div className="border-b border-[#a59075]/30 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medieval font-bold text-[#f0e6d2]">
            Forge a New Hero
          </h2>
          <p className="text-xs text-[#889c9b]">
            Step {currentStep} of 5: {getStepTitle(currentStep)}
          </p>
        </div>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-7 h-2 rounded-full transition-all ${
                step === currentStep
                  ? "bg-[#938f71] shadow-md"
                  : step < currentStep
                    ? "bg-[#889c9b]/60"
                    : "bg-[#937460]/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Error Banner if any */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-xs text-red-200">
          {errorMessage}
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {loadingData ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3 text-[#889c9b]">
            <span className="text-2xl animate-spin">⏳</span>
            <p className="text-xs uppercase tracking-widest">
              Consulting ancient archives from Supabase...
            </p>
          </div>
        ) : (
          <div>
            {/* Step Content Switcher */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#f0e6d2] uppercase tracking-wider">
                  1. Basics & Identity
                </h3>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#889c9b] mb-1">
                    Character Name
                  </label>
                  <input
                    type="text"
                    value={characterData.name}
                    onChange={(e) =>
                      updateCharacterData({ name: e.target.value })
                    }
                    placeholder="e.g. Baggi the Unyielding"
                    className="w-full bg-[#4a261c] border border-[#a59075]/40 rounded-lg p-2.5 text-[#f0e6d2] text-sm focus:outline-none focus:border-[#938f71]"
                  />
                </div>
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
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#f0e6d2] uppercase tracking-wider">
                  2. Lineage & Class Selection
                </h3>
                <p className="text-xs text-[#889c9b]">
                  Select your race, subrace, class, and subclass (supports
                  homebrew extensions).
                </p>
                {/* Step components will mount here */}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#f0e6d2] uppercase tracking-wider">
                  3. Ability Scores
                </h3>
                <p className="text-xs text-[#889c9b]">
                  Allocate your core statistics using Standard Array, Point Buy,
                  or 4d6 Rolls.
                </p>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#f0e6d2] uppercase tracking-wider">
                  4. Background & Equipment
                </h3>
                <p className="text-xs text-[#889c9b]">
                  Choose your origin, skill proficiencies, and starting
                  inventory.
                </p>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#f0e6d2] uppercase tracking-wider">
                  5. Final Review & Forge
                </h3>
                <div className="p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-lg space-y-2 text-xs">
                  <p>
                    <strong className="text-[#f0e6d2]">Name:</strong>{" "}
                    {characterData.name || "Unnamed Hero"}
                  </p>
                  <p>
                    <strong className="text-[#f0e6d2]">Alignment:</strong>{" "}
                    {characterData.alignmentCode}
                  </p>
                  <p>
                    <strong className="text-[#f0e6d2]">Campaign:</strong>{" "}
                    {characterData.campaignName || "Standalone"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wizard Footer Controls */}
      <div className="border-t border-[#a59075]/30 pt-4 mt-6 flex justify-between items-center">
        {currentStep > 1 ? (
          <button
            onClick={handlePrevStep}
            disabled={isSubmitting}
            className="px-4 py-2 rounded bg-[#937460]/20 hover:bg-[#937460]/40 border border-[#a59075]/40 text-xs transition"
          >
            ← Previous Step
          </button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <button
            onClick={handleNextStep}
            disabled={loadingData}
            className="px-5 py-2 rounded bg-[#937460]/40 hover:bg-[#937460]/60 border border-[#a59075]/60 font-bold text-xs text-[#f0e6d2] transition shadow-md"
          >
            Next Step →
          </button>
        ) : (
          <button
            onClick={handleForgeCharacter}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded bg-amber-700 hover:bg-amber-600 border border-amber-500 font-bold text-xs text-white transition shadow-lg flex items-center space-x-2"
          >
            <span>
              {isSubmitting ? "Forging in the Flames..." : "⚔️ Forge Hero"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Helper function to return descriptive step titles.
 */
function getStepTitle(step) {
  switch (step) {
    case 1:
      return "Basics & Identity";
    case 2:
      return "Lineage & Class";
    case 3:
      return "Ability Scores";
    case 4:
      return "Background & Gear";
    case 5:
      return "Review & Forge";
    default:
      return "";
  }
}
