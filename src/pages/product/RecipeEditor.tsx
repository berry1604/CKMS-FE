import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import type { ProductResponse as Product } from '../../types/product';
import { recipeService, type Recipe, type RecipeItem } from '../../services/mock/recipe.mock';
import { materialService, type Material } from '../../services/mock/material.mock';

interface RecipeEditorProps {
    product: Product;
    existingRecipe?: Recipe;
    onBack: () => void;
}

export const RecipeEditor = ({ product, existingRecipe, onBack }: RecipeEditorProps) => {
    const [items, setItems] = useState<RecipeItem[]>([]);
    const [instructions, setInstructions] = useState('');
    const [status, setStatus] = useState<Recipe['status']>('draft');
    const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        materialService.getMaterials().then(res => setAvailableMaterials(res.data));
    }, []);

    useEffect(() => {
        if (existingRecipe) {
            setItems(existingRecipe.items);
            setInstructions(existingRecipe.instructions);
            setStatus(existingRecipe.status);
        }
    }, [existingRecipe]);

    const handleAddItem = () => {
        // Add a default item placeholder
        if (availableMaterials.length === 0) return;
        const firstMat = availableMaterials[0];
        setItems([
            ...items,
            {
                materialId: firstMat.id,
                materialName: firstMat.name,
                quantity: 1,
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

    const handleItemChange = (index: number, field: keyof RecipeItem, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index] };

        if (field === 'materialId') {
            const mat = availableMaterials.find(m => m.id === value);
            if (mat) {
                item.materialId = mat.id;
                item.materialName = mat.name;
                item.unit = mat.unit;
                item.costPerUnit = mat.cost;
            }
        } else if (field === 'quantity') {
            item.quantity = Number(value);
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const totalCost = recipeService.calculateCost(items);
            const recipeData: Partial<Recipe> = {
                id: existingRecipe?.id,
                productId: String(product.id),
                productName: product.name,
                items,
                instructions,
                status,
                totalCost,
                yield: 1
            };
            await recipeService.saveRecipe(recipeData);
            onBack();
        } catch (error) {
            alert('Failed to save recipe');
        } finally {
            setIsSaving(false);
        }
    };

    const totalCost = recipeService.calculateCost(items);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Recipe</h1>
                    <p className="text-gray-500">{product.name} (ID: {product.id})</p>
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
                            <p className="text-gray-500 text-center py-6">No ingredients added yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={index} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 mb-1 block">Material</label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                                value={item.materialId}
                                                onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                                            >
                                                {availableMaterials.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name} (${m.cost}/{m.unit})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <label className="text-xs text-gray-500 mb-1 block">Qty</label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-16 pb-2 text-sm text-gray-500">
                                            {item.unit}
                                        </div>
                                        <div className="w-24 pb-2 text-sm text-right font-medium">
                                            ${(item.quantity * item.costPerUnit).toFixed(2)}
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
                            <span className="text-gray-500 mr-2">Total Estimated Cost:</span>
                            <span className="text-xl font-bold text-gray-900">${totalCost.toFixed(2)}</span>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold text-lg mb-4">Instructions</h3>
                        <textarea
                            className="w-full min-h-[150px] rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                <label className="text-sm font-medium mb-1 block">Status</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 p-2"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as any)}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="archived">Archived</option>
                                </select>
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
