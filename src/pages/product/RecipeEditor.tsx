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
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200">Thiết lập Công thức</h1>
                    <p className="text-gray-400">{product.name} (ID: {product.id})</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main: Ingredient List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Định mức Nguyên liệu</h3>
                            <Button size="sm" onClick={handleAddItem}>
                                <Plus size={16} className="mr-2" /> Thêm nguyên liệu
                            </Button>
                        </div>

                        {items.length === 0 ? (
                            <p className="text-gray-400 text-center py-6">Chưa có nguyên liệu nào. Nhấn "Thêm nguyên liệu" để bắt đầu.</p>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-3 text-xs text-gray-500 font-medium uppercase">
                                    <div className="flex-1">Nguyên liệu</div>
                                    <div className="w-28">Số lượng</div>
                                    <div className="w-16">Đơn vị</div>
                                    <div className="w-10"></div>
                                </div>
                                {items.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-zinc-900/80 rounded-lg">
                                        <div className="flex-1">
                                            <select
                                                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900/50 text-gray-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                                value={item.materialId}
                                                onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                                            >
                                                {availableMaterials.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-28">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.quantityNeeded}
                                                onChange={(e) => handleItemChange(index, 'quantityNeeded', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-16 text-sm text-gray-400 text-center">
                                            {item.unit}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 h-10 px-2"
                                            onClick={() => handleRemoveItem(index)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Sidebar: Settings */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Thông tin Công thức</h3>
                        <div className="space-y-4">
                            {/* Status */}
                            {recipeId && (
                                <div className="pb-4 border-b border-zinc-800">
                                    <label className="text-sm font-medium mb-2 block">Trạng thái</label>
                                    <div className="flex items-center justify-between">
                                        <Badge variant={recipeStatus === 'ACTIVE' ? 'success' : 'warning'}>
                                            {recipeStatus === 'ACTIVE' ? 'Đang hoạt động' : recipeStatus === 'INACTIVE' ? 'Ngừng hoạt động' : recipeStatus || 'N/A'}
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
                                            className={recipeStatus === 'ACTIVE'
                                                ? 'text-red-400 hover:bg-red-500/10 border-red-500/30'
                                                : 'text-green-400 hover:bg-green-500/10 border-green-500/30'
                                            }
                                        >
                                            <Power size={14} className="mr-1.5" />
                                            {isToggling ? '...' : (recipeStatus === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Product Info */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Sản phẩm</span>
                                    <span className="text-gray-200 font-medium">{product.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Đơn vị</span>
                                    <span className="text-gray-200">{product.unit}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Số nguyên liệu</span>
                                    <span className="text-gray-200 font-medium">{items.length}</span>
                                </div>
                            </div>

                            {/* Yield */}
                            <div className="pt-4 border-t border-zinc-800 space-y-2">
                                <label className="text-sm font-medium text-gray-300 block">Sản lượng (Yield) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={recipeYield}
                                    onChange={(e) => setRecipeYield(Number(e.target.value))}
                                    placeholder="VD: 1"
                                    className="w-full px-3 py-2 border border-zinc-700 rounded-md text-sm bg-zinc-900/50 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                                <p className="text-xs text-gray-500">Số lượng sản phẩm tạo ra từ công thức này.</p>
                            </div>

                            {/* Instructions */}
                            <div className="pt-4 border-t border-zinc-800 space-y-2">
                                <label className="text-sm font-medium text-gray-300 block">Hướng dẫn chế biến *</label>
                                <textarea
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder="VD: Ướp thịt bò với gia vị 30 phút, sau đó nướng ở 200°C trong 15 phút..."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-zinc-700 rounded-md text-sm bg-zinc-900/50 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                                />
                                <p className="text-xs text-gray-500">Mô tả các bước chế biến sản phẩm.</p>
                            </div>

                            <div className="pt-4 border-t border-zinc-800">
                                <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                                    <Save size={16} className="mr-2" />
                                    {isSaving ? 'Đang lưu...' : 'Lưu Công thức'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
