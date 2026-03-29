import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Calendar as CalendarIcon,
  ChevronRight,
  CheckCircle2,
  ChefHat,
  Package,
  ClipboardCheck,
  LayoutGrid,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { storeOrderApi } from "../../services/storeOrderApi";
import { productionPlanApi } from "../../services/productionPlan.api";
import { kitchenApi } from "../../services/kitchen.api";
import { dispatchApi } from "../../services/dispatch.api";
import { useAuth } from "../../hooks/useAuth";
import type { StoreOrderResponse } from "../../types/storeOrder";
import type { KitchenResponse } from "../../types/kitchen";
import { cn } from "../../utils/classNames";

export const CreateProductionPlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Wizard State
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Form Data
  const [plannedDate, setPlannedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Default to tomorrow
    return d.toISOString().split("T")[0];
  });

  const [expectedCompletedDate, setExpectedCompletedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // Default to day after tomorrow
    return d.toISOString().split("T")[0];
  });

  const [kitchens, setKitchens] = useState<KitchenResponse[]>([]);
  const [selectedKitchenId, setSelectedKitchenId] = useState<number | null>(
    null,
  );

  const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(
    new Set(),
  );

  const [kitchensInfo, setKitchensInfo] = useState<
    Record<number, { remaining: number; inventoryTotal: number }>
  >({});
  const [isCapacityLoading, setIsCapacityLoading] = useState(false);

  const fetchKitchens = useCallback(async () => {
    try {
      const res = await kitchenApi.getAllKitchens();
      const kitchenList = res.data || [];
      setKitchens(kitchenList);

      // Default selection based on role
      if (user?.kitchenId) {
        const userKitchen = kitchenList.find(
          (k) => k.kitchenId === user.kitchenId,
        );
        if (userKitchen) setSelectedKitchenId(userKitchen.kitchenId);
        else if (kitchenList.length > 0)
          setSelectedKitchenId(kitchenList[0].kitchenId);
      } else if (kitchenList.length > 0) {
        setSelectedKitchenId(kitchenList[0].kitchenId);
      }
    } catch {
      toast.error("Không thể tải danh sách bếp trung tâm.");
    }
  }, [user?.kitchenId]);

  useEffect(() => {
    fetchKitchens();
  }, [fetchKitchens]);

  const fetchAllKitchensInfo = useCallback(async () => {
    if (kitchens.length === 0 || !plannedDate) return;
    setIsCapacityLoading(true);
    try {
      const infoMap: Record<
        number,
        { remaining: number; inventoryTotal: number }
      > = {};

      await Promise.all(
        kitchens.map(async (k) => {
          try {
            const capRes = await dispatchApi
              .getSuggestion(k.kitchenId, plannedDate)
              .catch(() => null);

            let remaining = Number(k.maxDailyCapacity) || 0;
            if (
              capRes &&
              Array.isArray(capRes.data) &&
              capRes.data.length > 0
            ) {
              remaining = Number(capRes.data[0].kitchenCapacity) || 0;
            }

            infoMap[k.kitchenId] = { remaining, inventoryTotal: 0 };
          } catch {
            infoMap[k.kitchenId] = {
              remaining: Number(k.maxDailyCapacity) || 0,
              inventoryTotal: 0,
            };
          }
        }),
      );
      setKitchensInfo(infoMap);
    } catch {
      // Fail silently
    } finally {
      setIsCapacityLoading(false);
    }
  }, [kitchens, plannedDate]);

  useEffect(() => {
    if (step === 1 && kitchens.length > 0) {
      fetchAllKitchensInfo();
    }
  }, [step, kitchens.length, plannedDate, fetchAllKitchensInfo]);

  const fetchOrders = useCallback(async () => {
    if (!selectedKitchenId) return;
    setIsLoadingOrders(true);
    try {
      const ordersRes = await storeOrderApi.getAllOrders({
        status: "APPROVED",
        size: 100,
      });
      setOrders(ordersRes.content || []);
    } catch {
      toast.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setIsLoadingOrders(false);
    }
  }, [selectedKitchenId]);

  useEffect(() => {
    if (step === 1 && selectedKitchenId) {
      fetchOrders();
    }
  }, [step, selectedKitchenId, fetchOrders]);

  const toggleSelection = (orderId: number) => {
    const newSet = new Set(selectedOrderIds);
    if (newSet.has(orderId)) newSet.delete(orderId);
    else newSet.add(orderId);
    setSelectedOrderIds(newSet);
  };

  const toggleAll = () => {
    if (selectedOrderIds.size === orders.length) setSelectedOrderIds(new Set());
    else setSelectedOrderIds(new Set(orders.map((o) => o.orderId)));
  };

  const aggregatedDemand = useMemo(() => {
    const demandMap = new Map<
      string,
      { productId: number; quantity: number; unitPrice: number }
    >();

    const selected = orders.filter((o) => selectedOrderIds.has(o.orderId));
    selected.forEach((order) => {
      (order.orderDetails || []).forEach((item) => {
        const name = item.productName || `Sản phẩm #${item.productId}`;
        if (demandMap.has(name)) {
          demandMap.get(name)!.quantity += item.quantity;
        } else {
          demandMap.set(name, {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          });
        }
      });
    });

    return Array.from(demandMap.entries()).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [orders, selectedOrderIds]);

  const onSubmit = async () => {
    if (selectedOrderIds.size === 0) return;
    setIsSubmitting(true);
    try {
      const plan = await productionPlanApi.createProductionPlan({
        kitchenId: selectedKitchenId!,
        plannedDate,
        expectedCompletedDate,
        storeOrderIds: Array.from(selectedOrderIds),
      });

      if (plan && plan.planId) {
        toast.success("Kế hoạch sản xuất đã được tạo thành công.");
        navigate("/kitchen/production-plans");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Tạo kế hoạch thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-root)] pb-20">
      {/* Cinematic Header Area */}
      <div className="relative h-[250px] -mx-4 -mt-8 mb-12 overflow-hidden group/header">
        <div className="absolute inset-0 bg-[var(--bg-root)]">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-80 scale-105 group-hover/header:scale-110 transition-transform duration-[3s] ease-out shadow-inner"
            alt="Central Kitchen Production"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-root)] via-[var(--bg-root)]/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-root)] via-transparent to-[var(--bg-root)]"></div>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end px-8 pb-10 max-w-[1500px] mx-auto w-full">
            <div className="flex items-center gap-3 mb-4">
              <Badge
                variant="orange"
                className="text-[10px] font-black tracking-[0.3em] px-3 h-5 border-0 bg-amber-500/10 text-amber-500 uppercase italic"
              >
                COORDINATOR ELITE
              </Badge>
              <div className="h-px w-12 bg-amber-500/30" />
              <span className="text-amber-500/80 font-black tracking-[0.2em] text-[10px] uppercase italic">Planning Hub</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                <div>
                    <h1 className="text-5xl lg:text-6xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-[0.85] mb-3">
                      Khởi tạo <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Kế hoạch sản xuất</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] max-w-2xl text-sm font-bold leading-relaxed uppercase tracking-wide opacity-80">
                      Giao thức gom đơn hàng chi nhánh và phân bổ năng lực <span className="text-amber-500">bếp trung tâm</span> chuyên sâu.
                    </p>
                </div>

                <div className="bg-[var(--bg-card)]/40 backdrop-blur-xl border border-[var(--border-primary)] rounded-full px-10 h-20 flex items-center justify-center gap-6 shadow-2xl relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-full" />
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic">Batch Selection</span>
                    <span className="text-2xl font-black text-amber-500 italic tabular-nums leading-none mt-1">{selectedOrderIds.size} <span className="text-[10px] text-[var(--text-secondary)] ml-1">Đơn hàng</span></span>
                  </div>
                  <div className="w-px h-8 bg-[var(--border-primary)]"></div>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/kitchen/order-pool")}
                    className="h-12 w-12 flex items-center justify-center bg-[var(--bg-root)]/50 border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-amber-500 rounded-full transition-all group/back shadow-sm"
                  >
                    <ArrowLeft size={18} />
                  </Button>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4">

      {/* Wizard Content */}
      <div className="relative min-h-[500px]">
        {step === 1 && (
          <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* HUB & CONFIG DASHBOARD */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
              
              <div className="p-8 md:p-10 space-y-8 relative z-10">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 border-b border-[var(--border-primary)]/10 pb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-black shadow-xl shadow-amber-500/10 rotate-2">
                        <Package size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight italic">
                        Hub Điều Phối Trung Tâm
                      </h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-[0.2em] italic">Matrix Center Control</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest italic leading-none">Vận hành tối ưu</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 bg-[var(--bg-root)] p-3 rounded-[2rem] border border-[var(--border-primary)] shadow-inner">
                    <div className="text-right px-4">
                      <p className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-[0.2em] flex items-center justify-end gap-2 italic">
                        {isCapacityLoading && (
                          <RefreshCw className="animate-spin h-3 w-3 text-amber-500" />
                        )}
                        Tổng công suất hệ thống hôm nay
                      </p>
                      <div className="flex items-end justify-end gap-2 tabular-nums mt-1">
                        <span className="text-3xl font-black text-amber-500 italic leading-none drop-shadow-sm">
                          {kitchens.reduce((sum, k) => sum + (k.todayUsedCapacity || 0), 0).toLocaleString()}
                        </span>
                        <span className="text-xl font-black text-[var(--text-secondary)]/20 italic leading-none">/</span>
                        <span className="text-2xl font-black text-[var(--text-primary)] leading-none italic opacity-40">
                          {kitchens.reduce((sum, k) => sum + (k.maxDailyCapacity || 0), 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase ml-2 italic leading-none mb-1">Items</span>
                      </div>
                    </div>

                    <div className="w-px h-10 bg-[var(--border-primary)]/20 hidden md:block"></div>

                    <div className="flex flex-col sm:flex-row gap-4 relative group/date min-w-[200px]">
                      <div className="relative flex-1">
                        <span className="absolute -top-4 left-4 text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic">Ngày sản xuất</span>
                        <CalendarIcon
                          className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 transition-colors"
                          size={16}
                        />
                        <input
                          type="date"
                          value={plannedDate}
                          onChange={(e) => setPlannedDate(e.target.value)}
                          className="w-full pl-12 pr-6 h-14 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-full text-sm font-black text-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/5 transition-all cursor-pointer hover:bg-[var(--bg-root)] shadow-sm italic uppercase"
                          required
                        />
                      </div>

                      <div className="relative flex-1">
                        <span className="absolute -top-4 left-4 text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic text-emerald-500">Dự kiến hoàn thiện</span>
                        <CalendarIcon
                          className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 transition-colors"
                          size={16}
                        />
                        <input
                          type="date"
                          value={expectedCompletedDate}
                          onChange={(e) => setExpectedCompletedDate(e.target.value)}
                          className="w-full pl-12 pr-6 h-14 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-full text-sm font-black text-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all cursor-pointer hover:bg-[var(--bg-root)] shadow-sm italic uppercase"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {kitchens.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    {kitchens.map((kitchen) => {
                      const usedCapacity = kitchen.todayUsedCapacity || 0;
                      const maxCapacity = kitchen.maxDailyCapacity || 1;
                      const capacityPercentage = Math.min(
                        100,
                        Math.round((usedCapacity / maxCapacity) * 100),
                      );
                      const isOverloaded = usedCapacity > maxCapacity;
                      const isSelected = selectedKitchenId === kitchen.kitchenId;

                      return (
                        <div
                          key={kitchen.kitchenId}
                          onClick={() => setSelectedKitchenId(kitchen.kitchenId)}
                          className={cn(
                            "rounded-[2rem] p-6 transition-all group flex flex-col justify-between cursor-pointer relative overflow-hidden border",
                            isSelected
                              ? "bg-amber-500/5 border-amber-500 shadow-xl shadow-amber-500/5 rotate-1"
                              : "bg-[var(--bg-root)] border-[var(--border-primary)] hover:border-amber-500/30 hover:bg-amber-500/[0.02]",
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none"></div>
                          )}
                          <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-xl border flex items-center justify-center transition-all shadow-sm",
                                  isSelected
                                    ? "bg-amber-500 text-black border-amber-400"
                                    : "bg-[var(--bg-card)] border-[var(--border-primary)] text-[var(--text-secondary)]/40 group-hover:text-amber-500",
                                )}
                              >
                                {isSelected ? (
                                  <CheckCircle2 size={18} strokeWidth={3} />
                                ) : (
                                  <ChefHat size={18} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pr-4">
                                <h3
                                  className={cn(
                                    "text-xs font-black tracking-tight uppercase line-clamp-2 leading-tight transition-colors italic",
                                    isSelected
                                      ? "text-amber-600"
                                      : "text-[var(--text-primary)]",
                                  )}
                                  title={kitchen.name}
                                >
                                  {kitchen.name}
                                </h3>
                              </div>
                            </div>
                            <Badge variant={kitchen.currentStatus === "IN_PRODUCTION" ? "orange" : "success"} className="border-0 px-3 py-1 uppercase tracking-widest text-[8px] font-black italic rounded-full shadow-inner h-5">
                                {kitchen.currentStatus === "IN_PRODUCTION" ? "Active" : "Ready"}
                            </Badge>
                          </div>
                          <div>
                            <div className="flex justify-between items-end mb-2 uppercase italic tracking-widest font-black text-[9px]">
                              <span className="text-[var(--text-secondary)]/40">Load Matrix</span>
                              <span
                                className={cn(
                                  "text-[11px]",
                                  isOverloaded ? "text-red-500" : "text-amber-500"
                                )}
                              >
                                {usedCapacity} <span className="opacity-20 translate-y-[-1px] inline-block">/</span> {maxCapacity}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-primary)] p-[2px] shadow-inner">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-1000",
                                  isOverloaded ? "bg-red-500" : "bg-gradient-to-r from-amber-400 to-orange-500",
                                  capacityPercentage > 0 &&
                                    capacityPercentage < 100 &&
                                    "animate-pulse",
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
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
              {/* Left Column (Main Workspace) */}
              <div className="flex-1 min-w-0">
                <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-primary)] overflow-hidden shadow-sm relative group/table">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent"></div>
                  
                  <div className="p-8 border-b border-[var(--border-primary)]/10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight italic">
                        Tuyển chọn Đơn hàng Cấp quyền
                      </h2>
                      <p className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest mt-1 italic">
                        Thẩm định danh sách chờ quyết toán sản xuất (Unassigned)
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[600px] no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-[var(--bg-card)] z-10 border-b border-[var(--border-primary)]/20">
                        <tr className="text-[10px] uppercase font-black text-[var(--text-secondary)]/40 tracking-[0.3em] italic">
                          <th className="px-10 py-6 w-16 text-center">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded-lg border-[var(--border-primary)] bg-[var(--bg-root)] text-amber-500 focus:ring-amber-500/20 cursor-pointer transition-all appearance-none border checked:bg-amber-500 relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-black checked:after:text-[12px] shadow-inner"
                              checked={orders.length > 0 && selectedOrderIds.size === orders.length}
                              onChange={toggleAll}
                            />
                          </th>
                          <th className="px-6 py-6">Đơn định danh</th>
                          <th className="px-6 py-6">Chi nhánh thực thi</th>
                          <th className="px-6 py-6 text-center">Sản lượng</th>
                          <th className="px-6 py-6">Cơ cấu món</th>
                          <th className="px-10 py-6 text-right">Định mức VNĐ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-primary)]/30">
                        {isLoadingOrders ? (
                          <tr>
                            <td colSpan={6} className="px-10 py-40 text-center">
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-16 h-16 border-2 border-amber-500/10 border-t-amber-500 rounded-full animate-spin" />
                                    <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.5em] italic animate-pulse">Đang rà soát tệp tin đơn hàng...</span>
                                </div>
                            </td>
                          </tr>
                        ) : orders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-10 py-40 text-center">
                                <div className="flex flex-col items-center gap-6 opacity-20">
                                    <div className="w-24 h-24 rounded-[3rem] bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)]">
                                        <Package size={48} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--text-secondary)] italic">Hồ sơ unassigned hiện đang trống</span>
                                </div>
                            </td>
                          </tr>
                        ) : (
                          orders.map((order) => (
                            <tr
                              key={order.orderId}
                              className={cn(
                                "hover:bg-[var(--text-primary)]/[0.02] cursor-pointer transition-all group",
                                selectedOrderIds.has(order.orderId)
                                  ? "bg-amber-500/[0.03]"
                                  : "",
                              )}
                              onClick={() => toggleSelection(order.orderId)}
                            >
                              <td className="px-10 py-6 text-center">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 rounded-lg border-[var(--border-primary)] bg-[var(--bg-root)] text-amber-500 focus:ring-amber-500/20 cursor-pointer transition-all appearance-none border checked:bg-amber-500 relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-black checked:after:text-[12px] shadow-inner"
                                  checked={selectedOrderIds.has(order.orderId)}
                                  readOnly
                                />
                              </td>
                              <td className="px-6 py-6">
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-[var(--text-primary)] group-hover:text-amber-500 transition-colors uppercase italic tracking-tighter">
                                    #ORD-{order.orderId}
                                  </span>
                                  <span className="text-[9px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest italic mt-1">
                                    {new Date(order.orderDate).toLocaleTimeString("vi-VN")}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-6 font-black text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors italic uppercase text-xs">
                                {order.storeName || `Chi nhánh #${order.storeId}`}
                              </td>
                              <td className="px-6 py-6 text-center">
                                <div className="inline-flex items-center justify-center px-4 py-1.5 bg-[var(--bg-root)] rounded-xl border border-[var(--border-primary)] shadow-inner">
                                  <span className="text-xs font-black text-amber-500 italic">
                                    {order.orderDetails?.reduce((sum, i) => sum + i.quantity, 0) || 0}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-6">
                                <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                  {order.orderDetails?.slice(0, 2).map((i, idx) => (
                                      <Badge key={idx} variant="secondary" className="bg-[var(--bg-root)] text-[8px] font-black border-[var(--border-primary)] px-2 py-0.5 uppercase italic tracking-tighter rounded-lg">
                                        {i.productName}
                                      </Badge>
                                    ))}
                                  {order.orderDetails && order.orderDetails.length > 2 && (
                                      <span className="text-[9px] text-[var(--text-secondary)]/40 font-black italic ml-1">
                                        +{order.orderDetails.length - 2} Items
                                      </span>
                                    )}
                                </div>
                              </td>
                              <td className="px-10 py-6 text-right">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-black text-[var(--text-primary)] tabular-nums italic">
                                        {(order.totalAmount || 0).toLocaleString()}
                                    </span>
                                    <span className="text-[8px] font-black text-[var(--text-secondary)]/30 uppercase tracking-widest italic leading-none">VNĐ (est.)</span>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sticky Selection Sidebar */}
              <div className="lg:w-[350px] shrink-0 space-y-6">
                <div className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-primary)] shadow-sm sticky top-8 group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/5 transition-all duration-700" />
                   
                   <h3 className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.4em] mb-8 italic">Config Overview</h3>
                   <div className="space-y-6 relative z-10">
                      <div className="p-6 bg-[var(--bg-root)] rounded-[2rem] border border-[var(--border-primary)] space-y-4 shadow-inner">
                        <div className="flex items-center gap-4 border-b border-[var(--border-primary)]/10 pb-4">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm border border-amber-500/20">
                            <ChefHat size={20} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic leading-none mb-1.5">Trạm điều hành</span>
                            <span className="text-xs font-black text-[var(--text-primary)] uppercase truncate italic max-w-[180px]">
                              {kitchens.find((k) => k.kitchenId === selectedKitchenId)?.name || "Chưa xác lập"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm border border-amber-500/20">
                              <CalendarIcon size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic leading-none mb-1.5">Ngày sản xuất</span>
                              <span className="text-xs font-black text-[var(--text-primary)] italic">
                                {new Date(plannedDate).toLocaleDateString("vi-VN", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-500/20">
                              <CalendarIcon size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic leading-none mb-1.5 text-emerald-500">Dự kiến hoàn thành</span>
                              <span className="text-xs font-black text-[var(--text-primary)] italic">
                                {new Date(expectedCompletedDate).toLocaleDateString("vi-VN", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 bg-[var(--bg-root)] rounded-[2.5rem] border border-[var(--border-primary)] shadow-inner text-center">
                        <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic block mb-2">Quy mô mẻ sản xuất</span>
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-5xl font-black text-amber-500 italic drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                              {selectedOrderIds.size}
                            </span>
                            <div className="h-10 w-px bg-[var(--border-primary)]/20 rotate-12" />
                            <div className="text-left">
                                <span className="text-xs font-black text-[var(--text-primary)] uppercase block italic">Batch Unit</span>
                                <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest block italic mt-1">{orders.length} Target Pool</span>
                            </div>
                        </div>
                        <div className="w-full bg-[var(--bg-card)] h-1.5 rounded-full overflow-hidden border border-[var(--border-primary)]/20 shadow-inner mt-8 p-[2px]">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-[1s] cubic-bezier(0.4, 0, 0.2, 1)"
                            style={{
                              width: `${(selectedOrderIds.size / (orders.length || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-4 flex flex-col gap-4">
                        <Button
                          className="w-full h-20 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black uppercase text-[10px] tracking-[0.3em] rounded-[2rem] shadow-xl shadow-amber-500/20 border-0 transition-all hover:scale-[1.03] active:scale-95 italic"
                          onClick={() => setStep(2)}
                          disabled={selectedOrderIds.size === 0}
                        >
                          Phân tích Đề xuất <ChevronRight size={20} className="ml-3" />
                        </Button>
                        <p className="text-[9px] text-[var(--text-secondary)]/40 font-black text-center px-6 italic leading-relaxed uppercase tracking-wider">Giao thức tiếp theo sẽ thực thi tổng hợp nhu cầu vĩnh cửu từ tệp đơn tuyển chọn.</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-right-8 duration-700 pb-20">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[4rem] overflow-hidden shadow-sm relative group/summary">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500/50 via-teal-500/50 to-emerald-500/50"></div>
              
              <div className="p-10 border-b border-[var(--border-primary)]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10 bg-[var(--text-primary)]/[0.01]">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[2rem] bg-emerald-500 shadow-xl shadow-emerald-500/10 flex items-center justify-center text-black rotate-2">
                    <ClipboardCheck size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter italic">
                      Chi tiết Kế hoạch Elite
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="orange" className="text-[8px] px-3 py-1 h-5 border-0 font-black uppercase tracking-[0.2em] italic rounded-full shadow-inner">Dự thảo hệ thống</Badge>
                      <span className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest leading-none italic">Verified Batch Aggregate</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 bg-[var(--bg-root)] p-6 rounded-[2.5rem] border border-[var(--border-primary)] shadow-inner min-w-full md:min-w-[500px]">
                  <div className="space-y-1.5 italic">
                    <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest leading-none block">Bếp Thực thi</span>
                    <p className="text-[11px] font-black text-[var(--text-primary)] uppercase truncate">{kitchens.find((k) => k.kitchenId === selectedKitchenId)?.name}</p>
                  </div>
                  <div className="space-y-1.5 border-l border-[var(--border-primary)]/10 pl-6 italic">
                    <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest leading-none block">Thời điểm</span>
                    <p className="text-[11px] font-black text-[var(--text-primary)]">
                       {new Date(plannedDate).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>
                  <div className="space-y-1.5 border-l border-[var(--border-primary)]/10 pl-6 italic">
                    <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest leading-none block">Phụ trách</span>
                    <p className="text-[11px] font-black text-[var(--text-primary)] uppercase truncate">{user?.name || "Matrix Admin"}</p>
                  </div>
                  <div className="space-y-1.5 border-l border-[var(--border-primary)]/10 pl-6 italic">
                    <span className="text-[9px] font-black text-amber-600/60 uppercase tracking-widest leading-none block">Dự kiến</span>
                    <p className="text-[11px] font-black text-amber-500 italic">
                      {new Date(expectedCompletedDate).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>
                  <div className="space-y-1.5 border-l border-[var(--border-primary)]/10 pl-6 italic">
                    <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest leading-none block">Quy mô</span>
                    <p className="text-[11px] font-black text-emerald-500 uppercase">{selectedOrderIds.size} Orders</p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-8">
                <div className="flex justify-between items-center px-4">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <h3 className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.3em] italic">Tổng hợp Nhu cầu vĩnh cửu</h3>
                  </div>
                  <Badge variant="info" className="text-[10px] text-indigo-500 font-black px-4 h-6 bg-indigo-500/10 border-indigo-500/20 rounded-full tracking-widest italic">{aggregatedDemand.length} Loại sản phẩm</Badge>
                </div>

                <div className="rounded-[2.5rem] border border-[var(--border-primary)] bg-[var(--bg-root)]/50 overflow-hidden shadow-inner max-h-[400px] no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[var(--bg-root)] z-10 border-b border-[var(--border-primary)]/10">
                      <tr className="bg-[var(--bg-root)] text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic">
                        <th className="px-10 py-6">Thành phẩm & Mã hiệu định danh</th>
                        <th className="px-10 py-6 text-right w-60">Sản lượng đề xuất</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)]/5">
                      {aggregatedDemand.map((item, i) => (
                        <tr
                          key={i}
                          className="hover:bg-emerald-500/[0.02] transition-colors group"
                        >
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-6">
                              <div className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] flex items-center justify-center text-emerald-500/50 group-hover:text-emerald-500 group-hover:bg-emerald-500/5 transition-all shadow-sm">
                                <Package size={18} />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-base font-black text-[var(--text-primary)] tracking-tight group-hover:text-emerald-500 transition-colors uppercase italic">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-[var(--text-secondary)]/40 font-black tracking-widest uppercase italic font-mono">
                                  IDENTIFIER: <strong className="text-indigo-500/60 ml-1">#{item.productId}</strong>
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-6 text-right">
                            <div className="inline-flex items-center gap-4 tabular-nums">
                              <span className="text-3xl font-black text-[var(--text-primary)] group-hover:text-emerald-500 transition-colors italic drop-shadow-sm">
                                {item.quantity}
                              </span>
                              <span className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic">Ước tính (Units)</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-emerald-500/[0.03] rounded-[3rem] border border-emerald-500/10 p-10 flex flex-col md:flex-row items-center justify-between gap-10 group/yield relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-3xl -mr-20 -mt-20 group-hover/yield:bg-emerald-500/10 transition-all duration-1000" />
                  
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/5 border border-emerald-500/20 rotate-3 group-hover/yield:rotate-6 transition-transform">
                      <LayoutGrid size={28} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em] italic">Phê quyết tổng lượng thực thi</span>
                      <p className="text-xs text-[var(--text-secondary)]/60 font-medium italic uppercase leading-relaxed max-w-[280px]">Dựa trên sự tuyển chọn tinh hoa từ {selectedOrderIds.size} hồ sơ đơn hàng chi nhánh.</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 relative z-10">
                    <div className="flex items-center justify-end">
                      {selectedKitchenId && kitchensInfo[selectedKitchenId] && (
                        <Badge
                          className={cn(
                            "text-[9px] font-black px-4 py-1.5 border-0 h-6 uppercase tracking-widest italic rounded-full shadow-inner",
                            aggregatedDemand.reduce((s, i) => s + i.quantity, 0) > kitchensInfo[selectedKitchenId].remaining
                              ? "bg-red-500/20 text-red-600"
                              : "bg-emerald-500/20 text-emerald-600",
                          )}
                        >
                          {aggregatedDemand.reduce((s, i) => s + i.quantity, 0) > kitchensInfo[selectedKitchenId].remaining
                            ? "Khả dụng: Thâm hụt công suất"
                            : "Khả dụng: Đạt tiêu chuẩn tối ưu"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col items-end pt-1">
                      <span className="text-6xl font-black text-emerald-500 tracking-[ -0.05em] italic tabular-nums leading-none drop-shadow-[0_10px_30px_rgba(16,185,129,0.2)]">
                        {aggregatedDemand.reduce((s, i) => s + i.quantity, 0)}
                      </span>
                      <span className="text-[11px] font-black text-emerald-500/40 uppercase tracking-[0.4em] italic mt-4 leading-none text-right">Aggregate Total Units Output</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-10 px-8">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="text-[var(--text-secondary)]/40 hover:text-emerald-500 hover:bg-emerald-500/5 font-black uppercase text-[11px] tracking-[0.4em] h-16 rounded-full px-12 transition-all italic border border-transparent hover:border-emerald-500/20"
              >
                <ArrowLeft size={18} className="mr-3" /> Quay lại trạm kiểm soát
              </Button>

              <Button
                onClick={onSubmit}
                className="h-24 bg-gradient-to-br from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-black font-black uppercase text-[11px] tracking-[0.4em] rounded-[2.5rem] px-16 shadow-2xl shadow-emerald-500/20 border-0 transition-all hover:scale-[1.05] active:scale-95 italic"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-4">
                    <RefreshCw className="animate-spin h-6 w-6" />
                    <span>Đang niêm phong...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Save size={24} /> 
                    <span>Chốt & Kích hoạt mẻ sản xuất</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};
