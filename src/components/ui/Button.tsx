import React from 'react';
import { cn } from '../../utils/classNames';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    disabled,
    ...props
}) => {
    const variants = {
        primary: 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 shadow-sm transition-all duration-300',
        secondary: 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
        outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-transparent dark:hover:bg-zinc-800 dark:text-zinc-300',
        ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600 dark:hover:bg-zinc-800 dark:text-zinc-300',
        danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border dark:border-red-500/20 dark:hover:bg-red-500/20',
    };

    const sizes = {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-lg',
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
};
