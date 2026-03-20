import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Truck, ArrowLeft, Save, CheckCircle2,
    Calendar, MapPin, ClipboardList, Info as InfoIcon,
    PlusCircle, Trash2, Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { shipmentApi } from '../../services/shipment.api';
import { productionPlanApi } from '../../services/productionPlan.api';
import { storeOrderApi } from '../../services/storeOrderApi';
import type { CreateShipmentRequest, AhamoveServiceIdType } from '../../types/shipment';
import type { StoreResponse } from '../../types/store';
import type { StoreOrderResponse } from '../../types/storeOrder';
import type { ProductionPlanSummaryResponse } from '../../types/productionPlan';
import { cn } from '../../utils/classNames';

export const CreateShipment = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Data States
    const [availablePlans, setAvailablePlans] = useState<ProductionPlanSummaryResponse[]>([]);
    const [availableStores, setAvailableStores] = useState<StoreResponse[]>([]);
    const [allOrders, setAllOrders] = useState<StoreOrderResponse[]>([]);

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [form, setForm] = useState({
        ahamoveServiceId: 'SGN-BIKE' as AhamoveServiceIdType,
        productionPlanId: '',
        remarks: '',
        dropPoints: [
            { id: Date.now(), storeId: '', storeOrderIds: [] as number[], remarks: '' }
        ]
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Handle auto-fill from Allocation Matrix
    useEffect(() => {
        const state = location.state as any;
        if (!state?.planId || form.productionPlanId) return;

        const updates: Partial<typeof form> = {
            productionPlanId: state.planId.toString()
        };

        // Pre-fill drop points from allocated storeIds
        if (Array.isArray(state.storeIds) && state.storeIds.length > 0) {
            updates.dropPoints = state.storeIds.map((storeId: number) => ({
                id: Date.now() + storeId,
                storeId: storeId.toString(),
                storeOrderIds: [],
                remarks: ''
            }));
        }

        setForm(prev => ({ ...prev, ...updates }));
        toast.success(`Đã tự động chọn Kế hoạch: ${state.planName || state.planId}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [planRes, ordersRes] = await Promise.all([
                productionPlanApi.getAllProductionPlans({ size: 100 }),
                storeOrderApi.getAllOrders({ size: 500 }) // Fetch more to cover all branches
            ]);

            const validPlans = (planRes.content || []).filter(p =>
                p.status === 'FINISHED' ||
                p.status === 'COMPLETED' ||
                p.status === 'PRODUCED' ||
                p.status === 'READY_TO_PRODUCE'
            );
            
            const orders = ordersRes.content || [];
            
            // Lấy danh sách Store từ Order có sẵn thay vì gọi storeApi để tránh lỗi 403 Permission
            const activeStoreMap = new Map<number, StoreResponse>();
            orders.forEach(o => {
                const isReady = o.status === 'ALLOCATED' || o.status === 'APPROVED';
                if (isReady && o.storeId && !activeStoreMap.has(o.storeId)) {
                    activeStoreMap.set(o.storeId, {
                        id: o.storeId,
                        name: o.storeName || `Chi nhánh ${o.storeId}`
                    } as StoreResponse);
                }
            });

            setAvailablePlans(validPlans);
            setAvailableStores(Array.from(activeStoreMap.values()));
            setAllOrders(orders);
        } catch (error) {
            toast.error('Không thể tải các lựa chọn ban đầu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        const productionPlanId = Number(form.productionPlanId);

        if (!productionPlanId) return toast.error('Vui lòng chọn Kế hoạch sản xuất');
        if (!form.ahamoveServiceId) return toast.error('Vui lòng chọn loại xe hỗ trợ.');
        
        // Lấy drop point đầu tiên hợp lệ để gán storeId và storeOrderIds (Backend hiện tại yêu cầu 1 store)
        const primaryDropPoint = form.dropPoints.find(dp => dp.storeId && dp.storeOrderIds.length > 0);
        
        if (!primaryDropPoint) {
            if (!form.dropPoints[0].storeId) return toast.error('Vui lòng chọn cửa hàng');
            if (form.dropPoints[0].storeOrderIds.length === 0) return toast.error('Vui lòng chọn ít nhất 1 đơn hàng');
            return toast.error('Cần ít nhất 1 điểm giao có gắn đơn hàng.');
        }

        const validDropPoints = form.dropPoints.filter(dp => dp.storeId && dp.storeOrderIds.length > 0);
        
        // Ensure no duplicate stores in drop points
        const storeIds = validDropPoints.map(dp => dp.storeId);
        if (new Set(storeIds).size !== storeIds.length) {
            return toast.error('Các điểm giao không được trùng lặp cửa hàng.');
        }

        setIsSubmitting(true);
        try {
            const request: CreateShipmentRequest = {
                ahamoveServiceId: form.ahamoveServiceId,
                productionPlanId,
                storeId: Number(primaryDropPoint.storeId),
                storeOrderIds: primaryDropPoint.storeOrderIds,
                remarks: form.remarks || undefined, 
                dropPoints: validDropPoints.map(dp => ({
                    storeId: Number(dp.storeId),
                    storeOrderIds: dp.storeOrderIds,
                    remarks: dp.remarks || undefined 
                }))
            };

            console.log('Shipment Payload:', request);

            const response = await shipmentApi.createShipment(request);
            
            // Automatically mark the shipment as PREPARED (Sẵn sàng) right after creation
            if (response && response.shipmentId) {
                try {
                    await shipmentApi.prepareShipment(response.shipmentId);
                } catch (e) {
                    console.error('Auto-prepare failed:', e);
                    // We don't block the success message if only prepare fails, 
                    // since the shipment was created anyway.
                }
            }
            
            toast.success('Đơn vận chuyển đã được tạo thành công!');
            navigate('/shipment');
        } catch (error: any) {
            console.error('Shipment error:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn vận chuyển');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addDropPoint = () => {
        setForm(prev => ({
            ...prev,
            dropPoints: [...prev.dropPoints, { id: Date.now(), storeId: '', storeOrderIds: [], remarks: '' }]
        }));
    };

    const removeDropPoint = (id: number) => {
        setForm(prev => ({
            ...prev,
            dropPoints: prev.dropPoints.filter(dp => dp.id !== id)
        }));
    };

    const updateDropPoint = (id: number, field: string, value: any) => {
        setForm(prev => ({
            ...prev,
            dropPoints: prev.dropPoints.map(dp => {
                if (dp.id === id) {
                    // Reset orders if store changed
                    if (field === 'storeId' && dp.storeId !== value) {
                        return { ...dp, [field]: value, storeOrderIds: [] };
                    }
                    return { ...dp, [field]: value };
                }
                return dp;
            })
        }));
    };

    const toggleOrderForDropPoint = (dropPointId: number, orderId: number) => {
        setForm(prev => ({
            ...prev,
            dropPoints: prev.dropPoints.map(dp => {
                if (dp.id === dropPointId) {
                    const current = [...dp.storeOrderIds];
                    if (current.includes(orderId)) {
                        return { ...dp, storeOrderIds: current.filter(id => id !== orderId) };
                    } else {
                        return { ...dp, storeOrderIds: [...current, orderId] };
                    }
                }
                return dp;
            })
        }));
    };

    const toggleAllOrdersForDropPoint = (dropPointId: number, storeId: string) => {
        const branchOrders = allOrders.filter(o => 
            o.storeId.toString() === storeId && 
            (o.status === 'ALLOCATED' || o.status === 'APPROVED')
        );
        
        setForm(prev => ({
            ...prev,
            dropPoints: prev.dropPoints.map(dp => {
                if (dp.id === dropPointId) {
                    if (dp.storeOrderIds.length === branchOrders.length) {
                        return { ...dp, storeOrderIds: [] };
                    } else {
                        return { ...dp, storeOrderIds: branchOrders.map(o => o.orderId) };
                    }
                }
                return dp;
            })
        }));
    };

    const getTotalOrdersSelected = () => {
        return form.dropPoints.reduce((acc, dp) => acc + dp.storeOrderIds.length, 0);
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
                            <Badge variant="orange" className="text-[9px] font-black tracking-widest px-2 py-0 border-0 h-4 uppercase bg-[#DE802B]/20 text-[#DE802B]">Bếp trung tâm</Badge>
                            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-tight">Tạo đơn vận chuyển</h1>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium tracking-wide">Tạo lệnh xuất kho cho bộ phận Bếp chuẩn bị hàng.</p>
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
                        className="bg-[#DE802B] hover:bg-[#c97327] text-black font-black uppercase text-xs tracking-widest px-8 h-12 shadow-xl shadow-[#DE802B]/20 border-0 flex items-center gap-2"
                    >
                        {isSubmitting ? 'Đang gửi...' : <><Save size={18} /> Gửi đến bếp</>}
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
                                <ClipboardList size={16} className="text-[#5C6F2B]" /> Cấu hình cốt lõi
                            </h2>
                            <p className="text-[11px] text-zinc-600 font-medium mt-1 uppercase tracking-tighter">Bắt buộc để hệ thống đối soát sản lượng</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Kế hoạch sản xuất liên quan</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none pl-12 pr-4 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-bold text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#DE802B]/20 focus:border-[#DE802B]/50 transition-all cursor-pointer"
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
                                <label className="text-[10px] font-black text-[#DE802B] uppercase tracking-widest ml-1">Loại xe vận chuyển (AhaMove)</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none pl-12 pr-4 h-14 bg-[#DE802B]/5 border border-[#DE802B]/30 rounded-2xl text-sm font-bold text-[#DE802B] focus:outline-none focus:ring-2 focus:ring-[#DE802B]/50 transition-all cursor-pointer"
                                        value={form.ahamoveServiceId}
                                        onChange={e => setForm(prev => ({ ...prev, ahamoveServiceId: e.target.value as AhamoveServiceIdType }))}
                                    >
                                        <option value="SGN-BIKE">Bike (Xe máy)</option>
                                        <option value="SGN-TRUCK-500">Truck (Xe tải 500kg)</option>
                                        <option value="SGN-TRUCK-1000">Truck (Xe tải 1000kg)</option>
                                        <option value="SGN-PREMIUM">Premium (Giao Siêu Tốc)</option>
                                    </select>
                                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DE802B]" size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Routing / Drop Points */}
                    <div className="bg-zinc-900/40 rounded-[32px] border border-zinc-800/50 p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={16} className="text-[#DE802B]" /> Lộ trình & Các điểm giao
                                </h2>
                                <p className="text-[11px] text-zinc-600 font-medium mt-1 uppercase tracking-tighter">
                                    Thêm các chi nhánh cần giao trên cùng chuyến xe.
                                </p>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-[#5C6F2B]/50 text-[#5C6F2B] hover:bg-[#5C6F2B]/10 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2"
                                onClick={addDropPoint}
                            >
                                <PlusCircle size={14}/> Thêm điểm giao
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {form.dropPoints.map((dp, idx) => {
                                const branchOrders = dp.storeId 
                                    ? allOrders.filter(o => o.storeId.toString() === dp.storeId && (o.status === 'ALLOCATED' || o.status === 'APPROVED'))
                                    : [];

                                return (
                                    <div key={dp.id} className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-3xl space-y-5 relative group">
                                        <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-zinc-500 text-xs shadow-lg">
                                            {idx + 1}
                                        </div>
                                        {form.dropPoints.length > 1 && (
                                            <button 
                                                onClick={() => removeDropPoint(dp.id)}
                                                className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 transition-colors p-2"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}

                                        <div className="space-y-3 pt-2 w-full md:w-3/4">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Cửa hàng đích (Stop #{idx + 1})</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full appearance-none pl-12 pr-4 h-12 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-bold text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#5C6F2B]/20 focus:border-[#5C6F2B]/50 transition-all cursor-pointer"
                                                    value={dp.storeId}
                                                    onChange={e => updateDropPoint(dp.id, 'storeId', e.target.value)}
                                                >
                                                    <option value="">-- Chọn Cửa hàng --</option>
                                                    {availableStores.map(s => {
                                                        const sId = s.id || (s as any).storeId;
                                                        return <option key={sId} value={sId}>{s.name} (CN #{sId})</option>
                                                    })}
                                                </select>
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                            </div>
                                        </div>

                                        {/* Orders Selection for this drop point */}
                                        {dp.storeId && (
                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Gom đơn hàng cho điểm giao này</label>
                                                    {branchOrders.length > 0 && (
                                                        <button
                                                            onClick={() => toggleAllOrdersForDropPoint(dp.id, dp.storeId)}
                                                            className="text-[10px] font-black text-[#5C6F2B] uppercase tracking-widest hover:text-[#7a913e] transition-colors"
                                                        >
                                                            {dp.storeOrderIds.length === branchOrders.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả đơn'}
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
                                                    {branchOrders.length > 0 ? (
                                                        <div className="divide-y divide-zinc-800/50 max-h-60 overflow-y-auto custom-scrollbar">
                                                            {branchOrders.map(order => (
                                                                <div
                                                                    key={order.orderId}
                                                                    onClick={() => toggleOrderForDropPoint(dp.id, order.orderId)}
                                                                    className={cn(
                                                                        "flex items-center gap-4 p-3 cursor-pointer transition-colors group",
                                                                        dp.storeOrderIds.includes(order.orderId) ? "bg-[#5C6F2B]/10" : "hover:bg-zinc-800/30"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                                                        dp.storeOrderIds.includes(order.orderId)
                                                                            ? "bg-[#5C6F2B] border-[#5C6F2B] text-black"
                                                                            : "border-zinc-700 bg-zinc-800 group-hover:border-zinc-600"
                                                                    )}>
                                                                        {dp.storeOrderIds.includes(order.orderId) && <CheckCircle2 size={10} strokeWidth={4} />}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-black text-zinc-200 uppercase tracking-tighter">Đơn #{order.orderId}</span>
                                                                            <Badge variant="secondary" className="text-[8px] px-1 py-0.5 border-0 uppercase">{order.status}</Badge>
                                                                        </div>
                                                                        <div className="mt-2 space-y-1.5">
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {order.orderDetails?.map((item, idx) => (
                                                                                    <div 
                                                                                        key={idx} 
                                                                                        className="text-[9px] font-bold bg-zinc-800/80 text-zinc-400 px-2 py-0.5 rounded-lg border border-zinc-700/30 flex items-center gap-1.5"
                                                                                    >
                                                                                        <span className="text-[#DE802B]">{item.quantity}x</span>
                                                                                        <span className="truncate max-w-[150px]">{item.productName}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/30">
                                                                                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Tổng thanh toán:</span>
                                                                                <span className="text-[10px] text-[#DE802B] font-black italic">{(order.totalAmount || 0).toLocaleString()}đ</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-6 text-center flex flex-col items-center gap-2 opacity-30">
                                                            <Package size={32} className="text-zinc-600" />
                                                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">Không có đơn hàng sẵn sàng</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
                                    <span className="text-[11px] font-bold text-zinc-600 uppercase">Tổng số điểm giao</span>
                                    <span className="text-sm font-black text-zinc-200">{form.dropPoints.filter(dp => dp.storeId).length}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                                    <span className="text-[11px] font-bold text-zinc-600 uppercase">Tổng số đơn hàng</span>
                                    <span className="text-sm font-black text-zinc-200">{getTotalOrdersSelected()}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                                    <span className="text-[11px] font-bold text-zinc-600 uppercase">Cước bổ sung</span>
                                    <span className="text-[11px] font-black text-zinc-400 italic">Tính sau khi tạo</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-[11px] font-bold text-zinc-600 uppercase">Đối tác VC</span>
                                    <span className="text-sm font-black text-[#DE802B]">AhaMove</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-[#DE802B]/[0.03] border border-[#DE802B]/10 space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#DE802B]/[0.05] blur-2xl"></div>
                            <div className="flex items-center gap-2 text-[#DE802B] relative z-10">
                                <InfoIcon size={14} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest">AhaMove Webhook</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed tracking-tight relative z-10 italic">
                                Sau khi gửi đơn, hệ thống sẽ tự động gọi sang AhaMove để tìm tài xế. Bạn có thể theo dõi tiến trình trực tiếp qua Link Tracking.
                            </p>
                        </div>

                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting || isLoading || getTotalOrdersSelected() === 0}
                            className="w-full h-16 bg-[#DE802B] hover:bg-[#c97327] text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-[#DE802B]/20 border-0"
                        >
                            {isSubmitting ? 'Đang gửi...' : 'Gửi đến bếp'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
