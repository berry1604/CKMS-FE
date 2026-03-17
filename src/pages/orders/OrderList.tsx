import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { storeOrderApi } from '../../services/storeOrderApi';
import type { StoreOrderResponse } from '../../types/storeOrder';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/classNames';

export const OrderList = () => {
    const navigate = useNavigate();
    const { hasAuthority } = useAuth();
    const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<StoreOrderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Pagination
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Drawer State
    const [selectedOrder, setSelectedOrder] = useState<StoreOrderResponse | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params: any = {
                page,
                size: 10,
                sortBy: 'orderDate',
                sortDir: 'desc'
            };
            if (statusFilter !== 'all') {
                params.status = statusFilter.toUpperCase();
            }

            // Admin, Manager, Coordinator, or someone who inherently has VIEW_STORE_ORDER
            const canViewAll = hasAuthority('VIEW_STORE_ORDER') || hasAuthority('COORDINATOR') || hasAuthority('ADMIN') || hasAuthority('MANAGER');

            const apiCall = canViewAll
                ? storeOrderApi.getAllOrders(params)
                : storeOrderApi.getMyOrders(params);

            const res = await apiCall;
            setOrders(res.content || []);
            setFilteredOrders(res.content || []);
            setTotalPages(res.totalPages || 0);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('Không thể tải danh sách đơn hàng');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter, page]);

    useEffect(() => {
        setPage(0);
    }, [statusFilter]);

    useEffect(() => {
        let result = orders;

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(o =>
                String(o.orderId).includes(lowerQuery) ||
                String(o.storeId).includes(lowerQuery) ||
                (o.storeName && o.storeName.toLowerCase().includes(lowerQuery))
            );
        }

        setFilteredOrders(result);
    }, [orders, searchQuery]);

    const handleStatusUpdate = async (orderId: number, status: string) => {
        setIsLoading(true);
        try {
            await storeOrderApi.updateOrderStatus(orderId, status);
            toast.success(`Đã cập nhật trạng thái đơn hàng #${orderId} thành công`);
            fetchData();
            if (selectedOrder && selectedOrder.orderId === orderId) {
                setSelectedOrder(null);
            }
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error('Cập nhật trạng thái thất bại');
            setIsLoading(false);
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        try {
            await storeOrderApi.cancelOrder(orderId);
            toast.success(`Đã hủy đơn hàng #${orderId} thành công`);
            setSelectedOrder(null);
            fetchData();
        } catch (error: any) {
            console.error('Failed to cancel order', error);
            toast.error(error.response?.data?.message || 'Hủy đơn hàng thất bại');
        }
    };

    const handleSubmitOrder = async (orderId: number) => {
        setIsLoading(true);
        try {
            await storeOrderApi.submitOrder(orderId);
            toast.success(`Đã gửi đơn hàng #${orderId} thành công`);
            setSelectedOrder(null);
            fetchData();
        } catch (error: any) {
            console.error('Failed to submit order', error);
            toast.error(error.response?.data?.message || 'Gửi đơn hàng thất bại');
            setIsLoading(false);
        }
    };

    const columns: Column<StoreOrderResponse>[] = [
        {
            header: 'Mã đơn',
            accessorKey: 'orderId',
            className: 'font-medium text-zinc-400',
            cell: (order) => <span className="font-mono text-[10px] bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 whitespace-nowrap">Đơn hàng {order.orderId}</span>
        },
        {
            header: 'Cửa hàng',
            accessorKey: 'storeName',
            cell: (order) => (
                <div>
                    <span className="font-bold text-zinc-100 block text-sm">{order.storeName || `Cửa hàng ${order.storeId}`}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">ID: {order.storeId}</span>
                </div>
            )
        },
        {
            header: 'Ngày đặt hàng',
            accessorKey: 'orderDate',
            cell: (order) => <span className="text-zinc-400 text-sm">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</span>
        },
        {
            header: 'Ngày giao',
            accessorKey: 'deliveryDate',
            cell: (order) => (
                <span className="text-zinc-400 text-sm">
                    {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                </span>
            )
        },
        {
            header: 'Số món',
            accessorKey: 'orderDetails',
            cell: (order) => <span className="text-zinc-500 text-sm font-medium">{order.orderDetails?.length || 0} món</span>
        },
        {
            header: 'Tổng tiền',
            accessorKey: 'totalAmount',
            className: 'font-black text-right',
            cell: (order) => <span className="text-amber-500 font-bold">{(order.totalAmount || 0).toLocaleString()} <span className="text-[10px] opacity-70">VNĐ</span></span>
        },
        {
            header: 'Trạng thái',
            cell: (order) => {
                const status = order.status;
                const config: Record<string, { label: string, variant: any }> = {
                    'DRAFT': { label: 'BẢN NHÁP', variant: 'default' },
                    'SUBMITTED': { label: 'CHỜ DUYỆT', variant: 'warning' },
                    'APPROVED': { label: 'ĐÃ DUYỆT', variant: 'orange' },
                    'ALLOCATED': { label: 'ĐÃ PHÂN BỔ', variant: 'info' },
                    'DELIVERED': { label: 'HOÀN THÀNH', variant: 'success' },
                    'REJECTED': { label: 'TỪ CHỐI', variant: 'danger' }
                };
                const { label, variant } = config[status] || { label: status, variant: 'default' };
                return (
                    <Badge variant={variant} className="text-[10px] font-black px-2 py-0.5 border-0 shadow-sm uppercase tracking-tighter">
                        {label}
                    </Badge>
                );
            }
        },
        {
            header: '',
            cell: (order) => (
                <div className="flex justify-end gap-2 pr-4">
                    {order.status === 'DRAFT' && (hasAuthority('STORE_STAFF') || hasAuthority('CREATE_STORE_ORDER') || hasAuthority('MANAGER')) && (
                        <Button
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSubmitOrder(order.orderId);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-[10px] tracking-widest px-3 h-8 rounded-lg shadow-lg shadow-emerald-900/20 border-0"
                        >
                            Gửi Đơn
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)} className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-full w-8 h-8 p-0">
                        <Eye size={16} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-20">
            {/* Cinematic Header */}
            <div className="relative h-[320px] w-full overflow-hidden">
                <img
                    src="/Users/phunghuyphuoc/.gemini/antigravity/brain/0e7878ef-fd61-49a8-909f-b3ae8c725512/order_management_luxury_1773305899211.png"
                    className="w-full h-full object-cover scale-110"
                    alt="Luxury Order Management"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#0a0a0a] backdrop-blur-[1px]" />

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="h-px w-10 bg-amber-500/50" />
                        <span className="text-amber-500 font-medium tracking-[0.3em] text-[10px] uppercase">Quản lý chuỗi cung ứng</span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-5xl font-bold text-white tracking-tighter mb-2 italic">
                                DANH SÁCH <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">ĐƠN HÀNG</span>
                            </h1>
                            <p className="text-gray-400 max-w-xl text-lg font-light leading-relaxed">
                                Giám sát và quản lý các đơn đặt hàng từ hệ thống cửa hàng FranchiseSys.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                                <span className="text-gray-500 text-[10px] uppercase tracking-[0.2em] block mb-1">Tổng đơn hàng</span>
                                <span className="text-2xl font-bold text-white leading-none">{orders.length}</span>
                            </div>
                            <Button
                                onClick={() => navigate('/orders/create')}
                                className="h-14 px-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase tracking-widest rounded-2xl shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)] border-0 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                            >
                                <Plus size={20} strokeWidth={3} />
                                Tạo Đơn Mới
                            </Button>
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
                                placeholder="Tìm mã đơn, tên cửa hàng..."
                                className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all duration-300 placeholder:text-gray-600 hover:bg-white/[0.05]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-4 md:pb-0 no-scrollbar">
                            <div className="flex items-center gap-2 pr-4 border-r border-white/5 mr-2">
                                <Filter size={16} className="text-amber-500" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Lọc theo</span>
                            </div>
                            {['all', 'DRAFT', 'SUBMITTED', 'APPROVED', 'ALLOCATED', 'DELIVERED', 'REJECTED'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={cn(
                                        "px-5 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest border",
                                        statusFilter === status
                                            ? "bg-amber-600/90 border-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                                            : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300"
                                    )}
                                >
                                    {status === 'all' ? 'TẤT CẢ' : (
                                        status === 'DRAFT' ? 'NHÁP' :
                                        status === 'SUBMITTED' ? 'CHỜ DUYỆT' :
                                        status === 'APPROVED' ? 'ĐÃ DUYỆT' :
                                        status === 'ALLOCATED' ? 'PHÂN BỔ' :
                                        status === 'DELIVERED' ? 'HOÀN THÀNH' : 'TỪ CHỐI'
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="backdrop-blur-3xl bg-white/[0.02] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <DataTable
                            data={filteredOrders}
                            columns={columns}
                            keyExtractor={(order: StoreOrderResponse) => String(order.orderId)}
                            isLoading={isLoading}
                            onRowClick={(order) => setSelectedOrder(order)}
                        />
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                Trang <span className="text-white">{page + 1}</span> / {totalPages}
                            </span>
                            <div className="flex gap-4">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page === 0}
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    className="bg-white/5 border-white/10 text-gray-400 hover:text-white h-10 px-6 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all disabled:opacity-20"
                                >
                                    Trước
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => p + 1)}
                                    className="bg-white/5 border-white/10 text-gray-400 hover:text-white h-10 px-6 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all disabled:opacity-20"
                                >
                                    Sau
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <OrderDetailDrawer
                order={selectedOrder}
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onStatusUpdate={handleStatusUpdate}
                onCancelOrder={handleCancelOrder}
                onSubmitOrder={handleSubmitOrder}
            />
        </div>
    );
};
