import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Truck, ArrowLeft, Save, CheckCircle2,
    User, Phone, Package, Calendar, ChevronRight, Hash,
    MapPin, ClipboardList, Info as InfoIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { shipmentApi } from '../../services/shipment.api';
import { productionPlanApi } from '../../services/productionPlan.api';
import { storeApi } from '../../services/store.api';
import { storeOrderApi } from '../../services/storeOrderApi';
import type { CreateShipmentRequest } from '../../types/shipment';
import type { StoreResponse } from '../../types/store';
import type { StoreOrderResponse } from '../../types/storeOrder';
import type { ProductionPlanSummaryResponse } from '../../types/productionPlan';
import { cn } from '../../utils/classNames';

export const CreateShipment = () => {
    const navigate = useNavigate();

    // Data States
    const [availablePlans, setAvailablePlans] = useState<ProductionPlanSummaryResponse[]>([]);
    const [availableStores, setAvailableStores] = useState<StoreResponse[]>([]);
    const [availableOrders, setAvailableOrders] = useState<StoreOrderResponse[]>([]);

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [form, setForm] = useState({
        productionPlanId: '',
        storeId: '',
        storeOrderIds: [] as number[],
        driverName: '',
        driverPhone: '',
        vehicleInfo: '',
        shippingFee: '',
        note: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [planRes, storeRes] = await Promise.all([
                productionPlanApi.getAllProductionPlans({ size: 100 }),
                storeApi.getAllStores({ size: 100 })
            ]);

            // Allow shipments for FINISHED or COMPLETED plans (allocated)
            const validPlans = (planRes.content || []).filter(p =>
                p.status === 'FINISHED' ||
                p.status === 'COMPLETED' ||
                p.status === 'PRODUCED' ||
                p.status === 'READY_TO_PRODUCE'
            );

            setAvailablePlans(validPlans);
            setAvailableStores(storeRes.data?.content || []);
        } catch (error) {
            toast.error('Không thể tải các lựa chọn ban đầu');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch orders when store changes
    useEffect(() => {
        const fetchStoreOrders = async () => {
            if (!form.storeId) {
                setAvailableOrders([]);
                return;
            }
            try {
                const ordersRes = await storeOrderApi.getAllOrders({ size: 100 });
                const storeOrders = (ordersRes.content || []).filter(o =>
                    o.storeId.toString() === form.storeId &&
                    (o.status === 'ALLOCATED' || o.status === 'APPROVED')
                );
                setAvailableOrders(storeOrders);
            } catch (error) {
                toast.error('Không thể tải đơn hàng của chi nhánh này');
            }
        };
        fetchStoreOrders();
    }, [form.storeId]);

    const handleCreate = async () => {
        const productionPlanId = Number(form.productionPlanId);
        const storeId = Number(form.storeId);

        if (!productionPlanId) return toast.error('Vui lòng chọn Kế hoạch sản xuất');
        if (!storeId) return toast.error('Vui lòng chọn Cửa hàng');
        if (form.storeOrderIds.length === 0) return toast.error('Vui lòng chọn ít nhất 1 đơn hàng');

        setIsSubmitting(true);
        try {
            const request: CreateShipmentRequest = {
                productionPlanId,
                storeId,
                storeOrderIds: form.storeOrderIds,
                driverName: form.driverName || undefined,
                driverPhone: form.driverPhone || undefined,
                vehicleInfo: form.vehicleInfo || undefined,
                shippingFee: form.shippingFee ? Number(form.shippingFee) : undefined,
                note: form.note || undefined
            };

            await shipmentApi.createShipment(request);
            toast.success('Đơn vận chuyển đã được tạo thành công!');
            navigate('/shipment');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn vận chuyển');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleOrder = (orderId: number) => {
        setForm(prev => {
            const current = [...prev.storeOrderIds];
            if (current.includes(orderId)) {
                return { ...prev, storeOrderIds: current.filter(id => id !== orderId) };
            } else {
                return { ...prev, storeOrderIds: [...current, orderId] };
            }
        });
    };

    const toggleAllOrders = () => {
        if (form.storeOrderIds.length === availableOrders.length) {
            setForm(prev => ({ ...prev, storeOrderIds: [] }));
        } else {
            setForm(prev => ({ ...prev, storeOrderIds: availableOrders.map(o => o.orderId) }));
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/shipment')}
                        className="h-10 w-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="orange" className="text-[9px] font-black tracking-widest px-2 py-0 border-0 h-4 uppercase">Coordinator</Badge>
                            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-tight">Tạo đơn vận chuyển</h1>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium tracking-wide">Điều phối xe và chuẩn bị hàng cho các chi nhánh.</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/shipment')}
                        className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/50 uppercase text-[10px] font-black tracking-widest h-12 px-6 rounded-2xl"
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={isSubmitting || isLoading}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs tracking-widest px-8 h-12 shadow-xl shadow-amber-900/20 border-0 flex items-center gap-2"
                    >
                        {isSubmitting ? 'Đang tạo...' : <><Save size={18} /> Xuất đơn vận chuyển</>}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Primary Info Card */}
                    <div className="bg-zinc-900/40 rounded-[32px] border border-zinc-800/50 p-8 space-y-8">
                        <div>
                            <h2 className="text-sm font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                                <ClipboardList size={16} className="text-amber-500" /> Thông tin cốt lõi
                            </h2>
                            <p className="text-[11px] text-zinc-600 font-medium mt-1 uppercase tracking-tighter">Bắt buộc để hệ thống đối soát sản lượng</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Kế hoạch sản xuất liên quan</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none pl-12 pr-4 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-bold text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all cursor-pointer"
                                        value={form.productionPlanId}
                                        onChange={e => setForm(prev => ({ ...prev, productionPlanId: e.target.value }))}
                                    >
                                        <option value="">-- Chọn Kế hoạch --</option>
                                        {availablePlans.map(p => (
                                            <option key={p.planId} value={p.planId}>#{p.planId} - {p.planName}</option>
                                        ))}
                                    </select>
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Cửa hàng đích (Ship-to)</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none pl-12 pr-4 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-bold text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all cursor-pointer"
                                        value={form.storeId}
                                        onChange={e => setForm(prev => ({ ...prev, storeId: e.target.value, storeOrderIds: [] }))}
                                    >
                                        <option value="">-- Chọn Cửa hàng --</option>
                                        {availableStores.map(s => {
                                            const sId = s.id || (s as any).storeId;
                                            return <option key={sId} value={sId}>{s.name} (CN #{sId})</option>
                                        })}
                                    </select>
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                </div>
                            </div>
                        </div>

                        {/* Order Selection Table */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Gom đơn hàng vào Shipment</label>
                                {availableOrders.length > 0 && (
                                    <button
                                        onClick={toggleAllOrders}
                                        className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-400 transition-colors"
                                    >
                                        {form.storeOrderIds.length === availableOrders.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả đơn'}
                                    </button>
                                )}
                            </div>

                            <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/40">
                                {availableOrders.length > 0 ? (
                                    <div className="divide-y divide-zinc-800/50">
                                        {availableOrders.map(order => (
                                            <div
                                                key={order.orderId}
                                                onClick={() => toggleOrder(order.orderId)}
                                                className={cn(
                                                    "flex items-center gap-4 p-4 cursor-pointer transition-colors group",
                                                    form.storeOrderIds.includes(order.orderId) ? "bg-amber-500/5" : "hover:bg-zinc-800/30"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                                    form.storeOrderIds.includes(order.orderId)
                                                        ? "bg-amber-500 border-amber-500 text-black"
                                                        : "border-zinc-800 bg-zinc-900 group-hover:border-zinc-700"
                                                )}>
                                                    {form.storeOrderIds.includes(order.orderId) && <CheckCircle2 size={12} strokeWidth={4} />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-zinc-200 uppercase tracking-tighter">Đơn #{order.orderId}</span>
                                                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 border-0">{order.status}</Badge>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight mt-0.5">
                                                        {order.orderDetails?.length || 0} món hàng — Tổng: {(order.totalAmount || 0).toLocaleString()}đ
                                                    </p>
                                                </div>
                                                <ChevronRight size={14} className="text-zinc-800 group-hover:text-zinc-600" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-10 text-center flex flex-col items-center gap-3 opacity-20">
                                        <Package size={48} className="text-zinc-600" />
                                        <span className="text-xs font-black text-zinc-600 uppercase tracking-widest italic">Vui lòng chọn chi nhánh để xem đơn hàng</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Driver & Logistics Card */}
                    <div className="bg-zinc-900/40 rounded-[32px] border border-zinc-800/50 p-8 space-y-8">
                        <div>
                            <h2 className="text-sm font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                                <Truck size={16} className="text-indigo-500" /> Logistics & Vận tải
                            </h2>
                            <p className="text-[11px] text-zinc-600 font-medium mt-1 uppercase tracking-tighter">Thông tin liên hệ tài xế và phương tiện</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <User size={12} /> Tên tài xế
                                    </label>
                                    <Input
                                        className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl font-bold focus:border-indigo-500/50"
                                        placeholder="Ví dụ: Nguyễn Văn A"
                                        value={form.driverName}
                                        onChange={e => setForm(prev => ({ ...prev, driverName: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Phone size={12} /> Số điện thoại
                                    </label>
                                    <Input
                                        className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl font-bold focus:border-indigo-500/50"
                                        placeholder="Ví dụ: 090 123 4567"
                                        value={form.driverPhone}
                                        onChange={e => setForm(prev => ({ ...prev, driverPhone: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Truck size={12} /> Biển số / Thông tin xe
                                    </label>
                                    <Input
                                        className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl font-bold focus:border-indigo-500/50"
                                        placeholder="Ví dụ: 59A - 123.45"
                                        value={form.vehicleInfo}
                                        onChange={e => setForm(prev => ({ ...prev, vehicleInfo: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Hash size={12} /> Phí ship dự kiến (VNĐ)
                                    </label>
                                    <Input
                                        type="number"
                                        className="h-14 bg-zinc-950 border-zinc-800 rounded-2xl font-bold focus:border-indigo-500/50"
                                        placeholder="Ví dụ: 50000"
                                        value={form.shippingFee}
                                        onChange={e => setForm(prev => ({ ...prev, shippingFee: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Summary & Guidance */}
                <div className="space-y-6">
                    <div className="bg-zinc-900/40 p-8 rounded-[32px] border border-zinc-800/50 sticky top-8 space-y-8">
                        <div>
                            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Chi tiết kiện hàng</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                                    <span className="text-[11px] font-bold text-zinc-600 uppercase">Tổng số đơn</span>
                                    <span className="text-sm font-black text-zinc-200">{form.storeOrderIds.length}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                                    <span className="text-[11px] font-bold text-zinc-600 uppercase">Trạng thái tạo</span>
                                    <Badge variant="orange" className="font-black px-2 py-0 border-0">CREATED</Badge>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-[11px] font-bold text-zinc-600 uppercase">Đối tác VC</span>
                                    <span className="text-sm font-black text-zinc-400">{form.driverName || 'Chưa định danh'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-amber-500/[0.03] border border-amber-500/10 space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.05] blur-2xl"></div>
                            <div className="flex items-center gap-2 text-amber-500 relative z-10">
                                <InfoIcon size={14} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Hướng dẫn</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed tracking-tight relative z-10 italic">
                                Hãy đảm bảo rằng các món hàng trong đơn đã được sản xuất xong và sẵn sàng tại kho xuất. Đơn hàng sẽ chuyển sang trạng thái "SHIPPING" ngay sau khi xuất đơn.
                            </p>
                        </div>

                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting || isLoading || form.storeOrderIds.length === 0}
                            className="w-full h-16 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-900/20 border-0"
                        >
                            {isSubmitting ? 'Đang xuất đơn...' : 'Xuất đơn ngay'}
                        </Button>
                    </div>

                    <div className="bg-emerald-500/5 p-6 rounded-[24px] border border-emerald-500/10 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                            <CheckCircle2 size={18} />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Tiếp theo</span>
                            <p className="text-[11px] text-zinc-500 font-medium leading-tight">Sau khi tạo, bếp trung tâm sẽ chuẩn bị kiện hàng (PREPARED) trước khi tài xế bắt đầu hành trình (IN_TRANSIT).</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
