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
                String(o.storeId).includes(lowerQuery)
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
            header: 'Order ID',
            accessorKey: 'orderId',
            className: 'font-medium text-gray-200',
            cell: (order) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-400">{order.orderId}</span>
        },
        {
            header: 'Store ID',
            accessorKey: 'storeId',
            cell: (order) => <span className="font-medium text-gray-300">{order.storeId}</span>
        },
        {
            header: 'Date',
            accessorKey: 'orderDate',
            cell: (order) => <span className="text-gray-400 text-sm">{new Date(order.orderDate).toLocaleDateString()}</span>
        },
        {
            header: 'Items',
            accessorKey: 'orderDetails',
            cell: (order) => <Badge variant="secondary" className="font-normal">{order.orderDetails?.length || 0} items</Badge>
        },
        {
            header: 'Total',
            accessorKey: 'totalAmount',
            className: 'font-bold',
            cell: (order) => <span className="text-gray-200">${order.totalAmount.toFixed(2)}</span>
        },
        {
            header: 'Status',
            cell: (order) => {
                const statusStr = order.status?.toLowerCase() || 'unknown';
                const colors: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "info" | "danger"> = {
                    submitted: 'warning',
                    rejected: 'danger',
                    grouped: 'info',
                    confirmed: 'info',
                    preparing: 'primary',
                    ready: 'secondary',
                    completed: 'success'
                };
                return <Badge variant={colors[statusStr] || 'default'}>{statusStr.replace('_', ' ').toUpperCase()}</Badge>;
            }
        },
        {
            header: 'Actions',
            cell: (order) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)} className="text-amber-600 hover:text-amber-500 hover:bg-amber-500/10">
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
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Order Management</h1>
                    <p className="text-sm text-gray-400 mt-1">Track and manage store orders.</p>
                </div>
                <Button onClick={() => navigate('/orders/create')} className="shrink-0 bg-amber-600 hover:bg-blue-700 text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Create Order
                </Button>
            </div>

            <Card className="border-0 shadow-sm ring-1 ring-zinc-700">
                <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search orders..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Filter size={16} className="text-gray-400 mr-1" />
                        <span className="text-sm text-gray-400 mr-2">Status:</span>
                        {['all', 'submitted', 'confirmed', 'preparing', 'ready', 'completed', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status as any)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap
                                    ${statusFilter === status
                                        ? 'bg-amber-500/10 border-blue-200 text-amber-500'
                                        : 'bg-zinc-900/50 border-zinc-700 text-gray-400 hover:bg-zinc-900/80'}`}
                            >
                                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </div>
                <DataTable
                    data={filteredOrders}
                    columns={columns}
                    keyExtractor={(order: StoreOrderResponse) => String(order.orderId)}
                    isLoading={isLoading}
                    onRowClick={(order) => setSelectedOrder(order)}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                            Page {page + 1} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 0}
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
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
