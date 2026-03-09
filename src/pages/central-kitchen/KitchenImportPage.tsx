import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Package, Hash, Calendar, Layers, ChevronRight, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
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
                productApi.getProducts({ size: 100 })
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
        <div className="min-h-screen bg-[#0a0a0a] pb-20">
            {/* Cinematic Header */}
            <div className="relative h-[300px] w-full overflow-hidden">
                <img
                    src="/Users/phunghuyphuoc/.gemini/antigravity/brain/5ad3745d-382e-481d-8167-b732c447a69b/warehouse_logistics_bg_1773028054234.png"
                    className="w-full h-full object-cover scale-105"
                    alt="Warehouse Background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0a0a0a] backdrop-blur-[2px]" />

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4 mb-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/kitchen/inventory')}
                            className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full p-2 h-10 w-10 transition-all"
                        >
                            <ArrowLeft size={20} className="text-white" />
                        </Button>
                        <div className="h-px w-12 bg-amber-500/50" />
                        <span className="text-amber-500 font-medium tracking-widest text-xs uppercase">Kitchen Logistics</span>
                    </div>

                    <h1 className="text-5xl font-bold text-white tracking-tighter mb-2">
                        NHẬP KHO <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">BẾP TRUNG TÂM</span>
                    </h1>
                    <p className="text-gray-400 max-w-xl text-lg font-light leading-relaxed">
                        Điều phối và nhập mới nguyên liệu, thành phẩm vào hệ thống lưu trữ trung tâm để đảm bảo chuỗi cung ứng.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-8 -mt-8 relative z-10">
                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
                    {/* Decorative glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full" />

                    <form onSubmit={handleImport} className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Loại Nhập */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider ml-1">Loại Nhập</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                                        <Layers size={18} className="text-gray-500 group-focus-within:text-amber-400" />
                                    </div>
                                    <select
                                        value={importType}
                                        onChange={(e) => {
                                            setImportType(e.target.value as 'MATERIAL' | 'PRODUCT');
                                            setSelectedItemId(0);
                                        }}
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all hover:bg-white/[0.07]"
                                    >
                                        <option value="MATERIAL" className="bg-[#1a1a1a]">Nguyên liệu (Materials)</option>
                                        <option value="PRODUCT" className="bg-[#1a1a1a]">Thành phẩm (Products)</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                        <ChevronRight size={16} className="text-gray-500 rotate-90" />
                                    </div>
                                </div>
                            </div>

                            {/* Chọn Món */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider ml-1">
                                    {importType === 'MATERIAL' ? 'Chọn Nguyên liệu' : 'Chọn Thành phẩm'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                                        <Package size={18} className="text-gray-500 group-focus-within:text-amber-400" />
                                    </div>
                                    <select
                                        value={selectedItemId}
                                        onChange={(e) => setSelectedItemId(Number(e.target.value))}
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all hover:bg-white/[0.07]"
                                    >
                                        <option value={0} disabled className="bg-[#1a1a1a]">-- Vui lòng chọn --</option>
                                        {currentItemsLookup.map(item => (
                                            <option key={item.id} value={item.id} className="bg-[#1a1a1a] text-gray-200">
                                                {item.name} {importType === 'MATERIAL' && `(${(item as MaterialResponse).unit})`}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                        <ChevronRight size={16} className="text-gray-500 rotate-90" />
                                    </div>
                                </div>
                            </div>

                            {/* Số lượng */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider ml-1">
                                    Số lượng ({importType === 'MATERIAL' ? 'theo Đơn vị' : 'Cái/Phần'})
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                                        <Hash size={18} className="text-gray-500 group-focus-within:text-amber-400" />
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={importQuantity || ''}
                                        onChange={(e) => setImportQuantity(Number(e.target.value))}
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all placeholder:text-gray-600 hover:bg-white/[0.07]"
                                    />
                                </div>
                            </div>

                            {/* Ngày hết hạn */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider ml-1">Ngày hết hạn (Tuỳ chọn)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                                        <Calendar size={18} className="text-gray-500 group-focus-within:text-amber-400" />
                                    </div>
                                    <input
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all hover:bg-white/[0.07]"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                            <div className="hidden md:block">
                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Kitchen Inventory System v2.0</p>
                            </div>

                            <div className="flex gap-4 w-full md:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/kitchen/inventory')}
                                    disabled={isImporting}
                                    className="flex-1 md:flex-none border-white/10 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl px-8"
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!isReadyToImport || isImporting}
                                    className="flex-1 md:flex-none bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold rounded-xl px-12 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isImporting ? (
                                        <div className="flex items-center gap-2 uppercase tracking-widest text-xs">
                                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            Đang lưu...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 uppercase tracking-widest text-xs">
                                            <Save size={18} />
                                            Xác nhận nhập kho
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Logistics Tip */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex items-start gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h4 className="text-white font-medium text-sm mb-1 text-amber-400/80">Tối ưu vận hành</h4>
                            <p className="text-gray-500 text-xs leading-relaxed">Nhập kho kịp thời giúp tối ưu hóa việc phân phối đến các chi nhánh.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
