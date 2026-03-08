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
                className={`relative w-full ${width} h-full bg-zinc-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right duration-300`}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-6 border-b border-zinc-800">
                    <div>
                        {title && <div className="text-xl font-semibold text-gray-200">{title}</div>}
                        {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-300 hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
