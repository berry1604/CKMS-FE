import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { OctagonAlert } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    isLoading = false,
    variant = 'danger'
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <div className="flex flex-col items-center text-center">
                {/* Modern Icon with Glow */}
                <div className="relative mb-8">
                    <div className={`absolute inset-0 blur-2xl opacity-20 ${variant === 'danger' ? 'bg-red-500' :
                        variant === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                        }`}></div>
                    <div className={`p-6 rounded-[24px] relative z-10 border ${variant === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        variant === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-500'
                        }`}>
                        <OctagonAlert size={40} strokeWidth={2.5} />
                    </div>
                </div>

                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-3 uppercase tracking-tight">{title}</h3>
                <p className="text-[var(--text-secondary)] font-medium mb-10 text-sm leading-relaxed max-w-[320px]">{message}</p>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-14 bg-[var(--text-primary)]/5 border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        className={`flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all duration-300 border-0 shadow-2xl ${variant === 'danger'
                            ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-red-900/40'
                            : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black shadow-amber-900/40'
                            }`}
                        isLoading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
