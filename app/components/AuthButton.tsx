"use client";

import { motion } from "framer-motion";
import type { ButtonHTMLAttributes } from "react";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "text";
  children: React.ReactNode;
}

export default function AuthButton({
  variant = "primary",
  children,
  disabled,
  className = "",
  ...props
}: AuthButtonProps) {
  if (variant === "text") {
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="inline-block"
      >
        <button
          className={`
            bg-transparent border-none text-[#8AB4F8] text-sm font-medium
            cursor-pointer transition-all duration-200
            hover:underline
            disabled:opacity-40 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AB4F8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] rounded
            ${className}
          `}
          disabled={disabled}
          {...props}
        >
          {children}
        </button>
      </motion.span>
    );
  }

  return (
    <motion.div
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.0, 0.0, 0.58, 1.0] as const }}
      className="inline-block"
    >
      <button
        className={`
          h-12 px-8 rounded-full border-none text-sm font-semibold
          transition-all duration-200 cursor-pointer inline-flex items-center justify-center
          bg-[#8AB4F8] text-[#202124]
          hover:brightness-105
          active:brightness-95
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AB4F8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10]
          ${className}
        `}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    </motion.div>
  );
}
