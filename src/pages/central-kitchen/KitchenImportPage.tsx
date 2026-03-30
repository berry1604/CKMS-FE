import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Package, Hash, Calendar, Layers, ChevronRight, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { kitchenInventoryApi } from '../../services/kitchenInventory.api';
import { materialApi } from '../../services/material.api';
import { productApi } from '../../services/product.api';
import { KitchenSelector } from '../../components/common/KitchenSelector';
import { useAuth } from '../../hooks/useAuth';
import type { MaterialResponse } from '../../types/material';
import type { ProductResponse } from '../../types/product';
import toast from 'react-hot-toast';
import kitchenBg from '../../assets/kitchen_inventory.png';

export const KitchenImportPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, hasAuthority } = useAuth();

    // Authorization check: Only KITCHEN_STAFF can access this page
    useEffect(() => {
        if (user && !hasAuthority('KITCHEN_STAFF')) {
            toast.error('Chỉ nhân viên bếp mới có quyền thực hành nghiệp vụ này.');
            navigate('/kitchen/inventory');
        }
    }, [user, hasAuthority, navigate]);
    const [importType, setImportType] = useState<'MATERIAL' | 'PRODUCT'>('MATERIAL');
    const [selectedItemId, setSelectedItemId] = useState<number>(0);
    const [importQuantity, setImportQuantity] = useState<number>(0);
    const [expiryDate, setExpiryDate] = useState<string>('');
    const [isImporting, setIsImporting] = useState(false);
    const [isLoadingLookups, setIsLoadingLookups] = useState(false);

    // Lookups
    const [materials, setMaterials] = useState<MaterialResponse[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);

    // Dynamic Kitchen & Warehouse State
    const [selectedKitchenId, setSelectedKitchenId] = useState<number | null>(
        location.state?.kitchenId || user?.kitchenId || null
    );
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);

    // Load warehouse when kitchen changes
    useEffect(() => {
        if (!selectedKitchenId) return;
        // In this system, warehouseId for central kitchens is the same as kitchenId
        setSelectedWarehouseId(selectedKitchenId);
    }, [selectedKitchenId]);

    const loadLookups = useCallback(async () => {
        setIsLoadingLookups(true);
        try {
            const fetchMaterials = async () => {
                try {
                    const matRes = await materialApi.getAll();
                    setMaterials(matRes || []);
                } catch (error) {
                    console.error('Failed to load materials', error);
                    toast.error('Không thể tải danh sách nguyên liệu.');
                }
            };

            const fetchProducts = async () => {
                try {
                    const prodRes = await productApi.getProducts({ size: 100 });
                    setProducts(prodRes.data?.content || []);
                } catch (error) {
                    console.error('Failed to load products', error);
                    toast.error('Không thể tải danh sách thành phẩm.');
                }
            };

            await Promise.allSettled([fetchMaterials(), fetchProducts()]);
        } finally {
            setIsLoadingLookups(false);
        }
    }, []);

    useEffect(() => {
        loadLookups();
    }, [loadLookups]);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedItemId || importQuantity <= 0) {
            toast.error('Vui lòng chọn món và nhập số lượng hợp lệ.');
            return;
        }

        if (!selectedWarehouseId) {
            toast.error('Không tìm thấy kho hàng cho bếp đã chọn.');
            return;
        }

        setIsImporting(true);
        try {
            const requestPayload = [{
                itemId: Number(selectedItemId),
                quantity: Number(importQuantity),
                ...(expiryDate ? { expiryDate: expiryDate } : {})
            }];

            if (importType === 'MATERIAL') {
                await kitchenInventoryApi.importMaterials(selectedWarehouseId, requestPayload);
                toast.success('Nhập nguyên liệu thành công');
            } else {
                await kitchenInventoryApi.importProducts(selectedWarehouseId, requestPayload);
                toast.success('Nhập thành phẩm thành công');
            }

            navigate('/kitchen/inventory');
        } catch (error: unknown) {
            console.error('Import error:', error);
            const err = error as any;
            const backendMsg = err.response?.data?.message
                || err.response?.data?.data
                || err.response?.data?.error
                || err.message
                || 'Lỗi không xác định';
            toast.error(`Nhập kho thất bại: ${typeof backendMsg === 'object' ? JSON.stringify(backendMsg) : backendMsg}`);
        } finally {
            setIsImporting(false);
        }
    };

    const currentItemsLookup = importType === 'MATERIAL' ? materials : products;
    const isReadyToImport = selectedItemId > 0 && importQuantity > 0;

    return (
        <div className="min-h-screen bg-[var(--bg-root)] pb-20 animate-in fade-in duration-700">
            {/* Cinematic Header */}
            <div className="relative h-[450px] w-full overflow-hidden">
                <img
                    src={kitchenBg}
                    className="w-full h-full object-cover scale-105 motion-safe:animate-[pulse_12s_ease-in-out_infinite] opacity-40 dark:opacity-60"
                    alt="Kitchen Inventory Management"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-card)]/80 via-[var(--bg-card)]/20 to-[var(--bg-root)] backdrop-blur-[2px]" />

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-16 max-w-7xl mx-auto w-full">
                    <button
                        onClick={() => navigate('/kitchen/inventory')}
                        className="group flex items-center gap-3 text-amber-500 hover:text-amber-400 transition-all mb-8 w-fit bg-amber-500/10 px-6 py-3 rounded-2xl border border-amber-500/20 backdrop-blur-md shadow-sm"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase italic">Quay lại Kho Bếp</span>
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-[2px] w-16 bg-amber-500/50" />
                        <span className="text-amber-500 font-black tracking-[0.4em] text-[10px] uppercase italic">Giao thức Điều phối Logistics</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                        <div className="flex-1 space-y-4">
                            <h1 className="text-6xl md:text-7xl font-black text-[var(--text-primary)] tracking-tighter italic uppercase leading-none">
                                NHẬP KHO <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">HỆ THỐNG</span>
                            </h1>
                            <p className="text-[var(--text-secondary)]/60 max-w-2xl text-lg font-medium leading-relaxed italic uppercase tracking-wider">
                                Khởi tạo quy trình nhập liệu nguyên liệu và thành phẩm. Đảm bảo tính minh bạch và chuẩn xác cho chuỗi cung ứng thực phẩm.
                            </p>
                        </div>
                        
                        <div className="w-full md:w-auto pb-2">
                            <div className="bg-[var(--bg-card)]/80 backdrop-blur-3xl p-6 rounded-[2rem] border border-[var(--border-primary)] shadow-2xl">
                                <label className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4 block ml-2 italic">Cơ sở sản xuất định danh</label>
                                <KitchenSelector 
                                    selectedKitchenId={selectedKitchenId}
                                    onKitchenChange={setSelectedKitchenId}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-8 -mt-12 relative z-10">
                <div className="bg-[var(--bg-card)]/80 backdrop-blur-3xl border border-[var(--border-primary)] rounded-[3rem] p-12 md:p-16 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
                    {/* Decorative glow */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full group-hover:bg-amber-500/10 transition-all duration-1000" />

                    <form onSubmit={handleImport} className="space-y-10 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Loại Nhập */}
                            <div className="space-y-3 group/field">
                                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Loại hình nhập liệu</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/field:scale-110">
                                        <Layers size={18} className="text-[var(--text-secondary)]/40 group-focus-within/field:text-amber-500" />
                                    </div>
                                    <select
                                        value={importType}
                                        onChange={(e) => {
                                            setImportType(e.target.value as 'MATERIAL' | 'PRODUCT');
                                            setSelectedItemId(0);
                                        }}
                                        className="w-full pl-16 pr-6 py-5 bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-[1.5rem] text-[var(--text-primary)] font-bold appearance-none focus:outline-none focus:ring-4 focus:ring-amber-500/5 transition-all hover:border-amber-500/30 uppercase italic text-sm"
                                    >
                                        <option value="MATERIAL">Nguyên liệu (Materials)</option>
                                        <option value="PRODUCT">Thành phẩm (Products)</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                                        <ChevronRight size={16} className="text-[var(--text-secondary)]/40 rotate-90" />
                                    </div>
                                </div>
                            </div>

                            {/* Chọn Món */}
                            <div className="space-y-3 group/field">
                                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">
                                    {importType === 'MATERIAL' ? 'Nguyên liệu định danh' : 'Thành phẩm định danh'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/field:scale-110">
                                        <Package size={18} className="text-[var(--text-secondary)]/40 group-focus-within/field:text-amber-500" />
                                    </div>
                                    <select
                                        value={selectedItemId}
                                        onChange={(e) => setSelectedItemId(Number(e.target.value))}
                                        className="w-full pl-16 pr-6 py-5 bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-[1.5rem] text-[var(--text-primary)] font-bold appearance-none focus:outline-none focus:ring-4 focus:ring-amber-500/5 transition-all hover:border-amber-500/30 uppercase italic text-sm"
                                    >
                                        <option value={0} disabled>
                                            {isLoadingLookups ? '-- Đang truy xuất tập tin... --' : '-- Tuyển chọn vật phẩm --'}
                                        </option>
                                        {currentItemsLookup.map((item: MaterialResponse | ProductResponse) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} {importType === 'MATERIAL' && (item as MaterialResponse).unit && `(${(item as MaterialResponse).unit})`}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                                        <ChevronRight size={16} className="text-[var(--text-secondary)]/40 rotate-90" />
                                    </div>
                                </div>
                            </div>

                            {/* Số lượng */}
                            <div className="space-y-3 group/field">
                                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">
                                    Số lượng vận hành ({importType === 'MATERIAL' ? 'theo đơn vị' : 'cái/phần'})
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/field:scale-110">
                                        <Hash size={18} className="text-[var(--text-secondary)]/40 group-focus-within/field:text-amber-500" />
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={importQuantity || ''}
                                        onChange={(e) => setImportQuantity(Number(e.target.value))}
                                        className="w-full pl-16 pr-6 py-5 bg-[var(--bg-root)]/80 border border-[var(--border-primary)] rounded-[1.5rem] text-[var(--text-primary)] font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/5 transition-all placeholder:text-[var(--text-secondary)]/40 hover:border-amber-500/30 font-mono text-lg italic"
                                    />
                                </div>
                            </div>

                            {/* Ngày hết hạn */}
                            <div className="space-y-3 group/field">
                                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Ngày hết hạn hiệu dụng (Tuỳ chọn)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/field:scale-110">
                                        <Calendar size={18} className="text-[var(--text-secondary)]/40 group-focus-within/field:text-amber-500" />
                                    </div>
                                    <input
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full pl-16 pr-10 py-5 bg-[var(--bg-root)]/80 border border-[var(--border-primary)] rounded-[1.5rem] text-[var(--text-primary)] font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/5 transition-all hover:border-amber-500/30 cursor-pointer italic"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-[var(--border-primary)]/10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="hidden md:block">
                                <p className="text-[10px] text-[var(--text-secondary)]/40 uppercase tracking-[0.4em] font-black italic">Kitchen Inventory System v2.0-ELITE</p>
                            </div>

                            <div className="flex gap-4 w-full md:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/kitchen/inventory')}
                                    disabled={isImporting}
                                    className="flex-1 md:flex-none border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5 rounded-2xl px-10 h-16 uppercase text-[10px] font-black tracking-widest italic"
                                >
                                    Hủy bỏ tác vụ
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!isReadyToImport || isImporting}
                                    className="flex-1 md:flex-none bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black rounded-2xl px-14 h-16 shadow-[0_20px_40px_rgba(245,158,11,0.2)] transition-all hover:scale-[1.05] active:scale-95 uppercase text-[10px] tracking-widest italic"
                                >
                                    {isImporting ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            Đang lưu...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
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
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[2rem] p-8 flex items-start gap-5 shadow-sm hover:border-amber-500/20 transition-all group">
                        <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform">
                            <Zap size={22} />
                        </div>
                        <div>
                            <h4 className="text-[var(--text-primary)] font-black text-sm mb-2 uppercase italic tracking-widest">Tối ưu vận hành</h4>
                            <p className="text-[var(--text-secondary)]/60 text-xs font-medium leading-relaxed italic">Nhập kho kịp thời giúp tối ưu hóa việc phân phối tinh hoa đến các chi nhánh.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
