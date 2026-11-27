/**
 * -----------------------------------------------------------------------------
 * COMPONENT: StepSkills.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Manages Step 7 of the character creation wizard:
 * - Renders all 18 D&D 5e skills paired with governing ability modifiers.
 * - Automatically locks skill proficiencies granted by Background/Lineage.
 * - Enforces player-chosen class skill limits and factors in passive perks
 *   (such as Bardic Jack of All Trades).
 *
 * Responsive & Touch Behavior:
 * - Budget Summary Banner: Stacks cleanly on narrow phones (`flex-col sm:flex-row`)
 *   so the skill counter badge never crushes the left-side text.
 * - Skill Toggle Cards: Uses `p-3.5 sm:p-3` and `min-w-0` with a larger
 *   checkbox indicator (`w-5 h-5 sm:w-4 sm:h-4`) for easy mobile tapping.
 *
 * @param {Object} props - Component properties.
 * -----------------------------------------------------------------------------
 */

import React from "react";

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

export default function StepSkills({
  characterData,
  updateCharacterData,
  computedStats,
}) {
  const proficiencyBonus = computedStats?.proficiencyBonus || 2;
  const grantedProficiencies = computedStats?.proficiencies || [];
  const selectedSkills = characterData.skills || [];

  const MAX_USER_SKILL_CHOICES = 2;

  const hasJackOfAllTrades =
    characterData.classId &&
    (characterData.isBard ||
      computedStats?.grantedResources?.some(
        (r) => r.type === "JACK_OF_ALL_TRADES",
      ));

  const handleToggleSkill = (skillName) => {
    const isAutoGranted = grantedProficiencies.some(
      (p) => p.toLowerCase() === skillName.toLowerCase(),
    );

    if (isAutoGranted) {
      return;
    }

    const exists = selectedSkills.includes(skillName);
    let updatedSkills;

    if (exists) {
      updatedSkills = selectedSkills.filter((s) => s !== skillName);
    } else {
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
          Step 7: Skill Proficiencies & Passive Perks
        </h3>
        <p className="text-xs text-[#889c9b]">
          Background and lineage proficiencies are automatically locked. Choose
          up to {MAX_USER_SKILL_CHOICES} additional proficiencies from your
          class.
        </p>
      </div>

      {/* Passive Perks & Skill Budget Summary Banner */}
      <div className="p-3.5 sm:p-4 bg-[#4a261c]/60 border border-[#a59075]/40 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 shadow-inner">
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-[#f0e6d2] uppercase tracking-wider">
            Active Passive Perks & Budget
          </h4>
          <p className="text-[10px] text-[#889c9b] mt-0.5">
            Proficiency Bonus:{" "}
            <strong className="text-amber-300">+{proficiencyBonus}</strong>
            {hasJackOfAllTrades && " • Jack of All Trades Active"}
          </p>
        </div>
        <div className="text-xs px-2.5 py-1 rounded bg-[#361a12] text-amber-400 font-bold border border-[#a59075]/30 shrink-0">
          {selectedSkills.length} / {MAX_USER_SKILL_CHOICES} Class Choices (
          {grantedProficiencies.length} Auto-Granted)
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {SKILLS_METADATA.map(({ name, ability }) => {
          const rawMod = computedStats?.abilityModifiers?.[ability] ?? 0;
          const modValue = parseInt(rawMod, 10) || 0;

          const isAutoGranted = grantedProficiencies.some(
            (p) => p.toLowerCase() === name.toLowerCase(),
          );
          const isUserSelected = selectedSkills.includes(name);
          const isProficient = isAutoGranted || isUserSelected;

          let finalSkillMod = modValue;
          if (isProficient) {
            finalSkillMod += proficiencyBonus;
          } else if (hasJackOfAllTrades) {
            finalSkillMod += Math.floor(proficiencyBonus / 2);
          }

          const formattedMod =
            finalSkillMod >= 0 ? `+${finalSkillMod}` : `${finalSkillMod}`;

          return (
            <div
              key={name}
              onClick={() => handleToggleSkill(name)}
              className={`min-w-0 p-3.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                isAutoGranted
                  ? "bg-[#361a12] border-amber-500/50 cursor-not-allowed opacity-90 shadow"
                  : isUserSelected
                    ? "bg-[#937460]/40 border-amber-500 cursor-pointer shadow-md"
                    : "bg-[#4a261c]/60 border-[#a59075]/40 hover:border-[#a59075] cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-5 h-5 sm:w-4 sm:h-4 rounded flex items-center justify-center border transition shrink-0 ${
                    isProficient
                      ? "bg-amber-600 border-amber-400 text-white font-bold text-[10px]"
                      : "bg-[#361a12] border-[#a59075]/40"
                  }`}
                >
                  {isProficient && "✓"}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#f0e6d2] block truncate">
                    {name}
                  </span>
                  <span className="text-[10px] text-[#889c9b] uppercase tracking-wide block truncate">
                    {ability} {isAutoGranted && "(Background/Lineage)"}
                  </span>
                </div>
              </div>

              <span className="text-xs px-2 py-0.5 rounded bg-[#361a12] text-amber-300 font-bold border border-[#a59075]/30 shrink-0">
                {formattedMod}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
