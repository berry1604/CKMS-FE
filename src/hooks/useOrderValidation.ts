import { useState, useEffect } from 'react';
import { kitchenApi } from '../services/kitchen.api';
import { dispatchApi } from '../services/dispatch.api';
import type { StoreOrderResponse } from '../types/storeOrder';
import type { KitchenResponse } from '../types/kitchen';

export interface CapacityDetail {
    date: string;
    maxCapacity: number;
    remainingCapacity: number;
    isEnough: boolean;
}

export interface OrderValidationResult {
    isFeasible: boolean;
    totalOrderQuantity: number;
    capacityDetail?: CapacityDetail;
}

export type ValidationResultMap = Record<number, OrderValidationResult>;

/**
 * Hook to validate orders against kitchen capacity instead of material inventory.
 * Aggregates capacity across all kitchens for HQ view.
 */
export const useOrderValidation = (orders: StoreOrderResponse[]) => {
    const [kitchens, setKitchens] = useState<KitchenResponse[]>([]);
    const [capacityMap, setCapacityMap] = useState<Record<string, number>>({}); // date -> total remaining capacity
    const [validationResults, setValidationResults] = useState<ValidationResultMap>({});
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        const validateOrders = async () => {
            if (orders.length === 0) {
                setValidationResults({});
                return;
            }
            setIsValidating(true);

            try {
                // 1. Get all kitchens if not yet fetched
                let currentKitchens = kitchens;
                if (kitchens.length === 0) {
                    const res = await kitchenApi.getAllKitchens();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    currentKitchens = (res.data as any) || [];
                    setKitchens(currentKitchens);
                }

                const totalMaxCapacity = currentKitchens.reduce((sum, k) => sum + (Number(k.maxDailyCapacity) || 0), 0);

                // 2. Get unique delivery dates
                const uniqueDates = Array.from(new Set(orders.map(o => o.deliveryDate).filter(Boolean))) as string[];
                
                // 3. Fetch remaining capacity for each date
                const newCapacityMap: Record<string, number> = { ...capacityMap };
                
                for (const date of uniqueDates) {
                    // Skip if we already have it in local state to avoid redundant calls
                    if (newCapacityMap[date] !== undefined) continue;
                    
                    let totalRemainingForDate = 0;
                    
                    // Call suggest API for each kitchen and sum up remaining capacity
                    // Note: In a real world scenario, this could be a single bulk endpoint.
                    await Promise.all(currentKitchens.map(async (kitchen) => {
                        try {
                            const suggestRes = await dispatchApi.getSuggestion(kitchen.kitchenId, date);
                            const suggestions = suggestRes.data || [];
                            
                            if (Array.isArray(suggestions) && suggestions.length > 0) {
                                // Use the kitchenCapacity from the first item as the available capacity for this kitchen on this date
                                const capacity = (suggestions[0] as { kitchenCapacity: number }).kitchenCapacity;
                                totalRemainingForDate += (Number(capacity) || 0);
                            } else {
                                // If no data, assume full capacity as fallback
                                totalRemainingForDate += (Number(kitchen.maxDailyCapacity) || 0);
                            }
                        } catch (e) {
                            console.error(`Failed to get capacity for kitchen ${kitchen.kitchenId} on ${date}`, e);
                            totalRemainingForDate += (Number(kitchen.maxDailyCapacity) || 0);
                        }
                    }));
                    
                    newCapacityMap[date] = totalRemainingForDate;
                }

                // 4. Build validation results
                const results: ValidationResultMap = {};
                orders.forEach(order => {
                    const date = order.deliveryDate;
                    const totalQty = order.orderDetails.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
                    const remaining = date ? (newCapacityMap[date] ?? totalMaxCapacity) : totalMaxCapacity;
                    
                    results[order.orderId] = {
                        isFeasible: totalQty <= remaining,
                        totalOrderQuantity: totalQty,
                        capacityDetail: date ? {
                            date,
                            maxCapacity: totalMaxCapacity,
                            remainingCapacity: remaining,
                            isEnough: totalQty <= remaining
                        } : undefined
                    };
                });

                setCapacityMap(newCapacityMap);
                setValidationResults(results);

            } catch (error) {
                console.error('Validation failed:', error);
            } finally {
                setIsValidating(false);
            }
        };

        validateOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders, kitchens]);

    const totalMaxCapacity = kitchens.reduce((sum, k) => sum + (Number(k.maxDailyCapacity) || 0), 0);

    return { validationResults, isValidating, totalMaxCapacity, kitchens };
};
