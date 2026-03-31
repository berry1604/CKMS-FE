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
            cell: (row) => {
                const diffDays = row.expiryDate ? Math.ceil((new Date(row.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                const isExpired = diffDays !== null && diffDays < 0;
                const isExpiringSoon = diffDays !== null && diffDays >= 0 && diffDays <= 7;

                return (
                    <div className="flex items-center gap-4 group/item transition-all duration-300">
                        <div className={cn(
                            "p-2 rounded-xl transition-all duration-300 border",
                            row.itemType === 'MATERIAL'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        )}>
                            {row.itemType === 'MATERIAL' ? (
                                <Leaf size={18} />
                            ) : (
                                <Package size={18} />
                            )}
                        </div>
                        <div>
                            <span className={cn(
                                "font-bold transition-colors uppercase italic",
                                isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-500" : "text-[var(--text-primary)]"
                            )}>
                                {row.itemName}
                            </span>
                            {(isExpired || isExpiringSoon) && (
                                <div className="flex items-center gap-2 mt-1">
                                    {isExpired && (
                                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[8px] font-black tracking-widest uppercase border border-red-500/20 flex items-center gap-1">
                                            <AlertTriangle className="w-2.5 h-2.5" />
                                            Đã hết hạn
                                        </span>
                                    )}
                                    {isExpiringSoon && (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black tracking-widest uppercase border border-amber-500/20 flex items-center gap-1">
                                            <AlertTriangle className="w-2.5 h-2.5" />
                                            Sắp hết hạn
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        },
        {
            header: 'Phân loại',
            cell: (row) => (
                <div className="flex">
                    <span className={cn(
                        "px-3 py-1 text-[9px] rounded-full uppercase font-black tracking-widest border",
                        row.itemType === 'MATERIAL'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-sm'
                    )}>
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
                        <div className={cn(
                            "flex items-center px-3 py-1.5 rounded-xl border transition-all duration-300",
                            isLowStock
                                ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-sm'
                                : 'bg-[var(--bg-root)] border-[var(--border-primary)] text-[var(--text-primary)]'
                        )}>
                            <span className="text-sm font-black mono tracking-tighter">
                                {row.quantity.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold uppercase ml-1 opacity-50">
                                {row.unit}
                            </span>
                        </div>
                        {isLowStock && (
                            <div className="animate-pulse">
                                <AlertTriangle size={16} className="text-red-500" />
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Ngày Hết hạn',
            cell: (row) => {
                if (row.expiryDate) {
                    const diffDays = Math.ceil((new Date(row.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    let statusColor = "text-[var(--text-secondary)]";
                    let daysColor = "text-[var(--text-secondary)]/60";

                    if (diffDays < 0) {
                        statusColor = "text-red-500";
                        daysColor = "text-red-400";
                    } else if (diffDays <= 7) {
                        statusColor = "text-amber-500";
                        daysColor = "text-amber-400";
                    }

                    return (
                        <div className="flex flex-col">
                            <span className={`text-xs font-bold ${statusColor}`}>
                                {new Date(row.expiryDate).toLocaleDateString('vi-VN')}
                            </span>
                            <span className={`text-[9px] font-medium uppercase tracking-tighter ${daysColor}`}>
                                {diffDays < 0 ? `${Math.abs(diffDays)} ngày quá hạn` : `${diffDays} ngày còn lại`}
                            </span>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col">
                        <span className="text-[var(--text-secondary)]/40 text-[10px] font-black uppercase tracking-widest italic font-mono">Vĩnh viễn</span>
                    </div>
                );
            }
        },
        ...(canManageInventory ? [{
            header: 'Thao tác',
            cell: (row: KitchenStockItemResponse) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEditClick(row)}
                        className="p-2 rounded-xl bg-[var(--bg-root)] text-[var(--text-secondary)] hover:bg-amber-500/10 hover:text-amber-500 border border-[var(--border-primary)] hover:border-amber-500/20 transition-all shadow-sm"
                        title="Chỉnh sửa"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(row)}
                        className="p-2 rounded-xl bg-[var(--bg-root)] text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-500 border border-[var(--border-primary)] hover:border-red-500/20 transition-all shadow-sm"
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
                <div className="absolute inset-0 bg-[var(--bg-root)]">
                    <img
                        src="/src/assets/kitchen_inventory.png"
                        alt="Inventory Hero"
                        className="w-full h-full object-cover opacity-80 scale-105 group-hover/header:scale-110 transition-transform duration-[3s] ease-out shadow-inner"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-root)] via-[var(--bg-root)]/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-root)] via-transparent to-[var(--bg-root)]"></div>
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-10 pb-14 max-w-[1600px] mx-auto w-full">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div className="space-y-4 animate-in slide-in-from-left-8 duration-1000 delay-100">
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] italic">Inventory Command Center</span>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-end gap-6">
                                <div>
                                    <h1 className="text-5xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none mb-2 italic">
                                        Kho Bếp <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Trung Tâm</span>
                                    </h1>
                                    <p className="text-[var(--text-secondary)] text-sm font-medium uppercase tracking-widest max-w-xl leading-relaxed opacity-80 italic">
                                        Quản lý tồn kho nguyên liệu và thành phẩm toàn hệ thống với độ chính xác thời gian thực.
                                    </p>
                                </div>

                                <div className="md:mb-1">
                                    <KitchenSelector
                                        selectedKitchenId={selectedKitchenId}
                                        onKitchenChange={setSelectedKitchenId}
                                    />
                                </div>
                            </div>
                        </div>

                        {canManageInventory && (
                            <div className="flex items-center gap-4 animate-in slide-in-from-right-8 duration-1000 delay-200">
                                <button
                                    onClick={() => navigate('/kitchen/inventory/import', { state: { kitchenId: selectedKitchenId } })}
                                    className="group relative flex items-center h-14 px-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-black font-black uppercase text-[11px] tracking-widest transition-all duration-500 hover:scale-[1.05] active:scale-95 shadow-[0_20px_40px_rgba(245,158,11,0.2)]"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-20 relative z-20 px-4">
                {[
                    { label: 'Tổng số vật phẩm', value: totalItems, icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', desc: 'Các loại vật phẩm hiện có' },
                    { label: 'Cảnh báo tồn kho', value: lowStockItems, icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', desc: 'Mặt hàng dưới mức an toàn', highlight: lowStockItems > 0 },
                    { label: 'Sắp hết hạn', value: expiringSoonItems, icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', desc: 'Vật phẩm hết hạn trong 7 ngày', highlight: expiringSoonItems > 0 }
                ].map((stat, i) => (
                    <div
                        key={i}
                        className={cn(
                            "p-8 rounded-3xl border transition-all duration-500 group/card relative overflow-hidden",
                            "bg-[var(--bg-card)] border-[var(--border-primary)] hover:border-amber-500/20 shadow-sm hover:shadow-xl",
                            stat.highlight && `ring-1 ring-amber-500/10`
                        )}
                    >
                        <div className={cn(
                            "absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full opacity-5 group-hover/card:opacity-10 transition-opacity bg-amber-500"
                        )}></div>

                        <div className="flex items-start justify-between relative z-10">
                            <div className="space-y-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover/card:scale-110",
                                    stat.bgColor, stat.borderColor, stat.color
                                )}>
                                    <stat.icon size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] mb-1 italic">{stat.label}</p>
                                    <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter italic">
                                        {isLoading ? '---' : stat.value.toLocaleString()}
                                    </h3>
                                </div>
                                <p className="text-[11px] text-[var(--text-secondary)]/60 font-black italic opacity-60 uppercase tracking-widest">{stat.desc}</p>
                            </div>

                            {stat.highlight && (
                                <div className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse",
                                    stat.color === 'text-red-500' ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                                )}>
                                    Action Required
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Inventory List Section */}
            <div className="space-y-6 pt-4 animate-in fade-in duration-1000 delay-300 px-4">
                <div className="flex items-center justify-between ml-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                        <h4 className="text-[12px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] italic">
                            Chi tiết danh mục tồn kho
                        </h4>
                    </div>
                    <button
                        onClick={() => selectedWarehouseId && loadInventory(selectedWarehouseId)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-secondary)] hover:text-amber-500 rounded-full font-black text-[10px] uppercase tracking-widest transition-all border border-[var(--border-primary)] hover:border-amber-500/30 shadow-sm"
                    >
                        <RefreshCw size={14} className={cn("text-amber-500", isLoading && "animate-spin")} />
                        {isLoading ? 'Đang làm mới...' : 'Làm mới hệ thống'}
                    </button>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl overflow-hidden shadow-sm relative group/table">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-50"></div>
                    <div className="p-6">
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
                <div className="space-y-6 p-2">
                    <div className="p-6 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] shadow-inner">
                        <p className="text-[10px] text-[var(--text-secondary)]/40 uppercase font-black tracking-widest mb-2 italic">Vật phẩm định danh</p>
                        <p className="text-2xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter">{selectedItem?.itemName}</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Số lượng tồn kho</label>
                        <div className="relative group">
                            <input
                                type="number"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(Number(e.target.value))}
                                className="w-full bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-[1.5rem] py-5 px-8 text-[var(--text-primary)] font-bold text-lg focus:outline-none focus:ring-4 focus:ring-amber-500/5 transition-all group-hover:border-amber-500/30"
                            />
                            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/40 font-black uppercase text-[10px] tracking-widest italic">
                                {selectedItem?.unit}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Ngày hết hạn hiệu dụng</label>
                        <input
                            type="date"
                            value={editExpiryDate}
                            onChange={(e) => setEditExpiryDate(e.target.value)}
                            className="w-full bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-[1.5rem] py-5 px-8 text-[var(--text-primary)] font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/5 transition-all group-hover:border-amber-500/30"
                        />
                    </div>

                    <div className="flex gap-4 pt-6">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditModalOpen(false)}
                            className="flex-1 border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5 rounded-[1.5rem] h-16 uppercase text-[10px] font-black tracking-widest"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="flex-1 bg-gradient-to-br from-amber-400 to-orange-600 text-black font-black rounded-[1.5rem] h-16 shadow-lg shadow-amber-500/20 uppercase text-[10px] font-black tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {isUpdating ? 'Đang lưu...' : (
                                <div className="flex items-center justify-center gap-3">
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
                <div className="space-y-8 p-4">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-24 h-24 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-xl shadow-red-500/5 rotate-3">
                            <AlertTriangle size={48} />
                        </div>
                        <div>
                            <p className="text-[var(--text-primary)] text-lg font-bold italic uppercase tracking-tight">Bạn có chắc chắn muốn xóa vật phẩm</p>
                            <p className="text-2xl font-black text-red-500 italic uppercase tracking-tighter mt-1">"{selectedItem?.itemName}"</p>
                            <p className="text-[var(--text-secondary)]/60 text-xs mt-6 uppercase font-black tracking-[0.2em] italic">Hành động này không thể hoàn tác trong hệ thống.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-red-500/5 hover:text-red-500 rounded-[1.5rem] h-16 uppercase text-[10px] font-black tracking-widest transition-all"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black rounded-[1.5rem] h-16 shadow-xl shadow-red-500/20 uppercase text-[10px] font-black tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
