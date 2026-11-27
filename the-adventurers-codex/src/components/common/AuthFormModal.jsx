/**
 * -----------------------------------------------------------------------------
 * COMPONENT: AuthFormModal.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Modal dialog wrapper that renders the native `AuthForm` inside a centered,
 * backdrop-blurred overlay triggered from `LandingPage.jsx`.
 *
 * Responsive, Accessibility & Touch Behavior:
 * - Viewport & Keyboard Safety (`max-h-[90dvh] overflow-y-auto`): Uses dynamic
 *   viewport height (`dvh`) and internal vertical scrolling so tall sign-up
 *   forms remain completely reachable even when a mobile virtual keyboard opens
 *   or on short landscape phone screens.
 * - Touch-Friendly Close Button (`w-9 h-9`): Provides a dedicated 36x36px
 *   corner tap target with `aria-label="Close authentication modal"` so users
 *   can dismiss the modal cleanly on touchscreens.
 * - Keyboard & Backdrop Dismissal: Supports pressing `Escape` or tapping the
 *   darkened backdrop outside the dialog card to close.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onClose - Callback invoked when the modal closes.
 * -----------------------------------------------------------------------------
 */

import React, { useEffect } from "react";
import AuthForm from "./AuthForm";

export default function AuthFormModal({ onClose }) {
  // Allow users to close the modal with the Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    // Fixed screen overlay with backdrop blur; clicking the backdrop closes the modal
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Account Sign In or Registration"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      {/* Modal card container: stops click propagation so interacting with inputs doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-xl shadow-2xl"
      >
        {/* Touch-friendly 36x36px Close "X" button in the top-right corner */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-lg bg-[#361a12]/80 border border-[#a59075]/30 text-slate-300 hover:text-amber-400 hover:border-amber-500/50 text-base font-bold z-10 transition cursor-pointer focus:outline-none"
        >
          ✕
        </button>

        {/* Native email/password Sign In & Registration form */}
        <AuthForm />
      </div>
    </div>
  );
}
