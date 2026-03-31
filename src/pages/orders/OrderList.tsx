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
            className: 'font-medium text-[var(--text-secondary)]',
            cell: (order) => <span className="font-mono text-[10px] bg-[var(--bg-card)] px-2 py-0.5 rounded border border-[var(--border-primary)] whitespace-nowrap text-[var(--text-primary)]">Đơn hàng {order.orderId}</span>
        },
        {
            header: 'Cửa hàng',
            accessorKey: 'storeName',
            cell: (order) => (
                <div>
                    <span className="font-bold text-[var(--text-primary)] block text-sm">{order.storeName || `Cửa hàng ${order.storeId}`}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-tighter">ID: {order.storeId}</span>
                </div>
            )
        },
        {
            header: 'Ngày đặt hàng',
            accessorKey: 'orderDate',
            cell: (order) => <span className="text-[var(--text-secondary)] text-sm">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</span>
        },
        {
            header: 'Ngày giao',
            accessorKey: 'deliveryDate',
            cell: (order) => (
                <span className="text-[var(--text-secondary)] text-sm">
                    {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                </span>
            )
        },
        {
            header: 'Tổng số lượng',
            accessorKey: 'orderDetails',
            cell: (order) => {
                const totalQty = order.orderDetails?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
                return <span className="text-[var(--text-secondary)] text-sm font-medium">{totalQty} sản phẩm</span>;
            }
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
        <div className="min-h-screen bg-[var(--bg-root)] pb-20">
            {/* Cinematic Header */}
            <div className="relative h-[350px] w-full overflow-hidden group/header">
                <div className="absolute inset-0 bg-[var(--bg-root)]">
                    <img
                        src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"
                        className="w-full h-full object-cover opacity-40 scale-105 group-hover/header:scale-110 transition-transform duration-[3s] ease-out shadow-inner"
                        alt="Luxury Order Management"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-root)] via-[var(--bg-root)]/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-root)] via-transparent to-[var(--bg-root)]"></div>
                </div>

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <Badge variant="orange" className="text-[10px] font-black tracking-[0.3em] px-3 py-1 border-0 uppercase bg-amber-500/10 text-amber-500">
                           SCM SYSTEM
                        </Badge>
                        <div className="h-px w-12 bg-amber-500/30" />
                        <span className="text-amber-500/80 font-black tracking-[0.2em] text-[10px] uppercase italic">Chain of Command</span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div>
                            <h1 className="text-6xl font-black text-[var(--text-primary)] tracking-tighter mb-4 uppercase italic leading-[0.85]">
                                Order <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Inventory</span>
                            </h1>
                            <p className="text-zinc-400 max-w-xl text-sm font-bold leading-relaxed uppercase tracking-wide opacity-80">
                                Quản lý tập trung các đơn đặt hàng từ hệ thống <span className="text-amber-500">FranchiseSys</span>. Kiểm soát luồng cung ứng thời gian thực.
                            </p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 min-w-[140px] shadow-2xl">
                                <span className="text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-[0.2em] block mb-2 italic">Total Orders</span>
                                <span className="text-3xl font-black text-[var(--text-primary)] leading-none tracking-tighter">{orders.length}</span>
                            </div>
                            <Button
                                onClick={() => navigate('/orders/create')}
                                className="h-16 px-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-[0_20px_50px_-10px_rgba(245,158,11,0.4)] border-0 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                            >
                                <Plus size={20} strokeWidth={4} />
                                Tạo Đơn Mới
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 -mt-10 relative z-10 space-y-8">
                {/* Search & Filter Bar */}
                <div className="backdrop-blur-3xl bg-[var(--bg-card)]/40 border border-[var(--border-primary)] rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
                    
                    <div className="flex flex-col lg:flex-row gap-6 items-center justify-between relative z-10">
                        <div className="relative w-full lg:w-[450px] group/search p-1">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/search:scale-110">
                                <Search size={20} className="text-[var(--text-secondary)] group-focus-within/search:text-amber-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="TÌM MÃ ĐƠN, TÊN CỬA HÀNG..."
                                className="w-full pl-14 pr-6 py-5 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] rounded-2xl text-[var(--text-primary)] font-black text-[11px] tracking-widest uppercase focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all duration-300 placeholder:text-[var(--text-secondary)]/50 hover:bg-[var(--bg-root)]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto p-1">
                            <div className="flex items-center gap-2 pr-6 border-r border-[var(--border-primary)] mr-3">
                                <Filter size={18} className="text-amber-500" />
                                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest whitespace-nowrap hidden sm:inline">Lọc theo</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['all', 'DRAFT', 'SUBMITTED', 'APPROVED', 'ALLOCATED', 'DELIVERED', 'REJECTED'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={cn(
                                            "px-6 py-3 rounded-[20px] text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest border",
                                            statusFilter === status
                                                ? "bg-amber-500 border-amber-500 text-black shadow-[0_10px_30px_rgba(245,158,11,0.2)]"
                                                : "bg-transparent border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/50 hover:text-[var(--text-primary)]"
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
                </div>

                <div className="backdrop-blur-3xl bg-[var(--bg-card)]/40 border border-[var(--border-primary)] rounded-3xl overflow-hidden shadow-2xl">
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
                        <div className="p-8 border-t border-[var(--border-primary)] bg-[var(--bg-card)]/60 flex items-center justify-between">
                            <span className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">
                                Trang <span className="text-amber-500">{(page + 1).toString().padStart(2, '0')}</span> / {totalPages.toString().padStart(2, '0')}
                            </span>
                            <div className="flex gap-4">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page === 0}
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    className="bg-[var(--bg-root)]/50 border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] h-12 px-8 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all disabled:opacity-20"
                                >
                                    Trước
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => p + 1)}
                                    className="bg-[var(--bg-root)]/50 border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] h-12 px-8 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all disabled:opacity-20"
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
