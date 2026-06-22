import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    const ok = await login(password, remember);
    setLoading(false);
    if (!ok) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      toast.error("Incorrect password");
    }
  };

  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.card,
          animation: shake ? "shake 0.5s ease" : undefined,
        }}
      >
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
          .neu-input:focus { outline: none; }
          .neu-btn:active { box-shadow: inset 4px 4px 10px #b8c0cc, inset -4px -4px 10px #ffffff; }
        `}</style>

        <h1 style={styles.title}>Sign in</h1>

        <div style={styles.subRow}>
          <span style={styles.subLink}>Welcome back</span>
          <span style={styles.subLink}>Forgot Password?</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Username */}
          <div style={styles.inputWrap}>
            <div style={styles.iconCircle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <input
              className="neu-input"
              style={styles.input}
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div style={styles.inputWrap}>
            <div style={styles.iconCircle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="15" r="4" />
                <path d="M12 15h8" />
                <path d="M18 11v8" />
                <path d="M21 13v2" />
              </svg>
            </div>
            <input
              className="neu-input"
              style={styles.input}
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={styles.eyeBtn}
              tabIndex={-1}
            >
              {showPw
                ? <EyeOff size={16} color="#aaa" />
                : <Eye size={16} color="#aaa" />}
            </button>
          </div>

          {/* Remember me */}
          <label style={styles.rememberRow}>
            <div
              style={{
                ...styles.checkbox,
                ...(remember ? styles.checkboxChecked : {}),
              }}
              onClick={() => setRemember(v => !v)}
            >
              {remember && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 14, color: "#666", cursor: "pointer", userSelect: "none" }}
              onClick={() => setRemember(v => !v)}>
              Remember me
            </span>
          </label>

          {/* Sign in button */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <button
              type="submit"
              disabled={loading}
              className="neu-btn"
              style={styles.signInBtn}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const NEU_BG = "#dde3ea";

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: `radial-gradient(ellipse at 30% 40%, #e8edf3 0%, ${NEU_BG} 60%, #cdd3da 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    background: NEU_BG,
    borderRadius: 28,
    padding: "42px 44px 44px",
    width: 380,
    boxShadow: "10px 10px 24px #b2bac4, -10px -10px 24px #ffffff",
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: "#1a1a2e",
    margin: "0 0 6px",
    letterSpacing: "-0.5px",
  },
  subRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  subLink: {
    fontSize: 13,
    color: "#888",
    cursor: "default",
  },
  inputWrap: {
    background: NEU_BG,
    borderRadius: 50,
    boxShadow: "inset 5px 5px 12px #b8c0cb, inset -5px -5px 12px #ffffff",
    display: "flex",
    alignItems: "center",
    padding: "0 16px 0 8px",
    height: 52,
    position: "relative",
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: NEU_BG,
    boxShadow: "3px 3px 8px #b8c0cb, -3px -3px 8px #ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    fontSize: 14,
    color: "#333",
    outline: "none",
    minWidth: 0,
  },
  eyeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  rememberRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    paddingLeft: 4,
  },
  checkbox: {
    width: 16,
    height: 16,
    border: "1.5px solid #bbb",
    borderRadius: 3,
    background: NEU_BG,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "inset 2px 2px 5px #b8c0cb, inset -2px -2px 5px #ffffff",
    transition: "background 0.2s",
  },
  checkboxChecked: {
    background: "#4a90d9",
    borderColor: "#4a90d9",
    boxShadow: "none",
  },
  signInBtn: {
    background: NEU_BG,
    border: "none",
    borderRadius: 50,
    padding: "14px 60px",
    fontSize: 16,
    fontWeight: 600,
    color: "#1a1a2e",
    cursor: "pointer",
    boxShadow: "6px 6px 14px #b2bac4, -6px -6px 14px #ffffff",
    transition: "box-shadow 0.15s",
    letterSpacing: "0.2px",
  },
};
