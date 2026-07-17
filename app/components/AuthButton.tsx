"use client";

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
      <button
        className={`
          bg-transparent border-none text-[#7AA2FF] text-sm font-semibold
          cursor-pointer transition-all duration-200
          hover:underline
          disabled:opacity-40 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7AA2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] rounded
          ${className}
        `}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      className={`
        border-none text-sm font-semibold
        transition-all duration-200 cursor-pointer inline-flex items-center justify-center
        bg-[#4A90D9] text-white
        hover:brightness-110
        active:brightness-90
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7AA2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]
        ${className}
      `}
      style={{
        height: 44,
        minWidth: 96,
        borderRadius: 9999,
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
