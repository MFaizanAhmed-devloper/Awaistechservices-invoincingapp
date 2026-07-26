import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@/lib/supabase";

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  providerToken: string | null;   // Google OAuth access token (has Sheets scope)
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setProviderToken(session?.provider_token ?? null);
      setReady(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setProviderToken(session?.provider_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // If Supabase has email confirmation disabled the user is already in session
    if (data.session) return { error: null };
    // Otherwise try an immediate login (works when "Confirm email" is OFF in Supabase dashboard)
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    if (!loginErr) return { error: null };
    // Email confirmation is required — let the UI show the instruction
    return { error: "confirm_email" };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}`,
        // Request Sheets + Drive scopes so we can sync invoices to Google Sheets
        scopes: [
          "https://www.googleapis.com/auth/spreadsheets",
          "https://www.googleapis.com/auth/drive.file",
        ].join(" "),
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    return { error: error?.message ?? null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  };

  if (!ready) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f4f8",
      }}>
        <div style={{ textAlign: "center" }}>
          <img src="/logo.png" alt="Awais Tech Services"
            style={{ width: 48, height: 48, borderRadius: 12, objectFit: "contain",
              background: "white", padding: 4, margin: "0 auto 16px", display: "block" }} />
          <p style={{ color: "#64748b", fontSize: 14, fontFamily: "Inter, sans-serif" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user,
      user,
      session,
      providerToken,
      login,
      signUp,
      signInWithGoogle,
      logout,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
