/**
 * -----------------------------------------------------------------------------
 * COMPONENT: JournalView
 * -----------------------------------------------------------------------------
 * Provides a multi-session campaign journal interface for the active hero,
 * featuring dual-stage viewing (Read Reference Mode vs. Edit Mode), full
 * 8-field tracking, and custom session banner image uploads.
 */

import React, { useState, useEffect } from "react";
import {
  fetchJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from "../../services/journalService";
import { uploadSessionBanner } from "../../utils/uploadImage";
import { useAuth } from "../../context/AuthContext";

export default function JournalView({ selectedCharacter }) {
  const { user } = useAuth();

  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  const [entries, setEntries] = useState([]);
  const [activeEntry, setActiveEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Mode toggle state: false = Read/Reference Mode, true = Edit Mode
  const [isEditing, setIsEditing] = useState(false);

  // Local form state including banner_url
  const [formData, setFormData] = useState({
    title: "",
    session_number: 1,
    entry_date: "",
    banner_url: "",
    recap: "",
    locations: "",
    npcs: "",
    loot_magical: "",
    clues_mysteries: "",
    decisions_quests: "",
    todo_next: "",
    party_watch: "",
  });

  // ---------------------------------------------------------------------------
  // LIFECYCLE: FETCH ENTRIES
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadJournalData() {
      if (!selectedCharacter?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await fetchJournalEntries(selectedCharacter.id);

      if (isMounted) {
        if (!error && data) {
          setEntries(data);
          if (data.length > 0) {
            const latest = data[data.length - 1];
            setActiveEntry(latest);
            populateForm(latest);
            setIsEditing(false); // Default to Read Mode on load
          } else {
            setActiveEntry(null);
          }
        }
        setLoading(false);
      }
    }

    loadJournalData();

    return () => {
      isMounted = false;
    };
  }, [selectedCharacter?.id]);

  const populateForm = (entry) => {
    setFormData({
      title: entry.title || "",
      session_number: entry.session_number || 1,
      entry_date: entry.entry_date || "",
      banner_url: entry.banner_url || "",
      recap: entry.recap || "",
      locations: entry.locations || "",
      npcs: entry.npcs || "",
      loot_magical: entry.loot_magical || "",
      clues_mysteries: entry.clues_mysteries || "",
      decisions_quests: entry.decisions_quests || "",
      todo_next: entry.todo_next || "",
      party_watch: entry.party_watch || "",
    });
  };

  // ---------------------------------------------------------------------------
  // EVENT HANDLERS
  // ---------------------------------------------------------------------------
  const handleSelectEntry = (entry) => {
    setActiveEntry(entry);
    populateForm(entry);
    setIsEditing(false); // Switch to Read Mode when selecting an entry
    setSaveMessage("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handles session banner image file selection and Supabase storage upload.
   */
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCharacter?.id) return;

    setUploadingBanner(true);
    const publicUrl = await uploadSessionBanner(
      file,
      user?.id,
      selectedCharacter.id,
    );
    setUploadingBanner(false);

    if (publicUrl) {
      setFormData((prev) => ({ ...prev, banner_url: publicUrl }));
      setSaveMessage("Banner uploaded! Remember to save changes.");
    }
  };

  const handleCreateNewSession = async () => {
    if (!selectedCharacter?.id) return;

    const nextSessionNum = entries.length + 1;
    const defaultData = {
      session_number: nextSessionNum,
      title: `Session ${nextSessionNum}`,
      entry_date: new Date().toISOString().split("T")[0],
      banner_url: "",
    };

    setSaving(true);
    const { data, error } = await createJournalEntry(
      selectedCharacter.id,
      defaultData,
    );
    setSaving(false);

    if (!error && data) {
      const updatedList = [...entries, data];
      setEntries(updatedList);
      setActiveEntry(data);
      populateForm(data);
      setIsEditing(true); // Open newly created sessions directly in Edit Mode
      setSaveMessage("New session created!");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const handleSaveEntry = async (e) => {
    if (e) e.preventDefault();
    if (!activeEntry?.id) return;

    setSaving(true);
    setSaveMessage("");

    const { data, error } = await updateJournalEntry(activeEntry.id, formData);
    setSaving(false);

    if (!error && data) {
      setEntries((prev) =>
        prev.map((item) => (item.id === data.id ? data : item)),
      );
      setActiveEntry(data);
      setSaveMessage("Changes saved successfully!");
      setIsEditing(false); // Return to Read Mode after saving
      setTimeout(() => setSaveMessage(""), 3000);
    } else {
      setSaveMessage("Failed to save changes.");
    }
  };

  const handleDeleteEntry = async () => {
    if (!activeEntry?.id) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${formData.title}"? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    setSaving(true);
    const { success } = await deleteJournalEntry(activeEntry.id);
    setSaving(false);

    if (success) {
      const remaining = entries.filter((item) => item.id !== activeEntry.id);
      setEntries(remaining);
      if (remaining.length > 0) {
        const fallback = remaining[remaining.length - 1];
        setActiveEntry(fallback);
        populateForm(fallback);
        setIsEditing(false);
      } else {
        setActiveEntry(null);
      }
      setSaveMessage("Session deleted.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  if (!selectedCharacter) {
    return (
      <div className="p-8 bg-[#5f3426]/80 border-2 border-[#a59075]/40 rounded-xl max-w-4xl mx-auto text-center space-y-4 animate-fadeIn">
        <h2 className="text-xl font-bold font-medieval text-[#f0e6d2]">
          📖 Campaign Journal
        </h2>
        <p className="text-sm text-[#a59075]">
          Please select a hero from the Adventurers Roster to view or write
          session journals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 animate-fadeIn">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#a59075]/30 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-medieval text-[#f0e6d2] flex items-center space-x-2">
            <span>📖</span>
            <span>{selectedCharacter.name}'s Campaign Journal</span>
          </h1>
          <p className="text-xs text-[#a59075] mt-1">
            Log session recaps, tracked NPCs, locations, loot, and custom
            banners.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNewSession}
          disabled={saving}
          className="px-4 py-2 bg-[#937460]/30 hover:bg-[#937460]/50 border border-[#a59075]/50 text-[#f0e6d2] rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-2 shadow cursor-pointer disabled:opacity-50"
        >
          <span>➕ New Session</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-[#a59075] text-sm italic">
          Loading chronicle entries from Supabase...
        </div>
      ) : entries.length === 0 ? (
        <div className="p-10 bg-[#5f3426]/80 border-2 border-dashed border-[#a59075]/40 rounded-xl text-center space-y-4">
          <p className="text-base text-[#f0e6d2]">
            No journal entries recorded for {selectedCharacter.name} yet.
          </p>
          <button
            type="button"
            onClick={handleCreateNewSession}
            className="px-5 py-2.5 bg-[#937460]/40 hover:bg-[#937460]/60 border border-[#a59075]/60 text-[#f0e6d2] text-xs font-bold rounded-lg transition shadow cursor-pointer"
          >
            Start Session #1
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT SUB-SIDEBAR */}
          <div className="lg:col-span-1 bg-[#5f3426]/90 border border-[#a59075]/40 rounded-xl p-3 space-y-2 h-fit max-h-[75vh] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#889c9b] px-2 py-1 border-b border-[#a59075]/20">
              Sessions ({entries.length})
            </h3>
            <div className="space-y-1">
              {entries.map((entry) => {
                const isSelected = activeEntry?.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    onClick={() => handleSelectEntry(entry)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition text-xs flex flex-col space-y-0.5 border ${
                      isSelected
                        ? "bg-[#937460]/40 border-[#a59075] text-[#f0e6d2] font-semibold shadow"
                        : "border-transparent text-[#a59075] hover:bg-[#937460]/20 hover:text-[#938f71]"
                    }`}
                  >
                    <span className="truncate">
                      #{entry.session_number}: {entry.title || "Untitled"}
                    </span>
                    <span className="text-[10px] text-[#889c9b]">
                      {entry.entry_date || "No Date"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT CANVAS: DUAL-STAGE (READ REFERENCE MODE vs. EDIT MODE) */}
          {activeEntry && (
            <div className="lg:col-span-3 bg-[#5f3426]/90 border-2 border-[#a59075]/40 rounded-xl p-6 space-y-6 shadow-2xl">
              {/* MODE SWITCHER ACTION BAR */}
              <div className="flex items-center justify-between border-b border-[#a59075]/30 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#889c9b]">
                    Mode:
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${isEditing ? "bg-amber-900/60 text-amber-200 border border-amber-700/50" : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"}`}
                  >
                    {isEditing ? "✏️ Edit Mode" : "📖 Read Reference Mode"}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 bg-[#937460]/30 hover:bg-[#937460]/50 border border-[#a59075]/50 text-[#f0e6d2] rounded text-xs font-semibold transition flex items-center space-x-1.5 shadow cursor-pointer"
                    >
                      <span>📖 Switch to Read Mode</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 bg-[#937460]/40 hover:bg-[#937460]/60 border border-[#a59075]/60 text-[#f0e6d2] rounded text-xs font-semibold transition flex items-center space-x-1.5 shadow cursor-pointer"
                    >
                      <span>✏️ Edit Session</span>
                    </button>
                  )}
                </div>
              </div>

              {/* FEEDBACK / SAVE STATUS MESSAGE */}
              {saveMessage && (
                <div className="p-2.5 bg-[#3d1c14] border border-[#a59075]/40 rounded text-xs text-[#f0e6d2] italic text-center animate-fadeIn">
                  {saveMessage}
                </div>
              )}

              {/* ========================================================= */}
              {/* STAGE 1: READ REFERENCE MODE                              */}
              {/* ========================================================= */}
              {!isEditing ? (
                <div className="space-y-6 animate-fadeIn">
                  {/* BANNER DISPLAY (IF PRESENT) */}
                  {activeEntry.banner_url && (
                    <div className="w-full h-44 bg-[#3d1c14] border border-[#a59075]/40 rounded-xl overflow-hidden shadow-inner">
                      <img
                        src={activeEntry.banner_url}
                        alt={activeEntry.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* SESSION TITLE & METADATA HEADER */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#a59075]/30 pb-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#889c9b]">
                        Session #{activeEntry.session_number}
                      </span>
                      <h2 className="text-xl font-bold font-medieval text-[#f0e6d2] mt-0.5">
                        {activeEntry.title || "Untitled Session"}
                      </h2>
                    </div>
                    <div className="text-xs text-[#a59075] bg-[#3d1c14]/60 px-3 py-1.5 rounded border border-[#a59075]/30 w-fit">
                      📅 {activeEntry.entry_date || "No Date Recorded"}
                    </div>
                  </div>

                  {/* READ-ONLY 8 CORE FIELDS */}
                  <div className="space-y-4 pt-2">
                    {/* 1. RECAP */}
                    <div className="bg-[#3d1c14]/60 border border-[#a59075]/30 rounded-xl p-4 space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#889c9b] flex items-center space-x-2">
                        <span>📜</span>
                        <span>1. Session Recap</span>
                      </h3>
                      <p className="text-xs text-[#f0e6d2] whitespace-pre-wrap leading-relaxed">
                        {activeEntry.recap || (
                          <span className="italic text-[#a59075]">
                            No recap recorded for this session.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* 2 & 3: LOCATIONS & NPCS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#3d1c14]/60 border border-[#a59075]/30 rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#889c9b] flex items-center space-x-2">
                          <span>🗺️</span>
                          <span>2. Locations Discovered</span>
                        </h3>
                        <p className="text-xs text-[#f0e6d2] whitespace-pre-wrap leading-relaxed">
                          {activeEntry.locations || (
                            <span className="italic text-[#a59075]">
                              None recorded.
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="bg-[#3d1c14]/60 border border-[#a59075]/30 rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#889c9b] flex items-center space-x-2">
                          <span>👤</span>
                          <span>3. NPCs Met & Notes</span>
                        </h3>
                        <p className="text-xs text-[#f0e6d2] whitespace-pre-wrap leading-relaxed">
                          {activeEntry.npcs || (
                            <span className="italic text-[#a59075]">
                              None recorded.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 4 & 5: LOOT & CLUES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#3d1c14]/60 border border-[#a59075]/30 rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#889c9b] flex items-center space-x-2">
                          <span>💎</span>
                          <span>4. Loot & Magic Items</span>
                        </h3>
                        <p className="text-xs text-[#f0e6d2] whitespace-pre-wrap leading-relaxed">
                          {activeEntry.loot_magical || (
                            <span className="italic text-[#a59075]">
                              None recorded.
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="bg-[#3d1c14]/60 border border-[#a59075]/30 rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#889c9b] flex items-center space-x-2">
                          <span>🔍</span>
                          <span>5. Clues & Mysteries</span>
                        </h3>
                        <p className="text-xs text-[#f0e6d2] whitespace-pre-wrap leading-relaxed">
                          {activeEntry.clues_mysteries || (
                            <span className="italic text-[#a59075]">
                              None recorded.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 6 & 7: DECISIONS & TO-DO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#3d1c14]/60 border border-[#a59075]/30 rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#889c9b] flex items-center space-x-2">
                          <span>⚡</span>
                          <span>6. Decisions & Quest Updates</span>
                        </h3>
                        <p className="text-xs text-[#f0e6d2] whitespace-pre-wrap leading-relaxed">
                          {activeEntry.decisions_quests || (
                            <span className="italic text-[#a59075]">
                              None recorded.
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="bg-[#3d1c14]/60 border border-[#a59075]/30 rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#889c9b] flex items-center space-x-2">
                          <span>📌</span>
                          <span>7. To Do Next Time</span>
                        </h3>
                        <p className="text-xs text-[#f0e6d2] whitespace-pre-wrap leading-relaxed">
                          {activeEntry.todo_next || (
                            <span className="italic text-[#a59075]">
                              None recorded.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 8. PARTY WATCH */}
                    <div className="bg-[#3d1c14]/60 border border-[#a59075]/30 rounded-xl p-4 space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#889c9b] flex items-center space-x-2">
                        <span>🛡️</span>
                        <span>8. Party Members Watch</span>
                      </h3>
                      <p className="text-xs text-[#f0e6d2] whitespace-pre-wrap leading-relaxed">
                        {activeEntry.party_watch || (
                          <span className="italic text-[#a59075]">
                            None recorded.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* ========================================================= */
                /* STAGE 2: EDIT MODE FORM                                   */
                /* ========================================================= */
                <form
                  onSubmit={handleSaveEntry}
                  className="space-y-6 animate-fadeIn"
                >
                  {/* SESSION BANNER IMAGE UPLOAD BOX */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#889c9b]">
                      🖼️ Session Banner Image
                    </label>
                    <div className="relative w-full h-36 bg-[#3d1c14]/90 border-2 border-dashed border-[#a59075]/40 rounded-xl overflow-hidden flex items-center justify-center group">
                      {formData.banner_url ? (
                        <>
                          <img
                            src={formData.banner_url}
                            alt="Session Banner"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-3">
                            <label className="px-3 py-1.5 bg-[#937460]/80 hover:bg-[#937460] text-[#f0e6d2] text-xs font-bold rounded cursor-pointer transition shadow">
                              Change Banner
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleBannerUpload}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  banner_url: "",
                                }))
                              }
                              className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-bold rounded transition shadow"
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center space-y-1 p-4 text-center">
                          <span className="text-xl">🌄</span>
                          <span className="text-xs text-[#f0e6d2] font-semibold">
                            {uploadingBanner
                              ? "Uploading & Compressing..."
                              : "Click to upload session banner image"}
                          </span>
                          <span className="text-[10px] text-[#a59075]">
                            Supports JPEG, PNG, WebP (Optimized as 1200x500
                            panoramic)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerUpload}
                            disabled={uploadingBanner}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* SESSION META CONTROLS */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#a59075]/30 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto flex-1">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#889c9b] font-bold mb-1">
                          Session #
                        </label>
                        <input
                          type="number"
                          name="session_number"
                          value={formData.session_number}
                          onChange={handleInputChange}
                          className="w-full bg-[#3d1c14]/80 border border-[#a59075]/40 rounded px-3 py-1.5 text-xs text-[#f0e6d2] focus:outline-none focus:border-[#889c9b]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase tracking-wider text-[#889c9b] font-bold mb-1">
                          Session Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="e.g., The Goblin Ambush"
                          className="w-full bg-[#3d1c14]/80 border border-[#a59075]/40 rounded px-3 py-1.5 text-xs text-[#f0e6d2] focus:outline-none focus:border-[#889c9b]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#889c9b] font-bold mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          name="entry_date"
                          value={formData.entry_date}
                          onChange={handleInputChange}
                          className="bg-[#3d1c14]/80 border border-[#a59075]/40 rounded px-2 py-1.5 text-xs text-[#f0e6d2] focus:outline-none focus:border-[#889c9b]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleDeleteEntry}
                        disabled={saving}
                        className="mt-4 p-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/40 rounded transition cursor-pointer"
                        title="Delete Session Log"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* SAVE ACTIONS BAR */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-[#3d1c14] hover:bg-[#4a241b] border border-[#a59075]/40 text-[#f0e6d2] text-xs font-semibold rounded-lg transition shadow cursor-pointer"
                    >
                      Cancel / Back to Read Mode
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 bg-[#937460]/40 hover:bg-[#937460]/60 border border-[#a59075]/60 text-[#f0e6d2] font-semibold text-xs rounded-lg transition shadow cursor-pointer disabled:opacity-50"
                    >
                      {saving ? "Saving to Supabase..." : "💾 Save Session Log"}
                    </button>
                  </div>

                  {/* 8 CORE EDITABLE FIELDS */}
                  <div className="space-y-5 pt-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#889c9b] mb-1.5 flex items-center space-x-2">
                        <span>📜</span>
                        <span>1. Session Recap</span>
                      </label>
                      <textarea
                        name="recap"
                        rows={4}
                        value={formData.recap}
                        onChange={handleInputChange}
                        placeholder="Summary of events that transpired..."
                        className="w-full bg-[#3d1c14]/80 border border-[#a59075]/40 rounded-lg p-3 text-xs text-[#f0e6d2] focus:outline-none focus:border-[#889c9b]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#889c9b] mb-1.5 flex items-center space-x-2">
                          <span>🗺️</span>
                          <span>2. Locations Discovered</span>
                        </label>
                        <textarea
                          name="locations"
                          rows={3}
                          value={formData.locations}
                          onChange={handleInputChange}
                          placeholder="Towns, dungeons, landmarks visited..."
                          className="w-full bg-[#3d1c14]/80 border border-[#a59075]/40 rounded-lg p-3 text-xs text-[#f0e6d2] focus:outline-none focus:border-[#889c9b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#889c9b] mb-1.5 flex items-center space-x-2">
                          <span>👤</span>
                          <span>3. NPCs Met & Notes</span>
                        </label>
                        <textarea
                          name="npcs"
                          rows={3}
                          value={formData.npcs}
                          onChange={handleInputChange}
                          placeholder="Names, descriptions, dispositions..."
                          className="w-full bg-[#3d1c14]/80 border border-[#a59075]/40 rounded-lg p-3 text-xs text-[#f0e6d2] focus:outline-none focus:border-[#889c9b]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#889c9b] mb-1.5 flex items-center space-x-2">
                          <span>💎</span>
                          <span>4. Loot & Magic Items</span>
                        </label>
                        <textarea
                          name="loot_magical"
                          rows={3}
                          value={formData.loot_magical}
                          onChange={handleInputChange}
                          placeholder="Gold acquired, magic weapons, items..."
                          className="w-full bg-[#3d1c14]/80 border border-[#a59075]/40 rounded-lg p-3 text-xs text-[#f0e6d2] focus:outline-none focus:border-[#889c9b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#889c9b] mb-1.5 flex items-center space-x-2">
                          <span>🔍</span>
                          <span>5. Clues & Mysteries</span>
                        </label>
                        <textarea
                          name="clues_mysteries"
                          rows={3}
                          value={formData.clues_mysteries}
                          onChange={handleInputChange}
                          placeholder="Riddles, strange occurrences, leads..."
                          className="w-full bg-[#3d1c14]/80 border border-[#a59075]/40 rounded-lg p-3 text-xs text-[#f0e6d2] focus:outline-none focus:border-[#889c9b]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#889c9b] mb-1.5 flex items-center space-x-2">
                          <span>⚡</span>
                          <span>6. Decisions & Quest Updates</span>
                        </label>
                        <textarea
                          name="decisions_quests"
                          rows={3}
                          value={formData.decisions_quests}
                          onChange={handleInputChange}
                          placeholder="Key choices made and active objectives..."
                          className="w-full bg-[#3d1c14]/80 border border-[#a59075]/40 rounded-lg p-3 text-xs text-[#f0e6d2] focus:outline-none focus:border-[#889c9b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#889c9b] mb-1.5 flex items-center space-x-2">
                          <span>📌</span>
                          <span>7. To Do Next Time</span>
                        </label>
                        <textarea
                          name="todo_next"
                          rows={3}
                          value={formData.todo_next}
                          onChange={handleInputChange}
                          placeholder="Immediate goals for starting next session..."
                          className="w-full bg-[#3d1c14]/80 border border-[#a59075]/40 rounded-lg p-3 text-xs text-[#f0e6d2] focus:outline-none focus:border-[#889c9b]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#889c9b] mb-1.5 flex items-center space-x-2">
                        <span>🛡️</span>
                        <span>8. Party Members Watch</span>
                      </label>
                      <textarea
                        name="party_watch"
                        rows={2}
                        value={formData.party_watch}
                        onChange={handleInputChange}
                        placeholder="Camp watch shifts and security orders..."
                        className="w-full bg-[#3d1c14]/80 border border-[#a59075]/40 rounded-lg p-3 text-xs text-[#f0e6d2] focus:outline-none focus:border-[#889c9b]"
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
