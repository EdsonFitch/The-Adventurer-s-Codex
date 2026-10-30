import React from "react";
// 1. Import global AuthProvider and useAuth custom hook from context
import { AuthProvider, useAuth } from "./context/AuthContext";
// 2. Import the LandingPage component for unauthenticated visitors
import LandingPage from "./components/common/LandingPage";
// 3. Import the fully modular DashboardContentRouter for authenticated users
import DashboardContentRouter from "./components/dashboard/DashboardContentRouter";

// Main Application View component rendered based on user auth status
function MainApp() {
  // Destructure user session from global context
  const { user } = useAuth();

  // 4. Conditional Rendering: If no user session exists, display the Landing Page
  if (!user) {
    return <LandingPage />;
  }

  // 5. Authenticated State View: Renders the complete dark medieval dashboard router
  return <DashboardContentRouter />;
}

// Root Application Component wrapped inside AuthProvider context wrapper
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
