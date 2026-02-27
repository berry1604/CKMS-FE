import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Save, Filter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { type InventoryItem } from '../franchise-store/StoreInventory';

export const KitchenInventory = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [adjustingItem, setAdjustingItem] = useState<string | null>(null);
    const [adjustValue, setAdjustValue] = useState<number>(0);

    const loadInventory = async () => {
        setIsLoading(true);
        try {
            // Placeholder for GET /inventory?location=kitchen
            setInventory([]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const handleAdjust = (item: InventoryItem) => {
        setAdjustingItem(item.id);
        setAdjustValue(item.quantity);
    };

    const handleSaveAdjustment = async (_id: string) => {
        try {
            // Placeholder: Call update stock API here
            setAdjustingItem(null);
            loadInventory();
        } catch (error) {
            alert('Failed to update stock');
        }
    };

    const columns: Column<InventoryItem>[] = [
        {
            header: 'Item Name',
            accessorKey: 'itemName',
        },
        {
            header: 'Type',
            cell: (row) => <span className="capitalize text-gray-500">{row.type}</span>
        },
        {
            header: 'Stock Level',
            cell: (row) => {
                if (adjustingItem === row.id) {
                    return (
                        <div className="flex items-center space-x-2">
                            <Input
                                type="number"
                                className="w-24 h-8"
                                value={adjustValue}
                                onChange={(e) => setAdjustValue(Number(e.target.value))}
                            />
                            <Button size="sm" onClick={() => handleSaveAdjustment(row.id)}>
                                <Save size={14} />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setAdjustingItem(null)}>
                                Cancel
                            </Button>
                        </div>
                    );
                }
                return (
                    <div className="flex items-center space-x-2">
                        <span className={`font-medium ${row.quantity <= row.minStockLevel ? 'text-red-600' : 'text-gray-900'}`}>
                            {row.quantity} {row.unit}
                        </span>
                        {row.quantity <= row.minStockLevel && (
                            <AlertTriangle size={14} className="text-red-500" />
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Min Level',
            accessorKey: 'minStockLevel',
        },
        {
            header: 'Last Updated',
            accessorKey: 'lastUpdated',
        },
        {
            header: 'Actions',
            cell: (row) => (
                adjustingItem !== row.id && (
                    <Button variant="ghost" size="sm" onClick={() => handleAdjust(row)}>
                        Adjust
                    </Button>
                )
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Kitchen Inventory</h1>
                <div className="flex space-x-2">
                    <Button variant="outline">
                        <Filter size={16} className="mr-2" /> Filter
                    </Button>
                    <Button variant="outline">
                        <TrendingUp size={16} className="mr-2" /> Stock In
                    </Button>
                </div>
            </div>

            <DataTable
                data={inventory}
                columns={columns}
                isLoading={isLoading}
                keyExtractor={(item) => item.id}
            />
        </div>
    );
};
