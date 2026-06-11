import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="fixed inset-0 bg-stellar-950/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div 
        ref={modalRef}
        className="relative flex w-full max-w-lg flex-col rounded-xl border border-stellar-700 bg-stellar-800 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-stellar-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-stellar-100">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-stellar-700 p-4 sm:p-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
