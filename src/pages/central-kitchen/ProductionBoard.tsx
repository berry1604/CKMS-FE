import { useEffect, useState } from "react";
import {
  PlayCircle,
  CheckCircle,
  CheckSquare,
  Clock,
  HelpCircle,
  LayoutDashboard,
  Database,
  ArrowRight,
  Info,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ClipboardList,
  Timer,
  Package,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { productionPlanApi } from "../../services/productionPlan.api";
import type {
  ProductionPlanSummaryResponse,
  ProductionPlanDetailResponse,
} from "../../types/productionPlan";
import { Card } from "../../components/ui/Card";
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
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [manualProductId, setManualProductId] = useState<number>(1);
  const [manualActualQty, setManualActualQty] = useState<number>(100);

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
    try {
      const detail = await productionPlanApi.getProductionPlanDetail(id);
      setPlanDetailForYield(detail);
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
      const outputs = [
        {
          productId: manualProductId,
          actualQty: manualActualQty,
        },
      ];

      const yieldData = {
        outputs,
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
    (p) => p.status === "READY_TO_PRODUCE" || p.status === "APPROVED",
  );
  const inProdPlans = plans.filter(
    (p) => p.status === "IN_PRODUCTION" || p.status === "PLANNING",
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
    const statusColors = {
      READY: "border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500",
      IN_PROD:
        "border-amber-500/30 bg-amber-500/5 hover:border-amber-500 ring-1 ring-amber-500/20 shadow-lg shadow-amber-900/10",
      DONE: "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 opacity-80",
    };

    return (
      <div
        key={plan.planId}
        className={cn(
          "group relative p-6 rounded-[28px] border transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
          statusColors[columnType],
        )}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 py-0.5 bg-zinc-950 rounded-lg border border-zinc-800 w-fit">
              #{plan.planId}
            </span>
            <h4 className="font-black text-zinc-100 mt-2 leading-none uppercase tracking-tighter text-sm group-hover:text-amber-500 transition-colors">
              {plan.planName}
            </h4>
          </div>
          {columnType === "IN_PROD" && (
            <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-full animate-pulse">
              <Timer size={10} className="text-amber-500" />
              <span className="text-[8px] font-black text-amber-500 uppercase">
                Live
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3 pb-4 border-b border-zinc-800/50">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-tight">
            <span>Lô sản xuất:</span>
            <span className="text-zinc-400 font-mono tracking-tighter">
              {plan.batchCode || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-tight">
            <span>Ngày tạo:</span>
            <span className="text-zinc-400">
              {new Date(plan.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>

        <div className="pt-4 h-12 flex items-center">
          {columnType === "READY" && (
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest h-10 shadow-lg shadow-indigo-900/20 rounded-xl border-0"
              onClick={() => handleStart(plan.planId, plan.version)}
            >
              <PlayCircle size={14} className="mr-2" strokeWidth={3} /> Bắt đầu
              nấu
            </Button>
          )}
          {columnType === "IN_PROD" && (
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-widest h-10 shadow-lg shadow-amber-900/20 rounded-xl border-0"
              onClick={() => openYieldModal(plan.planId, plan.version)}
            >
              <CheckCircle2 size={14} className="mr-2" strokeWidth={3} /> Hoàn
              tất mẻ
            </Button>
          )}
          {columnType === "DONE" && (
            <div className="flex items-center justify-center gap-2 w-full text-emerald-500 font-black uppercase text-[10px] tracking-widest bg-emerald-500/10 h-10 rounded-xl border border-emerald-500/20">
              <CheckCircle size={14} strokeWidth={3} /> Đã xong
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 h-[calc(100vh-140px)] flex flex-col pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="orange"
              className="text-[10px] font-black tracking-widest px-2 py-0 border-0 h-4 uppercase"
            >
              PRODUCTION
            </Badge>
            <h1 className="text-3xl font-black text-zinc-100 uppercase tracking-tighter">
              Bảng Điều Khiển Bếp
            </h1>
          </div>
          <p className="text-xs text-zinc-500 font-medium tracking-wide">
            Linh hồn của bếp trung tâm — Theo dõi trạng thái nấu và báo cáo năng
            suất thực tế.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={loadPlans}
            disabled={isLoading}
            className="h-12 w-12 p-0 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
          >
            <LayoutDashboard
              size={20}
              className={isLoading ? "animate-spin" : ""}
            />
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 min-h-0">
        {/* COLUMN: READY */}
        <div className="flex flex-col bg-zinc-900/40 rounded-[32px] border border-zinc-800/50 overflow-hidden">
          <div className="p-6 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20"></div>
              <h3 className="font-black text-zinc-200 uppercase tracking-widest text-[11px]">
                Sẵn sàng sản xuất
              </h3>
            </div>
            <Badge variant="info" className="text-[10px] font-black border-0">
              {readyPlans.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {readyPlans.length > 0 ? (
              readyPlans.map((p) => renderCard(p, "READY"))
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 opacity-10">
                <Database size={48} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Trống dữ liệu
                </span>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN: IN PRODUCTION */}
        <div className="flex flex-col bg-amber-500/[0.02] rounded-[32px] border border-amber-500/20 overflow-hidden ring-1 ring-amber-500/10 shadow-[0_0_50px_rgba(245,158,11,0.05)]">
          <div className="p-6 bg-amber-500/5 backdrop-blur-md border-b border-amber-500/20 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ring-4 ring-amber-500/20"></div>
              <h3 className="font-black text-amber-500 uppercase tracking-widest text-[11px]">
                Đang nấu
              </h3>
            </div>
            <Badge variant="orange" className="text-[10px] font-black border-0">
              {inProdPlans.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {inProdPlans.length > 0 ? (
              inProdPlans.map((p) => renderCard(p, "IN_PROD"))
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 opacity-10">
                <PlayCircle size={48} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                  Chưa bắt đầu mẻ nào
                </span>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN: DONE */}
        <div className="flex flex-col bg-zinc-900/40 rounded-[32px] border border-zinc-800/50 overflow-hidden opacity-60">
          <div className="p-6 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></div>
              <h3 className="font-black text-zinc-200 uppercase tracking-widest text-[11px]">
                Hoàn thành hôm nay
              </h3>
            </div>
            <Badge
              variant="success"
              className="text-[10px] font-black border-0"
            >
              {donePlans.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {donePlans.length > 0 ? (
              donePlans.map((p) => renderCard(p, "DONE"))
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 opacity-10">
                <CheckCircle2 size={48} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
                  Trống
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Yield Reporting Modal */}
      {showYieldModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-zinc-950 rounded-[40px] border border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-5 duration-500">
            {/* Modal Header */}
            <div className="p-8 bg-gradient-to-br from-zinc-900 to-zinc-950 border-b border-zinc-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] blur-3xl"></div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <ClipboardList size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="orange"
                      className="text-[8px] font-black tracking-[0.2em] h-4 py-0 border-0"
                    >
                      YIELD REPORT
                    </Badge>
                    <span className="text-[10px] font-mono font-black text-zinc-600">
                      ID: #{finishingPlanId}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-zinc-100 uppercase tracking-tight mt-1">
                    Nghiệm thu mẻ nấu
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="animate-spin text-amber-500" size={32} />
                  <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">
                    Đang đối soát dữ liệu...
                  </span>
                </div>
              ) : planDetailForYield ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="bg-zinc-900/40 p-6 rounded-[24px] border border-zinc-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                        Tên mẻ:
                      </span>
                      <span className="text-sm font-black text-amber-500">
                        {planDetailForYield.planName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                        Mã lô vạ:
                      </span>
                      <span className="text-sm font-black text-zinc-300 font-mono italic">
                        {planDetailForYield.batchCode}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center ml-1">
                      <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                        Sản lượng thực tế
                      </h4>
                      <Badge variant="info" className="text-[8px]">
                        Thủ công
                      </Badge>
                    </div>
                    <div className="border border-zinc-800 rounded-[24px] bg-black/40 p-4 divide-y divide-zinc-800/50">
                      <div className="flex flex-col gap-4 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600">
                              <BoxIcon size={14} />
                            </div>
                            <span className="text-[13px] font-bold text-zinc-400">
                              ID Sản phẩm
                            </span>
                          </div>
                          <input
                            type="number"
                            className="w-24 h-10 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-[15px] font-black text-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                            value={manualProductId}
                            onChange={(e) =>
                              setManualProductId(Number(e.target.value))
                            }
                            min={1}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-bold text-zinc-400 pl-11">
                            Số lượng
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="w-24 h-10 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-[15px] font-black text-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                              value={manualActualQty}
                              onChange={(e) =>
                                setManualActualQty(Number(e.target.value))
                              }
                              min={0}
                            />
                            <span className="text-[11px] font-black text-zinc-600 uppercase">
                              Unit
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-[20px] bg-amber-500/5 border border-amber-500/10 flex gap-4">
                    <AlertCircle
                      size={20}
                      className="text-amber-500 shrink-0"
                    />
                    <p className="text-[11px] text-zinc-500 font-medium italic leading-relaxed">
                      Lưu ý: Sau khi xác nhận hoàn thành, mẻ sản xuất sẽ chuyển
                      trạng thái "PRODUCED" và sẵn sàng để quản trị kho điều
                      hành phân phối (Allocation).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-600 uppercase font-black tracking-widest text-[10px]">
                  Lỗi kết nối dữ liệu!
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-zinc-900/50 border-t border-zinc-800 mt-auto flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowYieldModal(false)}
                className="border-zinc-800 text-zinc-500 hover:text-white h-14 px-8 rounded-2xl flex-1 uppercase text-[10px] font-black tracking-widest"
              >
                Quay lại
              </Button>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-[10px] tracking-widest h-14 px-10 rounded-2xl flex-1 shadow-lg shadow-emerald-900/20 border-0"
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

const BoxIcon = Package;
const Loader2 = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
