import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // deferredPrompt is for Android/Chrome — iOS uses different mechanism
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem("pwa_banner_dismissed")) return;

    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Detect iOS
    const ua = navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(iosDevice);

    if (iosDevice) {
      // Show iOS instructions after 3 seconds
      const t = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(t);
    }

    // Android / Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem("pwa_banner_dismissed", "1");
    setDismissed(true);
    setShowBanner(false);
  };

  const installAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
  };

  if (!showBanner || dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "linear-gradient(135deg, #0d1b2a 0%, #1a3a5c 100%)",
        color: "white",
        padding: "16px 20px",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
        borderTop: "2px solid #14b8a6",
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        animation: "slideUp 0.4s ease",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Icon */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "#14b8a6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 24,
          fontWeight: 800,
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        A
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
          Install ATS Invoicing
        </p>
        {isIOS ? (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
            Tap <Share size={12} style={{ display: "inline", verticalAlign: "middle" }} /> <strong style={{ color: "#14b8a6" }}>Share</strong> at the bottom of Safari, then tap{" "}
            <strong style={{ color: "#14b8a6" }}>"Add to Home Screen"</strong> — works offline, free!
          </p>
        ) : (
          <>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
              Install this app on your device — works offline, no App Store needed.
            </p>
            <button
              onClick={installAndroid}
              style={{
                marginTop: 10,
                background: "#14b8a6",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "7px 18px",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Download size={14} />
              Install App
            </button>
          </>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          background: "none",
          border: "none",
          color: "#64748b",
          cursor: "pointer",
          padding: 4,
          flexShrink: 0,
          borderRadius: 6,
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
