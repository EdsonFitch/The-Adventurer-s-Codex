import React from "react";
// 1. Import global AuthProvider and useAuth custom hook from context
import { AuthProvider, useAuth } from "./context/AuthContext";
// 2. Import the LandingPage component for unauthenticated visitors
import LandingPage from "./components/common/LandingPage";
// 3. Import the fully assembled DashboardContentRouter for authenticated users
import DashboardContentRouter from "./components/dashboard/DashboardContentRouter";

/**
 * MainApp Component
 * -----------------------------------------------------------------------------
 * Renders the appropriate view based on authentication status:
 * - Unauthenticated users see LandingPage
 * - Authenticated users see DashboardContentRouter with full TopNavbar and LeftSidebar
 */
function MainApp() {
  const { user } = useAuth();

  // If no user session exists, display Landing Page
  if (!user) {
    return <LandingPage />;
  }

  // Authenticated State: Renders complete dashboard
  return <DashboardContentRouter />;
}

/**
 * Root Application Component
 * -----------------------------------------------------------------------------
 * Wraps main app inside global AuthProvider context.
 */
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
