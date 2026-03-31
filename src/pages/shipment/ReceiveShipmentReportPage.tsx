import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Truck, AlertCircle, ClipboardList, User, Phone } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { shipmentApi } from '../../services/shipment.api';
import { storeOrderApi } from '../../services/storeOrderApi';
import { productApi } from '../../services/product.api';
import type { StoreOrderResponse } from '../../types/storeOrder';
import type { ShipmentResponse } from '../../types/shipment';
import { ReceiveShipmentForm } from './ReceiveShipmentForm';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const ReceiveShipmentReportPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [shipment, setShipment] = useState<ShipmentResponse | null>(null);
    const [aggregatedItems, setAggregatedItems] = useState<{ productId: number, productName: string, quantity: number, imageUrl?: string, unit?: string, categoryName?: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false);

    const fetchShipment = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const data = await shipmentApi.getShipmentById(Number(id));
            setShipment(data);

            // Fetch detailed orders and aggregate items
            const orderIds = new Set<number>();
            if (user?.role === 'STORE_STAFF' && user?.storeId) {
                data.stops?.filter(s => s.storeId === Number(user.storeId)).forEach(stop => {
                    (stop.storeOrderIds || []).forEach(id => orderIds.add(id));
                });
            } else {
                (data.storeOrderIds || []).forEach(id => orderIds.add(id));
                data.stops?.forEach(stop => {
                    (stop.storeOrderIds || []).forEach(id => orderIds.add(id));
                });
            }

            if (orderIds.size > 0) {
                const orders: StoreOrderResponse[] = await Promise.all(
                    Array.from(orderIds).map(id => storeOrderApi.getOrderById(id))
                );

                const itemsMap = new Map<number, { productId: number, productName: string, quantity: number, imageUrl?: string, unit?: string, categoryName?: string }>();
                const productIds = new Set<number>();

                orders.forEach(order => {
                    order.orderDetails?.forEach(item => {
                        productIds.add(item.productId);
                        const existing = itemsMap.get(item.productId);
                        if (existing) {
                            existing.quantity += item.quantity;
                        } else {
                            itemsMap.set(item.productId, {
                                productId: item.productId,
                                productName: item.productName,
                                quantity: item.quantity
                            });
                        }
                    });
                });

                // Fetch product details for images/units
                await Promise.all(
                    Array.from(productIds).map(async (pid) => {
                        try {
                            const res = await productApi.getProductById(pid);
                            if (res.data) {
                                const p = res.data;
                                const item = itemsMap.get(pid);
                                if (item) {
                                    item.imageUrl = p.imageUrl;
                                    item.unit = p.unit;
                                    item.categoryName = p.category?.name;
                                }
                            }
                        } catch (error) {
                            console.warn(`Could not fetch details for product ${pid}:`, error);
                        }
                    })
                );

                setAggregatedItems(Array.from(itemsMap.values()));
            }

        } catch (error) {
            console.error(error);
            toast.error('Không thể tải thông tin chuyến hàng');
            navigate('/shipment/receive');
        } finally {
            setIsLoading(false);
        }
    }, [id, navigate, user?.role, user?.storeId]);

    useEffect(() => {
        fetchShipment();
    }, [fetchShipment]);

    const handleConfirmDelivery = async (data: { note: string, receivedQuantities: Record<number, number> }) => {
        if (!shipment) return;
        setIsConfirming(true);
        try {
            // Priority: Confirm specific stop if found (Multi-drop)
            const stopForStore = user?.storeId 
                ? shipment.stops?.find(s => s.storeId === Number(user.storeId))
                : null;

            if (stopForStore) {
                await shipmentApi.confirmStopDelivery(shipment.shipmentId, stopForStore.stopId, data);
            } else {
                // Fallback for legacy single-store shipments
                await shipmentApi.confirmDelivery(shipment.shipmentId, data);
            }

            toast.success('Đã xác nhận nhận hàng thành công!');
            navigate('/shipment/receive');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Lỗi xác nhận giao hàng');
        } finally {
            setIsConfirming(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-root)] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 blur-xl bg-amber-500/20 rounded-full"></div>
                </div>
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.4em] animate-pulse">Đang truy xuất vận đơn...</span>
            </div>
        );
    }

    if (!shipment) return null;

    return (
        <div className="min-h-screen bg-[var(--bg-root)] pb-20">
            {/* Cinematic Header */}
            <div className="relative h-[300px] w-full overflow-hidden">
                <img
                    src="/Users/phunghuyphuoc/.gemini/antigravity/brain/0e7878ef-fd61-49a8-909f-b3ae8c725512/logistics_delivery_luxury_1773305129347.png"
                    className="w-full h-full object-cover opacity-40 scale-105"
                    alt="Luxury Logistics"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-root)]/80 via-[var(--bg-root)]/20 to-[var(--bg-root)]" />

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12 max-w-7xl mx-auto w-full">
                    <button 
                        onClick={() => navigate('/shipment/receive')}
                        className="group flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-10 w-fit"
                    >
                        <div className="p-2.5 bg-[var(--text-primary)]/5 rounded-2xl border border-[var(--border-primary)] group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-all">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quay lại vận đơn</span>
                    </button>
                    
                    <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                        <div className="flex items-center gap-8">
                            <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-amber-500 to-orange-600 p-px shadow-2xl shadow-amber-500/20 group/icon">
                                <div className="w-full h-full bg-[var(--bg-root)] rounded-[32px] flex items-center justify-center text-amber-500 group-hover/icon:bg-transparent group-hover/icon:text-black transition-all">
                                    <Truck size={42} strokeWidth={1.5} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Badge variant="orange" className="h-5 text-[9px] font-black px-2 py-0 border-0 uppercase tracking-widest">GIAO THỨC NHẬN HÀNG</Badge>
                                    <span className="text-[var(--text-secondary)]/40 font-black text-[10px] uppercase tracking-widest">System v4.0.2</span>
                                </div>
                                <h1 className="text-5xl font-black text-[var(--text-primary)] tracking-tighter mb-2 italic">
                                    BIÊN BẢN <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">NHẬN HÀNG</span>
                                </h1>
                                <div className="flex items-center gap-4">
                                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                        <span className="text-amber-500 font-black tracking-tighter text-xl font-mono">#{shipment.shipmentId}</span>
                                    </div>
                                    <span className="w-2 h-2 rounded-full bg-[var(--border-primary)]"></span>
                                    <span className="text-[var(--text-secondary)]/40 text-[10px] font-black uppercase tracking-[0.3em]">{shipment.status}</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-6 bg-[var(--text-primary)]/[0.02] backdrop-blur-3xl border border-[var(--border-primary)] rounded-[40px] shadow-2xl flex items-center gap-10 min-w-[360px]">
                            <div className="flex-1">
                                <span className="text-[var(--text-secondary)]/40 text-[9px] uppercase tracking-[0.3em] block mb-2 font-black">Khởi hành</span>
                                <span className="text-lg font-black text-[var(--text-primary)] tracking-tighter italic">
                                    {shipment.shippedAt ? new Date(shipment.shippedAt).toLocaleDateString('vi-VN') : 'CHỜ XUẤT KHO'}
                                </span>
                            </div>
                            <div className="h-12 w-px bg-[var(--border-primary)]"></div>
                            <div className="flex-1 text-right">
                                <span className="text-[var(--text-secondary)]/40 text-[9px] uppercase tracking-[0.3em] block mb-2 font-black">Điểm đến</span>
                                <span className="text-lg font-black text-amber-500 tracking-tighter truncate max-w-[140px] block font-mono capitalize">
                                    {shipment.stops?.find(s => s.storeId === Number(user?.storeId))?.storeName || shipment.storeName || 'Cửa hàng'}
                                </span>
                            </div>
                            {(shipment.shippingFee ?? 0) > 0 && (
                                <>
                                    <div className="h-12 w-px bg-[var(--border-primary)]"></div>
                                    <div className="flex-1 text-right">
                                        <span className="text-[var(--text-secondary)]/40 text-[9px] uppercase tracking-[0.3em] block mb-2 font-black">Cước phí</span>
                                        <span className="text-lg font-black text-emerald-500 tracking-tighter font-mono">
                                            {shipment.shippingFee?.toLocaleString('vi-VN')} ₫
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 mt-12 space-y-12">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-12">
                        {/* Aggregated Item Summary Section */}
                        <div className="bg-[var(--bg-card)]/10 border border-[var(--border-primary)] rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -translate-x-32 -translate-y-32"></div>
                            
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                        <ClipboardList size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em]">Tổng hợp hàng hóa</h3>
                                        <p className="text-[9px] text-[var(--text-secondary)]/40 font-bold uppercase tracking-widest mt-0.5">Thống kê toàn bộ vận đơn</p>
                                    </div>
                                </div>
                                <Badge variant="success" className="h-6 text-[9px] font-black px-3 tracking-[0.2em] border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                                    {aggregatedItems.length} MẶT HÀNG
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {aggregatedItems.map((item) => (
                                    <div key={item.productId} className="group/item flex items-center justify-between p-5 bg-[var(--bg-root)]/40 border border-[var(--border-primary)] rounded-3xl hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-500">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] overflow-hidden flex items-center justify-center group-hover/item:scale-105 transition-transform duration-500 shadow-lg">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package size={20} className="text-[var(--text-secondary)]/20" />
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-sm font-black text-[var(--text-primary)] tracking-tight block mb-1">{item.productName}</span>
                                                <span className="text-[9px] text-[var(--text-secondary)]/40 font-black tracking-widest uppercase">{item.categoryName || 'Sản phẩm'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-amber-500 font-mono tracking-tighter">{item.quantity}</span>
                                            <span className="text-[9px] text-[var(--text-secondary)]/40 font-black block uppercase tracking-tighter -mt-1">{item.unit || 'đơn vị'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Confirmation Form */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                                <h3 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em]">Chi tiết & Ký nhận xác thực</h3>
                            </div>
                            
                            <div className="relative">
                                <ReceiveShipmentForm
                                    shipmentId={shipment.shipmentId}
                                    storeOrderIds={
                                        user?.role === 'STORE_STAFF' && user?.storeId
                                            ? (shipment.stops?.filter(s => s.storeId === Number(user.storeId)).flatMap(s => s.storeOrderIds || []) || [])
                                            : (shipment.storeOrderIds || [])
                                    }
                                    status={shipment.status}
                                    shippingFee={shipment.shippingFee}
                                    onCancel={() => navigate('/shipment/receive')}
                                    onSubmit={handleConfirmDelivery}
                                    isSubmitting={isConfirming}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        {/* Driver & Logistics Information Card */}
                        <div className="bg-[var(--text-primary)]/[0.02] border border-[var(--border-primary)] rounded-[40px] p-8 shadow-2xl relative overflow-hidden group/card shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover/card:bg-amber-500/10 transition-colors"></div>
                            
                            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em] mb-10 border-b border-[var(--border-primary)] pb-5 flex items-center justify-between">
                                Thông tin vận tải
                                <Truck size={14} className="text-amber-500/50" />
                            </h3>
                            
                            <div className="space-y-10">
                                <div className="flex items-center gap-5 group/entry">
                                    <div className="w-14 h-14 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] group-hover/entry:border-amber-500/50 transition-colors">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest mb-1.5">Cơ trưởng điều hành</div>
                                        <div className="text-xl font-black text-[var(--text-primary)] tracking-tighter italic">{shipment.driverName || 'VÔ DANH'}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5 group/entry">
                                    <div className="w-14 h-14 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] group-hover/entry:border-amber-500/50 transition-colors">
                                        <Truck size={24} />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest mb-1.5">Mã phương tiện</div>
                                        <div className="text-xl font-black text-[var(--text-primary)] tracking-tighter italic font-mono uppercase">{shipment.vehicleInfo || 'CHƯA CẬP NHẬT'}</div>
                                    </div>
                                </div>

                                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl relative overflow-hidden group/phone">
                                    <div className="absolute inset-0 bg-amber-500/0 group-hover/phone:bg-amber-500/[0.02] transition-colors"></div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <div>
                                            <div className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest mb-1">Số điện thoại khẩn cấp</div>
                                            <div className="text-2xl font-black text-amber-500 font-mono tracking-tighter">
                                                {shipment.driverPhone || '---'}
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                                            <Phone size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Audit Details (Remarks) */}
                        {shipment.remarks && (
                            <div className="bg-[var(--bg-root)]/40 border border-[var(--border-primary)] rounded-[32px] p-8 space-y-4">
                                <div className="flex items-center gap-2 text-[var(--text-secondary)]/40 mb-2">
                                    <AlertCircle size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Ghi chú vận hành</span>
                                </div>
                                <p className="text-sm font-medium text-[var(--text-secondary)] italic leading-relaxed text-pretty border-l-2 border-amber-500/30 pl-4 py-1">
                                    "{shipment.remarks}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
