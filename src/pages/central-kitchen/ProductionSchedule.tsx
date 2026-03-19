import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Ban,
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  Database,
  Info,
  Timer,
  ArrowRight,
  X,
  Printer,
  ClipboardList,
  MapPin,
  Package,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { Drawer } from "../../components/ui/Drawer";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { productionPlanApi } from "../../services/productionPlan.api";
import { kitchenInventoryApi } from "../../services/kitchenInventory.api";
import { allocationApi, type AllocationRow } from "../../services/allocationApi";
import type {
  ProductionPlanSummaryResponse,
  ProductionPlanDetailResponse,
} from "../../types/productionPlan";
import toast from "react-hot-toast";
import { cn } from "../../utils/classNames";

export const ProductionSchedule = () => {
  const { user, hasAuthority } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<ProductionPlanSummaryResponse[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<
    ProductionPlanSummaryResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "completed">(
    "list",
  );

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedPlanDetail, setSelectedPlanDetail] =
    useState<ProductionPlanDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Yield reporting modal
  const [showYieldModal, setShowYieldModal] = useState(false);
  const [finishingPlanId, setFinishingPlanId] = useState<number | null>(null);
  const [finishingPlanVersion, setFinishingPlanVersion] = useState<
    number | undefined
  >();
  const [actualQuantities, setActualQuantities] = useState<Record<number, number>>({});

  // Fetch kitchen stock whenever detail panel opens
  const [materialStockMap, setMaterialStockMap] = useState<Map<string, number>>(
    new Map(),
  );
  const [materialUnitsMap, setMaterialUnitsMap] = useState<Map<number, string>>(
    new Map(),
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [planToCancel, setPlanToCancel] = useState<{
    id: number;
    version?: number;
  } | null>(null);

  const handleCreateTask = () => {
    navigate("/kitchen/create-plan");
  };

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      loadPlanDetail(selectedPlanId);
    } else {
      setSelectedPlanDetail(null);
    }
  }, [selectedPlanId]);

  // Fetch kitchen stock whenever detail panel opens
  useEffect(() => {
    if (!selectedPlanId) {
      setMaterialStockMap(new Map());
      return;
    }
    const fetchStock = async () => {
      const warehouseId = selectedPlanDetail?.kitchenId || user?.kitchenId || 1;
      const stockMap = new Map<string, number>();

      try {
        const res = await kitchenInventoryApi
          .getWarehouseStock(warehouseId)
          .catch(() => ({ data: [] }));

        const items = res.data || [];
        for (const item of items) {
          // Map by name (lowercase) for fuzzy matching
          const nameKey = item.itemName?.toLowerCase().trim();
          if (nameKey) {
            stockMap.set(nameKey, (stockMap.get(nameKey) || 0) + item.quantity);
          }
          // Map by material ID for precise matching
          if (item.itemType === "MATERIAL") {
            const idKey = `id-${item.itemId}`;
            stockMap.set(idKey, (stockMap.get(idKey) || 0) + item.quantity);
            
            // ENHANCEMENT: Populate unit map from stock
            if (item.unit) {
              setMaterialUnitsMap(prev => {
                const newMap = new Map(prev);
                newMap.set(item.itemId, item.unit);
                return newMap;
              });
            }
          }
        }
      } catch (e) {
        console.error("Failed to load kitchen stock for plan detail", e);
      }

      setMaterialStockMap(stockMap);
    };
    fetchStock();
  }, [selectedPlanId, selectedPlanDetail?.kitchenId, user?.kitchenId, selectedPlanDetail?.materials]);

  useEffect(() => {
    let result = plans;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.planName?.toLowerCase().includes(lowerQuery) ||
          p.batchCode?.toLowerCase().includes(lowerQuery) ||
          String(p.planId).includes(lowerQuery),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (p) => p.status?.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    setFilteredPlans(result);
  }, [plans, searchQuery, statusFilter]);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const response = await productionPlanApi.getAllProductionPlans({
        size: 100,
      });
      const data = response.content || [];
      setPlans(data.sort((a, b) => b.planId - a.planId));
    } catch (error) {
      console.error("Failed to load plans:", error);
      toast.error("Không thể tải kế hoạch sản xuất");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlanDetail = async (id: number) => {
    setIsDetailLoading(true);
    try {
      const detail = await productionPlanApi.getProductionPlanDetail(id);

      // ENHANCEMENT: Fetch the "most accurate" materials from allocation preview
      try {
        const preview = await allocationApi.previewAllocation(id);
        if (preview.materials && preview.materials.length > 0) {
          // Preserve units since preview materials might not have them
          const existingUnits = new Map<number, string>();
          detail.materials?.forEach(m => {
            if (m.materialId && m.unit) existingUnits.set(m.materialId, m.unit);
          });

          detail.materials = preview.materials.map(m => ({
            ...m,
            unit: m.unit || existingUnits.get(m.materialId)
          }));
        }
      } catch (e) {
        console.warn("Could not fetch accurate materials preview", e);
      }

      // Store units map to state for reactive updates
      const unitsMap = new Map<number, string>();
      detail.materials?.forEach((m: any) => {
        if (m.materialId && m.unit) {
          unitsMap.set(m.materialId, m.unit);
        }
      });
      setMaterialUnitsMap(unitsMap);

      setSelectedPlanDetail(detail);
    } catch (error) {
      console.error("Failed to load plan detail:", error);
      toast.error("Không thể tải chi tiết kế hoạch");
      setSelectedPlanId(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!planToCancel) return;
    setIsCancelling(true);
    try {
      await productionPlanApi.cancelProductionPlan(
        planToCancel.id,
        planToCancel.version,
        true,
      );
      toast.success("Cập nhật trạng thái thành công");
      setIsCancelModalOpen(false);
      loadPlans();
      if (selectedPlanId === planToCancel.id) {
        loadPlanDetail(planToCancel.id);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to cancel plan";
      toast.error(msg);
    } finally {
      setIsCancelling(false);
      setPlanToCancel(null);
    }
  };

  const handleStatusAction = async (
    action: "ready" | "start" | "finish" | "cancel",
    planIdOverride?: number,
    versionOverride?: number,
  ) => {
    const id = planIdOverride || selectedPlanDetail?.planId;
    const version =
      versionOverride !== undefined
        ? versionOverride
        : selectedPlanDetail?.version;

    if (!id) return;

    if (action === "cancel") {
      setPlanToCancel({ id, version });
      setIsCancelModalOpen(true);
      return;
    }

    try {
      switch (action) {
        case "ready":
          await productionPlanApi.readyProductionPlan(id);
          break;
        case "start":
          await productionPlanApi.startProductionPlan(id, version);
          break;
        case "finish":
          setIsDetailLoading(true);
          try {
            // Step 1: Fetch basic plan details
            const detail = await productionPlanApi.getProductionPlanDetail(id);

            // Step 2: Fetch allocation preview to get the list of products
            // This requires 'ORGANIZE_PRODUCTION' privilege which we just granted to KITCHEN_STAFF
            let displayItems: any[] = [];
            try {
              const { rows: allocationRows } = await allocationApi.previewAllocation(id);

              // Map AllocationRow to ProductionPlanDetailItem format
              // Use units from detail.items if available
              displayItems = allocationRows.map((row: AllocationRow) => {
                const originalItem = (detail.items || []).find((it: any) => it.productId === row.productId);
                return {
                  productId: row.productId,
                  productName: row.productName,
                  plannedQuantity: (row.allocations || []).reduce((sum: number, alloc: any) => sum + (alloc.requestedQuantity || 0), 0),
                  unit: originalItem?.unit || ""
                };
              });
            } catch (allocError) {
              console.error("Failed to fetch allocation preview:", allocError);
              // Fallback to detail.items if allocation preview fails
              displayItems = detail.items || [];
            }

            // Update local state for modal
            setSelectedPlanDetail({
              ...detail,
              items: displayItems
            });

            setFinishingPlanId(id);
            setFinishingPlanVersion(version);

            // Pre-populate actualQuantities logic
            const initQs: Record<number, number> = {};
            displayItems.forEach((item) => {
              initQs[item.productId] = item.plannedQuantity;
            });
            setActualQuantities(initQs);

            setShowYieldModal(true);
          } catch (err: any) {
            console.error("Error preparing yield modal:", err);
            const msg = err.response?.status === 403
              ? "Bạn không có quyền thực hiện thao tác này."
              : "Không thể tải thông tin sản phẩm để nghiệm thu";
            toast.error(msg);
          } finally {
            setIsDetailLoading(false);
          }
          return;
      }
      toast.success("Cập nhật trạng thái thành công");
      loadPlans();
      if (selectedPlanId === id) {
        loadPlanDetail(id);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || `Failed to ${action} plan`;
      toast.error(msg);
    }
  };

  const handleConfirmFinish = async () => {
    if (!finishingPlanId) return;
    setIsDetailLoading(true);
    try {
      const outputs = Object.entries(actualQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([productIdStr, qty]) => ({
          productId: parseInt(productIdStr, 10),
          actualQty: qty
        }));

      if (outputs.length === 0) {
        toast.error("Vui lòng nhập ít nhất 1 sản lượng hợp lệ.");
        setIsDetailLoading(false);
        return;
      }

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
      if (selectedPlanId === finishingPlanId) {
        loadPlanDetail(finishingPlanId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi hoàn tất sản xuất");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || "UNKNOWN";
    const config: Record<string, { variant: any; label: string; icon: any }> = {
      DRAFT: { variant: "orange", label: "NHÁP", icon: Clock },
      PLANNED: { variant: "orange", label: "LÊN KẾ HOẠCH", icon: Clock },
      READY_TO_PRODUCE: {
        variant: "info",
        label: "SẴN SÀNG",
        icon: CheckSquare,
      },
      IN_PRODUCTION: {
        variant: "primary",
        label: "ĐANG NẤU",
        icon: PlayCircle,
      },
      COMPLETED: { variant: "success", label: "HOÀN TẤT", icon: CheckCircle },
      FINISHED: { variant: "success", label: "HOÀN TẤT", icon: CheckCircle },
      CANCELLED: { variant: "danger", label: "ĐÃ HỦY", icon: Ban },
    };
    const item = config[s] || { variant: "default", label: s, icon: Info };
    const Icon = item.icon;

    return (
      <Badge
        variant={item.variant}
        className="px-3 py-1 font-black text-[10px] tracking-widest uppercase border-0 flex items-center gap-1.5 h-6"
      >
        <Icon size={10} strokeWidth={3} />
        {item.label}
      </Badge>
    );
  };

  const columns: Column<ProductionPlanSummaryResponse>[] = [
    {
      header: "Mã Kế Hoạch",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-black text-amber-500 tracking-tighter">
            #{row.planId}
          </span>
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
            Ref: {row.batchCode}
          </span>
        </div>
      ),
    },
    {
      header: "Tên Kế Hoạch",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
            <ClipboardList size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-black text-zinc-200 tracking-tight uppercase">
              {row.planName || "N/A"}
            </span>
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">
              Kitchen: {row.kitchenId || "Central"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Trạng Thái",
      cell: (row) => getStatusBadge(row.status),
    },
    {
      header: "Ngày Tạo",
      cell: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <CalendarIcon size={12} className="text-zinc-500" />
            <span className="text-[11px] font-bold text-zinc-400 tracking-tight">
              {row.createdAt
                ? new Date(row.createdAt).toLocaleDateString("vi-VN")
                : "-"}
            </span>
          </div>
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-1 italic">
            {row.createdAt
              ? new Date(row.createdAt).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })
              : ""}
          </span>
        </div>
      ),
    },
    {
      header: "Thao Tác",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end pr-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPlanId(row.planId)}
            className="h-10 w-10 p-0 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/5 transition-all group"
          >
            <Search
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
          </Button>
        </div>
      ),
    },
  ];

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = (y: number, m: number) =>
      new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="min-h-[140px] border-b border-r border-zinc-800/10 bg-transparent"
        />,
      );
    }

    for (let day = 1; day <= daysInMonth(year, month); day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayPlans = plans.filter((p) => p.createdAt?.startsWith(dateStr));
      const isToday = new Date().toISOString().split("T")[0] === dateStr;

      days.push(
        <div
          key={day}
          className={cn(
            "min-h-[140px] border-b border-r border-zinc-800/10 p-4 transition-all hover:bg-zinc-800/5 group relative",
            isToday && "bg-amber-500/[0.02]",
          )}
        >
          <div className="flex justify-between items-start mb-4">
            <span
              className={cn(
                "text-xs font-black transition-all",
                isToday
                  ? "text-amber-500"
                  : "text-zinc-600 group-hover:text-zinc-400",
              )}
            >
              {String(day).padStart(2, "0")}
            </span>
            {dayPlans.length > 0 && (
              <Badge
                variant="default"
                className="bg-zinc-900 border-zinc-800 text-zinc-500 text-[8px] h-4 px-1"
              >
                {dayPlans.length}
              </Badge>
            )}
          </div>

          <div className="flex-1 space-y-1 overscroll-none overflow-y-auto no-scrollbar">
            {dayPlans.map((plan) => (
              <button
                key={plan.planId}
                onClick={() => setSelectedPlanId(plan.planId)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter truncate transition-all border border-transparent shadow-sm",
                  plan.status === "COMPLETED"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : plan.status === "IN_PRODUCTION"
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      : plan.status === "CANCELLED"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-zinc-800 text-zinc-400",
                )}
              >
                {plan.planName}
              </button>
            ))}
          </div>
        </div>,
      );
    }

    return (
      <div className="bg-zinc-900/40 rounded-[40px] border border-zinc-800/50 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="p-8 border-b border-zinc-800/50 flex flex-col md:flex-row justify-between items-center bg-zinc-900/20">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black text-zinc-200 uppercase tracking-tighter">
              {currentDate.toLocaleString("vi-VN", { month: "long" })}{" "}
              <span className="text-zinc-500 ml-1">{year}</span>
            </h2>
            <div className="flex items-center bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date(year, month - 1))}
                className="h-10 w-10 p-0 rounded-xl text-zinc-500 hover:text-white"
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-amber-500"
              >
                Hôm nay
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date(year, month + 1))}
                className="h-10 w-10 p-0 rounded-xl text-zinc-500 hover:text-white"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-7 bg-zinc-900/10">
          {["C.Nhật", "T.Hai", "T.Ba", "T.Tư", "T.Năm", "T.Sáu", "T.Bảy"].map(
            (day) => (
              <div
                key={day}
                className="py-4 text-center text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-zinc-800/50"
              >
                {day}
              </div>
            ),
          )}
          {days}
        </div>
      </div>
    );
  };

  const renderCompletedView = () => {
    const inProgressPlans = plans.filter((p) => p.status === "IN_PRODUCTION");
    const completedPlans = plans.filter(
      (p) => p.status === "COMPLETED" || p.status === "FINISHED",
    );

    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        {/* Active Production Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between ml-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">
                Sản xuất đang diễn ra
              </h3>
            </div>
            <Badge variant="orange" className="font-black text-[10px] border-0">
              {inProgressPlans.length} Kế hoạch
            </Badge>
          </div>

          {inProgressPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressPlans.map((plan) => (
                <div
                  key={plan.planId}
                  className="bg-zinc-900/40 p-6 rounded-[32px] border border-amber-500/20 shadow-lg shadow-amber-900/5 hover:border-amber-500/40 transition-all group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] blur-3xl"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex flex-col">
                      <h4 className="font-black text-zinc-100 uppercase tracking-tight text-[15px]">
                        {plan.planName}
                      </h4>
                      <p className="text-[10px] font-bold text-zinc-600 font-mono mt-0.5 tracking-tighter">
                        ID: #{plan.planId} | Batch: {plan.batchCode}
                      </p>
                    </div>
                    {getStatusBadge(plan.status)}
                  </div>

                  <div className="bg-zinc-950/50 p-4 rounded-2xl mb-6 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2">
                      <Timer size={14} className="text-amber-500/50" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase">
                        Khởi động:
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-zinc-300 font-mono">
                      {plan.createdAt
                        ? new Date(plan.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "-"}
                    </span>
                  </div>

                  <div className="flex gap-3 relative z-10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPlanId(plan.planId)}
                      className="grow bg-zinc-950 border border-zinc-800 text-[10px] font-black uppercase tracking-widest h-12 rounded-xl text-zinc-500 hover:text-white"
                    >
                      Chi tiết
                    </Button>
                    <Button
                      className="grow bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-black uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-emerald-900/20 border-0"
                      onClick={() =>
                        handleStatusAction("finish", plan.planId, plan.version)
                      }
                    >
                      Hoàn thành
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center border-2 border-dashed border-zinc-900 rounded-[40px] bg-zinc-900/10 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700">
                <PlayCircle size={32} />
              </div>
              <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">
                Không có mẻ nào đang nấu
              </p>
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="space-y-6 pt-12 border-t border-zinc-900">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">
              Lịch sử hoàn thiện
            </h3>
          </div>

          <div className="bg-zinc-900/40 rounded-[40px] border border-zinc-800/50 overflow-hidden shadow-2xl">
            <DataTable
              data={completedPlans}
              columns={columns.slice(0, 4).concat([
                {
                  header: "Action",
                  className: "text-right",
                  cell: (row) => (
                    <div className="flex justify-end pr-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPlanId(row.planId)}
                        className="h-10 w-10 p-0 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-emerald-500 transition-all group"
                      >
                        <Eye
                          size={18}
                          className="group-hover:scale-110 transition-transform"
                        />
                      </Button>
                    </div>
                  ),
                },
              ])}
              isLoading={isLoading}
              keyExtractor={(item) => String(item.planId)}
            />
          </div>
        </div>
      </div>
    );
  };

  const isReadyDisabled = !(selectedPlanDetail?.materials ? selectedPlanDetail.materials.every(mat => (materialStockMap.get(`id-${mat.materialId}`) || 0) >= mat.requiredQuantity) : true);

  const footer = (
    <div className="flex flex-col gap-6 w-full p-2">
      {selectedPlanDetail &&
        !["COMPLETED", "FINISHED", "CANCELLED"].includes(
          selectedPlanDetail.status,
        ) && (
          <div className="space-y-4">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">
              Bảng điều khiển trạng thái
            </span>
            <div className="flex flex-wrap gap-3">
              {(selectedPlanDetail.status === "DRAFT" ||
                selectedPlanDetail.status === "PLANNED") && (hasAuthority("ORGANIZE_PRODUCTION") || hasAuthority("ADMIN")) && (
                  <>
                    <Button
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleStatusAction("ready")}
                      disabled={isReadyDisabled}
                      title={isReadyDisabled ? "Không đủ nguyên liệu trong kho" : ""}
                    >
                      <CheckSquare size={16} className="mr-2" /> Đánh dấu Sẵn sàng
                    </Button>
                    <Button
                      className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl border border-red-500/20"
                      onClick={() => handleStatusAction("cancel")}
                    >
                      <X size={16} className="mr-2" /> Hủy mẻ này
                    </Button>
                  </>
                )}
              {selectedPlanDetail.status === "READY_TO_PRODUCE" && (hasAuthority("EXECUTE_PRODUCTION") || hasAuthority("ADMIN") || hasAuthority("MANAGER")) && (
                <>
                  <Button
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl shadow-lg shadow-amber-900/20"
                    onClick={() => handleStatusAction("start")}
                  >
                    <PlayCircle size={16} className="mr-2" strokeWidth={3} />{" "}
                    Bắt đầu nấu ngay
                  </Button>
                  <Button
                    className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl border border-red-500/20"
                    onClick={() => handleStatusAction("cancel")}
                  >
                    <X size={16} className="mr-2" /> Hủy mẻ
                  </Button>
                </>
              )}
              {selectedPlanDetail.status === "IN_PRODUCTION" && (hasAuthority("EXECUTE_PRODUCTION") || hasAuthority("ADMIN") || hasAuthority("MANAGER")) && (
                <Button
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl shadow-lg shadow-emerald-900/20"
                  onClick={() => handleStatusAction("finish")}
                >
                  <CheckCircle2 size={16} className="mr-2" strokeWidth={3} />{" "}
                  Hoàn thành sản xuất
                </Button>
              )}
            </div>
          </div>
        )}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/50">
        <Button
          variant="ghost"
          className="text-zinc-500 hover:bg-zinc-800 rounded-2xl h-12 px-8 uppercase text-[10px] font-black tracking-widest"
          onClick={() => setSelectedPlanId(null)}
        >
          Đóng
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="orange"
              className="text-[10px] font-black tracking-widest px-2 py-0 border-0 h-4 uppercase"
            >
              SCHEDULING
            </Badge>
            <h1 className="text-3xl font-black text-zinc-100 uppercase tracking-tighter">
              Tiến độ sản xuất
            </h1>
          </div>
          <p className="text-xs text-zinc-500 font-medium tracking-wide">
            Tổng hợp & Điều phối các mẻ sản xuất từ{" "}
            <span className="text-amber-500/80">Central Kitchen</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === "list"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-900/20"
                  : "text-zinc-500 hover:text-zinc-200",
              )}
            >
              Danh sách
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === "calendar"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-900/20"
                  : "text-zinc-500 hover:text-zinc-200",
              )}
            >
              Lịch
            </button>
            <button
              onClick={() => setViewMode("completed")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === "completed"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-900/20"
                  : "text-zinc-500 hover:text-zinc-200",
              )}
            >
              Trạng thái
            </button>
          </div>

          {(hasAuthority("ORGANIZE_PRODUCTION") ||
            hasAuthority("CREATE_PRODUCTION_PLAN") ||
            hasAuthority("COORDINATOR") ||
            hasAuthority("MANAGER") ||
            hasAuthority("ADMIN")) && (
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs tracking-widest px-8 h-12 shadow-xl shadow-amber-900/20 border-0 flex items-center gap-2 rounded-2xl"
                onClick={handleCreateTask}
              >
                <Plus size={18} strokeWidth={3} /> Tạo mẻ mới
              </Button>
            )}
        </div>
      </div>

      {/* Content Body */}
      <div className="space-y-8">
        {viewMode === "list" && (
          <div className="space-y-6">
            {/* List Filters Bar */}
            <div className="bg-zinc-900/40 p-1.5 rounded-[28px] border border-zinc-800/50 flex flex-col xl:flex-row gap-4 items-center shadow-xl">
              <div className="flex items-center gap-1.5 flex-1 w-full overflow-x-auto p-1 no-scrollbar">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-3 mr-2 shrink-0">
                  Lọc theo:
                </span>
                {[
                  "all",
                  "planned",
                  "ready_to_produce",
                  "in_production",
                  "finished",
                  "cancelled",
                ].map((status) => {
                  const isActive = statusFilter === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest shrink-0 whitespace-nowrap border border-transparent",
                        isActive
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50",
                      )}
                    >
                      {status === "all"
                        ? "Tất cả"
                        : status === "planned"
                          ? "Lên KH"
                          : status === "ready_to_produce"
                            ? "Sẵn sàng"
                            : status === "in_production"
                              ? "Đang nấu"
                              : status === "finished"
                                ? "Hoàn tất"
                                : status === "cancelled"
                                  ? "Đã hủy"
                                  : status}
                    </button>
                  );
                })}
              </div>

              <div className="h-10 w-[1px] bg-zinc-800 hidden xl:block"></div>

              <div className="relative w-full xl:w-96 p-1">
                <Search
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600"
                  size={18}
                />
                <Input
                  placeholder="Tìm tên mẻ, mã lô hoặc ID..."
                  className="pl-14 pr-6 h-12 bg-zinc-950/50 border-zinc-800/50 rounded-[22px] font-black text-[10px] tracking-[0.2em] placeholder:text-zinc-700 focus:border-amber-500/30 transition-all uppercase"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* List Table Container */}
            <div className="bg-zinc-900/40 rounded-[40px] border border-zinc-800/50 overflow-hidden shadow-2xl">
              <DataTable
                data={filteredPlans}
                columns={columns}
                isLoading={isLoading}
                keyExtractor={(item) => String(item.planId)}
                onRowClick={(row) => setSelectedPlanId(row.planId)}
              />
            </div>
          </div>
        )}

        {viewMode === "calendar" && renderCalendar()}
        {viewMode === "completed" && renderCompletedView()}
      </div>

      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancel}
        title="Hủy Kế Hoạch"
        message="Bạn có chắc chắn muốn hủy kế hoạch này không? Hành động này không thể hoàn tác."
        confirmText="Xác nhận Hủy"
        cancelText="Quay Lại"
        isLoading={isCancelling}
        variant="danger"
      />

      {/* Premium Detail Drawer */}
      <Drawer
        isOpen={!!selectedPlanId}
        onClose={() => setSelectedPlanId(null)}
        title={
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-900/10">
              <ClipboardList size={24} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-zinc-100 uppercase tracking-tight leading-none">
                {selectedPlanDetail?.planName || "Chi tiết"}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-mono font-black text-amber-500/50 uppercase tracking-widest">
                  #{selectedPlanDetail?.planId}
                </span>
                <div className="h-1 w-1 rounded-full bg-zinc-700"></div>
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  Lô: {selectedPlanDetail?.batchCode || "N/A"}
                </span>
              </div>
            </div>
          </div>
        }
        width="max-w-5xl"
        footer={footer}
      >
        {isDetailLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 opacity-30">
            <div className="w-10 h-10 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Đang đối soát...
            </span>
          </div>
        ) : selectedPlanDetail ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 py-2 animate-in slide-in-from-right duration-500">
            {/* Left Column: Visual & Status */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-[40px] p-8 space-y-8 overflow-hidden relative group/sidebar">
                {/* Luxury Visual Element */}
                <div className="relative -mx-8 -mt-8 mb-8 group/img h-64 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/90 z-10"></div>
                  <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full scale-150 group-hover/img:bg-amber-500/20 transition-all duration-700"></div>
                  <img
                    src="/src/assets/kitchen_production.png"
                    alt="Kitchen Production"
                    className="w-full h-full object-cover opacity-60 group-hover/img:opacity-100 group-hover/img:scale-110 transition-all duration-1000"
                  />
                  <div className="absolute bottom-6 left-8 z-20">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-amber-500/30">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Live Production</span>
                    </div>
                  </div>
                </div>

                {/* Status Summary */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="orange"
                        className="h-5 text-[9px] font-black border-0 tracking-widest"
                      >
                        CURRENT_STATE
                      </Badge>
                    </div>
                    <div>
                      {getStatusBadge(selectedPlanDetail.status)}
                    </div>
                    <p className="text-xs text-zinc-500 font-medium italic leading-relaxed">
                      Tiến trình hiện tại của kế hoạch nhằm đáp ứng nhu cầu sản
                      xuất đã được phê duyệt.
                    </p>
                  </div>

                  <div className="h-px bg-zinc-800/50"></div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={16} className="text-zinc-600" />
                      <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">
                        Thời điểm tạo
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-zinc-200 tracking-tight">
                        {new Date(
                          selectedPlanDetail.createdAt,
                        ).toLocaleDateString("vi-VN")}
                      </span>
                      <span className="text-xs font-black text-zinc-500 font-mono mt-1 tracking-tighter uppercase blur-[0.2px]">
                        {new Date(
                          selectedPlanDetail.createdAt,
                        ).toLocaleTimeString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Specs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-zinc-900/40 rounded-[32px] border border-zinc-800/50 space-y-3 group/spec">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-zinc-600 group-hover/spec:text-amber-500 transition-colors" />
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Trạm</span>
                  </div>
                  <span className="text-[13px] font-black text-zinc-300 uppercase truncate block">
                    {selectedPlanDetail.kitchenId === 1 ? "Alpha Kitchen" : `Kitchen #${selectedPlanDetail.kitchenId}`}
                  </span>
                </div>
                <div className="p-6 bg-zinc-900/40 rounded-[32px] border border-zinc-800/50 space-y-3 group/spec">
                  <div className="flex items-center gap-2">
                    <ArrowRight size={14} className="text-zinc-600 group-hover/spec:text-amber-500 transition-colors" />
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Ưu tiên</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full w-[75%] bg-gradient-to-r from-amber-500 to-orange-500"></div>
                    </div>
                    <span className="text-[9px] font-black text-amber-500">HIGH</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Inventory & Details */}
            <div className="lg:col-span-7 space-y-10">
              {/* Inventory Reconciliation */}
              <div className="space-y-5">
                <div className="flex items-center justify-between ml-2">
                  <div className="flex items-center gap-2">
                    <Database size={18} className="text-amber-500/50" />
                    <h4 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">
                      Đối chiếu nguyên liệu
                    </h4>
                  </div>
                  {materialStockMap.size > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[9px] font-black text-emerald-500 uppercase">Live Inventory</span>
                    </div>
                  )}
                </div>

                <div className="bg-zinc-900/20 backdrop-blur-sm rounded-[36px] border border-zinc-800/50 overflow-hidden shadow-2xl">
                  {selectedPlanDetail.materials &&
                    selectedPlanDetail.materials.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-zinc-800/20">
                            <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nguyên liệu</th>
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Yêu cầu</th>
                            <th className="px-4 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Khả dụng</th>
                            <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                          {selectedPlanDetail.materials.map((mat, idx) => {
                            const idKey = `id-${mat.materialId}`;
                            const available = materialStockMap.get(idKey) || 0;
                            const sufficient = available >= mat.requiredQuantity;
                            return (
                              <tr
                                key={idx}
                                className={cn(
                                  "hover:bg-zinc-800/40 transition-all duration-300 group/row",
                                  !sufficient && "bg-red-500/[0.03]",
                                )}
                              >
                                <td className="px-8 py-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[11px] font-black text-zinc-600 group-hover/row:border-amber-500/30 group-hover/row:text-amber-500 transition-all">
                                      {mat.materialName?.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-black text-zinc-200 tracking-tight group-hover/row:text-white transition-colors">
                                        {mat.materialName}
                                      </span>
                                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                        {materialUnitsMap.get(mat.materialId) || mat.unit || ""}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <span className="text-sm font-black text-zinc-400 font-mono tracking-tighter italic">
                                    {mat.requiredQuantity} {materialUnitsMap.get(mat.materialId) || mat.unit || ""}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <span
                                    className={cn(
                                      "text-sm font-black font-mono tracking-tighter px-3 py-1 rounded-xl",
                                      sufficient
                                        ? "text-emerald-500 bg-emerald-500/5 shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]"
                                        : "text-red-500 bg-red-500/5 shadow-[inset_0_0_10px_rgba(239,68,68,0.05)]",
                                    )}
                                  >
                                    {available} {materialUnitsMap.get(mat.materialId) || mat.unit || ""}
                                  </span>
                                </td>
                                <td className="px-8 py-4 text-right">
                                  {sufficient ? (
                                    <div className="flex items-center justify-end gap-2 text-emerald-500">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                      <span className="text-[10px] font-black uppercase tracking-widest">Ready</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-2 text-red-500 animate-pulse">
                                      <AlertTriangle size={14} strokeWidth={3} />
                                      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                        -{mat.requiredQuantity - available} {materialUnitsMap.get(mat.materialId) || mat.unit || ""}
                                      </span>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-16 text-center flex flex-col items-center gap-4 opacity-20">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
                        <Ban size={32} />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em]">No Bill of Materials</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Print Section */}
              <div className="relative group/print overflow-hidden p-8 bg-zinc-950 border border-zinc-800 rounded-[36px] transition-all duration-500 hover:border-amber-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] blur-3xl transform translate-x-10 -translate-y-10 group-hover/print:scale-150 transition-transform duration-1000"></div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover/print:text-amber-500 group-hover/print:border-amber-500/30 group-hover/print:bg-amber-500/5 transition-all duration-500">
                      <Printer size={24} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-black text-white uppercase tracking-tight">Lệnh sản xuất</span>
                        <Badge variant="default" className="h-4 text-[7px] bg-zinc-900 border-zinc-800">PDF-v1.0</Badge>
                      </div>
                      <span className="text-xs text-zinc-500 font-medium mt-1">
                        Bản in nội bộ dành riêng cho Bếp trưởng (Hardcopy)
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-12 px-10 bg-zinc-900 border border-zinc-800 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-amber-500 hover:text-black hover:border-transparent transition-all duration-500 shadow-lg hover:shadow-amber-500/20"
                  >
                    EXtract
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-20 text-center text-zinc-600 uppercase font-black tracking-widest text-[10px]">
            Lỗi truy xuất cấu trúc dữ liệu!
          </div>
        )}
      </Drawer>

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
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                      Sản lượng thực tế
                    </h4>
                    <Badge variant="info" className="text-[8px]">
                      Thủ công
                    </Badge>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedPlanDetail?.items && selectedPlanDetail.items.length > 0 ? (
                      selectedPlanDetail.items.map((item) => (
                        <div key={item.productId} className="group p-5 rounded-[24px] bg-zinc-900/50 border border-zinc-800/50 hover:border-amber-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <Package size={22} className="text-amber-500" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[15px] font-black text-zinc-100 tracking-tight flex items-center gap-2">
                                  {item.productName}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">ID: #{item.productId} | SL Yêu cầu: <span className="text-amber-500 font-bold">{item.plannedQuantity} {item.unit || ""}</span></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/30">
                            <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                              Sản lượng thực tế
                            </span>
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                className="w-28 h-12 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-lg font-black text-amber-500 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all duration-300 shadow-inner"
                                value={actualQuantities[item.productId] ?? ''}
                                onChange={(e) =>
                                  setActualQuantities(prev => ({
                                    ...prev,
                                    [item.productId]: Number(e.target.value)
                                  }))
                                }
                                min={0}
                                placeholder="0"
                              />
                              <span className="text-[11px] font-black text-zinc-600 uppercase tracking-tighter w-8">
                                {item.unit || 'Món'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                          <AlertTriangle size={24} className="text-zinc-700" />
                        </div>
                        <div className="text-[11px] text-zinc-500 font-bold tracking-[0.2em] uppercase">
                          Không có dữ liệu món yêu cầu
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-[20px] bg-amber-500/5 border border-amber-500/10 flex gap-4">
                  <AlertCircle size={20} className="text-amber-500 shrink-0" />
                  <p className="text-[11px] text-zinc-500 font-medium italic leading-relaxed">
                    Lưu ý: Sau khi xác nhận hoàn thành, mẻ sản xuất sẽ chuyển
                    trạng thái "PRODUCED" và sẵn sàng để quản trị kho điều hành
                    phân phối (Allocation).
                  </p>
                </div>
              </div>
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
                disabled={isDetailLoading}
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
