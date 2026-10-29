import React, { useState, useEffect } from "react";
// Import the authentication modal wrapper
import AuthFormModal from "./AuthFormModal";

// 1. Import local hero image assets from src/assets/hero/
import slide1 from "../../assets/hero/slide-1.png";
import slide2 from "../../assets/hero/slide-2.png";
import slide3 from "../../assets/hero/slide-3.png";

// 2. Import feature card image assets
import charactersImg from "../../assets/hero/Characters.png";
import journalImg from "../../assets/hero/Journal.png";
import inventoryImg from "../../assets/hero/Inventory.png";

export default function LandingPage() {
  // State hook to control opening/closing of the auth modal
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // ----------------- CAROUSEL STATE & LOGIC -----------------
  // Array of hero slide image sources and captions (replace these placeholders with your real image paths)
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

  // Helper functions for slide navigation
  const nextSlide = () => {
    setCurrentSlide((prevIndex) => (prevIndex + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prevIndex) =>
      prevIndex === 0 ? heroSlides.length - 1 : prevIndex - 1,
    );
  };

  // Auto-advance slide timer effect (changes image every 5 seconds)
  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 5000);
    // Cleanup interval timer on component unmount
    return () => clearInterval(slideInterval);
  }, [currentSlide]);

  return (
    // Main container applying dark leather/earth background (#5f3426) and Modern Antiqua font
    <div className="min-h-screen bg-[#5f3426] text-[#a59075] font-antiqua selection:bg-[#889c9b] selection:text-[#5f3426]">
      {/* ----------------- TOP NAVIGATION BAR ----------------- */}
      <header className="sticky top-0 z-40 w-full border-b border-[#a59075]/40 bg-[#5f3426]/95 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          {/* Left Brand Header: Main Title in MedievalSharp + Subtitle directly beneath */}
          <div className="flex flex-col justify-center">
            <span className="text-3xl font-bold font-medieval tracking-wide text-[#938f71] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              The Adventurer's Codex
            </span>
            <span className="text-xs font-antiqua tracking-widest text-[#889c9b] uppercase -mt-0.5">
              Dungeons & Dragons 5e Companion
            </span>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center space-x-6">
            <a
              href="#features"
              className="text-sm font-antiqua font-semibold text-[#a59075] hover:text-[#938f71] transition duration-200"
            >
              Features
            </a>
            {/* Sign In / Register Button */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-5 py-2.5 rounded-md text-sm font-antiqua font-bold text-[#5f3426] bg-[#889c9b] hover:bg-[#938f71] shadow-md border border-[#a59075]/50 transition active:scale-95"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </header>

      {/* ----------------- FULL-WIDTH HERO ARTWORK CAROUSEL ----------------- */}
      {/* Occupies full screen width below navbar with horizontal top and bottom borders only */}
      <section className="relative w-full border-y border-[#a59075]/50 bg-[#5f3426] overflow-hidden shadow-2xl">
        <div className="relative w-full h-[380px] sm:h-[480px] md:h-[580px]">
          {/* Active Image Render */}
          <img
            src={heroSlides[currentSlide].image}
            alt={heroSlides[currentSlide].alt}
            className="w-full h-full object-cover transition-all duration-700 ease-in-out"
          />

          {/* Bottom Gradient Overlay for seamless transition into lower content */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#5f3426] via-transparent to-transparent opacity-90" />

          {/* Carousel Control: Previous Button */}
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-[#5f3426]/70 hover:bg-[#889c9b] text-[#a59075] hover:text-[#5f3426] border border-[#a59075]/50 rounded-full transition shadow-lg backdrop-blur-sm"
          >
            ❮
          </button>

          {/* Carousel Control: Next Button */}
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-[#5f3426]/70 hover:bg-[#889c9b] text-[#a59075] hover:text-[#5f3426] border border-[#a59075]/50 rounded-full transition shadow-lg backdrop-blur-sm"
          >
            ❯
          </button>

          {/* Pagination Indicators (Dots) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`w-3 h-3 rounded-full border border-[#a59075] transition-all duration-300 ${
                  currentSlide === index
                    ? "bg-[#889c9b] w-8"
                    : "bg-[#5f3426]/80 hover:bg-[#938f71]"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ----------------- HERO HEADLINE & CALL TO ACTION ----------------- */}
      {/* Placed directly below the full-width artwork slider */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#937460]/10 border-b border-[#a59075]/30">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-metamorphous text-[#938f71] tracking-tight leading-snug drop-shadow">
            Master Your Legend. Forge Your Destiny.
          </h1>

          <p className="text-base text-[#a59075] font-antiqua italic leading-relaxed">
            "Every roll of the die writes history. Track your abilities,
            chronicle your perilous journeys, and manage your inventory with a
            codex crafted for heroes."
          </p>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-8 py-3 rounded-lg text-base font-antiqua font-bold text-[#5f3426] bg-[#889c9b] hover:bg-[#938f71] shadow-lg border border-[#a59075] transition"
            >
              Begin Your Quest
            </button>
            <a
              href="#features"
              className="px-8 py-3 rounded-lg text-base font-antiqua font-semibold text-[#938f71] bg-[#5f3426] hover:bg-[#937460]/40 border border-[#a59075]/50 transition text-center"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* ----------------- CORE FUNCTIONS SECTION ----------------- */}
      <section
        id="features"
        className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <h2 className="text-2xl sm:text-3xl font-metamorphous text-[#938f71]">
            Core Features of the Codex
          </h2>
          <p className="text-[#a59075] font-antiqua italic text-sm">
            Equipped with all the tools necessary for players and Dungeon
            Masters to keep campaigns seamless.
          </p>
        </div>

        {/* 3 Grid Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Character Creation */}
          <div className="bg-[#937460]/30 border border-[#a59075]/40 rounded-xl overflow-hidden hover:border-[#889c9b] transition shadow-xl group">
            <div className="h-44 overflow-hidden relative">
              <img
                src={charactersImg}
                alt="Character Creation and Management"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#5f3426] via-transparent to-transparent" />
            </div>
            <div className="p-6 space-y-2">
              <h3 className="text-lg font-metamorphous text-[#938f71]">
                Character Creation & Management
              </h3>
              <p className="text-xs text-[#a59075] font-antiqua leading-relaxed">
                Build and tweak your D&D 5e characters with complete fidelity.
                Manage stats, proficiency bonuses, spell slots, and racial
                abilities in real-time.
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
            <div className="p-6 space-y-2">
              <h3 className="text-lg font-metamorphous text-[#938f71]">
                Journal & Campaign Logs
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
            <div className="p-6 space-y-2">
              <h3 className="text-lg font-metamorphous text-[#938f71]">
                Inventory & Magic Items
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

      {/* ----------------- AUTH MODAL ----------------- */}
      {isAuthOpen && <AuthFormModal onClose={() => setIsAuthOpen(false)} />}
    </div>
  );
}
