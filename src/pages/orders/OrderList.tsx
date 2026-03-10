import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
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
            toast.error('Failed to load orders');
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
            toast.success(`Order #${orderId} status updated to ${status}`);
            fetchData();
            if (selectedOrder && selectedOrder.orderId === orderId) {
                setSelectedOrder(null);
            }
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error('Failed to update order status');
            setIsLoading(false);
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        try {
            await storeOrderApi.cancelOrder(orderId);
            toast.success(`Order #${orderId} has been cancelled`);
            setSelectedOrder(null);
            fetchData();
        } catch (error: any) {
            console.error('Failed to cancel order', error);
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        }
    };

    const columns: Column<StoreOrderResponse>[] = [
        {
            header: 'Mã đơn',
            accessorKey: 'orderId',
            className: 'font-medium text-zinc-400',
            cell: (order) => <span className="font-mono text-[10px] bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">#{order.orderId}</span>
        },
        {
            header: 'Cửa hàng',
            accessorKey: 'storeName',
            cell: (order) => (
                <div>
                    <span className="font-bold text-zinc-100 block text-sm">{order.storeName || `Cửa hàng #${order.storeId}`}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">ID: {order.storeId}</span>
                </div>
            )
        },
        {
            header: 'Ngày đặt',
            accessorKey: 'orderDate',
            cell: (order) => <span className="text-zinc-400 text-sm">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</span>
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
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)} className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-full w-8 h-8 p-0">
                        <Eye size={16} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-zinc-100 tracking-tight uppercase">Quản lý Đơn hàng</h1>
                    <p className="text-sm text-zinc-500 mt-1 font-medium italic">Workspace: Franchise Store • Theo dõi và quản lý các đơn hàng của bạn.</p>
                </div>
                <Button onClick={() => navigate('/orders/create')} className="shrink-0 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-tighter rounded-xl shadow-lg shadow-amber-500/10 h-11 px-6">
                    <Plus className="mr-2 h-4 w-4 stroke-[3px]" /> Tạo Đơn hàng
                </Button>
            </div>

            <Card className="border-zinc-800 bg-zinc-900/40 ring-1 ring-white/5 overflow-hidden">
                <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/20 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <Input
                            placeholder="Tìm mã đơn, tên cửa hàng..."
                            className="pl-10 bg-zinc-950/50 border-zinc-800 focus:border-amber-500/50 transition-all font-medium py-2 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        <div className="flex items-center gap-2 pr-3 border-r border-zinc-800 mr-1 shrink-0">
                            <Filter size={14} className="text-zinc-500" />
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Lọc:</span>
                        </div>
                        {['all', 'SUBMITTED', 'APPROVED', 'ALLOCATED', 'DELIVERED', 'REJECTED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-tighter border",
                                    statusFilter === status
                                        ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20"
                                        : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                                )}
                            >
                                {status === 'all' ? 'TẤT CẢ' :
                                    status === 'SUBMITTED' ? 'CHỜ DUYỆT' :
                                        status === 'APPROVED' ? 'ĐÃ DUYỆT' :
                                            status === 'ALLOCATED' ? 'ĐÃ PHÂN BỔ' :
                                                status === 'DELIVERED' ? 'HOÀN THÀNH' : 'TỪ CHỐI'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-hidden">
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
                    <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            Trang {page + 1} / {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page === 0}
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                className="bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 h-8 font-bold px-4"
                            >
                                Trước
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                                className="bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 h-8 font-bold px-4"
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            <OrderDetailDrawer
                order={selectedOrder}
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onStatusUpdate={handleStatusUpdate}
                onCancelOrder={handleCancelOrder}
            />
        </div>
    );
};
