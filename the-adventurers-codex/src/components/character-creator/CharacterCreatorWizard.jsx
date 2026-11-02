import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import StepBasics from "./StepBasics";
import StepLineageClass from "./StepLineageClass";
import StepAbilityScores from "./StepAbilityScores";
import StepBackgroundGear from "./StepBackgroundGear";

/**
 * CharacterCreatorWizard Component
 * -----------------------------------------------------------------------------
 * Master container and state manager for the multi-step D&D character creator.
 *
 * Architecture & Responsibilities:
 * - Manages active wizard step progression (Step 1 through 5).
 * - Centralizes the master character payload state (`characterData`) shared across all steps.
 * - Pre-fetches relational reference data from Supabase (races, subraces, classes, subclasses, backgrounds).
 * - Executes final database insertion into the 'characters' table upon completion.
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

  /**
   * Effect Hook: Fetches all core relational tables from Supabase in parallel
   * when the wizard component mounts.
   */
  useEffect(() => {
    async function fetchReferenceData() {
      try {
        setLoadingData(true);
        setErrorMessage(null);

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
  // 3. STATE MUTATION & NAVIGATION HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * Merges partial property updates into the master character payload state.
   */
  const updateCharacterData = (updatedFields) => {
    setCharacterData((prev) => ({ ...prev, ...updatedFields }));
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !characterData.name.trim()) {
      alert("Please give your adventurer a name before proceeding.");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  /**
   * Final Submission: Maps master character state to database column structure
   * and inserts the new record into the Supabase 'characters' table.
   */
  const handleForgeCharacter = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null); // Clean lowercase setter hook

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
    <div className="max-w-4xl mx-auto bg-[#5f3426] border-2 border-[#a59075]/60 rounded-xl p-6 text-[#938f71] shadow-2xl font-antiqua">
      {/* Wizard Header & Dynamic Progress Indicator */}
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
                  ? "bg-[#937460] shadow-md"
                  : step < currentStep
                    ? "bg-[#889c9b]/60"
                    : "bg-[#937460]/30"
              }`}
            />
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-xs text-red-200">
          {errorMessage}
        </div>
      )}

      {/* Main Content Viewport */}
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
            {currentStep === 1 && (
              <StepBasics
                characterData={characterData}
                updateCharacterData={updateCharacterData}
              />
            )}
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
            {currentStep === 3 && (
              <StepAbilityScores
                characterData={characterData}
                updateCharacterData={updateCharacterData}
              />
            )}
            {currentStep === 4 && (
              <StepBackgroundGear
                characterData={characterData}
                updateCharacterData={updateCharacterData}
                backgroundsList={backgroundsList}
                userId={userId}
              />
            )}
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

      {/* Footer Navigation Controls */}
      <div className="border-t border-[#a59075]/30 pt-4 mt-6 flex justify-between items-center">
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
