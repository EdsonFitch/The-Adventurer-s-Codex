import React from "react";

/**
 * DashboardLayout Component
 * -----------------------------------------------------------------------------
 * Structural wrapper component that provides a standardized layout shell for
 * authenticated application views. It sets up top-level styling, typography,
 * selection highlights, and structural layout constraints.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Dynamic content or router components
 *                                           to be rendered inside the layout shell.
 */
export default function DashboardLayout({ children }) {
  return (
    // Outer frame:
    // - min-h-screen: Ensures full-height coverage across all viewports
    // - bg-[#5f3426]: Applies our dark leather/earth background palette
    // - text-[#a59075]: Sets warm sand as default text color
    // - font-antiqua: Enforces Modern Antiqua font family globally across dashboard views
    // - selection: Custom text selection styling matching app color theme (#889c9b)
    <div className="min-h-screen bg-[#5f3426] text-[#a59075] font-antiqua flex flex-col selection:bg-[#889c9b] selection:text-[#5f3426]">
      {/* 
        Main content container receiving nested components (e.g., TopNavbar, 
        LeftSidebar, MainContentArea, or router wrappers). 
        Flex-1 ensures it expands to fill remaining vertical screen height.
      */}
      <div className="flex flex-col flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
