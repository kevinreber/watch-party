import { type CSSProperties } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "signIn" | "signUp";
}

export function AuthModal({ isOpen, onClose, defaultMode = "signIn" }: AuthModalProps) {
  const [mode, setMode] = useState<"signIn" | "signUp">(defaultMode);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose} data-testid="auth-modal">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeButton}>
          ✕
        </button>

        <div style={styles.clerkContainer}>
          {mode === "signIn" ? (
            <SignIn
              appearance={{
                elements: {
                  rootBox: { width: "100%" },
                  card: {
                    background: "transparent",
                    boxShadow: "none",
                    border: "none",
                  },
                  headerTitle: { color: "#ffffff" },
                  headerSubtitle: { color: "#a3a3a3" },
                  socialButtonsBlockButton: {
                    background: "#262626",
                    border: "1px solid #404040",
                    color: "#ffffff",
                  },
                  socialButtonsBlockButtonText: { color: "#ffffff" },
                  dividerLine: { background: "#404040" },
                  dividerText: { color: "#737373" },
                  formFieldLabel: { color: "#a3a3a3" },
                  formFieldInput: {
                    background: "#262626",
                    border: "1px solid #404040",
                    color: "#ffffff",
                  },
                  formButtonPrimary: {
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  },
                  footerActionLink: { color: "#6366f1" },
                  identityPreviewEditButton: { color: "#6366f1" },
                },
              }}
              routing="hash"
              signUpUrl="#sign-up"
              afterSignInUrl="/"
            />
          ) : (
            <SignUp
              appearance={{
                elements: {
                  rootBox: { width: "100%" },
                  card: {
                    background: "transparent",
                    boxShadow: "none",
                    border: "none",
                  },
                  headerTitle: { color: "#ffffff" },
                  headerSubtitle: { color: "#a3a3a3" },
                  socialButtonsBlockButton: {
                    background: "#262626",
                    border: "1px solid #404040",
                    color: "#ffffff",
                  },
                  socialButtonsBlockButtonText: { color: "#ffffff" },
                  dividerLine: { background: "#404040" },
                  dividerText: { color: "#737373" },
                  formFieldLabel: { color: "#a3a3a3" },
                  formFieldInput: {
                    background: "#262626",
                    border: "1px solid #404040",
                    color: "#ffffff",
                  },
                  formButtonPrimary: {
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  },
                  footerActionLink: { color: "#6366f1" },
                },
              }}
              routing="hash"
              signInUrl="#sign-in"
              afterSignUpUrl="/"
            />
          )}
        </div>

        <div style={styles.switchMode}>
          <span style={styles.switchText}>
            {mode === "signIn" ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button
            onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
            style={styles.switchButton}
          >
            {mode === "signIn" ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    position: "relative",
    width: "100%",
    maxWidth: "420px",
    background: "#1a1a1a",
    borderRadius: "16px",
    padding: "1.5rem",
    border: "1px solid #333",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
  },
  closeButton: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    width: "32px",
    height: "32px",
    border: "none",
    background: "#262626",
    borderRadius: "8px",
    color: "#a3a3a3",
    cursor: "pointer",
    fontSize: "1rem",
    zIndex: 10,
  },
  clerkContainer: {
    display: "flex",
    justifyContent: "center",
    minHeight: "300px",
  },
  switchMode: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid #333",
  },
  switchText: {
    fontSize: "0.875rem",
    color: "#737373",
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#6366f1",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
};
