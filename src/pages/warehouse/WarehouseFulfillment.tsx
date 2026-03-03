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
            const res = await storeOrderApi.getAllOrders();
            // Only show orders that need fulfillment
            const fulfillmentOrders = (res.content || []).filter(
                (o) => o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'READY'
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
            toast.error('Không thể tải dữ liệu kho');
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
                toast.error('Không đủ tồn kho để xuất kho đơn hàng này!');
                setIsSubmitting(false);
                return;
            }

            if (selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'PREPARING') {
                toast.error('Đơn hàng chưa sản xuất xong! Vui lòng hoàn thành Lịch Sản Xuất trước.');
                setIsSubmitting(false);
                return;
            }

            toast.success('Hàng trong kho đã đủ! Vui lòng sang tab "Vận chuyển" để tạo đơn giao hàng cho tài xế.');
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
            className: 'font-medium text-gray-200',
            cell: (order) => (
                <span className="font-mono text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded">
                    #{order.orderId}
                </span>
            ),
        },
        {
            header: 'Cửa hàng',
            accessorKey: 'storeId',
            cell: (order) => <span className="font-medium text-gray-300">Cửa hàng {order.storeId}</span>,
        },
        {
            header: 'Ngày đặt',
            accessorKey: 'orderDate',
            cell: (order) => (
                <span className="text-gray-500 text-sm">
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
                        {statusStr.toUpperCase()}
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
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                        Xử lý xuất kho
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
                    Xuất kho & Giao hàng
                </Button>
            </div>
        );

        return (
            <Drawer
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                title={`Xử lý xuất kho - Đơn #${selectedOrder.orderId}`}
                description={`Kiểm tra tồn kho và xuất xứ cho Cửa hàng ${selectedOrder.storeId}`}
                width="max-w-3xl"
                footer={footer}
            >
                <div className="space-y-6">
                    <Card className="p-4 border-indigo-100 bg-indigo-50/30">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Warehouse size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-indigo-900">Thông tin xuất kho</h3>
                                <p className="text-sm text-indigo-700/80 mt-1">
                                    Hệ thống sẽ đối soát tồn kho hiện tại (Kho Tổng #{warehouseId}) với yêu cầu của đơn hàng.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Yêu cầu</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Tồn kho</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {isLoadingStock ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            Đang kiểm tra tồn kho...
                                        </td>
                                    </tr>
                                ) : (
                                    selectedOrder.orderDetails?.map((item, idx) => {
                                        const stockInfo = checkStock(item.productId, item.quantity);
                                        return (
                                            <tr key={idx} className={stockInfo.isSufficient ? 'bg-white' : 'bg-red-50/50'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {item.productName || `Product #${item.productId}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    <span className={stockInfo.isSufficient ? 'text-green-600 font-medium' : 'text-red-600 font-bold'}>
                                                        {stockInfo.currentStock}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center flex justify-center">
                                                    {stockInfo.isSufficient ? (
                                                        <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                                                            <CheckCircle size={14} className="mr-1" /> Đủ hàng
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">
                                                            <XCircle size={14} className="mr-1" /> Thiếu hàng
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
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <XCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="font-semibold text-red-800 text-sm">Không đủ hàng trong kho</h4>
                                <p className="text-red-600 text-sm mt-1">Một số sản phẩm không đủ tồn kho để đáp ứng đơn hàng này. Vui lòng sản xuất thêm hoặc nạp kho trước khi xuất.</p>
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
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Hệ thống Kho xuất hàng</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Kiểm tra tồn kho và xử lý giao hàng cho hệ thống cửa hàng.
                    </p>
                </div>
            </div>

            <Card className="border-0 shadow-sm ring-1 ring-zinc-800 bg-zinc-900/50">
                <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/50">
                    <div className="relative w-full md:w-80">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm mã đơn, cửa hàng..."
                            className="pl-10 bg-zinc-900/50 border-zinc-800 text-gray-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
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
