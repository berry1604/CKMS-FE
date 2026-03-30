import React from 'react';
import { 
    Pencil, 
    PackageSearch,
    Store,
    MapPin,
    Hash,
    Zap
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { KitchenResponse } from '../../../types/kitchen';

interface WarehouseTableProps {
    warehouses: KitchenResponse[];
    onEdit: (warehouse: KitchenResponse) => void;
    onViewStock: (warehouse: KitchenResponse) => void;
    isLoading: boolean;
    canManage: boolean;
}

export const WarehouseTable: React.FC<WarehouseTableProps> = ({ 
    warehouses, 
    onEdit, 
    onViewStock,
    isLoading,
    canManage
}) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-[var(--accent-amber)]/20 border-t-[var(--accent-amber)] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 bg-[var(--accent-amber)]/10 blur-xl rounded-full"></div>
                </div>
                <p className="text-sm font-black text-[var(--accent-amber)]/70 uppercase tracking-widest animate-pulse">Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (!warehouses || warehouses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                <div className="relative group">
                    <div className="absolute inset-0 bg-[var(--accent-amber)]/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="w-24 h-24 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] flex items-center justify-center relative z-10 shadow-2xl overflow-hidden">
                        <Store className="w-10 h-10 text-[var(--text-secondary)] group-hover:text-[var(--accent-amber)] transition-colors duration-500 group-hover:scale-110" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Không tìm thấy bếp</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-sm mx-auto leading-relaxed">
                        Hiện tại chưa có bếp trung tâm nào trên hệ thống hoặc không khớp với kết quả tìm kiếm.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                    <tr className="border-b border-[var(--border-primary)] bg-[var(--text-primary)]/5 backdrop-blur-sm transition-colors">
                        <th className="px-8 py-5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest w-[30%]">Thông tin bếp</th>
                        <th className="px-8 py-5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest w-[30%]">Vị trí địa lý</th>
                        <th className="px-8 py-5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest text-center">Công suất</th>
                        <th className="px-8 py-5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                    {warehouses.map((warehouse) => (
                        <tr 
                            key={warehouse.kitchenId}
                            className="group hover:bg-[var(--text-primary)]/5 transition-colors duration-300 relative"
                        >
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-[var(--accent-amber)]/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="w-12 h-12 rounded-[1rem] bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center relative z-10 shadow-lg group-hover:border-[var(--accent-amber)]/30 transition-colors">
                                            <Store className="w-6 h-6 text-[var(--text-secondary)] group-hover:text-[var(--accent-amber)] transition-colors" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="font-bold text-[var(--text-primary)] text-base tracking-tight transition-colors">
                                            {warehouse.name}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[var(--text-secondary)] bg-[var(--text-primary)]/5 px-2 py-0.5 rounded-md w-fit">
                                            <Hash className="w-3 h-3 text-[var(--accent-amber)]/70" />
                                            {warehouse.kitchenId.toString().padStart(4, '0')}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2.5 text-[var(--text-primary)] transition-colors">
                                        <MapPin className="w-4 h-4 text-[var(--text-secondary)] shrink-0 mt-0.5 group-hover:text-[var(--accent-amber)] transition-colors" />
                                        <span className="truncate max-w-[250px] whitespace-normal line-clamp-2 text-xs leading-relaxed" title={warehouse.address}>
                                            {warehouse.address || <span className="text-[var(--text-secondary)]/50 italic">Chưa cấu hình địa chỉ</span>}
                                        </span>
                                    </div>
                                    {(warehouse.latitude !== undefined || warehouse.longitude !== undefined) && (
                                        <div className="flex items-center gap-3 ml-6.5 pl-0.5 opacity-60">
                                            <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-secondary)]">
                                                Vĩ độ: {warehouse.latitude || '0.0'}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-secondary)]">
                                                Kinh độ: {warehouse.longitude || '0.0'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                                <div className="inline-flex items-center justify-center gap-2 bg-[var(--bg-root)] px-3 py-1.5 rounded-xl border border-[var(--border-primary)] group-hover:border-[var(--accent-amber)]/20 transition-colors shadow-sm">
                                    <Zap className={`w-3.5 h-3.5 ${warehouse.maxDailyCapacity > 0 ? "text-[var(--accent-amber)]" : "text-[var(--text-secondary)]"}`} />
                                    <span className="font-mono font-bold text-[var(--text-primary)] text-sm">
                                        {warehouse.maxDailyCapacity > 0 ? warehouse.maxDailyCapacity.toLocaleString() : "0"}
                                    </span>
                                </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onViewStock(warehouse)}
                                        className="h-9 px-3 bg-[var(--bg-root)] hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-emerald-500 dark:hover:text-emerald-400 border border-[var(--border-primary)] hover:border-emerald-500/20 rounded-xl transition-all shadow-sm"
                                        title="Xem Bếp"
                                    >
                                        <PackageSearch className="w-4 h-4 mr-2" />
                                        <span className="text-xs font-bold">Xem bếp</span>
                                    </Button>
                                    
                                    {canManage && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(warehouse)}
                                            className="h-9 w-9 p-0 bg-[var(--bg-root)] hover:bg-amber-500/10 text-[var(--text-secondary)] hover:text-amber-600 dark:hover:text-amber-500 border border-[var(--border-primary)] hover:border-amber-500/20 rounded-xl transition-all shadow-sm"
                                            title="Sửa bếp"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
