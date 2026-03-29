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
  Loader2 as LoaderIcon,
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
  const [plannedProducts, setPlannedProducts] = useState<
    {
      productId: number;
      productName: string;
      plannedQuantity: number;
      unit?: string;
    }[]
  >([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [yieldInputs, setYieldInputs] = useState<
    { productId: number; productName: string; actualProducedQty: number }[]
  >([]);

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
      const detail = await productionPlanApi.getProductionPlanDetail(id);
      setPlanDetailForYield(detail);
      const preview = await allocationApi.previewAllocation(id);

      const products = preview.rows.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        plannedQuantity:
          r.allocations?.reduce(
            (sum, a) => sum + (a.requestedQuantity || 0),
            0,
          ) || 0,
        unit: "SL",
      }));
      setPlannedProducts(products);

      if (products.length > 0) {
        setYieldInputs(
          products.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            actualProducedQty: item.plannedQuantity || 0,
          })),
        );
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
        outputs: yieldInputs.map(y => ({
          productId: y.productId,
          productName: y.productName,
          actualQty: y.actualProducedQty,
          quantity: y.actualProducedQty,
          producedQuantity: y.actualProducedQty,
          actualProducedQty: y.actualProducedQty
        })),
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

  const readyPlans = plans.filter(
    (p) =>
      p.status === "READY_TO_PRODUCE" ||
      p.status === "APPROVED" ||
      p.status === "PLANNED",
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
        border: "border-indigo-500/20 hover:border-indigo-500/50",
        bg: "bg-[var(--bg-card)]",
        glow: "hover:shadow-indigo-500/5 hover:shadow-xl",
        accent: "text-indigo-600",
        dot: "bg-indigo-500",
      },
      IN_PROD: {
        border: "border-amber-500/30 hover:border-amber-500/60",
        bg: "bg-[var(--bg-card)]",
        glow: "ring-1 ring-amber-500/10 shadow-sm hover:shadow-amber-500/10 hover:shadow-2xl",
        accent: "text-amber-600",
        dot: "bg-amber-500",
      },
      DONE: {
        border: "border-emerald-500/20 hover:border-emerald-500/40",
        bg: "bg-[var(--bg-card)]",
        glow: "hover:shadow-emerald-500/5 hover:shadow-xl",
        accent: "text-emerald-600",
        dot: "bg-emerald-500",
      },
    };

    const config = statusConfig[columnType];

    return (
      <div
        key={plan.planId}
        className={cn(
          "group relative p-6 rounded-[2rem] border transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 shadow-sm",
          config.border,
          config.bg,
          config.glow,
        )}
      >
        <div className="flex justify-between items-start mb-5">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] font-black text-[var(--text-secondary)]/40 bg-[var(--bg-root)] px-3 py-1.5 rounded-xl border border-[var(--border-primary)] w-fit uppercase italic tracking-widest">
              #{plan.planId}
            </span>
            <h4 className="font-black text-[var(--text-primary)] leading-tight text-base group-hover:text-amber-500 transition-colors duration-300 uppercase italic tracking-tighter">
              {plan.planName}
            </h4>
          </div>
          {columnType === "IN_PROD" && (
            <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest italic">
                Trực tiếp
              </span>
            </div>
          )}
          {columnType === "DONE" && (
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm">
              <CheckCircle size={16} className="text-emerald-500" />
            </div>
          )}
        </div>

        <div className="space-y-4 pb-6 border-b border-[var(--border-primary)]/10">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--text-secondary)]/40 font-black uppercase tracking-widest italic">Lô sản xuất</span>
            <span className="text-[var(--text-primary)] font-black font-mono bg-[var(--bg-root)] px-2.5 py-1 rounded-lg border border-[var(--border-primary)] shadow-inner">
              {plan.batchCode || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--text-secondary)]/40 font-black uppercase tracking-widest italic">Ngày tạo lập</span>
            <span className="text-[var(--text-secondary)] font-bold italic">
              {new Date(plan.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
        </div>

        {columnType === "READY" && plan.status === "PLANNED" && (
          <div className="mt-5 p-4 rounded-3xl bg-red-500/5 border border-red-500/10 flex items-center gap-4 shadow-inner">
            <AlertCircle size={20} className="text-red-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter italic">
                Kho đang thiếu nguyên liệu
              </span>
              <span className="text-[9px] text-[var(--text-secondary)]/40 font-black leading-none mt-1 italic uppercase tracking-widest">
                Cần bổ sung kho để sẵn sàng nấu
              </span>
            </div>
          </div>
        )}

        <div className="pt-6 flex flex-col gap-3">
          {columnType === "READY" && (
            <>
              {plan.status === "PLANNED" ? (
                <Button
                  className="w-full bg-[var(--bg-root)] hover:bg-[var(--text-primary)]/5 text-[var(--text-secondary)] font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl border border-[var(--border-primary)] transition-all italic"
                  onClick={async () => {
                    try {
                      await productionPlanApi.readyProductionPlan(plan.planId);
                      toast.success("Kế hoạch đã sẵn sàng sản xuất!");
                      loadPlans();
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || "Kho vẫn chưa đủ nguyên liệu");
                    }
                  }}
                >
                  <RefreshCw size={14} className="mr-3 text-amber-500" /> Kiểm tra & Kích hoạt
                </Button>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black uppercase text-[10px] tracking-widest h-14 shadow-lg shadow-indigo-500/20 rounded-2xl border-0 transition-all hover:-translate-y-1 active:scale-95 italic"
                  onClick={() => handleStart(plan.planId, plan.version)}
                >
                  <PlayCircle size={16} className="mr-3" /> Bắt đầu nấu
                </Button>
              )}
            </>
          )}
          {columnType === "IN_PROD" && (
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase text-[10px] tracking-widest h-14 shadow-lg shadow-amber-500/20 rounded-2xl border-0 transition-all hover:-translate-y-1 active:scale-95 italic"
              onClick={() => openYieldModal(plan.planId, plan.version)}
            >
              <CheckCircle2 size={16} className="mr-3" /> Hoàn tất mẻ nấu
            </Button>
          )}
          {columnType === "DONE" && (
            <div className="flex items-center justify-center gap-3 w-full text-emerald-600 font-black uppercase text-[10px] tracking-widest bg-emerald-500/10 h-14 rounded-2xl border border-emerald-500/20 italic">
              <Sparkles size={16} /> Đã hoàn thiện
            </div>
          )}
        </div>
      </div>
    );
  };

  const columnsCol = [
    {
      key: "READY" as const,
      title: "Sẵn sàng sản xuất",
      plans: readyPlans,
      dotColor: "bg-indigo-500",
      ringColor: "ring-indigo-500/20",
      badgeVariant: "info" as const,
      emptyIcon: <Database size={48} className="text-indigo-500/20" />,
      emptyText: "Trống dữ liệu mẻ nấu",
      columnBg: "bg-[var(--bg-card)]",
      columnBorder: "border-[var(--border-primary)]",
      headerBg: "bg-[var(--bg-root)]/50",
    },
    {
      key: "IN_PROD" as const,
      title: "Đang trung lòng nấu",
      plans: inProdPlans,
      dotColor: "bg-amber-500",
      ringColor: "ring-amber-500/20",
      badgeVariant: "orange" as const,
      emptyIcon: <Flame size={48} className="text-amber-500/20" />,
      emptyText: "Chưa bắt đầu mẻ nào",
      columnBg: "bg-amber-500/[0.01]",
      columnBorder: "border-amber-500/20",
      headerBg: "bg-amber-500/[0.03]",
    },
    {
      key: "DONE" as const,
      title: "Hoàn tất bàn giao",
      plans: donePlans,
      dotColor: "bg-emerald-500",
      ringColor: "ring-emerald-500/20",
      badgeVariant: "success" as const,
      emptyIcon: <CheckCircle2 size={48} className="text-emerald-500/20" />,
      emptyText: "Chưa có mẻ hoàn tất",
      columnBg: "bg-[var(--bg-card)]",
      columnBorder: "border-[var(--border-primary)]",
      headerBg: "bg-[var(--bg-root)]/50",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-root)] pb-20 animate-in fade-in duration-700">
      {/* Cinematic Header */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-b-[4rem] border-b border-[var(--border-primary)] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-[var(--bg-root)] to-indigo-500/[0.05]" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-amber-500/[0.03] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/[0.03] rounded-full blur-[100px]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--bg-root)] to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end px-10 pb-12 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-10 bg-amber-500/50" />
            <span className="text-amber-500 font-black tracking-[0.4em] text-[10px] uppercase italic">
              Production Command Center ELITE
            </span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-black text-[var(--text-primary)] tracking-tighter italic uppercase leading-none">
                <ChefHat className="inline-block mr-4 mb-2 text-amber-500 drop-shadow-lg" size={48} />
                TIẾN ĐỘ <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">SẢN XUẤT</span>
              </h1>
              <p className="text-[var(--text-secondary)]/60 max-w-2xl text-base font-medium italic leading-relaxed uppercase tracking-wider">
                Linh hồn của bếp trung tâm — Theo dõi trạng thái nấu và báo cáo năng suất thực tế theo thời chuẩn thời gian thực.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-10 px-10 py-5 bg-[var(--bg-card)] backdrop-blur-3xl border border-[var(--border-primary)] rounded-[2.5rem] shadow-xl">
                <div className="text-center group">
                  <span className="text-3xl font-black text-indigo-500 leading-none group-hover:scale-110 transition-transform block">
                    {readyPlans.length}
                  </span>
                  <span className="text-[8px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest block mt-2 italic">
                    Chờ nấu
                  </span>
                </div>
                <div className="w-px h-10 bg-[var(--border-primary)]/20" />
                <div className="text-center group">
                  <span className="text-3xl font-black text-amber-500 leading-none group-hover:scale-110 transition-transform block">
                    {inProdPlans.length}
                  </span>
                  <span className="text-[8px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest block mt-2 italic">
                    Đang nấu
                  </span>
                </div>
                <div className="w-px h-10 bg-[var(--border-primary)]/20" />
                <div className="text-center group">
                  <span className="text-3xl font-black text-emerald-500 leading-none group-hover:scale-110 transition-transform block">
                    {donePlans.length}
                  </span>
                  <span className="text-[8px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest block mt-2 italic">
                    Xong
                  </span>
                </div>
              </div>

              <Button
                onClick={loadPlans}
                disabled={isLoading}
                className="h-20 w-20 p-0 rounded-[2.5rem] bg-[var(--bg-card)] backdrop-blur-3xl border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-amber-500 hover:border-amber-500 transition-all shadow-xl group"
              >
                <RefreshCw size={24} className={cn("text-amber-500", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-[1700px] mx-auto px-10 -mt-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 min-h-[calc(100vh-400px)]">
          {columnsCol.map((col) => (
            <div
              key={col.key}
              className={cn(
                "flex flex-col rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden transition-all shadow-sm",
                col.columnBg,
                col.columnBorder,
              )}
            >
              <div
                className={cn(
                  "px-10 py-8 border-b border-[var(--border-primary)]/20 flex justify-between items-center shrink-0",
                  col.headerBg,
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full ring-4 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]",
                      col.dotColor,
                      col.ringColor,
                      col.key === "IN_PROD" && "animate-pulse",
                    )}
                  />
                  <h3 className="font-black text-[var(--text-primary)] uppercase tracking-[0.3em] text-xs italic">
                    {col.title}
                  </h3>
                </div>
                <Badge
                  variant={col.badgeVariant}
                  className="text-[10px] font-black border-0 min-w-[32px] h-8 justify-center rounded-xl shadow-inner"
                >
                  {col.plans.length}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {col.plans.length > 0 ? (
                  col.plans.map((p) => renderCard(p, col.key))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-6 py-32 opacity-20">
                    {col.emptyIcon}
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] italic">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-root)]/80 backdrop-blur-3xl p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-2xl bg-[var(--bg-card)] rounded-[4rem] border border-[var(--border-primary)] shadow-[0_40px_100px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-12 duration-700">
            <div className="p-10 bg-gradient-to-br from-amber-500/[0.02] to-transparent border-b border-[var(--border-primary)]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/[0.03] blur-[100px]" />
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-xl shadow-amber-500/5 rotate-3">
                  <ClipboardList size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      variant="orange"
                      className="text-[9px] font-black tracking-[0.3em] px-3 py-1 border-0 italic"
                    >
                      YIELD REPORT ELITE
                    </Badge>
                    <span className="text-[10px] font-mono font-black text-[var(--text-secondary)]/40 italic">
                      IDENTIFIER: #{finishingPlanId}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic">
                    Nghiệm thu mẻ nấu
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-10 space-y-8 overflow-y-auto no-scrollbar">
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                  <LoaderIcon className="animate-spin text-amber-500" size={40} />
                  <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.4em] italic animate-pulse">
                    Đang đối soát dữ liệu chuỗi cung ứng...
                  </span>
                </div>
              ) : planDetailForYield ? (
                <div className="space-y-8 animate-in fade-in duration-700">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[var(--bg-root)] p-6 rounded-[2rem] border border-[var(--border-primary)] space-y-2 shadow-inner">
                        <span className="text-[9px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest italic">Tên mẻ nấu</span>
                        <p className="text-sm font-black text-amber-500 uppercase tracking-tighter truncate">{planDetailForYield.planName}</p>
                    </div>
                    <div className="bg-[var(--bg-root)] p-6 rounded-[2rem] border border-[var(--border-primary)] space-y-2 shadow-inner">
                        <span className="text-[9px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest italic">Mã lô định danh</span>
                        <p className="text-sm font-black text-[var(--text-primary)] font-mono tracking-widest">{planDetailForYield.batchCode}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-4">
                      <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] italic">
                        Thẩm định sản lượng thực tế
                      </h4>
                      <Badge variant="info" className="text-[8px] border-0 rounded-lg px-2 italic uppercase">Auto-Suggested Yield</Badge>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {plannedProducts.map((item) => (
                        <div
                          key={item.productId}
                          className="group/item border border-[var(--border-primary)] rounded-[2.5rem] bg-[var(--bg-root)]/50 p-6 flex items-center justify-between hover:border-amber-500/40 transition-all shadow-sm"
                        >
                          <div className="flex flex-col gap-2">
                            <span className="text-base font-black text-[var(--text-primary)] uppercase italic tracking-tight">
                              {item.productName}
                            </span>
                            <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase italic">
                              Mục tiêu kế hoạch: <strong className="text-amber-500 ml-1">{item.plannedQuantity} {item.unit || "SL"}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <input
                              type="number"
                              className="w-24 h-14 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[1.2rem] text-center text-lg font-black text-amber-500 focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/40 outline-none transition-all hover:bg-white shadow-inner font-mono"
                              value={yieldInputs.find((y) => y.productId === item.productId)?.actualProducedQty ?? 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setYieldInputs((prev) => prev.map((y) => y.productId === item.productId ? { ...y, actualProducedQty: val } : y));
                              }}
                              min={0}
                            />
                            <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase italic tracking-widest">
                              {item.unit || "SL"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 flex gap-6 italic">
                    <AlertCircle size={24} className="text-amber-500 shrink-0 mt-1" />
                    <p className="text-[11px] text-[var(--text-secondary)]/60 font-medium leading-relaxed uppercase tracking-wider">
                      Lưu ý: Sau khi xác nhận hoàn thành, mẻ sản xuất sẽ được niêm phong trạng thái <span className="text-amber-500 font-black">"PRODUCED"</span> và sẵn sàng để quản trị kho điều hành chuỗi cung ứng phân phối (Allocation).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-[var(--text-secondary)]/20 uppercase font-black tracking-[0.5em] text-xs italic">
                  Giao thức kết nối bị gián đoạn...
                </div>
              )}
            </div>

            <div className="p-10 bg-[var(--bg-root)]/50 border-t border-[var(--border-primary)]/20 mt-auto flex gap-6">
              <Button
                variant="outline"
                onClick={() => setShowYieldModal(false)}
                className="border-[var(--border-primary)] text-[var(--text-secondary)]/60 hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 h-20 px-12 rounded-[2rem] flex-1 uppercase text-[10px] font-black tracking-[0.3em] transition-all italic"
              >
                Hủy bỏ
              </Button>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black uppercase text-[10px] tracking-[0.3em] h-20 px-14 rounded-[2rem] flex-1 shadow-[0_20px_50px_rgba(16,185,129,0.2)] border-0 transition-all hover:scale-[1.02] active:scale-95 italic"
                onClick={handleConfirmFinish}
                disabled={isDetailLoading || !planDetailForYield}
              >
                {isDetailLoading ? 'Đang truy xuất...' : 'Xác nhận & Niêm phong'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
