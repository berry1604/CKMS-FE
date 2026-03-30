import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Power } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { ProductResponse as Product } from '../../types/product';
import { recipeApi } from '../../services/recipe.api';
import { materialApi } from '../../services/material.api';
import type { RecipeDetailRequest, RecipeRequest } from '../../types/recipe';
import toast from 'react-hot-toast';
import { cn } from '../../utils/classNames';

interface RecipeEditorProps {
    product: Product;
    onBack: () => void;
}

interface MaterialOption {
    id: number;
    name: string;
    unit: string;
}

interface FormItem {
    materialId: number;
    materialName: string;
    quantityNeeded: number;
    unit: string;
}

export const RecipeEditor = ({ product, onBack }: RecipeEditorProps) => {
    const [items, setItems] = useState<FormItem[]>([]);
    const [availableMaterials, setAvailableMaterials] = useState<MaterialOption[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [recipeId, setRecipeId] = useState<number | null>(null);
    const [recipeStatus, setRecipeStatus] = useState<string>('');
    const [isToggling, setIsToggling] = useState(false);
    const [instructions, setInstructions] = useState<string>('');
    const [recipeYield, setRecipeYield] = useState<number>(1);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const data = await materialApi.getAll();
                setAvailableMaterials(data.map(m => ({
                    id: m.id,
                    name: m.name,
                    unit: m.unit
                })));
            } catch (error) {
                console.error('Failed to load materials', error);
            }
        };
        fetchMaterials();
    }, []);

    useEffect(() => {
        const fetchRecipe = async () => {
            setIsLoading(true);
            try {
                const res = await recipeApi.getActiveRecipe(product.id);
                if (res.data) {
                    const recipe = res.data;
                    setRecipeId(recipe.recipeId);
                    setRecipeStatus(recipe.isActive ? 'ACTIVE' : 'INACTIVE');
                    setInstructions(recipe.instructions || '');
                    setRecipeYield(recipe.yield || 1);
                    setItems(recipe.recipeDetails.map(detail => ({
                        materialId: detail.materialId,
                        materialName: detail.materialName,
                        quantityNeeded: detail.quantityNeeded,
                        unit: detail.materialUnit
                    })));
                }
            } catch {
                // No active recipe exists — that's fine
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecipe();
    }, [product.id]);

    const handleAddItem = () => {
        if (availableMaterials.length === 0) return;
        const firstMat = availableMaterials[0];
        setItems([
            ...items,
            {
                materialId: firstMat.id,
                materialName: firstMat.name,
                quantityNeeded: 1,
                unit: firstMat.unit
            }
        ]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index] };

        if (field === 'materialId') {
            const mat = availableMaterials.find(m => String(m.id) === String(value));
            if (mat) {
                item.materialId = mat.id;
                item.materialName = mat.name;
                item.unit = mat.unit;
            }
        } else if (field === 'quantityNeeded') {
            item.quantityNeeded = Number(value);
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const handleSave = async () => {
        if (items.length === 0) {
            toast.error("Vui lòng thêm ít nhất 1 nguyên liệu.");
            return;
        }

        const hasInvalid = items.some(item => item.quantityNeeded <= 0);
        if (hasInvalid) {
            toast.error("Số lượng nguyên liệu phải lớn hơn 0.");
            return;
        }

        setIsSaving(true);
        try {
            const details: RecipeDetailRequest[] = items.map(item => ({
                materialId: item.materialId,
                quantityNeeded: item.quantityNeeded
            }));

            const requestData: RecipeRequest = {
                productId: product.id,
                recipeDetails: details,
                instructions: instructions || `Công thức cho ${product.name}`,
                yield: recipeYield
            };
            await recipeApi.createRecipe(requestData);
            toast.success("Tạo công thức thành công!");
            onBack();
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || 'Lưu công thức thất bại. Vui lòng kiểm tra lại.';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="text-center py-12 text-gray-400">Đang tải công thức...</div>;
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-10">
            {/* Header Area */}
            <div className="flex items-center gap-6 animate-in fade-in slide-in-from-left-4 duration-700">
                <Button 
                    variant="ghost" 
                    onClick={onBack}
                    className="h-12 w-12 rounded-2xl bg-[var(--bg-root)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10 transition-all duration-300 border border-[var(--border-primary)]"
                >
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-3 italic">
                        <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <Plus size={24} className="text-emerald-500" />
                        </div>
                        Thiết lập <span className="text-emerald-500">Công thức</span>
                    </h1>
                    <p className="text-xs text-[var(--text-secondary)]/60 mt-1 font-medium uppercase tracking-[0.2em] ml-1">
                        Sản phẩm: {product.name} (ID: {product.id})
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main: Ingredient List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-8 border-[var(--border-primary)] bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[40px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
                        
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <Plus size={16} className="text-emerald-500" />
                                </div>
                                Định mức Nguyên liệu
                            </h3>
                            <Button 
                                size="sm" 
                                onClick={handleAddItem}
                                className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-[10px] uppercase font-black tracking-widest px-4 py-2.5"
                            >
                                <Plus size={14} className="mr-2" /> Thêm nguyên liệu
                            </Button>
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-[var(--border-primary)] rounded-[30px] bg-[var(--bg-root)]/30 group-hover:bg-[var(--bg-root)]/50 transition-colors">
                                <div className="w-16 h-16 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/10">
                                    <Plus className="text-emerald-500/40" size={32} />
                                </div>
                                <p className="text-[var(--text-secondary)]/40 text-xs font-medium max-w-[200px] mx-auto italic uppercase tracking-wider">
                                    Chưa có nguyên liệu nào. Nhấn "Thêm nguyên liệu" để bắt đầu.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 px-4 text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest border-b border-[var(--border-primary)] pb-4">
                                    <div className="flex-[2]">Nguyên liệu</div>
                                    <div className="flex-1 min-w-[120px]">Số lượng</div>
                                    <div className="w-20 text-center">Đơn vị</div>
                                    <div className="w-12"></div>
                                </div>
                                {items.map((item, index) => (
                                    <div key={index} className="group/item flex items-center gap-4 p-4 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] rounded-2xl hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] transition-all duration-300">
                                        <div className="flex-[2]">
                                            <select
                                                className="w-full px-4 h-12 bg-transparent text-[var(--text-primary)] text-sm font-medium focus:outline-none transition-colors cursor-pointer appearance-none"
                                                value={item.materialId}
                                                onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                                            >
                                                {availableMaterials.map(m => (
                                                    <option key={m.id} value={m.id} className="bg-[var(--bg-card)]">{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1 min-w-[120px]">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.quantityNeeded}
                                                onChange={(e) => handleItemChange(index, 'quantityNeeded', e.target.value)}
                                                className="h-10 bg-[var(--bg-card)]/50 border-[var(--border-primary)] focus:border-emerald-500/50 focus:ring-emerald-500/10 text-[var(--text-primary)] font-mono"
                                            />
                                        </div>
                                        <div className="w-20 text-[10px] font-black text-emerald-500 bg-emerald-500/10 rounded-lg py-1.5 text-center uppercase tracking-widest border border-emerald-500/20">
                                            {item.unit}
                                        </div>
                                        <div className="w-12 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500/40 hover:text-red-500 hover:bg-red-500/10 h-10 w-10 p-0 rounded-xl transition-all"
                                                onClick={() => handleRemoveItem(index)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Sidebar: Settings */}
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000">
                    <Card className="p-8 border-[var(--border-primary)] bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[40px] shadow-2xl relative overflow-hidden">
                        <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <Plus size={16} className="text-amber-500" />
                            </div>
                            Thông tin Công thức
                        </h3>
                        <div className="space-y-8">
                            {/* Status */}
                            {recipeId && (
                                <div className="pb-8 border-b border-[var(--border-primary)]/40">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest mb-4 block">Trạng thái hiện tại</label>
                                    <div className="flex items-center justify-between bg-[var(--bg-root)]/50 p-4 rounded-2xl border border-[var(--border-primary)]">
                                        <Badge variant={recipeStatus === 'ACTIVE' ? 'success' : 'warning'} className="uppercase text-[9px] tracking-widest font-black px-3 py-1.5 border-0">
                                            {recipeStatus === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={isToggling}
                                            onClick={async () => {
                                                if (!recipeId) return;
                                                setIsToggling(true);
                                                try {
                                                    const newActive = recipeStatus !== 'ACTIVE';
                                                    const res = await recipeApi.toggleRecipeStatus(recipeId, newActive);
                                                    setRecipeStatus(res.data.isActive ? 'ACTIVE' : 'INACTIVE');
                                                    toast.success(`Công thức đã được ${newActive ? 'kích hoạt' : 'vô hiệu hóa'} thành công`);
                                                } catch (error: any) {
                                                    const msg = error.response?.data?.message || 'Không thể thay đổi trạng thái';
                                                    toast.error(msg);
                                                } finally {
                                                    setIsToggling(false);
                                                }
                                            }}
                                            className={cn(
                                                "h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all px-4",
                                                recipeStatus === 'ACTIVE' 
                                                    ? 'text-red-500 bg-red-500/5 hover:bg-red-500/10 border-red-500/20' 
                                                    : 'text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20'
                                            )}
                                        >
                                            <Power size={14} className="mr-2" />
                                            {isToggling ? '...' : (recipeStatus === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Product Info Summary */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center group/info">
                                    <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest">Nguyên liệu</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-[var(--text-primary)]">{items.length}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center group/info">
                                    <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest">Đơn vị gốc</span>
                                    <span className="text-[10px] font-black text-amber-500 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg uppercase tracking-[0.2em]">{product.unit}</span>
                                </div>
                            </div>

                            {/* Yield */}
                            <div className="pt-8 border-t border-[var(--border-primary)]/40 space-y-3">
                                <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest ml-1">Sản lượng (Yield) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={recipeYield}
                                    onChange={(e) => setRecipeYield(Number(e.target.value))}
                                    className="w-full h-14 px-5 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300 font-mono text-sm"
                                />
                                <p className="text-[9px] text-[var(--text-secondary)]/40 ml-1 italic leading-tight">Số lượng sản phẩm tạo ra từ định mức trên.</p>
                            </div>

                            {/* Instructions */}
                            <div className="pt-8 border-t border-[var(--border-primary)]/40 space-y-3">
                                <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest ml-1">Hướng dẫn chế biến *</label>
                                <textarea
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder="VD: Mô tả các bước chế biến..."
                                    rows={5}
                                    className="w-full px-5 py-4 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 text-[var(--text-primary)] rounded-3xl transition-all duration-300 text-sm placeholder:text-[var(--text-secondary)]/30 resize-none leading-relaxed"
                                />
                                <p className="text-[9px] text-[var(--text-secondary)]/40 ml-1 italic leading-tight">Quy trình thực hiện chi tiết cho nhân viên bếp.</p>
                            </div>

                            <div className="pt-10 border-t border-[var(--border-primary)]/40">
                                <Button 
                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-black font-black uppercase text-xs tracking-widest transition-all duration-500 border-0 shadow-2xl shadow-emerald-900/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100" 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                            Đang lưu...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <Save size={18} />
                                            Lưu Công thức
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>

    );
};
