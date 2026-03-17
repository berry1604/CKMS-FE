import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Check, X, Search, Eye, Filter, CheckCircle2, 
    AlertCircle, Mail, Calendar, Package, Leaf, 
    Scissors 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { storeOrderApi } from '../../services/storeOrderApi';
import { kitchenInventoryApi } from '../../services/kitchenInventory.api';
import type { StoreOrderResponse } from '../../types/storeOrder';
import type { KitchenInventorySummaryResponse } from '../../types/kitchenInventory';
import { toast } from 'react-hot-toast';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import { RescheduleModal } from '../../components/orders/RescheduleModal';
import { cn } from '../../utils/classNames';
import { useStockAnalysis } from '../../hooks/useStockAnalysis';

export const OrderApproval = () => {
    const navigate = useNavigate();
    // ... (rest of the component state is already there)
    const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<StoreOrderResponse[]>([]);
    const [inventory, setInventory] = useState<KitchenInventorySummaryResponse[]>([]);
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
    
    // Reschedule state
    const [rescheduleData, setRescheduleData] = useState<{ id: number, date: string } | null>(null);
    const [rescheduledId, setRescheduledId] = useState<number | null>(null);

    // Stock Analysis hook
    const { analysisResults } = useStockAnalysis(orders, inventory);

    // Filter states
    const [selectedProduct, setSelectedProduct] = useState<string>('all');
    const [selectedDate, setSelectedDate] = useState<string>('all');

    // Derived filter options
    const productOptions = Array.from(new Set(orders.flatMap(o => o.orderDetails.map(d => d.productName)))).sort();
    const dateOptions = Array.from(new Set(orders.map(o => o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString('vi-VN') : 'N/A'))).sort();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [ordersRes, inventoryRes] = await Promise.all([
                storeOrderApi.getAllOrders({ status: 'SUBMITTED', size: 100 }),
                kitchenInventoryApi.getWarehouseStock(1) // Assuming main kitchen warehouse is 1
            ]);
            
            setOrders(ordersRes.content || []);
            setFilteredOrders(ordersRes.content || []);
            
            // Map KitchenStockItemResponse to KitchenInventorySummaryResponse
            const mappedInventory: KitchenInventorySummaryResponse[] = (inventoryRes.data || []).map(item => ({
                itemId: item.itemId,
                itemName: item.itemName,
                itemType: item.itemType as "MATERIAL" | "PRODUCT",
                totalQuantity: item.quantity,
                unit: item.unit
            }));

            setInventory(mappedInventory);
            setSelectedOrderIds(new Set());
        } catch (error) {
            console.error('Failed to fetch data:', error);
            // toast.error('Gặp lỗi khi tải dữ liệu.');
        } finally {
            setIsLoading(false);
        }
    };



    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let result = [...orders];

        // Search filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(o =>
                String(o.orderId).includes(lowerQuery) ||
                String(o.storeId).includes(lowerQuery) ||
                (o.storeName && o.storeName.toLowerCase().includes(lowerQuery))
            );
        }

        // Product filter
        if (selectedProduct !== 'all') {
            result = result.filter(o => o.orderDetails.some(d => d.productName === selectedProduct));
        }

        // Date filter
        if (selectedDate !== 'all') {
            result = result.filter(o => (o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString('vi-VN') : 'N/A') === selectedDate);
        }

        setFilteredOrders(result);
    }, [orders, searchQuery, selectedProduct, selectedDate]);

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
            await Promise.all(orderIds.map(id => storeOrderApi.approveOrder(id)));
            toast.success(`Đã duyệt thành công ${orderIds.length} đơn hàng.`);
            fetchData();
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
            await Promise.all(targetIds.map(id => storeOrderApi.rejectOrder(id, rejectReason)));
            toast.success(`Đã từ chối ${targetIds.length} đơn hàng.`);

            setShowRejectModal(false);
            setRejectReason('');
            setRejectingOrderId(null);
            fetchData();
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
            header: 'Items',
            cell: (order) => (
                <div className="flex flex-col gap-0.5">
                    {order.orderDetails.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-[11px] font-bold text-zinc-300">{item.productName}</span>
                            <span className="text-[10px] text-zinc-500 font-medium">x{item.quantity}</span>
                        </div>
                    ))}
                    {order.orderDetails.length > 2 && (
                        <span className="text-[9px] text-amber-500/70 font-black italic">+{order.orderDetails.length - 2} items more...</span>
                    )}
                </div>
            )
        },
        {
            header: 'Số lượng',
            className: 'text-center',
            cell: (order) => (
                <span className="text-zinc-200 font-black text-[13px]">
                    {order.orderDetails.reduce((acc, curr) => acc + curr.quantity, 0)}
                </span>
            )
        },
        {
            header: 'Ngày giao',
            cell: (order) => (
                <span className={cn(
                    "font-bold text-[11px] tracking-tight whitespace-nowrap px-2 py-1 rounded-lg transition-all",
                    rescheduledId === order.orderId ? "animate-pulse-once bg-amber-500/20 text-amber-500" : "text-zinc-300"
                )}>
                    {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : 'N/A'}
                </span>
            )
        },
        {
            header: 'Kho',
            cell: (order) => {
                const analysis = analysisResults[order.orderId];
                if (!analysis) return <span className="text-[10px] text-zinc-600 animate-pulse">Đang tính...</span>;

                return (
                    <div className="relative group/stock">
                        {analysis.isEnough ? (
                            <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-0 flex items-center gap-1 text-[9px] py-0 px-1.5 cursor-help">
                                <Check size={10} strokeWidth={3} /> ĐỦ HÀNG
                            </Badge>
                        ) : (
                            <Badge variant="danger" className="bg-red-500/10 text-red-400 border-0 flex items-center gap-1 text-[9px] py-0 px-1.5 cursor-help">
                                <AlertCircle size={10} strokeWidth={3} /> THIẾU {analysis.shortageMaterials.length} NL
                            </Badge>
                        )}
                        
                        {/* Tooltip / Popover Detail */}
                        <div className="absolute left-0 top-full mt-2 w-64 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover/stock:opacity-100 group-hover/stock:visible transition-all z-50 pointer-events-none">
                            <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2">Chi tiết nguyên liệu</h5>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {analysis.details.map((d, i) => (
                                    <div key={i} className="flex justify-between items-start text-[10px]">
                                        <div className="flex flex-col">
                                            <span className={cn("font-bold", d.isEnough ? "text-zinc-300" : "text-red-400")}>{d.materialName}</span>
                                            <span className="text-zinc-600">Cần: {d.required}{d.unit}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn("font-black", d.isEnough ? "text-emerald-500" : "text-red-500")}>
                                                Có: {d.available}{d.unit}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }
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
                        onClick={async () => {
                            try {
                                await storeOrderApi.notifyOrder(order.orderId);
                                toast.success('Đã gửi email thông báo.');
                            } catch {
                                toast.error('Gửi email thất bại.');
                            }
                        }}
                        className="h-8 w-8 p-0 text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg"
                        title="Gửi Email"
                    >
                        <Mail size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRescheduleData({ id: order.orderId, date: order.deliveryDate })}
                        className="h-8 w-8 p-0 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg"
                        title="Đổi ngày"
                    >
                        <Calendar size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/orders/${order.orderId}/split`)}
                        className="h-8 w-8 p-0 text-zinc-500 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg"
                        title="Tách đơn"
                    >
                        <Scissors size={16} />
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                                    <Filter size={18} />
                                </div>
                                <h1 className="text-2xl font-black text-zinc-100 tracking-tight uppercase">Phê duyệt & Điều phối Đơn hàng</h1>
                            </div>
                            <p className="text-xs text-zinc-500 font-medium tracking-wide">
                                Bạn có <span className="text-amber-500 font-bold">{orders.length} đơn hàng</span> đang chờ xét duyệt.
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

                    {/* Advanced Filter Bar */}
                    <div className="flex flex-wrap items-center gap-4 p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl animate-in slide-in-from-left-4 duration-500">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                            <Package size={14} className="text-amber-500" />
                            <select 
                                className="bg-transparent text-[11px] font-bold text-zinc-300 focus:outline-none cursor-pointer"
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                            >
                                <option value="all" className="bg-zinc-900">Tất cả món</option>
                                {productOptions.map(p => (
                                    <option key={p} value={p} className="bg-zinc-900">{p}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                            <Calendar size={14} className="text-amber-500" />
                            <select 
                                className="bg-transparent text-[11px] font-bold text-zinc-300 focus:outline-none cursor-pointer"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            >
                                <option value="all" className="bg-zinc-900">Tất cả ngày giao</option>
                                {dateOptions.map(d => (
                                    <option key={d} value={d} className="bg-zinc-900">{d}</option>
                                ))}
                            </select>
                        </div>

                        {(selectedProduct !== 'all' || selectedDate !== 'all') && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setSelectedProduct('all'); setSelectedDate('all'); }}
                                className="text-[10px] font-black uppercase text-amber-500 hover:bg-amber-500/5 h-8 px-3 rounded-lg"
                            >
                                Xóa bộ lọc
                            </Button>
                        )}
                    </div>

                    {/* Smart Coordination Suggestion */}
                    {filteredOrders.length > 0 && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-[28px] p-6 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                    <AlertCircle size={20} />
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div>
                                        <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">Gợi ý Điều phối Thông minh</h3>
                                        <p className="text-[11px] text-zinc-500 font-medium mt-1">Dựa trên ngày nhận hàng và tồn kho khả dụng tại kho trung tâm.</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-zinc-900/40 rounded-2xl p-4 border border-zinc-800/50">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Khuyến nghị Duyệt</span>
                                            {filteredOrders
                                                .filter(o => analysisResults[o.orderId]?.isEnough)
                                                .sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime())
                                                .slice(0, 1)
                                                .map(o => (
                                                    <div key={o.orderId} className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-zinc-200">ORD-{o.orderId} - {o.storeName}</span>
                                                        <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px]">ĐỦ HÀNG</Badge>
                                                    </div>
                                                ))}
                                            {filteredOrders.filter(o => o.orderDetails.every(item => (inventory.find(i => i.itemName === item.productName)?.totalQuantity || 0) >= item.quantity)).length === 0 && (
                                                <span className="text-[10px] text-zinc-500 italic font-medium">Không có gợi ý phù hợp.</span>
                                            )}
                                        </div>
                                        <div className="bg-zinc-900/40 rounded-2xl p-4 border border-zinc-800/50">
                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2">Tồn kho không đủ</span>
                                            {filteredOrders
                                                .filter(o => analysisResults[o.orderId] && !analysisResults[o.orderId].isEnough)
                                                .slice(0, 1)
                                                .map(o => (
                                                    <div key={o.orderId} className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-zinc-200">ORD-{o.orderId} - {o.storeName}</span>
                                                        <span className="text-[10px] text-zinc-500 font-medium italic">Xem chi tiết</span>
                                                    </div>
                                                ))}
                                            {filteredOrders.filter(o => o.orderDetails.some(item => (inventory.find(i => i.itemName === item.productName)?.totalQuantity || 0) < item.quantity)).length === 0 && (
                                                <span className="text-[10px] text-zinc-500 italic font-medium">Mọi đơn hàng đều đủ tồn kho.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stock Summary Panel */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-[32px] p-6 sticky top-6 max-h-[calc(100vh-48px)] flex flex-col overflow-hidden">
                        <div className="flex items-center gap-3 mb-6 shrink-0">
                            <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-500">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-zinc-100 uppercase tracking-tight">Tồn kho Hệ thống</h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Toàn bộ kho trung tâm</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                            {/* Products Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <Package size={12} className="text-amber-500" />
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Thành phẩm & BTP</span>
                                </div>
                                <div className="space-y-2">
                                    {inventory.filter(i => i.itemType === 'PRODUCT').map((item, idx) => (
                                        <div key={idx} className="group p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-amber-500/30 transition-all">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-zinc-300 group-hover:text-zinc-100 transition-colors">{item.itemName}</span>
                                                <span className="text-[10px] font-black text-amber-500">{item.totalQuantity} <span className="text-zinc-600 text-[8px] uppercase">{item.unit}</span></span>
                                            </div>
                                            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000",
                                                        item.totalQuantity > 100 ? "bg-emerald-500/50" : item.totalQuantity > 50 ? "bg-amber-500/50" : "bg-red-500/50"
                                                    )}
                                                    style={{ width: `${Math.min((item.totalQuantity / 500) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Materials Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <Leaf size={12} className="text-emerald-500" />
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nguyên liệu thô</span>
                                </div>
                                <div className="space-y-2">
                                    {inventory.filter(i => i.itemType === 'MATERIAL').map((item, idx) => (
                                        <div key={idx} className="group p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-emerald-500/30 transition-all">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-zinc-300 group-hover:text-zinc-100 transition-colors">{item.itemName}</span>
                                                <span className="text-[10px] font-black text-emerald-500">{item.totalQuantity} <span className="text-zinc-600 text-[8px] uppercase">{item.unit}</span></span>
                                            </div>
                                            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000",
                                                        item.totalQuantity > 200 ? "bg-emerald-500/50" : item.totalQuantity > 100 ? "bg-amber-500/50" : "bg-red-500/50"
                                                    )}
                                                    style={{ width: `${Math.min((item.totalQuantity / 1000) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button 
                            variant="ghost" 
                            className="w-full mt-6 h-10 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-amber-500 hover:bg-amber-500/5 border border-zinc-800 rounded-xl shrink-0"
                            onClick={() => fetchData()}
                        >
                            Làm mới Tồn kho
                        </Button>
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

            {/* Reschedule Modal */}
            {rescheduleData && (
                <RescheduleModal
                    isOpen={!!rescheduleData}
                    onClose={() => setRescheduleData(null)}
                    orderId={rescheduleData.id}
                    currentDeliveryDate={rescheduleData.date}
                    onSuccess={(newDate) => {
                        setOrders(prev => prev.map(o => o.orderId === rescheduleData.id ? { ...o, deliveryDate: newDate } : o));
                        setRescheduledId(rescheduleData.id);
                        setTimeout(() => setRescheduledId(null), 3000);
                        fetchData(); // Refresh to catch any other changes
                    }}
                />
            )}

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
