import type { ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'teal' | 'orange';
    className?: string;
    size?: 'sm' | 'md';
}

export const Badge = ({ children, variant = 'default', className = '', size = 'md' }: BadgeProps) => {
    const variants = {
        default: 'bg-blue-100 text-blue-800',
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-indigo-100 text-indigo-800',
        secondary: 'bg-gray-100 text-gray-800',
        teal: 'bg-teal-100 text-teal-800',
        orange: 'bg-orange-100 text-orange-800',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
    };

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
            {children}
        </span>
    );
};
