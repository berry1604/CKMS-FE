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
            // Since /dispatch/suggest is unavailable, we calculate on Frontend
            const [ordersRes, stockRes] = await Promise.all([
                storeOrderApi.getAllOrders({ status: 'APPROVED', size: 1000 }),
                kitchenInventoryApi.getWarehouseStock(1)
            ]);

            const approvedOrders: StoreOrderResponse[] = ordersRes.content || [];
            const stock: KitchenStockItemResponse[] = stockRes.data || [];
            
            // 1. Aggregate Demand from all APPROVED orders without a planId
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

            // 2. Map to Suggestion Items based on Rule: Suggested = Min(Demand, Kitchen Capacity, Stock)
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
            // As per spec, Auto Create bundles all suggestions
            // The API for creating plan takes storeOrderIds. 
            // The /suggest API in BE might return allocations or orderIds linked to suggestions.
            // Based on Screen 1 description, we "Gom toàn bộ đơn gợi ý vào 1 Plan".
            // However, the /suggest API only returns product quantities according to the spec provided.
            // Wait, Screen 1 B says "GET /api/v1/dispatch/suggest...".
            // Screen 3 says POST /api/v1/production-plans Body (Auto): { "targetDate": "...", "storeOrderIds": [] }
            // Empty array means auto-calculate on backend.
            
            await productionPlanApi.createProductionPlan({
                kitchenId: 1,
                plannedDate,
                storeOrderIds: [] // Backend handles auto logic when empty
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
        <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                        <LayoutDashboard size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="orange" className="text-[10px] font-black px-2 h-4 border-0">DISPATCH V3.0</Badge>
                            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-tight">Bảng điều phối thông minh</h1>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium tracking-wide">Xem trước dự báo sản xuất và tình trạng năng lực bếp/kho.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-zinc-900/40 p-2 pl-4 rounded-2xl border border-zinc-800/50">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ngày mục tiêu</span>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                        <input
                            type="date"
                            value={plannedDate}
                            onChange={(e) => setPlannedDate(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl px-9 py-2 text-xs font-bold text-zinc-200 focus:outline-none focus:border-amber-500/50 transition-all cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="p-8 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/20">
                    <div className="flex items-center gap-3">
                        <ChefHat className="text-amber-500" size={20} />
                        <h2 className="text-lg font-black text-zinc-100 uppercase tracking-tight">Gợi ý sản xuất tối ưu</h2>
                    </div>
                    {suggestions.length > 0 && (
                         <Button 
                            onClick={handleAutoCreate}
                            disabled={isCreating}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl border-0 shadow-lg shadow-amber-900/20"
                        >
                            {isCreating ? 'Đang xử lý...' : <><Boxes size={14} className="mr-2" /> Tạo Kế hoạch Tự động</>}
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/50 text-[10px] uppercase font-black text-zinc-600 tracking-widest border-b border-zinc-800">
                                <th className="px-8 py-5">Tên sản phẩm</th>
                                <th className="px-6 py-5">Nhu cầu thực tế (Store)</th>
                                <th className="px-6 py-5">Sức chứa bếp</th>
                                <th className="px-6 py-5">Tồn kho nguyên liệu</th>
                                <th className="px-8 py-5 text-right">Đề xuất sản xuất</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
                                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Đang tính toán ma trận ràng buộc...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : suggestions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="opacity-20 flex flex-col items-center gap-4">
                                            <LayoutDashboard size={48} />
                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Không có nhu cầu sản xuất cho ngày này</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                suggestions.map((item, idx) => {
                                    const isShortage = item.suggestedQty < item.demandQty;
                                    return (
                                        <tr key={idx} className="hover:bg-zinc-800/20 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-amber-500 transition-colors">
                                                        <ChefHat size={14} />
                                                    </div>
                                                    <span className="text-sm font-black text-zinc-200 tracking-tight">{item.productName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-bold text-zinc-400">{item.demandQty}</span>
                                                    <span className="text-[9px] font-black text-zinc-600 uppercase">Demand Hub</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-bold text-zinc-400">{item.kitchenCapacity}</span>
                                                    <span className="text-[9px] font-black text-zinc-600 uppercase">Capacity Check</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-bold text-zinc-400">{item.ingredientCapacity}</span>
                                                    <span className="text-[9px] font-black text-zinc-600 uppercase">Stock Check</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {isShortage && (
                                                        <div className="group/tip relative">
                                                            <AlertTriangle className="text-amber-500 animate-pulse" size={16} />
                                                            <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-20">
                                                                <h4 className="text-[10px] font-black text-amber-500 uppercase mb-1">Cảnh báo thiếu hụt</h4>
                                                                <p className="text-[10px] text-zinc-400 leading-relaxed italic">{item.shortageDetails || `Thiếu sản lượng: ${item.demandQty - item.suggestedQty} phần.`}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <span className={cn(
                                                        "text-xl font-black tabular-nums tracking-tighter",
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
                <div className="p-6 bg-zinc-950/50 border-t border-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Info size={16} className="text-zinc-600" />
                        <p className="text-[10px] text-zinc-500 font-medium italic">
                            Thuật toán gợi ý dựa trên quy tắc 3-Constraints: Min(Tổng Đơn, Sức Chứa Bếp, Tồn Kho Kho).
                        </p>
                    </div>
                    <div className="flex gap-6">
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                             <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Đủ điều kiện</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                             <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Thiếu hụt</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation Shortcut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                    onClick={() => navigate('/kitchen/order-pool')}
                    className="p-6 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl hover:border-amber-500/30 transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <Boxes className="text-zinc-600 group-hover:text-amber-500 transition-colors" size={20} />
                        <ArrowRight className="text-zinc-800 group-hover:text-zinc-500 transition-all group-hover:translate-x-1" size={16} />
                    </div>
                    <h4 className="text-sm font-black text-zinc-200 uppercase tracking-tight">Manual Order Pool</h4>
                    <p className="text-[10px] text-zinc-600 font-medium">Tự tay chọn các đơn hàng lẻ để lập kế hoạch sản xuất thủ công.</p>
                </div>
                
                <div 
                    onClick={() => navigate('/kitchen/production-plans')}
                    className="p-6 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl hover:border-emerald-500/30 transition-all cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle2 className="text-zinc-600 group-hover:text-emerald-500 transition-colors" size={20} />
                        <ArrowRight className="text-zinc-800 group-hover:text-zinc-500 transition-all group-hover:translate-x-1" size={16} />
                    </div>
                    <h4 className="text-sm font-black text-zinc-200 uppercase tracking-tight">Quản lý Kế hoạch</h4>
                    <p className="text-[10px] text-zinc-600 font-medium">Theo dõi vòng đời sản xuất từ READY đến COMPLETED.</p>
                </div>
            </div>
        </div>
    );
};
