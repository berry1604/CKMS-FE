import { useEffect, useState } from "react";
import {
  PlayCircle,
  CheckCircle,
  Database,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Flame,
  ChefHat,
  Sparkles,
  RefreshCw,
  Loader2 as LoaderIcon
} from "lucide-react";
import { toast } from "react-hot-toast";
import { productionPlanApi } from "../../services/productionPlan.api";
import { allocationApi } from "../../services/allocationApi";
import type {
  ProductionPlanSummaryResponse,
  ProductionPlanDetailResponse,
} from "../../types/productionPlan";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../utils/classNames";

export const ProductionBoard = () => {
  const [plans, setPlans] = useState<ProductionPlanSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Yield reporting modal
  const [showYieldModal, setShowYieldModal] = useState(false);
  const [finishingPlanId, setFinishingPlanId] = useState<number | null>(null);
  const [finishingPlanVersion, setFinishingPlanVersion] = useState<
    number | undefined
  >();
  const [planDetailForYield, setPlanDetailForYield] =
    useState<ProductionPlanDetailResponse | null>(null);
  const [plannedProducts, setPlannedProducts] = useState<{ productId: number, productName: string, plannedQuantity: number, unit?: string }[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [yieldInputs, setYieldInputs] = useState<{ productId: number, actualQty: number }[]>([]);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const res = await productionPlanApi.getAllProductionPlans({ size: 100 });
      setPlans(res.content || []);
    } catch (error) {
      toast.error("Không thể tải kế hoạch sản xuất");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    const interval = setInterval(() => {
      loadPlans();
    }, 15000); // refresh every 15s to keep board updated
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (id: number, version?: number) => {
    try {
      await productionPlanApi.startProductionPlan(id, version);
      toast.success("Đã bắt đầu sản xuất!");
      loadPlans();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể bắt đầu sản xuất",
      );
    }
  };

  const openYieldModal = async (id: number, version?: number) => {
    setFinishingPlanId(id);
    setFinishingPlanVersion(version);
    setShowYieldModal(true);
    setIsDetailLoading(true);
    setPlanDetailForYield(null);
    setPlannedProducts([]);
    setYieldInputs([]);
    try {
      // 1. Fetch details for metadata (name, batchCode)
      const detail = await productionPlanApi.getProductionPlanDetail(id);
      setPlanDetailForYield(detail);
      
      // 2. Fetch preview allocation to get the ACTUAL products required for this plan
      // since the backend's getProductionPlanDetail does not return items or outputs.
      const preview = await allocationApi.previewAllocation(id);
      
      const products = preview.rows.map(r => ({
          productId: r.productId,
          productName: r.productName,
          // Extract the total requested quantity from the nested allocations
          plannedQuantity: r.allocations?.reduce((sum, a) => sum + (a.requestedQuantity || 0), 0) || 0,
          unit: 'SL'
      }));
      setPlannedProducts(products);
      
      // Initialize inputs from planned items
      if (products.length > 0) {
        setYieldInputs(products.map(item => ({
          productId: item.productId,
          actualQty: item.plannedQuantity || 0
        })));
      }
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu chi tiết báo cáo năng suất");
      setShowYieldModal(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleConfirmFinish = async () => {
    if (!finishingPlanId) return;
    setIsDetailLoading(true);
    try {
      const yieldData = {
        outputs: yieldInputs,
        requestVersion: finishingPlanVersion,
      };

      await productionPlanApi.finishProductionPlan(
        finishingPlanId,
        finishingPlanVersion,
        yieldData,
      );
      toast.success("Sản xuất hoàn tất. Đã báo cáo năng suất thành công!");
      setShowYieldModal(false);
      setFinishingPlanId(null);
      loadPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi hoàn tất sản xuất");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Filter statuses for the board
  const readyPlans = plans.filter(
    (p) => p.status === "READY_TO_PRODUCE" || p.status === "APPROVED" || p.status === "PLANNED",
  );
  const inProdPlans = plans.filter(
    (p) => p.status === "IN_PRODUCTION" || p.status === "PRODUCING",
  );
  const donePlans = plans.filter(
    (p) =>
      p.status === "COMPLETED" ||
      p.status === "FINISHED" ||
      p.status === "PRODUCED",
  );

  const renderCard = (
    plan: ProductionPlanSummaryResponse,
    columnType: "READY" | "IN_PROD" | "DONE",
  ) => {
    const statusConfig = {
      READY: {
        border: "border-indigo-500/20 hover:border-indigo-500/60",
        bg: "bg-gradient-to-br from-indigo-500/[0.08] to-transparent",
        glow: "group-hover:shadow-[0_0_40px_rgba(99,102,241,0.08)]",
        accent: "text-indigo-400",
        dot: "bg-indigo-500",
      },
      IN_PROD: {
        border: "border-amber-500/30 hover:border-amber-500/60",
        bg: "bg-gradient-to-br from-amber-500/[0.08] to-transparent",
        glow: "ring-1 ring-amber-500/10 shadow-[0_8px_32px_rgba(245,158,11,0.08)] group-hover:shadow-[0_12px_48px_rgba(245,158,11,0.12)]",
        accent: "text-amber-400",
        dot: "bg-amber-500",
      },
      DONE: {
        border: "border-emerald-500/20 hover:border-emerald-500/40",
        bg: "bg-gradient-to-br from-emerald-500/[0.05] to-transparent",
        glow: "group-hover:shadow-[0_0_40px_rgba(16,185,129,0.06)]",
        accent: "text-emerald-400",
        dot: "bg-emerald-500",
      },
    };

    const config = statusConfig[columnType];

    return (
      <div
        key={plan.planId}
        className={cn(
          "group relative p-6 rounded-3xl border backdrop-blur-md transition-all duration-500 animate-in fade-in slide-in-from-bottom-2",
          config.border,
          config.bg,
          config.glow,
        )}
      >
        {/* Top accent line */}
        <div className={cn("absolute inset-x-6 top-0 h-px opacity-30", columnType === "IN_PROD" ? "bg-gradient-to-r from-transparent via-amber-500 to-transparent" : columnType === "READY" ? "bg-gradient-to-r from-transparent via-indigo-500 to-transparent" : "bg-gradient-to-r from-transparent via-emerald-500 to-transparent")} />

        <div className="flex justify-between items-start mb-5">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] font-bold text-gray-600 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 w-fit">
              #{plan.planId}
            </span>
            <h4 className={cn("font-bold text-white leading-snug text-sm group-hover:text-amber-400 transition-colors duration-300")}>
              {plan.planName}
            </h4>
          </div>
          {columnType === "IN_PROD" && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">
                Live
              </span>
            </div>
          )}
          {columnType === "DONE" && (
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle size={14} className="text-emerald-400" />
            </div>
          )}
        </div>

        <div className="space-y-3 pb-5 border-b border-white/5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-600 font-medium">Lô sản xuất</span>
            <span className="text-gray-400 font-mono text-[10px] bg-black/30 px-2 py-0.5 rounded-md">
              {plan.batchCode || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-600 font-medium">Ngày tạo</span>
            <span className="text-gray-400 text-[10px]">
              {new Date(plan.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>

        <div className="pt-5">
          {columnType === "READY" && (
            <Button
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold uppercase text-[10px] tracking-widest h-11 shadow-[0_8px_24px_-6px_rgba(99,102,241,0.4)] rounded-xl border-0 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              onClick={() => handleStart(plan.planId, plan.version)}
            >
              <PlayCircle size={14} className="mr-2" strokeWidth={2.5} /> Bắt đầu nấu
            </Button>
          )}
          {columnType === "IN_PROD" && (
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold uppercase text-[10px] tracking-widest h-11 shadow-[0_8px_24px_-6px_rgba(245,158,11,0.4)] rounded-xl border-0 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              onClick={() => openYieldModal(plan.planId, plan.version)}
            >
              <CheckCircle2 size={14} className="mr-2" strokeWidth={2.5} /> Hoàn tất mẻ
            </Button>
          )}
          {columnType === "DONE" && (
            <div className="flex items-center justify-center gap-2 w-full text-emerald-400 font-bold uppercase text-[10px] tracking-widest bg-emerald-500/10 h-11 rounded-xl border border-emerald-500/20">
              <Sparkles size={14} /> Đã hoàn thành
            </div>
          )}
        </div>
      </div>
    );
  };

  // Column config
  const columns = [
    {
      key: "READY" as const,
      title: "Sẵn sàng sản xuất",
      plans: readyPlans,
      dotColor: "bg-indigo-500",
      ringColor: "ring-indigo-500/20",
      badgeVariant: "info" as const,
      emptyIcon: <Database size={40} className="text-indigo-500/30" />,
      emptyText: "Trống dữ liệu",
      columnBg: "bg-white/[0.015]",
      columnBorder: "border-white/[0.06]",
      headerBg: "bg-white/[0.03]",
    },
    {
      key: "IN_PROD" as const,
      title: "Đang nấu",
      plans: inProdPlans,
      dotColor: "bg-amber-500",
      ringColor: "ring-amber-500/20",
      badgeVariant: "orange" as const,
      emptyIcon: <Flame size={40} className="text-amber-500/30" />,
      emptyText: "Chưa bắt đầu mẻ nào",
      columnBg: "bg-amber-500/[0.015]",
      columnBorder: "border-amber-500/10",
      headerBg: "bg-amber-500/[0.03]",
    },
    {
      key: "DONE" as const,
      title: "Hoàn thành",
      plans: donePlans,
      dotColor: "bg-emerald-500",
      ringColor: "ring-emerald-500/20",
      badgeVariant: "success" as const,
      emptyIcon: <CheckCircle2 size={40} className="text-emerald-500/30" />,
      emptyText: "Trống",
      columnBg: "bg-white/[0.01]",
      columnBorder: "border-white/[0.04]",
      headerBg: "bg-white/[0.02]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-16">
      {/* Cinematic Header */}
      <div className="relative h-[280px] w-full overflow-hidden">
        {/* Background gradient instead of image */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 via-[#0a0a0a] to-indigo-950/30" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-amber-500/[0.06] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/[0.05] rounded-full blur-[100px]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />

        <div className="absolute inset-0 flex flex-col justify-end px-8 pb-10 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-amber-500/50" />
            <span className="text-amber-500 font-medium tracking-[0.3em] text-[10px] uppercase">Central Kitchen Production</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tighter mb-2">
                <ChefHat className="inline-block mr-3 mb-1 text-amber-500" size={36} />
                TIẾN ĐỘ <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">SẢN XUẤT</span>
              </h1>
              <p className="text-gray-500 max-w-xl text-base font-light leading-relaxed">
                Linh hồn của bếp trung tâm — Theo dõi trạng thái nấu và báo cáo năng suất thực tế.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats Pill */}
              <div className="flex items-center gap-6 px-6 py-3 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl">
                <div className="text-center">
                  <span className="text-2xl font-bold text-indigo-400 leading-none">{readyPlans.length}</span>
                  <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block mt-0.5">Chờ</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <span className="text-2xl font-bold text-amber-400 leading-none">{inProdPlans.length}</span>
                  <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block mt-0.5">Đang nấu</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <span className="text-2xl font-bold text-emerald-400 leading-none">{donePlans.length}</span>
                  <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block mt-0.5">Xong</span>
                </div>
              </div>

              <Button
                onClick={loadPlans}
                disabled={isLoading}
                className="h-14 w-14 p-0 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-[1600px] mx-auto px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[calc(100vh-360px)]">
          {columns.map((col) => (
            <div
              key={col.key}
              className={cn(
                "flex flex-col rounded-[28px] border backdrop-blur-xl overflow-hidden transition-all",
                col.columnBg,
                col.columnBorder,
              )}
            >
              {/* Column Header */}
              <div className={cn("px-6 py-5 border-b border-white/[0.05] flex justify-between items-center shrink-0", col.headerBg)}>
                <div className="flex items-center gap-3">
                  <div className={cn("w-2.5 h-2.5 rounded-full ring-4", col.dotColor, col.ringColor, col.key === "IN_PROD" && "animate-pulse")} />
                  <h3 className="font-bold text-gray-300 uppercase tracking-widest text-[11px]">
                    {col.title}
                  </h3>
                </div>
                <Badge variant={col.badgeVariant} className="text-[10px] font-bold border-0 min-w-[28px] justify-center">
                  {col.plans.length}
                </Badge>
              </div>

              {/* Column Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {col.plans.length > 0 ? (
                  col.plans.map((p) => renderCard(p, col.key))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                    {col.emptyIcon}
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-700">
                      {col.emptyText}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Yield Reporting Modal */}
      {showYieldModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-[#0f0f0f] rounded-[32px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_120px_rgba(245,158,11,0.05)] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            {/* Modal Header */}
            <div className="p-8 bg-gradient-to-br from-white/[0.04] to-transparent border-b border-white/[0.06] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/[0.04] blur-[80px]" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                  <ClipboardList size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="orange"
                      className="text-[8px] font-bold tracking-[0.2em] h-4 py-0 border-0"
                    >
                      YIELD REPORT
                    </Badge>
                    <span className="text-[10px] font-mono font-bold text-gray-600">
                      ID: #{finishingPlanId}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Nghiệm thu mẻ nấu
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <LoaderIcon className="animate-spin text-amber-500" size={32} />
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                    Đang đối soát dữ liệu...
                  </span>
                </div>
              ) : planDetailForYield ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 font-medium">
                        Tên mẻ
                      </span>
                      <span className="text-sm font-bold text-amber-400">
                        {planDetailForYield.planName}
                      </span>
                    </div>
                    <div className="h-px bg-white/[0.04]" />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 font-medium">
                        Mã lô
                      </span>
                      <span className="text-sm font-bold text-gray-300 font-mono">
                        {planDetailForYield.batchCode}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    <div className="flex justify-between items-center px-1 sticky top-0 bg-[#0f0f0f] z-10 py-1">
                      <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        Sản lượng thực tế
                      </h4>
                      <Badge variant="info" className="text-[8px] border-0">
                        Hệ thống đề xuất
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                        {plannedProducts.map((item) => (
                           <div key={item.productId} className="border border-white/[0.06] rounded-2xl bg-black/40 p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                             <div className="flex flex-col gap-1">
                               <span className="text-[13px] font-bold text-gray-300">{item.productName}</span>
                               <span className="text-[10px] font-medium text-gray-500">Mục tiêu ban đầu: <strong className="text-gray-400">{item.plannedQuantity} {item.unit || 'SL'}</strong></span>
                             </div>
                             <div className="flex items-center gap-2">
                               <input
                                  type="number"
                                  className="w-20 h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl text-center text-[13px] font-bold text-amber-400 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none transition-all hover:bg-white/[0.06]"
                                  value={yieldInputs.find(y => y.productId === item.productId)?.actualQty ?? 0}
                                  onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setYieldInputs(prev => prev.map(y => y.productId === item.productId ? { ...y, actualQty: val } : y));
                                  }}
                                  min={0}
                                />
                                <span className="text-[10px] font-bold text-gray-600 uppercase">{item.unit || 'SL'}</span>
                             </div>
                           </div>
                        ))}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/10 flex gap-4">
                    <AlertCircle
                      size={18}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      Lưu ý: Sau khi xác nhận hoàn thành, mẻ sản xuất sẽ chuyển
                      trạng thái "PRODUCED" và sẵn sàng để quản trị kho điều
                      hành phân phối (Allocation).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-600 uppercase font-bold tracking-widest text-[10px]">
                  Lỗi kết nối dữ liệu!
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-white/[0.02] border-t border-white/[0.05] mt-auto flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowYieldModal(false)}
                className="border-white/10 text-gray-500 hover:text-white hover:bg-white/[0.04] h-14 px-8 rounded-2xl flex-1 uppercase text-[10px] font-bold tracking-widest transition-all"
              >
                Quay lại
              </Button>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold uppercase text-[10px] tracking-widest h-14 px-10 rounded-2xl flex-1 shadow-[0_12px_32px_-6px_rgba(16,185,129,0.3)] border-0 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                onClick={handleConfirmFinish}
                disabled={isDetailLoading || !planDetailForYield}
              >
                Hoàn tất & Báo cáo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

