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
import productionBg from '../../assets/kitchen_production.png';

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
            case 'READY_TO_PRODUCE': return <Badge variant="info" className="bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase text-[9px] font-black italic rounded-full h-6 px-3">{displayLabel}</Badge>;
            case 'PRODUCING': return <Badge variant="orange" className="bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse uppercase text-[9px] font-black italic rounded-full h-6 px-3">{displayLabel}</Badge>;
            case 'COMPLETED': return <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 uppercase text-[9px] font-black italic rounded-full h-6 px-3">{displayLabel}</Badge>;
            case 'CANCELLED': return <Badge variant="secondary" className="bg-[var(--bg-root)] text-[var(--text-secondary)]/40 border-[var(--border-primary)] uppercase text-[9px] font-black italic rounded-full h-6 px-3">{displayLabel}</Badge>;
            default: return <Badge variant="secondary" className="uppercase text-[9px] font-black italic rounded-full h-6 px-3">{displayLabel}</Badge>;
        }
    };


    return (
        <div className="min-h-screen bg-[var(--bg-root)] animate-in fade-in duration-700 pb-20">
            {/* Cinematic Header Area */}
            <div className="relative h-[450px] w-full overflow-hidden">
                <img
                    src={productionBg}
                    className="w-full h-full object-cover scale-105 motion-safe:animate-[pulse_10s_ease-in-out_infinite] opacity-40 dark:opacity-60"
                    alt="Production Strategy Console"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-card)]/80 via-[var(--bg-card)]/20 to-[var(--bg-root)] backdrop-blur-[2px]" />

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-16 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-[2px] w-16 bg-emerald-500/50" />
                        <span className="text-emerald-500 font-black tracking-[0.4em] text-[10px] uppercase italic">Hệ thống Điều phối Sản xuất Trung tâm</span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div className="space-y-4">
                            <h1 className="text-6xl md:text-8xl font-black text-[var(--text-primary)] tracking-tighter italic uppercase leading-none">
                                QUẢN TRỊ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600">SẢN XUẤT</span>
                            </h1>
                            <p className="text-[var(--text-secondary)]/60 max-w-2xl text-lg font-medium leading-relaxed italic uppercase tracking-wider">
                                Giám sát vòng đời kế hoạch sản xuất và tối ưu hóa năng lực bếp trung tâm thông qua hạ tầng điều phối thời gian thực.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 mb-2">
                             <Button 
                                variant="ghost" 
                                onClick={fetchData}
                                disabled={isLoading}
                                className="h-20 w-20 bg-[var(--bg-card)]/40 backdrop-blur-3xl border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-emerald-500 rounded-[2rem] transition-all shadow-2xl group/refresh"
                            >
                                <RefreshCw size={28} className={cn("transition-transform group-hover/refresh:rotate-180 duration-700", isLoading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 -mt-10 relative z-10 space-y-12">

            {/* Kitchen Status Monitoring Grid */}
            {kitchens.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {kitchens.map(kitchen => {
                        const usedCapacity = kitchen.todayUsedCapacity || 0;
                        const maxCapacity = kitchen.maxDailyCapacity || 1;
                        const capacityPercentage = Math.min(100, Math.round((usedCapacity / maxCapacity) * 100));
                        const isOverloaded = usedCapacity > maxCapacity;

                        return (
                            <div key={kitchen.kitchenId} className="bg-[var(--bg-card)]/40 backdrop-blur-3xl border border-[var(--border-primary)] rounded-[2.5rem] p-8 hover:border-emerald-500/20 transition-all group shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] blur-3xl -mr-12 -mt-12 group-hover:bg-emerald-500/5 transition-all duration-700" />
                                
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)]/40 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all shadow-inner">
                                            <ChefHat size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight uppercase italic truncate max-w-[120px]">{kitchen.name}</h3>
                                            <p className="text-[9px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest mt-1 italic">{kitchen.currentStatus === 'IN_PRODUCTION' ? 'Đang vận hành' : 'Sẵn sàng'}</p>
                                        </div>
                                    </div>
                                    <Badge variant={kitchen.currentStatus === 'IN_PRODUCTION' ? 'orange' : 'success'} className="border-0 px-3 py-1 uppercase tracking-widest text-[8px] font-black italic rounded-full shadow-inner">
                                        {kitchen.activePlanCount} Plans
                                    </Badge>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                                        <span className="text-[var(--text-secondary)]/40">Sản lượng hiệu dụng</span>
                                        <span className={cn(
                                            isOverloaded ? "text-red-500" : "text-emerald-500"
                                        )}>
                                            {usedCapacity.toLocaleString()} / {maxCapacity.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-[var(--bg-root)] rounded-full overflow-hidden border border-[var(--border-primary)] p-[2px] shadow-inner">
                                        <div 
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000",
                                                isOverloaded ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]",
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

            {/* Production Plans Table Section */}
            <div className="bg-[var(--bg-card)]/60 backdrop-blur-3xl border border-[var(--border-primary)] rounded-[3rem] overflow-hidden shadow-2xl relative group/table">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[var(--bg-root)] text-[10px] uppercase font-black text-[var(--text-secondary)]/40 tracking-[0.3em] border-b border-[var(--border-primary)]/10 italic">
                                <th className="px-10 py-7">Kế hoạch & Lô định danh</th>
                                <th className="px-8 py-7">Trạng thái</th>
                                <th className="px-8 py-7">Tiến trình</th>
                                <th className="px-8 py-7">Thời gian khởi tạo</th>
                                <th className="px-10 py-7 text-right">Hành động thực thi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]/10">
                            {isLoading && plans.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-40 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-16 h-16 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
                                            <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.5em] italic animate-pulse">Đang truy lục dữ liệu chuỗi cung ứng...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : plans.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-40 text-center">
                                         <div className="flex flex-col items-center gap-6 opacity-20">
                                            <div className="w-24 h-24 rounded-[3rem] bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)]">
                                                <ClipboardList size={48} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--text-secondary)] italic">Hệ thống chưa ghi nhận kế hoạch nào</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                plans.map(plan => (
                                    <tr key={plan.planId} className="hover:bg-[var(--text-primary)]/[0.02] transition-colors group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)]/40 group-hover:bg-emerald-500/5 group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-all shadow-inner">
                                                    <Boxes size={22} />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-base font-black text-[var(--text-primary)] tracking-tight uppercase italic">{plan.planName}</span>
                                                    <span className="text-[10px] font-mono font-black text-[var(--text-secondary)]/40 uppercase italic tracking-widest">BATCH ID: <strong className="text-emerald-500/60 ml-1">{plan.batchCode || 'PENDING'}</strong></span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 font-medium">
                                            {getStatusBadge(plan.status)}
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="w-40 space-y-2">
                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest italic leading-none">
                                                    <span className="text-[var(--text-secondary)]/40">Efficiency</span>
                                                    <span className="text-emerald-500/60">
                                                        {plan.status === 'COMPLETED' ? '100%' : plan.status === 'PRODUCING' ? '50%' : plan.status === 'CANCELLED' ? '0%' : '10%'}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-[var(--bg-root)] rounded-full overflow-hidden border border-[var(--border-primary)]/20 shadow-inner">
                                                    <div 
                                                        className={cn(
                                                            "h-full transition-all duration-[2s] cubic-bezier(0.4, 0, 0.2, 1)",
                                                            plan.status === 'COMPLETED' ? 'w-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 
                                                            plan.status === 'PRODUCING' ? 'w-1/2 bg-amber-500 animate-pulse' : 
                                                            plan.status === 'CANCELLED' ? 'w-0' : 'w-[10%] bg-indigo-500'
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-black text-[var(--text-secondary)] italic uppercase tracking-tighter">{new Date(plan.createdAt).toLocaleDateString('vi-VN')}</span>
                                                <span className="text-[9px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest italic">{new Date(plan.createdAt).toLocaleTimeString('vi-VN')}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-3">
                                                {plan.status === 'READY_TO_PRODUCE' && (
                                                    <>
                                                        <Button 
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCancelPlan(plan.planId, plan.version);
                                                            }}
                                                            disabled={activeActionId === plan.planId}
                                                            className="text-[var(--text-secondary)]/40 hover:text-red-500 hover:bg-red-500/5 h-12 w-12 p-0 rounded-2xl border border-[var(--border-primary)]"
                                                        >
                                                            <XCircle size={20} />
                                                        </Button>
                                                        <Button 
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStartProduction(plan.planId, plan.version);
                                                            }}
                                                            disabled={activeActionId === plan.planId}
                                                            className="bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-black uppercase text-[10px] tracking-widest h-12 px-6 rounded-2xl border-0 shadow-lg shadow-emerald-500/10 transition-all hover:scale-105 active:scale-95 italic"
                                                        >
                                                             {activeActionId === plan.planId ? <Loader2 size={16} className="animate-spin" /> : <><PlayCircle size={16} className="mr-2" /> Start</>}
                                                        </Button>
                                                    </>
                                                )}
                                                {plan.status === 'PRODUCING' && (
                                                    <Button 
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate('/kitchen/production');
                                                        }}
                                                        className="bg-gradient-to-br from-amber-400 to-orange-600 text-black font-black uppercase text-[10px] tracking-widest h-12 px-6 rounded-2xl border-0 shadow-lg shadow-amber-500/10 transition-all hover:scale-105 active:scale-95 italic"
                                                    >
                                                        <ChefHat size={16} className="mr-2" /> View Board
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-[var(--text-secondary)]/40 hover:text-[var(--text-primary)] h-12 w-12 p-0 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] rounded-2xl transition-all"
                                                >
                                                    <ArrowRight size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Visual Performance Matrix Summary */}
                <div className="p-8 md:p-12 bg-[var(--bg-root)]/50 border-t border-[var(--border-primary)]/10 grid grid-cols-2 md:grid-cols-4 gap-10">
                     <div className="space-y-3 group/stat">
                         <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic">Tổng kế hoạch định danh</span>
                         <p className="text-3xl font-black text-[var(--text-primary)] italic group-hover:text-emerald-500 transition-colors tabular-nums">{plans.length}</p>
                     </div>
                     <div className="space-y-3 group/stat">
                         <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic">Trực tiếp sản xuất</span>
                         <p className="text-3xl font-black text-amber-500 italic group-hover:scale-105 transition-transform origin-left tabular-nums">{plans.filter(p => p.status === 'PRODUCING').length}</p>
                     </div>
                     <div className="space-y-3 group/stat">
                         <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic">Chờ khởi động</span>
                         <p className="text-3xl font-black text-indigo-500 italic group-hover:scale-105 transition-transform origin-left tabular-nums">{plans.filter(p => p.status === 'READY_TO_PRODUCE').length}</p>
                     </div>
                     <div className="flex items-end justify-end">
                         <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm hover:border-emerald-500/20 transition-all">
                             <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <AlertCircle size={16} />
                             </div>
                             <span className="text-[10px] font-black text-[var(--text-secondary)]/60 text-right uppercase tracking-widest leading-relaxed italic">Vòng đời vĩnh cửu:<br/><span className="text-emerald-500/80 uppercase">Ready &gt; Producing &gt; Finish</span></span>
                         </div>
                     </div>
                </div>
                </div>
            </div>
        </div>
    );
};
