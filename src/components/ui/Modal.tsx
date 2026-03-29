import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';


interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) => {
    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/40 dark:bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300 text-[var(--text-primary)]">
            <div className={`relative w-full ${sizes[size]} max-h-full rounded-[32px] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-300 overflow-hidden group`}>
                {/* Visual Accent Top Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-50"></div>

                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
                        <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            type="button"
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10 transition-all duration-200"
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Đóng hộp thoại</span>
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar relative">
                    {!title && !footer && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors z-10"
                        >
                            <X size={16} />
                        </button>
                    )}
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 border-t border-[var(--border-primary)] p-6 bg-[var(--text-primary)]/[0.02]">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
