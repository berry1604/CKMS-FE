import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Package, Leaf, Edit, Trash2, Clock, Save, RefreshCw } from 'lucide-react';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { kitchenInventoryApi } from '../../services/kitchenInventory.api';
import { KitchenSelector } from '../../components/common/KitchenSelector';
import type { KitchenStockItemResponse } from '../../types/kitchenInventory';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/classNames';

export const KitchenInventory = () => {
    const navigate = useNavigate();
    const { user, hasAuthority } = useAuth();
    const canManageInventory = hasAuthority('KITCHEN_STAFF');
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

    const [selectedKitchenId, setSelectedKitchenId] = useState<number | null>(
        hasAuthority('KITCHEN_STAFF') ? (user?.kitchenId ?? null) : null
    );
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);

    const loadInventory = async (warehouseId: number) => {
        setIsLoading(true);
        try {
            const res = await kitchenInventoryApi.getWarehouseStock(warehouseId);
            const filteredData = (res.data || []).filter(item => item.quantity > 0);
            setInventory(filteredData);
        } catch (error) {
            console.error(error);
            toast.error('Gặp lỗi khi tải dữ liệu kho.');
        } finally {
            setIsLoading(false);
        }
    };

    // Load inventory when kitchen changes
    useEffect(() => {
        if (!selectedKitchenId) return;

        // In this system, warehouseId for central kitchens is the same as kitchenId
        const mainWarehouseId = selectedKitchenId;
        setSelectedWarehouseId(mainWarehouseId);
        loadInventory(mainWarehouseId);
    }, [selectedKitchenId]);

    const handleEditClick = (item: KitchenStockItemResponse) => {
        setSelectedItem(item);
        setEditQuantity(item.quantity);
        setEditExpiryDate(item.expiryDate ? item.expiryDate.split('T')[0] : '');
        setIsEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!selectedItem || !selectedWarehouseId) return;
        setIsUpdating(true);
        try {
            await kitchenInventoryApi.updateStockItem(selectedWarehouseId, selectedItem.id, {
                quantity: editQuantity,
                expiryDate: editExpiryDate || undefined
            });
            toast.success('Cập nhật tồn kho thành công');
            setIsEditModalOpen(false);
            loadInventory(selectedWarehouseId);
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
        if (!selectedItem || !selectedWarehouseId) return;
        setIsDeleting(true);
        try {
            await kitchenInventoryApi.deleteStockItem(selectedWarehouseId, selectedItem.id);
            toast.success('Đã xóa vật phẩm khỏi kho');
            setIsDeleteModalOpen(false);
            loadInventory(selectedWarehouseId);
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
        ...(canManageInventory ? [{
            header: 'Thao tác',
            cell: (row: KitchenStockItemResponse) => (
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
        }] : [])
    ];

    // Calculate statistics
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.quantity <= 5).length;
    const expiringSoonItems = inventory.filter(item => {
        if (!item.expiryDate) return false;
        const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return daysLeft >= 0 && daysLeft <= 7;
    }).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Cinematic Header Section */}
            <div className="relative h-[280px] -mx-4 -mt-8 mb-12 overflow-hidden group/header">
                {/* Background Image with Parallax-like effect */}
                <div className="absolute inset-0 bg-zinc-950">
                    <img
                        src="/src/assets/kitchen_inventory.png"
                        alt="Inventory Hero"
                        className="w-full h-full object-cover opacity-40 scale-105 group-hover/header:scale-110 transition-transform duration-[3s] ease-out shadow-inner"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950"></div>
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-10 pb-12 max-w-[1600px] mx-auto w-full">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div className="space-y-4 animate-in slide-in-from-left-8 duration-1000 delay-100">
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Inventory Command Center</span>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-end gap-6">
                                <div>
                                    <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                                        Kho Bếp <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Trung Tâm</span>
                                    </h1>
                                    <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest max-w-xl leading-relaxed opacity-80">
                                        Quản lý tồn kho nguyên liệu và thành phẩm toàn hệ thống với độ chính xác thời gian thực.
                                    </p>
                                </div>
                                
                                <KitchenSelector 
                                    selectedKitchenId={selectedKitchenId}
                                    onKitchenChange={setSelectedKitchenId}
                                    className="md:mb-1"
                                />
                            </div>
                        </div>

                        {canManageInventory && (
                            <div className="flex items-center gap-4 animate-in slide-in-from-right-8 duration-1000 delay-200">
                                <button
                                    onClick={() => navigate('/kitchen/inventory/import', { state: { kitchenId: selectedKitchenId } })}
                                    className="group relative flex items-center h-14 px-10 rounded-[24px] bg-white text-black font-black uppercase text-[11px] tracking-widest transition-all duration-500 hover:bg-amber-500 hover:scale-[1.05] active:scale-95 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                                >
                                    <TrendingUp size={18} className="mr-3 transition-transform group-hover:translate-y-[-2px]" />
                                    Nhập kho hệ thống
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-20 relative z-20">
                {[
                    { label: 'Tổng số vật phẩm', value: totalItems, icon: Package, color: 'blue', desc: 'Các loại vật phẩm hiện có' },
                    { label: 'Cảnh báo tồn kho', value: lowStockItems, icon: AlertTriangle, color: 'red', desc: 'Mặt hàng dưới mức an toàn', highlight: lowStockItems > 0 },
                    { label: 'Sắp hết hạn', value: expiringSoonItems, icon: Clock, color: 'amber', desc: 'Vật phẩm hết hạn trong 7 ngày', highlight: expiringSoonItems > 0 }
                ].map((stat, i) => (
                    <div
                        key={i}
                        className={cn(
                            "p-8 rounded-[32px] border transition-all duration-500 group/card relative overflow-hidden",
                            "bg-zinc-900/60 backdrop-blur-xl border-zinc-800/50 hover:border-zinc-700/80 shadow-2xl",
                            stat.highlight && `ring-1 ring-${stat.color}-500/30`
                        )}
                    >
                        <div className={cn(
                            "absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full opacity-10 group-hover/card:opacity-20 transition-opacity",
                            `bg-${stat.color}-500`
                        )}></div>

                        <div className="flex items-start justify-between relative z-10">
                            <div className="space-y-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover/card:scale-110",
                                    stat.color === 'blue' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                                        stat.color === 'red' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                            "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                )}>
                                    <stat.icon size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                    <h3 className="text-3xl font-black text-white tracking-tighter">
                                        {isLoading ? '---' : stat.value.toLocaleString()}
                                    </h3>
                                </div>
                                <p className="text-[11px] text-zinc-500 font-medium italic opacity-60">{stat.desc}</p>
                            </div>

                            {stat.highlight && (
                                <div className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse",
                                    stat.color === 'red' ? "bg-red-500/20 text-red-500" : "bg-amber-500/20 text-amber-500"
                                )}>
                                    Action Required
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Inventory List Section */}
            <div className="space-y-6 pt-4 animate-in fade-in duration-1000 delay-300">
                <div className="flex items-center justify-between ml-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-amber-500 rounded-full"></div>
                        <h4 className="text-[12px] font-black text-zinc-400 uppercase tracking-[0.3em]">
                            Chi tiết danh mục tồn kho
                        </h4>
                    </div>
                    <button
                        onClick={() => selectedWarehouseId && loadInventory(selectedWarehouseId)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-amber-500/10 text-zinc-300 hover:text-amber-500 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-white/10 hover:border-amber-500/30"
                    >
                        <RefreshCw size={14} className={isLoading ? "animate-spin text-amber-500" : "text-amber-500"} />
                        {isLoading ? 'Đang làm mới...' : 'Làm mới'}
                    </button>
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[40px] overflow-hidden shadow-2xl relative group/table">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-50"></div>
                    <div className="p-4">
                        <DataTable
                            data={inventory}
                            columns={columns}
                            isLoading={isLoading}
                            keyExtractor={(item) => item.id}
                            className="border-0"
                        />
                    </div>
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

