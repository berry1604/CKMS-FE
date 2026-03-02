import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar as CalendarIcon, AlertCircle, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';


import { storeOrderApi } from '../../services/storeOrderApi';
import { productionPlanApi } from '../../services/productionPlan.api';
import type { StoreOrderResponse } from '../../types/storeOrder';

export const CreateTaskPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [backendError, setBackendError] = useState<string | null>(null);
    const [plannedDate, setPlannedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // YYYY-MM-DD
    });

    // Manage orders fetch
    const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        const fetchPendingOrders = async () => {
            setIsLoading(true);
            try {
                // Here we fetch all orders, but we should ideally filter on the backend for 'APPROVED' or 'SUBMITTED'
                // Pending orders ready to be planned.
                const res = await storeOrderApi.getAllOrders();
                const pending = (res.content || []).filter(o => o.status === 'SUBMITTED' || o.status === 'CONFIRMED');
                setOrders(pending);
            } catch (error) {
                console.error("Failed to fetch store orders:", error);
                toast.error("Không thể tải danh sách đơn hàng.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPendingOrders();
    }, []);

    const toggleSelection = (orderId: number) => {
        const newSet = new Set(selectedOrderIds);
        if (newSet.has(orderId)) {
            newSet.delete(orderId);
        } else {
            newSet.add(orderId);
        }
        setSelectedOrderIds(newSet);
    };

    const toggleAll = () => {
        if (selectedOrderIds.size === orders.length) {
            setSelectedOrderIds(new Set());
        } else {
            setSelectedOrderIds(new Set(orders.map(o => o.orderId)));
        }
    };

    const onSubmit = async () => {
        if (selectedOrderIds.size === 0) return;

        setBackendError(null);
        setIsSubmitting(true);
        try {
            await productionPlanApi.createProductionPlan({
                plannedDate,
                storeOrderIds: Array.from(selectedOrderIds)
            });

            toast.success('Production Plan created successfully');
            navigate('/kitchen');
        } catch (error: any) {
            console.error('Create plan error:', error);
            const message = error.response?.data?.message || 'Failed to create plan. Please try again.';
            setBackendError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns: Column<StoreOrderResponse>[] = [
        {
            header: (
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    checked={selectedOrderIds.size === orders.length && orders.length > 0}
                    onChange={toggleAll}
                />
            ),
            accessorKey: 'orderId',
            cell: (order) => (
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    checked={selectedOrderIds.has(order.orderId)}
                    onChange={() => toggleSelection(order.orderId)}
                />
            )
        },
        {
            header: 'Mã đơn',
            accessorKey: 'orderId',
            className: 'font-medium text-gray-200',
            cell: (order) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-400 border border-zinc-700">#{order.orderId}</span>
        },
        {
            header: 'Cửa hàng',
            accessorKey: 'storeId',
            cell: (order) => <span className="font-medium text-gray-300">Store #{order.storeId}</span>
        },
        {
            header: 'Ngày đặt',
            accessorKey: 'orderDate',
            cell: (order) => <span className="text-gray-400 text-sm">{new Date(order.orderDate).toLocaleDateString()}</span>
        },
        {
            header: 'Số lượng món',
            accessorKey: 'orderDetails',
            cell: (order) => <Badge variant="secondary" className="font-normal">{order.orderDetails?.length || 0} items</Badge>
        },
        {
            header: 'Tổng tiền',
            accessorKey: 'totalAmount',
            className: 'font-bold text-gray-200',
            cell: (order) => <span>${order.totalAmount.toFixed(2)}</span>
        },
        {
            header: 'Trạng thái',
            cell: (order) => {
                const statusStr = order.status?.toLowerCase() || 'unknown';
                return <Badge variant={statusStr === 'confirmed' ? 'success' : 'warning'}>{statusStr.toUpperCase()}</Badge>;
            }
        }
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/kitchen')}
                    className="hover:bg-zinc-800/80 rounded-full p-2 h-auto"
                >
                    <ArrowLeft size={20} className="text-gray-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-2">
                        <CalendarIcon size={24} className="text-amber-600" />
                        Tạo Kế hoạch sản xuất
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Chọn các đơn hàng đang chờ (Store Orders) để lên kế hoạch xuất cho Xưởng.</p>
                </div>
            </div>

            <Card className="p-6 md:p-8 border-0 shadow-sm ring-1 ring-zinc-700 bg-zinc-900/50">
                {backendError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
                        <div className="mt-0.5">
                            <AlertCircle size={18} className="text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Thất bại</h3>
                            <p className="text-sm">{backendError}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="p-4 bg-amber-500/10/50 border border-blue-100 rounded-xl flex items-start gap-4">
                        <div className="p-3 bg-amber-500/20 text-amber-600 rounded-lg">
                            <ShoppingCart size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-blue-900">Đơn hàng cần xử lý</h3>
                            <p className="text-sm text-amber-500/80 mt-1 mb-3">
                                Chọn một hoặc nhiều đơn hàng từ danh sách bên dưới để gom chung vào 1 lệnh sản xuất.
                            </p>
                            <div className="inline-flex items-center px-2 py-1 bg-zinc-900/50 border border-blue-200 rounded text-xs font-semibold text-amber-500">
                                Đã chọn: {selectedOrderIds.size} / {orders.length}
                            </div>
                        </div>
                    </div>

                    {/* Planned Date */}
                    <div className="p-4 bg-zinc-900/80 border border-zinc-700 rounded-xl">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Ngày sản xuất dự kiến *</label>
                        <input
                            type="date"
                            value={plannedDate}
                            onChange={(e) => setPlannedDate(e.target.value)}
                            className="w-full max-w-xs px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Chọn ngày dự kiến bắt đầu sản xuất</p>
                    </div>

                    <div className="border border-zinc-700 rounded-xl overflow-hidden shadow-sm">
                        <DataTable
                            data={orders}
                            columns={columns}
                            isLoading={isLoading}
                            keyExtractor={(o) => String(o.orderId)}
                        />
                    </div>
                </div>

                <div className="pt-6 mt-6 border-t border-zinc-800 flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/kitchen')}
                        disabled={isSubmitting}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        onClick={onSubmit}
                        className="bg-amber-600 hover:bg-blue-700 text-white min-w-[160px]"
                        disabled={isSubmitting || selectedOrderIds.size === 0}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang xử lý...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save size={18} />
                                Tạo Kế Hoạch ({selectedOrderIds.size})
                            </div>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
