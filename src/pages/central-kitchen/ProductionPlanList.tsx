import { useState, useEffect } from 'react';
import { 
    ClipboardList, 
    PlayCircle, 
    XCircle, 
    ArrowRight,

    RefreshCw,
    AlertCircle,
    Boxes,
    ChefHat,
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { productionPlanApi } from '../../services/productionPlan.api';
import { kitchenApi } from '../../services/kitchen.api';
import type { ProductionPlanSummaryResponse } from '../../types/productionPlan';
import type { KitchenResponse } from '../../types/kitchen';
import { PRODUCTION_PLAN_STATUS_LABELS } from '../../utils/statusTranslations';
import { cn } from '../../utils/classNames';

export const ProductionPlanList = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState<ProductionPlanSummaryResponse[]>([]);
    const [kitchens, setKitchens] = useState<KitchenResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeActionId, setActiveActionId] = useState<number | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [plansRes, kitchensRes] = await Promise.all([
                productionPlanApi.getAllProductionPlans({ size: 50 }),
                kitchenApi.getAllKitchens()
            ]);
            setPlans(plansRes.content || []);
            setKitchens(kitchensRes.data || []);
        } catch (err) {
            toast.error("Không thể tải dữ liệu.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStartProduction = async (planId: number, version?: number) => {
        setActiveActionId(planId);
        try {
            await productionPlanApi.startProductionPlan(planId, version);
            toast.success("Đã bắt đầu sản xuất.");
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || "Không thể bắt đầu sản xuất.");
        } finally {
            setActiveActionId(null);
        }
    };

    const handleCancelPlan = async (planId: number, version?: number) => {
        if (!confirm("Bạn có chắc chắn muốn hủy kế hoạch này? Kho đã reserved sẽ được nhả ra.")) return;
        
        setActiveActionId(planId);
        try {
            await productionPlanApi.cancelProductionPlan(planId, version);
            toast.success("Đã hủy kế hoạch.");
            fetchData();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || "Không thể hủy kế hoạch.");
        } finally {
            setActiveActionId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const displayLabel = PRODUCTION_PLAN_STATUS_LABELS[status as keyof typeof PRODUCTION_PLAN_STATUS_LABELS] || status;
        switch (status) {
            case 'READY_TO_PRODUCE': return <Badge variant="info" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{displayLabel}</Badge>;
            case 'PRODUCING': return <Badge variant="orange" className="bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse">{displayLabel}</Badge>;
            case 'COMPLETED': return <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{displayLabel}</Badge>;
            case 'CANCELLED': return <Badge variant="secondary" className="bg-zinc-800 text-zinc-500 border-zinc-700">{displayLabel}</Badge>;
            default: return <Badge variant="secondary">{displayLabel}</Badge>;
        }
    };


    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in duration-700">
             {/* Header Area */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="success" className="text-[10px] font-black px-2 h-4 border-0">V3.0 MANAGEMENT</Badge>
                            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-tight">Quản lý Production Plan</h1>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium tracking-wide">Điều khiển vòng đời kế hoạch sản xuất và theo dõi tiến độ.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={fetchData}
                        disabled={isLoading}
                        className="h-12 w-12 p-0 bg-zinc-900/40 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl"
                    >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>

            {/* Kitchen Status Section */}
            {kitchens.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {kitchens.map(kitchen => {
                        const usedCapacity = kitchen.todayUsedCapacity || 0;
                        const maxCapacity = kitchen.maxDailyCapacity || 1;
                        const capacityPercentage = Math.min(100, Math.round((usedCapacity / maxCapacity) * 100));
                        const isOverloaded = usedCapacity > maxCapacity;

                        return (
                            <div key={kitchen.kitchenId} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 hover:border-amber-500/30 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-amber-500 transition-colors">
                                            <ChefHat size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-zinc-200 tracking-tight">{kitchen.name}</h3>
                                            <p className="text-[10px] text-zinc-500 font-medium capitalize mt-0.5">{kitchen.currentStatus === 'IN_PRODUCTION' ? 'Đang Nấu' : 'Rảnh Chỗ'}</p>
                                        </div>
                                    </div>
                                    <Badge variant={kitchen.currentStatus === 'IN_PRODUCTION' ? 'orange' : 'success'} className="border-0 px-2 py-0.5 uppercase tracking-widest text-[9px]">
                                        {kitchen.activePlanCount} kế hoạch
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span className="text-zinc-500">Sản lượng hôm nay</span>
                                        <span className={cn(
                                            isOverloaded ? "text-red-500" : "text-amber-500"
                                        )}>
                                            {usedCapacity} / {maxCapacity} phần
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                                        <div 
                                            className={cn(
                                                "h-full transition-all duration-1000",
                                                isOverloaded ? "bg-red-500" : "bg-amber-500",
                                                capacityPercentage > 0 && capacityPercentage < 100 && "animate-pulse"
                                            )}
                                            style={{ width: `${Math.min(100, capacityPercentage)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* List Content */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-900/50 text-[10px] uppercase font-black text-zinc-600 tracking-widest border-b border-zinc-800">
                                <th className="px-8 py-5">Kế hoạch & Lô hàng</th>
                                <th className="px-6 py-5">Trạng thái</th>
                                <th className="px-6 py-5">Tiến độ</th>
                                <th className="px-6 py-5">Ngày tạo</th>
                                <th className="px-8 py-5 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {isLoading && plans.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center text-zinc-600 font-black uppercase text-[10px] tracking-widest">
                                        Đang đồng bộ dữ liệu kế hoạch...
                                    </td>
                                </tr>
                            ) : plans.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                         <div className="flex flex-col items-center gap-4 opacity-20">
                                            <ClipboardList size={48} />
                                            <span className="text-xs font-black uppercase tracking-widest">Chưa có kế hoạch nào được tạo</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                plans.map(plan => (
                                    <tr key={plan.planId} className="hover:bg-zinc-800/20 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-emerald-500 transition-colors">
                                                    <Boxes size={18} />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-black text-zinc-100 tracking-tight">{plan.planName}</span>
                                                    <span className="text-[10px] font-mono font-bold text-zinc-600 uppercase">BATCH: {plan.batchCode || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-medium">
                                            {getStatusBadge(plan.status)}
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="w-32">
                                                <div className="flex justify-between text-[9px] font-black uppercase mb-1.5">
                                                    <span className="text-zinc-500">Progress</span>
                                                    <span className="text-zinc-400">
                                                        {plan.status === 'COMPLETED' ? '100%' : plan.status === 'PRODUCING' ? '50%' : plan.status === 'CANCELLED' ? '0%' : '10%'}
                                                    </span>
                                                </div>
                                                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className={cn(
                                                            "h-full transition-all duration-1000",
                                                            plan.status === 'COMPLETED' ? 'w-full bg-emerald-500' : 
                                                            plan.status === 'PRODUCING' ? 'w-1/2 bg-amber-500 animate-pulse' : 
                                                            plan.status === 'CANCELLED' ? 'w-0' : 'w-[10%] bg-blue-500'
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[11px] font-bold text-zinc-400">{new Date(plan.createdAt).toLocaleDateString('vi-VN')}</span>
                                                <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tight">{new Date(plan.createdAt).toLocaleTimeString('vi-VN')}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {plan.status === 'READY_TO_PRODUCE' && (
                                                    <>
                                                        <Button 
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleCancelPlan(plan.planId, plan.version)}
                                                            disabled={activeActionId === plan.planId}
                                                            className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10 h-9 w-9 p-0"
                                                        >
                                                            <XCircle size={18} />
                                                        </Button>
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => handleStartProduction(plan.planId, plan.version)}
                                                            disabled={activeActionId === plan.planId}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] tracking-widest h-9 px-4 rounded-lg border-0 shadow-lg shadow-emerald-900/20"
                                                        >
                                                             {activeActionId === plan.planId ? <Loader2 size={14} className="animate-spin" /> : <><PlayCircle size={14} className="mr-2" /> Start</>}
                                                        </Button>
                                                    </>
                                                )}
                                                {plan.status === 'PRODUCING' && (
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => navigate('/kitchen/production')}
                                                        className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[9px] tracking-widest h-9 px-4 rounded-lg border-0 shadow-lg shadow-amber-900/20"
                                                    >
                                                        <ChefHat size={14} className="mr-2" /> View Board
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-zinc-500 hover:text-white h-9 w-9 p-0 bg-zinc-950/40 border border-zinc-800"
                                                >
                                                    <ArrowRight size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Visual Footer Summary */}
                <div className="p-8 bg-zinc-950/30 border-t border-zinc-800/50 grid grid-cols-2 md:grid-cols-4 gap-8">
                     <div className="space-y-2">
                         <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tổng kế hoạch</span>
                         <p className="text-2xl font-black text-zinc-100">{plans.length}</p>
                     </div>
                     <div className="space-y-2">
                         <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Đang nấu</span>
                         <p className="text-2xl font-black text-amber-500">{plans.filter(p => p.status === 'PRODUCING').length}</p>
                     </div>
                     <div className="space-y-2">
                         <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Chờ sản xuất</span>
                         <p className="text-2xl font-black text-blue-500">{plans.filter(p => p.status === 'READY_TO_PRODUCE').length}</p>
                     </div>
                     <div className="flex items-end justify-end">
                         <div className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                             <AlertCircle size={14} className="text-zinc-600" />
                             <span className="text-[10px] font-medium text-zinc-500 italic">Vòng đời: READY -&gt; PRODUCING -&gt; COMPLETED</span>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};
