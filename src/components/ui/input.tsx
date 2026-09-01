"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({
  label,
  error,
  className = "",
  type = "text",
  ...props
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "password" : "text") : type;

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-sm font-medium text-[#111827]">{label}</label>
      )}

      <div className="relative w-full">
        <input
          type={resolvedType}
          className={`
            w-full
            px-4
            py-3
            ${isPassword ? "pr-12" : ""}
            rounded-xl
            border
            bg-white
            text-[#111827]
            placeholder:text-gray-400
            transition-all
            duration-300
            outline-none

            ${
              error
                ? "border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]"
                : "border-[#E5E7EB] focus:ring-2 focus:ring-[#EA1D2C] focus:border-[#EA1D2C]"
            }

            hover:border-[#d1d5db]

            ${className}
          `}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={
              showPassword ?  "Mostrar contraseña" :"Ocultar contraseña" 
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#EA1D2C] transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {error && (
        <span className="text-sm text-[#EF4444] font-medium">{error}</span>
      )}
    </div>
  );
};
