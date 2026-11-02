import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import StepBasics from "./StepBasics";
import StepLineageClass from "./StepLineageClass";
import StepAbilityScores from "./StepAbilityScores";
import StepBackgroundGear from "./StepBackgroundGear";

// -----------------------------------------------------------------------------
// ASSET IMPORT: Faded Background Header Asset
// -----------------------------------------------------------------------------
// Adjust filename if your image in assets/hero has a different extension (.png / .jpg / .svg)
import headerBgImage from "../../assets/hero/hero-bg.png";

/**
 * -----------------------------------------------------------------------------
 * COMPONENT: CharacterCreatorWizard
 * -----------------------------------------------------------------------------
 * Master container and state manager for the multi-step D&D character creator.
 *
 * Architecture & Responsibilities:
 * - Manages active wizard step progression (Step 1 through 5).
 * - Centralizes the master character payload state (`characterData`) shared across all steps.
 * - Pre-fetches relational reference data from Supabase in parallel (races, subraces, classes, subclasses, backgrounds).
 * - Renders a persistent faded hero background asset at the top header section.
 * - Executes final database insertion into the 'characters' table upon completion,
 *   including both dashboard roster portraits and full-body sheet artwork URLs.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onComplete - Callback fired after a successful character forge, passing the new record.
 * @param {string} props.userId - Active authenticated user UUID.
 */
export default function CharacterCreatorWizard({ onComplete, userId }) {
  // ---------------------------------------------------------------------------
  // 1. WIZARD NAVIGATION & FORM STATE HOOKS
  // ---------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Master character data payload object matching the Supabase schema requirements
  const [characterData, setCharacterData] = useState({
    name: "",
    campaignName: "",
    alignmentCode: "LN",
    portraitUrl: "", // Square roster card asset URL
    fullBodyUrl: "", // Vertical character sheet asset URL
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

  /**
   * ---------------------------------------------------------------------------
   * EFFECT HOOK: fetchReferenceData
   * ---------------------------------------------------------------------------
   * Fetches all core relational tables from Supabase in parallel using Promise.all
   * when the wizard component mounts, ensuring all dropdowns and selectors are
   * populated with game data before user interaction.
   */
  useEffect(() => {
    async function fetchReferenceData() {
      try {
        setLoadingData(true);
        setErrorMessage(null);

        // Execute concurrent queries across multiple Supabase tables
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

        // Populate local reference states
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
  // 3. STATE MUTATION & NAVIGATION HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * Merges partial property updates from individual step components into
   * the master character payload state.
   *
   * @param {Object} updatedFields - Key-value pair collection of state modifications.
   */
  const updateCharacterData = (updatedFields) => {
    setCharacterData((prev) => ({ ...prev, ...updatedFields }));
  };

  /**
   * Advances the wizard step forward with basic field validation on Step 1.
   */
  const handleNextStep = () => {
    if (currentStep === 1 && !characterData.name.trim()) {
      alert("Please give your adventurer a name before proceeding.");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  /**
   * Returns the wizard step backward.
   */
  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  /**
   * ---------------------------------------------------------------------------
   * HANDLER: handleForgeCharacter
   * ---------------------------------------------------------------------------
   * Final Submission: Maps master character state to database column structure
   * and inserts the new record into the Supabase 'characters' table.
   * Includes both portrait_url and full_body_url.
   */
  const handleForgeCharacter = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Construct payload mapping state properties to Supabase columns
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
        full_body_url: characterData.fullBodyUrl || null, // Saved for character sheet rendering
      };

      // Execute Supabase INSERT query and return the newly created row
      const { data, error } = await supabase
        .from("characters")
        .insert([newCharacterRecord])
        .select()
        .single();

      if (error) throw error;

      // Trigger completion callback, passing the new record up to the parent container
      if (onComplete) {
        onComplete(data);
      }
    } catch (err) {
      console.error("Detailed error forging character:", err);
      setErrorMessage(
        `Failed to forge hero: ${err.message || "Check RLS policies."}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. STEP 5 LOOKUP HELPERS (Resolves IDs to human-readable names safely)
  // ---------------------------------------------------------------------------
  const selectedRace = racesList.find((r) => r.id === characterData.raceId);
  const selectedClass = classesList.find((c) => c.id === characterData.classId);
  const selectedBackground = backgroundsList.find(
    (b) => b.id === characterData.backgroundId,
  );

  // ---------------------------------------------------------------------------
  // 5. RENDER UI STRUCTURE
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto bg-[#5f3426] border-2 border-[#a59075]/60 rounded-xl overflow-hidden text-[#938f71] shadow-2xl font-antiqua">
      {/* ----------------------------------------------------------------------- */}
      {/* SECTION A: ATMOSPHERIC FADED HEADER SECTION                              */}
      {/* Contains the title, step progress indicators, and persistent bg image    */}
      {/* ----------------------------------------------------------------------- */}
      <div className="relative p-6 pb-5 overflow-hidden border-b border-[#a59075]/30">
        {/* Layer 1: Absolute Faded Image Background with Radial Fade Gradient */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            src={headerBgImage}
            alt=""
            className="w-full h-full object-cover opacity-20 mix-blend-luminosity filter contrast-125"
          />
          {/* Subtle gradient overlay to blend image seamlessly into the theme background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#5f3426] via-transparent to-[#5f3426] opacity-80" />
        </div>

        {/* Layer 2: Interactive Header Content (Z-Index 10 ensures readability) */}
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-medieval font-bold text-[#f0e6d2]">
              Forge a New Hero
            </h2>
            <p className="text-xs text-[#889c9b]">
              Step {currentStep} of 5: {getStepTitle(currentStep)}
            </p>
          </div>

          {/* Progress Tracker Pill Indicators */}
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-7 h-2 rounded-full transition-all ${
                  step === currentStep
                    ? "bg-[#937460] shadow-md"
                    : step < currentStep
                      ? "bg-[#889c9b]/60"
                      : "bg-[#937460]/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="m-6 mb-0 p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-xs text-red-200">
          {errorMessage}
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* SECTION B: MAIN CONTENT VIEWPORT                                       */}
      {/* ----------------------------------------------------------------------- */}
      <div className="p-6 min-h-[400px]">
        {loadingData ? (
          /* Loading Spinner State while Supabase tables fetch */
          <div className="flex flex-col items-center justify-center h-64 space-y-3 text-[#889c9b]">
            <span className="text-2xl animate-spin">⏳</span>
            <p className="text-xs uppercase tracking-widest">
              Consulting ancient archives from Supabase...
            </p>
          </div>
        ) : (
          <div>
            {/* Step 1: Basics & Visual Identity */}
            {currentStep === 1 && (
              <StepBasics
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                userId={userId}
              />
            )}
            {/* Step 2: Lineage & Class */}
            {currentStep === 2 && (
              <StepLineageClass
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                racesList={racesList}
                subracesList={subracesList}
                classesList={classesList}
                subclassesList={subclassesList}
                userId={userId}
              />
            )}
            {/* Step 3: Ability Scores */}
            {currentStep === 3 && (
              <StepAbilityScores
                characterData={characterData}
                updateCharacterData={updateCharacterData}
              />
            )}
            {/* Step 4: Background & Gear */}
            {currentStep === 4 && (
              <StepBackgroundGear
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                backgroundsList={backgroundsList}
                userId={userId}
              />
            )}
            {/* Step 5: Final Review Summary */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-sm font-bold text-[#f0e6d2] uppercase tracking-wider">
                  5. Final Review & Forge
                </h3>
                <div className="p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-lg space-y-2 text-xs">
                  <p>
                    <strong className="text-[#f0e6d2]">Name:</strong>{" "}
                    {characterData.name || "Unnamed Hero"}
                  </p>
                  <p>
                    <strong className="text-[#f0e6d2]">Race / Lineage:</strong>{" "}
                    {selectedRace ? selectedRace.name : "None selected"}
                  </p>
                  <p>
                    <strong className="text-[#f0e6d2]">Class:</strong>{" "}
                    {selectedClass ? selectedClass.name : "None selected"}
                  </p>
                  <p>
                    <strong className="text-[#f0e6d2]">Background:</strong>{" "}
                    {selectedBackground
                      ? selectedBackground.name
                      : "None selected"}
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

      {/* ----------------------------------------------------------------------- */}
      {/* SECTION C: FOOTER NAVIGATION CONTROLS                                  */}
      {/* ----------------------------------------------------------------------- */}
      <div className="p-6 pt-4 border-t border-[#a59075]/30 flex justify-between items-center bg-[#5f3426]">
        {currentStep > 1 ? (
          <button
            type="button"
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
            type="button"
            onClick={handleNextStep}
            disabled={loadingData}
            className="px-5 py-2 rounded bg-[#937460]/40 hover:bg-[#937460]/60 border border-[#a59075]/60 font-bold text-xs text-[#f0e6d2] transition shadow-md"
          >
            Next Step →
          </button>
        ) : (
          <button
            type="button"
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
 * -----------------------------------------------------------------------------
 * HELPER FUNCTION: getStepTitle
 * -----------------------------------------------------------------------------
 * Maps step number integers to descriptive header strings.
 *
 * @param {number} step - Current active step integer (1-5).
 * @returns {string} Human-readable step title.
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
