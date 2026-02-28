import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import type { ProductResponse as Product } from '../../types/product';
export interface RecipeMaterial {
    id: string;
    name: string;
    cost: number;
    unit: string;
}
import { recipeApi } from '../../services/recipe.api';
import { materialApi } from '../../services/material.api';
import type { RecipeDetailRequest, RecipeRequest } from '../../types/recipe';
import toast from 'react-hot-toast';

interface RecipeEditorProps {
    product: Product;
    onBack: () => void;
}

interface FormItem {
    materialId: number;
    materialName: string;
    quantityNeeded: number;
    unit: string;
    costPerUnit: number;
}

export const RecipeEditor = ({ product, onBack }: RecipeEditorProps) => {
    const [items, setItems] = useState<FormItem[]>([]);
    const [instructions, setInstructions] = useState('');
    const [yieldValue, setYieldValue] = useState(1);
    const [availableMaterials, setAvailableMaterials] = useState<RecipeMaterial[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const data = await materialApi.getAll();
                setAvailableMaterials(data.map(m => ({
                    id: String(m.id),
                    name: m.name,
                    cost: 0, // Set cost to 0 as it's not present in MaterialResponse
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
                    setInstructions(recipe.instructions || '');
                    setYieldValue(recipe.yield || 1);
                    setItems(recipe.recipeDetails.map(detail => ({
                        materialId: detail.materialId,
                        materialName: detail.materialName,
                        quantityNeeded: detail.quantityNeeded,
                        unit: detail.materialUnit,
                        costPerUnit: detail.costPerUnit || 0
                    })));
                }
            } catch (error: any) {
                // Ignore 404 or other errors as it might just mean no active recipe exists
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecipe();
    }, [product.id]);

    const handleAddItem = () => {
        // Add a default item placeholder
        if (availableMaterials.length === 0) return;
        const firstMat = availableMaterials[0];
        setItems([
            ...items,
            {
                materialId: Number(firstMat.id),
                materialName: firstMat.name,
                quantityNeeded: 1,
                unit: firstMat.unit,
                costPerUnit: firstMat.cost
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
                item.materialId = Number(mat.id);
                item.materialName = mat.name;
                item.unit = mat.unit;
                item.costPerUnit = mat.cost;
            }
        } else if (field === 'quantityNeeded') {
            item.quantityNeeded = Number(value);
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const handleSave = async () => {
        if (!instructions.trim()) {
            toast.error("Vui lòng nhập Hướng dẫn (Instructions).");
            return;
        }

        if (items.length === 0) {
            toast.error("Vui lòng thêm ít nhất 1 Nguyên liệu (Ingredient).");
            return;
        }

        if (yieldValue <= 0) {
            toast.error("Sản lượng (Yield) phải lớn hơn 0.");
            return;
        }

        setIsSaving(true);
        try {
            const recipeDetails: RecipeDetailRequest[] = items.map(item => ({
                materialId: item.materialId,
                quantityNeeded: item.quantityNeeded
            }));

            const requestData: RecipeRequest = {
                productId: product.id,
                yield: yieldValue,
                instructions,
                recipeDetails
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

    const totalCost = items.reduce((total, item) => total + (item.quantityNeeded * item.costPerUnit), 0);

    if (isLoading) {
        return <div className="text-center py-12 text-gray-400">Loading recipe...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200">Edit Recipe</h1>
                    <p className="text-gray-400">{product.name} (ID: {product.id})</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">Ingredients</h3>
                            <Button size="sm" onClick={handleAddItem}>
                                <Plus size={16} className="mr-2" /> Add Ingredient
                            </Button>
                        </div>

                        {items.length === 0 ? (
                            <p className="text-gray-400 text-center py-6">No ingredients added yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={index} className="flex items-end gap-3 p-3 bg-zinc-900/80 rounded-lg">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-400 mb-1 block">Material</label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-gray-300 bg-zinc-900/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                                value={item.materialId}
                                                onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                                            >
                                                {availableMaterials.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name} (${m.cost}/{m.unit})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <label className="text-xs text-gray-400 mb-1 block">Qty</label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.quantityNeeded}
                                                onChange={(e) => handleItemChange(index, 'quantityNeeded', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-16 pb-2 text-sm text-gray-400">
                                            {item.unit}
                                        </div>
                                        <div className="w-24 pb-2 text-sm text-right font-medium">
                                            ${(item.quantityNeeded * item.costPerUnit).toFixed(2)}
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

                        <div className="mt-6 flex justify-end items-center pt-4 border-t">
                            <span className="text-gray-400 mr-2">Total Estimated Cost:</span>
                            <span className="text-xl font-bold text-gray-200">${totalCost.toFixed(2)}</span>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Instructions</h3>
                        <textarea
                            className="w-full min-h-[150px] rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Enter preparation instructions..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                        />
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Recipe Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Yield</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={yieldValue}
                                    onChange={(e) => setYieldValue(Number(e.target.value))}
                                />
                                <p className="text-xs text-gray-400 mt-1">Number of units this recipe produces</p>
                            </div>

                            <div className="pt-4 border-t">
                                <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                                    <Save size={16} className="mr-2" />
                                    {isSaving ? 'Saving...' : 'Save Recipe'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
