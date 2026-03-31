import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Truck,
  ArrowLeft,
  Save,
  CheckCircle2,
  Calendar,
  MapPin,
  ClipboardList,
  Info as InfoIcon,
  PlusCircle,
  Trash2,
  Package,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { shipmentApi } from "../../services/shipment.api";
import { productionPlanApi } from "../../services/productionPlan.api";
import { storeOrderApi } from "../../services/storeOrderApi";
import type {
  CreateShipmentRequest,
  AhamoveServiceIdType,
} from "../../types/shipment";
import type { StoreResponse } from "../../types/store";
import type { StoreOrderResponse } from "../../types/storeOrder";
import type { ProductionPlanSummaryResponse } from "../../types/productionPlan";
import { cn } from "../../utils/classNames";

export const CreateShipment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Data States
  const [availablePlans, setAvailablePlans] = useState<
    ProductionPlanSummaryResponse[]
  >([]);
  const [availableStores, setAvailableStores] = useState<StoreResponse[]>([]);
  const [allOrders, setAllOrders] = useState<StoreOrderResponse[]>([]);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    ahamoveServiceId: "SGN-BIKE" as AhamoveServiceIdType,
    productionPlanId: "",
    remarks: "",
    shippingFee: "",
    dropPoints: [
      {
        id: Date.now(),
        storeId: "",
        storeOrderIds: [] as number[],
        remarks: "",
      },
    ],
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle auto-fill from Allocation Matrix
  useEffect(() => {
    const state = location.state as {
      planId?: number;
      planName?: string;
      storeIds?: number[];
    } | null;
    if (!state?.planId || form.productionPlanId) return;

    const updates: Partial<typeof form> = {
      productionPlanId: state.planId.toString(),
    };

    setForm((prev) => ({ ...prev, ...updates }));
    toast.success(`Đang tải dữ liệu từ Kế hoạch #${state.planId}...`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Auto-populate logic when planId changes
  useEffect(() => {
    const autoPopulateFromPlan = async () => {
      if (!form.productionPlanId) return;
      const planIdNum = Number(form.productionPlanId);

      setIsLoading(true);
      setAllOrders([]); // Clear old orders to prevent mixing
      setAvailableStores([]); // Clear old stores
      try {
        const [rawPlanRes, ordersRes] = await Promise.all([
          productionPlanApi.getProductionPlanDetail(planIdNum),
          storeOrderApi.getAllOrders({
            productionPlanId: planIdNum,
            size: 1000, // Fetch more to be sure
          }),
        ]);

        // Robust extraction for planDetail
        const planDetailRes: any = rawPlanRes;
        const planDetail = planDetailRes?.data || planDetailRes;

        if (!planDetail || (!planDetail.planId && !planDetailRes.planId)) {
          toast.error(`Dữ liệu Kế hoạch #${planIdNum} không hợp lệ.`);
          return;
        }

        // Robust extraction from either ordersRes.data.content or ordersRes.content
        const resData: any = ordersRes;
        const rawOrders =
          resData?.data?.content ||
          resData?.content ||
          (Array.isArray(resData?.data) ? resData.data : []) ||
          (Array.isArray(resData) ? resData : []);

        const planOrders: StoreOrderResponse[] = rawOrders.filter((o: any) => {
          // Robust extraction of plan ID from object
          const orderPlanId = o.batchId || o.planId || o.productionPlanId;
          const isValidStatus = ["READY", "ALLOCATED", "APPROVED"].includes(
            o.status,
          );
          return (
            isValidStatus &&
            (!o.shipmentStopId || o.shipmentStopId === null) &&
            String(orderPlanId) === String(planIdNum)
          );
        });
        setAllOrders(planOrders);

        if (planOrders.length === 0) {
          toast.error(
            "Không tìm thấy đơn hàng SẴN SÀNG (chưa gán xe) cho kế hoạch này.",
          );
          setForm((prev) => ({ ...prev, dropPoints: [] }));
          return;
        }

        toast.success(
          `Đã lấy ${planOrders.length} đơn hàng READY cho kế hoạch.`,
        );

        // Tự động map các cửa hàng và đơn hàng
        const storeMap = new Map<number, StoreOrderResponse[]>();
        planOrders.forEach((o: StoreOrderResponse) => {
          if (!storeMap.has(o.storeId)) {
            storeMap.set(o.storeId, []);
          }
          storeMap.get(o.storeId)!.push(o);
        });

        const storeIds = Array.from(storeMap.keys());
        const newDropPoints = storeIds.map((storeId, idx) => ({
          id: Date.now() + idx,
          storeId: storeId.toString(),
          storeOrderIds: storeMap.get(storeId)!.map((o) => o.orderId),
          remarks: "",
        }));

        setForm((prev) => ({
          ...prev,
          dropPoints: newDropPoints,
        }));

        // Update available stores for this plan
        const stores = storeIds
          .map((id) => {
            const o = planOrders.find(
              (x: StoreOrderResponse) => x.storeId === id,
            );
            return {
              id,
              name: o?.storeName || `Chi nhánh ${id}`,
            } as StoreResponse;
          })
          .filter(Boolean);
        setAvailableStores(stores);
        toast.success(
          `Đã tự động chọn ${newDropPoints.length} chi nhánh và ${planOrders.length} đơn hàng từ Kế hoạch: ${planDetail.planName || "#" + planIdNum}`,
        );
      } catch (err: any) {
        console.error("Failed to auto-populate from plan:", err);
        if (err.response?.status === 404) {
          toast.error(
            `Không tìm thấy Kế hoạch #${planIdNum}. Vui lòng kiểm tra lại mã Kế hoạch.`,
          );
        } else {
          toast.error("Có lỗi xảy ra khi tải dữ liệu Kế hoạch & Đơn hàng");
        }
      } finally {
        setIsLoading(false);
      }
    };

    autoPopulateFromPlan();
  }, [form.productionPlanId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [planRes] = await Promise.all([
        productionPlanApi.getAllProductionPlans({ size: 200 }),
      ]);

      // Robust extraction for plans similarly
      const resPlan: any = planRes;
      const rawPlans = resPlan?.data?.content || resPlan?.content || [];

      const validPlans = rawPlans.filter((p: any) => p.status === "FINISHED");

      // No need to fetch all orders anymore as we fetch per plan selected
      setAvailablePlans(validPlans);
    } catch {
      toast.error("Không thể tải các lựa chọn ban đầu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    const productionPlanId = Number(form.productionPlanId);

    if (!productionPlanId)
      return toast.error("Vui lòng chọn Kế hoạch sản xuất");
    if (!form.ahamoveServiceId)
      return toast.error("Vui lòng chọn loại xe hỗ trợ.");

    const validDropPoints = form.dropPoints.filter(
      (dp) => dp.storeId && dp.storeOrderIds.length > 0,
    );

    if (validDropPoints.length === 0) {
      return toast.error("Cần ít nhất 1 điểm giao có gắn đơn hàng.");
    }

    // Ensure no duplicate stores in drop points
    const storeIds = validDropPoints.map((dp) => dp.storeId);
    if (new Set(storeIds).size !== storeIds.length) {
      return toast.error("Các điểm giao không được trùng lặp cửa hàng.");
    }

    setIsSubmitting(true);
    try {
      const request: CreateShipmentRequest = {
        ahamoveServiceId: form.ahamoveServiceId,
        productionPlanId,
        storeId: Number(validDropPoints[0].storeId),
        storeOrderIds: validDropPoints[0].storeOrderIds,
        remarks: form.remarks || undefined,
        shippingFee: form.shippingFee ? Number(form.shippingFee) : undefined,
        dropPoints: validDropPoints.map((dp) => ({
          storeId: Number(dp.storeId),
          storeOrderIds: dp.storeOrderIds,
          remarks: dp.remarks || undefined,
        })),
      };

      console.log("Shipment Payload:", request);

      const response = await shipmentApi.createShipment(request);

      // Automatically mark the shipment as PREPARED (Sẵn sàng) right after creation
      if (response && response.shipmentId) {
        try {
          await shipmentApi.prepareShipment(response.shipmentId);
        } catch (e) {
          console.error("Auto-prepare failed:", e);
          // We don't block the success message if only prepare fails,
          // since the shipment was created anyway.
        }
      }

      toast.success("Đơn vận chuyển đã được tạo thành công!");
      navigate("/shipment");
    } catch (error: any) {
      console.error("Shipment error:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi tạo đơn vận chuyển",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const addDropPoint = () => {
    setForm((prev) => ({
      ...prev,
      dropPoints: [
        ...prev.dropPoints,
        { id: Date.now(), storeId: "", storeOrderIds: [], remarks: "" },
      ],
    }));
  };

  const removeDropPoint = (id: number) => {
    setForm((prev) => ({
      ...prev,
      dropPoints: prev.dropPoints.filter((dp) => dp.id !== id),
    }));
  };

  const updateDropPoint = (id: number, field: string, value: any) => {
    setForm((prev) => {
      const newDropPoints = prev.dropPoints.map((dp) => {
        if (dp.id === id) {
          const updated = { ...dp, [field]: value };
          // Reset orders if store changed
          if (field === "storeId" && dp.storeId !== value) {
            updated.storeOrderIds = [];
          }
          return updated;
        }
        return dp;
      });
      return { ...prev, dropPoints: newDropPoints };
    });
  };

  const toggleOrderForDropPoint = (dropPointId: number, orderId: number) => {
    setForm((prev) => ({
      ...prev,
      dropPoints: prev.dropPoints.map((dp) => {
        if (dp.id === dropPointId) {
          const current = [...dp.storeOrderIds];
          if (current.includes(orderId)) {
            return {
              ...dp,
              storeOrderIds: current.filter((id) => id !== orderId),
            };
          } else {
            return { ...dp, storeOrderIds: [...current, orderId] };
          }
        }
        return dp;
      }),
    }));
  };

  const toggleAllOrdersForDropPoint = (
    dropPointId: number,
    storeId: string,
  ) => {
    const branchOrders = allOrders.filter(
      (o) =>
        o.storeId.toString() === storeId &&
        ["ALLOCATED", "APPROVED", "READY"].includes(o.status) &&
        (!form.productionPlanId || o.planId === Number(form.productionPlanId)),
    );

    setForm((prev) => ({
      ...prev,
      dropPoints: prev.dropPoints.map((dp) => {
        if (dp.id === dropPointId) {
          if (dp.storeOrderIds.length === branchOrders.length) {
            return { ...dp, storeOrderIds: [] };
          } else {
            return { ...dp, storeOrderIds: branchOrders.map((o) => o.orderId) };
          }
        }
        return dp;
      }),
    }));
  };

  const getTotalOrdersSelected = () => {
    return form.dropPoints.reduce(
      (acc, dp) => acc + dp.storeOrderIds.length,
      0,
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-root)] pb-20">
      {/* Cinematic Header */}
      <div className="relative h-[380px] w-full overflow-hidden group/header">
        <div className="absolute inset-0 bg-[var(--bg-root)]">
          <img
            src="https://images.unsplash.com/photo-1549194380-f30671841d6c?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-40 scale-105 group-hover/header:scale-110 transition-transform duration-[3s] ease-out shadow-inner"
            alt="Industrial Logistics"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-root)] via-[var(--bg-root)]/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-root)] via-transparent to-[var(--bg-root)]"></div>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="orange" className="text-[10px] font-black tracking-[0.3em] px-3 py-1 border-0 uppercase bg-amber-500/10 text-amber-500">
              ĐIỀU PHỐI VẬN HÀNH
            </Badge>
            <div className="h-px w-12 bg-amber-500/30" />
            <span className="text-amber-500/80 font-black tracking-[0.2em] text-[10px] uppercase italic">Trung Tâm Điều Hành</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/shipment")}
                  className="h-12 w-12 flex items-center justify-center bg-[var(--bg-card)]/20 border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-amber-500 hover:text-black rounded-2xl transition-all shadow-2xl"
                >
                  <ArrowLeft size={20} strokeWidth={3} />
                </Button>
                <h1 className="text-6xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-[0.85]">
                  TẠO <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">CHUYẾN HÀNG</span>
                </h1>
              </div>
              <p className="text-zinc-400 max-w-xl text-sm font-bold leading-relaxed uppercase tracking-wide opacity-80">
                Tạo lệnh xuất kho cho bộ phận <span className="text-amber-500">Bếp trung tâm</span>. Khởi tạo quy trình vận chuyển đa điểm.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/shipment")}
                className="h-16 px-10 border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] uppercase text-[11px] font-black tracking-[0.2em] rounded-2xl transition-all"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting || isLoading}
                className="h-16 px-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-[0_20px_50px_-10px_rgba(245,158,11,0.4)] border-0 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
              >
                {isSubmitting ? (
                  "Đang gửi..."
                ) : (
                  <>
                    <Save size={20} strokeWidth={3} /> Gửi đến bếp
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-10 relative z-10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Primary Info Card */}
            <div className="backdrop-blur-3xl bg-[var(--bg-card)]/40 border border-[var(--border-primary)] rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>

              <div>
                <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <ClipboardList size={18} strokeWidth={2.5} />
                  </div>
                  Cấu hình cốt lõi
                </h2>
                <p className="text-[10px] text-[var(--text-secondary)]/80 font-bold mt-2 uppercase tracking-widest ml-11">
                  Thiết lập kế hoạch và phương thức vận tải cho luồng đối soát
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                    Kế hoạch sản xuất (Core Plan)
                  </label>
                  <div className="relative group/input">
                    <select
                      className="w-full appearance-none pl-12 pr-6 h-16 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] rounded-2xl text-[11px] font-black tracking-widest uppercase text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all cursor-pointer hover:bg-[var(--bg-root)]"
                      value={
                        availablePlans.some(
                          (p: ProductionPlanSummaryResponse) =>
                            p.planId.toString() === form.productionPlanId,
                        )
                          ? form.productionPlanId
                          : ""
                      }
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          productionPlanId: e.target.value,
                        }))
                      }
                    >
                      <option value="" className="bg-[var(--bg-card)] text-[var(--text-secondary)] whitespace-pre">-- CHỌN KẾ HOẠCH --</option>
                      {[...availablePlans]
                        .sort(
                          (
                            a: ProductionPlanSummaryResponse,
                            b: ProductionPlanSummaryResponse,
                          ) => Number(b.planId) - Number(a.planId),
                        )
                        .map((p: ProductionPlanSummaryResponse) => (
                          <option key={p.planId} value={p.planId} className="bg-[var(--bg-card)]">
                            PLAN #{p.planId} - {p.planName}
                          </option>
                        ))}
                    </select>
                    <Calendar
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within/input:text-amber-500 transition-colors"
                      size={20}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">
                    Loại xe vận chuyển (AhaMove)
                  </label>
                  <div className="relative group/input">
                    <select
                      className="w-full appearance-none pl-12 pr-6 h-16 bg-amber-500/5 border border-amber-500/30 rounded-2xl text-[11px] font-black tracking-widest uppercase text-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all cursor-pointer hover:bg-amber-500/10 shadow-lg shadow-amber-900/10"
                      value={form.ahamoveServiceId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          ahamoveServiceId: e.target
                            .value as AhamoveServiceIdType,
                        }))
                      }
                    >
                      <option value="SGN-BIKE" className="bg-[var(--bg-card)] text-amber-500">BIKE (XE MÁY)</option>
                      <option value="SGN-TRUCK-500" className="bg-[var(--bg-card)] text-amber-500">TRUCK (XE TẢI 500KG)</option>
                      <option value="SGN-TRUCK-1000" className="bg-[var(--bg-card)] text-amber-500">TRUCK (XE TẢI 1000KG)</option>
                      <option value="SGN-PREMIUM" className="bg-[var(--bg-card)] text-amber-500">PREMIUM (GIAO SIÊU TỐC)</option>
                    </select>
                    <Truck
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500"
                      size={20}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Drop Points Card */}
            <div className="backdrop-blur-3xl bg-[var(--bg-card)]/40 border border-[var(--border-primary)] rounded-[3rem] p-10 space-y-10 shadow-2xl relative">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                      <MapPin size={18} strokeWidth={2.5} />
                    </div>
                    Lộ trình & Các điểm giao
                  </h2>
                  <p className="text-[10px] text-[var(--text-secondary)]/80 font-bold mt-2 uppercase tracking-widest ml-11">
                    Tổ chức thứ tự điểm đến cho đội ngũ vận tải
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 h-10 px-5 transition-all shadow-lg shadow-amber-900/10"
                  onClick={addDropPoint}
                >
                  <PlusCircle size={14} strokeWidth={3} /> Thêm điểm giao
                </Button>
              </div>

              <div className="space-y-8">
                {form.dropPoints.map((dp, idx) => {
                  const branchOrders = dp.storeId
                    ? allOrders.filter(
                      (o: any) => String(o.storeId) === String(dp.storeId),
                    )
                    : [];

                  const unshippedOrders = branchOrders.filter((o: any) =>
                    ["ALLOCATED", "APPROVED", "READY"].includes(o.status),
                  );

                  return (
                    <div
                      key={dp.id}
                      className="p-8 bg-[var(--bg-root)]/40 border border-[var(--border-primary)] rounded-[2rem] space-y-6 relative group/row transition-all hover:bg-[var(--bg-root)]/60"
                    >
                      <div className="absolute -left-4 -top-4 w-12 h-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] flex items-center justify-center font-black text-amber-500 text-lg shadow-xl shadow-black/50 tracking-tighter italic">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      {form.dropPoints.length > 1 && (
                        <button
                          onClick={() => removeDropPoint(dp.id)}
                          className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 transition-colors p-2"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}

                      <div className="space-y-4 pt-2 w-full md:w-3/4">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                          Cửa hàng đích (STOP UNIT)
                        </label>
                        <div className="relative group/input">
                          <select
                            className="w-full appearance-none pl-12 pr-6 h-14 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] rounded-2xl text-[11px] font-black tracking-widest uppercase text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all cursor-pointer hover:bg-[var(--bg-root)]"
                            value={dp.storeId}
                            onChange={(e) =>
                              updateDropPoint(dp.id, "storeId", e.target.value)
                            }
                          >
                            <option value="" className="bg-[var(--bg-card)] text-[var(--text-secondary)] whitespace-pre">-- CHỌN CHI NHÁNH --</option>
                            {availableStores.map((s) => {
                              const sId = (s as any).id || (s as any).storeId;
                              const isSelectedByOther = form.dropPoints.some(
                                (otherDp) =>
                                  otherDp.id !== dp.id &&
                                  otherDp.storeId === sId.toString(),
                              );
                              return (
                                <option
                                  key={sId}
                                  value={sId}
                                  disabled={isSelectedByOther}
                                  className="bg-[var(--bg-card)]"
                                >
                                  {s.name} (CN #{sId}){" "}
                                  {isSelectedByOther ? "- ĐÃ ĐỊNH TUYẾN" : ""}
                                </option>
                              );
                            })}
                          </select>
                          <MapPin
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within/input:text-amber-500 transition-colors"
                            size={18}
                          />
                        </div>
                      </div>

                      {/* Orders Selection for this drop point */}
                      {dp.storeId && (
                        <div className="space-y-6 pt-4 border-t border-[var(--border-primary)]/50">
                          {/* Chưa vận chuyển Section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                                Đơn hàng khả dụng (READY)
                              </label>
                              {unshippedOrders.length > 0 && (
                                <button
                                  onClick={() =>
                                    toggleAllOrdersForDropPoint(dp.id, dp.storeId)
                                  }
                                  className="text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest transition-colors px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 shadow-inner italic"
                                >
                                  {dp.storeOrderIds.length ===
                                    unshippedOrders.length
                                    ? "HỦY CHỌN TẤT CẢ"
                                    : "CHỌN TOÀN BỘ ĐƠN"}
                                </button>
                              )}
                            </div>

                            <div className="border border-[var(--border-primary)] rounded-2xl overflow-hidden bg-[var(--bg-root)]/20 backdrop-blur-sm">
                              {unshippedOrders.length > 0 ? (
                                <div className="divide-y divide-[var(--border-primary)]/30 max-h-72 overflow-y-auto custom-scrollbar">
                                  {unshippedOrders.map((order) => (
                                    <div
                                      key={order.orderId}
                                      onClick={() =>
                                        toggleOrderForDropPoint(
                                          dp.id,
                                          order.orderId,
                                        )
                                      }
                                      className={cn(
                                        "flex items-center gap-5 p-5 cursor-pointer transition-all group/item",
                                        dp.storeOrderIds.includes(order.orderId)
                                          ? "bg-amber-500/5 shadow-inner"
                                          : "hover:bg-zinc-800/20",
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shadow-lg shrink-0",
                                          dp.storeOrderIds.includes(order.orderId)
                                            ? "bg-amber-500 border-amber-500 text-black shadow-amber-900/20"
                                            : "border-zinc-800 bg-zinc-900 group-hover/item:border-zinc-600",
                                        )}
                                      >
                                        {dp.storeOrderIds.includes(
                                          order.orderId,
                                        ) && (
                                            <CheckCircle2
                                              size={12}
                                              strokeWidth={4}
                                            />
                                          )}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                          <span className="text-[13px] font-black text-[var(--text-primary)] uppercase tracking-tighter">
                                            Đơn hàng #{order.orderId}
                                          </span>
                                          <Badge
                                            variant="orange"
                                            className="text-[9px] px-2 py-0 h-4 border-0 uppercase bg-emerald-500/10 text-emerald-500 font-black tracking-widest"
                                          >
                                            {order.status}
                                          </Badge>
                                        </div>
                                        <div className="mt-3 space-y-2">
                                          <div className="flex flex-wrap gap-1.5">
                                            {order.orderDetails?.map(
                                              (item, idx) => (
                                                <div
                                                  key={idx}
                                                  className="text-[9px] font-black bg-[var(--bg-root)]/80 text-zinc-400 px-2.5 py-1 rounded-lg border border-[var(--border-primary)] flex items-center gap-2 uppercase tracking-tight"
                                                >
                                                  <span className="text-amber-500 italic">
                                                    {item.quantity}×
                                                  </span>
                                                  <span className="truncate max-w-[150px]">
                                                    {item.productName}
                                                  </span>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-10 text-center flex flex-col items-center gap-4 opacity-30 grayscale">
                                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
                                    <Package size={32} className="text-zinc-600" />
                                  </div>
                                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] italic">
                                    KHÔNG CÓ ĐƠN SẴN SÀNG
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping Fee Card */}
            <div className="backdrop-blur-3xl bg-[var(--bg-card)]/40 border border-[var(--border-primary)] rounded-[3rem] p-10 space-y-8 shadow-2xl">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Phí vận chuyển (VNĐ) — Bỏ trống nếu qua AhaMove
                </label>
                <div className="relative group/input">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Ví dụ: 50000"
                    className="w-full pl-12 pr-6 h-16 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] rounded-2xl text-[13px] font-black text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all placeholder:text-[var(--text-secondary)]/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none uppercase tracking-widest"
                    value={form.shippingFee}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        shippingFee: e.target.value,
                      }))
                    }
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 text-lg font-black italic">
                    ₫
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (Sidebar) */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8 self-start">
            {/* Summary Widget */}
            <div className="backdrop-blur-3xl bg-[var(--bg-card)]/40 border border-[var(--border-primary)] rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>

              <div>
                <h2 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <Truck size={18} strokeWidth={2.5} />
                  </div>
                  TỔNG QUAN VẬN HÀNH
                </h2>
                <p className="text-[9px] text-zinc-500 font-bold mt-2 uppercase tracking-widest ml-11">
                  Tổng hợp thông tin kế hoạch vận chuyển                  </p>
              </div>

              <div className="space-y-5">
                <div className="p-6 bg-[var(--bg-root)]/60 border border-[var(--border-primary)] rounded-2xl flex items-center justify-between group/stat hover:bg-[var(--bg-root)] transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest italic group-hover/stat:text-amber-500/80 transition-colors">ĐIỂM DỪNG TUYẾN</span>
                    <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter leading-none italic">
                      {form.dropPoints.filter(dp => dp.storeId).length.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover/stat:text-amber-500 group-hover/stat:border-amber-500/20 transition-all">
                    <MapPin size={24} strokeWidth={2.5} />
                  </div>
                </div>

                <div className="p-6 bg-[var(--bg-root)]/60 border border-[var(--border-primary)] rounded-2xl flex items-center justify-between group/stat hover:bg-[var(--bg-root)] transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest italic group-hover/stat:text-amber-500/80 transition-colors">ĐƠN ĐÃ CHỌN</span>
                    <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter leading-none italic">
                      {getTotalOrdersSelected().toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover/stat:text-amber-500 group-hover/stat:border-amber-500/20 transition-all">
                    <Package size={24} strokeWidth={2.5} />
                  </div>
                </div>

                <div className="relative pt-4 border-t border-[var(--border-primary)]/50 group/input">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-3 block">
                    GHI CHÚ (TÙY CHỌN)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-[var(--bg-root)]/50 border border-[var(--border-primary)] rounded-2xl p-4 text-[11px] font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40 focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/30 transition-all uppercase tracking-widest"
                    placeholder="NHẬP GHI CHÚ BỔ SUNG..."
                    value={form.remarks}
                    onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                  />
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
                <div className="p-1.5 bg-amber-500 rounded-lg text-black mt-1 shadow-lg shadow-amber-500/30">
                  <InfoIcon size={14} strokeWidth={3} />
                </div>
                <p className="text-[10px] font-black text-amber-500/90 leading-relaxed uppercase tracking-widest italic">
                  Vui lòng kiểm tra kỹ danh sách ĐƠN HÀNG và KẾ HOẠCH đồng bộ trước khi gửi yêu cầu đến bếp.
                </p>
              </div>

              <Button
                onClick={handleCreate}
                disabled={isSubmitting || isLoading || getTotalOrdersSelected() === 0}
                className="w-full h-16 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-900/20 border-0 transition-all hover:-translate-y-1 active:scale-95"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi đến bếp"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
