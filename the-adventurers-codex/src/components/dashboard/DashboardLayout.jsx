/**
 * -----------------------------------------------------------------------------
 * COMPONENT: DashboardLayout.jsx
 * -----------------------------------------------------------------------------
 * Description:
 * Structural layout shell for authenticated views in The Adventurer's Codex.
 * Enforces the global dark-leather theme (`#5f3426`), warm-sand typography
 * (`#a59075`), Modern Antiqua font family (`font-antiqua`), and full-viewport
 * flex column containment.
 *
 * Responsive & Mobile Viewport Behavior:
 * - Uses `min-h-[100dvh]` (dynamic viewport height) instead of static `100vh`
 *   so mobile browsers (Safari iOS / Chrome Android) do not clip bottom
 *   content or jump vertically when the URL bar collapses/expands.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Nested navbar, sidebar, and routed
 *                                           workspace content.
 * -----------------------------------------------------------------------------
 */

import React from "react";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-[100dvh] bg-[#5f3426] text-[#a59075] font-antiqua flex flex-col selection:bg-[#889c9b] selection:text-[#5f3426]">
      {/* Flexible inner shell expanding to fill remaining dynamic viewport height */}
      <div className="flex flex-col flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
