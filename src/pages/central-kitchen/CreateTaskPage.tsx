import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Calendar as CalendarIcon, AlertCircle, ShoppingCart,
    ChevronDown, ChevronUp, Package, AlertTriangle, CheckCircle2, Warehouse
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

import { storeOrderApi } from '../../services/storeOrderApi';
import { productionPlanApi } from '../../services/productionPlan.api';
import { kitchenInventoryApi } from '../../services/kitchenInventory.api';
import { useAuth } from '../../hooks/useAuth';
import type { StoreOrderResponse, OrderDetailResponse } from '../../types/storeOrder';
import type { KitchenStockItemResponse } from '../../types/kitchenInventory';

// ─── Types ────────────────────────────────────────────────────────────────────

/** productId → available stock quantity (summed across all warehouses) */
type ProductStockMap = Map<number, number>;

/** productName (lowercased) → available stock quantity (fallback when productId doesn't match) */
type ProductNameStockMap = Map<string, number>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStockForItem(
    item: OrderDetailResponse,
    stockById: ProductStockMap,
    stockByName: ProductNameStockMap
): number | null {
    if (stockById.has(item.productId)) return stockById.get(item.productId)!;
    const nameLower = item.productName?.toLowerCase().trim();
    if (nameLower && stockByName.has(nameLower)) return stockByName.get(nameLower)!;
    return null;
}

function orderHasWarning(
    order: StoreOrderResponse,
    stockById: ProductStockMap,
    stockByName: ProductNameStockMap
): boolean {
    return (order.orderDetails || []).some((item) => {
        const available = getStockForItem(item, stockById, stockByName);
        return available !== null && available < item.quantity;
    });
}

// ─── Sub-component: Expandable Order Row ─────────────────────────────────────

interface OrderRowProps {
    order: StoreOrderResponse;
    isSelected: boolean;
    onToggle: () => void;
    stockById: ProductStockMap;
    stockByName: ProductNameStockMap;
}

const OrderRow = ({ order, isSelected, onToggle, stockById, stockByName }: OrderRowProps) => {
    const [expanded, setExpanded] = useState(false);
    const warn = orderHasWarning(order, stockById, stockByName);

    return (
        <>
            {/* Main row */}
            <tr className={`hover:bg-zinc-800/50 transition-colors ${isSelected ? 'bg-amber-500/5' : ''}`}>
                <td className="px-4 py-3">
                    <input
                        type="checkbox"
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        checked={isSelected}
                        onChange={onToggle}
                    />
                </td>
                <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-zinc-800 px-2 py-1 rounded text-gray-400 border border-zinc-700">
                        #{order.orderId}
                    </span>
                </td>
                <td className="px-4 py-3">
                    <span className="font-medium text-gray-300">{order.storeName || `Store #${order.storeId}`}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                    {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-normal">{order.orderDetails?.length || 0} món</Badge>
                        {warn && (
                            <span title="Thiếu nguyên liệu trong kho">
                                <AlertTriangle size={14} className="text-red-400" />
                            </span>
                        )}
                    </div>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-200">
                    {order.totalAmount.toLocaleString('vi-VN')}đ
                </td>
                <td className="px-4 py-3">
                    <Badge variant={order.status?.toLowerCase() === 'confirmed' ? 'success' : 'warning'}>
                        {order.status}
                    </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-gray-400 hover:text-amber-400 p-1 rounded transition-colors"
                        title="Xem chi tiết sản phẩm"
                    >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </td>
            </tr>

            {/* Expanded detail rows */}
            {expanded && (
                <tr className="bg-zinc-900/80">
                    <td colSpan={8} className="px-6 py-3">
                        <div className="rounded-lg overflow-hidden border border-zinc-700">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-zinc-800 text-xs text-gray-400 uppercase tracking-wider">
                                        <th className="px-4 py-2 text-left">Sản phẩm</th>
                                        <th className="px-4 py-2 text-center">SL đặt</th>
                                        <th className="px-4 py-2 text-center">Tồn kho bếp</th>
                                        <th className="px-4 py-2 text-right">Đơn giá</th>
                                        <th className="px-4 py-2 text-right">Thành tiền</th>
                                        <th className="px-4 py-2 text-center">Trạng thái kho</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {(order.orderDetails || []).map((item: OrderDetailResponse, idx: number) => {
                                        const availableStock = getStockForItem(item, stockById, stockByName);
                                        const stockKnown = availableStock !== null;
                                        const stockOk = !stockKnown || availableStock! >= item.quantity;
                                        return (
                                            <tr key={idx} className={!stockOk ? 'bg-red-500/5' : ''}>
                                                <td className="px-4 py-2 text-gray-200 font-medium">{item.productName}</td>
                                                <td className="px-4 py-2 text-center text-gray-300 font-semibold">{item.quantity}</td>
                                                <td className="px-4 py-2 text-center">
                                                    {stockKnown ? (
                                                        <span className={availableStock! < item.quantity ? 'text-red-400 font-bold' : 'text-green-400 font-semibold'}>
                                                            {availableStock}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500 text-xs italic">Không có dữ liệu</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-right text-gray-400">{item.unitPrice.toLocaleString('vi-VN')}đ</td>
                                                <td className="px-4 py-2 text-right text-gray-300">{item.subTotal.toLocaleString('vi-VN')}đ</td>
                                                <td className="px-4 py-2 text-center">
                                                    {!stockKnown ? (
                                                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 italic">Chưa rõ</span>
                                                    ) : stockOk ? (
                                                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                                                            <CheckCircle2 size={12} /> Đủ hàng ({availableStock})
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs text-red-400 font-semibold">
                                                            <AlertTriangle size={12} /> Thiếu {item.quantity - availableStock!}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

// ─── Sub-component: Kitchen Inventory Panel ───────────────────────────────────

interface InventoryPanelProps {
    kitchenId: number;
    onStockLoaded: (items: KitchenStockItemResponse[]) => void;
}

const InventoryPanel = ({ kitchenId, onStockLoaded }: InventoryPanelProps) => {
    const [open, setOpen] = useState(true); // open by default so stock is always fetched
    const [loading, setLoading] = useState(false);
    const [warehouses, setWarehouses] = useState<{ warehouseId: number; name: string }[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
    const [stock, setStock] = useState<KitchenStockItemResponse[]>([]);
    const [stockLoading, setStockLoading] = useState(false);

    // Load warehouses on mount (always, not just when open)
    useEffect(() => {
        setLoading(true);
        kitchenInventoryApi.getWarehousesByKitchenId(kitchenId)
            .then((res) => {
                setWarehouses(res);
                if (res.length > 0) setSelectedWarehouseId(res[0].warehouseId);
            })
            .finally(() => setLoading(false));
    }, [kitchenId]);

    // Load stock when warehouse changes
    useEffect(() => {
        if (!selectedWarehouseId) return;
        setStockLoading(true);
        kitchenInventoryApi.getWarehouseStock(selectedWarehouseId)
            .then((res) => {
                const items = res.data || [];
                setStock(items);
                onStockLoaded(items);
            })
            .catch(() => {
                setStock([]);
                onStockLoaded([]);
            })
            .finally(() => setStockLoading(false));
    }, [selectedWarehouseId]);

    const materials = stock.filter(s => s.itemType === 'MATERIAL');
    const products = stock.filter(s => s.itemType === 'PRODUCT');

    return (
        <div className="border border-zinc-700 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 bg-zinc-900/80 hover:bg-zinc-800/60 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Warehouse size={18} className="text-amber-500" />
                    <span className="font-semibold text-gray-200">Tồn kho Bếp trung tâm</span>
                    <Badge variant="secondary" className="font-normal text-xs">{stock.length} mặt hàng</Badge>
                </div>
                {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            {open && (
                <div className="p-4 space-y-4 bg-zinc-900/30">
                    {/* Warehouse selector */}
                    {loading ? (
                        <p className="text-gray-500 text-sm">Đang tải danh sách kho...</p>
                    ) : warehouses.length === 0 ? (
                        <p className="text-gray-500 text-sm">Không tìm thấy kho nào.</p>
                    ) : (
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-400 whitespace-nowrap">Chọn kho:</label>
                            <select
                                value={selectedWarehouseId ?? ''}
                                onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                                className="flex-1 max-w-xs px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-gray-200 text-sm focus:ring-amber-500 focus:border-amber-500"
                            >
                                {warehouses.map(w => (
                                    <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {stockLoading ? (
                        <div className="text-center py-6 text-gray-500">Đang tải tồn kho...</div>
                    ) : stock.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">Kho trống hoặc chưa có dữ liệu.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {materials.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Package size={12} /> Nguyên liệu ({materials.length})
                                    </h4>
                                    <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                                        {materials.map(item => (
                                            <div key={item.id} className="flex items-center justify-between text-sm bg-zinc-800/50 px-3 py-2 rounded-lg">
                                                <span className="text-gray-300 truncate mr-2">{item.itemName}</span>
                                                <span className="text-amber-400 whitespace-nowrap font-mono text-xs font-semibold">
                                                    {item.quantity} {item.unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {products.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Package size={12} /> Thành phẩm ({products.length})
                                    </h4>
                                    <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                                        {products.map(item => (
                                            <div key={item.id} className="flex items-center justify-between text-sm bg-zinc-800/50 px-3 py-2 rounded-lg">
                                                <span className="text-gray-300 truncate mr-2">{item.itemName}</span>
                                                <span className="text-amber-400 whitespace-nowrap font-mono text-xs font-semibold">
                                                    {item.quantity} {item.unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const CreateTaskPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [backendError, setBackendError] = useState<string | null>(null);
    const [plannedDate, setPlannedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());

    // Stock maps built from real kitchen warehouse data
    const [stockById, setStockById] = useState<ProductStockMap>(new Map());
    const [stockByName, setStockByName] = useState<ProductNameStockMap>(new Map());

    /** Called by InventoryPanel whenever stock is loaded/changed */
    const handleStockLoaded = (items: KitchenStockItemResponse[]) => {
        const byId = new Map<number, number>();
        const byName = new Map<string, number>();
        for (const item of items) {
            // itemType PRODUCT → match with order detail by productId
            if (item.itemType === 'PRODUCT') {
                const prev = byId.get(item.itemId) || 0;
                byId.set(item.itemId, prev + item.quantity);
            }
            // Also index by name (case-insensitive) as fallback
            const key = item.itemName?.toLowerCase().trim();
            if (key) {
                const prev = byName.get(key) || 0;
                byName.set(key, prev + item.quantity);
            }
        }
        setStockById(byId);
        setStockByName(byName);
    };

    useEffect(() => {
        const fetchPendingOrders = async () => {
            setIsLoading(true);
            try {
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
        if (newSet.has(orderId)) newSet.delete(orderId);
        else newSet.add(orderId);
        setSelectedOrderIds(newSet);
    };

    const toggleAll = () => {
        if (selectedOrderIds.size === orders.length) setSelectedOrderIds(new Set());
        else setSelectedOrderIds(new Set(orders.map(o => o.orderId)));
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
            toast.success('Tạo kế hoạch sản xuất thành công!');
            navigate('/kitchen');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Tạo kế hoạch thất bại. Vui lòng thử lại.';
            setBackendError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Count selected orders with stock warnings
    const warningCount = Array.from(selectedOrderIds)
        .map(id => orders.find(o => o.orderId === id))
        .filter((o): o is StoreOrderResponse => !!o && orderHasWarning(o, stockById, stockByName)).length;

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
                    <p className="text-sm text-gray-400 mt-1">Chọn các đơn hàng đang chờ để lên kế hoạch xuất cho Xưởng.</p>
                </div>
            </div>

            <Card className="p-6 md:p-8 border-0 shadow-sm ring-1 ring-zinc-700 bg-zinc-900/50">
                {backendError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-start gap-3">
                        <AlertCircle size={18} className="text-red-500 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-sm">Thất bại</h3>
                            <p className="text-sm">{backendError}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Info banner */}
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-4">
                        <div className="p-3 bg-amber-500/20 text-amber-600 rounded-lg">
                            <ShoppingCart size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-amber-400">Đơn hàng cần xử lý</h3>
                            <p className="text-sm text-amber-500/80 mt-1 mb-3">
                                Chọn một hoặc nhiều đơn hàng để gom vào 1 lệnh sản xuất. Nhấn <ChevronDown size={12} className="inline" /> để xem chi tiết và đối chiếu tồn kho.
                            </p>
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="inline-flex items-center px-2 py-1 bg-zinc-900/50 border border-amber-500/30 rounded text-xs font-semibold text-amber-500">
                                    Đã chọn: {selectedOrderIds.size} / {orders.length}
                                </div>
                                {warningCount > 0 && (
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-xs font-semibold text-red-400">
                                        <AlertTriangle size={12} />
                                        {warningCount} đơn thiếu hàng trong kho
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Planned date */}
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

                    {/* Kitchen inventory panel */}
                    {user?.kitchenId && (
                        <InventoryPanel kitchenId={user.kitchenId} onStockLoaded={handleStockLoaded} />
                    )}

                    {/* Orders table */}
                    <div className="border border-zinc-700 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-900/80 border-b border-zinc-800 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                                    <th className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                            checked={selectedOrderIds.size === orders.length && orders.length > 0}
                                            onChange={toggleAll}
                                        />
                                    </th>
                                    <th className="px-4 py-3">Mã đơn</th>
                                    <th className="px-4 py-3">Cửa hàng</th>
                                    <th className="px-4 py-3">Ngày đặt</th>
                                    <th className="px-4 py-3">Số lượng món</th>
                                    <th className="px-4 py-3">Tổng tiền</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3 text-right">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                                                Đang tải danh sách đơn hàng...
                                            </div>
                                        </td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            Không có đơn hàng nào đang chờ xử lý.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map(order => (
                                        <OrderRow
                                            key={order.orderId}
                                            order={order}
                                            isSelected={selectedOrderIds.has(order.orderId)}
                                            onToggle={() => toggleSelection(order.orderId)}
                                            stockById={stockById}
                                            stockByName={stockByName}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-6 mt-6 border-t border-zinc-800 flex items-center justify-between gap-3">
                    <div>
                        {warningCount > 0 && (
                            <p className="text-sm text-red-400 flex items-center gap-1.5">
                                <AlertTriangle size={14} />
                                {warningCount} đơn được chọn có thể thiếu hàng trong kho bếp.
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate('/kitchen')} disabled={isSubmitting}>
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            onClick={onSubmit}
                            className="bg-amber-600 hover:bg-amber-700 text-white min-w-[160px]"
                            disabled={isSubmitting || selectedOrderIds.size === 0}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
                </div>
            </Card>
        </div>
    );
};
