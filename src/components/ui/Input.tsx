import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/classNames';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: ReactNode;
    labelClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, icon, labelClassName = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className={`block text-sm font-medium mb-1 ${labelClassName || 'text-gray-300'}`}>
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            "block w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]",
                            "py-3 text-sm text-[var(--text-primary)] placeholder-zinc-400 dark:placeholder-zinc-500",
                            "focus:border-[var(--accent-amber)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-amber)]/20",
                            "disabled:opacity-50 transition-all duration-300 shadow-sm dark:shadow-inner",
                            icon ? 'pl-10' : 'px-4',
                            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
