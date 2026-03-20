import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Plus, Search, Store, Zap } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { kitchenApi } from "../../services/kitchen.api";
import type { KitchenResponse, KitchenUpdateRequest } from "../../types/kitchen";
import toast from "react-hot-toast";
import { WarehouseTable } from "./components/WarehouseTable";
import { WarehouseModal } from "./components/WarehouseModal";
import { WarehouseStockModal } from "./components/WarehouseStockModal";

export const WarehousePage = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [warehouses, setWarehouses] = useState<KitchenResponse[]>([]);
    
    const [searchQuery, setSearchQuery] = useState('');

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<KitchenResponse | null>(null);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedWarehouseForStock, setSelectedWarehouseForStock] = useState<KitchenResponse | null>(null);

    const userRoleStr = user?.role?.toUpperCase().replace('ROLE_', '');
    const canManage = userRoleStr === 'MANAGER' || userRoleStr === 'ADMIN';

    const loadWarehouses = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await kitchenApi.getAllKitchens();
            setWarehouses(res.data || []);
        } catch (err) {
            console.error("Error loading warehouses:", err);
            toast.error("Không thể tải danh sách kho");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadWarehouses();
    }, [loadWarehouses]);

    const filteredWarehouses = useMemo(() => {
        return warehouses.filter(w => {
            return w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   (w.address && w.address.toLowerCase().includes(searchQuery.toLowerCase()));
        });
    }, [warehouses, searchQuery]);

    const stats = useMemo(() => {
        const totalCapacity = warehouses.reduce((acc, curr) => acc + (curr.maxDailyCapacity || 0), 0);
        return {
            total: warehouses.length,
            totalCapacity
        };
    }, [warehouses]);

    const handleCreateNew = () => {
        setEditingWarehouse(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (warehouse: KitchenResponse) => {
        setEditingWarehouse(warehouse);
        setIsFormModalOpen(true);
    };

    const handleDelete = async (warehouse: KitchenResponse) => {
        if (!window.confirm(`Bạn có chắc muốn xóa kho "${warehouse.name}"? Hành động này không thể hoàn tác.`)) {
            return;
        }

        setIsActionLoading(true);
        try {
            await kitchenApi.deleteKitchen(warehouse.kitchenId);
            toast.success("Xóa kho thành công");
            loadWarehouses();
        } catch (error: any) {
            console.error("Delete warehouse error:", error);
            const msg = error.response?.data?.message || "Lỗi khi xóa kho";
            toast.error(msg);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleViewStock = (warehouse: KitchenResponse) => {
        setSelectedWarehouseForStock(warehouse);
        setIsStockModalOpen(true);
    };

    const handleSubmitForm = async (data: KitchenUpdateRequest) => {
        setIsActionLoading(true);
        try {
            if (editingWarehouse) {
                await kitchenApi.updateKitchen(editingWarehouse.kitchenId, data);
                toast.success("Cập nhật thông tin kho thành công");
            } else {
                await kitchenApi.createKitchen(data);
                toast.success("Tạo kho mới thành công");
            }
            setIsFormModalOpen(false);
            loadWarehouses();
        } catch (error: any) {
            console.error("Submit warehouse error:", error);
            const msg = error.response?.data?.message || (editingWarehouse ? "Lỗi khi cập nhật kho" : "Lỗi khi tạo kho mới");
            toast.error(msg);
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
                
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-xl border border-amber-500/30 backdrop-blur-md">
                            <Store className="w-5 h-5 text-amber-500" />
                        </div>
                        <Badge
                            variant="orange"
                            className="text-[10px] font-black tracking-widest px-2.5 py-1 border-0 uppercase bg-amber-500/10 text-amber-500"
                        >
                            Quản lý hệ thống
                        </Badge>
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
                        Quản Lý Kho
                    </h1>
                    <p className="text-sm text-zinc-400 font-medium tracking-wide max-w-xl leading-relaxed">
                        Cấu hình và theo dõi danh sách các kho lưu trữ, kiểm soát sức chứa và trạng thái hoạt động theo thời gian thực.
                    </p>
                </div>

                {canManage && (
                    <Button
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase text-xs tracking-widest px-8 h-14 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] border-0 flex items-center gap-2 rounded-2xl transition-all duration-300 transform hover:-translate-y-1"
                        onClick={handleCreateNew}
                    >
                        <Plus size={18} />
                        Thêm Kho Mới
                    </Button>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Widget */}
                <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 flex items-center gap-6 hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                        <Store className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black tracking-widest text-zinc-500 uppercase">Tổng số kho</p>
                        <div className="text-4xl font-black text-white tracking-tighter mt-1">{stats.total}</div>
                    </div>
                </div>

                {/* Capacity Widget */}
                <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 flex items-center gap-6 hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                        <Zap className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black tracking-widest text-zinc-500 uppercase">Tổng công suất</p>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-4xl font-black text-amber-400 tracking-tighter font-mono">{stats.totalCapacity.toLocaleString()}</span>
                            <span className="text-xs text-zinc-500 font-bold uppercase">u/m</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-zinc-900/30 backdrop-blur-xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl relative">
                {/* Toolbar */}
                <div className="p-6 md:p-8 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full group">
                        <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-amber-500 transition-colors z-10" />
                        <Input
                            placeholder="Tìm kiếm danh tính hoặc địa chỉ kho..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-14 bg-zinc-950/50 border-white/10 focus:border-amber-500/50 rounded-2xl shadow-inner text-white transition-all w-full relative z-10"
                        />
                    </div>
                </div>

                {/* Table Component */}
                <WarehouseTable
                    warehouses={filteredWarehouses}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewStock={handleViewStock}
                    canManage={canManage}
                />
            </div>

            <WarehouseModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleSubmitForm}
                warehouse={editingWarehouse}
                isLoading={isActionLoading}
            />

            <WarehouseStockModal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
                warehouse={selectedWarehouseForStock}
            />
        </div>
    );
};
