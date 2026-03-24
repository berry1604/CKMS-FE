import { useEffect, useState, useCallback } from 'react';
import { ChefHat, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { kitchenApi } from '../../services/kitchen.api';
import type { KitchenResponse } from '../../types/kitchen';
import { cn } from '../../utils/classNames';

interface KitchenSelectorProps {
    selectedKitchenId: number | null;
    onKitchenChange: (kitchenId: number) => void;
    className?: string;
}

export const KitchenSelector = ({
    selectedKitchenId,
    onKitchenChange,
    className
}: KitchenSelectorProps) => {
    const { user } = useAuth();
    const [kitchens, setKitchens] = useState<KitchenResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const userRole = user?.role?.toUpperCase().replace('ROLE_', '');
    const canSelectKitchen = userRole === 'MANAGER' || userRole === 'COORDINATOR' || userRole === 'KITCHEN_STAFF';
    const isAdmin = userRole === 'ADMIN';

    const fetchKitchens = useCallback(async () => {
        if (!canSelectKitchen) return;
        
        setIsLoading(true);
        try {
            const res = await kitchenApi.getAllKitchens();
            const list = res.data || [];
            setKitchens(list);
            
            // Auto-select if nothing is selected yet
            if (!selectedKitchenId && list.length > 0) {
                // Prefer linked kitchen if exists
                const defaultKitchen = list.find(k => k.kitchenId === user?.kitchenId) || list[0];
                onKitchenChange(defaultKitchen.kitchenId);
            }
        } catch (error) {
            console.error('Failed to fetch kitchens:', error);
        } finally {
            setIsLoading(false);
        }
    }, [canSelectKitchen, selectedKitchenId, onKitchenChange, user?.kitchenId]);

    useEffect(() => {
        // If cannot select kitchen, instantly use user's assigned kitchen if nothing is selected
        if (!canSelectKitchen && user?.kitchenId && !selectedKitchenId) {
            onKitchenChange(user.kitchenId);
            return;
        }

        if (canSelectKitchen) {
            fetchKitchens();
        }
    }, [canSelectKitchen, user?.kitchenId, selectedKitchenId, onKitchenChange, fetchKitchens]);

    // As per user request, hide for ADMIN role
    if (isAdmin) return null;

    // If cannot select kitchen, just show their assigned kitchen as text
    if (!canSelectKitchen) {
        return (
            <div className={cn("flex items-center gap-3 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl", className)}>
                <ChefHat size={16} className="text-zinc-500" />
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    {user?.kitchenName || 'Bếp Trung Tâm'}
                </span>
            </div>
        );
    }

    return (
        <div className={cn("relative group min-w-[240px]", className)}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-amber-500 transition-colors pointer-events-none z-10">
                <ChefHat size={18} />
            </div>
            <select
                value={selectedKitchenId || ''}
                onChange={(e) => onKitchenChange(Number(e.target.value))}
                disabled={isLoading}
                className={cn(
                    "w-full h-12 pl-12 pr-10 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-2xl",
                    "text-xs font-black text-zinc-100 uppercase tracking-widest appearance-none cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40",
                    "transition-all duration-300 hover:bg-zinc-800/80 hover:border-zinc-700",
                    isLoading && "opacity-50 cursor-not-allowed"
                )}
            >
                <option value="" disabled>--- Chọn Bếp Trung Tâm ---</option>
                {kitchens.map((k) => (
                    <option key={k.kitchenId} value={k.kitchenId} className="bg-zinc-900 text-zinc-100 py-2">
                        {k.name}
                    </option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                <ChevronDown size={14} className="group-hover:text-amber-500 transition-colors" />
            </div>
            
            {isLoading && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
};
