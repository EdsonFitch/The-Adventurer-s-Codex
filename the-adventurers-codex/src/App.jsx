/**
 * -----------------------------------------------------------------------------
 * COMPONENT: App.jsx (Root Application Entry)
 * -----------------------------------------------------------------------------
 * Description:
 * Root entry component for The Adventurer's Codex.
 * - Wraps the application tree inside `AuthProvider` so Supabase session state
 *   is accessible globally via `useAuth()`.
 * - Routes unauthenticated visitors to `LandingPage` and authenticated users
 *   directly into `DashboardContentRouter`.
 * -----------------------------------------------------------------------------
 */

import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./components/common/LandingPage";
import DashboardContentRouter from "./components/dashboard/DashboardContentRouter";

/**
 * Switches between the public `LandingPage` and the authenticated
 * `DashboardContentRouter` based on active Supabase user session state.
 */
function MainApp() {
  const { user } = useAuth();

  // Unauthenticated visitor view
  if (!user) {
    return <LandingPage />;
  }

  // Authenticated player/DM workspace
  return <DashboardContentRouter />;
}

/**
 * Root application wrapper providing global authentication context.
 */
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
