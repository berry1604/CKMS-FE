import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Search, Package, ChevronRight, Calendar, Layers, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import type { StoreStockItemResponse, StoreStockBatchResponse } from '../../types/storeInventory';
import { storeInventoryApi } from '../../services/storeInventory.api';
import { toast } from 'react-hot-toast';

interface StoreInventoryProps {
    storeId?: number;
}

export const StoreInventory: React.FC<StoreInventoryProps> = ({ storeId }) => {
    const [inventory, setInventory] = useState<StoreStockItemResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 20;

    // Batch detail drawer
    const [selectedProduct, setSelectedProduct] = useState<StoreStockItemResponse | null>(null);
    const [batches, setBatches] = useState<StoreStockBatchResponse[]>([]);
    const [isBatchLoading, setIsBatchLoading] = useState(false);

    const loadInventory = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await storeInventoryApi.getStoreInventory({
                name: searchQuery || undefined,
                page: currentPage,
                size: pageSize,
                storeId: storeId
            });
            const pageData = response.data;
            setInventory(pageData.content);
            setTotalPages(pageData.totalPages);
            setTotalElements(pageData.totalElements);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải danh sách tồn kho');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, searchQuery]);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(0);
    }, [searchQuery]);

    const handleViewBatches = async (item: StoreStockItemResponse) => {
        setSelectedProduct(item);
        setIsBatchLoading(true);
        try {
            const response = await storeInventoryApi.getProductBatches(item.productId, storeId);
            setBatches(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải chi tiết lô hàng');
        } finally {
            setIsBatchLoading(false);
        }
    };

    const closeBatchDrawer = () => {
        setSelectedProduct(null);
        setBatches([]);
    };

    const isExpiringSoon = (dateStr: string) => {
        const expiryDate = new Date(dateStr);
        const now = new Date();
        const diffDays = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 7 && diffDays >= 0;
    };

    const isExpired = (dateStr: string) => {
        return new Date(dateStr) < new Date();
    };

    const columns: Column<StoreStockItemResponse>[] = [
        {
            header: 'Sản phẩm',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/10 p-2 rounded-lg text-amber-600">
                        <Package size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-gray-200">{row.productName}</p>
                        <p className="text-xs text-gray-400">ID: {row.productId}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Đơn vị',
            cell: (row) => <span className="text-gray-300">{row.unit}</span>
        },
        {
            header: 'Tổng tồn kho',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <span className={`font-semibold ${row.totalQuantity <= 0 ? 'text-red-500' : 'text-gray-200'}`}>
                        {row.totalQuantity}
                    </span>
                    {row.totalQuantity <= 0 && (
                        <Badge variant="danger" size="sm" className="flex items-center gap-1">
                            <AlertTriangle size={10} /> Hết hàng
                        </Badge>
                    )}
                </div>
            )
        },
        {
            header: 'Số lô',
            cell: (row) => (
                <div className="flex items-center gap-1.5">
                    <Layers size={14} className="text-gray-400" />
                    <span className="text-gray-300">{row.batchCount}</span>
                </div>
            )
        },
        {
            header: 'HSD gần nhất',
            cell: (row) => {
                if (!row.nearestExpiryDate) return <span className="text-gray-500">—</span>;
                const expired = isExpired(row.nearestExpiryDate);
                const expiringSoon = isExpiringSoon(row.nearestExpiryDate);
                return (
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className={`text-sm ${expired ? 'text-red-500 font-semibold' : expiringSoon ? 'text-amber-500 font-medium' : 'text-gray-300'}`}>
                            {new Date(row.nearestExpiryDate).toLocaleDateString('vi-VN')}
                        </span>
                        {expired && <Badge variant="danger" size="sm">Hết hạn</Badge>}
                        {!expired && expiringSoon && <Badge variant="warning" size="sm">Sắp hết hạn</Badge>}
                    </div>
                );
            }
        },
        {
            header: '',
            cell: (row) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewBatches(row)}
                    className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                >
                    Xem lô <ChevronRight size={14} className="ml-1" />
                </Button>
            )
        }
    ];

    const startItem = currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

    return (
        <>
            <Card className="border-0 shadow-none ring-1 ring-zinc-700 sm:mx-0 -mx-4 rounded-none sm:rounded-lg overflow-hidden">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-200">Tồn kho cửa hàng</h3>
                            <p className="text-sm text-gray-400">
                                Danh sách sản phẩm tồn kho — <span className="text-gray-200 font-medium">{totalElements}</span> sản phẩm
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm sản phẩm..."
                                className="pl-10 bg-zinc-900/80 border-zinc-700"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <DataTable
                    data={inventory}
                    columns={columns}
                    isLoading={isLoading}
                    keyExtractor={(item) => String(item.productId)}
                />

                {/* Pagination */}
                {totalElements > 0 && (
                    <div className="bg-zinc-900/80 px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                            Hiển thị <span className="font-medium text-gray-200">{startItem}</span> đến <span className="font-medium text-gray-200">{endItem}</span> trong số <span className="font-medium text-gray-200">{totalElements}</span> sản phẩm
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                            >
                                Trước
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage((p) => p + 1)}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Batch Detail Drawer */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeBatchDrawer} />

                    {/* Drawer panel */}
                    <div className="relative w-full max-w-lg bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-200">Chi tiết lô hàng</h3>
                                    <p className="text-sm text-gray-400 mt-1">{selectedProduct.productName}</p>
                                </div>
                                <button
                                    onClick={closeBatchDrawer}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Summary */}
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                                    <div className="text-xs text-gray-400">Tổng tồn</div>
                                    <div className="text-xl font-bold text-gray-200">{selectedProduct.totalQuantity}</div>
                                </div>
                                <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                                    <div className="text-xs text-gray-400">Số lô</div>
                                    <div className="text-xl font-bold text-amber-500">{selectedProduct.batchCount}</div>
                                </div>
                                <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                                    <div className="text-xs text-gray-400">Đơn vị</div>
                                    <div className="text-xl font-bold text-gray-200">{selectedProduct.unit}</div>
                                </div>
                            </div>
                        </div>

                        {/* Batch List */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {isBatchLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-3"></div>
                                    <p className="text-gray-400 text-sm">Đang tải lô hàng...</p>
                                </div>
                            ) : batches.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    Không có lô hàng nào.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {batches.map((batch) => {
                                        const expired = isExpired(batch.expiryDate);
                                        const expiringSoon = isExpiringSoon(batch.expiryDate);
                                        return (
                                            <div
                                                key={batch.batchId}
                                                className={`rounded-xl border p-4 transition-colors ${expired
                                                    ? 'border-red-500/30 bg-red-500/5'
                                                    : expiringSoon
                                                        ? 'border-amber-500/30 bg-amber-500/5'
                                                        : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sm font-semibold text-gray-200">
                                                            {batch.batchCode}
                                                        </span>
                                                        {expired && <Badge variant="danger" size="sm">Hết hạn</Badge>}
                                                        {!expired && expiringSoon && <Badge variant="warning" size="sm">Sắp hết hạn</Badge>}
                                                    </div>
                                                    <Badge variant="secondary" size="sm">{batch.status}</Badge>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3 text-sm">
                                                    <div>
                                                        <div className="text-gray-500 text-xs">Số lượng</div>
                                                        <div className="font-semibold text-gray-200">{batch.quantity}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-500 text-xs">Ngày SX</div>
                                                        <div className="text-gray-300">
                                                            {new Date(batch.manufacturingDate).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-500 text-xs">Hạn SD</div>
                                                        <div className={`${expired ? 'text-red-500' : expiringSoon ? 'text-amber-500' : 'text-gray-300'}`}>
                                                            {new Date(batch.expiryDate).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
