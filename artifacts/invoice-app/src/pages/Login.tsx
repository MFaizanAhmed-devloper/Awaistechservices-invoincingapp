import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { changePassword, registerBiometric, verifyBiometric, hasBiometricRegistered } from "@/lib/storage";
import { toast } from "sonner";
import { Eye, EyeOff, ScanFace, KeyRound, ShieldCheck, X } from "lucide-react";

const TEAL = "#4BBFC0";
const ORANGE = "#F5A624";
const DARK = "#1A2B4B";
const NEU_BG = "#dde3ea";

// ── Biometric icon SVG ──────────────────────────────────────────────────────
function FaceIcon({ size = 48, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* face outline arcs */}
      <path d="M8 22 Q8 8 22 8" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M42 8 Q56 8 56 22" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M56 42 Q56 56 42 56" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M22 56 Q8 56 8 42" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      {/* eyes */}
      <circle cx="23" cy="26" r="2.5" fill={color}/>
      <circle cx="41" cy="26" r="2.5" fill={color}/>
      {/* nose */}
      <path d="M32 28 L29.5 36 Q32 38 34.5 36 L32 28" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* smile */}
      <path d="M24 43 Q32 50 40 43" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Forgot password flow: "idle" | "scanning" | "register" | "newPw" | "done"
  const [fpStep, setFpStep] = useState<"idle" | "scanning" | "register" | "newPw" | "done">("idle");
  const [fpLoading, setFpLoading] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 600); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    const ok = await login(password, remember);
    setLoading(false);
    if (!ok) { triggerShake(); toast.error("Incorrect password"); }
  };

  // ── Forgot password: start ──────────────────────────────────────────────
  const handleForgotPassword = async () => {
    const hasReg = hasBiometricRegistered();
    if (hasReg) {
      // Directly verify
      setFpStep("scanning");
      setFpLoading(true);
      try {
        const ok = await verifyBiometric();
        if (ok) {
          setFpStep("newPw");
        } else {
          toast.error("Biometric verification failed");
          setFpStep("idle");
        }
      } catch {
        toast.error("Biometric not available on this device");
        setFpStep("idle");
      } finally {
        setFpLoading(false);
      }
    } else {
      // No biometric registered yet — register first
      setFpStep("register");
    }
  };

  // ── Register biometric then proceed to reset ────────────────────────────
  const handleRegisterBiometric = async () => {
    setFpLoading(true);
    try {
      await registerBiometric();
      toast.success("Biometric registered! Verifying now…");
      setFpStep("scanning");
      const ok = await verifyBiometric();
      if (ok) {
        setFpStep("newPw");
      } else {
        toast.error("Verification failed after registration");
        setFpStep("idle");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("not supported") || msg.includes("NotSupportedError")) {
        toast.error("Biometric auth is not supported on this browser");
      } else if (msg.includes("NotAllowedError") || msg.includes("cancelled")) {
        toast.error("Biometric cancelled — try again");
      } else {
        toast.error("Biometric setup failed");
      }
      setFpStep("idle");
    } finally {
      setFpLoading(false);
    }
  };

  // ── Save new password ───────────────────────────────────────────────────
  const handleSaveNewPassword = async () => {
    if (newPw.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPw !== newPwConfirm) { toast.error("Passwords don't match"); return; }
    await changePassword(newPw);
    setFpStep("done");
    setNewPw(""); setNewPwConfirm("");
    toast.success("Password reset successfully!");
  };

  const closeForgot = () => { setFpStep("idle"); setNewPw(""); setNewPwConfirm(""); setFpLoading(false); };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        @keyframes pulse-ring { 0%{transform:scale(0.9);opacity:0.8} 50%{transform:scale(1.08);opacity:0.3} 100%{transform:scale(0.9);opacity:0.8} }
        @keyframes fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .neu-input:focus { outline: none; }
        .neu-btn:active { box-shadow: inset 4px 4px 10px #b8c0cc, inset -4px -4px 10px #ffffff; }
        .fp-overlay { animation: fade-in 0.25s ease; }
        .scan-ring { animation: pulse-ring 1.6s ease-in-out infinite; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={styles.navbar}>
        <div style={styles.navInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={styles.navLogo}>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>A</span>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#fff", letterSpacing: "0.04em" }}>
                AWAIS TECH SERVICES
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.65)", letterSpacing: "0.05em" }}>
                INVOICING SYSTEM
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={styles.navBadge}>Secure</div>
            <ShieldCheck size={14} color="rgba(255,255,255,0.7)" />
          </div>
        </div>
      </nav>

      {/* ── SIGN IN CARD ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div style={{ ...styles.card, animation: shake ? "shake 0.5s ease" : undefined }}>
          <h1 style={styles.title}>Sign in</h1>

          <div style={styles.subRow}>
            <span style={styles.subText}>Welcome back</span>
            <button style={styles.forgotBtn} type="button" onClick={handleForgotPassword}>
              Forgot Password?
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Username */}
            <div style={styles.inputWrap}>
              <div style={styles.iconCircle}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <input className="neu-input" style={styles.input} type="text" placeholder="Username"
                value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
            </div>

            {/* Password */}
            <div style={styles.inputWrap}>
              <div style={styles.iconCircle}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="15" r="4"/><path d="M12 15h8"/><path d="M18 11v8"/><path d="M21 13v2"/>
                </svg>
              </div>
              <input className="neu-input" style={styles.input} type={showPw ? "text" : "password"}
                placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPw(v => !v)} style={styles.eyeBtn} tabIndex={-1}>
                {showPw ? <EyeOff size={15} color="#aaa" /> : <Eye size={15} color="#aaa" />}
              </button>
            </div>

            {/* Remember me */}
            <div style={styles.rememberRow}>
              <div style={{ ...styles.checkbox, ...(remember ? styles.checkboxChecked : {}) }}
                onClick={() => setRemember(v => !v)}>
                {remember && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 13, color: "#666", cursor: "pointer", userSelect: "none" }}
                onClick={() => setRemember(v => !v)}>Remember me</span>
            </div>

            {/* Sign in button */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
              <button type="submit" disabled={loading} className="neu-btn" style={styles.signInBtn}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={styles.footer}>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
          © 2026 Awais Tech Services Pty Ltd
          <span style={{ margin: "0 8px", opacity: 0.4 }}>|</span>
          Made with <span style={{ color: ORANGE }}>♥</span> by <strong style={{ color: "rgba(255,255,255,0.8)" }}>Faizan</strong>
        </p>
      </footer>

      {/* ══ FORGOT PASSWORD OVERLAY ══ */}
      {fpStep !== "idle" && (
        <div style={styles.overlay} className="fp-overlay">
          <div style={styles.modal}>
            {/* Close */}
            <button onClick={closeForgot} style={styles.closeBtn}><X size={18} color="#888" /></button>

            {/* ─ Register biometric ─ */}
            {fpStep === "register" && (
              <div style={styles.modalContent}>
                <FaceIcon size={64} color={TEAL} />
                <h2 style={styles.modalTitle}>Set Up Face Recognition</h2>
                <p style={styles.modalDesc}>
                  No biometric is registered yet. Tap below to set up face or fingerprint recognition on this device — you'll use it to recover your password.
                </p>
                <button onClick={handleRegisterBiometric} disabled={fpLoading} style={styles.biometricBtn}>
                  <ScanFace size={20} color="#fff" />
                  {fpLoading ? "Setting up…" : "Set Up Biometric"}
                </button>
              </div>
            )}

            {/* ─ Scanning ─ */}
            {fpStep === "scanning" && (
              <div style={styles.modalContent}>
                <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div className="scan-ring" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${TEAL}`, opacity: 0.5 }} />
                  <FaceIcon size={52} color={TEAL} />
                </div>
                <h2 style={styles.modalTitle}>Verifying…</h2>
                <p style={styles.modalDesc}>Look at your camera or place your finger on the sensor.</p>
              </div>
            )}

            {/* ─ New password ─ */}
            {fpStep === "newPw" && (
              <div style={styles.modalContent}>
                <div style={{ background: `${TEAL}18`, borderRadius: "50%", padding: 14 }}>
                  <KeyRound size={32} color={TEAL} />
                </div>
                <h2 style={styles.modalTitle}>Reset Password</h2>
                <p style={styles.modalDesc}>Biometric verified ✓ — set your new password below.</p>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={styles.inputWrap}>
                    <input className="neu-input" style={styles.input}
                      type={showNewPw ? "text" : "password"} placeholder="New password (min 6 chars)"
                      value={newPw} onChange={e => setNewPw(e.target.value)} />
                    <button type="button" onClick={() => setShowNewPw(v => !v)} style={styles.eyeBtn} tabIndex={-1}>
                      {showNewPw ? <EyeOff size={14} color="#aaa" /> : <Eye size={14} color="#aaa" />}
                    </button>
                  </div>
                  <div style={styles.inputWrap}>
                    <input className="neu-input" style={styles.input}
                      type={showNewPw ? "text" : "password"} placeholder="Confirm new password"
                      value={newPwConfirm} onChange={e => setNewPwConfirm(e.target.value)} />
                  </div>
                </div>
                <button onClick={handleSaveNewPassword} style={styles.biometricBtn}>
                  <ShieldCheck size={18} color="#fff" />
                  Save New Password
                </button>
              </div>
            )}

            {/* ─ Done ─ */}
            {fpStep === "done" && (
              <div style={styles.modalContent}>
                <div style={{ background: "#22c55e18", borderRadius: "50%", padding: 14 }}>
                  <ShieldCheck size={40} color="#22c55e" />
                </div>
                <h2 style={{ ...styles.modalTitle, color: "#22c55e" }}>Password Reset!</h2>
                <p style={styles.modalDesc}>Your password has been changed. You can now sign in with your new password.</p>
                <button onClick={closeForgot} style={{ ...styles.biometricBtn, background: "#22c55e" }}>
                  Go to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh",
    background: `radial-gradient(ellipse at 30% 40%, #e8edf3 0%, ${NEU_BG} 60%, #cdd3da 100%)`,
    display: "flex",
    flexDirection: "column",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  // ── Navbar ──
  navbar: {
    background: `linear-gradient(135deg, ${DARK} 0%, #253660 100%)`,
    padding: "0 20px",
    height: 56,
    flexShrink: 0,
    boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
  },
  navInner: {
    maxWidth: 480,
    margin: "0 auto",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navLogo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: `linear-gradient(135deg, ${TEAL}, #3aa8a9)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 3px 10px ${TEAL}55`,
  },
  navBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: "rgba(255,255,255,0.7)",
    background: "rgba(255,255,255,0.1)",
    padding: "2px 8px",
    borderRadius: 20,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },

  // ── Card ──
  card: {
    background: NEU_BG,
    borderRadius: 28,
    padding: "38px 40px 42px",
    width: "100%",
    maxWidth: 380,
    boxShadow: "10px 10px 24px #b2bac4, -10px -10px 24px #ffffff",
  },
  title: {
    fontSize: 30,
    fontWeight: 700,
    color: DARK,
    margin: "0 0 6px",
    letterSpacing: "-0.5px",
  },
  subRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },
  subText: { fontSize: 13, color: "#888" },
  forgotBtn: {
    fontSize: 13,
    color: TEAL,
    fontWeight: 600,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
    textDecorationColor: `${TEAL}55`,
  },

  // ── Inputs ──
  inputWrap: {
    background: NEU_BG,
    borderRadius: 50,
    boxShadow: "inset 5px 5px 12px #b8c0cb, inset -5px -5px 12px #ffffff",
    display: "flex",
    alignItems: "center",
    padding: "0 14px 0 8px",
    height: 52,
  },
  iconCircle: {
    width: 34, height: 34, borderRadius: "50%",
    background: NEU_BG,
    boxShadow: "3px 3px 8px #b8c0cb, -3px -3px 8px #ffffff",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginRight: 10, flexShrink: 0,
  },
  input: {
    flex: 1, border: "none", background: "transparent",
    fontSize: 14, color: "#333", outline: "none", minWidth: 0,
  },
  eyeBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: "4px", display: "flex", alignItems: "center", flexShrink: 0,
  },

  // ── Remember ──
  rememberRow: { display: "flex", alignItems: "center", gap: 10, paddingLeft: 4 },
  checkbox: {
    width: 16, height: 16, border: "1.5px solid #bbb", borderRadius: 3,
    background: NEU_BG, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    boxShadow: "inset 2px 2px 5px #b8c0cb, inset -2px -2px 5px #ffffff",
  },
  checkboxChecked: { background: TEAL, borderColor: TEAL, boxShadow: "none" },

  // ── Sign in button ──
  signInBtn: {
    background: NEU_BG, border: "none", borderRadius: 50,
    padding: "14px 60px", fontSize: 16, fontWeight: 600,
    color: DARK, cursor: "pointer",
    boxShadow: "6px 6px 14px #b2bac4, -6px -6px 14px #ffffff",
    transition: "box-shadow 0.15s",
  },

  // ── Footer ──
  footer: {
    background: `linear-gradient(135deg, ${DARK} 0%, #253660 100%)`,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // ── Overlay / Modal ──
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(20,30,50,0.55)",
    backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: NEU_BG,
    borderRadius: 28,
    padding: "32px 28px 36px",
    width: "100%",
    maxWidth: 360,
    boxShadow: "12px 12px 28px #b2bac4, -12px -12px 28px #ffffff",
    position: "relative",
  },
  closeBtn: {
    position: "absolute", top: 16, right: 16,
    background: "none", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, borderRadius: "50%",
  },
  modalContent: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 14, textAlign: "center",
  },
  modalTitle: {
    fontSize: 20, fontWeight: 700, color: DARK, margin: 0,
  },
  modalDesc: {
    fontSize: 13, color: "#666", margin: 0, lineHeight: 1.6,
    maxWidth: 260,
  },
  biometricBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    background: `linear-gradient(135deg, ${TEAL}, #3aacad)`,
    border: "none", borderRadius: 50,
    padding: "13px 32px", fontSize: 15, fontWeight: 600, color: "#fff",
    cursor: "pointer", marginTop: 8, width: "100%",
    boxShadow: `0 6px 20px ${TEAL}44`,
  },
};
