import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

/** Round icon-only button. `label` is required for screen readers / tooltips. */
export function IconButton({ label, children, className = '', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`touch-target flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-soft transition active:scale-95 hover:bg-dc-fog ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
