import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  onClose: () => void;
}

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dc-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl2 bg-white p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 font-display text-2xl font-bold text-dc-ink">{title}</h2>
        {children}
      </div>
    </div>
  );
}
