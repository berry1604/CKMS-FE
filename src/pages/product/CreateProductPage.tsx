import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Package, Tag, AlertCircle, DollarSign, Box, ChefHat, Plus, Trash2, ArrowRight, SkipForward } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { productApi } from '../../services/product.api';
import { categoryApi } from '../../services/category.api';
import { recipeApi } from '../../services/recipe.api';
import { materialApi } from '../../services/material.api';
import { useProducts } from '../../hooks/useProducts';
import type { CategoryResponse } from '../../types/category';
import type { RecipeDetailRequest, RecipeRequest } from '../../types/recipe';
import { cn } from '../../utils/classNames';

const createProductSchema = z.object({
    name: z.string().min(1, 'Tên là bắt buộc'),
    categoryId: z.number().min(1, 'Mã danh mục là bắt buộc'),
    price: z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
    unit: z.string().min(1, 'Đơn vị là bắt buộc'),
    description: z.string().optional()
});

type CreateProductFormData = z.infer<typeof createProductSchema>;

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

export const CreateProductPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);
    const { refetch } = useProducts(10);

    // Step management: 1 = Product Info, 2 = Recipe
    const [step, setStep] = useState(1);
    const [createdProductId, setCreatedProductId] = useState<number | null>(null);
    const [createdProductName, setCreatedProductName] = useState('');

    // Categories
    const [categories, setCategories] = useState<CategoryResponse[]>([]);

    // Recipe state
    const [recipeItems, setRecipeItems] = useState<RecipeFormItem[]>([]);
    const [availableMaterials, setAvailableMaterials] = useState<MaterialOption[]>([]);
    const [instructions, setInstructions] = useState('');
    const [recipeYield, setRecipeYield] = useState(1);
    const [isSavingRecipe, setIsSavingRecipe] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryApi.getAll();
                setCategories(data);
            } catch (error) {
                console.error('Không thể tải danh mục', error);
                toast.error('Không thể tải danh mục để lựa chọn');
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const data = await materialApi.getAll();
                setAvailableMaterials(data.map(m => ({ id: m.id, name: m.name, unit: m.unit })));
            } catch { /* silent */ }
        };
        fetchMaterials();
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<CreateProductFormData>({
        resolver: zodResolver(createProductSchema),
        mode: 'onChange',
        defaultValues: { name: '', categoryId: 0, price: 0, unit: 'KG', description: '' }
    });

    const onSubmitProduct = async (data: CreateProductFormData) => {
        if (!data.categoryId || data.categoryId === 0) {
            toast.error("Vui lòng chọn danh mục!");
            return;
        }

        setBackendError(null);
        setIsSubmitting(true);
        try {
            const res = await productApi.createProduct(data);
            const newProduct = res.data;
            setCreatedProductId(newProduct.id);
            setCreatedProductName(newProduct.name);
            toast.success('Tạo sản phẩm thành công! Tiếp tục tạo công thức.');
            setStep(2);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Không thể tạo sản phẩm. Vui lòng thử lại.';
            setBackendError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

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
        if (!createdProductId) return;
        if (recipeItems.length === 0) { toast.error('Vui lòng thêm ít nhất 1 nguyên liệu.'); return; }
        if (recipeItems.some(item => item.quantityNeeded <= 0)) { toast.error('Số lượng nguyên liệu phải > 0.'); return; }

        setIsSavingRecipe(true);
        try {
            const details: RecipeDetailRequest[] = recipeItems.map(item => ({
                materialId: item.materialId,
                quantityNeeded: item.quantityNeeded
            }));
            const requestData: RecipeRequest = {
                productId: createdProductId,
                recipeDetails: details,
                instructions: instructions || `Công thức cho ${createdProductName}`,
                yield: recipeYield
            };
            await recipeApi.createRecipe(requestData);
            toast.success('Tạo công thức thành công!');
            refetch();
            navigate('/products');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lưu công thức thất bại.');
        } finally {
            setIsSavingRecipe(false);
        }
    };

    const handleSkipRecipe = () => {
        refetch();
        navigate('/products');
    };

    return (
        <div className="space-y-10 max-w-4xl mx-auto pb-20 pt-4">
            {/* Header */}
            <div className="flex items-center gap-6 animate-in fade-in slide-in-from-left-4 duration-700">
                <Button
                    variant="ghost"
                    onClick={() => step === 1 ? navigate('/products') : setStep(1)}
                    className="h-12 w-12 rounded-2xl bg-[var(--bg-root)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10 transition-all duration-300 border border-[var(--border-primary)]"
                >
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl border", step === 1 ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20")}>
                            {step === 1 ? <Package size={24} className="text-amber-500" /> : <ChefHat size={24} className="text-emerald-500" />}
                        </div>
                        {step === 1 ? 'Thêm sản phẩm mới' : 'Tạo công thức'}
                    </h1>
                    <p className="text-xs text-[var(--text-secondary)]/60 mt-1 font-medium uppercase tracking-[0.2em] ml-1">
                        {step === 1 ? 'Bước 1/2 — Thông tin sản phẩm' : `Bước 2/2 — Công thức cho "${createdProductName}"`}
                    </p>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-3 px-2">
                <div className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    step === 1 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                )}>
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black",
                        step >= 1 ? "bg-amber-500 text-black" : "bg-[var(--border-primary)] text-[var(--text-secondary)]/50"
                    )}>1</div>
                    Sản phẩm
                </div>
                <div className="h-px flex-1 bg-[var(--border-primary)]"></div>
                <div className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    step === 2 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-[var(--bg-card)]/40 text-[var(--text-secondary)]/40 border-[var(--border-primary)]"
                )}>
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black",
                        step >= 2 ? "bg-emerald-500 text-black" : "bg-[var(--border-primary)] text-[var(--text-secondary)]/50"
                    )}>2</div>
                    Công thức
                </div>
            </div>

            {/* Step 1: Product Info */}
            {step === 1 && (
                <Card className="p-10 border-[var(--border-primary)] bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[40px] shadow-2xl relative overflow-hidden group animate-in fade-in zoom-in-95 duration-1000">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>

                    {backendError && (
                        <div className="mb-10 p-5 bg-red-500/5 border border-red-500/10 text-red-500 rounded-2xl flex items-start gap-4 animate-shake">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-black text-[10px] uppercase tracking-widest">Thao tác thất bại</h3>
                                <p className="text-xs mt-1 font-medium">{backendError}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmitProduct)} className="space-y-10">
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] ml-1">Tên sản phẩm *</label>
                                    <Input
                                        placeholder="VD: Cà phê Signature"
                                        icon={<Package size={18} className="text-[var(--text-secondary)]/40" />}
                                        error={errors.name?.message}
                                        {...register('name')}
                                        className="h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] ml-1">Danh mục sản phẩm *</label>
                                    <div className="relative group/field">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Tag size={18} className="text-[var(--text-secondary)]/40 group-focus-within/field:text-amber-500/50 transition-colors" />
                                        </div>
                                        <select
                                            className={`w-full pl-12 pr-4 h-14 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-2xl appearance-none transition-all duration-300 text-sm font-medium ${errors.categoryId ? 'border-red-500/50 ring-red-500/10' : ''}`}
                                            {...register('categoryId', { valueAsNumber: true })}
                                        >
                                            <option value={0} disabled className="bg-[var(--bg-card)]">-- Chọn danh mục --</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id} className="bg-[var(--bg-card)]">
                                                    {cat.categoryId ? `[${cat.categoryId}] ${cat.name}` : cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                            <Box size={14} className="text-[var(--text-secondary)]/40" />
                                        </div>
                                    </div>
                                    {errors.categoryId && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-tight">{errors.categoryId.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] ml-1">Giá bán niên yết (VNĐ) *</label>
                                    <Input
                                        type="number"
                                        step="1000"
                                        placeholder="0"
                                        icon={<DollarSign size={18} className="text-[var(--text-secondary)]/40" />}
                                        error={errors.price?.message}
                                        {...register('price', { valueAsNumber: true })}
                                        className="h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300 font-mono"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] ml-1">Đơn vị tính *</label>
                                    <div className="relative group/field">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Box size={18} className="text-[var(--text-secondary)]/40 group-focus-within/field:text-amber-500/50 transition-colors" />
                                        </div>
                                        <select
                                            className={`w-full pl-12 pr-4 h-14 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-2xl appearance-none transition-all duration-300 text-sm font-medium ${errors.unit ? 'border-red-500/50 ring-red-500/10' : ''}`}
                                            {...register('unit')}
                                        >
                                            <option value="KG" className="bg-[var(--bg-card)]">KG</option>
                                            <option value="GRAM" className="bg-[var(--bg-card)]">GRAM</option>
                                            <option value="LITER" className="bg-[var(--bg-card)]">LITER</option>
                                            <option value="ML" className="bg-[var(--bg-card)]">ML</option>
                                            <option value="PIECE" className="bg-[var(--bg-card)]">PIECE</option>
                                            <option value="BOTTLE" className="bg-[var(--bg-card)]">BOTTLE</option>
                                            <option value="BOX" className="bg-[var(--bg-card)]">BOX</option>
                                        </select>
                                    </div>
                                    {errors.unit && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-tight">{errors.unit.message}</p>}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] ml-1">Mô tả sản phẩm</label>
                                    <textarea
                                        className={`w-full px-5 py-4 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-3xl transition-all duration-300 text-sm placeholder:text-[var(--text-secondary)]/30 min-h-[120px] resize-none ${errors.description ? 'border-red-500/50 ring-red-500/10' : ''}`}
                                        placeholder="Nhập mô tả chi tiết về sản phẩm..."
                                        {...register('description')}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-[var(--border-primary)] flex flex-col sm:flex-row justify-end gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate('/products')}
                                disabled={isSubmitting}
                                className="h-14 px-10 rounded-2xl text-[var(--text-secondary)]/60 hover:text-[var(--text-primary)] font-black uppercase text-[10px] tracking-widest transition-all"
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !isValid}
                                className="h-14 px-10 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black uppercase text-xs tracking-widest transition-all duration-500 border-0 shadow-2xl shadow-amber-900/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        Đang tạo SP...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <ArrowRight size={18} />
                                        Tạo SP & Tiếp tục
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Step 2: Recipe */}
            {step === 2 && (
                <Card className="p-10 border-[var(--border-primary)] bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[40px] shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>

                    <div className="space-y-10">
                        {/* Recipe settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] ml-1">Sản lượng (Yield) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={recipeYield}
                                    onChange={(e) => setRecipeYield(Number(e.target.value))}
                                    className="w-full h-14 px-5 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300 font-mono text-sm"
                                />
                                <p className="text-[9px] text-[var(--text-secondary)]/40 ml-1 italic">Số lượng sản phẩm tạo ra từ công thức</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] ml-1">Hướng dẫn chế biến</label>
                                <textarea
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder="VD: Ướp thịt bò với gia vị 30 phút..."
                                    rows={3}
                                    className="w-full px-5 py-4 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300 text-sm placeholder:text-[var(--text-secondary)]/30 resize-none"
                                />
                            </div>
                        </div>

                        {/* Ingredient list */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <ChefHat size={18} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Định mức Nguyên liệu</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddRecipeItem}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                                >
                                    <Plus size={14} /> Thêm nguyên liệu
                                </button>
                            </div>

                            {recipeItems.length === 0 ? (
                                <div className="py-12 text-center rounded-2xl border border-dashed border-[var(--border-primary)]/40 bg-[var(--text-primary)]/[0.01]">
                                    <ChefHat size={32} className="mx-auto mb-3 text-[var(--text-secondary)]/40" />
                                    <p className="text-[11px] font-bold text-[var(--text-secondary)]/60">Chưa có nguyên liệu. Bấm "Thêm nguyên liệu" để bắt đầu.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 px-4 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                        <div className="flex-1">Nguyên liệu</div>
                                        <div className="w-28">Số lượng</div>
                                        <div className="w-16 text-center">Đơn vị</div>
                                        <div className="w-10"></div>
                                    </div>
                                    {recipeItems.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3 p-4 bg-[var(--bg-card)]/60 rounded-2xl border border-[var(--border-primary)] hover:border-emerald-500/20 transition-all">
                                            <div className="flex-1">
                                                <select
                                                    className="w-full h-11 px-4 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm font-medium focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all appearance-none"
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
                                                    className="w-full h-11 px-3 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm font-mono text-center focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                                                />
                                            </div>
                                            <div className="w-16 text-center text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                                                {item.unit}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRecipeItem(index)}
                                                className="w-10 h-10 rounded-xl bg-[var(--bg-root)]/50 text-[var(--text-secondary)]/40 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all flex items-center justify-center"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="pt-8 border-t border-[var(--border-primary)] flex flex-col sm:flex-row justify-end gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleSkipRecipe}
                                disabled={isSavingRecipe}
                                className="h-14 px-8 rounded-2xl text-[var(--text-secondary)]/60 hover:text-[var(--text-primary)] font-black uppercase text-[10px] tracking-widest transition-all"
                            >
                                <SkipForward size={16} className="mr-2" />
                                Bỏ qua
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSaveRecipe}
                                disabled={isSavingRecipe || recipeItems.length === 0}
                                className="h-14 px-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-black font-black uppercase text-xs tracking-widest transition-all duration-500 border-0 shadow-2xl shadow-emerald-900/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                            >
                                {isSavingRecipe ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        Đang lưu...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Save size={18} />
                                        Lưu công thức
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};
