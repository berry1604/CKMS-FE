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
      // Fail silently, map will just be empty or defaults
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

  // Calculate aggregated demand for Step 3
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
        storeOrderIds: Array.from(selectedOrderIds),
      });

      if (plan && plan.planId) {
        toast.success("Kế hoạch sản xuất đã được tạo thành công.");
      } else {
        toast.success("Kế hoạch sản xuất đã được tạo thành công.");
      }

      navigate("/kitchen/production-plans");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Tạo kế hoạch thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            onClick={() => navigate("/orders/approvals")}
            className="h-10 w-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="orange"
                className="text-[9px] font-black tracking-widest px-2 py-0 border-0 h-4"
              >
                COORDINATOR
              </Badge>
              <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-tight">
                Lập kế hoạch sản xuất
              </h1>
            </div>
            <p className="text-xs text-zinc-500 font-medium tracking-wide">
              Gom các đơn hàng đã duyệt và phân bổ sản xuất cho bếp trung tâm.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Package size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">
                Đã chọn
              </span>
              <span className="text-xs font-black text-zinc-200">
                {selectedOrderIds.size} đơn
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Wizard Content */}
      <div className="relative min-h-[400px]">
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* MERGED TOP PANEL (HUB + CONFIG) */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>

              {/* HUB & CONFIG DASHBOARD */}
              <div className="p-4 space-y-4 relative z-10">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                      <Package size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white uppercase tracking-tight">
                        Hub Điều Phối
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest hidden sm:inline">
                          Trung tâm điều khiển
                        </span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700 hidden sm:inline"></span>
                        <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>{" "}
                          Ổn định
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 xl:gap-6 bg-zinc-950/50 p-2 rounded-xl border border-zinc-800/50">
                    <div className="text-right px-3">
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest flex items-center justify-end gap-1.5">
                        {isCapacityLoading && (
                          <div className="animate-spin h-2 w-2 border-2 border-amber-500 border-t-transparent rounded-full" />
                        )}
                        Tổng công suất
                      </p>
                      <div className="flex items-end justify-end gap-1.5 tabular-nums">
                        <span className="text-xl font-black text-amber-500 leading-none">
                          {kitchens
                            .reduce(
                              (sum, k) => sum + (k.todayUsedCapacity || 0),
                              0,
                            )
                            .toLocaleString()}
                        </span>
                        <span className="text-base font-black text-zinc-600 leading-none">
                          /
                        </span>
                        <span className="text-xl font-black text-white leading-none">
                          {kitchens
                            .reduce(
                              (sum, k) => sum + (k.maxDailyCapacity || 0),
                              0,
                            )
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="w-px h-8 bg-zinc-800/50 hidden md:block"></div>

                    <div className="relative group min-w-[140px]">
                      <CalendarIcon
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 transition-colors"
                        size={14}
                      />
                      <input
                        type="date"
                        value={plannedDate}
                        onChange={(e) => setPlannedDate(e.target.value)}
                        className="w-full pl-9 pr-3 h-10 bg-zinc-900 border border-zinc-700/50 rounded-lg text-xs font-black text-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all cursor-pointer hover:bg-zinc-800 shadow-inner"
                        required
                      />
                    </div>
                  </div>
                </div>

                {kitchens.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
                    {kitchens.map((kitchen) => {
                      const usedCapacity = kitchen.todayUsedCapacity || 0;
                      const maxCapacity = kitchen.maxDailyCapacity || 1;
                      const capacityPercentage = Math.min(
                        100,
                        Math.round((usedCapacity / maxCapacity) * 100),
                      );
                      const isOverloaded = usedCapacity > maxCapacity;
                      const isSelected =
                        selectedKitchenId === kitchen.kitchenId;

                      return (
                        <div
                          key={kitchen.kitchenId}
                          onClick={() =>
                            setSelectedKitchenId(kitchen.kitchenId)
                          }
                          className={cn(
                            "rounded-xl p-3 transition-all group flex flex-col justify-between cursor-pointer relative overflow-hidden",
                            isSelected
                              ? "bg-amber-500/10 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                              : "bg-zinc-950/50 border border-zinc-800/80 hover:border-amber-500/30 hover:bg-zinc-900/50",
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/20 to-transparent pointer-events-none"></div>
                          )}
                          <div className="flex justify-between items-start mb-2 relative z-10">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "w-6 h-6 rounded-md border flex items-center justify-center transition-colors shadow-sm",
                                  isSelected
                                    ? "bg-amber-500 text-black border-amber-400"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:text-amber-500",
                                )}
                              >
                                {isSelected ? (
                                  <CheckCircle2 size={12} strokeWidth={3} />
                                ) : (
                                  <Package size={12} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pr-2">
                                <h3
                                  className={cn(
                                    "text-[10px] font-black tracking-tight uppercase line-clamp-2 leading-tight transition-colors",
                                    isSelected
                                      ? "text-amber-500"
                                      : "text-zinc-200",
                                  )}
                                  title={kitchen.name}
                                >
                                  {kitchen.name}
                                </h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20 shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                              <span className="text-[7px] font-bold text-blue-500 uppercase tracking-widest whitespace-nowrap">
                                {kitchen.currentStatus === "IN_PRODUCTION"
                                  ? "Hoạt động"
                                  : "Sẵn sàng"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-end mb-1">
                              <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">
                                Năng lực
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-black tracking-tight",
                                  isOverloaded
                                    ? "text-red-500"
                                    : "text-amber-500",
                                )}
                              >
                                {usedCapacity}{" "}
                                <span className="text-zinc-600">/</span>{" "}
                                <span className="text-zinc-300">
                                  {maxCapacity}
                                </span>
                              </span>
                            </div>
                            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                              <div
                                className={cn(
                                  "h-full transition-all duration-1000",
                                  isOverloaded ? "bg-red-500" : "bg-amber-500",
                                  capacityPercentage > 0 &&
                                    capacityPercentage < 100 &&
                                    "animate-pulse",
                                )}
                                style={{
                                  width: `${Math.min(100, capacityPercentage)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>{" "}
            {/* END OF HUB DASHBOARD PANEL */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left Column (Main Workspace) */}
              <div className="flex-1 min-w-0">
                {/* BOTTOM PANEL: Chọn đơn hàng */}
                <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/50 overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <h2 className="text-sm font-black text-zinc-100 uppercase tracking-tight">
                        Chọn đơn hàng cần sản xuất
                      </h2>
                      <p className="text-[10px] text-zinc-500 font-medium">
                        Danh sách các đơn hàng đã Approved đang chờ Gom mẻ.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[40vh] min-h-[250px] custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-zinc-900 z-10 border-b border-zinc-800">
                        <tr className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">
                          <th className="px-8 py-4 w-12 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-amber-500/20"
                              checked={
                                selectedOrderIds.size === orders.length &&
                                orders.length > 0
                              }
                              onChange={toggleAll}
                            />
                          </th>
                          <th className="px-4 py-4">Đơn hàng</th>
                          <th className="px-4 py-4">Chi nhánh</th>
                          <th className="px-4 py-4 text-center">Số lượng</th>
                          <th className="px-4 py-4">Chi tiết món</th>
                          <th className="px-8 py-4 text-right">Giá trị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/30">
                        {isLoadingOrders ? (
                          <tr>
                            <td colSpan={6} className="px-8 py-20 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
                            </td>
                          </tr>
                        ) : orders.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-8 py-20 text-center text-zinc-600 font-bold uppercase tracking-widest opacity-30"
                            >
                              Không có đơn hàng nào chờ gom mẻ
                            </td>
                          </tr>
                        ) : (
                          orders.map((order) => (
                            <tr
                              key={order.orderId}
                              className={cn(
                                "hover:bg-zinc-800/20 cursor-pointer transition-colors group",
                                selectedOrderIds.has(order.orderId)
                                  ? "bg-amber-500/[0.03]"
                                  : "",
                              )}
                              onClick={() => toggleSelection(order.orderId)}
                            >
                              <td className="px-8 py-5 text-center">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-amber-500/20 group-hover:border-amber-500/50"
                                  checked={selectedOrderIds.has(order.orderId)}
                                  readOnly
                                />
                              </td>
                              <td className="px-4 py-5">
                                <div className="flex flex-col">
                                  <span className="text-[13px] font-black text-zinc-100 uppercase tracking-tighter">
                                    #ORD-{order.orderId}
                                  </span>
                                  <span className="text-[9px] text-zinc-600 font-medium italic">
                                    Đặt lúc:{" "}
                                    {new Date(
                                      order.orderDate,
                                    ).toLocaleTimeString("vi-VN")}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-5">
                                <span className="text-[13px] font-bold text-zinc-300">
                                  {order.storeName || `Store #${order.storeId}`}
                                </span>
                              </td>
                              <td className="px-4 py-5">
                                <div className="flex items-center justify-center w-10 h-7 bg-zinc-950 rounded-lg border border-zinc-800">
                                  <span className="text-xs font-black text-amber-500">
                                    {order.orderDetails?.reduce(
                                      (sum, i) => sum + i.quantity,
                                      0,
                                    ) || 0}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-5">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {order.orderDetails
                                    ?.slice(0, 2)
                                    .map((i, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[9px] px-1.5 py-0.5 bg-zinc-950/50 text-zinc-500 border border-zinc-800 rounded-md font-medium"
                                      >
                                        {i.productName}
                                      </span>
                                    ))}
                                  {order.orderDetails &&
                                    order.orderDetails.length > 2 && (
                                      <span className="text-[9px] px-1.5 py-0.5 text-zinc-600 font-bold">
                                        +{order.orderDetails.length - 2} món
                                      </span>
                                    )}
                                </div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <span className="text-[13px] font-black text-zinc-100">
                                  {(order.totalAmount || 0).toLocaleString()}{" "}
                                  <span className="text-[9px] text-zinc-500 ml-0.5">
                                    đ
                                  </span>
                                </span>
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
              <div className="lg:w-[280px] shrink-0 space-y-4">
                <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50 shadow-xl">
                  <div>
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">
                      Chi tiết lựa chọn
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800/50 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <ChefHat size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">
                              Bếp Thực Hiện
                            </span>
                            <span className="text-xs font-black text-zinc-200 uppercase truncate max-w-[160px]">
                              {kitchens.find(
                                (k) => k.kitchenId === selectedKitchenId,
                              )?.name || "Chưa chọn"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <CalendarIcon size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">
                              Ngày kế hoạch
                            </span>
                            <span className="text-xs font-black text-zinc-200">
                              {new Date(plannedDate).toLocaleDateString(
                                "vi-VN",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter">
                            Đã chọn
                          </span>
                          <span className="text-xl font-black text-amber-500">
                            {selectedOrderIds.size}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-all duration-500"
                            style={{
                              width: `${(selectedOrderIds.size / (orders.length || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-900/20 border-0"
                      onClick={() => setStep(2)}
                      disabled={selectedOrderIds.size === 0}
                    >
                      Tiếp tục Bước 2{" "}
                      <ChevronRight size={18} className="ml-2" />
                    </Button>
                    <p className="text-[9px] text-zinc-500 font-medium text-center px-4 italic leading-relaxed">
                      Tiếp theo bạn sẽ xem tổng hợp nhu cầu sản xuất từ các đơn
                      hàng đã chọn phía trên.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-4xl mx-auto space-y-4 animate-in slide-in-from-right-8 duration-500">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
              {/* Document Header Decor */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>

              {/* Master Header */}
              <div className="p-5 border-b border-zinc-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center justify-center text-black">
                    <ClipboardCheck size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                      Kế hoạch sản xuất
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="orange"
                        className="text-[7px] px-1 py-0 h-3.5 border-0 font-black uppercase tracking-widest"
                      >
                        Dự thảo
                      </Badge>
                      <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest leading-none">
                        Gom mẻ tổng hợp
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/50 min-w-full md:min-w-[480px]">
                  <div className="space-y-0.5">
                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest leading-none">
                      Bếp thực hiện
                    </span>
                    <p className="text-[10px] font-black text-zinc-100 uppercase truncate max-w-[100px]">
                      {
                        kitchens.find((k) => k.kitchenId === selectedKitchenId)
                          ?.name
                      }
                    </p>
                  </div>
                  <div className="space-y-0.5 border-l border-zinc-800/50 pl-4">
                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest leading-none">
                      Ngày sản xuất
                    </span>
                    <p className="text-[10px] font-black text-zinc-100 italic">
                      {new Date(plannedDate).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="space-y-0.5 border-l border-zinc-800/50 pl-4">
                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest leading-none">
                      Điều phối viên
                    </span>
                    <p className="text-[10px] font-black text-zinc-100 uppercase truncate max-w-[90px]">
                      {user?.name || "---"}
                    </p>
                  </div>
                  <div className="space-y-0.5 border-l border-zinc-800/50 pl-4">
                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest leading-none">
                      Quy mô
                    </span>
                    <p className="text-[10px] font-black text-emerald-500 uppercase">
                      {selectedOrderIds.size} Đơn hàng
                    </p>
                  </div>
                </div>
              </div>

              {/* Aggregated Demand Section */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                      Sản phẩm cần chuẩn bị
                    </h3>
                  </div>
                  <span className="text-[9px] text-zinc-600 font-bold px-2 py-0.5 bg-zinc-950 rounded-md border border-zinc-800 tracking-tighter">
                    {aggregatedDemand.length} loại
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-inner max-h-[300px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-zinc-900 z-10">
                      <tr className="bg-zinc-900 text-[9px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-800/80">
                        <th className="px-6 py-4">Sản phẩm & Mã số</th>
                        <th className="px-6 py-4 text-right w-40">Số lượng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                      {aggregatedDemand.map((item, i) => (
                        <tr
                          key={i}
                          className="hover:bg-amber-500/[0.01] transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full border border-amber-500/30 group-hover:bg-amber-500 transition-all"></div>
                              <div className="flex flex-col">
                                <span className="text-[13px] font-black text-zinc-100 tracking-tight group-hover:text-amber-500 transition-colors uppercase">
                                  {item.name}
                                </span>
                                <span className="text-[9px] text-zinc-700 font-bold tracking-widest uppercase">
                                  MÃ: #{item.productId}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-2 tabular-nums">
                              <span className="text-lg font-black text-zinc-200 group-hover:text-amber-500 transition-colors">
                                {item.quantity}
                              </span>
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                Món
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Footer inside the card to save vertical space */}
                <div className="bg-emerald-500/5 rounded-2xl border border-emerald-500/10 p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <LayoutGrid size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                        Xác nhận tổng lượng
                      </span>
                      <span className="text-[9px] text-zinc-500 font-medium italic leading-none">
                        Dựa trên {selectedOrderIds.size} đơn hàng đã duyệt.
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      {selectedKitchenId && kitchensInfo[selectedKitchenId] && (
                        <Badge
                          className={cn(
                            "text-[8px] font-black px-1.5 py-0 border-0 h-4 uppercase tracking-widest",
                            aggregatedDemand.reduce(
                              (s, i) => s + i.quantity,
                              0,
                            ) > kitchensInfo[selectedKitchenId].remaining
                              ? "bg-red-500/20 text-red-500"
                              : "bg-emerald-500/20 text-emerald-500",
                          )}
                        >
                          {aggregatedDemand.reduce(
                            (s, i) => s + i.quantity,
                            0,
                          ) > kitchensInfo[selectedKitchenId].remaining
                            ? "QUÁ TẢI"
                            : "HỢP LỆ"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-black text-emerald-500 tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        {aggregatedDemand.reduce((s, i) => s + i.quantity, 0)}
                      </span>
                      <span className="text-[9px] font-black text-emerald-500/50 uppercase -mt-0.5 tracking-widest leading-none">
                        Thành phẩm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions buttons closer to the content */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="text-zinc-600 hover:text-white font-black uppercase text-[10px] tracking-widest h-10 transition-colors"
              >
                <ArrowLeft size={14} className="mr-2" /> Quay lại
              </Button>

              <Button
                onClick={onSubmit}
                className="h-14 bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl px-12 shadow-xl shadow-emerald-900/20 border-0 transition-all active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang phê duyệt...</span>
                  </div>
                ) : (
                  <>
                    <Save size={18} className="mr-3" /> chốt & kích hoạt mẻ
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
