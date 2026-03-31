import { useState, useEffect } from 'react';
import { 
    Inbox, 
    Search, 
    Filter, 
    Clock, 
    Store,
    ArrowLeft,
    ShoppingBag,
    ChevronDown,
    Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { storeOrderApi } from '../../services/storeOrderApi';
import { productionPlanApi } from '../../services/productionPlan.api';
import type { StoreOrderResponse } from '../../types/storeOrder';
import { cn } from '../../utils/classNames';

export const OrderPool = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchApprovedOrders = async () => {
        setIsLoading(true);
        try {
            const res = await storeOrderApi.getAllOrders({ status: 'APPROVED', size: 100 });
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
                kitchenId: Number(user?.kitchenId ?? 1),
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
        <div className="space-y-10 max-w-[1500px] mx-auto pb-20 animate-in fade-in duration-700 pt-8 px-4">
             {/* Dynamic Header Section */}
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="flex items-center gap-6">
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate('/kitchen/dispatch')}
                        className="h-14 w-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-amber-500 rounded-[1.5rem] transition-all shadow-sm group/back"
                    >
                        <ArrowLeft size={24} className="group-hover/back:-translate-x-1 transition-transform" />
                    </Button>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Badge variant="info" className="text-[10px] font-black px-3 h-5 border-0 uppercase italic tracking-widest">MANUAL SELECTION ELITE</Badge>
                            <div className="w-1 h-1 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic">Operational Pool</span>
                        </div>
                        <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase tracking-tighter italic">Kho đơn <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Pending</span></h1>
                        <p className="text-xs text-[var(--text-secondary)]/60 font-black uppercase tracking-[0.2em] italic">Danh sách tuyển chọn tinh hoa các đơn hàng chi nhánh đang chờ thực thi sản xuất.</p>
                    </div>
                </div>

                <div className="flex items-center gap-6 animate-in slide-in-from-right-8 duration-1000">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl px-8 py-5 flex flex-col items-end shadow-sm relative group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 blur-2xl rounded-full" />
                        <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic relative z-10">Tập đơn tuyển chọn</span>
                        <span className="text-2xl font-black text-amber-500 italic mt-1 relative z-10">{selectedOrderIds.size} <span className="text-[10px] text-[var(--text-secondary)] ml-1">Đơn vị</span></span>
                    </div>
                    <Button 
                        onClick={handleCreateManualPlan}
                        disabled={selectedOrderIds.size === 0 || isCreating}
                        className="bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.2em] h-20 px-12 rounded-2xl border-0 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all italic leading-none"
                    >
                        {isCreating ? (
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Đang xử lý...
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Zap size={20} />
                                Khởi tạo Kế hoạch
                            </div>
                        )}
                    </Button>
                </div>
            </div>

            {/* Selection & Analysis Tools */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 relative group/search">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/40 group-focus-within/search:text-amber-500 transition-colors" size={20} />
                    <input 
                        type="text"
                        placeholder="Truy vết theo Mã đơn giao thức hoặc Tên chi nhánh thực thi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-16 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[1.5rem] pl-16 pr-6 text-sm font-black text-[var(--text-primary)] focus:outline-none focus:border-amber-500/30 transition-all shadow-sm italic placeholder:text-[var(--text-secondary)]/20"
                    />
                </div>
                <Button variant="ghost" className="h-16 bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-secondary)]/60 hover:text-amber-500 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-sm italic hover:bg-amber-500/5">
                    <Filter size={18} className="mr-3" /> Filter Elite
                </Button>
            </div>

            {/* Table Area */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl overflow-hidden shadow-sm relative group/table">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent"></div>
                 <div className="overflow-x-auto max-h-[700px] no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[var(--bg-card)] z-10 border-b border-[var(--border-primary)]">
                            <tr className="text-[10px] uppercase font-black text-[var(--text-secondary)]/40 tracking-[0.3em] italic">
                                <th className="px-10 py-7 w-16">
                                    <div className="flex items-center">
                                        <input 
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-[var(--border-primary)] bg-[var(--bg-root)] text-amber-500 focus:ring-amber-500/20 cursor-pointer transition-all appearance-none border checked:bg-amber-500 relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-black checked:after:text-[12px] shadow-inner"
                                            checked={selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0}
                                            onChange={toggleAll}
                                        />
                                    </div>
                                </th>
                                <th className="px-6 py-7">Mã hành chính đơn</th>
                                <th className="px-8 py-7">Đơn vị chi nhánh</th>
                                <th className="px-8 py-7">Chi tiết cấu trúc đơn</th>
                                <th className="px-8 py-7">Giá trị định mức</th>
                                <th className="px-10 py-7 text-right">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]/10">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-10 py-40 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-16 h-16 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                                            <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.5em] italic animate-pulse">Đang giải mã hồ sơ đơn hàng...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-10 py-40 text-center">
                                        <div className="flex flex-col items-center gap-6 opacity-20">
                                            <div className="w-24 h-24 rounded-3xl bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)]">
                                                <Inbox size={48} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--text-secondary)] italic">Hồ sơ chờ hiện đang trống</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr 
                                        key={order.orderId}
                                        onClick={() => toggleSelection(order.orderId)}
                                        className={cn(
                                            "hover:bg-[var(--text-primary)]/[0.02] cursor-pointer transition-all group",
                                            selectedOrderIds.has(order.orderId) ? "bg-amber-500/[0.03]" : ""
                                        )}
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center">
                                                <input 
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg border-[var(--border-primary)] bg-[var(--bg-root)] text-amber-500 focus:ring-amber-500/20 cursor-pointer transition-all appearance-none border checked:bg-amber-500 relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-black checked:after:text-[12px] shadow-inner"
                                                    checked={selectedOrderIds.has(order.orderId)}
                                                    readOnly
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-sm font-black text-[var(--text-primary)] group-hover:text-amber-500 transition-colors uppercase italic tracking-tighter">#ORD-{order.orderId}</span>
                                                <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest italic">
                                                    <Clock size={12} className="text-amber-500" />
                                                    {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)]/40 group-hover:bg-amber-500/5 group-hover:text-amber-500 transition-all shadow-inner">
                                                    <Store size={18} />
                                                </div>
                                                <span className="text-sm font-black text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors uppercase italic">{order.storeName || `Chi nhánh #${order.storeId}`}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex flex-wrap gap-2">
                                                {(order.orderDetails || []).slice(0, 2).map((item, i) => (
                                                    <Badge key={i} variant="secondary" className="bg-[var(--bg-root)] text-[9px] font-black border-[var(--border-primary)] px-3 py-1 uppercase italic tracking-tighter">
                                                        {item.productName} (x{item.quantity})
                                                    </Badge>
                                                ))}
                                                {(order.orderDetails || []).length > 2 && (
                                                    <span className="text-[10px] text-[var(--text-secondary)]/40 font-black italic ml-2">+{order.orderDetails!.length - 2} more items</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex flex-col">
                                                <span className="text-base font-black text-[var(--text-primary)] italic tabular-nums leading-none">
                                                    {(order.totalAmount || 0).toLocaleString()}
                                                </span>
                                                <span className="text-[9px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest mt-1 italic">VNĐ (định mức)</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                             <div className="flex justify-end">
                                                <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 uppercase text-[9px] font-black h-7 px-4 shadow-sm italic rounded-full">
                                                    {order.status}
                                                </Badge>
                                             </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                 </div>

                 {/* Footer Info Area */}
                 <div className="p-8 bg-[var(--bg-root)] border-t border-[var(--border-primary)]/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
                            <ShoppingBag size={18} />
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)]/60 font-black italic uppercase tracking-[0.15em] max-w-3xl leading-relaxed">
                            Quy tắc vận hành: Hệ thống sẽ mặc định lập kế hoạch cho <span className="text-indigo-500">toàn bộ</span> sản phẩm trong đơn tuyển chọn. Việc tinh chỉnh sản lượng lẻ sẽ được thực thi tại phân hệ <span className="text-amber-500 italic font-black">Allocation Control</span>.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-[var(--bg-card)] px-4 py-2 rounded-full border border-[var(--border-primary)] shadow-inner">
                        <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic">Pool Status:</span>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                             <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-tighter">Live Active</span>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Pagination / Load More Simulation */}
            {filteredOrders.length > 0 && (
                <div className="flex justify-center pt-6">
                    <Button variant="outline" className="h-16 px-12 rounded-full border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-black uppercase text-[10px] tracking-[0.3em] gap-3 italic bg-[var(--bg-card)] shadow-sm">
                        Truy xuất hồ sơ mở rộng <ChevronDown size={18} />
                    </Button>
                </div>
            )}
        </div>
    );
};
