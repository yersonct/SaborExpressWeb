import React from 'react';

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({
  label,
  error,
  className = '',
  ...props
}: InputProps) => {
  return (
    <div className="flex flex-col gap-2 w-full">

      {label && (
        <label className="text-sm font-medium text-[#111827]">
          {label}
        </label>
      )}

      <input
        className={`
          w-full
          px-4
          py-3
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
              ? 'border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]'
              : 'border-[#E5E7EB] focus:ring-2 focus:ring-[#EA1D2C] focus:border-[#EA1D2C]'
          }

          hover:border-[#d1d5db]

          ${className}
        `}
        {...props}
      />

      {error && (
        <span className="text-sm text-[#EF4444] font-medium">
          {error}
        </span>
      )}

    </div>
  );
};