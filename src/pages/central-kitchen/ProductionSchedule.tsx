import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Ban,
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  Database,
  Info,
  Timer,
  X,
  ClipboardList,
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
import {
  allocationApi,
  type AllocationRow,
} from "../../services/allocationApi";
import type {
  ProductionPlanSummaryResponse,
  ProductionPlanDetailResponse,
} from "../../types/productionPlan";
import { toast } from "react-hot-toast";
import { cn } from "../../utils/classNames";

export const ProductionSchedule = () => {
  const { user, hasAuthority } = useAuth();
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
  const [actualQuantities, setActualQuantities] = useState<
    Record<number, number>
  >({});

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
              setMaterialUnitsMap((prev) => {
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
  }, [
    selectedPlanId,
    selectedPlanDetail?.kitchenId,
    user?.kitchenId,
    selectedPlanDetail?.materials,
  ]);

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

      // ENHANCEMENT: Fetch the "most accurate" materials AND items from allocation preview
      try {
        const preview = await allocationApi.previewAllocation(id);

        // 1. Merge items (Products)
        const previewItems = (preview.rows || []).map((r: any) => {
          const totalReq = (r.allocations || []).reduce(
            (sum: number, a: any) => sum + (a.requestedQuantity || 0),
            0,
          );
          const totalAllocated = (r.allocations || []).reduce(
            (sum: number, a: any) => sum + (a.allocatedQuantity || 0),
            0,
          );
          return {
            productId: r.productId,
            productName: r.productName,
            plannedQuantity: totalReq || r.totalAvailable || 0,
            producedQuantity: totalAllocated || r.totalAvailable || 0,
            unit: "Món",
          };
        });

        if (!detail.items || detail.items.length === 0) {
          detail.items = previewItems;
        } else {
          // Merge missing items from preview into detail.items
          previewItems.forEach((pItem) => {
            const existing = (detail.items as any[])?.find(
              (i) => i.productId === pItem.productId,
            );
            if (!existing) {
              detail.items?.push(pItem);
            } else if (
              !existing.plannedQuantity ||
              existing.plannedQuantity === 0
            ) {
              existing.plannedQuantity = pItem.plannedQuantity;
            }

            // Sync produced quantity from preview if it exists and looks like yield
            if (
              pItem.producedQuantity > 0 &&
              (!existing.producedQuantity || existing.producedQuantity === 0)
            ) {
              existing.producedQuantity = pItem.producedQuantity;
            }
          });
        }

        // 2. Merge Produced Quantities from outputs if available
        if (detail.outputs && detail.outputs.length > 0) {
          detail.outputs.forEach((output: any) => {
            const item = (detail.items as any[])?.find(
              (i) => Number(i.productId) === Number(output.productId),
            );
            if (item) {
              item.producedQuantity =
                output.actualProducedQty ??
                output.producedQuantity ??
                output.quantity ??
                output.actualQty ??
                0;
            }
          });
        }

        // 2. Map materials
        if (preview.materials && preview.materials.length > 0) {
          // Preserve units since preview materials might not have them
          const existingUnits = new Map<number, string>();
          detail.materials?.forEach((m) => {
            if (m.materialId && m.unit) existingUnits.set(m.materialId, m.unit);
          });

          detail.materials = preview.materials.map((m) => ({
            ...m,
            unit: m.unit || existingUnits.get(m.materialId),
          }));
        }
      } catch (e) {
        console.warn("Could not fetch accurate materials/items preview", e);
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
              const { rows: allocationRows } =
                await allocationApi.previewAllocation(id);

              // Map AllocationRow to ProductionPlanDetailItem format
              // Use units from detail.items if available
              displayItems = allocationRows.map((row: AllocationRow) => {
                const originalItem = (detail.items || []).find(
                  (it: any) => it.productId === row.productId,
                );
                return {
                  productId: row.productId,
                  productName: row.productName,
                  plannedQuantity: (row.allocations || []).reduce(
                    (sum: number, alloc: any) =>
                      sum + (alloc.requestedQuantity || 0),
                    0,
                  ),
                  unit: originalItem?.unit || "",
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
              items: displayItems,
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
            const msg =
              err.response?.status === 403
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
        .map(([productIdStr, qty]) => {
          const productId = parseInt(productIdStr, 10);
          const item = selectedPlanDetail?.items?.find(
            (i) => i.productId === productId,
          );
          return {
            productId,
            productName: item?.productName || "Product",
            quantity: qty,
            actualQty: qty,
            producedQuantity: qty,
            actualProducedQty: qty,
          };
        });

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
      PRODUCING: {
        variant: "primary",
        label: "ĐANG NẤU",
        icon: PlayCircle,
      },
      COMPLETED: { variant: "success", label: "HOÀN TẤT", icon: CheckCircle },
      FINISHED: { variant: "success", label: "HOÀN TẤT", icon: CheckCircle },
      PRODUCED: { variant: "success", label: "ĐÃ NẤU XONG", icon: CheckCircle },
      CANCELLED: { variant: "danger", label: "ĐÃ HỦY", icon: Ban },
    };
    const item = config[s] || { variant: "default", label: s, icon: Info };
    const Icon = item.icon;

    return (
      <Badge
        variant={item.variant}
        className="px-3 py-1 font-black text-[10px] tracking-widest uppercase border-0 flex items-center gap-1.5 h-6 shadow-sm shadow-black/5"
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
          <span className="text-[10px] font-black text-[var(--text-secondary)]/50 uppercase tracking-widest mt-1">
            Ref: {row.batchCode}
          </span>
        </div>
      ),
    },
    {
      header: "Tên Kế Hoạch",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)]">
            <ClipboardList size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-black text-[var(--text-primary)] tracking-tight uppercase">
              {row.planName || "N/A"}
            </span>
            <span className="text-[10px] font-black text-[var(--text-secondary)]/50 uppercase tracking-tighter">
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
            <CalendarIcon size={12} className="text-amber-500/50" />
            <span className="text-[11px] font-black text-[var(--text-secondary)] tracking-tight">
              {row.createdAt
                ? new Date(row.createdAt).toLocaleDateString("vi-VN")
                : "-"}
            </span>
          </div>
          <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] mt-1 italic">
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
            className="h-10 w-10 p-0 rounded-xl bg-[var(--bg-root)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/5 transition-all group shadow-sm"
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
          className="min-h-[140px] border-b border-r border-[var(--border-primary)]/10 bg-transparent"
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
            "min-h-[140px] border-b border-r border-[var(--border-primary)]/10 p-4 transition-all hover:bg-[var(--text-primary)]/[0.03] group relative",
            isToday && "bg-amber-500/[0.03]",
          )}
        >
          <div className="flex justify-between items-start mb-4">
            <span
              className={cn(
                "text-xs font-black transition-all",
                isToday
                  ? "text-amber-500"
                  : "text-[var(--text-secondary)]/40 group-hover:text-[var(--text-secondary)]/80",
              )}
            >
              {String(day).padStart(2, "0")}
            </span>
            {dayPlans.length > 0 && (
              <Badge
                variant="default"
                className="bg-[var(--bg-root)] border-[var(--border-primary)] text-[var(--text-secondary)]/60 text-[8px] h-4 px-1"
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
                  plan.status === "COMPLETED" || plan.status === "FINISHED" || plan.status === "PRODUCED"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : plan.status === "IN_PRODUCTION" || plan.status === "PRODUCING"
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      : plan.status === "CANCELLED"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-[var(--bg-root)] text-[var(--text-secondary)]/60 border-[var(--border-primary)]",
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
      <div className="bg-[var(--bg-card)] rounded-[40px] border border-[var(--border-primary)] overflow-hidden shadow-sm animate-in zoom-in-95 duration-500">
        <div className="p-8 border-b border-[var(--border-primary)] flex flex-col md:flex-row justify-between items-center bg-[var(--text-primary)]/[0.02]">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter drop-shadow-sm">
              {currentDate.toLocaleString("vi-VN", { month: "long" })}{" "}
              <span className="text-[var(--text-secondary)]/40 ml-1 italic">{year}</span>
            </h2>
            <div className="flex items-center bg-[var(--bg-root)] p-1 rounded-2xl border border-[var(--border-primary)] shadow-inner">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date(year, month - 1))}
                className="h-10 w-10 p-0 rounded-xl text-[var(--text-secondary)] hover:text-amber-500"
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="px-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-amber-500 italic"
              >
                Hôm nay
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date(year, month + 1))}
                className="h-10 w-10 p-0 rounded-xl text-[var(--text-secondary)] hover:text-amber-500"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-7 bg-[var(--text-primary)]/[0.01]">
          {["C.Nhật", "T.Hai", "T.Ba", "T.Tư", "T.Năm", "T.Sáu", "T.Bảy"].map(
            (day) => (
              <div
                key={day}
                className="py-4 text-center text-[10px] font-black text-[var(--text-secondary)]/50 uppercase tracking-[0.2em] border-b border-[var(--border-primary)]/40 italic"
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
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.3)]"></div>
              <h3 className="text-xs font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] italic">
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
                  className="bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--border-primary)] shadow-sm hover:shadow-xl transition-all group overflow-hidden relative shadow-sm"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] blur-3xl"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex flex-col">
                      <h4 className="font-black text-[var(--text-primary)] uppercase tracking-tight text-[15px]">
                        {plan.planName}
                      </h4>
                      <p className="text-[10px] font-black text-[var(--text-secondary)]/50 font-mono mt-0.5 tracking-tighter uppercase italic">
                        ID: #{plan.planId} | Batch: {plan.batchCode}
                      </p>
                    </div>
                    {getStatusBadge(plan.status)}
                  </div>

                  <div className="bg-[var(--bg-root)] p-4 rounded-2xl mb-6 flex justify-between items-center relative z-10 border border-[var(--border-primary)] shadow-inner">
                    <div className="flex items-center gap-2">
                      <Timer size={14} className="text-amber-500" />
                      <span className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest italic">
                        Khởi động:
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-[var(--text-primary)] font-mono italic tabular-nums">
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
                      className="grow bg-[var(--bg-root)] border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-widest h-12 rounded-xl text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/5"
                    >
                      Chi tiết
                    </Button>
                    <Button
                      className="grow bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black text-[10px] font-black uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-emerald-900/10 border-0"
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
            <div className="p-20 text-center border-2 border-dashed border-[var(--border-primary)] rounded-[40px] bg-[var(--bg-card)]/50 flex flex-col items-center gap-4 shadow-inner">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)]/30">
                <PlayCircle size={32} />
              </div>
              <p className="text-[11px] font-black text-[var(--text-secondary)]/50 uppercase tracking-widest italic">
                Không có kế hoạch nào đang nấu
              </p>
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="space-y-6 pt-12 border-t border-[var(--border-primary)]">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
            <h3 className="text-xs font-black text-[var(--text-secondary)]/50 uppercase tracking-[0.2em]">
              Lịch sử hoàn thiện
            </h3>
          </div>

          <div className="bg-[var(--bg-card)] rounded-[40px] border border-[var(--border-primary)] overflow-hidden shadow-sm">
            <DataTable
              data={completedPlans}
              columns={columns.slice(0, 4).concat([
                {
                  header: "Thao tác",
                  className: "text-right",
                  cell: (row) => (
                    <div className="flex justify-end pr-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPlanId(row.planId)}
                        className="h-10 w-10 p-0 rounded-xl bg-[var(--bg-root)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-amber-500 transition-all group shadow-sm"
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

  const isReadyDisabled = !(selectedPlanDetail?.materials
    ? selectedPlanDetail.materials.every(
        (mat) =>
          (materialStockMap.get(`id-${mat.materialId}`) || 0) >=
          mat.requiredQuantity,
      )
    : true);

  const footer = (
    <div className="flex flex-col gap-6 w-full p-2">
      {selectedPlanDetail &&
        !["COMPLETED", "FINISHED", "CANCELLED"].includes(
          selectedPlanDetail.status,
        ) && user?.role !== "COORDINATOR" && (
          <div className="space-y-4">
            <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] ml-2 italic">
              Bảng điều khiển trạng thái
            </span>
            <div className="flex flex-wrap gap-3">
              {(selectedPlanDetail.status === "DRAFT" ||
                selectedPlanDetail.status === "PLANNED") &&
                (hasAuthority("ORGANIZE_PRODUCTION") ||
                  hasAuthority("ADMIN")) && (
                  <>
                    <Button
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleStatusAction("ready")}
                      disabled={isReadyDisabled}
                      title={
                        isReadyDisabled ? "Không đủ nguyên liệu trong kho" : ""
                      }
                    >
                      <CheckSquare size={16} className="mr-2" /> Đánh dấu Sẵn
                      sàng
                    </Button>
                    <Button
                      className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl border border-red-500/20"
                      onClick={() => handleStatusAction("cancel")}
                    >
                      <X size={16} className="mr-2" /> Hủy kế hoạch này
                    </Button>
                  </>
                )}
              {selectedPlanDetail.status === "READY_TO_PRODUCE" &&
                (hasAuthority("EXECUTE_PRODUCTION") ||
                  hasAuthority("ADMIN") ||
                  hasAuthority("MANAGER")) && (
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
                      <X size={16} className="mr-2" /> Hủy kế hoạch
                    </Button>
                  </>
                )}
              {selectedPlanDetail.status === "IN_PRODUCTION" &&
                (hasAuthority("EXECUTE_PRODUCTION") ||
                  hasAuthority("ADMIN") ||
                  hasAuthority("MANAGER")) && (
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
      <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-primary)]/20">
        <Button
          variant="ghost"
          className="text-[var(--text-secondary)]/60 hover:text-[var(--text-primary)] hover:bg-[var(--bg-root)] rounded-2xl h-14 px-10 uppercase text-[10px] font-black tracking-[0.2em] italic"
          onClick={() => setSelectedPlanId(null)}
        >
          Đóng chi tiết
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 pt-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-2xl border border-amber-500/20 backdrop-blur-md shadow-sm">
              <CalendarIcon size={22} className="text-amber-500" />
            </div>
            <Badge
              className="text-[10px] font-black tracking-[0.2em] px-3 py-1.5 border-0 uppercase bg-amber-500/10 text-amber-500 italic shadow-sm"
            >
              SCHEDULING PROTOCOL
            </Badge>
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase tracking-tighter drop-shadow-lg">
            Tiến độ <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Sản xuất</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] font-medium tracking-wide max-w-xl leading-relaxed">
            Tổng hợp & Điều phối các kế hoạch sản xuất từ <span className="text-amber-500 font-black italic">CENTRAL KITCHEN</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex bg-[var(--bg-card)] p-1 rounded-[1.5rem] border border-[var(--border-primary)] shadow-sm overflow-hidden backdrop-blur-md">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                viewMode === "list"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-900/10"
                  : "text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/5",
              )}
            >
              Danh sách
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                viewMode === "calendar"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-900/10"
                  : "text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/5",
              )}
            >
              Lịch
            </button>
            <button
              onClick={() => setViewMode("completed")}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                viewMode === "completed"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-900/10"
                  : "text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/5",
              )}
            >
              Trạng thái
            </button>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="space-y-8">
        {viewMode === "list" && (
          <div className="space-y-6">
            {/* List Filters Bar */}
            <div className="bg-[var(--bg-card)] p-1.5 rounded-[28px] border border-[var(--border-primary)] flex flex-col xl:flex-row gap-4 items-center shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-1.5 flex-1 w-full overflow-x-auto p-1 no-scrollbar">
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-3 mr-2 shrink-0 italic">
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
                        "px-4 py-2.5 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest shrink-0 whitespace-nowrap border border-transparent italic",
                        isActive
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm"
                          : "bg-transparent text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/5",
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

              <div className="h-10 w-[1px] bg-[var(--border-primary)] hidden xl:block opacity-50"></div>

              <div className="relative w-full xl:w-96 p-1 group">
                <Search
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-amber-500 transition-colors"
                  size={18}
                />
                <Input
                  placeholder="Tìm tên kế hoạch, mã lô hoặc ID..."
                  className="pl-14 pr-6 h-12 bg-[var(--bg-root)]/50 border-[var(--border-primary)] rounded-[22px] font-black text-[10px] tracking-[0.2em] placeholder:text-[var(--text-secondary)]/30 focus:border-amber-500/50 transition-all uppercase"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* List Table Container */}
            <div className="bg-[var(--bg-card)] rounded-[40px] border border-[var(--border-primary)] overflow-hidden shadow-sm">
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
              <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight leading-none italic">
                {selectedPlanDetail?.planName || "Chi tiết"}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-mono font-black text-amber-500/50 uppercase tracking-widest italic">
                  #{selectedPlanDetail?.planId}
                </span>
                <div className="h-1 w-1 rounded-full bg-[var(--border-primary)]"></div>
                <span className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest italic">
                  Lô: {selectedPlanDetail?.batchCode || "N/A"}
                </span>
              </div>
            </div>
          </div>
        }
        width="max-w-5xl"
      >
        {isDetailLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 opacity-30">
            <div className="w-10 h-10 border-2 border-[var(--border-primary)] border-t-amber-500 rounded-full animate-spin"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              Đang đối soát...
            </span>
          </div>
        ) : selectedPlanDetail ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-2 animate-in slide-in-from-right duration-500">
            {/* Left Column: Visual & Status */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-primary)] rounded-[32px] p-6 space-y-6 overflow-hidden relative group/sidebar shadow-sm">
                {/* Visual Element */}
                <div className="relative -mx-6 -mt-6 mb-4 group/img h-32 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-root)]/10 via-transparent to-[var(--bg-root)] z-10"></div>
                  <img
                    src="/src/assets/kitchen_production.png"
                    alt="Kitchen Production"
                    className="w-full h-full object-cover opacity-60 group-hover/img:opacity-100 group-hover/img:scale-110 transition-all duration-1000"
                  />
                  <div className="absolute bottom-4 left-6 z-20">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-root)]/90 backdrop-blur-md border border-amber-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                        Sản xuất trực tiếp
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Summary */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="orange"
                        className="h-5 text-[9px] font-black border-0 tracking-[0.2em] italic uppercase"
                      >
                        TRẠNG THÁI HIỆN TẠI
                      </Badge>
                    </div>
                    <div className="scale-110 origin-left">{getStatusBadge(selectedPlanDetail.status)}</div>
                    <p className="text-[11px] text-[var(--text-secondary)]/60 font-black italic tracking-tight leading-relaxed uppercase">
                      Tiến trình hiện tại của kế hoạch nhằm đáp ứng nhu cầu sản
                      xuất đã được phê duyệt.
                    </p>
                  </div>

                  <div className="h-px bg-[var(--border-primary)]/40"></div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={16} className="text-[var(--text-secondary)]/40" />
                      <span className="text-[11px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] italic">
                        Thời điểm tạo
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-[var(--text-primary)] tracking-tight">
                        {new Date(
                          selectedPlanDetail.createdAt,
                        ).toLocaleDateString("vi-VN")}
                      </span>
                      <span className="text-xs font-black text-[var(--text-secondary)]/60 font-mono mt-1 tracking-tighter uppercase blur-[0.2px] italic">
                        {new Date(
                          selectedPlanDetail.createdAt,
                        ).toLocaleTimeString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Inventory & Details */}
            <div className="lg:col-span-8 space-y-8">
              {/* Product List Section */}
              <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between ml-2">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-amber-500" />
                    <h4 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em] italic">
                      Danh sách món sản xuất
                    </h4>
                  </div>
                  <Badge
                    variant="orange"
                    className="h-5 text-[9px] font-black border-0"
                  >
                    {selectedPlanDetail.items?.length || 0} SẢN PHẨM
                  </Badge>
                </div>

                <div className="bg-[var(--bg-root)]/40 backdrop-blur-md rounded-[24px] border border-[var(--border-primary)]/40 overflow-hidden shadow-sm space-y-px divide-y divide-[var(--border-primary)]/10">
                  {selectedPlanDetail.items &&
                  selectedPlanDetail.items.length > 0 ? (
                    selectedPlanDetail.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 flex items-center justify-between hover:bg-[var(--bg-root)] transition-all group/item"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)]/40 flex items-center justify-center text-[var(--text-secondary)]/40 group-hover/item:border-amber-500/30 group-hover/item:text-amber-500 group-hover/item:bg-amber-500/5 transition-all duration-500 shadow-inner">
                            <Package size={22} />
                          </div>
                          <div>
                            <h5 className="text-sm font-black text-[var(--text-primary)]/80 uppercase tracking-tight group-hover/item:text-amber-500 transition-colors italic">
                              {item.productName}
                            </h5>
                            <span className="text-[10px] text-[var(--text-secondary)]/30 font-black uppercase tracking-widest mt-1 block italic">
                              ID: #{item.productId}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-baseline justify-end gap-1.5">
                              <span className="text-xl font-black text-amber-500 tabular-nums">
                                {selectedPlanDetail.status === "COMPLETED" ||
                                selectedPlanDetail.status === "FINISHED" ||
                                selectedPlanDetail.status === "PRODUCED"
                                  ? item.producedQuantity || 0
                                  : item.plannedQuantity || 0}
                              </span>
                              {(selectedPlanDetail.status === "COMPLETED" ||
                                selectedPlanDetail.status === "FINISHED" ||
                                selectedPlanDetail.status === "PRODUCED") && (
                                <span className="text-[10px] font-black text-zinc-600 uppercase">
                                  / {item.plannedQuantity || 0}
                                </span>
                              )}
                              <span className="text-[10px] font-black text-zinc-600 uppercase">
                                {item.unit || "Món"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-80">
                              <span
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-widest",
                                  selectedPlanDetail.status === "COMPLETED" ||
                                    selectedPlanDetail.status === "FINISHED" ||
                                    selectedPlanDetail.status === "PRODUCED"
                                    ? "text-emerald-500"
                                    : "text-zinc-500",
                                )}
                              >
                                {selectedPlanDetail.status === "COMPLETED" ||
                                selectedPlanDetail.status === "FINISHED" ||
                                selectedPlanDetail.status === "PRODUCED"
                                  ? "Thực tế"
                                  : "Mục tiêu"}
                              </span>
                              {(selectedPlanDetail.status === "COMPLETED" ||
                                selectedPlanDetail.status === "FINISHED" ||
                                selectedPlanDetail.status === "PRODUCED") && (
                                <>
                                  <div className="w-1 h-1 rounded-full bg-[var(--border-primary)]"></div>
                                  <span className="text-[9px] font-black text-[var(--text-secondary)]/30 uppercase tracking-widest italic">
                                    Kế hoạch
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-16 text-center opacity-20">
                      <p className="text-[11px] font-black uppercase tracking-[0.3em]">
                        Chưa có món nào được gán
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory Reconciliation */}
              <div className="space-y-5">
                <div className="flex items-center justify-between ml-2">
                  <div className="flex items-center gap-2">
                    <Database size={18} className="text-amber-500/50" />
                    <h4 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em] italic">
                      Đối chiếu nguyên liệu
                    </h4>
                  </div>
                  {materialStockMap.size > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[9px] font-black text-emerald-500 uppercase">
                        Kho thực tế
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-[var(--bg-root)]/20 backdrop-blur-sm rounded-[24px] border border-[var(--border-primary)]/40 overflow-hidden shadow-sm">
                  {selectedPlanDetail.materials &&
                  selectedPlanDetail.materials.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[var(--bg-root)]/50">
                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] italic">
                              Nguyên liệu
                            </th>
                            <th className="px-4 py-4 text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] italic text-center">
                              Yêu cầu
                            </th>
                            <th className="px-4 py-4 text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] italic text-center">
                              Khả dụng
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] italic text-right">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]/10">
                          {selectedPlanDetail.materials.map((mat, idx) => {
                            const idKey = `id-${mat.materialId}`;
                            const available = materialStockMap.get(idKey) || 0;
                            const sufficient =
                              available >= mat.requiredQuantity;
                            return (
                              <tr
                                key={idx}
                                className={cn(
                                  "hover:bg-[var(--bg-root)] transition-all duration-300 group/row",
                                  !sufficient && "bg-red-500/[0.03]",
                                )}
                              >
                                <td className="px-6 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[11px] font-black text-[var(--text-secondary)]/40 group-hover/row:border-amber-500/30 group-hover/row:text-amber-500 transition-all shadow-sm italic">
                                      {mat.materialName?.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[13px] font-black text-[var(--text-primary)] tracking-tight group-hover/row:text-amber-500 transition-colors uppercase italic">
                                        {mat.materialName}
                                      </span>
                                      <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic mt-0.5">
                                        {materialUnitsMap.get(mat.materialId) ||
                                          mat.unit ||
                                          ""}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-[13px] font-black text-[var(--text-secondary)]/60 font-mono tracking-tighter italic">
                                    {mat.requiredQuantity}{" "}
                                    {materialUnitsMap.get(mat.materialId) ||
                                      mat.unit ||
                                      ""}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={cn(
                                      "text-sm font-black font-mono tracking-tighter px-3 py-1 rounded-xl shadow-inner",
                                      sufficient
                                        ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20"
                                        : "text-red-500 bg-red-500/10 border border-red-500/20",
                                    )}
                                  >
                                    {available}{" "}
                                    {materialUnitsMap.get(mat.materialId) ||
                                      mat.unit ||
                                      ""}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                  {sufficient ? (
                                    <div className="flex items-center justify-end gap-2 text-emerald-500">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                                      <span className="text-[10px] font-black uppercase tracking-widest italic">
                                        Sẵn sàng
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-2 text-red-500 animate-pulse">
                                      <AlertTriangle
                                        size={14}
                                        strokeWidth={3}
                                      />
                                      <span className="text-[10px] font-black uppercase tracking-widest italic whitespace-nowrap">
                                        -{mat.requiredQuantity - available}{" "}
                                        {materialUnitsMap.get(mat.materialId) ||
                                          mat.unit ||
                                          ""}
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
                    <div className="p-16 text-center flex flex-col items-center gap-4 opacity-30 italic">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--border-primary)]/40 flex items-center justify-center">
                        <Ban size={28} className="text-[var(--text-secondary)]/20" />
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-[0.3em]">
                        Chưa có định mức vật tư
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-20 text-center text-[var(--text-secondary)]/40 uppercase font-black tracking-[0.3em] text-[10px] italic">
            Lỗi truy xuất cấu trúc dữ liệu!
          </div>
        )}
      </Drawer>

      {/* Premium Yield Reporting Modal */}
      {showYieldModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-[var(--bg-card)] rounded-[40px] border border-[var(--border-primary)] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-5 duration-500">
            {/* Modal Header */}
            <div className="p-8 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-root)] border-b border-[var(--border-primary)]/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] blur-3xl rounded-full"></div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-900/10">
                  <ClipboardList size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="orange"
                      className="text-[8px] font-black tracking-[0.2em] h-4 py-0 border-0 italic uppercase"
                    >
                      BÁO CÁO SẢN LƯỢNG
                    </Badge>
                    <span className="text-[10px] font-mono font-black text-[var(--text-secondary)]/40 italic uppercase">
                      ID: #{finishingPlanId}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mt-1 italic">
                    Nghiệm thu kế hoạch nấu
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <h4 className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] italic">
                      Sản lượng thực tế
                    </h4>
                    <Badge variant="info" className="text-[8px] font-black italic border-0 px-2 uppercase tracking-widest">
                      Thủ công
                    </Badge>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedPlanDetail?.items &&
                    selectedPlanDetail.items.length > 0 ? (
                      selectedPlanDetail.items.map((item) => (
                        <div
                          key={item.productId}
                          className="group p-5 rounded-[24px] bg-[var(--bg-root)] border border-[var(--border-primary)] hover:border-amber-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-amber-500/5 relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent"></div>
                          <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                <Package size={22} className="text-amber-500" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[15px] font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2 uppercase italic">
                                  {item.productName}
                                </span>
                                <span className="text-[10px] text-[var(--text-secondary)]/40 font-black tracking-widest uppercase italic mt-0.5">
                                  ID: #{item.productId} | Yêu cầu:{" "}
                                  <span className="text-amber-500 underline decoration-amber-500/30 underline-offset-4">
                                    {item.plannedQuantity} {item.unit || ""}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-primary)] shadow-inner relative z-10">
                            <span className="text-[11px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                              Đã thực thi
                            </span>
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                className="w-28 h-12 bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-xl text-center text-lg font-black text-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all duration-300 shadow-sm tabular-nums italic"
                                value={actualQuantities[item.productId] ?? ""}
                                onChange={(e) =>
                                  setActualQuantities((prev) => ({
                                    ...prev,
                                    [item.productId]: Number(e.target.value),
                                  }))
                                }
                                min={0}
                                placeholder="0"
                              />
                              <span className="text-[10px] font-black text-[var(--text-secondary)]/20 uppercase tracking-tighter w-8 italic">
                                {item.unit || "Món"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-[var(--bg-root)] border border-[var(--border-primary)]/40 flex items-center justify-center mx-auto mb-6 shadow-inner italic">
                          <AlertTriangle size={24} className="text-[var(--text-secondary)]/20" />
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)]/40 font-black tracking-[0.2em] uppercase italic">
                          Không có dữ liệu món yêu cầu
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-[24px] bg-amber-500/5 border border-amber-500/10 flex gap-4 shadow-sm">
                  <AlertCircle size={20} className="text-amber-500 shrink-0" />
                  <p className="text-[10px] text-[var(--text-secondary)]/60 font-black uppercase tracking-widest italic leading-relaxed">
                    Lưu ý: Sau khi xác nhận hoàn thành, kế hoạch sản xuất sẽ chuyển
                    trạng thái "PRODUCED" và sẵn sàng để điều phối (Allocation).
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-[var(--bg-root)] border-t border-[var(--border-primary)]/20 mt-auto flex gap-6">
              <Button
                variant="ghost"
                onClick={() => setShowYieldModal(false)}
                className="text-[var(--text-secondary)]/40 hover:text-[var(--text-primary)] h-16 px-8 rounded-2xl flex-1 uppercase text-[10px] font-black tracking-widest italic"
              >
                Quay lại trạm
              </Button>
              <Button
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-black font-black uppercase text-[10px] tracking-[0.3em] h-16 px-10 rounded-2xl flex-1 shadow-xl shadow-emerald-500/10 border-0 italic transition-all active:scale-95"
                onClick={handleConfirmFinish}
                disabled={isDetailLoading}
              >
                Ký duyệt & Nghiệm thu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
