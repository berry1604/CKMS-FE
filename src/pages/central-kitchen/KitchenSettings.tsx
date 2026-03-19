import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { 
    Timer, 
    Info,
    ShieldCheck,
    Store
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { kitchenApi } from "../../services/kitchen.api";
import type { KitchenResponse } from "../../types/kitchen";
import toast from "react-hot-toast";

export const KitchenSettings = () => {
    const { user, hasAuthority } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [kitchenData, setKitchenData] = useState<KitchenResponse | null>(null);
    const [newCapacity, setNewCapacity] = useState<number>(0);
    const [initialCapacity, setInitialCapacity] = useState<number>(0);

    const loadKitchenData = async () => {
        setIsLoading(true);
        try {
            let targetKitchenId = user?.kitchenId;
            
            // If no kitchenId in user profile, try to get the first available kitchen
            if (!targetKitchenId) {
                const allRes = await kitchenApi.getAllKitchens();
                if (allRes.data && allRes.data.length > 0) {
                    targetKitchenId = allRes.data[0].kitchenId;
                }
            }

            if (targetKitchenId) {
                const res = await kitchenApi.getKitchenById(targetKitchenId);
                // The API structure is ApiResponse<KitchenResponse>
                // res is the ApiResponse, res.data is the KitchenResponse
                const data = res.data;
                if (data) {
                    setKitchenData(data);
                    setNewCapacity(data.maxDailyCapacity || 0);
                    setInitialCapacity(data.maxDailyCapacity || 0);
                }
            } else {
                toast.error("Không tìm thấy thông tin bếp trung tâm");
            }
        } catch (err) {
            console.error("Error loading kitchen data:", err);
            toast.error("Không thể tải thông tin bếp");
        } finally {
            setIsLoading(false);
        }
    };

    const getDiff = () => {
        const diff = newCapacity - initialCapacity;
        if (diff === 0) return null;
        const prefix = diff > 0 ? "+" : "";
        const percentage = ((diff / (initialCapacity || 1)) * 100).toFixed(0);
        return {
            text: `${prefix}${diff} units (${prefix}${percentage}%)`,
            isPositive: diff > 0
        };
    };

    useEffect(() => {
        loadKitchenData();
    }, [user?.kitchenId]);

    const handleSave = async () => {
        if (!kitchenData) return;
        setIsUpdating(true);
        try {
            await kitchenApi.updateKitchen(kitchenData.kitchenId, {
                maxDailyCapacity: newCapacity
            });
            toast.success("Cập nhật thiết lập bếp thành công");
            loadKitchenData();
        } catch (err) {
            console.error("Error updating kitchen:", err);
            toast.error("Lỗi khi cập nhật thiết lập bếp");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge
                            variant="orange"
                            className="text-[10px] font-black tracking-widest px-2 py-0 border-0 h-4 uppercase"
                        >
                            MANAGEMENT
                        </Badge>
                        <h1 className="text-3xl font-black text-zinc-100 uppercase tracking-tighter">
                            Thiết lập Bếp
                        </h1>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium tracking-wide">
                        Quản lý vận hành & Công suất sản xuất cho <span className="text-amber-500/80">{kitchenData?.name || "Central Kitchen"}</span>.
                    </p>
                </div>

                {hasAuthority("MANAGER") || hasAuthority("ADMIN") ? (
                    <Button
                        className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs tracking-widest px-8 h-12 shadow-xl shadow-amber-900/20 border-0 flex items-center gap-2 rounded-2xl"
                        onClick={handleSave}
                        disabled={isUpdating}
                    >
                        {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                ) : null}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Settings */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-zinc-900/40 p-8 rounded-[40px] border border-zinc-800/50 shadow-2xl space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                <Timer size={20} className="text-amber-500" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Cấu hình công suất</h3>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-6 pb-6 border-b border-white/5">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Công suất hiện tại</span>
                                    <div className="text-2xl font-black text-amber-500 font-mono tracking-tighter">
                                        {initialCapacity} <span className="text-[10px] text-stone-600 uppercase">u/min</span>
                                    </div>
                                </div>
                                
                                {getDiff() && (
                                    <div className="space-y-1 text-right animate-in slide-in-from-right-2 fade-in">
                                        <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Thay đổi dự kiến</span>
                                        <div className={`text-sm font-black italic uppercase tracking-tighter ${getDiff()?.isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                                            {getDiff()?.text}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end px-1">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                        Điều chỉnh công suất mới
                                    </label>
                                    <span className="text-[10px] font-mono font-bold text-amber-500/70 uppercase">
                                        Thiết lập mới
                                    </span>
                                </div>
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        value={newCapacity}
                                        onChange={(e) => setNewCapacity(Number(e.target.value))}
                                        disabled={!hasAuthority("MANAGER") && !hasAuthority("ADMIN")}
                                        className="h-16 bg-zinc-950/50 border-white/5 focus:border-emerald-500/50 focus:ring-emerald-500/10 text-zinc-100 rounded-[24px] transition-all duration-300 font-mono text-xl font-bold pl-8 pr-32"
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-600 font-black text-[10px] uppercase tracking-widest pointer-events-none">
                                        Đơn vị/Phút
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10">
                                    <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-zinc-400 font-medium tracking-wide leading-relaxed">
                                        Giá trị này đại diện cho throughput của bếp. Hệ thống điều phối sẽ sử dụng con số này để tính toán và gợi ý phân bổ sản xuất một cách tối ưu nhất dựa trên các đơn hàng hiện có.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Operational Status */}
                    <section className="bg-zinc-900/40 p-8 rounded-[40px] border border-zinc-800/50 shadow-2xl space-y-8">
                         <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                <ShieldCheck size={20} className="text-amber-500" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Trạng thái vận hành</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between p-6 rounded-3xl bg-zinc-950/50 border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Hoạt động</span>
                                    <span className="text-xs font-bold text-zinc-300">Kitchen Status</span>
                                </div>
                                <Badge variant={kitchenData?.isActive ? "success" : "danger"} className="h-10 px-5 border-0 font-black text-[10px] uppercase tracking-widest rounded-xl">
                                    {kitchenData?.isActive ? 'ONLINE' : 'OFFLINE'}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between p-6 rounded-3xl bg-zinc-950/50 border border-white/5 opacity-50 grayscale cursor-not-allowed">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Bảo trì</span>
                                    <span className="text-xs font-bold text-zinc-300">Maintenance Mode</span>
                                </div>
                                <div className="w-12 h-6 bg-zinc-800 rounded-full relative">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-zinc-600 rounded-full transition-all"></div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <section className="bg-zinc-900/40 p-8 rounded-[40px] border border-zinc-800/50 shadow-2xl space-y-6">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Thông tin cơ bản</h4>
                        
                        <div className="space-y-4">
                            <div className="p-5 rounded-3xl bg-zinc-950/30 border border-white/5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 border border-white/5">
                                        <Store size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Tên bếp</span>
                                        <span className="text-xs font-black text-zinc-200 uppercase tracking-tight">{kitchenData?.name}</span>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-white/5">
                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Địa chỉ</span>
                                    <span className="text-[11px] font-medium text-zinc-400 leading-relaxed italic">
                                        {kitchenData?.address || "Chưa cập nhật địa chỉ"}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 rounded-3xl bg-zinc-950/30 border border-white/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Kitchen ID</span>
                                    <span className="text-[11px] font-mono font-black text-amber-500/50 tracking-tighter">#{kitchenData?.kitchenId}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
