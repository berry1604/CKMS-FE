import { useEffect, useState } from 'react';
import { Check, X, Search, Eye, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { storeOrderApi } from '../../services/storeOrderApi';
import type { StoreOrderResponse } from '../../types/storeOrder';
import { toast } from 'react-hot-toast';
import { OrderDetailDrawer } from './OrderDetailDrawer';

export const OrderApproval = () => {
    const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<StoreOrderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Selection & Drawer state
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());
    const [selectedOrder, setSelectedOrder] = useState<StoreOrderResponse | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Reject Modal state
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingOrderId, setRejectingOrderId] = useState<number | null>(null);

    const fetchPendingOrders = async () => {
        setIsLoading(true);
        try {
            const res = await storeOrderApi.getAllOrders({ status: 'SUBMITTED', size: 100 });
            setOrders(res.content || []);
            setFilteredOrders(res.content || []);
            setSelectedOrderIds(new Set());
        } catch (error) {
            console.error('Failed to fetch pending orders:', error);
            toast.error('Gặp lỗi khi tải danh sách đơn hàng chờ duyệt.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingOrders();
    }, []);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredOrders(orders);
            return;
        }
        const lowerQuery = searchQuery.toLowerCase();
        setFilteredOrders(orders.filter(o =>
            String(o.orderId).includes(lowerQuery) ||
            String(o.storeId).includes(lowerQuery) ||
            (o.storeName && o.storeName.toLowerCase().includes(lowerQuery))
        ));
    }, [orders, searchQuery]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedOrderIds(new Set(filteredOrders.map(o => o.orderId)));
        } else {
            setSelectedOrderIds(new Set());
        }
    };

    const handleSelectOne = (orderId: number, checked: boolean) => {
        const newSet = new Set(selectedOrderIds);
        if (checked) newSet.add(orderId);
        else newSet.delete(orderId);
        setSelectedOrderIds(newSet);
    };

    const handleApprove = async (orderIds: number[]) => {
        if (orderIds.length === 0) return;
        setIsProcessing(true);
        try {
            await Promise.all(orderIds.map(id => storeOrderApi.updateOrderStatus(id, 'APPROVED')));
            toast.success(`Đã duyệt thành công ${orderIds.length} đơn hàng.`);
            fetchPendingOrders();
            setSelectedOrder(null);
        } catch (error) {
            console.error('Approval failed:', error);
            toast.error('Duyệt đơn hàng thất bại.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối.');
            return;
        }

        let targetIds = rejectingOrderId !== null ? [rejectingOrderId] : Array.from(selectedOrderIds);

        setIsProcessing(true);
        try {
            await Promise.all(targetIds.map(id => storeOrderApi.updateOrderStatus(id, 'REJECTED')));
            toast.success(`Đã từ chối ${targetIds.length} đơn hàng.`);

            setShowRejectModal(false);
            setRejectReason('');
            setRejectingOrderId(null);
            fetchPendingOrders();
            setSelectedOrder(null);
        } catch (error) {
            console.error('Rejection failed:', error);
            toast.error('Từ chối đơn hàng thất bại.');
        } finally {
            setIsProcessing(false);
        }
    };

    const openRejectModal = (orderId?: number) => {
        setRejectingOrderId(orderId || null);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const columns: Column<StoreOrderResponse>[] = [
        {
            header: (
                <div className="pl-1">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900"
                        checked={filteredOrders.length > 0 && selectedOrderIds.size === filteredOrders.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                </div>
            ),
            cell: (order) => (
                <div className="pl-1" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900"
                        checked={selectedOrderIds.has(order.orderId)}
                        onChange={(e) => handleSelectOne(order.orderId, e.target.checked)}
                    />
                </div>
            )
        },
        {
            header: 'Đơn hàng',
            accessorKey: 'orderId',
            className: 'font-bold text-zinc-100',
            cell: (order) => (
                <div className="flex flex-col">
                    <span className="font-black text-[12px] text-zinc-200 tracking-tighter">ORD-{order.orderId}</span>
                    <span className="text-[10px] text-zinc-500 font-medium">Đặt ngày: {new Date(order.orderDate).toLocaleDateString('vi-VN')}</span>
                </div>
            )
        },
        {
            header: 'Cửa hàng',
            cell: (order) => (
                <div className="flex flex-col">
                    <span className="font-bold text-zinc-300 text-[13px]">{order.storeName || `Store #${order.storeId}`}</span>
                    <span className="text-[10px] text-zinc-500 font-medium">ID: {order.storeId}</span>
                </div>
            )
        },
        {
            header: 'Tổng tiền',
            className: 'text-right',
            cell: (order) => (
                <span className="text-zinc-200 font-black text-[13px]">
                    {order.totalAmount.toLocaleString()} <span className="text-[10px] text-zinc-500 ml-0.5">VNĐ</span>
                </span>
            )
        },
        {
            header: 'Trạng thái',
            cell: () => (
                <Badge variant="warning" className="text-[10px] font-black tracking-widest px-2 py-0.5 border-0">
                    PENDING
                </Badge>
            )
        },
        {
            header: 'Hành động',
            className: 'text-right',
            cell: (order) => (
                <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        className="h-8 w-8 p-0 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg"
                        title="Xem chi tiết"
                    >
                        <Eye size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove([order.orderId])}
                        disabled={isProcessing}
                        className="h-8 w-8 p-0 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                        title="Duyệt đơn"
                    >
                        <Check size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRejectModal(order.orderId)}
                        disabled={isProcessing}
                        className="h-8 w-8 p-0 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                        title="Từ chối"
                    >
                        <X size={16} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-black">
                            <Filter size={18} />
                        </div>
                        <h1 className="text-2xl font-black text-zinc-100 tracking-tight uppercase">Phê duyệt đơn hàng</h1>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium tracking-wide">
                        Bạn có <span className="text-amber-500 font-bold">{orders.length} đơn hàng</span> đang chờ xét duyệt từ các chi nhánh.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {selectedOrderIds.size > 0 && (
                        <div className="flex gap-2 animate-in slide-in-from-right-4 duration-300">
                            <Button
                                variant="outline"
                                className="bg-red-500/5 text-red-500 border-red-500/20 hover:bg-red-500/10 h-10 px-4 rounded-xl font-bold text-[11px] uppercase tracking-widest"
                                onClick={() => openRejectModal()}
                                disabled={isProcessing}
                            >
                                <X size={16} className="mr-2" /> Từ chối ({selectedOrderIds.size})
                            </Button>
                            <Button
                                className="bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-900/20 h-10 px-6 rounded-xl font-black text-[11px] uppercase tracking-widest border-0"
                                onClick={() => handleApprove(Array.from(selectedOrderIds))}
                                disabled={isProcessing}
                            >
                                <CheckCircle2 size={16} className="mr-2" /> Duyệt ({selectedOrderIds.size})
                            </Button>
                        </div>
                    )}

                    <div className="relative group">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                        <Input
                            placeholder="Tìm đơn hàng, cửa hàng..."
                            className="pl-10 h-10 w-full md:w-72 bg-zinc-900/50 border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/10 rounded-xl transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/20 overflow-hidden shadow-2xl">
                <DataTable
                    data={filteredOrders}
                    columns={columns}
                    keyExtractor={(order: StoreOrderResponse) => String(order.orderId)}
                    isLoading={isLoading}
                    emptyMessage={
                        <div className="flex flex-col items-center gap-3 py-10">
                            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-600">
                                <CheckCircle2 size={32} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Tất cả đã hoàn tất</p>
                                <p className="text-[11px] text-zinc-600 font-medium mt-1">Hiện không có đơn hàng nào cần xét duyệt.</p>
                            </div>
                        </div>
                    }
                />
            </div>

            {/* Order Detail Drawer */}
            <OrderDetailDrawer
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
                onStatusUpdate={(id, status) => {
                    if (status === 'APPROVED') handleApprove([id]);
                    else if (status === 'REJECTED') openRejectModal(id);
                }}
            />

            {/* Modern Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/50 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-600/50"></div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-zinc-100 uppercase tracking-tight">Từ chối Đơn hàng</h3>
                                <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                                    {rejectingOrderId ? `Mã đơn: #ORD-${rejectingOrderId}` : `${selectedOrderIds.size} Đơn hàng đang chọn`}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Lý do từ chối (Bắt buộc)</label>
                                <textarea
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all min-h-[120px] resize-none"
                                    placeholder="Ví dụ: Sản phẩm tạm hết hàng, Sai thông tin định lượng..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-8">
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white h-12 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-900/20 border-0"
                                onClick={handleReject}
                                disabled={isProcessing || !rejectReason.trim()}
                            >
                                {isProcessing ? 'Đang xử lý...' : 'Xác nhận Từ chối'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setShowRejectModal(false)}
                                disabled={isProcessing}
                                className="h-10 text-zinc-500 hover:text-zinc-200 font-bold uppercase text-[10px] tracking-widest"
                            >
                                Quay lại
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
