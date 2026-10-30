import React, { useState } from "react";

/**
 * MainContentArea Component
 * -----------------------------------------------------------------------------
 * Acts as the primary scrollable canvas within the dashboard layout shell.
 * - Displays active character cards with character photos (or medieval fallback placeholders).
 * - Displays core character metadata: Name, Class, Race, Level, and Campaign Name.
 * - Always includes a persistent "Character Creator" card link for forging new heroes.
 * - Accepts `children` so it can seamlessly render nested views (like Journal or Inventory)
 *   when navigated away from the main grid.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} [props.children] - Dynamic sub-view component to render override (optional).
 * @param {Function} [props.onSelectCharacter] - Callback function triggered when a character card is clicked.
 * @param {Function} [props.onOpenCreator] - Callback function triggered when the Character Creator card is clicked.
 */
export default function MainContentArea({
  children,
  onSelectCharacter,
  onOpenCreator,
}) {
  // ---------------------------------------------------------------------------
  // MOCK USER CHARACTERS STATE (Replace with Supabase database fetch in production)
  // ---------------------------------------------------------------------------
  const [userCharacters] = useState([
    {
      id: "char-1",
      name: "Baggi",
      charClass: "Barbarian",
      race: "Half-Orc",
      level: 5,
      campaignName: "Hoard of the Dragon Queen",
      photoUrl: "", // Intentionally empty to test default medieval fallback placeholder
    },
    {
      id: "char-2",
      name: "Eddie York",
      charClass: "Bard",
      race: "Tiefling",
      level: 4,
      campaignName: "Waterdeep: Dragon Heist",
      photoUrl:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
    },
  ]);

  // Default medieval avatar placeholder svg/data URI used when photoUrl is missing or invalid
  const defaultPlaceholderPhoto = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23938f71" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/></svg>`;

  return (
    // Scrollable Main Area Wrapper
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#937460]/10">
      {/* 
        If specific children are passed (e.g., full Character Sheet or Inventory screen),
        render them directly. Otherwise, render the main Character & Creator grid.
      */}
      {children ? (
        children
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* SECTION HEADER */}
          <div className="border-b border-[#a59075]/30 pb-4">
            <h2 className="text-2xl font-metamorphous text-[#938f71]">
              Your Adventurers
            </h2>
            <p className="text-xs text-[#a59075] font-antiqua mt-1">
              Select an active hero to view their details or forge a new hero
              for your next quest.
            </p>
          </div>

          {/* -----------------------------------------------------------------
            CARDS GRID: Dynamically populates user characters + Creator card
            ----------------------------------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. DYNAMIC USER CHARACTER CARDS */}
            {userCharacters.map((character) => (
              <div
                key={character.id}
                onClick={() =>
                  onSelectCharacter && onSelectCharacter(character)
                }
                className="bg-[#5f3426]/80 hover:bg-[#5f3426] border-2 border-[#a59075]/40 hover:border-[#889c9b] rounded-xl p-5 shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group transform hover:-translate-y-1"
              >
                <div>
                  {/* Card Header: Photo & Core Identifiers */}
                  <div className="flex items-start space-x-4">
                    {/* Character Photo or Medieval Fallback Placeholder */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-[#a59075]/60 group-hover:border-[#938f71] bg-[#937460]/20 flex-shrink-0 flex items-center justify-center">
                      <img
                        src={character.photoUrl || defaultPlaceholderPhoto}
                        alt={character.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback to default placeholder image on image load failure
                          e.target.onerror = null;
                          e.target.src = defaultPlaceholderPhoto;
                        }}
                      />
                    </div>

                    {/* Character Name, Class, Race, Level */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold font-metamorphous text-[#938f71] group-hover:text-[#889c9b] transition truncate">
                        {character.name}
                      </h3>
                      <p className="text-xs text-[#a59075] font-semibold mt-0.5">
                        Level {character.level} • {character.race}
                      </p>
                      <p className="text-xs text-[#889c9b] font-medium">
                        {character.charClass}
                      </p>
                    </div>
                  </div>

                  {/* Campaign Name Footer Section inside card */}
                  <div className="mt-4 pt-3 border-t border-[#a59075]/20 flex items-center justify-between text-xs">
                    <span className="text-[10px] uppercase tracking-wider text-[#889c9b] font-semibold">
                      Campaign
                    </span>
                    <span className="font-bold text-[#938f71] truncate max-w-[160px]">
                      {character.campaignName || "Unassigned"}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Prompt */}
                <div className="mt-4 text-right text-[11px] font-bold text-[#889c9b] group-hover:text-[#938f71] transition">
                  Open Sheet →
                </div>
              </div>
            ))}

            {/* 2. ALWAYS PRESENT: CHARACTER CREATOR CARD LINK */}
            <div
              onClick={() => onOpenCreator && onOpenCreator()}
              className="bg-[#937460]/20 hover:bg-[#937460]/30 border-2 border-dashed border-[#a59075]/60 hover:border-[#889c9b] rounded-xl p-6 shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between group transform hover:-translate-y-1 min-h-[220px]"
            >
              <div className="space-y-3">
                {/* Creator Header & Sparkle Icon */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-[#5f3426] border border-[#a59075] flex items-center justify-center text-xl shadow">
                    ✨
                  </div>
                  <h3 className="text-lg font-bold font-metamorphous text-[#938f71] group-hover:text-[#889c9b] transition">
                    Character Creator
                  </h3>
                </div>

                {/* Summary Description of the Tool */}
                <p className="text-xs text-[#a59075] font-antiqua leading-relaxed">
                  Forge a brand new adventurer from the ground up. Roll ability
                  scores, choose your lineage, select your class, and craft
                  backstories ready for your next campaign.
                </p>
              </div>

              {/* Creator Card Action Link */}
              <div className="pt-4 border-t border-[#a59075]/20 flex items-center justify-between text-xs font-bold text-[#889c9b] group-hover:text-[#938f71] transition">
                <span>Start Creation Wizard</span>
                <span className="text-lg">＋</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
