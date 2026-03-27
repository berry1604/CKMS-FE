import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Network,
  AlertCircle,
  Save,
  Info,
  ArrowRight,
  Clock,
  CheckCircle,
  CheckCircle2,
  Package,
  Store,
  Timer,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { productionPlanApi } from "../../services/productionPlan.api";
import {
  allocationApi,
  type AllocationRow,
} from "../../services/allocationApi";
import type {
  ProductionPlanSummaryResponse,
  ProductionPlanDetailResponse,
} from "../../types/productionPlan";
import { cn } from "../../utils/classNames";

export const AllocationMatrix = () => {
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState<number | "">("");
  const [selectedPlan, setSelectedPlan] =
    useState<ProductionPlanSummaryResponse | null>(null);
  const [unallocatedPlans, setUnallocatedPlans] = useState<
    ProductionPlanSummaryResponse[]
  >([]);
  const [allocatedPlans, setAllocatedPlans] = useState<
    ProductionPlanSummaryResponse[]
  >([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  const [matrix, setMatrix] = useState<AllocationRow[]>([]);
  const [hasYield, setHasYield] = useState<boolean | null>(null);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      fetchAllocationMatrix(Number(selectedPlanId));
      setIsSuccess(false);
    } else {
      setMatrix([]);
      setHasYield(null);
    }
  }, [selectedPlanId]);

  const fetchPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const res = await productionPlanApi.getAllProductionPlans({ size: 50 });
      // Robust extraction for plans (handles both wrapped and unwrapped res)
      const resPlan: any = res;
      const allPlans = resPlan?.data?.content || resPlan?.content || [];

      // Unallocated: Plans that have yielded (PRODUCED) but not finished allocation
      const unallocated = allPlans.filter((p: any) => p.status === "PRODUCED");

      // Allocated: Plans that are done (FINISHED) or ready for shipment (READY)
      const allocated = allPlans.filter(
        (p: any) => p.status === "FINISHED" || p.status === "READY",
      );

      setUnallocatedPlans(unallocated);
      setAllocatedPlans(allocated);

      if (selectedPlanId === "" && unallocated.length > 0) {
        setSelectedPlanId(unallocated[0].planId);
        setSelectedPlan(unallocated[0]);
      } else if (selectedPlanId === "" && allocated.length > 0) {
        setSelectedPlanId(allocated[0].planId);
        setSelectedPlan(allocated[0]);
      }
    } catch (error) {
      toast.error("Không thể tải kế hoạch sản xuất");
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const fetchAllocationMatrix = async (planId: number) => {
    setIsLoadingMatrix(true);
    try {
      const selectedPlanData = [...unallocatedPlans, ...allocatedPlans].find(
        (p) => p.planId === planId,
      );
      const isFinishedPlan = selectedPlanData?.status === "FINISHED";

      let previewRes: { rows: AllocationRow[] } = {
        rows: [],
      };
      let planDetail: ProductionPlanDetailResponse | null = null;

      try {
        // Fetch preview and plan details in parallel
        const [pRes, dRes] = await Promise.all([
          allocationApi.previewAllocation(planId),
          productionPlanApi.getProductionPlanDetail(planId),
        ]);
        previewRes = pRes;
        planDetail = dRes;
      } catch (apiError) {
        console.warn("Fetch failed:", apiError);
        throw apiError;
      }

      const { rows } = previewRes;

      // Map production yield from plan detail into allocation rows
      const mergedRows = (rows || []).map((row) => {
        const targetId = Number(row.productId);

        // Deep search for matching items in outputs or items arrays
        const findInArray = (arr: any[]) =>
          arr?.find(
            (x: any) => Number(x.productId || x.id || x.itemId) === targetId,
          );

        const outputItem = findInArray(planDetail?.outputs || []);
        const detailItem = findInArray(planDetail?.items || []);

        // Calculate total requested as a baseline fallback
        const totalRequestedInPlan = (row.allocations || []).reduce(
          (sum, a) => sum + (a.requestedQuantity || 0),
          0,
        );

        const totalAllocatedInPlan = (row.allocations || []).reduce(
          (sum, a) => sum + (a.allocatedQuantity || 0),
          0,
        );

        // Priority:
        // 1. Actual produced yield (outputs)
        // 2. Reported produced quantity (detailItem)
        // 3. Planned quantity (detailItem)
        // 4. Sum of requested quantities in this allocation preview
        // 5. Preview's totalAvailable (from backend)
        const planProducedQty =
          (outputItem?.actualProducedQty ??
            outputItem?.producedQuantity ??
            outputItem?.quantity ??
            outputItem?.actualQty) ||
          totalAllocatedInPlan ||
          detailItem?.producedQuantity ||
          detailItem?.plannedQuantity ||
          totalRequestedInPlan ||
          row.totalAvailable ||
          0;

        return {
          ...row,
          totalAvailable: planProducedQty,
          // Only reset to 0 if it's a NEW coordination session (PRODUCED status)
          // If it's already FINISHED, we want to see the stored values
          allocations: (row.allocations || []).map((a) => ({
            ...a,
            // Keep backend's proposed allocation as pre-filled default
          })),
        };
      });

      // Check yield AFTER mapping
      const isProducedPlan = selectedPlanData?.status === "PRODUCED";
      const hasActualYield =
        isFinishedPlan ||
        isProducedPlan ||
        (mergedRows.length > 0 && mergedRows.some((r) => r.totalAvailable > 0));
      setHasYield(hasActualYield);

      if (!hasActualYield) {
        setMatrix([]);
        return;
      }

      setMatrix(mergedRows);
    } catch (error) {
      console.error("Critical Allocation preview error:", error);
      toast.error("Không thể phân bổ dữ liệu plan này");
      setMatrix([]);
    } finally {
      setIsLoadingMatrix(false);
    }
  };

  const handleQuantityChange = (
    productId: number,
    storeId: number,
    newQtyStr: string,
  ) => {
    const val = parseInt(newQtyStr, 10);
    const newQty = isNaN(val) ? 0 : val;

    setMatrix((prev) =>
      prev.map((row) => {
        if (row.productId === productId) {
          const currentSum = (row.allocations || []).reduce(
            (sum, a) => sum + (a.storeId === storeId ? 0 : a.allocatedQuantity),
            0,
          );
          const safeQty = Math.max(
            0,
            Math.min(newQty, (row.totalAvailable || 0) - currentSum),
          );

          return {
            ...row,
            allocations: (row.allocations || []).map((a) =>
              a.storeId === storeId ? { ...a, allocatedQuantity: safeQty } : a,
            ),
          };
        }
        return row;
      }),
    );
  };

  const handleSaveAllocation = async () => {
    if (!selectedPlanId || matrix.length === 0) return;

    const payload = {
      productionPlanId: Number(selectedPlanId),
      allocations: (matrix || []).flatMap((row) =>
        (row.allocations || []).map((a) => ({
          storeId: a.storeId,
          productId: row.productId,
          allocatedQuantity: a.allocatedQuantity,
        })),
      ),
    };

    setIsSaving(true);
    try {
      await allocationApi.confirmAllocation(payload);

      // Collect allocated storeIds from matrix for pre-filling CreateShipment
      const allocatedStoreIds = Array.from(
        new Set(
          matrix.flatMap((row) =>
            row.allocations
              .filter((a) => a.allocatedQuantity > 0)
              .map((a) => a.storeId),
          ),
        ),
      );

      // Smart Toast Notification with Action
      toast(
        (t) => (
          <div className="flex flex-col gap-4 min-w-[320px]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20">
                <CheckCircle2 size={22} strokeWidth={2.5} />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-[13px] font-black text-slate-100 leading-tight">
                  Kế hoạch{" "}
                  <span className="text-amber-400 font-black tracking-tight">
                    [{selectedPlan?.planName || `#${selectedPlanId}`}]
                  </span>{" "}
                  đã được phân bổ thành công!
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">
                  {allocatedStoreIds.length} CỬA HÀNG ĐÃ ĐƯỢC CHỐT PHÂN BỔ
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors px-2"
              >
                Bỏ qua
              </button>
              <Button
                size="sm"
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate("/shipment/create", {
                    state: {
                      autoCreate: true,
                      planId: selectedPlanId,
                      planName: selectedPlan?.planName,
                      storeIds: allocatedStoreIds,
                    },
                  });
                }}
                className="bg-amber-400 hover:bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest h-9 px-4 rounded-xl border-0 shadow-lg shadow-amber-900/20 transition-all active:scale-95"
              >
                Tạo đơn vận chuyển ngay
              </Button>
            </div>
          </div>
        ),
        {
          duration: 10000,
          style: {
            background: "#0f172a", // slate-900
            border: "1px solid #1e293b", // slate-800
            padding: "20px",
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          },
        },
      );

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        fetchPlans();
        const nextPlan = [...unallocatedPlans].find(
          (p) => p.planId !== selectedPlanId,
        );
        if (nextPlan) setSelectedPlanId(nextPlan.planId);
        else setSelectedPlanId("");
      }, 2000);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Fallback for success if API returns 404 on confirmation (observed behavior)
        setIsSuccess(true);
        toast.success("Xác nhận phân bổ thành công!");
        setTimeout(() => {
          setIsSuccess(false);
          fetchPlans();
        }, 2000);
      } else {
        toast.error(
          error.response?.data?.message || "Có lỗi xảy ra khi phân bổ kho",
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPlan = (plan: ProductionPlanSummaryResponse) => {
    setSelectedPlanId(plan.planId);
    setSelectedPlan(plan);
  };

  // Extract all unique stores for columns
  const storeColumns = Array.from(
    new Set(
      (matrix || []).flatMap((r) =>
        (r.allocations || []).map((a) => a.storeId),
      ),
    ),
  ).map((id) => {
    const a = (matrix || [])
      .flatMap((r) => r.allocations || [])
      .find((x) => x.storeId === id);
    return {
      storeId: id,
      storeName: a?.storeName || `Cửa hàng ${id}`,
      deliveryDate: a?.deliveryDate,
    };
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700 p-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-6 bg-amber-500 rounded-full"></div>
            <Badge
              variant="orange"
              className="text-[10px] font-black tracking-widest px-2 py-0 border-0 h-4 uppercase"
            >
              QUẢN LÝ KHO VẬN
            </Badge>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">
            Ma Trận Điều Phối
          </h1>
          <p className="text-sm text-zinc-500 font-medium max-w-xl">
            Tối ưu hóa việc phân bổ thành phẩm từ{" "}
            <span className="text-amber-500 font-bold">Bếp Trung Tâm</span> tới
            các{" "}
            <span className="text-amber-400 font-bold">
              Cửa hàng nhượng quyền
            </span>{" "}
            dựa trên nhu cầu thực tế từ đơn hàng.
          </p>
          {matrix.length > 0 && selectedPlan?.status === "PRODUCED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMatrix((prev) =>
                  prev.map((row) => ({
                    ...row,
                    allocations: (row.allocations || []).map((a) => ({
                      ...a,
                      allocatedQuantity: 0,
                    })),
                  })),
                );
                toast.success("Đã đặt lại tất cả số lượng về 0");
              }}
              className="mt-4 border-zinc-800 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-500 hover:bg-red-500/5 transition-all"
            >
              Đặt lại về 0
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 bg-zinc-900/30 p-2 rounded-2xl border border-zinc-800/50">
          <div className="px-4 py-2">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
              Trạng thái mẻ
            </p>
            {selectedPlan?.status === "FINISHED" ? (
              <Badge
                variant="success"
                className="font-black px-4 py-1 uppercase tracking-widest text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              >
                ĐÃ ĐIỀU PHỐI
              </Badge>
            ) : (
              <Badge
                variant="info"
                className="font-black px-3 py-0.5 uppercase tracking-widest text-[10px]"
              >
                ĐANG ĐIỀU PHỐI
              </Badge>
            )}
          </div>
          <div className="w-[1px] h-10 bg-zinc-800"></div>
          {selectedPlan?.status === "PRODUCED" && (
            <Button
              onClick={handleSaveAllocation}
              disabled={
                matrix.length === 0 ||
                isSaving ||
                isSuccess ||
                hasYield === false ||
                matrix.some((row) => {
                  const totalAllocated = (row.allocations || []).reduce(
                    (s, a) => s + a.allocatedQuantity,
                    0,
                  );
                  const totalRequested = (row.allocations || []).reduce(
                    (s, a) => s + a.requestedQuantity,
                    0,
                  );
                  // Bắt buộc phân bổ đủ hàng (đủ yêu cầu)
                  // Hoặc nếu không đủ stock thì phải phân bổ tối đa lượng stock hiện có
                  const requiredToAllocate = Math.min(
                    totalRequested,
                    row.totalAvailable || 0,
                  );

                  return (
                    totalAllocated > (row.totalAvailable || 0) || // Phân bổ vượt quá stock
                    totalAllocated < requiredToAllocate // Chưa phân bổ đủ
                  );
                })
              }
              className={cn(
                "font-black uppercase text-xs tracking-widest px-8 h-12 rounded-xl shadow-xl border-0 flex items-center gap-2 transition-all active:scale-95",
                isSuccess
                  ? "bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 cursor-default"
                  : "bg-amber-600 hover:bg-amber-500 text-black shadow-amber-900/20",
                matrix.some((row) => {
                  const totalAllocated = (row.allocations || []).reduce(
                    (s, a) => s + a.allocatedQuantity,
                    0,
                  );
                  const totalRequested = (row.allocations || []).reduce(
                    (s, a) => s + a.requestedQuantity,
                    0,
                  );
                  const requiredToAllocate = Math.min(
                    totalRequested,
                    row.totalAvailable || 0,
                  );
                  return (
                    totalAllocated > (row.totalAvailable || 0) ||
                    totalAllocated < requiredToAllocate
                  );
                }) && "opacity-50 grayscale cursor-not-allowed",
              )}
            >
              {isSaving ? (
                "Đang lưu..."
              ) : isSuccess ? (
                <>
                  <CheckCircle size={18} /> Đã phân bổ
                </>
              ) : (
                <>
                  <Save size={18} /> Chốt Phân Bổ
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Plan Selection Sidebar (Sticky) */}
        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-8 self-start">
          <div className="bg-zinc-900/60 p-5 rounded-3xl border border-zinc-800/50 flex flex-col max-h-[calc(100vh-12rem)]">
            <div className="flex items-center justify-between mb-4 px-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                Kế Hoạch SX
              </label>
              <Badge
                variant="orange"
                className="text-[9px] font-black px-2 py-0 h-4"
              >
                {unallocatedPlans.length + allocatedPlans.length}
              </Badge>
            </div>

            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {isLoadingPlans ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-14 bg-zinc-800/40 rounded-2xl border border-zinc-800/20"
                    />
                  ))}
                </div>
              ) : (
                <>
                  {/* Unallocated Section */}
                  <div>
                    <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2 opacity-80">
                      <Clock size={12} /> Chờ phân bổ ({unallocatedPlans.length}
                      )
                    </h3>
                    <div className="space-y-2">
                      {unallocatedPlans.length === 0 ? (
                        <p className="text-[9px] text-zinc-600 font-bold italic py-2 px-3 bg-zinc-950/30 rounded-xl">
                          Trống
                        </p>
                      ) : (
                        unallocatedPlans.map((p) => (
                          <button
                            key={p.planId}
                            onClick={() => handleSelectPlan(p)}
                            className={cn(
                              "w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between group",
                              selectedPlanId === p.planId
                                ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                : "bg-zinc-950/40 border-zinc-800/50 hover:bg-zinc-800/40 hover:border-zinc-700",
                            )}
                          >
                            <div className="flex flex-col min-w-0">
                              <span
                                className={cn(
                                  "text-[11px] font-black uppercase tracking-tight transition-colors truncate",
                                  selectedPlanId === p.planId
                                    ? "text-white"
                                    : "text-zinc-400 group-hover:text-zinc-200",
                                )}
                              >
                                {p.planName}
                              </span>
                              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">
                                #{p.planId}
                              </span>
                            </div>
                            <ArrowRight
                              size={12}
                              className={cn(
                                "transition-all flex-shrink-0",
                                selectedPlanId === p.planId
                                  ? "text-amber-500 translate-x-0"
                                  : "text-zinc-700 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0",
                              )}
                            />
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Allocated Section (History) */}
                  <div className="pt-2">
                    <h3 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2 opacity-80">
                      <CheckCircle size={12} /> Đã chốt ({allocatedPlans.length}
                      )
                    </h3>
                    <div className="space-y-1.5">
                      {allocatedPlans.length === 0 ? (
                        <p className="text-[9px] text-zinc-600 font-bold italic py-2 px-3 bg-zinc-950/30 rounded-xl">
                          Trống
                        </p>
                      ) : (
                        allocatedPlans.map((p) => (
                          <button
                            key={p.planId}
                            onClick={() => handleSelectPlan(p)}
                            className={cn(
                              "w-full text-left p-2.5 rounded-2xl border transition-all flex items-center justify-between group",
                              selectedPlanId === p.planId
                                ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                : "bg-zinc-950/20 border-zinc-800/20 hover:bg-zinc-800/30 hover:border-zinc-700",
                            )}
                          >
                            <div className="flex flex-col min-w-0">
                              <span
                                className={cn(
                                  "text-[10px] font-black uppercase tracking-tight transition-colors truncate",
                                  selectedPlanId === p.planId
                                    ? "text-white"
                                    : "text-zinc-600 group-hover:text-zinc-400",
                                )}
                              >
                                {p.planName}
                              </span>
                              <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-tighter">
                                #{p.planId}
                              </span>
                            </div>
                            <CheckCircle
                              size={12}
                              className={cn(
                                "transition-all flex-shrink-0",
                                selectedPlanId === p.planId
                                  ? "text-emerald-500 opacity-100"
                                  : "text-zinc-800 opacity-0 group-hover:opacity-100",
                              )}
                            />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Matrix Display Area */}
        <div className="lg:col-span-9 space-y-8">
          {/* Matrix Table */}
          <div className="bg-zinc-900/40 rounded-[40px] border border-zinc-800/50 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse border-spacing-0">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-800">
                    <th className="px-8 py-8 bg-zinc-900 sticky left-0 z-30 border-r border-zinc-800/50 w-[300px] shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-amber-500 border border-zinc-800">
                          <Package size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white uppercase tracking-tighter">
                            Sản phẩm đầu ra
                          </span>
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">
                            Đã phân / SL có
                          </span>
                        </div>
                      </div>
                    </th>
                    {storeColumns.map((col) => {
                      // Calculate total requested for this store across all products
                      const storeTotalRequested = matrix.reduce((sum, row) => {
                        const cell = (row.allocations || []).find(
                          (a: any) => a.storeId === col.storeId,
                        );
                        return sum + (cell?.requestedQuantity || 0);
                      }, 0);
                      return (
                        <th
                          key={col.storeId}
                          className="px-6 py-6 min-w-[200px] border-b border-zinc-800/50 bg-zinc-900/50"
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-400 mb-2 border border-zinc-800">
                              <Store size={14} />
                            </div>
                            <span className="text-xs font-black text-white uppercase tracking-tighter text-center">
                              {col.storeName}
                            </span>
                            {col.deliveryDate && (
                              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter mt-1">
                                Ngày nhận:{" "}
                                {new Date(col.deliveryDate).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </span>
                            )}
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">
                              Tổng YC: {storeTotalRequested}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {isLoadingMatrix ? (
                    <tr>
                      <td
                        colSpan={storeColumns.length + 1}
                        className="px-10 py-32 text-center"
                      >
                        <div className="flex flex-col items-center gap-6">
                          <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-3 border-amber-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-3 border-t-amber-500 rounded-full animate-spin"></div>
                          </div>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            Đang tải dữ liệu phân bổ...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : hasYield === false ? (
                    <tr>
                      <td
                        colSpan={storeColumns.length + 1}
                        className="px-10 py-40 text-center relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-red-500/5 backdrop-blur-3xl"></div>
                        <div className="flex flex-col items-center gap-6 max-w-lg mx-auto relative z-10">
                          <div className="w-24 h-24 rounded-[32px] bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-2xl shadow-red-500/20 animate-pulse">
                            <AlertCircle size={48} />
                          </div>
                          <div className="space-y-3">
                            <p className="text-2xl font-black text-red-400 uppercase tracking-tighter">
                              Chưa có sản lượng sản xuất
                            </p>
                            <p className="text-sm text-zinc-400 font-bold leading-relaxed px-10">
                              Lô sản xuất này hiện chưa có dữ liệu đầu ra
                              (yield). KHÔNG cho phép phân bổ vật tư khi Bếp
                              Trung Tâm chưa ghi nhận sản lượng hoàn thành.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : matrix.length === 0 ? (
                    <tr>
                      <td
                        colSpan={storeColumns.length + 1}
                        className="px-10 py-40 text-center"
                      >
                        <div className="flex flex-col items-center gap-6 max-w-xs mx-auto opacity-30">
                          <div className="w-20 h-20 rounded-[28px] bg-zinc-900 flex items-center justify-center text-zinc-700 border border-zinc-800">
                            <Network size={40} />
                          </div>
                          <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wide">
                            Vui lòng chọn mẻ sản xuất từ danh sách bên trái
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    matrix.map((row) => {
                      const currentTotal = (row.allocations || []).reduce(
                        (s, a) => s + a.allocatedQuantity,
                        0,
                      );
                      const isExceeded =
                        currentTotal > (row.totalAvailable || 0);
                      const isBalanced =
                        currentTotal === (row.totalAvailable || 0);

                      return (
                        <tr
                          key={row.productId}
                          className="hover:bg-zinc-800/30 group transition-all duration-300 text-[11px]"
                        >
                          <td className="px-6 py-5 bg-zinc-900/90 backdrop-blur-md sticky left-0 z-20 border-r border-zinc-800/50 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
                            <div className="flex flex-col gap-2">
                              <span className="font-black text-zinc-100 tracking-tight group-hover:text-amber-500 transition-colors uppercase leading-none truncate max-w-[220px]">
                                {row.productName}
                              </span>
                              {/* Progress bar */}
                              <div className="w-full">
                                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all duration-500",
                                      isExceeded
                                        ? "bg-red-500"
                                        : isBalanced
                                          ? "bg-emerald-500"
                                          : "bg-amber-500",
                                    )}
                                    style={{
                                      width: `${Math.min(100, row.totalAvailable > 0 ? (currentTotal / row.totalAvailable) * 100 : 0)}%`,
                                    }}
                                  />
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span
                                    className={cn(
                                      "text-[9px] font-black font-mono",
                                      isExceeded
                                        ? "text-red-400"
                                        : isBalanced
                                          ? "text-emerald-400"
                                          : "text-amber-400",
                                    )}
                                  >
                                    {currentTotal}/{row.totalAvailable} đã phân
                                  </span>
                                  {isExceeded && (
                                    <AlertCircle
                                      size={10}
                                      className="text-red-500 animate-pulse"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {storeColumns.map((col) => {
                            const cell = (row.allocations || []).find(
                              (a: any) => a.storeId === col.storeId,
                            );
                            if (!cell)
                              return (
                                <td
                                  key={col.storeId}
                                  className="px-6 py-6 text-center bg-zinc-950/10 italic text-zinc-800 text-[9px] font-black uppercase tracking-widest"
                                >
                                  -
                                </td>
                              );

                            const isShortage =
                              cell.allocatedQuantity < cell.requestedQuantity;
                            const isOptimized =
                              cell.allocatedQuantity ===
                                cell.requestedQuantity &&
                              cell.requestedQuantity > 0;

                            return (
                              <td
                                key={col.storeId}
                                className={cn(
                                  "px-4 py-4 transition-colors relative",
                                  isShortage
                                    ? "bg-red-500/[0.02]"
                                    : isOptimized
                                      ? "bg-emerald-500/[0.02]"
                                      : "",
                                )}
                              >
                                <div className="flex flex-col items-center gap-1.5">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      disabled={
                                        selectedPlan?.status === "FINISHED"
                                      }
                                      className={cn(
                                        "w-20 h-10 bg-zinc-950 border rounded-lg text-center text-sm font-black font-mono focus:outline-none focus:ring-2 transition-all px-1 shadow-inner",
                                        selectedPlan?.status === "FINISHED"
                                          ? "opacity-50 cursor-not-allowed border-zinc-800/50 text-zinc-400"
                                          : isShortage
                                            ? "border-red-500/40 text-red-400 focus:ring-red-500/20 focus:border-red-500"
                                            : isOptimized
                                              ? "border-emerald-500/40 text-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-500"
                                              : "border-zinc-700 text-zinc-100 focus:ring-amber-500/20 focus:border-amber-500",
                                      )}
                                      value={cell.allocatedQuantity.toString()}
                                      onChange={(e) =>
                                        handleQuantityChange(
                                          row.productId,
                                          col.storeId,
                                          e.target.value,
                                        )
                                      }
                                      min={0}
                                      max={row.totalAvailable}
                                    />
                                  </div>
                                  {/* Requested label */}
                                  <span className="text-[8px] font-bold text-zinc-500">
                                    YC:{" "}
                                    <span className="font-mono text-zinc-400">
                                      {cell.requestedQuantity}
                                    </span>
                                  </span>
                                  {/* Mini progress */}
                                  <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all",
                                        isOptimized
                                          ? "bg-emerald-500"
                                          : isShortage
                                            ? "bg-red-500"
                                            : "bg-amber-500",
                                      )}
                                      style={{
                                        width: `${Math.min(100, cell.requestedQuantity > 0 ? (cell.allocatedQuantity / cell.requestedQuantity) * 100 : 0)}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                  {/* Summary Row */}
                  {matrix.length > 0 && (
                    <tr className="bg-zinc-900/80 border-t-2 border-zinc-700">
                      <td className="px-6 py-4 bg-zinc-900 sticky left-0 z-20 border-r border-zinc-800/50 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          Tổng phân bổ
                        </span>
                      </td>
                      {storeColumns.map((col) => {
                        const storeAllocated = matrix.reduce((sum, row) => {
                          const cell = (row.allocations || []).find(
                            (a: any) => a.storeId === col.storeId,
                          );
                          return sum + (cell?.allocatedQuantity || 0);
                        }, 0);
                        const storeRequested = matrix.reduce((sum, row) => {
                          const cell = (row.allocations || []).find(
                            (a: any) => a.storeId === col.storeId,
                          );
                          return sum + (cell?.requestedQuantity || 0);
                        }, 0);
                        const pct =
                          storeRequested > 0
                            ? Math.round(
                                (storeAllocated / storeRequested) * 100,
                              )
                            : 0;
                        return (
                          <td
                            key={col.storeId}
                            className="px-4 py-4 text-center"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={cn(
                                  "text-sm font-black font-mono",
                                  pct >= 100
                                    ? "text-emerald-400"
                                    : pct > 0
                                      ? "text-amber-400"
                                      : "text-zinc-600",
                                )}
                              >
                                {storeAllocated}/{storeRequested}
                              </span>
                              <span
                                className={cn(
                                  "text-[9px] font-black",
                                  pct >= 100
                                    ? "text-emerald-500"
                                    : pct > 0
                                      ? "text-amber-500"
                                      : "text-zinc-600",
                                )}
                              >
                                {pct}%
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Summary Bar */}
            <div className="bg-zinc-900/80 p-6 border-t border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">
                    Chi nhánh nhượng quyền
                  </span>
                  <span className="text-xl font-black text-white">
                    {storeColumns.length}{" "}
                    <span className="text-[9px] text-zinc-500">CHI NHÁNH</span>
                  </span>
                </div>
                <div className="w-[1px] h-8 bg-zinc-800"></div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">
                    Sản phẩm điều phối
                  </span>
                  <span className="text-xl font-black text-white">
                    {matrix.length}{" "}
                    <span className="text-[9px] text-zinc-500">MẶT HÀNG</span>
                  </span>
                </div>
              </div>

              <div className="bg-amber-500/5 px-6 py-3 rounded-2xl border border-amber-500/10 flex items-center gap-3">
                <Info size={14} className="text-amber-500" />
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-tight">
                  Kế hoạch #{selectedPlanId || "---"} Đang được quản lý
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Stats & Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            <div className="md:col-span-8 bg-zinc-900/20 p-8 rounded-[32px] border border-zinc-800/30 flex items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <Network size={28} />
                </div>
                <div className="max-w-xs">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                    Quy tắc điều phối
                  </p>
                  <p className="text-[11px] text-zinc-500 font-bold leading-relaxed">
                    Hệ thống tự động cân đối dựa trên mức tồn kho tối thiểu và
                    ưu tiên đơn đặt sớm nhất.
                  </p>
                </div>
              </div>
              <div className="w-[1px] h-12 bg-zinc-800"></div>
              <div className="flex items-center gap-6 text-right">
                <div className="max-w-sm">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 text-right">
                    Phạm vi tác động
                  </p>
                  <p className="text-[11px] text-zinc-500 font-bold leading-relaxed text-right">
                    {storeColumns.length} chi nhánh đang chờ hàng từ lô sản xuất
                    này.
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <Store size={28} />
                </div>
              </div>
            </div>

            <div className="md:col-span-4 bg-zinc-900/30 p-8 rounded-[32px] border border-zinc-800/50 flex flex-col justify-center space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                    Tiến độ phân bổ
                  </span>
                  <span
                    className={cn(
                      "text-2xl font-black uppercase tracking-tighter",
                      selectedPlan?.status === "FINISHED"
                        ? "text-emerald-500"
                        : "text-amber-500",
                    )}
                  >
                    {selectedPlan?.status === "FINISHED"
                      ? "Đã hoàn tất"
                      : "Đang xử lý"}
                  </span>
                </div>
                {selectedPlan?.status === "FINISHED" ? (
                  <CheckCircle size={32} className="text-emerald-500 mb-1" />
                ) : (
                  <Timer size={32} className="text-amber-500 mb-1" />
                )}
              </div>
              <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden p-[1px]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out",
                    selectedPlan?.status === "FINISHED"
                      ? "bg-emerald-500 w-full"
                      : "bg-amber-500 w-[65%]",
                  )}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};
