import { useState, useEffect } from 'react';
import { 
    Inbox, 
    Search, 
    Filter, 
    Clock, 
    Store,
    ArrowLeft,
    ShoppingBag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { storeOrderApi } from '../../services/storeOrderApi';
import { productionPlanApi } from '../../services/productionPlan.api';
import type { StoreOrderResponse } from '../../types/storeOrder';
import { cn } from '../../utils/classNames';

export const OrderPool = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchApprovedOrders = async () => {
        setIsLoading(true);
        try {
            // Screen 2 spec: status=APPROVED and planId==null
            const res = await storeOrderApi.getAllOrders({ status: 'APPROVED', size: 100 });
            // FE filtering for planId == null if BE doesn't support it yet
            const unassignedOrders = (res.content || []).filter(o => !o.planId);
            setOrders(unassignedOrders);
        } catch (error) {
            toast.error("Không thể tải danh sách đơn hàng.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovedOrders();
    }, []);

    const toggleSelection = (orderId: number) => {
        const newSet = new Set(selectedOrderIds);
        if (newSet.has(orderId)) newSet.delete(orderId);
        else newSet.add(orderId);
        setSelectedOrderIds(newSet);
    };

    const toggleAll = () => {
        if (selectedOrderIds.size === filteredOrders.length) setSelectedOrderIds(new Set());
        else setSelectedOrderIds(new Set(filteredOrders.map(o => o.orderId)));
    };

    const handleCreateManualPlan = async () => {
        if (selectedOrderIds.size === 0) {
            toast.error("Vui lòng chọn ít nhất một đơn hàng.");
            return;
        }

        setIsCreating(true);
        try {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 1);
            
            await productionPlanApi.createProductionPlan({
                plannedDate: targetDate.toISOString().split('T')[0],
                storeOrderIds: Array.from(selectedOrderIds)
            });

            toast.success(`Đã tạo kế hoạch cho ${selectedOrderIds.size} đơn hàng.`);
            navigate('/kitchen/production-plans');
        } catch (error: any) {
            if (error.response?.status === 400) {
                toast.error(error.response.data.message || "Kho không đủ nguyên liệu cho các đơn đã chọn.");
            } else {
                toast.error("Tạo kế hoạch thủ công thất bại.");
            }
        } finally {
            setIsCreating(false);
        }
    };

    const filteredOrders = orders.filter(o => 
        o.orderId.toString().includes(searchTerm) || 
        (o.storeName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-700">
             {/* Sticky Action Bar */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate('/kitchen/dispatch')}
                        className="h-10 w-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="info" className="text-[10px] font-black px-2 h-4 border-0">MANUAL MODE</Badge>
                            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-tight">Kho đơn chờ duyệt tay</h1>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium tracking-wide">Tự tay lựa chọn các đơn hàng chi nhánh để gom mẻ sản xuất.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                     <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl px-6 py-3 flex flex-col items-end">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Đã chọn</span>
                        <span className="text-sm font-black text-amber-500">{selectedOrderIds.size} đơn hàng</span>
                    </div>
                    <Button 
                        onClick={handleCreateManualPlan}
                        disabled={selectedOrderIds.size === 0 || isCreating}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest h-14 px-8 rounded-2xl border-0 shadow-lg shadow-emerald-900/20"
                    >
                        {isCreating ? 'Đang khởi tạo...' : 'Tạo Kế hoạch'}
                    </Button>
                </div>
            </div>

            {/* Filter & Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                    <input 
                        type="text"
                        placeholder="Tìm kiếm theo Mã đơn hoặc Tên chi nhánh..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 bg-zinc-900/40 border border-zinc-800 rounded-2xl pl-12 pr-4 text-sm font-bold text-zinc-200 focus:outline-none focus:border-amber-500/50 transition-all"
                    />
                </div>
                <Button variant="ghost" className="h-14 bg-zinc-900/40 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-2xl font-black uppercase text-[10px] tracking-widest">
                    <Filter size={16} className="mr-2" /> Bộ lọc nâng cao
                </Button>
            </div>

            {/* Table Area */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] overflow-hidden shadow-2xl">
                 <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-zinc-900 z-10 border-b border-zinc-800">
                            <tr className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">
                                <th className="px-8 py-5 w-12">
                                    <input 
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                                        checked={selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th className="px-4 py-5">Mã đơn hàng</th>
                                <th className="px-6 py-5">Chi nhánh</th>
                                <th className="px-6 py-5">Nội dung đơn</th>
                                <th className="px-6 py-5">Giá trị</th>
                                <th className="px-8 py-5 text-right">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/20">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center text-zinc-600 font-black uppercase text-[10px] tracking-widest animate-pulse">
                                        Đang truy lục kho đơn hàng...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Inbox size={48} />
                                            <span className="text-xs font-black uppercase tracking-widest">Không có đơn hàng nào chờ duyệt</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr 
                                        key={order.orderId}
                                        onClick={() => toggleSelection(order.orderId)}
                                        className={cn(
                                            "hover:bg-zinc-800/20 cursor-pointer transition-all group",
                                            selectedOrderIds.has(order.orderId) ? "bg-amber-500/[0.03]" : ""
                                        )}
                                    >
                                        <td className="px-8 py-6">
                                            <input 
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                                                checked={selectedOrderIds.has(order.orderId)}
                                                readOnly
                                            />
                                        </td>
                                        <td className="px-4 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-zinc-100 group-hover:text-amber-500 transition-colors">#ORD-{order.orderId}</span>
                                                <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase">
                                                    <Clock size={10} />
                                                    {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                <Store size={14} className="text-zinc-600" />
                                                <span className="text-sm font-bold text-zinc-300">{order.storeName || `Chi nhánh #${order.storeId}`}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-wrap gap-1.5">
                                                {(order.orderDetails || []).slice(0, 2).map((item, i) => (
                                                    <Badge key={i} variant="secondary" className="bg-zinc-800/50 text-[9px] border-zinc-700/50 lowercase">
                                                        {item.productName} (x{item.quantity})
                                                    </Badge>
                                                ))}
                                                {(order.orderDetails || []).length > 2 && (
                                                    <span className="text-[9px] text-zinc-600 font-black">+{order.orderDetails!.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-sm font-black text-zinc-200">
                                            {(order.totalAmount || 0).toLocaleString()} <span className="text-[10px] text-zinc-600 font-bold ml-1">đ</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                             <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase text-[8px] font-black h-5 px-3">
                                                 {order.status}
                                             </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                 </div>

                 {/* Footer Info */}
                 <div className="p-6 bg-zinc-950/50 border-t border-zinc-800/50 flex items-center gap-3">
                    <ShoppingBag size={16} className="text-zinc-600" />
                    <p className="text-[10px] text-zinc-500 font-medium italic">
                        Lưu ý: Hệ thống mặc định lập kế hoạch cho TOÀN BỘ sản phẩm trong đơn. Việc điều chỉnh lẻ số lượng sẽ thực hiện tại bước Phân bổ (Allocation).
                    </p>
                 </div>
            </div>
        </div>
    );
};
