import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Package, Leaf } from 'lucide-react';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { kitchenInventoryApi } from '../../services/kitchenInventory.api';
import type { KitchenStockItemResponse } from '../../types/kitchenInventory';
import toast from 'react-hot-toast';

export const KitchenInventory = () => {
    const navigate = useNavigate();
    const [inventory, setInventory] = useState<KitchenStockItemResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const WAREHOUSE_ID = 1; // Default Kitchen Warehouse ID

    const loadInventory = async () => {
        setIsLoading(true);
        try {
            const res = await kitchenInventoryApi.getWarehouseStock(WAREHOUSE_ID);
            setInventory(res.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Gặp lỗi khi tải dữ liệu kho.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const columns: Column<KitchenStockItemResponse>[] = [
        {
            header: 'Tên món',
            accessorKey: 'itemName',
            className: 'font-medium',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    {row.itemType === 'MATERIAL' ? (
                        <Leaf size={16} className="text-emerald-500" />
                    ) : (
                        <Package size={16} className="text-amber-500" />
                    )}
                    <span>{row.itemName}</span>
                </div>
            )
        },
        {
            header: 'Phân loại',
            cell: (row) => (
                <span className={`px-2 py-1 text-[10px] rounded uppercase font-semibold ${row.itemType === 'MATERIAL' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {row.itemType}
                </span>
            )
        },
        {
            header: 'Số lượng tồn',
            cell: (row) => {
                const isLowStock = row.quantity <= 5; // Example threshold
                return (
                    <div className="flex items-center space-x-2">
                        <span className={`font-medium ${isLowStock ? 'text-red-500 font-bold' : 'text-gray-200'}`}>
                            {row.quantity} {row.unit}
                        </span>
                        {isLowStock && (
                            <AlertTriangle size={14} className="text-red-500" />
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Ngày Hết hạn',
            cell: (row) => row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : <span className="text-gray-500 text-xs italic">N/A</span>
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Kho Tổng - Bếp Trung Tâm</h1>
                    <p className="text-sm text-gray-400 mt-1">Quản lý tồn kho nguyên liệu và thành phẩm phân phối của toàn hệ thống.</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => navigate('/kitchen/inventory/import')}
                        className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Nhập kho
                    </button>
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
