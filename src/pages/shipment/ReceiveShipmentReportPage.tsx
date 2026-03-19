import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Truck, AlertCircle } from 'lucide-react';
import { shipmentApi } from '../../services/shipment.api';
import type { ShipmentResponse } from '../../types/shipment';
import { ReceiveShipmentForm } from './ReceiveShipmentForm';
import { toast } from 'react-hot-toast';

export const ReceiveShipmentReportPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [shipment, setShipment] = useState<ShipmentResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false);

    const fetchShipment = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const data = await shipmentApi.getShipmentById(Number(id));
            setShipment(data);
        } catch (error) {
            toast.error('Không thể tải thông tin chuyến hàng');
            navigate('/shipment/receive');
        } finally {
            setIsLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchShipment();
    }, [fetchShipment]);

    const handleConfirmDelivery = async (data: { note: string, receivedQuantities: Record<number, number> }) => {
        if (!shipment) return;
        setIsConfirming(true);
        try {
            await shipmentApi.confirmDelivery(shipment.shipmentId, data);
            toast.success('Đã xác nhận nhận hàng thành công!');
            navigate('/shipment/receive');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi xác nhận giao hàng');
        } finally {
            setIsConfirming(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 blur-xl bg-amber-500/20 rounded-full"></div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em] animate-pulse">Đang truy xuất vận đơn...</span>
            </div>
        );
    }

    if (!shipment) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-20">
            {/* Cinematic Header */}
            <div className="relative h-[300px] w-full overflow-hidden">
                <img
                    src="/Users/phunghuyphuoc/.gemini/antigravity/brain/0e7878ef-fd61-49a8-909f-b3ae8c725512/logistics_delivery_luxury_1773305129347.png"
                    className="w-full h-full object-cover opacity-40 scale-105"
                    alt="Luxury Logistics"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/20 to-[#0a0a0a]" />

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12 max-w-7xl mx-auto w-full">
                    <button 
                        onClick={() => navigate('/shipment/receive')}
                        className="group flex items-center gap-3 text-gray-500 hover:text-white transition-colors mb-8 w-fit"
                    >
                        <div className="p-2 bg-white/5 rounded-xl border border-white/10 group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-all">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quay lại danh sách</span>
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-px shadow-2xl shadow-amber-500/20">
                                <div className="w-full h-full bg-[#0a0a0a] rounded-3xl flex items-center justify-center text-amber-500">
                                    <Truck size={36} />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white tracking-tighter mb-2 italic">
                                    BIÊN BẢN <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">NHẬN HÀNG</span>
                                </h1>
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Mã vận đơn:</span>
                                    <span className="text-amber-500 font-black tracking-tighter text-xl">#{shipment.shipmentId}</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl flex items-center gap-6 min-w-[300px]">
                            <div className="flex-1">
                                <span className="text-gray-500 text-[9px] uppercase tracking-[0.2em] block mb-1 font-black">Trạng thái</span>
                                <span className="text-sm font-black text-white tracking-widest uppercase">{shipment.status}</span>
                            </div>
                            <div className="h-10 w-px bg-white/10"></div>
                            <div className="flex-1 text-right">
                                <span className="text-gray-500 text-[9px] uppercase tracking-[0.2em] block mb-1 font-black">Ngày khởi hành</span>
                                <span className="text-sm font-bold text-amber-500 font-mono">
                                    {shipment.shippedAt ? new Date(shipment.shippedAt).toLocaleDateString('vi-VN') : '---'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-8">
                        {shipment.status !== 'IN_TRANSIT' && (
                            <div className="bg-amber-950/20 border border-amber-500/20 p-6 rounded-[32px] flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                                <AlertCircle size={24} className="text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-1">Chế độ Chỉ xem</h4>
                                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider leading-relaxed mb-4">
                                        Lô hàng này không trong trạng thái đang giao, bạn chưa thể xác nhận nhận hàng.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${(shipment.status as string) === 'PENDING' ? 'bg-amber-500 text-black' : 'bg-emerald-500/20 text-emerald-500'}`}>1</div>
                                            <span className={`text-[10px] font-black tracking-widest uppercase ${(shipment.status as string) === 'PENDING' ? 'text-zinc-200' : 'text-zinc-500'}`}>PENDING: XÁC NHẬN CHUẨN BỊ HÀNG</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${(shipment.status as string) === 'PREPARED' ? 'bg-amber-500 text-black' : ((shipment.status as string) === 'IN_TRANSIT' || (shipment.status as string) === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-600')}`}>2</div>
                                            <span className={`text-[10px] font-black tracking-widest uppercase ${(shipment.status as string) === 'PREPARED' ? 'text-zinc-200' : 'text-zinc-600'}`}>PREPARED: XÁC NHẬN XUẤT KHO & GIAO</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${(shipment.status as string) === 'IN_TRANSIT' ? 'bg-amber-500 text-black' : ((shipment.status as string) === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-600')}`}>3</div>
                                            <span className={`text-[10px] font-black tracking-widest uppercase ${(shipment.status as string) === 'IN_TRANSIT' ? 'text-zinc-200' : 'text-zinc-600'}`}>IN_TRANSIT: XÁC NHẬN NHẬN HÀNG</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <ReceiveShipmentForm
                                shipmentId={shipment.shipmentId}
                                storeOrderIds={shipment.storeOrderIds || []}
                                status={shipment.status}
                                onCancel={() => navigate('/shipment/receive')}
                                onSubmit={handleConfirmDelivery}
                                isSubmitting={isConfirming}
                            />
                            {shipment.status !== 'IN_TRANSIT' && (
                                <div className="absolute inset-0 z-50 rounded-[32px] cursor-not-allowed pointer-events-none opacity-0 group">
                                    {/* Overlay for read-only if needed, though form handles items. 
                                        Actually, the form doesn't disable all inputs automatically based on status, 
                                        so I should probably pass a readonly prop or wrap it. */}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full translate-x-16 -translate-y-16"></div>
                            
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-8 border-b border-white/5 pb-4">
                                Thông tin tài xế
                            </h3>
                            
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-gray-400">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Tên cơ trưởng</div>
                                        <div className="text-lg font-bold text-white tracking-tight">{shipment.driverName || 'Chưa cập nhật'}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-gray-400">
                                        <Truck size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Phương tiện</div>
                                        <div className="text-lg font-bold text-white tracking-tight">{shipment.vehicleInfo || 'Chưa cập nhật'}</div>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                    <div className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest mb-1">Số điện thoại liên hệ</div>
                                    <div className="text-xl font-black text-amber-500 font-mono tracking-tighter">
                                        {shipment.driverPhone || '---'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
