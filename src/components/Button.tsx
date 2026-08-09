import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-dc-rainbowPurple text-white shadow-pop hover:brightness-105',
  secondary: 'bg-white text-dc-ink shadow-soft hover:bg-dc-fog',
  ghost: 'bg-white/70 text-dc-ink hover:bg-white',
};

export function Button({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`touch-target inline-flex items-center justify-center gap-2 rounded-xl2 px-5 py-3 text-lg font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
