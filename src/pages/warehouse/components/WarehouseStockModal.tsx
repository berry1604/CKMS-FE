import React, { useState, useEffect } from 'react';
import { PackageSearch, Search, Layers, Calendar, ArrowRight, AlertTriangle } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { kitchenInventoryApi } from '../../../services/kitchenInventory.api';
import type { KitchenStockItemResponse } from '../../../types/kitchenInventory';
import type { KitchenResponse } from '../../../types/kitchen';
import toast from 'react-hot-toast';

const isExpiringSoon = (dateStr: string | null) => {
    if (!dateStr) return false;
    const expiryDate = new Date(dateStr);
    const now = new Date();
    const diffDays = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 && diffDays >= 0;
};

const isExpired = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
};

interface WarehouseStockModalProps {
    warehouse: KitchenResponse | null;
    isOpen: boolean;
    onClose: () => void;
}

export const WarehouseStockModal: React.FC<WarehouseStockModalProps> = ({ warehouse, isOpen, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [stocks, setStocks] = useState<KitchenStockItemResponse[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen && warehouse) {
            loadStock();
        } else {
            setStocks([]);
            setSearchQuery('');
        }
    }, [isOpen, warehouse]);

    const loadStock = async () => {
        if (!warehouse) return;
        setIsLoading(true);
        try {
            const res = await kitchenInventoryApi.getWarehouseStock(warehouse.kitchenId);
            setStocks(res.data || []);
        } catch (error) {
            console.error('Error loading stock:', error);
            toast.error('Không thể truy xuất dữ liệu bếp trung tâm');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !warehouse) return null;

    const filteredStocks = stocks.filter(s => 
        s.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.itemType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[var(--bg-root)]/60 dark:bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />
            
            <div className="relative bg-[var(--bg-card)] border border-emerald-500/20 rounded-[2.5rem] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl dark:shadow-[0_0_80px_rgba(16,185,129,0.1)] overflow-hidden animate-in slide-in-from-bottom-8 fade-in zoom-in-95 duration-500">
                {/* Decorative glows */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/80 to-emerald-500/0"></div>
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none"></div>

                {/* Header */}
                <div className="p-8 pb-6 border-b border-[var(--border-primary)] relative z-10 bg-gradient-to-b from-emerald-500/[0.04] to-transparent">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/30 shadow-inner">
                                <PackageSearch className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                                    Thống Kê Tồn Bếp
                                </h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest">Chi nhánh</span>
                                    <ArrowRight className="w-3 h-3 text-[var(--text-secondary)]/40" />
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black tracking-widest uppercase border border-emerald-500/20">
                                        {warehouse.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 transition-all border border-transparent hover:border-[var(--border-primary)]"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]/50 group-focus-within:text-emerald-400 transition-colors z-10" />
                            <Input
                                placeholder="Tìm kiếm sản phẩm, nguyên liệu phân loại..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-14 w-full relative z-10 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-8 relative z-10 bg-[var(--bg-root)]/20 backdrop-blur-sm">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full"></div>
                            </div>
                            <p className="text-sm font-black text-emerald-500/70 uppercase tracking-widest animate-pulse">Truy xuất dữ liệu bếp trung tâm...</p>
                        </div>
                    ) : (
                        <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-primary)] overflow-hidden shadow-sm dark:shadow-2xl">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-[var(--border-primary)] bg-[var(--text-primary)]/5 backdrop-blur-md">
                                        <th className="px-8 py-5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Định danh vật tư</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest w-40 text-center">Phân loại</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest w-48 text-right">Khối lượng / Tồn bếp</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest w-48 text-center">Hạn sử dụng</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                    {filteredStocks.length > 0 ? (
                                        filteredStocks.map((stock) => {
                                            const expired = isExpired(stock.expiryDate);
                                            const expiringSoon = isExpiringSoon(stock.expiryDate);

                                            return (
                                            <tr key={stock.id} className={`group transition-all duration-300 border-b border-[var(--border-primary)]/10 ${expired ? "bg-red-500/5 hover:bg-red-500/10" : expiringSoon ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-[var(--text-primary)]/[0.02]"}`}>
                                                <td className="px-8 py-5">
                                                    <div className={`font-black text-base tracking-tight transition-colors italic uppercase ${expired ? "text-red-500 group-hover:text-red-400" : expiringSoon ? "text-amber-600 group-hover:text-amber-500" : "text-[var(--text-primary)] group-hover:text-amber-500"}`}>
                                                        {stock.itemName}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-mono text-[var(--text-secondary)]/60">
                                                            ID: {stock.itemId.toString().padStart(6, '0')}
                                                        </span>
                                                        {expired && (
                                                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[8px] font-black tracking-widest uppercase border border-red-500/20 flex items-center gap-1">
                                                                <AlertTriangle className="w-2.5 h-2.5" />
                                                                Đã hết hạn
                                                            </span>
                                                        )}
                                                        {expiringSoon && (
                                                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black tracking-widest uppercase border border-amber-500/20 flex items-center gap-1">
                                                                <AlertTriangle className="w-2.5 h-2.5" />
                                                                Sắp hết hạn
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    {stock.itemType === 'MATERIAL' ? (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black tracking-widest uppercase text-amber-500 mx-auto">
                                                            <Layers className="w-3 h-3" />
                                                            Nguyên liệu
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black tracking-widest uppercase text-blue-400 mx-auto">
                                                            <PackageSearch className="w-3 h-3" />
                                                            Thành phẩm
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-baseline justify-end gap-1.5 group-hover:translate-x-[-4px] transition-transform">
                                                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-lg tracking-tighter shadow-emerald-500/20">
                                                            {stock.quantity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{stock.unit}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col items-center justify-center">
                                                        {stock.expiryDate ? (
                                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors ${expired ? "text-red-500 bg-red-500/10 border-red-500/20" : expiringSoon ? "text-amber-600 bg-amber-500/10 border-amber-500/20" : "text-[var(--text-secondary)] bg-[var(--text-primary)]/5 border-[var(--border-primary)]"}`}>
                                                                <Calendar className={`w-3.5 h-3.5 ${expired ? "text-red-500" : expiringSoon ? "text-amber-500" : "text-[var(--text-secondary)]"}`} />
                                                                <span className="text-xs font-medium tracking-wide">
                                                                    {new Date(stock.expiryDate).toLocaleDateString('vi-VN')}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-[10px] font-black text-[var(--text-secondary)]/50 uppercase tracking-widest bg-[var(--text-primary)]/5 px-3 py-1.5 rounded-xl border border-[var(--border-primary)]">
                                                                Không bắt buộc
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-4">
                                                    <div className="w-16 h-16 rounded-full bg-[var(--text-primary)]/5 border border-[var(--border-primary)] flex items-center justify-center">
                                                        <PackageSearch className="w-6 h-6 text-[var(--text-secondary)]" />
                                                    </div>
                                                    <p className="text-[var(--text-secondary)] text-sm font-medium">
                                                        {searchQuery ? 'Không có vật tư nào khớp với từ khóa' : 'Bếp trung tâm hiện tại đang trống'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
