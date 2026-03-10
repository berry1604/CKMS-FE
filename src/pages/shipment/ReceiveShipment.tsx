import { useEffect, useState, useCallback } from 'react';
import { Package, Truck, Clock, Search, Filter, AlertCircle, Eye, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Drawer } from '../../components/ui/Drawer';
import { shipmentApi } from '../../services/shipment.api';
import type { ShipmentResponse } from '../../types/shipment';
import { ReceiveShipmentForm } from './ReceiveShipmentForm';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/classNames';

export const ReceiveShipment = () => {
    const { user } = useAuth();
    const [shipments, setShipments] = useState<ShipmentResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedShipment, setSelectedShipment] = useState<ShipmentResponse | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'IN_TRANSIT' | 'DELIVERED'>('IN_TRANSIT'); // Default to incoming

    const fetchShipments = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch multiple pages or a large page size to ensure we get the store's shipments
            const res = await shipmentApi.getShipments({ size: 100 });
            let data = res.content || [];

            // Filter by storeId
            if (user?.storeId) {
                data = data.filter(s => s.storeId === Number(user.storeId));
            }

            setShipments(data);
        } catch (error) {
            toast.error('Không thể tải danh sách vận chuyển');
        } finally {
            setIsLoading(false);
        }
    }, [user?.storeId]);

    useEffect(() => {
        fetchShipments();
    }, [fetchShipments]);

    const handleConfirmDelivery = async (data: { note: string, receivedQuantities: Record<number, number> }) => {
        if (!selectedShipment) return;
        setIsConfirming(true);
        try {
            await shipmentApi.confirmDelivery(selectedShipment.shipmentId, data);
            toast.success('Đã xác nhận nhận hàng thành công!');
            setSelectedShipment(null);
            fetchShipments();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi xác nhận giao hàng');
        } finally {
            setIsConfirming(false);
        }
    };

    const filteredShipments = shipments.filter(s => {
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            return (
                String(s.shipmentId).includes(lowerQuery) ||
                (s.driverName || '').toLowerCase().includes(lowerQuery) ||
                (s.vehicleInfo || '').toLowerCase().includes(lowerQuery)
            );
        }
        return true;
    });

    const getStatusBadge = (status: string) => {
        const config: Record<string, { variant: any, label: string }> = {
            'CREATED': { variant: 'orange', label: 'Chờ xuất kho' },
            'PREPARED': { variant: 'info', label: 'Đã chuẩn bị' },
            'IN_TRANSIT': { variant: 'primary', label: 'Đang giao đến' },
            'DELIVERED': { variant: 'success', label: 'Đã nhận' },
            'CANCELLED': { variant: 'danger', label: 'Đã hủy' },
        };
        const item = config[status] || { variant: 'default', label: status };

        return (
            <Badge variant={item.variant} className="px-2 py-0.5 border-0 font-black text-[10px] tracking-widest uppercase">
                {item.label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-tighter">Nhận Hàng</h1>
                    <p className="text-sm text-zinc-500 mt-1 font-medium italic">Workspace: Cửa hàng • Kiểm tra và xác nhận các lô hàng đang được giao đến.</p>
                </div>
            </div>

            <Card className="border-zinc-800 bg-zinc-900/40 ring-1 ring-white/5 overflow-hidden shadow-2xl">
                {/* Search & Filter Bar */}
                <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/20 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <Input
                            placeholder="Tìm mã chuyến, tên tài xế..."
                            className="pl-10 bg-zinc-950/50 border-zinc-800 focus:border-indigo-500/50 transition-all font-medium py-2 text-sm text-zinc-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                        <div className="flex items-center gap-2 pr-3 border-r border-zinc-800 mr-1 shrink-0">
                            <Filter size={14} className="text-zinc-500" />
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Hiển thị:</span>
                        </div>
                        {['all', 'IN_TRANSIT', 'DELIVERED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status as any)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-tighter border",
                                    statusFilter === status
                                        ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                        : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                                )}
                            >
                                {status === 'all' ? 'TẤT CẢ' : (status === 'IN_TRANSIT' ? 'ĐANG GIAO ĐẾN' : 'LỊCH SỬ NHẬN')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List Body */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                            <span className="text-sm font-black text-zinc-500 uppercase tracking-widest">Đang tải dữ liệu...</span>
                        </div>
                    ) : filteredShipments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6 border border-zinc-700">
                                <Package size={32} className="text-zinc-500" />
                            </div>
                            <h3 className="text-lg font-black text-zinc-300 uppercase tracking-tighter mb-2">Không có chuyến hàng nào</h3>
                            <p className="text-sm text-zinc-500 max-w-sm mx-auto font-medium">Bạn hiện không có chuyến hàng nào khớp với điều kiện lọc trên.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredShipments.map(shipment => (
                                <div
                                    key={shipment.shipmentId}
                                    className="group relative bg-zinc-950/40 rounded-[24px] border border-zinc-800/60 overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/5 flex flex-col"
                                >
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shrink-0 group-hover:scale-110 transition-transform">
                                                    <Truck size={20} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <div className="text-lg font-black text-zinc-100 tracking-tighter">#{shipment.shipmentId}</div>
                                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : '--'}</div>
                                                </div>
                                            </div>
                                            {getStatusBadge(shipment.status)}
                                        </div>

                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-start gap-2 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                                                <User size={14} className="text-zinc-500 mt-1 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Tài xế</p>
                                                    <p className="text-sm font-semibold text-zinc-200 truncate">{shipment.driverName || 'Chưa cập nhật'}</p>
                                                    <p className="text-xs text-indigo-400 font-mono mt-0.5">{shipment.driverPhone || ''}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1 p-3 bg-zinc-900/30 rounded-xl border border-zinc-800/30 line-clamp-2">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} className="text-zinc-500" />
                                                    <span className="text-xs font-medium text-zinc-400">Khởi hành: {shipment.shippedAt ? new Date(shipment.shippedAt).toLocaleString() : 'Chưa rõ'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button Area */}
                                    <div className="p-4 bg-zinc-900/60 border-t border-zinc-800/60 mt-auto">
                                        <Button
                                            onClick={() => setSelectedShipment(shipment)}
                                            className={cn(
                                                "w-full h-11 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all",
                                                shipment.status === 'IN_TRANSIT'
                                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                                                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                            )}
                                        >
                                            <Eye size={16} className="mr-2" />
                                            {shipment.status === 'IN_TRANSIT' ? 'Tiến hành Nhận Hàng' : 'Xem Chi tiết'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            <Drawer
                isOpen={!!selectedShipment}
                onClose={() => setSelectedShipment(null)}
                title={
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Package size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-indigo-400 uppercase tracking-tighter">Biên bản Nhận Hàng</span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-0.5">Chuyến #{selectedShipment?.shipmentId}</span>
                        </div>
                    </div>
                }
            >
                {selectedShipment && (
                    <div className="space-y-6">
                        {selectedShipment.status !== 'IN_TRANSIT' && (
                            <div className="flex items-start gap-3 p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
                                <AlertCircle size={18} className="text-zinc-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-200">Trạng thái hiện tại: {selectedShipment.status}</h4>
                                    <p className="text-xs text-zinc-500 mt-1">Lô hàng này không trong trạng thái đang giao, bạn chỉ có thể xem chi tiết ở chế độ chỉ đọc.</p>
                                </div>
                            </div>
                        )}

                        <ReceiveShipmentForm
                            shipmentId={selectedShipment.shipmentId}
                            storeOrderIds={selectedShipment.storeOrderIds || []}
                            onCancel={() => setSelectedShipment(null)}
                            onSubmit={handleConfirmDelivery}
                            isSubmitting={isConfirming}
                        />

                        {selectedShipment.status !== 'IN_TRANSIT' && (
                            <div className="absolute inset-0 z-50 bg-zinc-950/5 cursor-not-allowed"></div>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
};
