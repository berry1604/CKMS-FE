import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Calendar as CalendarIcon, ChevronRight, CheckCircle2,
    ChefHat, Package, ClipboardCheck, LayoutGrid, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { storeOrderApi } from '../../services/storeOrderApi';
import { productionPlanApi } from '../../services/productionPlan.api';
import { useAuth } from '../../hooks/useAuth';
import type { StoreOrderResponse } from '../../types/storeOrder';
import { cn } from '../../utils/classNames';


export const CreateProductionPlan = () => {
    const navigate = useNavigate();
    const { } = useAuth();

    // Wizard State
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    // Form Data
    const [plannedDate, setPlannedDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1); // Default to tomorrow
        return d.toISOString().split('T')[0];
    });
    const [selectedKitchenId] = useState<number>(1);
    const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (step === 2 && orders.length === 0) {
            fetchPendingOrders();
        }
    }, [step]);

    const fetchPendingOrders = async () => {
        setIsLoadingOrders(true);
        try {
            // Coordinator fetches APPROVED orders to bundle into production plan
            const res = await storeOrderApi.getAllOrders({ status: 'APPROVED', size: 100 });
            setOrders(res.content || []);
        } catch (error) {
            toast.error("Không thể tải danh sách đơn hàng.");
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const toggleSelection = (orderId: number) => {
        const newSet = new Set(selectedOrderIds);
        if (newSet.has(orderId)) newSet.delete(orderId);
        else newSet.add(orderId);
        setSelectedOrderIds(newSet);
    };

    const toggleAll = () => {
        if (selectedOrderIds.size === orders.length) setSelectedOrderIds(new Set());
        else setSelectedOrderIds(new Set(orders.map(o => o.orderId)));
    };

    // Calculate aggregated demand for Step 3
    const aggregatedDemand = useMemo(() => {
        const demandMap = new Map<string, { productId: number; quantity: number; unitPrice: number }>();

        const selected = orders.filter(o => selectedOrderIds.has(o.orderId));
        selected.forEach(order => {
            (order.orderDetails || []).forEach(item => {
                const name = item.productName || `Sản phẩm #${item.productId}`;
                if (demandMap.has(name)) {
                    demandMap.get(name)!.quantity += item.quantity;
                } else {
                    demandMap.set(name, { productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice });
                }
            });
        });

        return Array.from(demandMap.entries()).map(([name, data]) => ({ name, ...data }));
    }, [orders, selectedOrderIds]);

    const onSubmit = async () => {
        if (selectedOrderIds.size === 0) return;
        setIsSubmitting(true);
        try {
            await productionPlanApi.createProductionPlan({
                plannedDate,
                storeOrderIds: Array.from(selectedOrderIds)
            });
            toast.success('Kế hoạch sản xuất đã được tạo thành công.');
            navigate('/kitchen');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Tạo kế hoạch thất bại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/kitchen')}
                        className="h-10 w-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="orange" className="text-[9px] font-black tracking-widest px-2 py-0 border-0 h-4">COORDINATOR</Badge>
                            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-tight">Lập kế hoạch sản xuất</h1>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium tracking-wide">Gom các đơn hàng đã duyệt và phân bổ sản xuất cho bếp trung tâm.</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Package size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Đã chọn</span>
                            <span className="text-sm font-black text-zinc-200">{selectedOrderIds.size} đơn hàng</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Wizard Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { step: 1, label: 'Thiết lập bếp & Ngày', icon: ChefHat },
                    { step: 2, label: 'Gom đơn hàng chi nhánh', icon: LayoutGrid },
                    { step: 3, label: 'Tổng hợp chỉ tiêu SX', icon: ClipboardCheck },
                ].map((item) => {
                    const isActive = step === item.step;
                    const isDone = step > item.step;
                    return (
                        <div
                            key={item.step}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                                isActive
                                    ? "bg-amber-500/5 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
                                    : isDone
                                        ? "bg-zinc-900/40 border-emerald-500/20"
                                        : "bg-zinc-900/20 border-zinc-800/50"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all",
                                isActive ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" :
                                    isDone ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-500"
                            )}>
                                {isDone ? <CheckCircle2 size={18} /> : item.step}
                            </div>
                            <div className="flex flex-col">
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    isActive ? "text-amber-500" : isDone ? "text-emerald-500" : "text-zinc-600"
                                )}>
                                    Bước {item.step}
                                </span>
                                <span className={cn(
                                    "text-xs font-bold",
                                    isActive ? "text-zinc-100" : "text-zinc-500"
                                )}>
                                    {item.label}
                                </span>
                            </div>
                            {isActive && <ChevronRight size={16} className="ml-auto text-amber-500 animate-pulse" />}
                        </div>
                    );
                })}
            </div>

            {/* Wizard Content */}
            <div className="relative min-h-[400px]">
                {step === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="lg:col-span-2 space-y-6 bg-zinc-900/40 p-8 rounded-[32px] border border-zinc-800/50">
                            <div>
                                <h2 className="text-lg font-black text-zinc-100 uppercase tracking-tight">Cấu hình sản xuất</h2>
                                <p className="text-xs text-zinc-500 font-medium mt-1">Vui lòng chọn bếp thực hiện và ngày mong muốn hoàn tất mẻ hàng.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Bếp Trung Tâm</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="text-left p-6 rounded-2xl border bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/40 overflow-hidden relative group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-amber-500/10 transition-colors"></div>
                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                                                        <ChefHat size={24} />
                                                    </div>
                                                    <div>
                                                        <span className="block text-base font-black uppercase tracking-tighter text-amber-500">
                                                            Bếp Trung Tâm
                                                        </span>
                                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight mt-0.5">Hệ thống sản xuất chính</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full border border-amber-500/30">
                                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">ĐANG HOẠT ĐỘNG</span>
                                                    <CheckCircle2 size={12} className="text-amber-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Ngày lập kế hoạch</label>
                                        <div className="relative group">
                                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                                            <input
                                                type="date"
                                                value={plannedDate}
                                                onChange={(e) => setPlannedDate(e.target.value)}
                                                className="w-full pl-12 pr-4 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
                                        <div className="flex items-center gap-2 text-amber-500">
                                            <Info size={14} strokeWidth={3} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Lưu ý chuyên môn</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed italic">
                                            Kế hoạch sản xuất nên được lập trước ít nhất 18 tiếng để bếp trung tâm có đủ thời gian chuẩn bị nguyên liệu.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end bg-zinc-900/40 p-8 rounded-[32px] border border-zinc-800/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-[80px] -mr-24 -mt-24"></div>
                            <div className="relative z-10 space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-white leading-tight">Sẵn sàng để gom đơn hàng?</h3>
                                    <p className="text-xs text-zinc-500 font-medium tracking-tight">Bước tiếp theo bạn sẽ chọn các đơn hàng chi nhánh đã duyệt để tổng hợp chỉ tiêu.</p>
                                </div>
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!selectedKitchenId || !plannedDate}
                                    className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-900/20 border-0"
                                >
                                    Tiếp tục Bước 2 <ChevronRight size={18} className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                        <div className="bg-zinc-900/40 p-1 rounded-[32px] border border-zinc-800/50 overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h2 className="text-lg font-black text-zinc-100 uppercase tracking-tight">Chọn đơn hàng cần sản xuất</h2>
                                    <p className="text-xs text-zinc-500 font-medium mt-1">Danh sách các đơn hàng đã Approved đang chờ Gom mẻ.</p>
                                </div>
                                <div className="text-xs font-black text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 uppercase tracking-widest">
                                    Đã chọn: {selectedOrderIds.size} / {orders.length} đơn
                                </div>
                            </div>

                            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-zinc-900 z-10 border-b border-zinc-800">
                                        <tr className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">
                                            <th className="px-8 py-4 w-12">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-amber-500/20"
                                                    checked={selectedOrderIds.size === orders.length && orders.length > 0}
                                                    onChange={toggleAll}
                                                />
                                            </th>
                                            <th className="px-4 py-4">Đơn hàng</th>
                                            <th className="px-4 py-4">Chi nhánh</th>
                                            <th className="px-4 py-4">Chi tiết món</th>
                                            <th className="px-8 py-4 text-right">Giá trị</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/30">
                                        {isLoadingOrders ? (
                                            <tr><td colSpan={5} className="px-8 py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div></td></tr>
                                        ) : orders.length === 0 ? (
                                            <tr><td colSpan={5} className="px-8 py-20 text-center text-zinc-600 font-bold uppercase tracking-widest opacity-30">Không có đơn hàng nào chờ gom mẻ</td></tr>
                                        ) : (
                                            orders.map(order => (
                                                <tr
                                                    key={order.orderId}
                                                    className={cn(
                                                        "hover:bg-zinc-800/20 cursor-pointer transition-colors group",
                                                        selectedOrderIds.has(order.orderId) ? "bg-amber-500/[0.03]" : ""
                                                    )}
                                                    onClick={() => toggleSelection(order.orderId)}
                                                >
                                                    <td className="px-8 py-5">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-amber-500/20 group-hover:border-amber-500/50"
                                                            checked={selectedOrderIds.has(order.orderId)}
                                                            readOnly
                                                        />
                                                    </td>
                                                    <td className="px-4 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] font-black text-zinc-100 uppercase tracking-tighter">#ORD-{order.orderId}</span>
                                                            <span className="text-[10px] text-zinc-600 font-medium italic underline decoration-zinc-800 underline-offset-2">Đặt lúc: {new Date(order.orderDate).toLocaleTimeString('vi-VN')}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5">
                                                        <span className="text-[13px] font-bold text-zinc-300">{order.storeName || `Store #${order.storeId}`}</span>
                                                    </td>
                                                    <td className="px-4 py-5">
                                                        <div className="flex flex-wrap gap-1">
                                                            {order.orderDetails?.slice(0, 3).map((i, idx) => (
                                                                <span key={idx} className="text-[10px] px-2 py-0.5 bg-zinc-950/50 text-zinc-500 border border-zinc-800 rounded-md font-medium">
                                                                    {i.productName} (x{i.quantity})
                                                                </span>
                                                            ))}
                                                            {order.orderDetails && order.orderDetails.length > 3 && (
                                                                <span className="text-[9px] px-1.5 py-0.5 text-zinc-600 font-bold">+{order.orderDetails.length - 3} món khác</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="text-[13px] font-black text-zinc-100">{(order.totalAmount || 0).toLocaleString()}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50">
                            <Button variant="ghost" onClick={() => setStep(1)} className="text-zinc-500 hover:text-white font-bold uppercase text-[10px] tracking-widest px-6 h-12">
                                <ArrowLeft size={16} className="mr-2" /> Quay lại Bước 1
                            </Button>
                            <Button
                                className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl px-10 h-14 shadow-xl shadow-amber-900/20 border-0"
                                onClick={() => setStep(3)}
                                disabled={selectedOrderIds.size === 0}
                            >
                                Tổng hợp nhu cầu SX <ChevronRight size={18} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-right-8 duration-500">
                        <div className="lg:col-span-3 space-y-6">
                            <div className="bg-zinc-900/40 rounded-[32px] border border-zinc-800/50 p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-black">
                                        <ClipboardCheck size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-zinc-100 uppercase tracking-tight">Chi tiêu sản xuất tổng hợp</h2>
                                        <p className="text-xs text-zinc-500 font-medium">Các món hàng được gom lại từ tất cả đơn hàng đã chọn.</p>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/30 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-zinc-900/50 text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-800">
                                                <th className="px-8 py-5">Sản phẩm sản xuất</th>
                                                <th className="px-8 py-5 text-right w-48">Tổng định lượng cần</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/40">
                                            {aggregatedDemand.map((item, i) => (
                                                <tr key={i} className="hover:bg-zinc-800/20 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[15px] font-black text-zinc-200 tracking-tighter">{item.name}</span>
                                                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">ID: {item.productId}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="text-xl font-black text-amber-500 tracking-tighter">
                                                            {item.quantity} <span className="text-[10px] text-zinc-500 font-bold ml-1">ĐV</span>
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-zinc-900/50">
                                                <td className="px-8 py-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest text-right">Tổng items sản xuất</td>
                                                <td className="px-8 py-4 text-right">
                                                    <span className="text-lg font-black text-zinc-100">
                                                        {aggregatedDemand.reduce((s, i) => s + i.quantity, 0)}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <Button variant="ghost" onClick={() => setStep(2)} disabled={isSubmitting} className="text-zinc-500 hover:text-white font-bold uppercase text-[10px] tracking-widest px-8">
                                    <ArrowLeft size={16} className="mr-2" /> Quay lại Bước 2
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-zinc-900/40 p-8 rounded-[32px] border border-zinc-800/50 sticky top-8">
                                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6">Xác nhận kế hoạch</h3>

                                <div className="space-y-6 mb-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Bếp sản xuất</p>
                                        <p className="text-sm font-black text-zinc-200">
                                            Bếp Trung Tâm
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Ngày kế hoạch</p>
                                        <p className="text-sm font-black text-zinc-200">
                                            {new Date(plannedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Tổng số đơn hàng gom</p>
                                        <p className="text-sm font-black text-zinc-200">{selectedOrderIds.size} đơn hàng</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-zinc-800">
                                    <Button
                                        onClick={onSubmit}
                                        className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-900/20 border-0"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Chốt kế hoạch...' : <><Save size={18} className="mr-2" /> Chốt Kế hoạch</>}
                                    </Button>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase text-center mt-4 px-4 leading-relaxed tracking-tight">
                                        Sau khi chốt, các đơn hàng này sẽ thay đổi trạng thái và không thể chỉnh sửa.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
