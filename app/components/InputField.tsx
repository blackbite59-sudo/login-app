"use client";

import { useState, type InputHTMLAttributes } from "react";
import { motion } from "framer-motion";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function InputField({
  label,
  error,
  id,
  type,
  ...props
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.0, 0.0, 0.58, 1.0] as const }}
    >
      <div
        className={`
          relative h-14 rounded-2xl transition-all duration-200
          ${focused ? "ring-2 ring-[#8AB4F8]" : error ? "ring-2 ring-red-400" : "ring-1 ring-[rgba(255,255,255,.15)]"}
        `}
        style={{ background: "#17171C" }}
      >
        <input
          id={inputId}
          type={type || "text"}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            setHasValue(e.target.value.length > 0);
          }}
          onInput={(e) =>
            setHasValue((e.target as HTMLInputElement).value.length > 0)
          }
          className="peer w-full h-full bg-transparent px-5 pt-5 pb-1 text-[#E8EAED] text-sm outline-none placeholder-transparent"
          placeholder={label}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={`
            absolute left-5 transition-all duration-200 pointer-events-none
            ${focused || hasValue ? "top-1.5 text-[10px]" : "top-1/2 -translate-y-1/2 text-sm"}
            ${focused ? "text-[#8AB4F8]" : error ? "text-red-400" : "text-[#BDC1C6]"}
          `}
        >
          {label}
        </label>
      </div>
      {error && (
        <motion.p
          id={`${inputId}-error`}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs mt-1.5 px-1"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
