import type { ReactNode } from 'react';
import { cn } from '../../utils/classNames';

interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'teal' | 'orange' | 'emerald' | 'amber' | 'indigo';
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
        emerald: 'bg-emerald-100 text-emerald-800',
        amber: 'bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-400',
        indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
    };

    return (
        <span className={cn(
            "inline-flex items-center rounded-full font-bold uppercase tracking-tight transition-colors duration-300",
            variants[variant],
            sizes[size],
            className
        )}>
            {children}
        </span>
    );
};
