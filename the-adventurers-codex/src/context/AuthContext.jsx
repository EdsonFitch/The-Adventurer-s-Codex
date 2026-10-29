import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// 1. Create a React Context object to hold authentication state across the app.
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Local state variables for tracking active user, public profile data, and loading status.
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. Initial Session Check: Executed once when the component mounts.
    const getInitialSession = async () => {
      // Retrieve existing session token stored in browser storage (if any).
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Fetch public profile if an authenticated user session is active.
        await fetchProfile(currentUser.id);
      } else {
        setLoading(false);
      }
    };

    getInitialSession();

    // 3. Real-Time Auth Listener: Triggers on sign in, sign out, or token refresh.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
    );

    // Cleanup function to unsubscribe from the real-time listener on component unmount.
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 4. Profile Fetcher: Reads public profile details from the `public.profiles` database table.
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single(); // Expecting a single matching record for the user ID.

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error.message);
      }
      setProfile(data);
    } catch (err) {
      console.error("Profile fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Sign Up Action: Registers a new user with Supabase Auth and passes display name metadata.
  const signUp = async ({ email, password, displayName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName, // Read by our Postgres database trigger for profile creation
        },
      },
    });
    if (error) throw error;
    return data;
  };

  // 6. Sign In Action: Authenticates existing user with email/password credentials.
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // 7. Sign Out Action: Clears active session tokens from client memory and local storage.
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    // Provide user state and authentication methods to all nested child components.
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {/* Block rendering children until initial session check resolves to prevent UI flicker */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom React Hook to consume AuthContext cleanly in any component.
export const useAuth = () => {
  return useContext(AuthContext);
};
