import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Filter, Package, Leaf } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { kitchenInventoryApi } from '../../services/kitchenInventory.api';
import { materialApi } from '../../services/material.api';
import { productApi } from '../../services/product.api';
import type { KitchenStockItemResponse } from '../../types/kitchenInventory';
import type { MaterialResponse } from '../../types/material';
import type { ProductResponse } from '../../types/product';
import toast from 'react-hot-toast';

export const KitchenInventory = () => {
    const [inventory, setInventory] = useState<KitchenStockItemResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importType, setImportType] = useState<'MATERIAL' | 'PRODUCT'>('MATERIAL');
    const [selectedItemId, setSelectedItemId] = useState<number>(0);
    const [importQuantity, setImportQuantity] = useState<number>(0);
    const [expiryDate, setExpiryDate] = useState<string>('');
    const [isImporting, setIsImporting] = useState(false);

    // Lookups
    const [materials, setMaterials] = useState<MaterialResponse[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);

    const WAREHOUSE_ID = 1; // Default Kitchen Warehouse ID

    const loadInventory = async () => {
        setIsLoading(true);
        try {
            const res = await kitchenInventoryApi.getWarehouseStock(WAREHOUSE_ID);
            setInventory(res.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Gặp lỗi khi tải dữ liệu kho.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadLookups = async () => {
        try {
            const [matRes, prodRes] = await Promise.all([
                materialApi.getAll(),
                productApi.getProducts({ size: 100 }) // Load a decent batch
            ]);
            setMaterials(matRes || []);
            setProducts(prodRes.data?.content || []);
        } catch (error) {
            console.error('Failed to load lookups', error);
        }
    };

    useEffect(() => {
        loadInventory();
        loadLookups();
    }, []);

    const handleImport = async () => {
        if (!selectedItemId || importQuantity <= 0) {
            toast.error('Vui lòng chọn món và nhập số lượng hợp lệ.');
            return;
        }

        setIsImporting(true);
        try {
            const requestPayload = [{
                itemId: Number(selectedItemId),
                quantity: Number(importQuantity),
                ...(expiryDate ? { expiryDate: expiryDate } : {}),
                ...(importType === 'MATERIAL'
                    ? { materialId: Number(selectedItemId) }
                    : { productId: Number(selectedItemId) }
                )
            }];

            console.log('Import payload:', JSON.stringify(requestPayload));

            if (importType === 'MATERIAL') {
                await kitchenInventoryApi.importMaterials(WAREHOUSE_ID, requestPayload);
                toast.success('Nhập nguyên liệu thành công');
            } else {
                await kitchenInventoryApi.importProducts(WAREHOUSE_ID, requestPayload);
                toast.success('Nhập thành phẩm thành công');
            }

            setIsImportModalOpen(false);
            setImportQuantity(0);
            setExpiryDate('');
            setSelectedItemId(0);
            loadInventory();
        } catch (error: any) {
            console.error('Import error:', error);
            const backendMsg = error.response?.data?.message
                || error.response?.data?.data
                || error.response?.data?.error
                || error.message
                || 'Lỗi không xác định';
            toast.error(`Nhập kho thất bại: ${typeof backendMsg === 'object' ? JSON.stringify(backendMsg) : backendMsg}`);
        } finally {
            setIsImporting(false);
        }
    };

    const columns: Column<KitchenStockItemResponse>[] = [
        {
            header: 'Tên món',
            accessorKey: 'itemName',
            className: 'font-medium',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    {row.itemType === 'MATERIAL' ? (
                        <Leaf size={16} className="text-emerald-500" />
                    ) : (
                        <Package size={16} className="text-amber-500" />
                    )}
                    <span>{row.itemName}</span>
                </div>
            )
        },
        {
            header: 'Phân loại',
            cell: (row) => (
                <span className={`px-2 py-1 text-[10px] rounded uppercase font-semibold ${row.itemType === 'MATERIAL' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {row.itemType}
                </span>
            )
        },
        {
            header: 'Số lượng tồn',
            cell: (row) => {
                const isLowStock = row.quantity <= 5; // Example threshold
                return (
                    <div className="flex items-center space-x-2">
                        <span className={`font-medium ${isLowStock ? 'text-red-500 font-bold' : 'text-gray-200'}`}>
                            {row.quantity} {row.unit}
                        </span>
                        {isLowStock && (
                            <AlertTriangle size={14} className="text-red-500" />
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Ngày Hết hạn',
            cell: (row) => row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : <span className="text-gray-500 text-xs italic">N/A</span>
        }
    ];

    const currentItemsLookup = importType === 'MATERIAL' ? materials : products;
    const isReadyToImport = selectedItemId > 0 && importQuantity > 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Kho Tổng - Bếp Trung Tâm</h1>
                    <p className="text-sm text-gray-400 mt-1">Quản lý tồn kho nguyên liệu và thành phẩm phân phối của toàn hệ thống.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" className="hidden md:flex">
                        <Filter size={16} className="mr-2" /> Bộ lọc
                    </Button>
                    <Button onClick={() => setIsImportModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
                        <TrendingUp size={16} className="mr-2" /> Nhập kho
                    </Button>
                </div>
            </div>

            <DataTable
                data={inventory}
                columns={columns}
                isLoading={isLoading}
                keyExtractor={(item) => item.id}
            />

            {/* Import Stock Modal */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Nhập Kho Bếp"
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsImportModalOpen(false)} disabled={isImporting}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={!isReadyToImport || isImporting}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {isImporting ? 'Đang xử lý...' : 'Xác nhận nhập'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 px-2 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Loại Nhập</label>
                        <select
                            value={importType}
                            onChange={(e) => {
                                setImportType(e.target.value as 'MATERIAL' | 'PRODUCT');
                                setSelectedItemId(0);
                            }}
                            className="w-full h-10 px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="MATERIAL">Nguyên liệu (Materials)</option>
                            <option value="PRODUCT">Thành phẩm (Products)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Chọn {importType === 'MATERIAL' ? 'Nguyên liệu' : 'Thành phẩm'}</label>
                        <select
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(Number(e.target.value))}
                            className="w-full h-10 px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        >
                            <option value={0} disabled>-- Vui lòng chọn --</option>
                            {currentItemsLookup.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} {importType === 'MATERIAL' && `(${(item as MaterialResponse).unit})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Số lượng ({importType === 'MATERIAL' ? 'theo Unit' : 'Cái/Phần'})</label>
                        <Input
                            type="number"
                            placeholder="Nhập số lượng..."
                            className="bg-zinc-900/50 border-zinc-700 focus:border-amber-500"
                            value={importQuantity || ''}
                            onChange={(e) => setImportQuantity(Number(e.target.value))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Ngày hết hạn (Tuỳ chọn)</label>
                        <Input
                            type="date"
                            className="bg-zinc-900/50 border-zinc-700 focus:border-amber-500"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]} // Must be in future
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};
