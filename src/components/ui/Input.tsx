import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-neutral-700 tracking-wide uppercase"
        >
          {label}
          {props.required && <span className="text-rose-600 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
            : 'border-neutral-300 focus:border-neutral-900 focus:ring-neutral-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-neutral-500 mt-0.5">{hint}</p>}
    </div>
  );
};
