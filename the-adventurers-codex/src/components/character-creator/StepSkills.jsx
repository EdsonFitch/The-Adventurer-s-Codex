/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepSkills.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Manages Step 5 of the character creation wizard:
 * - Renders the standard D&D 5e list of 18 skills paired with their governing attributes.
 * - Automatically reads and locks skill proficiencies granted by Backgrounds and Lineage
 *   via `computedStats.proficiencies`.
 * - Enforces D&D 5e player-chosen skill selection limits for remaining class slots.
 * - Calculates live skill modifiers factoring in ability modifiers, proficiency bonus,
 *   and derived passive traits (such as Bardic Jack of All Trades).
 * - Synchronizes selected skill choices back into the master character payload state.
 * -----------------------------------------------------------------------------
 */

import React from "react";

/**
 * Standard D&D 5e Skills configuration metadata mapping skill names to ability short keys.
 */
const SKILLS_METADATA = [
  { name: "Acrobatics", ability: "dex", label: "Acrobatics (Dex)" },
  { name: "Animal Handling", ability: "wis", label: "Animal Handling (Wis)" },
  { name: "Arcana", ability: "int", label: "Arcana (Int)" },
  { name: "Athletics", ability: "str", label: "Athletics (Str)" },
  { name: "Deception", ability: "cha", label: "Deception (Cha)" },
  { name: "History", ability: "int", label: "History (Int)" },
  { name: "Insight", ability: "wis", label: "Insight (Wis)" },
  { name: "Intimidation", ability: "cha", label: "Intimidation (Cha)" },
  { name: "Investigation", ability: "int", label: "Investigation (Int)" },
  { name: "Medicine", ability: "wis", label: "Medicine (Wis)" },
  { name: "Nature", ability: "int", label: "Nature (Int)" },
  { name: "Perception", ability: "wis", label: "Perception (Wis)" },
  { name: "Performance", ability: "cha", label: "Performance (Cha)" },
  { name: "Persuasion", ability: "cha", label: "Persuasion (Cha)" },
  { name: "Religion", ability: "int", label: "Religion (Int)" },
  { name: "Sleight of Hand", ability: "dex", label: "Sleight of Hand (Dex)" },
  { name: "Stealth", ability: "dex", label: "Stealth (Dex)" },
  { name: "Survival", ability: "wis", label: "Survival (Wis)" },
];

/**
 * StepSkills Component definition.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.characterData - Master character payload state.
 * @param {Function} props.updateCharacterData - Callback function to update master state.
 * @param {Object} props.computedStats - Computed stats package returned by statCalculator.js.
 */
export default function StepSkills({
  characterData,
  updateCharacterData,
  computedStats,
}) {
  // Extract proficiency bonus and granted proficiency list from computed stats
  const proficiencyBonus = computedStats?.proficiencyBonus || 2;
  const grantedProficiencies = computedStats?.proficiencies || [];

  // Local state for user-chosen skill proficiencies (array of skill name strings)
  const selectedSkills = characterData.skills || [];

  // Define standard player-chosen skill budget limit (e.g., 2 class choices)
  const MAX_USER_SKILL_CHOICES = 2;

  // Check if character has Jack of All Trades active
  const hasJackOfAllTrades =
    characterData.classId &&
    (characterData.isBard ||
      computedStats?.grantedResources?.some(
        (r) => r.type === "JACK_OF_ALL_TRADES",
      ));

  /**
   * Toggles an individual skill proficiency on or off with budget enforcement.
   * Prevents toggling off skills automatically granted by background or lineage.
   *
   * @param {string} skillName - Name of the skill being toggled.
   */
  const handleToggleSkill = (skillName) => {
    // Check case-insensitive match against auto-granted skills
    const isAutoGranted = grantedProficiencies.some(
      (p) => p.toLowerCase() === skillName.toLowerCase(),
    );

    // 1. Prevent modifying skills automatically granted by background or lineage
    if (isAutoGranted) {
      return;
    }

    const exists = selectedSkills.includes(skillName);
    let updatedSkills;

    if (exists) {
      // Allow unchecking an already selected user choice
      updatedSkills = selectedSkills.filter((s) => s !== skillName);
    } else {
      // 2. Enforce maximum player choice budget limit before adding a new skill
      if (selectedSkills.length >= MAX_USER_SKILL_CHOICES) {
        alert(
          `You can only choose up to ${MAX_USER_SKILL_CHOICES} skill proficiencies from your class. Background skills are granted automatically.`,
        );
        return;
      }
      updatedSkills = [...selectedSkills, skillName];
    }

    updateCharacterData({ skills: updatedSkills });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Info */}
      <div className="border-b border-[#a59075]/20 pb-4">
        <h3 className="text-base font-medieval font-bold text-[#f0e6d2]">
          Step 5: Skill Proficiencies & Passive Perks
        </h3>
        <p className="text-xs text-[#889c9b]">
          Background and lineage proficiencies are automatically locked. Choose
          up to {MAX_USER_SKILL_CHOICES} additional proficiencies from your
          class.
        </p>
      </div>

      {/* Passive Perks & Skill Budget Summary Banner */}
      <div className="p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl flex justify-between items-center shadow-inner">
        <div>
          <h4 className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wider">
            Active Passive Perks & Budget
          </h4>
          <p className="text-[10px] text-[#889c9b] mt-0.5">
            Proficiency Bonus:{" "}
            <strong className="text-amber-300">+{proficiencyBonus}</strong>
            {hasJackOfAllTrades && " • Jack of All Trades Active"}
          </p>
        </div>
        <div className="text-xs px-2.5 py-1 rounded bg-[#361a12] text-amber-400 font-bold border border-[#a59075]/30">
          {selectedSkills.length} / {MAX_USER_SKILL_CHOICES} Class Choices (
          {grantedProficiencies.length} Auto-Granted)
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {SKILLS_METADATA.map(({ name, ability, label }) => {
          // 1. Get ability modifier as a clean integer
          const rawMod = computedStats?.abilityModifiers?.[ability] ?? 0;
          const modValue = parseInt(rawMod, 10) || 0;

          // 2. Determine if proficiency is active (user selected OR automatically granted)
          const isAutoGranted = grantedProficiencies.some(
            (p) => p.toLowerCase() === name.toLowerCase(),
          );
          const isUserSelected = selectedSkills.includes(name);
          const isProficient = isAutoGranted || isUserSelected;

          // 3. Calculate final skill modifier integer
          let finalSkillMod = modValue;
          if (isProficient) {
            finalSkillMod += proficiencyBonus;
          } else if (hasJackOfAllTrades) {
            finalSkillMod += Math.floor(proficiencyBonus / 2);
          }

          // 4. Format with a single explicit sign (e.g., "+2" or "-1")
          const formattedMod =
            finalSkillMod >= 0 ? `+${finalSkillMod}` : `${finalSkillMod}`;

          return (
            <div
              key={name}
              onClick={() => handleToggleSkill(name)}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                isAutoGranted
                  ? "bg-[#361a12] border-amber-500/50 cursor-not-allowed opacity-90 shadow"
                  : isUserSelected
                    ? "bg-[#937460]/40 border-amber-500 cursor-pointer shadow-md"
                    : "bg-[#4a261c]/60 border-[#a59075]/40 hover:border-[#a59075] cursor-pointer"
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Checkbox / Indicator dot */}
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                    isProficient
                      ? "bg-amber-600 border-amber-400 text-white font-bold text-[10px]"
                      : "bg-[#361a12] border-[#a59075]/40"
                  }`}
                >
                  {isProficient && "✓"}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#f0e6d2] block">
                    {name}
                  </span>
                  <span className="text-[10px] text-[#889c9b] uppercase tracking-wide">
                    {ability} {isAutoGranted && "(Background/Lineage)"}
                  </span>
                </div>
              </div>

              {/* Skill Modifier Badge */}
              <span className="text-xs px-2 py-0.5 rounded bg-[#361a12] text-amber-300 font-bold border border-[#a59075]/30">
                {formattedMod}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
