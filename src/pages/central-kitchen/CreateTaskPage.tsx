import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, ChevronRight, CheckCircle2, ChefHat, Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { storeOrderApi } from '../../services/storeOrderApi';
import { productionPlanApi } from '../../services/productionPlan.api';
import { useAuth } from '../../hooks/useAuth';
import type { StoreOrderResponse } from '../../types/storeOrder';
import { cn } from '../../utils/classNames';

export const CreateTaskPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Wizard State
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    // Form Data
    const [plannedDate, setPlannedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedKitchenId, setSelectedKitchenId] = useState<number | ''>(user?.kitchenId || 1);
    const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (step === 2 && orders.length === 0) {
            fetchPendingOrders();
        }
    }, [step, orders.length]);

    const fetchPendingOrders = async () => {
        setIsLoadingOrders(true);
        try {
            const res = await storeOrderApi.getAllOrders({ status: 'APPROVED', size: 100 });
            const validStatuses = ['APPROVED', 'SUBMITTED'];
            const pending = (res.content || []).filter(o => validStatuses.includes(o.status.toUpperCase()) && !o.planId);
            setOrders(pending);
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
        if (selectedOrderIds.size === 0 || !selectedKitchenId) return;
        setIsSubmitting(true);
        try {
            await productionPlanApi.createProductionPlan({
                kitchenId: Number(selectedKitchenId),
                plannedDate,
                kitchenId: Number(selectedKitchenId),
                storeOrderIds: Array.from(selectedOrderIds)
            });
            toast.success('Kế hoạch sản xuất đã được tạo thành công.');
            navigate('/kitchen/production-plans');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Tạo kế hoạch thất bại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-10 max-w-[1200px] mx-auto pb-20 animate-in fade-in duration-700 pt-8 px-4">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex items-center gap-6">
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate('/kitchen')} 
                        className="h-14 w-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-amber-500 rounded-[1.5rem] transition-all shadow-sm group/back"
                    >
                        <ArrowLeft size={24} className="group-hover/back:-translate-x-1 transition-transform" />
                    </Button>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Badge variant="orange" className="text-[10px] font-black tracking-[0.2em] px-3 h-5 border-0 shadow-sm italic uppercase">TASK-INCEPTION V1.0</Badge>
                            <div className="w-1 h-1 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic">Standard Protocol</span>
                        </div>
                        <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase tracking-tighter italic">Lập <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Kế hoạch sản xuất</span></h1>
                        <p className="text-xs text-[var(--text-secondary)]/60 font-black uppercase tracking-[0.2em] italic">Khởi động kế hoạch sản xuất bằng cách gom đơn hàng chi nhánh hợp lệ.</p>
                    </div>
                </div>
            </div>

            {/* Wizard Progress Section */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] p-8 md:p-12 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
                
                <div className="flex items-center justify-between relative px-6 md:px-20 mb-16">
                    <div className="absolute top-1/2 left-6 md:left-20 right-6 md:right-20 h-1 bg-[var(--bg-root)] border border-[var(--border-primary)]/10 -z-0 -translate-y-1/2 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
                    </div>
                    {[1, 2, 3].map(num => (
                        <div key={num} className="flex flex-col items-center gap-4 relative z-10">
                            <div className={cn(
                                "w-14 h-14 rounded-[1.25rem] flex items-center justify-center font-black border-2 transition-all duration-500",
                                step >= num ? "border-amber-500 bg-[var(--bg-card)] text-amber-500 shadow-xl shadow-amber-500/10 scale-110" : "border-[var(--border-primary)] bg-[var(--bg-root)] text-[var(--text-secondary)]/40"
                            )}>
                                {step > num ? <CheckCircle2 size={24} className="text-amber-500" strokeWidth={3} /> : <span className="italic">{num}</span>}
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-[0.2em] italic hidden sm:block",
                                step >= num ? "text-amber-500" : "text-[var(--text-secondary)]/40"
                            )}>
                                {num === 1 ? 'Chọn Bếp' : num === 2 ? 'Chọn Đơn' : 'Xác nhận Demand'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step Content Area */}
                <div className="min-h-[400px]">
                    {step === 1 && (
                        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
                             <div className="flex items-center gap-4 border-b border-[var(--border-primary)]/10 pb-6">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                    <ChefHat size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">Bước 1: Thiết lập Trạm & Thời gian</h2>
                                    <p className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest mt-1 italic">Chỉ định đơn vị thực thi và thời điểm kích hoạt kế hoạch</p>
                                </div>
                             </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest italic flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-500" /> Bếp Trung Tâm Chịu Trách Nhiệm
                                    </label>
                                    <select
                                        className="w-full h-16 px-6 bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-[1.25rem] text-sm font-black text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-amber-500/5 transition-all appearance-none cursor-pointer italic"
                                        value={selectedKitchenId}
                                        onChange={(e) => setSelectedKitchenId(Number(e.target.value) || '')}
                                    >
                                        <option value="">-- Chọn Bếp --</option>
                                        <option value={1}>Bếp Trung Tâm Gò Vấp</option>
                                        <option value={2}>Bếp Trung Tâm Quận 1</option>
                                        <option value={3}>Bếp Trung Tâm Thủ Đức</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest italic flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-indigo-500" /> Ngày sản xuất dự kiến
                                    </label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={plannedDate}
                                        onChange={(e) => setPlannedDate(e.target.value)}
                                        className="w-full h-16 px-6 bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-[1.25rem] text-sm font-black text-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/5 transition-all cursor-pointer italic uppercase"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-10">
                                <Button
                                    className="h-16 px-12 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black uppercase text-[10px] tracking-[0.3em] rounded-full shadow-lg shadow-amber-500/10 italic transition-all hover:scale-105 active:scale-95 border-0"
                                    onClick={() => setStep(2)}
                                    disabled={!selectedKitchenId || !plannedDate}
                                >
                                    Tiếp tục quy trình <ChevronRight size={18} className="ml-3" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-700">
                             <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[var(--border-primary)]/10 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">Bước 2: Tuyển chọn Đơn hàng</h2>
                                        <p className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest mt-1 italic">Gom các đơn hàng đã Approved vào kế hoạch sản xuất tập trung</p>
                                    </div>
                                </div>
                                <div className="bg-[var(--bg-root)] px-6 py-3 rounded-full border border-[var(--border-primary)] shadow-inner">
                                    <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic mr-3">Phân bổ:</span>
                                    <span className="text-sm font-black text-amber-500 italic tabular-nums">{selectedOrderIds.size} <span className="text-[10px] text-[var(--text-secondary)]/20 mx-1">/</span> {orders.length} Đơn hàng</span>
                                </div>
                             </div>

                            <div className="bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-[2.5rem] overflow-hidden shadow-inner relative group/table">
                                <div className="overflow-x-auto max-h-[500px] no-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-[var(--bg-root)] z-10 border-b border-[var(--border-primary)]/20">
                                            <tr className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic">
                                                <th className="px-8 py-6 w-16 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-5 h-5 rounded-md border-[var(--border-primary)] bg-[var(--bg-card)] text-amber-500 focus:ring-amber-500/20 cursor-pointer transition-all appearance-none border checked:bg-amber-500 relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-black checked:after:text-[12px] shadow-sm" 
                                                        checked={orders.length > 0 && selectedOrderIds.size === orders.length} 
                                                        onChange={toggleAll} 
                                                    />
                                                </th>
                                                <th className="px-6 py-6">Mã định danh đơn</th>
                                                <th className="px-6 py-6">Cửa hàng thực thi</th>
                                                <th className="px-8 py-6">Cấu trúc món định mức</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-primary)]/5">
                                            {isLoadingOrders ? (
                                                <tr><td colSpan={4} className="px-10 py-40 text-center">
                                                    <div className="flex flex-col items-center gap-6">
                                                        <div className="w-12 h-12 border-2 border-amber-500/10 border-t-amber-500 rounded-full animate-spin" />
                                                        <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.4em] italic animate-pulse">Đang rà soát dữ liệu...</span>
                                                    </div>
                                                </td></tr>
                                            ) : orders.length === 0 ? (
                                                <tr><td colSpan={4} className="px-10 py-40 text-center">
                                                    <div className="flex flex-col items-center gap-6 opacity-20">
                                                        <Package size={48} className="text-[var(--text-secondary)]" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] italic">Hồ sơ unassigned hiện đang trống</span>
                                                    </div>
                                                </td></tr>
                                            ) : (
                                                orders.map(order => (
                                                    <tr 
                                                        key={order.orderId} 
                                                        className={cn(
                                                            "hover:bg-[var(--text-primary)]/[0.02] cursor-pointer transition-colors group",
                                                            selectedOrderIds.has(order.orderId) ? 'bg-amber-500/[0.03]' : ''
                                                        )} 
                                                        onClick={() => toggleSelection(order.orderId)}
                                                    >
                                                        <td className="px-8 py-6 text-center">
                                                            <input 
                                                                type="checkbox" 
                                                                className="w-5 h-5 rounded-md border-[var(--border-primary)] bg-[var(--bg-card)] text-amber-500 focus:ring-amber-500/20 cursor-pointer transition-all appearance-none border checked:bg-amber-500 relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-black checked:after:text-[12px] shadow-sm" 
                                                                checked={selectedOrderIds.has(order.orderId)} 
                                                                readOnly 
                                                            />
                                                        </td>
                                                        <td className="px-6 py-6">
                                                            <span className="text-sm font-black text-[var(--text-primary)] group-hover:text-amber-500 uppercase italic tracking-tighter">#ORD-{order.orderId}</span>
                                                        </td>
                                                        <td className="px-6 py-6">
                                                            <span className="text-xs font-black text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors uppercase italic">{order.storeName || `Chi nhánh #${order.storeId}`}</span>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-wrap gap-2">
                                                                {order.orderDetails?.slice(0, 2).map((i, idx) => (
                                                                    <Badge key={idx} variant="secondary" className="bg-[var(--bg-card)] text-[8px] font-black border-[var(--border-primary)] px-2 py-0.5 uppercase italic tracking-tighter rounded-lg">
                                                                        {i.productName} (x{i.quantity})
                                                                    </Badge>
                                                                ))}
                                                                {order.orderDetails && order.orderDetails.length > 2 && (
                                                                    <span className="text-[9px] text-[var(--text-secondary)]/30 font-black italic ml-1">+{order.orderDetails.length - 2} Items</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-between pt-10">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setStep(1)}
                                    className="h-16 px-10 text-[var(--text-secondary)]/40 hover:text-[var(--text-primary)] font-black uppercase text-[10px] tracking-[0.3em] rounded-full italic transition-all"
                                >
                                    <ArrowLeft size={18} className="mr-3" /> Quay lại trạm thiết lập
                                </Button>
                                <Button 
                                    className="h-16 px-12 bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.3em] rounded-full shadow-lg shadow-indigo-500/10 italic transition-all hover:scale-105 active:scale-95 border-0" 
                                    onClick={() => setStep(3)} 
                                    disabled={selectedOrderIds.size === 0}
                                >
                                    Phân tích Nhu cầu <ChevronRight size={18} className="ml-3" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-10 animate-in slide-in-from-right-8 fade-in duration-700">
                             <div className="flex items-center gap-4 border-b border-[var(--border-primary)]/10 pb-6">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-sm">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">Bước 3: Xác quyết Tổng lượng</h2>
                                    <p className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest mt-1 italic">Tổng hợp thành phẩm vĩnh cửu từ tệp đơn tuyển chọn</p>
                                </div>
                             </div>

                            <div className="bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-[3rem] overflow-hidden shadow-inner relative group/table">
                                <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-[var(--bg-root)] z-10 border-b border-[var(--border-primary)]/20">
                                            <tr className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic">
                                                <th className="px-10 py-6">Món Sản Xuất (Aggregate Dish)</th>
                                                <th className="px-10 py-6 text-right w-60">Số lượng gom kế hoạch (Qty)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-primary)]/5">
                                            {aggregatedDemand.map((item, i) => (
                                                <tr key={i} className="hover:bg-emerald-500/[0.02] transition-colors group">
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 group-hover:bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0)] group-hover:shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all"></div>
                                                            <span className="text-sm font-black text-[var(--text-primary)] group-hover:text-emerald-500 uppercase italic tracking-tight">{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6 text-right">
                                                        <span className="text-2xl font-black text-emerald-500 italic tabular-nums drop-shadow-sm">{item.quantity}</span>
                                                        <span className="text-[9px] font-black text-[var(--text-secondary)]/30 uppercase tracking-widest italic ml-3">Units</span>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-[var(--bg-primary)]/5">
                                                <td className="px-10 py-6 text-right text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic">Toàn kế hoạch sản xuất:</td>
                                                <td className="px-10 py-6 text-right">
                                                    <span className="text-3xl font-black text-[var(--text-primary)] italic tabular-nums">{aggregatedDemand.reduce((s, i) => s + i.quantity, 0)}</span>
                                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic ml-4">Total Items</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-between pt-10 border-t border-[var(--border-primary)]/10 items-center">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setStep(2)} 
                                    disabled={isSubmitting}
                                    className="h-16 px-10 text-[var(--text-secondary)]/40 hover:text-[var(--text-primary)] font-black uppercase text-[10px] tracking-[0.3em] rounded-full italic transition-all"
                                >
                                    <ArrowLeft size={18} className="mr-3" /> Quay lại tuyển chọn
                                </Button>
                                <Button
                                    onClick={onSubmit}
                                    className="h-20 px-16 bg-gradient-to-br from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-black font-black uppercase text-[10px] tracking-[0.4em] rounded-[2rem] shadow-xl shadow-emerald-500/10 border-0 transition-all hover:scale-[1.05] active:scale-95 italic"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-4">
                                            <RefreshCw className="animate-spin h-5 w-5" />
                                            <span>Niêm phong...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <Save size={20} />
                                            <span>Công bố Production Plan</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Add RefreshCw import that was missing in certain paths
const RefreshCw = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={cn("lucide lucide-refresh-cw", className)}
    >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M3 21v-5h5"/>
    </svg>
);
