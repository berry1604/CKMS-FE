import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChefHat, Scale, DollarSign, Package, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';

interface BeefsteakMaterial {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
    category: string;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

const beefsteakMaterials: BeefsteakMaterial[] = [
    { id: '1', name: 'Thịt bò Tenderloin (Thăn nội)', quantity: 250, unit: 'gram', costPerUnit: 1200, category: 'Thịt tươi', status: 'In Stock' },
    { id: '2', name: 'Tiêu đen xay', quantity: 5, unit: 'gram', costPerUnit: 50, category: 'Gia vị', status: 'In Stock' },
    { id: '3', name: 'Muối biển hồng', quantity: 5, unit: 'gram', costPerUnit: 40, category: 'Gia vị', status: 'In Stock' },
    { id: '4', name: 'Bơ nhạt (Thực vật/Động vật)', quantity: 30, unit: 'gram', costPerUnit: 250, category: 'Bơ sữa', status: 'In Stock' },
    { id: '5', name: 'Tỏi nguyên tép', quantity: 15, unit: 'gram', costPerUnit: 20, category: 'Rau củ', status: 'In Stock' },
    { id: '6', name: 'Cỏ hương thảo (Rosemary)', quantity: 10, unit: 'gram', costPerUnit: 100, category: 'Gia vị thảo mộc', status: 'Low Stock' },
    { id: '7', name: 'Dầu ô liu', quantity: 20, unit: 'ml', costPerUnit: 150, category: 'Dầu ăn', status: 'In Stock' },
    { id: '8', name: 'Khoai tây (ăn kèm)', quantity: 150, unit: 'gram', costPerUnit: 40, category: 'Rau củ', status: 'In Stock' },
    { id: '9', name: 'Măng tây đỏ', quantity: 50, unit: 'gram', costPerUnit: 300, category: 'Rau củ', status: 'Out of Stock' },
];

export const BeefsteakMaterialsPage = () => {
    const navigate = useNavigate();

    const totalCost = beefsteakMaterials.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

    const columns: Column<BeefsteakMaterial>[] = [
        {
            header: 'Tên Nguyên Liệu',
            accessorKey: 'name',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <Package size={16} />
                    </div>
                    <div>
                        <p className="font-medium text-gray-200">{row.name}</p>
                        <p className="text-xs text-gray-400">{row.category}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Định Lượng',
            cell: (row) => (
                <div className="flex items-center gap-1.5 font-medium">
                    <Scale size={16} className="text-gray-400" />
                    {row.quantity} {row.unit}
                </div>
            )
        },
        {
            header: 'Đơn Giá / Đv',
            cell: (row) => (
                <div className="text-gray-400">
                    {row.costPerUnit.toLocaleString('vi-VN')} ₫
                </div>
            )
        },
        {
            header: 'Thành Tiền',
            cell: (row) => (
                <div className="font-medium text-gray-200">
                    {(row.quantity * row.costPerUnit).toLocaleString('vi-VN')} ₫
                </div>
            )
        },
        {
            header: 'Tình Trạng Kho',
            cell: (row) => (
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${row.status === 'In Stock' ? 'bg-green-100 text-green-700' :
                    row.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                    {row.status}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header Area */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/products/materials')}
                        className="hover:bg-zinc-800/80 rounded-full p-2 h-auto"
                    >
                        <ArrowLeft size={20} className="text-gray-400" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-2">
                            <ChefHat size={26} className="text-red-600" />
                            Định mức Nguyên Liệu: Bò Bít Tết (Beefsteak)
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">Danh sách chi tiết các nguyên vật liệu để chế biến 1 phần Bò bít tết chuẩn 250g.</p>
                    </div>
                </div>
                <Button className="bg-red-600 hover:bg-red-700 text-white shadow-sm gap-2">
                    <CheckCircle2 size={18} />
                    Xuất Báo Cáo BOM
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-0 shadow-sm ring-1 ring-zinc-800 bg-gradient-to-br from-white to-red-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400">Tổng Chi Phí (Giá Vốn)</p>
                            <h3 className="text-2xl font-bold text-gray-200">{totalCost.toLocaleString('vi-VN')} ₫</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-0 shadow-sm ring-1 ring-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-600">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400">Số lượng thành phần</p>
                            <h3 className="text-2xl font-bold text-gray-200">{beefsteakMaterials.length} Món</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-0 shadow-sm ring-1 ring-zinc-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                            <Scale size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400">Trọng lượng thịt chính</p>
                            <h3 className="text-2xl font-bold text-gray-200">250 gram</h3>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Materials Table */}
            <Card className="border-0 shadow-sm ring-1 ring-zinc-700 bg-zinc-900/50 overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                    <h3 className="text-lg font-semibold text-gray-200">Bảng Bill of Materials (BOM)</h3>
                </div>
                <div className="p-0">
                    <DataTable
                        columns={columns}
                        data={beefsteakMaterials}
                        isLoading={false}
                        keyExtractor={(item) => item.id}
                    />
                </div>
            </Card>
        </div>
    );
};
