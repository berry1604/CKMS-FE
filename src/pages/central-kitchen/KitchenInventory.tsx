import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Package, Leaf, Edit, Trash2, X, Save } from 'lucide-react';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { kitchenInventoryApi } from '../../services/kitchenInventory.api';
import type { KitchenStockItemResponse } from '../../types/kitchenInventory';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export const KitchenInventory = () => {
    const navigate = useNavigate();
    const [inventory, setInventory] = useState<KitchenStockItemResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<KitchenStockItemResponse | null>(null);
    const [editQuantity, setEditQuantity] = useState<number>(0);
    const [editExpiryDate, setEditExpiryDate] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Delete State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleEditClick = (item: KitchenStockItemResponse) => {
        setSelectedItem(item);
        setEditQuantity(item.quantity);
        setEditExpiryDate(item.expiryDate ? item.expiryDate.split('T')[0] : '');
        setIsEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!selectedItem) return;
        setIsUpdating(true);
        try {
            await kitchenInventoryApi.updateStockItem(WAREHOUSE_ID, selectedItem.id, {
                quantity: editQuantity,
                expiryDate: editExpiryDate || undefined
            });
            toast.success('Cập nhật tồn kho thành công');
            setIsEditModalOpen(false);
            loadInventory();
        } catch (error) {
            console.error(error);
            toast.error('Không thể cập nhật tồn kho. Vui lòng kiểm tra lại quyền hạn hoặc API.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteClick = (item: KitchenStockItemResponse) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedItem) return;
        setIsDeleting(true);
        try {
            await kitchenInventoryApi.deleteStockItem(WAREHOUSE_ID, selectedItem.id);
            toast.success('Đã xóa vật phẩm khỏi kho');
            setIsDeleteModalOpen(false);
            loadInventory();
        } catch (error) {
            console.error(error);
            toast.error('Không thể xóa vật phẩm. Vui lòng kiểm tra lại Backend.');
        } finally {
            setIsDeleting(false);
        }
    };

    const columns: Column<KitchenStockItemResponse>[] = [
        {
            header: 'Tên vật phẩm',
            accessorKey: 'itemName',
            cell: (row) => (
                <div className="flex items-center gap-4 group/item transition-all duration-300">
                    <div className={`p-2 rounded-xl transition-all duration-300 ${row.itemType === 'MATERIAL' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                        {row.itemType === 'MATERIAL' ? (
                            <Leaf size={18} />
                        ) : (
                            <Package size={18} />
                        )}
                    </div>
                    <span className="font-bold text-zinc-100 group-hover/item:text-white transition-colors">{row.itemName}</span>
                </div>
            )
        },
        {
            header: 'Phân loại',
            cell: (row) => (
                <div className="flex">
                    <span className={`
                        px-3 py-1 text-[9px] rounded-full uppercase font-black tracking-widest border
                        ${row.itemType === 'MATERIAL'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                        }
                    `}>
                        {row.itemType === 'MATERIAL' ? 'Nguyên liệu' : 'Thành phẩm'}
                    </span>
                </div>
            )
        },
        {
            header: 'Số lượng tồn',
            cell: (row) => {
                const isLowStock = row.quantity <= 5;
                return (
                    <div className="flex items-center gap-3">
                        <div className={`
                            flex items-center px-3 py-1.5 rounded-xl border transition-all duration-300
                            ${isLowStock
                                ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                                : 'bg-white/5 border-white/5 text-zinc-100'
                            }
                        `}>
                            <span className="text-sm font-black mono tracking-tighter">
                                {row.quantity.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold uppercase ml-1 opacity-50">
                                {row.unit}
                            </span>
                        </div>
                        {isLowStock && (
                            <div className="animate-pulse">
                                <AlertTriangle size={16} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Ngày Hết hạn',
            cell: (row) => (
                <div className="flex flex-col">
                    {row.expiryDate ? (
                        <>
                            <span className="text-xs font-bold text-zinc-300">
                                {new Date(row.expiryDate).toLocaleDateString('vi-VN')}
                            </span>
                            <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-tighter">
                                {Math.ceil((new Date(row.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} ngày còn lại
                            </span>
                        </>
                    ) : (
                        <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Vĩnh viễn</span>
                    )}
                </div>
            )
        },
        {
            header: 'Thao tác',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEditClick(row)}
                        className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:bg-amber-500/10 hover:text-amber-500 border border-transparent hover:border-amber-500/20 transition-all"
                        title="Chỉnh sửa"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(row)}
                        className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 border border-transparent hover:border-red-500/20 transition-all"
                        title="Xóa"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="animate-in slide-in-from-left-4 duration-700">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        Kho Tổng <span className="text-amber-500">/</span> Bếp Trung Tâm
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1 font-medium uppercase tracking-[0.2em]">Quản lý tồn kho nguyên liệu và thành phẩm toàn hệ thống</p>
                </div>
                <div className="flex items-center gap-3 animate-in slide-in-from-right-4 duration-700">
                    <button
                        onClick={() => navigate('/kitchen/inventory/import')}
                        className="group relative flex items-center h-12 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase text-[10px] tracking-widest transition-all duration-300 border-0 shadow-2xl shadow-amber-900/40 hover:scale-[1.02] active:scale-95"
                    >
                        <TrendingUp size={18} className="mr-2 transition-transform group-hover:translate-y-[-2px]" />
                        Nhập kho
                    </button>
                </div>
            </div>

            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl relative group animate-in zoom-in-95 duration-1000">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
                <div className="p-2">
                    <DataTable
                        data={inventory}
                        columns={columns}
                        isLoading={isLoading}
                        keyExtractor={(item) => item.id}
                        className="border-0"
                    />
                </div>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Cập nhật tồn kho"
            >
                <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Vật phẩm</p>
                        <p className="text-lg font-black text-white italic">{selectedItem?.itemName}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-amber-500 uppercase tracking-widest ml-1">Số lượng tồn</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500 font-bold uppercase text-xs">
                                {selectedItem?.unit}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-amber-500 uppercase tracking-widest ml-1">Ngày hết hạn</label>
                        <input
                            type="date"
                            value={editExpiryDate}
                            onChange={(e) => setEditExpiryDate(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditModalOpen(false)}
                            className="flex-1 border-white/10 text-zinc-400 hover:text-white rounded-xl"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="flex-1 bg-amber-500 text-black font-black rounded-xl shadow-lg shadow-amber-500/20"
                        >
                            {isUpdating ? 'Đang lưu...' : (
                                <div className="flex items-center gap-2">
                                    <Save size={18} />
                                    Lưu thay đổi
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Xác nhận xóa"
            >
                <div className="space-y-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                            <AlertTriangle size={32} />
                        </div>
                        <div>
                            <p className="text-zinc-300">Bạn có chắc chắn muốn xóa vật phẩm <span className="text-white font-bold italic">"{selectedItem?.itemName}"</span> khỏi kho không?</p>
                            <p className="text-xs text-zinc-500 mt-2 uppercase font-bold tracking-tighter">Hành động này không thể hoàn tác.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 border-white/10 text-zinc-400 hover:text-white rounded-xl"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl shadow-lg shadow-red-500/20"
                        >
                            {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

