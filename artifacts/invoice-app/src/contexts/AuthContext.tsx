import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { initAuth, hasSession, clearSession, verifyPassword, setSession } from "@/lib/storage";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (password: string, remember: boolean) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initAuth().then(() => {
      setIsAuthenticated(hasSession());
      setReady(true);
    });
  }, []);

  const login = async (password: string, remember: boolean): Promise<boolean> => {
    const ok = await verifyPassword(password);
    if (ok) {
      setSession(remember);
      setIsAuthenticated(true);
    }
    return ok;
  };

  const logout = () => {
    clearSession();
    setIsAuthenticated(false);
  };

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
