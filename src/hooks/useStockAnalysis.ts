import { useState, useEffect } from 'react';
import { recipeApi } from '../services/recipe.api';
import type { RecipeResponse } from '../types/recipe';
import type { StoreOrderResponse } from '../types/storeOrder';
import type { KitchenInventorySummaryResponse } from '../types/kitchenInventory';

export interface StockDetail {
    materialName: string;
    required: number;
    available: number;
    unit: string;
    isEnough: boolean;
}

export interface OrderStockAnalysis {
    isEnough: boolean;
    shortageMaterials: string[];
    details: StockDetail[];
}

export type AnalysisResultMap = Record<number, OrderStockAnalysis>;

// Helper to normalize units to base units (g, ml)
const normalizeValue = (value: number, unit: string): { value: number; baseUnit: string } => {
    const u = unit.toLowerCase();
    if (u === 'kg') return { value: value * 1000, baseUnit: 'g' };
    if (u === 'l') return { value: value * 1000, baseUnit: 'ml' };
    return { value, baseUnit: u };
};

export const useStockAnalysis = (orders: StoreOrderResponse[], inventory: KitchenInventorySummaryResponse[]) => {
    const [recipesCache, setRecipesCache] = useState<Record<number, RecipeResponse>>({});
    const [analysisResults, setAnalysisResults] = useState<AnalysisResultMap>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const analyzeOrders = async () => {
            if (orders.length === 0) return;
            setIsAnalyzing(true);

            const newCache = { ...recipesCache };
            const productIds = Array.from(new Set(orders.flatMap(o => o.orderDetails.map(d => d.productId))));
            
            // 1. Ensure all recipes are cached
            const missingIds = productIds.filter(id => !newCache[id]);
            if (missingIds.length > 0) {
                try {
                    const fetchedRecipes = await Promise.all(
                        missingIds.map(id => recipeApi.getActiveRecipe(id).then(res => res.data))
                    );
                    fetchedRecipes.forEach(recipe => {
                        if (recipe) newCache[recipe.productId] = recipe;
                    });
                    setRecipesCache(newCache);
                } catch (error) {
                    console.error('Failed to fetch recipes for analysis:', error);
                }
            }

            // 2. Perform analysis for each order
            const results: AnalysisResultMap = {};
            
            orders.forEach(order => {
                const materialNeeds: Record<string, { required: number; unit: string; materialName: string }> = {};

                order.orderDetails.forEach(item => {
                    const recipe = newCache[item.productId];
                    if (recipe) {
                        recipe.recipeDetails.forEach(detail => {
                            const { value: normalizedReq } = normalizeValue(detail.quantityNeeded * item.quantity, detail.materialUnit);
                            const key = detail.materialId;
                            
                            if (!materialNeeds[key]) {
                                materialNeeds[key] = { 
                                    required: 0, 
                                    unit: normalizeValue(1, detail.materialUnit).baseUnit,
                                    materialName: detail.materialName
                                };
                            }
                            materialNeeds[key].required += normalizedReq;
                        });
                    }
                });

                // Compare with inventory
                const details: StockDetail[] = Object.keys(materialNeeds).map(matIdStr => {
                    const matId = parseInt(matIdStr);
                    const need = materialNeeds[matId];
                    const invItem = inventory.find(i => i.itemId === matId && i.itemType === 'MATERIAL');
                    
                    const { value: normalizedAvailable } = normalizeValue(invItem?.totalQuantity || 0, invItem?.unit || need.unit);
                    
                    return {
                        materialName: need.materialName,
                        required: need.required,
                        available: normalizedAvailable,
                        unit: need.unit,
                        isEnough: normalizedAvailable >= need.required
                    };
                });

                const shortageMaterials = details.filter(d => !d.isEnough).map(d => d.materialName);

                results[order.orderId] = {
                    isEnough: shortageMaterials.length === 0,
                    shortageMaterials,
                    details
                };
            });

            setAnalysisResults(results);
            setIsAnalyzing(false);
        };

        analyzeOrders();
    }, [orders, inventory]); // Re-run when orders or inventory change

    return { analysisResults, isAnalyzing };
};
