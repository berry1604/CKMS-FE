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
    status: 'Còn hàng' | 'Sắp hết' | 'Hết hàng';
}

const beefsteakMaterials: BeefsteakMaterial[] = [
    { id: '1', name: 'Thịt bò Tenderloin (Thăn nội)', quantity: 250, unit: 'gram', costPerUnit: 1200, category: 'Thịt tươi', status: 'Còn hàng' },
    { id: '2', name: 'Tiêu đen xay', quantity: 5, unit: 'gram', costPerUnit: 50, category: 'Gia vị', status: 'Còn hàng' },
    { id: '3', name: 'Muối biển hồng', quantity: 5, unit: 'gram', costPerUnit: 40, category: 'Gia vị', status: 'Còn hàng' },
    { id: '4', name: 'Bơ nhạt (Thực vật/Động vật)', quantity: 30, unit: 'gram', costPerUnit: 250, category: 'Bơ sữa', status: 'Còn hàng' },
    { id: '5', name: 'Tỏi nguyên tép', quantity: 15, unit: 'gram', costPerUnit: 20, category: 'Rau củ', status: 'Còn hàng' },
    { id: '6', name: 'Cỏ hương thảo (Rosemary)', quantity: 10, unit: 'gram', costPerUnit: 100, category: 'Gia vị thảo mộc', status: 'Sắp hết' },
    { id: '7', name: 'Dầu ô liu', quantity: 20, unit: 'ml', costPerUnit: 150, category: 'Dầu ăn', status: 'Còn hàng' },
    { id: '8', name: 'Khoai tây (ăn kèm)', quantity: 150, unit: 'gram', costPerUnit: 40, category: 'Rau củ', status: 'Còn hàng' },
    { id: '9', name: 'Măng tây đỏ', quantity: 50, unit: 'gram', costPerUnit: 300, category: 'Rau củ', status: 'Hết hàng' },
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
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${row.status === 'Còn hàng' ? 'bg-green-100 text-green-700' :
                    row.status === 'Sắp hết' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                    {row.status}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-20 pt-4">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/products/materials')}
                        className="h-12 w-12 rounded-2xl bg-[var(--bg-root)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10 transition-all duration-300 border border-[var(--border-primary)]"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-3 italic">
                            <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                                <ChefHat size={26} className="text-red-500" />
                            </div>
                            Định mức <span className="text-red-500">Nguyên Liệu</span>
                        </h1>
                        <p className="text-xs text-[var(--text-secondary)]/60 mt-1 font-medium uppercase tracking-[0.2em] ml-1">Bò Bít Tết (Beefsteak) · 250g chuẩn</p>
                    </div>
                </div>
                <Button className="h-14 px-8 rounded-2xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-black uppercase text-xs tracking-widest transition-all duration-500 border-0 shadow-2xl shadow-red-900/40 hover:scale-[1.02] active:scale-95 flex items-center gap-3">
                    <CheckCircle2 size={18} />
                    Xuất Báo Cáo BOM
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-8 border-[var(--border-primary)] bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[40px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
                            <DollarSign size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest mb-1">Tổng Chi Phí (Giá Vốn)</p>
                            <h3 className="text-2xl font-black text-[var(--text-primary)]">{totalCost.toLocaleString('vi-VN')} ₫</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 border-[var(--border-primary)] bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[40px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                            <Package size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest mb-1">Số lượng thành phần</p>
                            <h3 className="text-2xl font-black text-[var(--text-primary)]">{beefsteakMaterials.length} Món</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 border-[var(--border-primary)] bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[40px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                            <Scale size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest mb-1">Trọng lượng thịt</p>
                            <h3 className="text-2xl font-black text-[var(--text-primary)]">250 gram</h3>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Materials Table */}
            <Card className="border-[var(--border-primary)] bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="p-8 border-b border-[var(--border-primary)]/40 flex items-center justify-between">
                    <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3 italic">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        Bảng Bill of Materials (BOM)
                    </h3>
                </div>
                <div className="p-2">
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
