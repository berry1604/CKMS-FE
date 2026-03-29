import type { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    title?: string;
    action?: ReactNode;
    onClick?: () => void;
}

export const Card = ({ children, className = '', style, title, action, onClick }: CardProps) => {
    return (
        <div
            className={`bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-primary)] overflow-hidden ${className} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            style={style}
        >
            {(title || action) && (
                <div className="px-6 py-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                    {title && <h3 className="font-semibold text-[var(--text-primary)] text-lg">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};
