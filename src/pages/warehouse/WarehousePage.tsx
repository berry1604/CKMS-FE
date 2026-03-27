import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Plus, Search, Store, Zap } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { kitchenApi } from "../../services/kitchen.api";
import type { KitchenCreateRequest, KitchenResponse, KitchenUpdateRequest } from "../../types/kitchen";
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
            toast.error("Không thể tải danh sách bếp trung tâm");
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
        if (!window.confirm(`Bạn có chắc muốn xóa bếp "${warehouse.name}"? Hành động này không thể hoàn tác.`)) {
            return;
        }

        setIsActionLoading(true);
        try {
            await kitchenApi.deleteKitchen(warehouse.kitchenId);
            toast.success("Xóa bếp thành công");
            loadWarehouses();
        } catch (error: any) {
            console.error("Delete warehouse error:", error);
            const msg = error.response?.data?.message || "Lỗi khi xóa bếp";
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
                toast.success("Cập nhật thông tin bếp thành công");
            } else {
                const createPayload: KitchenCreateRequest = {
                    name: data.name ?? '',
                    address: data.address ?? '',
                    maxDailyCapacity: data.maxDailyCapacity ?? 0,
                    isActive: data.isActive ?? true,
                    latitude: data.latitude,
                    longitude: data.longitude,
                };
                await kitchenApi.createKitchen(createPayload);
                toast.success("Tạo bếp mới thành công");
            }
            setIsFormModalOpen(false);
            loadWarehouses();
        } catch (error: any) {
            console.error("Submit warehouse error:", error);
            const msg = error.response?.data?.message || (editingWarehouse ? "Lỗi khi cập nhật bếp" : "Lỗi khi tạo bếp mới");
            toast.error(msg);
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
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
                        Quản lý Bếp trung tâm
                    </h1>
                    <p className="text-sm text-zinc-400 font-medium tracking-wide max-w-xl leading-relaxed">
                        Cấu hình và theo dõi danh sách các bếp trung tâm.
                    </p>
                </div>

                {canManage && (
                    <Button
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black uppercase text-xs px-8 h-14 rounded-2xl"
                        onClick={handleCreateNew}
                    >
                        <Plus size={18} />
                        Thêm Bếp Mới
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/40 rounded-[2rem] p-6 flex items-center gap-6">
                    <Store className="w-8 h-8 text-blue-500" />
                    <div>
                        <p className="text-xs text-zinc-500 uppercase">Tổng số bếp</p>
                        <div className="text-3xl text-white">{stats.total}</div>
                    </div>
                </div>

                <div className="bg-zinc-900/40 rounded-[2rem] p-6 flex items-center gap-6">
                    <Zap className="w-8 h-8 text-amber-500" />
                    <div>
                        <p className="text-xs text-zinc-500 uppercase">Tổng công suất</p>
                        <div className="text-3xl text-amber-400">{stats.totalCapacity}</div>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900/30 rounded-[3rem] border border-white/5 overflow-hidden">
                <div className="p-6 flex gap-4">
                    <Search className="w-5 h-5 text-zinc-400" />
                    <Input
                        placeholder="Tìm kiếm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

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