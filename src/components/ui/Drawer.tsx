import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: string;
}

export const Drawer = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    width = 'max-w-md'
}: DrawerProps) => {
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer Panel */}
            <div
                ref={drawerRef}
                className={`relative w-full ${width} h-full bg-[var(--bg-card)] backdrop-blur-2xl shadow-[-32px_0_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[-32px_0_64px_-16px_rgba(0,0,0,0.6)] border-l border-[var(--border-primary)] flex flex-col transform transition-transform duration-500 ease-out animate-in slide-in-from-right duration-500`}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-8 py-8 border-b border-[var(--border-primary)]">
                    <div className="space-y-1">
                        {title && <div className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter">{title}</div>}
                        {description && <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10 transition-all duration-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-8 py-6 border-t border-[var(--border-primary)] bg-[var(--text-primary)]/[0.02] backdrop-blur-md">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
