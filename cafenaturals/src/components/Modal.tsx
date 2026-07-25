import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  type?: 'alert' | 'confirm' | 'custom';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  children?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = 'alert',
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  children
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            {type !== 'custom' && (
              <div className={`p-2 rounded-full shrink-0 ${type === 'confirm' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                {type === 'confirm' ? <HelpCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              </div>
            )}
            <div className="pt-1 flex-1">
              <h3 className="font-serif text-lg font-bold text-foreground leading-none mb-4">{title}</h3>
              {children ? children : (
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
        {!children && (
          <div className="bg-[#FFFDF9] border-t border-[#E6D8C8] px-6 py-4 flex items-center justify-end gap-3 font-sans">
            {type === 'confirm' && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-[#6D5B4A] hover:text-[#3E3023] transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
                else onClose();
              }}
              className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-[#E8D9C5] to-[#C8A97E] hover:from-[#C8A97E] hover:to-[#8B6B4A] text-[#3E3023] hover:text-[#FFFDF9] rounded-full transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
