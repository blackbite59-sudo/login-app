"use client";

import { useState, type InputHTMLAttributes } from "react";

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
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium mb-2"
        style={{ color: focused ? "#7AA2FF" : error ? "#F28B82" : "#BDC1C6" }}
      >
        {label}
      </label>
      <div
        className="relative transition-all duration-200"
        style={{
          height: 52,
          borderRadius: 12,
          background: "#17171C",
          border: focused
            ? "1.5px solid #7AA2FF"
            : error
            ? "1.5px solid #F28B82"
            : "1.5px solid rgba(255,255,255,.08)",
          boxShadow: focused ? "0 0 0 3px rgba(122,162,255,0.15)" : "none",
        }}
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
          className="w-full h-full bg-transparent px-4 text-[#E8EAED] text-sm outline-none placeholder-[rgba(255,255,255,.45)]"
          placeholder="name@example.com"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-[#F28B82] text-xs mt-1.5"
        >
          {error}
        </p>
      )}
    </div>
  );
}
