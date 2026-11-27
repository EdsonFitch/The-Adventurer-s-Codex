/**
 * -----------------------------------------------------------------------------
 * COMPONENT: LandingPage.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Public-facing entry page for unauthenticated visitors to The Adventurer's Codex.
 * Features:
 * - Sticky top navigation bar with brand title, subtitle, and Sign In / Register CTA.
 * - Full-width auto-advancing hero artwork carousel with Previous/Next controls
 *   and pagination indicators.
 * - Hero headline & call-to-action banner.
 * - Three-column core feature showcase (Characters, Journal, Inventory).
 * - Embedded `AuthFormModal` triggered by Sign In / Begin Your Quest actions.
 *
 * Responsive & Touch Behavior:
 * - Mobile Navigation Header (`min-h-16 sm:h-24 py-2.5 sm:py-0`): Scales the
 *   title (`text-xl sm:text-3xl`) and hides the redundant top `"Features"` anchor
 *   link on `< 640px` screens (`hidden sm:inline-block`) so the brand header and
 *   `"Sign In / Register"` button never collide on 375px phones.
 * - Adaptive Hero Carousel (`h-[260px] sm:h-[420px] md:h-[560px]`): Keeps
 *   artwork proportional across portrait phones, tablets, and desktop monitors,
 *   while ensuring carousel arrows and pagination dots have comfortable touch
 *   padding and `cursor-pointer`.
 * - Responsive Feature Grid (`grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8`):
 *   Stacks cards cleanly on phones and expands to 3 columns on medium+ screens.
 * -----------------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import AuthFormModal from "./AuthFormModal";

// 1. Local hero carousel artwork assets
import slide1 from "../../assets/hero/slide-1.png";
import slide2 from "../../assets/hero/slide-2.png";
import slide3 from "../../assets/hero/slide-3.png";

// 2. Local feature card artwork assets
import charactersImg from "../../assets/hero/Characters.png";
import journalImg from "../../assets/hero/Journal.png";
import inventoryImg from "../../assets/hero/Inventory.png";

export default function LandingPage() {
  // Controls visibility of the Sign In / Register modal dialog
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // ----------------- CAROUSEL STATE & LOGIC -----------------
  const heroSlides = [
    {
      id: 1,
      image: slide1,
      alt: "Duel Amid the Ruined Storm",
    },
    {
      id: 2,
      image: slide2,
      alt: "Moonlit Heroes of the Ruined Citadel",
    },
    {
      id: 3,
      image: slide3,
      alt: "Bustling Fantasy Guild Cafeteria",
    },
  ];

  // Track active slide index (0-based)
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prevIndex) => (prevIndex + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prevIndex) =>
      prevIndex === 0 ? heroSlides.length - 1 : prevIndex - 1,
    );
  };

  // Auto-advance slide timer every 5 seconds (resets whenever slide changes)
  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 5000);
    return () => clearInterval(slideInterval);
  }, [currentSlide]);

  return (
    // Outer page shell using `min-h-[100dvh]` for accurate mobile viewport height
    <div className="min-h-[100dvh] bg-[#5f3426] text-[#a59075] font-antiqua selection:bg-[#889c9b] selection:text-[#5f3426]">
      {/* =====================================================================
        1. STICKY TOP NAVIGATION BAR
        - Adapts height and typography across phones (`min-h-16`) and desktop (`sm:h-24`).
        ===================================================================== */}
      <header className="sticky top-0 z-40 w-full border-b border-[#a59075]/40 bg-[#5f3426]/95 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 min-h-16 sm:h-24 py-2.5 sm:py-0 flex items-center justify-between gap-3">
          {/* Left Brand Header */}
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-xl sm:text-3xl font-bold font-medieval tracking-wide text-[#938f71] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate">
              The Adventurer&apos;s Codex
            </span>
            <span className="text-[10px] sm:text-xs font-antiqua tracking-widest text-[#889c9b] uppercase -mt-0.5 truncate">
              Dungeons &amp; Dragons 5e Companion
            </span>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <a
              href="#features"
              className="hidden sm:inline-block text-sm font-antiqua font-semibold text-[#a59075] hover:text-[#938f71] transition duration-200"
            >
              Features
            </a>
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-md text-xs sm:text-sm font-antiqua font-bold text-[#5f3426] bg-[#889c9b] hover:bg-[#938f71] shadow-md border border-[#a59075]/50 transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
        2. FULL-WIDTH HERO ARTWORK CAROUSEL
        ===================================================================== */}
      <section className="relative w-full border-y border-[#a59075]/50 bg-[#5f3426] overflow-hidden shadow-2xl">
        <div className="relative w-full h-[260px] sm:h-[420px] md:h-[560px]">
          {/* Active Slide Image */}
          <img
            src={heroSlides[currentSlide].image}
            alt={heroSlides[currentSlide].alt}
            className="w-full h-full object-cover transition-all duration-700 ease-in-out"
          />

          {/* Bottom Gradient Overlay for smooth transition into lower content */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#5f3426] via-transparent to-transparent opacity-90 pointer-events-none" />

          {/* Previous Slide Control */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-[#5f3426]/75 hover:bg-[#889c9b] text-[#a59075] hover:text-[#5f3426] border border-[#a59075]/50 rounded-full transition shadow-lg backdrop-blur-sm cursor-pointer"
          >
            ❮
          </button>

          {/* Next Slide Control */}
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-[#5f3426]/75 hover:bg-[#889c9b] text-[#a59075] hover:text-[#5f3426] border border-[#a59075]/50 rounded-full transition shadow-lg backdrop-blur-sm cursor-pointer"
          >
            ❯
          </button>

          {/* Slide Pagination Dots */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 sm:gap-3 z-10">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-3 rounded-full border border-[#a59075] transition-all duration-300 cursor-pointer ${
                  currentSlide === index
                    ? "bg-[#889c9b] w-8"
                    : "w-3 bg-[#5f3426]/80 hover:bg-[#938f71]"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
        3. HERO HEADLINE & CALL TO ACTION
        ===================================================================== */}
      <section className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 bg-[#937460]/10 border-b border-[#a59075]/30">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-2xl sm:text-4xl font-metamorphous text-[#938f71] tracking-tight leading-snug drop-shadow">
            Master Your Legend. Forge Your Destiny.
          </h1>

          <p className="text-sm sm:text-base text-[#a59075] font-antiqua italic leading-relaxed">
            &ldquo;Every roll of the die writes history. Track your abilities,
            chronicle your perilous journeys, and manage your inventory with a
            codex crafted for heroes.&rdquo;
          </p>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="w-full sm:w-auto px-8 py-3 rounded-lg text-sm sm:text-base font-antiqua font-bold text-[#5f3426] bg-[#889c9b] hover:bg-[#938f71] shadow-lg border border-[#a59075] transition cursor-pointer"
            >
              Begin Your Quest
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-3 rounded-lg text-sm sm:text-base font-antiqua font-semibold text-[#938f71] bg-[#5f3426] hover:bg-[#937460]/40 border border-[#a59075]/50 transition text-center"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================================
        4. CORE FUNCTIONS FEATURE SHOWCASE
        ===================================================================== */}
      <section
        id="features"
        className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2.5 sm:space-y-3">
          <h2 className="text-xl sm:text-3xl font-metamorphous text-[#938f71]">
            Core Features of the Codex
          </h2>
          <p className="text-[#a59075] font-antiqua italic text-xs sm:text-sm">
            Equipped with all the tools necessary for players and Dungeon
            Masters to keep campaigns seamless.
          </p>
        </div>

        {/* 3-Column Responsive Feature Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
          {/* Card 1: Character Creation & Management */}
          <div className="bg-[#937460]/30 border border-[#a59075]/40 rounded-xl overflow-hidden hover:border-[#889c9b] transition shadow-xl group">
            <div className="h-44 overflow-hidden relative">
              <img
                src={charactersImg}
                alt="Character Creation and Management"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#5f3426] via-transparent to-transparent" />
            </div>
            <div className="p-5 sm:p-6 space-y-2">
              <h3 className="text-base sm:text-lg font-metamorphous text-[#938f71]">
                Character Creation &amp; Management
              </h3>
              <p className="text-xs text-[#a59075] font-antiqua leading-relaxed">
                Build and tweak your D&amp;D 5e characters with complete
                fidelity. Manage stats, proficiency bonuses, spell slots, and
                racial abilities in real-time.
              </p>
            </div>
          </div>

          {/* Card 2: Journal & Campaign Logs */}
          <div className="bg-[#937460]/30 border border-[#a59075]/40 rounded-xl overflow-hidden hover:border-[#889c9b] transition shadow-xl group">
            <div className="h-44 overflow-hidden relative">
              <img
                src={journalImg}
                alt="Adventurer Journal Entries"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#5f3426] via-transparent to-transparent" />
            </div>
            <div className="p-5 sm:p-6 space-y-2">
              <h3 className="text-base sm:text-lg font-metamorphous text-[#938f71]">
                Journal &amp; Campaign Logs
              </h3>
              <p className="text-xs text-[#a59075] font-antiqua leading-relaxed">
                Chronicle campaign sessions, key NPC encounters, quest
                objectives, and session notes so no crucial lore is ever
                forgotten on your journey.
              </p>
            </div>
          </div>

          {/* Card 3: Inventory & Magic Items */}
          <div className="bg-[#937460]/30 border border-[#a59075]/40 rounded-xl overflow-hidden hover:border-[#889c9b] transition shadow-xl group">
            <div className="h-44 overflow-hidden relative">
              <img
                src={inventoryImg}
                alt="Character Inventory Management"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#5f3426] via-transparent to-transparent" />
            </div>
            <div className="p-5 sm:p-6 space-y-2">
              <h3 className="text-base sm:text-lg font-metamorphous text-[#938f71]">
                Inventory &amp; Magic Items
              </h3>
              <p className="text-xs text-[#a59075] font-antiqua leading-relaxed">
                Track gold, encumbrance, weapons, armor, and magical artifacts.
                Effortlessly equip items or adjust quantities during intense
                encounters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
        5. AUTHENTICATION MODAL DIALOG
        ===================================================================== */}
      {isAuthOpen && <AuthFormModal onClose={() => setIsAuthOpen(false)} />}
    </div>
  );
}
