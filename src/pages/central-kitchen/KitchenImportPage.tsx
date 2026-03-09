import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, TrendingUp, Package, Hash, Calendar, Layers } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { kitchenInventoryApi } from '../../services/kitchenInventory.api';
import { materialApi } from '../../services/material.api';
import { productApi } from '../../services/product.api';
import type { MaterialResponse } from '../../types/material';
import type { ProductResponse } from '../../types/product';
import toast from 'react-hot-toast';

export const KitchenImportPage = () => {
    const navigate = useNavigate();
    const [importType, setImportType] = useState<'MATERIAL' | 'PRODUCT'>('MATERIAL');
    const [selectedItemId, setSelectedItemId] = useState<number>(0);
    const [importQuantity, setImportQuantity] = useState<number>(0);
    const [expiryDate, setExpiryDate] = useState<string>('');
    const [isImporting, setIsImporting] = useState(false);

    // Lookups
    const [materials, setMaterials] = useState<MaterialResponse[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);

    const WAREHOUSE_ID = 1; // Default Kitchen Warehouse ID

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
        loadLookups();
    }, []);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();

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

            if (importType === 'MATERIAL') {
                await kitchenInventoryApi.importMaterials(WAREHOUSE_ID, requestPayload);
                toast.success('Nhập nguyên liệu thành công');
            } else {
                await kitchenInventoryApi.importProducts(WAREHOUSE_ID, requestPayload);
                toast.success('Nhập thành phẩm thành công');
            }

            // Redirect back to inventory after successful import
            navigate('/kitchen/inventory');
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

    const currentItemsLookup = importType === 'MATERIAL' ? materials : products;
    const isReadyToImport = selectedItemId > 0 && importQuantity > 0;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/kitchen/inventory')}
                    className="hover:bg-zinc-800/80 rounded-full p-2 h-auto"
                >
                    <ArrowLeft size={20} className="text-gray-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-2">
                        <TrendingUp size={24} className="text-amber-600" />
                        Nhập Kho Bếp
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Thêm nguyên liệu hoặc thành phẩm mới vào kho Bếp Trung Tâm.
                    </p>
                </div>
            </div>

            <Card className="p-6 md:p-8 border-0 shadow-sm ring-1 ring-zinc-700 bg-zinc-900/50">
                <form onSubmit={handleImport} className="space-y-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Loại Nhập */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Loại Nhập *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Layers size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        value={importType}
                                        onChange={(e) => {
                                            setImportType(e.target.value as 'MATERIAL' | 'PRODUCT');
                                            setSelectedItemId(0);
                                        }}
                                        className="w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-zinc-900/50 text-gray-200 focus:ring-amber-500"
                                    >
                                        <option value="MATERIAL">Nguyên liệu (Materials)</option>
                                        <option value="PRODUCT">Thành phẩm (Products)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Chọn Món */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Chọn {importType === 'MATERIAL' ? 'Nguyên liệu' : 'Thành phẩm'} *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Package size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        value={selectedItemId}
                                        onChange={(e) => setSelectedItemId(Number(e.target.value))}
                                        className="w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-zinc-900/50 text-gray-200 focus:ring-amber-500"
                                    >
                                        <option value={0} disabled>-- Vui lòng chọn --</option>
                                        {currentItemsLookup.map(item => (
                                            <option key={item.id} value={item.id} className="bg-zinc-900 text-gray-200">
                                                {item.name} {importType === 'MATERIAL' && `(${(item as MaterialResponse).unit})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Số lượng */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Số lượng ({importType === 'MATERIAL' ? 'theo Unit' : 'Cái/Phần'}) *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="Nhập số lượng..."
                                        value={importQuantity || ''}
                                        onChange={(e) => setImportQuantity(Number(e.target.value))}
                                        className="w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-transparent text-gray-200 placeholder-zinc-500 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            {/* Ngày hết hạn */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Ngày hết hạn (Tuỳ chọn)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]} // Must be in future
                                        className="w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-transparent text-gray-200 focus:ring-amber-500"
                                        style={{ colorScheme: 'dark' }} // fixes date picker icon color on dark backgrounds
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/kitchen/inventory')}
                            disabled={isImporting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-amber-600 hover:bg-amber-700 text-white min-w-[140px]"
                            disabled={!isReadyToImport || isImporting}
                        >
                            {isImporting ? (
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
                                    Xác nhận nhập
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
