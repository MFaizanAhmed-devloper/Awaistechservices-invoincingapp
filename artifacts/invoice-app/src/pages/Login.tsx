import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Shield, ArrowRight, RefreshCw } from "lucide-react";

type Mode = "login" | "signup" | "forgot";

const TEAL = "#14b8a6";
const NAVY = "#0d1b2a";

export default function Login() {
  const { login, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email"); return; }

    if (mode === "forgot") {
      setLoading(true);
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) { toast.error(error); return; }
      setForgotSent(true);
      return;
    }

    if (!password) { toast.error("Please enter your password"); return; }

    if (mode === "signup") {
      if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
      if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
      setLoading(true);
      const { error } = await signUp(email, password);
      setLoading(false);
      if (error) { toast.error(error); return; }
      toast.success("Account created! Check your email to confirm, then sign in.");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
      return;
    }

    // Login
    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);
    if (error) {
      toast.error(error === "Invalid login credentials"
        ? "Incorrect email or password"
        : error);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(135deg, #e8f0fe 0%, #f0fdf9 50%, #e8f0fe 100%)",
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Navbar */}
      <header style={{
        background: NAVY,
        padding: "0 24px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="Awais Tech Services" style={{ height: 36, width: 36, objectFit: "contain", borderRadius: 8 }} />
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
              AWAIS TECH SERVICES
            </div>
            <div style={{ color: "#94a3b8", fontSize: 10, letterSpacing: 1.5 }}>
              INVOICING SYSTEM
            </div>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(20,184,166,0.15)", borderRadius: 20,
          padding: "4px 12px",
        }}>
          <Shield size={13} color={TEAL} />
          <span style={{ color: TEAL, fontSize: 12, fontWeight: 600 }}>Secure</span>
        </div>
      </header>

      {/* Main */}
      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          borderRadius: 24,
          boxShadow: "0 20px 60px rgba(13,27,42,0.12)",
          overflow: "hidden",
        }}>
          {/* Card header stripe */}
          <div style={{
            height: 6,
            background: `linear-gradient(90deg, ${NAVY} 0%, ${TEAL} 100%)`,
          }} />

          <div style={{ padding: "36px 36px 40px" }}>
            {/* Logo */}
            <img src="/logo.png" alt="Awais Tech Services"
              style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 14, marginBottom: 24, background: NAVY, padding: 6 }} />

            {/* Title */}
            {mode === "login" && (
              <>
                <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: NAVY }}>
                  Welcome back
                </h1>
                <p style={{ margin: "0 0 28px", fontSize: 14, color: "#64748b" }}>
                  Sign in to your invoicing account
                </p>
              </>
            )}
            {mode === "signup" && (
              <>
                <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: NAVY }}>
                  Create account
                </h1>
                <p style={{ margin: "0 0 28px", fontSize: 14, color: "#64748b" }}>
                  Start managing your invoices in the cloud
                </p>
              </>
            )}
            {mode === "forgot" && (
              <>
                <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: NAVY }}>
                  Reset password
                </h1>
                <p style={{ margin: "0 0 28px", fontSize: 14, color: "#64748b" }}>
                  We'll send a reset link to your email
                </p>
              </>
            )}

            {/* Forgot sent confirmation */}
            {forgotSent ? (
              <div style={{
                background: "#f0fdf9", borderRadius: 14,
                border: `1.5px solid ${TEAL}`, padding: 20,
                textAlign: "center",
              }}>
                <RefreshCw size={32} color={TEAL} style={{ marginBottom: 12 }} />
                <p style={{ margin: "0 0 8px", fontWeight: 700, color: NAVY }}>
                  Check your inbox
                </p>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
                  A password reset link has been sent to <strong>{email}</strong>
                </p>
                <button onClick={() => { setMode("login"); setForgotSent(false); }}
                  style={{ ...styles.link, display: "inline-block" }}>
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Email */}
                <label style={styles.label}>Email address</label>
                <div style={styles.inputWrap}>
                  <Mail size={16} color="#94a3b8" style={styles.inputIcon} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    style={styles.input}
                  />
                </div>

                {/* Password (not shown for forgot) */}
                {mode !== "forgot" && (
                  <>
                    <label style={styles.label}>Password</label>
                    <div style={styles.inputWrap}>
                      <Lock size={16} color="#94a3b8" style={styles.inputIcon} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        style={styles.input}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        style={styles.eyeBtn}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                      </button>
                    </div>
                  </>
                )}

                {/* Confirm password (signup only) */}
                {mode === "signup" && (
                  <>
                    <label style={styles.label}>Confirm password</label>
                    <div style={styles.inputWrap}>
                      <Lock size={16} color="#94a3b8" style={styles.inputIcon} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        style={styles.input}
                      />
                    </div>
                  </>
                )}

                {/* Forgot password link */}
                {mode === "login" && (
                  <div style={{ textAlign: "right", marginBottom: 20, marginTop: -8 }}>
                    <button type="button" onClick={() => setMode("forgot")} style={styles.link}>
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.submitBtn,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      <span style={styles.spinner} /> {mode === "forgot" ? "Sending…" : mode === "signup" ? "Creating…" : "Signing in…"}
                    </span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      {mode === "forgot" ? "Send reset link" : mode === "signup" ? "Create account" : "Sign in"}
                      <ArrowRight size={16} />
                    </span>
                  )}
                </button>

                {/* Mode switches */}
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  {mode === "login" ? (
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                      Don't have an account?{" "}
                      <button type="button" onClick={() => setMode("signup")} style={styles.link}>
                        Create one
                      </button>
                    </p>
                  ) : (
                    <button type="button" onClick={() => setMode("login")} style={{ ...styles.link, fontSize: 13 }}>
                      ← Back to sign in
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: NAVY,
        padding: "14px 24px",
        textAlign: "center",
        flexShrink: 0,
      }}>
        <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>
          © 2026 Awais Tech Services Pty Ltd &nbsp;|&nbsp; Made with{" "}
          <span style={{ color: "#ef4444" }}>♥</span> by{" "}
          <span style={{ color: "white", fontWeight: 600 }}>Faizan</span>
        </p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  },
  inputWrap: {
    position: "relative",
    marginBottom: 16,
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    height: 46,
    paddingLeft: 40,
    paddingRight: 40,
    border: "1.5px solid #e2e8f0",
    borderRadius: 12,
    fontSize: 14,
    color: "#1e293b",
    background: "#f8fafc",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },
  submitBtn: {
    width: "100%",
    height: 48,
    background: "linear-gradient(135deg, #0d1b2a 0%, #1e3a5f 100%)",
    color: "white",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
    transition: "opacity 0.2s, transform 0.1s",
    boxShadow: "0 4px 16px rgba(13,27,42,0.3)",
  },
  link: {
    background: "none",
    border: "none",
    color: "#14b8a6",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 13,
    padding: 0,
    textDecoration: "none",
  },
  spinner: {
    display: "inline-block",
    width: 14,
    height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
};
