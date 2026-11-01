import type { ComponentProps } from "react";

const VARIANTS = {
  primary: "bg-slate-900 text-white enabled:hover:bg-slate-700",
  secondary: "border border-slate-300 bg-white text-slate-700 enabled:hover:bg-slate-50",
  danger: "bg-red-600 text-white enabled:hover:bg-red-500",
};

type ButtonProps = ComponentProps<"button"> & { variant?: keyof typeof VARIANTS };

export function Button({ variant = "secondary", className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  );
}
