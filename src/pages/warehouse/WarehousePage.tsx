import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Search, Store, Zap } from "lucide-react";
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
            setWarehouses(res.data?.slice(0, 1) || []);
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

    const handleEdit = (warehouse: KitchenResponse) => {
        setEditingWarehouse(warehouse);
        setIsFormModalOpen(true);
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
                await kitchenApi.createKitchen(data as any);
                toast.success("Tạo bếp mới thành công");
            }
            setIsFormModalOpen(false);
            loadWarehouses();
        } catch (error: any) {
            console.error("Submit warehouse error:", error);
            const msg = error.response?.data?.message || "Lỗi khi cập nhật bếp";
            toast.error(msg);
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-root)] pb-20">
            {/* Cinematic Header */}
            <div className="relative h-[280px] -mx-4 -mt-8 mb-12 overflow-hidden group/header">
                <div className="absolute inset-0 bg-[var(--bg-root)]">
                    <img
                        src="https://images.unsplash.com/photo-1581452174291-58dcabe93de5?q=80&w=2070&auto=format&fit=crop"
                        className="w-full h-full object-cover opacity-80 scale-105 group-hover/header:scale-110 transition-transform duration-[3s] ease-out shadow-inner"
                        alt="Central Kitchen Warehouse"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-root)] via-[var(--bg-root)]/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-root)] via-transparent to-[var(--bg-root)]"></div>
                </div>

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-10 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <Badge variant="orange" className="text-[10px] font-black tracking-[0.3em] px-3 py-1 border-0 uppercase bg-amber-500/10 text-amber-500">
                            WAREHOUSE OPS
                        </Badge>
                        <div className="h-px w-12 bg-amber-500/30" />
                        <span className="text-amber-500/80 font-black tracking-[0.2em] text-[10px] uppercase italic">Kitchen Infrastructure</span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div>
                            <h1 className="text-5xl lg:text-6xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-[0.85] mb-3">
                                Bếp <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Trung Tâm</span>
                            </h1>
                            <p className="text-[var(--text-secondary)] max-w-xl text-sm font-bold leading-relaxed uppercase tracking-wide opacity-80">
                                Cấu hình và theo dõi danh sách bếp trung tâm, kiểm soát <span className="text-amber-500">sức chứa</span> và trạng thái hoạt động theo thời gian thực.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 -mt-10 relative z-10 space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Total Widget */}
                    <div className="backdrop-blur-3xl bg-[var(--bg-card)]/40 border border-[var(--border-primary)] rounded-[2.5rem] p-8 flex items-center gap-6 hover:bg-[var(--bg-card)]/60 transition-all relative overflow-hidden group shadow-2xl">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-xl shadow-blue-500/10 group-hover:scale-110 transition-transform">
                            <Store className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase italic">Tổng số bếp</p>
                            <div className="text-4xl font-black text-[var(--text-primary)] tracking-tighter mt-1 italic">{stats.total}</div>
                        </div>
                    </div>

                    {/* Capacity Widget */}
                    <div className="backdrop-blur-3xl bg-[var(--bg-card)]/40 border border-[var(--border-primary)] rounded-[2.5rem] p-8 flex items-center gap-6 hover:bg-[var(--bg-card)]/60 transition-all relative overflow-hidden group shadow-2xl">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-xl shadow-amber-500/10 group-hover:scale-110 transition-transform">
                            <Zap className="w-8 h-8 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase italic">Tổng công suất</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-black text-amber-500 tracking-tighter font-mono italic">{stats.totalCapacity.toLocaleString()}</span>
                                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">ĐƠN VỊ/MẺ</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="backdrop-blur-3xl bg-[var(--bg-card)]/40 rounded-[3rem] border border-[var(--border-primary)] overflow-hidden shadow-2xl relative">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>

                    {/* Toolbar */}
                    <div className="p-6 md:p-8 border-b border-[var(--border-primary)] bg-[var(--bg-root)]/20 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors z-10" />
                            <Input
                                placeholder="TÌM KIẾM BẾP TRUNG TÂM THEO TÊN HOẶC ĐỊA CHỈ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-14 h-16 w-full relative z-10 bg-[var(--bg-root)]/50 border-[var(--border-primary)] rounded-2xl text-[11px] font-black tracking-widest uppercase placeholder:text-zinc-600 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all"
                            />
                        </div>
                    </div>

                    {/* Table Component */}
                    <WarehouseTable
                        warehouses={filteredWarehouses}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onViewStock={handleViewStock}
                        canManage={canManage}
                    />
                </div>
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
