import { useEffect, useState } from 'react';
import { Package, Search, Warehouse, CheckCircle, XCircle, Truck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { storeOrderApi } from '../../services/storeOrderApi';
import { kitchenInventoryApi } from '../../services/kitchenInventory.api';
import type { StoreOrderResponse } from '../../types/storeOrder';
import type { KitchenStockItemResponse } from '../../types/kitchenInventory';
import toast from 'react-hot-toast';

export const WarehouseFulfillment = () => {
    const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<StoreOrderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<StoreOrderResponse | null>(null);
    const [warehouseStock, setWarehouseStock] = useState<KitchenStockItemResponse[]>([]);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const warehouseId = 1; // Default Central Kitchen Warehouse

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await storeOrderApi.getAllOrders({ size: 1000 });
            // Only show orders that need fulfillment
            const fulfillmentOrders = (res.content || []).filter(
                (o) => o.status === 'APPROVED' || o.status === 'PREPARING' || o.status === 'READY'
            );
            setOrders(fulfillmentOrders);
            setFilteredOrders(fulfillmentOrders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('Không thể tải danh sách đơn hàng');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStock = async () => {
        setIsLoadingStock(true);
        try {
            const res = await kitchenInventoryApi.getWarehouseStock(warehouseId);
            setWarehouseStock(res.data || []);
        } catch (error) {
            console.error('Failed to fetch warehouse stock:', error);
            toast.error('Không thể tải dữ liệu bếp trung tâm');
        } finally {
            setIsLoadingStock(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        if (selectedOrder) {
            fetchStock();
        }
    }, [selectedOrder]);

    useEffect(() => {
        let result = orders;
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(
                (o) =>
                    String(o.orderId).includes(lowerQuery) ||
                    String(o.storeId).includes(lowerQuery)
            );
        }
        setFilteredOrders(result);
    }, [searchQuery, orders]);

    const handleFulfillOrder = async () => {
        if (!selectedOrder) return;

        setIsSubmitting(true);
        try {
            // Check if stock is sufficient before proceeding
            const isStockSufficient = selectedOrder.orderDetails.every(item => {
                const stockItem = warehouseStock.find(stock => stock.itemId === item.productId && stock.itemType === 'PRODUCT');
                return (stockItem?.quantity || 0) >= item.quantity;
            });

            if (!isStockSufficient) {
                toast.error('Không đủ tồn tồn bếp để xuất đơn hàng này!');
                setIsSubmitting(false);
                return;
            }

            if (selectedOrder.status === 'APPROVED' || selectedOrder.status === 'PREPARING') {
                toast.error('Đơn hàng chưa sản xuất xong! Vui lòng hoàn thành Lịch Sản Xuất trước.');
                setIsSubmitting(false);
                return;
            }

            toast.success('Hàng trong bếp đã đủ! Vui lòng sang tab "Vận chuyển" để tạo đơn giao hàng cho tài xế.');
            setSelectedOrder(null);
        } catch (error) {
            console.error('Failed to fulfill order:', error);
            toast.error('Có lỗi xảy ra khi xử lý đơn hàng');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Table columns
    const columns: Column<StoreOrderResponse>[] = [
        {
            header: 'Mã đơn',
            accessorKey: 'orderId',
            className: 'font-medium text-[var(--text-primary)]',
            cell: (order) => (
                <span className="font-mono text-xs bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] px-2 py-1 rounded">
                    #{order.orderId}
                </span>
            ),
        },
        {
            header: 'Cửa hàng',
            accessorKey: 'storeId',
            cell: (order) => <span className="font-medium text-[var(--text-primary)]">Cửa hàng {order.storeId}</span>,
        },
        {
            header: 'Ngày đặt',
            accessorKey: 'orderDate',
            cell: (order) => (
                <span className="text-[var(--text-secondary)] text-sm">
                    {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                </span>
            ),
        },
        {
            header: 'Số lượng món',
            accessorKey: 'orderDetails',
            cell: (order) => (
                <Badge variant="secondary" className="font-normal">
                    {order.orderDetails?.length || 0} món
                </Badge>
            ),
        },
        {
            header: 'Trạng thái',
            cell: (order) => {
                const statusMap: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'danger'> = {
                    submitted: 'warning',
                    confirmed: 'info',
                    preparing: 'primary',
                    ready: 'success',
                    shipping: 'info',
                    completed: 'success',
                };
                const statusStr = order.status?.toLowerCase() || 'unknown';
                return (
                    <Badge variant={statusMap[statusStr] || 'default'}>
                        {statusStr === 'approved' ? 'ĐÃ DUYỆT' :
                         statusStr === 'ready' ? 'SẴN SÀNG' :
                         statusStr === 'preparing' ? 'ĐANG CHẾ BIẾN' :
                         statusStr === 'shipping' ? 'ĐANG GIAO' :
                         statusStr === 'completed' ? 'HOÀN THÀNH' :
                         statusStr === 'submitted' ? 'CHỜ DUYỆT' :
                         statusStr.toUpperCase()}
                    </Badge>
                );
            },
        },
        {
            header: 'Thao tác',
            cell: (order) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 dark:text-amber-500 dark:hover:text-amber-400 dark:hover:bg-amber-500/10 font-bold"
                    >
                        Xử lý xuất bếp
                    </Button>
                </div>
            ),
        },
    ];

    const renderOrderDetailModal = () => {
        if (!selectedOrder) return null;

        // Check stock availability
        const checkStock = (productId: number, requiredQty: number) => {
            const stockItem = warehouseStock.find(stock => stock.itemId === productId && stock.itemType === 'PRODUCT');
            const currentStock = stockItem?.quantity || 0;
            const isSufficient = currentStock >= requiredQty;
            return { currentStock, isSufficient };
        };

        const allSufficient = selectedOrder.orderDetails.every(item => {
            return checkStock(item.productId, item.quantity).isSufficient;
        });

        const footer = (
            <div className="flex justify-between w-full">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                    Đóng
                </Button>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleFulfillOrder}
                    disabled={!allSufficient || isSubmitting || isLoadingStock}
                    isLoading={isSubmitting}
                >
                    <Truck size={16} className="mr-2" />
                    Xuất bếp & Giao hàng
                </Button>
            </div>
        );

        return (
            <Drawer
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                title={`Xử lý xuất bếp - Đơn #${selectedOrder.orderId}`}
                description={`Kiểm tra tồn bếp và xuất xứ cho Cửa hàng ${selectedOrder.storeId}`}
                width="max-w-3xl"
                footer={footer}
            >
                <div className="space-y-6">
                    <Card className="p-4 border-[var(--border-primary)] bg-[var(--text-primary)]/[0.02]">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] rounded-lg">
                                <Warehouse size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--text-primary)]">Thông tin xuất bếp</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">
                                    Hệ thống sẽ đối soát tồn bếp hiện tại (Bếp Tổng #{warehouseId}) với yêu cầu của đơn hàng.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <div className="border border-[var(--border-primary)] rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-[var(--border-primary)]">
                            <thead className="bg-[var(--text-primary)]/5">
                                <tr className="bg-[var(--text-primary)]/[0.03] uppercase tracking-widest text-[10px] font-black italic">
                                    <th className="px-6 py-4 text-left text-[var(--text-secondary)]">Sản phẩm</th>
                                    <th className="px-6 py-4 text-right text-[var(--text-secondary)]">Yêu cầu</th>
                                    <th className="px-6 py-4 text-right text-[var(--text-secondary)]">Tồn bếp</th>
                                    <th className="px-6 py-4 text-center text-[var(--text-secondary)]">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-primary)]">
                                {isLoadingStock ? (
                                    <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                                            Đang kiểm tra tồn bếp...
                                        </td>
                                    </tr>
                                ) : (
                                    selectedOrder.orderDetails?.map((item, idx) => {
                                        const stockInfo = checkStock(item.productId, item.quantity);
                                        return (
                                            <tr key={idx} className={`transition-colors border-b border-[var(--border-primary)]/5 ${stockInfo.isSufficient ? 'bg-transparent' : 'bg-red-500/5'}`}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-black italic uppercase text-[var(--text-primary)]">
                                                    {item.productName || `Sản phẩm #${item.productId}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)] text-right font-black italic">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)] text-right font-mono font-black italic">
                                                    <span className={stockInfo.isSufficient ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                                                        {stockInfo.currentStock}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center flex justify-center">
                                                    {stockInfo.isSufficient ? (
                                                        <div className="flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                            <CheckCircle size={12} className="mr-1" /> Đủ hàng
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                                                            <XCircle size={12} className="mr-1" /> Thiếu hàng
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!isLoadingStock && !allSufficient && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                            <XCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="font-semibold text-red-500 text-sm uppercase">Không đủ hàng trong bếp</h4>
                                <p className="text-[var(--text-secondary)] text-sm mt-1">Một số sản phẩm không đủ tồn bếp để đáp ứng đơn hàng này. Vui lòng sản xuất thêm hoặc nạp bếp trước khi xuất.</p>
                            </div>
                        </div>
                    )}
                </div>
            </Drawer>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Hệ thống Bếp xuất hàng</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Kiểm tra tồn bếp và xử lý giao hàng cho hệ thống cửa hàng.
                    </p>
                </div>
            </div>

            <Card className="border-0 shadow-sm ring-1 ring-[var(--border-primary)] bg-[var(--bg-card)]">
                <div className="p-4 border-b border-[var(--border-primary)] flex flex-col md:flex-row gap-4 justify-between items-center bg-[var(--text-primary)]/[0.01]">
                    <div className="relative w-full md:w-80">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                        <Input
                            placeholder="Tìm kiếm mã đơn, cửa hàng..."
                            className="pl-10 h-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] font-medium">
                        <Package size={16} />
                        Có {filteredOrders.length} đơn hàng chờ xử lý
                    </div>
                </div>

                <DataTable
                    data={filteredOrders}
                    columns={columns}
                    keyExtractor={(order: StoreOrderResponse) => String(order.orderId)}
                    isLoading={isLoading}
                    onRowClick={(order) => setSelectedOrder(order)}
                />
            </Card>

            {renderOrderDetailModal()}
        </div>
    );
};
