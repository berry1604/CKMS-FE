import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, Clock, Search, Filter, Eye, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { shipmentApi } from '../../services/shipment.api';
import type { ShipmentResponse } from '../../types/shipment';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/classNames';

export const ReceiveShipment = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [shipments, setShipments] = useState<ShipmentResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'IN_TRANSIT' | 'DELIVERED'>('IN_TRANSIT'); // Default to incoming

    const fetchShipments = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch multiple pages or a large page size to ensure we get the store's shipments
            const res = await shipmentApi.getShipments({ size: 100, sort: 'shipmentId,desc' });
            let data = res.content || [];

            // Filter by storeId
            if (user?.storeId) {
                const userStoreId = Number(user.storeId);
                data = data.filter(s => 
                    s.storeId === userStoreId || 
                    (s.stops && s.stops.some(stop => stop.storeId === userStoreId))
                );
            }

            setShipments(data);
        } catch {
            toast.error('Không thể tải danh sách vận chuyển');
        } finally {
            setIsLoading(false);
        }
    }, [user?.storeId]);

    useEffect(() => {
        fetchShipments();
    }, [fetchShipments]);


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
        const config: Record<string, { variant: 'orange' | 'info' | 'primary' | 'success' | 'danger' | 'default', label: string }> = {
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
        <div className="min-h-screen bg-[#0a0a0a] pb-20">
            {/* Cinematic Header */}
            <div className="relative h-[320px] w-full overflow-hidden">
                <img
                    src="/Users/phunghuyphuoc/.gemini/antigravity/brain/0e7878ef-fd61-49a8-909f-b3ae8c725512/logistics_delivery_luxury_1773305129347.png"
                    className="w-full h-full object-cover scale-110"
                    alt="Luxury Logistics"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#0a0a0a] backdrop-blur-[1px]" />

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="h-px w-10 bg-amber-500/50" />
                        <span className="text-amber-500 font-medium tracking-[0.3em] text-[10px] uppercase">Điều phối nhập kho</span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-5xl font-bold text-white tracking-tighter mb-2">
                                NHẬN <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">HÀNG</span>
                            </h1>
                            <p className="text-gray-400 max-w-xl text-lg font-light leading-relaxed">
                                Kiểm tra và xác nhận các lô hàng đang được giao đến cửa hàng.
                            </p>
                        </div>
                        <div className="px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                            <span className="text-gray-500 text-[10px] uppercase tracking-[0.2em] block mb-1">Tổng chuyến hàng</span>
                            <span className="text-2xl font-bold text-white leading-none">{filteredShipments.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 -mt-10 relative z-10 space-y-8">
                {/* Search & Filter Bar */}
                <div className="backdrop-blur-3xl bg-white/[0.03] border border-white/10 rounded-[32px] p-4 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
                        <div className="relative w-full md:w-[400px] group/search">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within/search:scale-110">
                                <Search size={18} className="text-gray-500 group-focus-within/search:text-amber-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm mã chuyến, tên tài xế..."
                                className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all duration-300 placeholder:text-gray-600 hover:bg-white/[0.05]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                            <div className="flex items-center gap-2 pr-4 border-r border-white/5 mr-2">
                                <Filter size={16} className="text-amber-500" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">HIỂN THỊ</span>
                            </div>
                            {(['all', 'IN_TRANSIT', 'DELIVERED'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest border",
                                        statusFilter === status
                                            ? "bg-amber-600/90 border-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                                            : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300"
                                    )}
                                >
                                    {status === 'all' ? 'TẤT CẢ' : (status === 'IN_TRANSIT' ? 'ĐANG GIAO ĐẾN' : 'LỊCH SỬ NHẬN')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* List Body */}
                <div>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-6 scale-110">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 blur-xl bg-amber-500/20 rounded-full"></div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em] animate-pulse">Luân chuyển dữ liệu...</span>
                        </div>
                    ) : filteredShipments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 shadow-inner shadow-black/50">
                                <Package size={40} className="text-gray-700" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-tighter mb-3">Hệ thống trống</h3>
                            <p className="text-gray-600 max-w-sm mx-auto font-light italic">Không tìm thấy chuyến hàng nào khớp với điều kiện hiện tại.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredShipments.map((shipment, idx) => (
                                <div
                                    key={shipment.shipmentId}
                                    className="group relative bg-[#111111] border border-white/5 rounded-[40px] p-6 shadow-2xl transition-all duration-500 hover:border-amber-500/40 hover:-translate-y-2 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.1)] animate-in fade-in slide-in-from-bottom-8 flex flex-col"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="relative z-10 flex-1">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-px">
                                                    <div className="w-full h-full bg-[#111] rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-transparent group-hover:text-black transition-all">
                                                        <Truck size={24} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-white tracking-tighter">#{shipment.shipmentId}</h3>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">
                                                        {shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString('vi-VN') : '--'}
                                                    </p>
                                                </div>
                                            </div>
                                            {getStatusBadge(shipment.status)}
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 group-hover:border-white/10 transition-colors relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">Cơ trưởng chuyến hàng</div>
                                                        <div className="text-sm font-bold text-white tracking-tight">{shipment.driverName || 'Vô danh'}</div>
                                                        <div className="text-[10px] text-amber-500/80 font-mono mt-0.5">{shipment.driverPhone || '---'}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.01] border border-white/5 text-gray-500">
                                                <Clock size={14} className="text-amber-500/50" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                                                    Khởi động: {shipment.shippedAt ? new Date(shipment.shippedAt).toLocaleString('vi-VN') : '---'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => navigate(`/shipment/receive/${shipment.shipmentId}`)}
                                        className={cn(
                                            "relative w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] overflow-hidden transition-all duration-500 group/btn",
                                            shipment.status === 'IN_TRANSIT'
                                                ? "bg-amber-500 text-black hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                                                : "bg-[#1a1a1a] text-gray-400 border border-white/10 hover:border-white/20 hover:text-white"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                                        <div className="relative z-10 flex items-center justify-center gap-2">
                                            {shipment.status === 'IN_TRANSIT' ? (
                                                <>CHI TIẾT ĐƠN HÀNG <Eye size={16} /></>
                                            ) : (
                                                <>THÔNG TIN CHI TIẾT <Eye size={16} /></>
                                            )}
                                        </div>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};
