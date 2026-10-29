import React from "react";
// Import the AuthForm component created previously
import AuthForm from "./AuthForm";

export default function AuthFormModal({ onClose }) {
  return (
    // Fixed screen overlay with backdrop blur to dim the landing page background
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md">
        {/* Close "X" button positioned in the top-right corner of the modal window */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-amber-400 text-xl font-bold z-10 focus:outline-none"
        >
          ✕
        </button>

        {/* Embeds the native authentication form inside the modal container */}
        <AuthForm />
      </div>
    </div>
  );
}
