'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (typeof document === 'undefined' || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-full items-end justify-center p-3 sm:items-center sm:p-4">
        <div
          className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        <div className="surface-card relative z-10 max-h-[calc(100vh-1.5rem)] w-full max-w-xl overflow-hidden rounded-[30px] border border-white/60 text-left shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 px-4 py-4 sm:px-6">
            <div>
              <h3
                id="modal-title"
                className="text-lg font-semibold tracking-[-0.02em] text-slate-950"
              >
                {title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {description ?? 'Met a jour les informations portefeuille et la progression de livraison.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[calc(100vh-9rem)] overflow-y-auto px-4 py-5 sm:px-6">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
