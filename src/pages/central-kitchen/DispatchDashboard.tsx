import { useState, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, 
    LayoutDashboard, 
    AlertTriangle, 
    CheckCircle2, 
    ChefHat, 
    Boxes,
    ArrowRight,
    Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { storeOrderApi } from '../../services/storeOrderApi';
import { kitchenInventoryApi } from '../../services/kitchenInventory.api';
import { productionPlanApi } from '../../services/productionPlan.api';
import type { DispatchSuggestionItem } from '../../types/productionPlan';
import type { KitchenStockItemResponse } from '../../types/kitchenInventory';
import type { StoreOrderResponse } from '../../types/storeOrder';
import { cn } from '../../utils/classNames';

export const DispatchDashboard = () => {
    const navigate = useNavigate();
    const [plannedDate, setPlannedDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    });
    const [suggestions, setSuggestions] = useState<DispatchSuggestionItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const fetchSuggestions = async () => {
        setIsLoading(true);
        try {
            const [ordersRes, stockRes] = await Promise.all([
                storeOrderApi.getAllOrders({ status: 'APPROVED', size: 1000 }),
                kitchenInventoryApi.getWarehouseStock(1)
            ]);

            const approvedOrders: StoreOrderResponse[] = ordersRes.content || [];
            const stock: KitchenStockItemResponse[] = stockRes.data || [];
            
            const demandMap = new Map<string, { productId: number, demandQty: number, unit: string }>();
            approvedOrders.filter((o: StoreOrderResponse) => !o.planId).forEach((order: StoreOrderResponse) => {
                (order.orderDetails || []).forEach((item: any) => {
                    const existing = demandMap.get(item.productName);
                    if (existing) {
                        existing.demandQty += item.quantity;
                    } else {
                        demandMap.set(item.productName, { 
                            productId: item.productId, 
                            demandQty: item.quantity,
                            unit: item.unit || "phần"
                        });
                    }
                });
            });

            const KITCHEN_CAPACITY_LIMIT = 500; 

            const calculatedSuggestions: DispatchSuggestionItem[] = Array.from(demandMap.entries()).map(([name, data]) => {
                const stockItem = stock.find((s: KitchenStockItemResponse) => s.itemName === name);
                const stockQty = stockItem ? stockItem.quantity : 0;
                
                const suggestedQty = Math.min(data.demandQty, KITCHEN_CAPACITY_LIMIT, stockQty);
                
                return {
                    productId: data.productId,
                    productName: name,
                    demandQty: data.demandQty,
                    kitchenCapacity: KITCHEN_CAPACITY_LIMIT,
                    ingredientCapacity: stockQty,
                    suggestedQty: suggestedQty,
                    shortageDetails: suggestedQty < data.demandQty 
                        ? `Thiếu hụt do ${stockQty < data.demandQty ? 'Kho không đủ' : 'Vượt công suất bếp'}` 
                        : undefined
                };
            });

            setSuggestions(calculatedSuggestions);
        } catch (error) {
            console.error("Error calculating suggestions:", error);
            toast.error("Không thể tính toán gợi ý điều phối.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, [plannedDate]);

    const handleAutoCreate = async () => {
        if (suggestions.length === 0) {
            toast.error("Không có gợi ý để tạo kế hoạch.");
            return;
        }

        setIsCreating(true);
        try {
            await productionPlanApi.createProductionPlan({
                kitchenId: 1,
                plannedDate,
                storeOrderIds: [] 
            });
            toast.success("Kế hoạch sản xuất tự động đã được tạo thành công.");
            navigate('/kitchen/production-plans');
        } catch (error: any) {
             if (error.response?.status === 400) {
                toast.error(error.response.data.message || "Không đủ nguyên liệu để tạo kế hoạch.");
            } else {
                toast.error("Tạo kế hoạch thất bại.");
            }
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto pb-20 animate-in fade-in duration-700 pt-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500 shadow-xl shadow-amber-500/10 flex items-center justify-center text-black rotate-2">
                        <LayoutDashboard size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="orange" className="text-[10px] font-black px-3 h-5 border-0 uppercase italic tracking-widest">DISPATCH V3.0-ELITE</Badge>
                            <h1 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter italic">Điều phối thông minh</h1>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]/60 font-black uppercase tracking-[0.2em] italic">Dự báo sản xuất tối ưu & Phân tích ma trận năng lực vận hành.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-[var(--bg-card)] p-3 pl-6 rounded-full border border-[var(--border-primary)] shadow-sm">
                    <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic">Ngày mục tiêu</span>
                    <div className="relative group/date">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={14} />
                        <input
                            type="date"
                            value={plannedDate}
                            onChange={(e) => setPlannedDate(e.target.value)}
                            className="bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-full px-10 py-2.5 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-amber-500/50 transition-all cursor-pointer shadow-inner italic"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl overflow-hidden shadow-sm relative group">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
                
                <div className="p-8 md:p-10 border-b border-[var(--border-primary)]/10 flex flex-col md:flex-row justify-between items-center gap-6 bg-[var(--text-primary)]/[0.01]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm">
                            <ChefHat size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight italic">Gợi ý sản xuất tối ưu</h2>
                            <p className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic mt-1">Hệ thống phân tích nhu cầu vĩnh cửu</p>
                        </div>
                    </div>
                    {suggestions.length > 0 && (
                         <Button 
                            onClick={handleAutoCreate}
                            disabled={isCreating}
                            className="w-full md:w-auto bg-gradient-to-br from-amber-400 to-orange-600 text-black font-black uppercase text-[10px] tracking-[0.2em] h-14 px-10 rounded-full border-0 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all italic"
                        >
                            {isCreating ? 'Đang truy lục kho...' : <><Boxes size={18} className="mr-3" /> Khởi tạo Kế hoạch Tự động</>}
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg-root)] text-[10px] uppercase font-black text-[var(--text-secondary)]/40 tracking-[0.3em] border-b border-[var(--border-primary)]/10 italic">
                                <th className="px-10 py-6">Sản phẩm định danh</th>
                                <th className="px-8 py-6">Nhu cầu thực tế</th>
                                <th className="px-8 py-6">Công suất bếp</th>
                                <th className="px-8 py-6">Tồn kho nguyên liệu</th>
                                <th className="px-10 py-6 text-right">Đề xuất vận hành</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]/30">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-40 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <RefreshCw className="w-12 h-12 text-amber-500 animate-spin" />
                                            <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.4em] italic animate-pulse">Đang giải mã ma trận ràng buộc chuỗi cung ứng...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : suggestions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-40 text-center">
                                        <div className="opacity-20 flex flex-col items-center gap-6">
                                            <div className="w-20 h-20 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)]">
                                                <LayoutDashboard size={40} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)]/60 italic">Không có nhu cầu điều phối phát sinh</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                suggestions.map((item, idx) => {
                                    const isShortage = item.suggestedQty < item.demandQty;
                                    return (
                                        <tr key={idx} className="hover:bg-[var(--text-primary)]/[0.02] transition-colors group">
                                            <td className="px-10 py-7">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)]/40 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all shadow-sm">
                                                        <ChefHat size={18} />
                                                    </div>
                                                    <span className="text-sm font-black text-[var(--text-primary)] tracking-tight uppercase italic">{item.productName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-[var(--text-primary)] italic">{item.demandQty}</span>
                                                    <span className="text-[8px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic">Request Hub</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-[var(--text-primary)] italic">{item.kitchenCapacity}</span>
                                                    <span className="text-[8px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic">Load Limit</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-[var(--text-primary)] italic">{item.ingredientCapacity}</span>
                                                    <span className="text-[8px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic">Stock Log</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <div className="flex items-center justify-end gap-4">
                                                    {isShortage && (
                                                        <div className="group/tip relative flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping absolute" />
                                                            <AlertTriangle className="text-amber-500 relative z-10" size={18} />
                                                            <div className="absolute bottom-full right-0 mb-4 w-60 p-5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-20 scale-90 group-hover/tip:scale-100 origin-bottom-right">
                                                                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 italic">Cảnh báo thiếu hụt</h4>
                                                                <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed italic uppercase">{item.shortageDetails || `Thâm hụt tồn kho/công suất: ${item.demandQty - item.suggestedQty} đơn vị.`}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <span className={cn(
                                                        "text-3xl font-black tabular-nums tracking-tighter italic",
                                                        isShortage ? "text-amber-500" : "text-emerald-500"
                                                    )}>
                                                        {item.suggestedQty}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Insight */}
                <div className="p-8 bg-[var(--bg-root)] border-t border-[var(--border-primary)]/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--text-primary)]/5 flex items-center justify-center text-amber-500 shadow-inner">
                            <Info size={18} />
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)]/60 font-black italic uppercase tracking-wider max-w-2xl leading-relaxed">
                            Thuật toán gợi ý dựa trên giao thức <span className="text-amber-500">3-Constraints</span>: Min(Nhu cầu vĩnh cửu, Sức chứa thực tế, Tồn kho hữu hạn).
                        </p>
                    </div>
                    <div className="flex gap-8">
                         <div className="flex items-center gap-3">
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                             <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] italic">Đạt tiêu chuẩn</span>
                         </div>
                         <div className="flex items-center gap-3">
                             <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                             <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] italic">Cảnh báo thâm hụt</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation Shortcut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div 
                    onClick={() => navigate('/kitchen/order-pool')}
                    className="p-8 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl hover:border-amber-500/30 transition-all cursor-pointer group shadow-sm hover:shadow-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/5 transition-all duration-700" />
                    <div className="relative flex flex-col h-full gap-6">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 transition-colors group-hover:rotate-6">
                                <Boxes size={24} />
                            </div>
                            <ArrowRight size={20} className="text-[var(--text-secondary)]/20 group-hover:text-amber-500 transition-all group-hover:translate-x-2" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight italic">Manual Order Pool</h4>
                            <p className="text-[11px] text-[var(--text-secondary)]/60 font-medium italic uppercase tracking-wider mt-2 leading-relaxed">Tự thân tuyển chọn các đơn hàng chi nhánh để kiến tạo kế hoạch sản xuất thủ công.</p>
                        </div>
                    </div>
                </div>
                
                <div 
                    onClick={() => navigate('/kitchen/production-plans')}
                    className="p-8 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl hover:border-emerald-500/30 transition-all cursor-pointer group shadow-sm hover:shadow-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/5 transition-all duration-700" />
                    <div className="relative flex flex-col h-full gap-6">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 transition-colors group-hover:rotate-6">
                                <CheckCircle2 size={24} />
                            </div>
                            <ArrowRight size={20} className="text-[var(--text-secondary)]/20 group-hover:text-emerald-500 transition-all group-hover:translate-x-2" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight italic">Hệ thống Kế hoạch</h4>
                            <p className="text-[11px] text-[var(--text-secondary)]/60 font-medium italic uppercase tracking-wider mt-2 leading-relaxed">Giám sát toàn bộ chu kỳ sống của sản xuất từ READY đến COMPLETED tinh hoa.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
