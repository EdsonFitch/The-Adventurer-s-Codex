import React from "react";
// 1. Import global AuthProvider and useAuth custom hook from context
import { AuthProvider, useAuth } from "./context/AuthContext";
// 2. Import the LandingPage component for unauthenticated visitors
import LandingPage from "./components/common/LandingPage";

// Main Application View component rendered based on user auth status
function MainApp() {
  // Destructure user session, public profile, and signOut method from global context
  const { user, profile, signOut } = useAuth();

  // 3. Conditional Rendering: If no user session exists, display the Landing Page
  if (!user) {
    return <LandingPage />;
  }

  // 4. Authenticated State View (Dashboard)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto flex justify-between items-center border-b border-amber-900/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-amber-400">
            The Adventurer's Codex
          </h1>
          {/* Display public display_name from public.profiles table, falling back to email */}
          <p className="text-sm text-slate-400">
            Welcome back, {profile?.display_name || user.email}
          </p>
        </div>

        {/* Sign Out Button executing Supabase session termination */}
        <button
          onClick={signOut}
          className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded text-sm transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

// Root Application Component wrapped inside AuthProvider context wrapper
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
