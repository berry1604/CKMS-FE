import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Save, Search, Plus, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
export interface InventoryItem {
    id: string;
    itemName: string;
    type: 'material' | 'product' | 'packaging';
    quantity: number;
    unit: string;
    minStockLevel: number;
    locationId: string;
    lastUpdated: string;
}

interface StoreInventoryProps {
    storeId: string;
}

export const StoreInventory = ({ storeId }: StoreInventoryProps) => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [adjustingItem, setAdjustingItem] = useState<string | null>(null);
    const [adjustValue, setAdjustValue] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState('');

    const loadInventory = async () => {
        setIsLoading(true);
        try {
            // Placeholder for GET /inventory API
            setInventory([]);
            setFilteredInventory([]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, [storeId]);

    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = inventory.filter(item =>
            item.itemName.toLowerCase().includes(lowerQuery) ||
            item.type.toLowerCase().includes(lowerQuery)
        );
        setFilteredInventory(filtered);
    }, [searchQuery, inventory]);

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
            header: 'Item Details',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <Package size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{row.itemName}</p>
                        <p className="text-xs text-gray-500">ID: {row.id.slice(0, 8)}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Type',
            cell: (row) => (
                <Badge variant="secondary" className="capitalize">
                    {row.type}
                </Badge>
            )
        },
        {
            header: 'Stock Level',
            cell: (row) => {
                if (adjustingItem === row.id) {
                    return (
                        <div className="flex items-center space-x-2">
                            <Input
                                type="number"
                                className="w-24 h-9"
                                value={adjustValue}
                                onChange={(e) => setAdjustValue(Number(e.target.value))}
                            />
                            <div className="flex gap-1">
                                <Button size="sm" onClick={() => handleSaveAdjustment(row.id)} className="h-9 w-9 p-0">
                                    <Save size={16} />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setAdjustingItem(null)} className="h-9 w-9 p-0">
                                    <span className="sr-only">Cancel</span>✕
                                </Button>
                            </div>
                        </div>
                    );
                }
                const isLowStock = row.quantity <= row.minStockLevel;
                return (
                    <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {row.quantity} <span className="text-xs font-normal text-gray-500">{row.unit}</span>
                        </span>
                        {isLowStock && (
                            <Badge variant="danger" size="sm" className="flex items-center gap-1">
                                <AlertTriangle size={10} /> Low
                            </Badge>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Min Level',
            accessorKey: 'minStockLevel',
            cell: (row) => <span className="text-gray-500">{row.minStockLevel} {row.unit}</span>
        },
        {
            header: 'Actions',
            cell: (row) => (
                adjustingItem !== row.id && (
                    <Button variant="ghost" size="sm" onClick={() => handleAdjust(row)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        Adjust Stock
                    </Button>
                )
            )
        }
    ];

    return (
        <Card className="border-0 shadow-none ring-1 ring-gray-200 sm:mx-0 -mx-4 rounded-none sm:rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Current Inventory</h3>
                        <p className="text-sm text-gray-500">Manage stock levels and adjustments.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="bg-white">
                            <TrendingUp size={16} className="mr-2 text-green-600" /> Stock In
                        </Button>
                        <Button variant="outline" size="sm" className="bg-white">
                            <TrendingDown size={16} className="mr-2 text-orange-600" /> Stock Out
                        </Button>
                        <Button size="sm">
                            <Plus size={16} className="mr-2" /> Add Item
                        </Button>
                    </div>
                </div>

                <div className="mt-4 flex gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search inventory..."
                            className="pl-10 bg-gray-50 border-gray-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <DataTable
                data={filteredInventory}
                columns={columns}
                isLoading={isLoading}
                keyExtractor={(item) => item.id}
            />
        </Card>
    );
};
