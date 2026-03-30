import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { ProductResponse } from '../../types/product';
import type { RecipeDetailRequest, RecipeRequest, RecipeResponse } from '../../types/recipe';
import { Package, Tag, ChefHat, Plus, Trash2, Save } from 'lucide-react';
import { recipeApi } from '../../services/recipe.api';
import { materialApi } from '../../services/material.api';
import toast from 'react-hot-toast';
import { cn } from '../../utils/classNames';

const productSchema = z.object({
    name: z.string().min(1, 'Tên là bắt buộc'),
    categoryId: z.number().min(1, 'Mã danh mục là bắt buộc'),
    price: z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
    unit: z.string().min(1, 'Đơn vị là bắt buộc'),
    description: z.string().optional()
});

type ProductFormData = z.infer<typeof productSchema>;

interface MaterialOption {
    id: number;
    name: string;
    unit: string;
}

interface RecipeFormItem {
    materialId: number;
    materialName: string;
    quantityNeeded: number;
    unit: string;
}

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ProductFormData) => void;
    initialData?: ProductResponse | null;
    isLoading?: boolean;
}

export const ProductModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: ProductModalProps) => {
    const [activeTab, setActiveTab] = useState<'info' | 'recipe'>('info');
    
    // Product form
    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: { name: '', categoryId: 1, price: 0, unit: 'KG', description: '' }
    });


    // Recipe state
    const [recipeItems, setRecipeItems] = useState<RecipeFormItem[]>([]);
    const [availableMaterials, setAvailableMaterials] = useState<MaterialOption[]>([]);
    const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
    const [isSavingRecipe, setIsSavingRecipe] = useState(false);
    const [recipeId, setRecipeId] = useState<number | null>(null);
    const [recipeActive, setRecipeActive] = useState(false);
    const [isTogglingRecipe, setIsTogglingRecipe] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [recipeYield, setRecipeYield] = useState(1);
    const [existingRecipe, setExistingRecipe] = useState<RecipeResponse | null>(null);

    // Load materials once
    useEffect(() => {
        if (!isOpen) return;
        const fetchMaterials = async () => {
            try {
                const data = await materialApi.getAll();
                setAvailableMaterials(data.map(m => ({ id: m.id, name: m.name, unit: m.unit })));
            } catch { /* silent */ }
        };
        fetchMaterials();
    }, [isOpen]);

    // Reset on open/close
    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                categoryId: initialData.category?.id || 1,
                price: initialData.price,
                unit: initialData.unit || 'KG',
                description: initialData.description || ''
            });
        } else {
            reset({ name: '', categoryId: 1, price: 0, unit: 'KG', description: '' });
        }
        setActiveTab('info');
        setRecipeItems([]);
        setRecipeId(null);
        setExistingRecipe(null);
        setInstructions('');
        setRecipeYield(1);
        setRecipeActive(false);
    }, [initialData, reset, isOpen]);

    // Load recipe when switching to recipe tab (edit mode)
    useEffect(() => {
        if (activeTab !== 'recipe' || !initialData) return;
        if (existingRecipe) return; // already loaded
        
        const loadRecipe = async () => {
            setIsLoadingRecipe(true);
            try {
                const res = await recipeApi.getActiveRecipe(initialData.id);
                if (res.data) {
                    const recipe = res.data;
                    setExistingRecipe(recipe);
                    setRecipeId(recipe.recipeId);
                    setRecipeActive(recipe.isActive);
                    setInstructions(recipe.instructions || '');
                    setRecipeYield(recipe.yield || 1);
                    setRecipeItems(recipe.recipeDetails.map(d => ({
                        materialId: d.materialId,
                        materialName: d.materialName,
                        quantityNeeded: d.quantityNeeded,
                        unit: d.materialUnit
                    })));
                }
            } catch {
                // No recipe — empty state
            } finally {
                setIsLoadingRecipe(false);
            }
        };
        loadRecipe();
    }, [activeTab, initialData, existingRecipe]);

    // Recipe handlers
    const handleAddRecipeItem = () => {
        if (availableMaterials.length === 0) return;
        const first = availableMaterials[0];
        setRecipeItems(prev => [...prev, { materialId: first.id, materialName: first.name, quantityNeeded: 1, unit: first.unit }]);
    };

    const handleRemoveRecipeItem = (index: number) => {
        setRecipeItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleRecipeItemChange = (index: number, field: string, value: any) => {
        setRecipeItems(prev => {
            const items = [...prev];
            const item = { ...items[index] };
            if (field === 'materialId') {
                const mat = availableMaterials.find(m => String(m.id) === String(value));
                if (mat) { item.materialId = mat.id; item.materialName = mat.name; item.unit = mat.unit; }
            } else if (field === 'quantityNeeded') {
                item.quantityNeeded = Number(value);
            }
            items[index] = item;
            return items;
        });
    };

    const handleSaveRecipe = async () => {
        if (!initialData) return;
        if (recipeItems.length === 0) { toast.error('Vui lòng thêm ít nhất 1 nguyên liệu.'); return; }
        if (recipeItems.some(item => item.quantityNeeded <= 0)) { toast.error('Số lượng nguyên liệu phải > 0.'); return; }

        setIsSavingRecipe(true);
        try {
            const details: RecipeDetailRequest[] = recipeItems.map(item => ({
                materialId: item.materialId,
                quantityNeeded: item.quantityNeeded
            }));
            const requestData: RecipeRequest = {
                productId: initialData.id,
                recipeDetails: details,
                instructions: instructions || `Công thức cho ${initialData.name}`,
                yield: recipeYield
            };
            const res = await recipeApi.createRecipe(requestData);
            setRecipeId(res.data.recipeId);
            setRecipeActive(res.data.isActive);
            setExistingRecipe(res.data);
            toast.success('Lưu công thức thành công!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lưu công thức thất bại.');
        } finally {
            setIsSavingRecipe(false);
        }
    };

    const handleToggleRecipe = async () => {
        if (!recipeId) return;
        setIsTogglingRecipe(true);
        try {
            const res = await recipeApi.toggleRecipeStatus(recipeId, !recipeActive);
            setRecipeActive(res.data.isActive);
            toast.success(`Công thức đã ${res.data.isActive ? 'kích hoạt' : 'vô hiệu hóa'}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi thay đổi trạng thái');
        } finally {
            setIsTogglingRecipe(false);
        }
    };


    const onSubmitForm = (data: ProductFormData) => {
        onSubmit(data);
    };

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="h-12 px-8 rounded-2xl bg-[var(--bg-root)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/[0.05] border border-[var(--border-primary)] font-black uppercase text-[10px] tracking-widest transition-all"
            >
                Đóng
            </Button>
            {activeTab === 'info' && (
                <Button
                    type="submit"
                    form="product-form"
                    disabled={isLoading}
                    className="h-12 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black uppercase text-[10px] tracking-widest transition-all duration-300 border-0 shadow-2xl shadow-amber-900/40"
                >
                    {isLoading ? 'Đang lưu...' : (initialData ? 'Cập nhật SP' : 'Thêm mới')}
                </Button>
            )}
            {activeTab === 'recipe' && initialData && (
                <Button
                    type="button"
                    onClick={handleSaveRecipe}
                    disabled={isSavingRecipe}
                    className="h-12 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-black font-black uppercase text-[10px] tracking-widest transition-all duration-300 border-0 shadow-2xl shadow-emerald-900/40"
                >
                    <Save size={16} className="mr-2" />
                    {isSavingRecipe ? 'Đang lưu...' : 'Lưu công thức'}
                </Button>
            )}
        </div>
    );

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            description={initialData ? 'Cập nhật thông tin, công thức và trạng thái sản phẩm.' : 'Khởi tạo bản ghi sản phẩm mới trong hệ thống.'}
            width="max-w-3xl"
            footer={footer}
        >
            {/* Tab Bar */}
            {initialData && (
                <div className="flex gap-1 p-1 bg-[var(--bg-root)]/60 rounded-2xl border border-[var(--border-primary)] mb-8">
                    <button
                        type="button"
                        onClick={() => setActiveTab('info')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'info'
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm"
                                : "text-[var(--text-secondary)] hover:text-amber-500"
                        )}
                    >
                        <Package size={16} /> Thông tin SP
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('recipe')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'recipe'
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm"
                                : "text-[var(--text-secondary)] hover:text-emerald-500"
                        )}
                    >
                        <ChefHat size={16} /> Công thức
                    </button>
                </div>
            )}

            {/* TAB 1: Product Info */}
            {activeTab === 'info' && (
                <form id="product-form" onSubmit={handleSubmit(onSubmitForm)} className="space-y-8 py-2 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-primary)]">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <Package size={18} className="text-amber-500" />
                        </div>
                        <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Thông tin cơ bản</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1">Tên sản phẩm</label>
                            <Input
                                placeholder="VD: Cà phê Signature"
                                icon={<Package size={18} className="text-[var(--text-secondary)]/40" />}
                                error={errors.name?.message}
                                {...register('name')}
                                className="h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1">Mô tả chi tiết</label>
                            <Input
                                placeholder="Mô tả ngắn gọn về sản phẩm..."
                                error={errors.description?.message}
                                {...register('description')}
                                className="h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1">Đơn vị tính</label>
                                <Input
                                    placeholder="KG, Cái, Chai..."
                                    error={errors.unit?.message}
                                    {...register('unit')}
                                    className="h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1">Mã danh mục</label>
                                <Input
                                    type="number"
                                    placeholder="1"
                                    icon={<Tag size={16} className="text-[var(--text-secondary)]/40" />}
                                    error={errors.categoryId?.message}
                                    {...register('categoryId', { valueAsNumber: true })}
                                    className="h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1">Giá bán niên yết (VNĐ)</label>
                            <Input
                                type="number"
                                step="1000"
                                placeholder="0"
                                icon={<span className="text-[var(--text-secondary)]/40 font-bold">₫</span>}
                                error={errors.price?.message}
                                {...register('price', { valueAsNumber: true })}
                                className="h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300 font-mono"
                            />
                        </div>
                    </div>
                </form>
            )}

            {/* TAB 2: Recipe Editor */}
            {activeTab === 'recipe' && initialData && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    {isLoadingRecipe ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-20 opacity-40">
                            <div className="w-10 h-10 border-2 border-[var(--border-primary)] border-t-emerald-500 rounded-full animate-spin"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Đang tải công thức...</span>
                        </div>
                    ) : (
                        <>
                            {/* Recipe status bar */}
                            {recipeId && (
                                <div className="flex items-center justify-between p-5 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)]">
                                    <div className="flex items-center gap-3">
                                        <ChefHat size={18} className={recipeActive ? 'text-emerald-500' : 'text-[var(--text-secondary)]'} />
                                        <div>
                                            <p className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest italic">Trạng thái công thức</p>
                                            <p className={cn("text-[10px] font-bold mt-0.5", recipeActive ? "text-emerald-500" : "text-rose-400")}>
                                                {recipeActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleToggleRecipe}
                                        disabled={isTogglingRecipe}
                                        className={cn(
                                            "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                            recipeActive
                                                ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                        )}
                                    >
                                        {isTogglingRecipe ? '...' : (recipeActive ? 'Vô hiệu hóa' : 'Kích hoạt')}
                                    </button>
                                </div>
                            )}

                            {/* Recipe settings — yield + instructions */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 italic">Sản lượng (Yield)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={recipeYield}
                                        onChange={(e) => setRecipeYield(Number(e.target.value))}
                                        className="w-full h-14 px-5 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300 font-mono text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1 italic">Hướng dẫn chế biến</label>
                                    <input
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        placeholder="Mô tả ngắn gọn..."
                                        className="w-full h-14 px-5 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Ingredient list */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
                                            <ChefHat size={18} className="text-emerald-500" />
                                        </div>
                                        <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Định mức Nguyên liệu</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddRecipeItem}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                                    >
                                        <Plus size={14} /> Thêm NL
                                    </button>
                                </div>

                                {recipeItems.length === 0 ? (
                                    <div className="py-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
                                        <ChefHat size={32} className="mx-auto mb-3 text-zinc-700" />
                                        <p className="text-[11px] font-bold text-zinc-600">Chưa có nguyên liệu. Bấm "Thêm NL" để bắt đầu.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 px-4 text-[9px] font-black text-[var(--text-secondary)]/50 uppercase tracking-widest italic">
                                            <div className="flex-1">Nguyên liệu</div>
                                            <div className="w-28">Số lượng</div>
                                            <div className="w-16 text-center">Đơn vị</div>
                                            <div className="w-10"></div>
                                        </div>
                                        {recipeItems.map((item, index) => (
                                            <div key={index} className="flex items-center gap-3 p-4 bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-2xl hover:border-emerald-500/30 transition-all group shadow-sm">
                                                <div className="flex-1">
                                                    <select
                                                        className="w-full h-11 px-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm font-black italic uppercase focus:border-emerald-500/50 transition-all appearance-none"
                                                        value={item.materialId}
                                                        onChange={(e) => handleRecipeItemChange(index, 'materialId', e.target.value)}
                                                    >
                                                        {availableMaterials.map(m => (
                                                            <option key={m.id} value={m.id} className="bg-[var(--bg-card)]">{m.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-28">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.quantityNeeded}
                                                        onChange={(e) => handleRecipeItemChange(index, 'quantityNeeded', e.target.value)}
                                                        className="w-full h-11 px-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm font-mono text-center focus:border-emerald-500/50 transition-all"
                                                    />
                                                </div>
                                                <div className="w-16 text-center text-[10px] font-black text-[var(--text-secondary)]/60 uppercase italic">
                                                    {item.unit}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveRecipeItem(index)}
                                                    className="w-10 h-10 rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)]/30 hover:text-rose-500 hover:bg-rose-500/5 border border-[var(--border-primary)] transition-all flex items-center justify-center shadow-sm"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </Drawer>
    );
};
