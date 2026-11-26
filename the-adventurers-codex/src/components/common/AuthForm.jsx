import React, { useState } from "react";
// Import the custom useAuth hook to access Supabase authentication functions (signIn, signUp)
import { useAuth } from "../../context/AuthContext";

export default function AuthForm() {
  // State hook to toggle between Sign In mode (false) and Sign Up mode (true)
  const [isSignUp, setIsSignUp] = useState(false);

  // Controlled form input state variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // UI feedback state variables for error messages, success alerts, and submission loading states
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Destructure signIn and signUp methods from the global AuthContext
  const { signIn, signUp } = useAuth();

  // Helper function to reset form input fields after successful account creation
  const resetFormFields = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
  };

  // Handler function executed when the user submits the authentication form
  const handleSubmit = async (e) => {
    // Prevent default browser form submission refresh behavior
    e.preventDefault();
    // Clear previous alert messages
    setErrorMsg(null);
    setSuccessMsg(null);
    // Set loading indicator to true to disable buttons and show pending status
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        // Execute sign up flow passing email, password, and optional displayName metadata
        await signUp({ email, password, displayName });
        // Clear inputs after successful registration
        resetFormFields();
        // Switch view back to Sign In mode automatically
        setIsSignUp(false);
        setSuccessMsg("Account created! You can now log in.");
      } else {
        // Execute sign in flow using email and password credentials
        await signIn({ email, password });
      }
    } catch (err) {
      // Catch and display any errors returned by Supabase Auth (e.g., invalid credentials)
      setErrorMsg(err.message || "An error occurred during authentication.");
    } finally {
      // Always reset submission loading state regardless of success or failure
      setIsSubmitting(false);
    }
  };

  return (
    // Main container card styled with the custom medieval color palette (#5f3426, #a59075) and Modern Antiqua font
    <div className="bg-[#5f3426] p-8 rounded-xl shadow-2xl border-2 border-[#a59075] text-[#a59075] font-antiqua">
      {/* Header section with MedievalSharp title styling */}
      <div className="text-center">
        <h2 className="text-2xl font-medieval text-[#938f71]">
          The Adventurer's Codex
        </h2>
        <p className="mt-1 text-xs text-[#889c9b] uppercase tracking-wider font-antiqua">
          {isSignUp
            ? "Create your hero account"
            : "Log in to access your codex"}
        </p>
      </div>

      {/* Success Alert Box (conditionally rendered if successMsg exists) */}
      {successMsg && (
        <div className="mt-4 bg-[#889c9b]/20 border border-[#889c9b] text-[#889c9b] text-xs p-3 rounded text-center">
          {successMsg}
        </div>
      )}

      {/* Error Alert Box (conditionally rendered if errorMsg exists) */}
      {errorMsg && (
        <div className="mt-4 bg-red-950/60 border border-red-500 text-red-200 text-xs p-3 rounded text-center">
          {errorMsg}
        </div>
      )}

      {/* Main Form container bound to handleSubmit */}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {/* Conditional Display Name Field (rendered only when in Sign Up mode) */}
        {isSignUp && (
          <div>
            <label className="block text-xs font-semibold text-[#a59075] uppercase">
              Display Name
            </label>
            <input
              type="text"
              required={isSignUp}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-[#937460]/30 border border-[#a59075]/60 rounded text-[#938f71] focus:outline-none focus:border-[#889c9b] text-sm"
              placeholder="e.g. Eladrin Ranger"
            />
          </div>
        )}

        {/* Email Address Input Field */}
        <div>
          <label className="block text-xs font-semibold text-[#a59075] uppercase">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-[#937460]/30 border border-[#a59075]/60 rounded text-[#938f71] focus:outline-none focus:border-[#889c9b] text-sm"
            placeholder="adventurer@realm.com"
          />
        </div>

        {/* Password Input Field */}
        <div>
          <label className="block text-xs font-semibold text-[#a59075] uppercase">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-[#937460]/30 border border-[#a59075]/60 rounded text-[#938f71] focus:outline-none focus:border-[#889c9b] text-sm"
            placeholder="••••••••"
          />
        </div>

        {/* Form Submit Button (dynamically updates text based on submission and sign-up state) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded text-sm font-bold text-[#5f3426] bg-[#889c9b] hover:bg-[#938f71] border border-[#a59075] transition shadow-md disabled:opacity-50 mt-2"
        >
          {isSubmitting
            ? "Processing..."
            : isSignUp
              ? "Create Account"
              : "Sign In"}
        </button>
      </form>

      {/* Mode Toggle Button: Switches between Sign In and Sign Up view */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className="text-xs text-[#938f71] hover:underline focus:outline-none"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
