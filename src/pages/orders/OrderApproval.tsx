import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Package,
  Leaf,
  Scissors,
  Sparkles,
  X,
  Save,
  RefreshCw,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { cn } from "../../utils/classNames";
import { useOrderValidation } from "../../hooks/useOrderValidation";

import { storeOrderApi } from "../../services/storeOrderApi";
import type {
  StoreOrderResponse,
  MaterialPreviewResponse,
} from "../../types/storeOrder";
import { toast } from "react-hot-toast";
import { OrderDetailDrawer } from "./OrderDetailDrawer";
import { RescheduleModal } from "../../components/orders/RescheduleModal";
import type { OrderDetailResponse } from "../../types/storeOrder";

import { useAuth } from "../../hooks/useAuth";

export const OrderApproval = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<StoreOrderResponse[]>(
    [],
  );
  const [previewData, setPreviewData] =
    useState<MaterialPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Selection & Drawer state
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(
    new Set(),
  );
  const [selectedOrder, setSelectedOrder] = useState<StoreOrderResponse | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Reject Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingOrderId, setRejectingOrderId] = useState<number | null>(null);

  // Reschedule state
  const [rescheduleData, setRescheduleData] = useState<{
    id: number;
    date: string;
    totalQuantity: number;
  } | null>(null);
  const [rescheduledId, setRescheduledId] = useState<number | null>(null);
  const [isCoordinationModalOpen, setIsCoordinationModalOpen] = useState(false);

  // Capacity Analysis hook
  const { validationResults, totalMaxCapacity, kitchens } =
    useOrderValidation(orders);

  // Filter states
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");

  // Derived filter options
  const productOptions = Array.from(
    new Set(
      orders.flatMap((o) =>
        o.orderDetails.map((d: OrderDetailResponse) => d.productName),
      ),
    ),
  ).sort();

  const dateOptions = Array.from(
    new Set(
      orders.map((o) =>
        o.deliveryDate
          ? new Date(o.deliveryDate).toLocaleDateString("vi-VN")
          : "N/A",
      ),
    ),
  ).sort();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const ordersRes = await storeOrderApi.getAllOrders({
        size: 100,
        status: "SUBMITTED",
      });

      const extract = (res: any): any[] => {
        if (!res) return [];
        if (res.data) {
          if (res.data.content) return res.data.content;
          if (Array.isArray(res.data)) return res.data;
          return [];
        }
        if (res.content) return res.content;
        if (Array.isArray(res)) return res;
        return [];
      };

      const ordersData = extract(ordersRes);

      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setSelectedOrderIds(new Set());
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Gặp lỗi khi tải dữ liệu đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.kitchenId, kitchens.length]);

  // Material Preview Effect
  useEffect(() => {
    let active = true;
    const fetchPreview = async () => {
      const kitchenId =
        user?.kitchenId || (kitchens.length > 0 ? kitchens[0].kitchenId : 1);
      setIsLoadingPreview(true);
      try {
        const preview = await storeOrderApi.previewMaterial({
          kitchenId,
          orderIds: Array.from(selectedOrderIds),
        });
        if (active) setPreviewData(preview);
      } catch (err) {
        console.error("Failed to fetch material preview:", err);
      } finally {
        if (active) setIsLoadingPreview(false);
      }
    };

    // Execute after mount
    if (user?.kitchenId || kitchens.length > 0) {
      const timeoutId = setTimeout(() => {
        fetchPreview();
      }, 300); // 300ms debounce
      return () => {
        active = false;
        clearTimeout(timeoutId);
      };
    }
  }, [selectedOrderIds, user?.kitchenId, kitchens.length]);

  useEffect(() => {
    let result = orders.filter((o) => o.status === "SUBMITTED");

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          String(o.orderId).includes(lowerQuery) ||
          String(o.storeId).includes(lowerQuery) ||
          (o.storeName && o.storeName.toLowerCase().includes(lowerQuery)),
      );
    }

    if (selectedProduct !== "all") {
      result = result.filter((o) =>
        o.orderDetails.some(
          (d: OrderDetailResponse) => d.productName === selectedProduct,
        ),
      );
    }

    if (selectedDate !== "all") {
      result = result.filter(
        (o) =>
          (o.deliveryDate
            ? new Date(o.deliveryDate).toLocaleDateString("vi-VN")
            : "N/A") === selectedDate,
      );
    }

    setFilteredOrders(result);
  }, [orders, searchQuery, selectedProduct, selectedDate]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(new Set(filteredOrders.map((o) => o.orderId)));
    } else {
      setSelectedOrderIds(new Set());
    }
  };

  const handleSelectOne = (orderId: number, checked: boolean) => {
    const newSet = new Set(selectedOrderIds);
    if (checked) newSet.add(orderId);
    else newSet.delete(orderId);
    setSelectedOrderIds(newSet);
  };

  const isCapacityFeasibleForArray = (orderIds: number[]): boolean => {
    return orderIds.every((id) => validationResults[id]?.isFeasible);
  };

  const handleApprove = async (orderIds: number[]) => {
    if (orderIds.length === 0) return;
    setIsProcessing(true);
    try {
      await Promise.all(orderIds.map((id) => storeOrderApi.approveOrder(id)));
      toast.success(`Đã duyệt thành công ${orderIds.length} đơn hàng.`);
      fetchData();
      setSelectedOrder(null);
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error("Duyệt đơn hàng thất bại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }

    const targetIds =
      rejectingOrderId !== null
        ? [rejectingOrderId]
        : Array.from(selectedOrderIds);

    setIsProcessing(true);
    try {
      await Promise.all(
        targetIds.map((id) => storeOrderApi.rejectOrder(id, rejectReason)),
      );
      toast.success(`Đã từ chối ${targetIds.length} đơn hàng.`);

      setShowRejectModal(false);
      setRejectReason("");
      setRejectingOrderId(null);
      fetchData();
      setSelectedOrder(null);
    } catch (error) {
      console.error("Rejection failed:", error);
      toast.error("Từ chối đơn hàng thất bại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (orderId?: number) => {
    setRejectingOrderId(orderId || null);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const columns: Column<StoreOrderResponse>[] = [
    {
      header: (
        <div className="pl-1">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-root)] text-amber-500 focus:ring-amber-500 focus:ring-offset-[var(--bg-root)]"
            checked={
              filteredOrders.length > 0 &&
              selectedOrderIds.size === filteredOrders.length
            }
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
        </div>
      ),
      className: "w-[40px] px-0",
      headerClassName: "px-2 py-3",
      cellClassName: "px-2 py-4",
      cell: (order) => (
        <div className="pl-1" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-root)] text-amber-500 focus:ring-amber-500 focus:ring-offset-[var(--bg-root)]"
            checked={selectedOrderIds.has(order.orderId)}
            onChange={(e) => handleSelectOne(order.orderId, e.target.checked)}
          />
        </div>
      ),
    },
    {
      header: <div className="w-full text-center">ĐƠN HÀNG</div>,
      accessorKey: "orderId",
      className: "font-bold text-[var(--text-primary)] min-w-[70px]",
      headerClassName: "px-2 py-3",
      cellClassName: "px-2 py-4",
      cell: (order) => (
        <div className="flex justify-center w-full">
          <span className="font-black text-[11px] text-[var(--text-primary)] tabular-nums tracking-tighter bg-[var(--bg-card)]/50 px-2 py-1 rounded-lg">
            #{order.orderId}
          </span>
        </div>
      ),
    },
    {
      header: "NGÀY ĐẶT",
      className: "whitespace-nowrap min-w-[90px]",
      headerClassName: "px-2 py-3",
      cellClassName: "px-2 py-4",
      cell: (order) => (
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] text-[var(--text-primary)] font-bold tracking-tight">
            {new Date(order.orderDate).toLocaleDateString("vi-VN")}
          </span>
          <span className="text-[10px] text-[var(--text-secondary)] font-black tracking-widest uppercase mt-0.5">
            {new Date(order.orderDate).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      header: "CỬA HÀNG",
      className: "min-w-[110px]",
      headerClassName: "px-2 py-3",
      cellClassName: "px-2 py-4",
      cell: (order) => (
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-[var(--text-primary)] text-[12px] truncate max-w-[140px]">
            {order.storeName || `Cửa hàng #${order.storeId}`}
          </span>
          <span className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-0.5">
            ID: {order.storeId}
          </span>
        </div>
      ),
    },
    {
      header: "SẢN PHẨM",
      className: "min-w-[180px]",
      headerClassName: "px-2 py-3",
      cellClassName: "px-2 py-4",
      cell: (order) => {
        const orderResult = previewData?.orderResults?.find(
          (r) => r.orderId === order.orderId,
        );
        const isApprovable = orderResult ? orderResult.approvable : undefined;

        return (
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <div className="mb-1">
              {isApprovable !== undefined && (
                <Badge
                  className={cn(
                    "border-0 text-[8px] font-black px-2 py-0.5 uppercase italic rounded-full inline-flex",
                    isApprovable
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-red-500/10 text-red-500",
                  )}
                >
                  {isApprovable ? "Thỏa mãn NVL" : "Thiếu NVL"}
                </Badge>
              )}
            </div>
            {(order.orderDetails || [])
              .slice(0, 3)
              .map((item: OrderDetailResponse, idx: number) => (
                <div key={idx} className="flex flex-col gap-0.5 group/prod">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-1 h-1 rounded-full shrink-0 transition-colors bg-[var(--text-secondary)]/30" />
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors break-words line-clamp-2 leading-tight">
                      {item.productName}
                    </span>
                    <Badge className="bg-[var(--bg-root)] border border-[var(--border-primary)]/50 text-[var(--text-secondary)] text-[9px] px-1.5 py-0 rounded-md font-black italic shadow-sm shrink-0">
                      x{item.quantity}
                    </Badge>
                  </div>
                </div>
              ))}
            {order.orderDetails.length > 3 && (
              <span className="text-[10px] text-amber-500/50 font-black italic pl-3 mt-1">
                +{order.orderDetails.length - 3} món...
              </span>
            )}
            {orderResult && !orderResult.approvable && (
              <span className="text-[9px] text-red-400 font-bold italic mt-1 leading-tight line-clamp-2">
                Lý do: {orderResult.reason}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: <div className="w-full text-center">SỐ LƯỢNG</div>,
      className: "min-w-[70px]",
      headerClassName: "px-2 py-3",
      cellClassName: "px-2 py-4",
      cell: (order) => {
        const total = order.orderDetails.reduce(
          (acc: number, curr: OrderDetailResponse) => acc + curr.quantity,
          0,
        );
        return (
          <div className="flex items-baseline justify-center gap-1 w-full">
            <span className="text-[var(--text-primary)] font-black text-sm tabular-nums leading-none">
              {total}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest leading-none">
              PHẦN
            </span>
          </div>
        );
      },
    },
    {
      header: <div className="w-full text-center">NGÀY GIAO</div>,
      className: "min-w-[80px]",
      headerClassName: "px-2 py-3",
      cellClassName: "px-2 py-4",
      cell: (order) => (
        <div className="flex justify-center w-full">
          <span
            className={cn(
              "font-bold text-[11px] tracking-tight whitespace-nowrap px-2 py-1 rounded-lg transition-all",
              rescheduledId === order.orderId
                ? "animate-pulse bg-amber-500/20 text-amber-500"
                : "text-[var(--text-primary)]",
            )}
          >
            {order.deliveryDate
              ? new Date(order.deliveryDate).toLocaleDateString("vi-VN")
              : "N/A"}
          </span>
        </div>
      ),
    },
    {
      header: "HÀNH ĐỘNG",
      className: "min-w-[140px]",
      headerClassName: "px-1 py-3 text-center",
      cellClassName: "px-0 py-4",
      cell: (order) => (
        <div
          className="flex justify-center w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center bg-[var(--bg-root)]/40 p-0.5 rounded-lg border border-[var(--border-primary)] shadow-inner">
            <div className="flex items-center gap-0.5 px-0.5 border-r border-[var(--border-primary)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOrder(order)}
                className="h-7 w-7 p-0 text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/10 rounded-md transition-all"
                title="Xem chi tiết"
              >
                <Eye size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setRescheduleData({
                    id: order.orderId,
                    date: order.deliveryDate,
                    totalQuantity: order.orderDetails.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    ),
                  })
                }
                className="h-7 w-7 p-0 text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/10 rounded-md transition-all"
                title="Đổi ngày"
              >
                <Calendar size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/orders/${order.orderId}/split`)}
                className="h-7 w-7 p-0 text-[var(--text-secondary)] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-all"
                title="Tách đơn"
              >
                <Scissors size={14} />
              </Button>
            </div>

            <div className="flex items-center px-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openRejectModal(order.orderId)}
                disabled={isProcessing}
                className="h-7 w-7 p-0 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                title="Từ chối"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-root)] pb-20">
      {/* Cinematic Header Area */}
      <div className="relative h-[280px] -mx-4 -mt-8 mb-12 overflow-hidden group/header">
        <div className="absolute inset-0 bg-[var(--bg-root)]">
          <img
            src="https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=2069&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-80 scale-105 group-hover/header:scale-110 transition-transform duration-[3s] ease-out shadow-inner"
            alt="Order Approval Hub"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-root)] via-[var(--bg-root)]/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-root)] via-transparent to-[var(--bg-root)]"></div>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end px-8 pb-10 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-3 mb-4">
            <Badge
              variant="orange"
              className="text-[10px] font-black tracking-[0.3em] px-3 h-5 border-0 bg-amber-500/10 text-amber-500 uppercase italic"
            >
              ADMINISTRATOR ELITE
            </Badge>
            <div className="h-px w-12 bg-amber-500/30" />
            <span className="text-amber-500/80 font-black tracking-[0.2em] text-[10px] uppercase italic">
              Order Approval Intelligence
            </span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-[0.85] mb-3">
                Phê duyệt{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
                  Đơn hàng chi nhánh
                </span>
              </h1>
              <p className="text-[var(--text-secondary)] max-w-2xl text-sm font-bold leading-relaxed uppercase tracking-wide opacity-80">
                Giao thức thẩm định nhu cầu từ các chi nhánh SteakChain, tối ưu
                hóa <span className="text-amber-500">tồn kho</span> và năng lực
                sản xuất thực tế.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="bg-[var(--bg-card)]/40 backdrop-blur-xl border border-[var(--border-primary)] rounded-3xl px-8 py-5 flex flex-col items-end shadow-2xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col items-end">
                  <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic mb-1">
                    Hệ thống sản xuất
                  </span>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-2xl font-black text-amber-500 italic tabular-nums leading-none">
                        {(kitchens || [])
                          .reduce(
                            (sum, k) => sum + (k.todayUsedCapacity ?? 0),
                            0,
                          )
                          .toLocaleString()}
                        <span className="text-[10px] text-[var(--text-secondary)]/40 mx-1">
                          /
                        </span>
                        {totalMaxCapacity.toLocaleString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCoordinationModalOpen(true)}
                      className="h-10 px-4 bg-amber-500 text-black border-0 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.05] shadow-lg shadow-amber-500/20"
                    >
                      <Sparkles size={14} className="mr-2" /> Gợi ý matrix
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 space-y-8">
        {/* Catalog Horizontal Top Bar */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] p-6 shadow-sm flex flex-col gap-6 group/catalog">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0">
                <Package size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight italic flex items-center gap-3">
                  Tồn kho vận hành
                  {isLoadingPreview && (
                    <RefreshCw
                      size={14}
                      className="animate-spin text-amber-500"
                    />
                  )}
                </h3>
                <p className="text-[9px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest italic mt-0.5">
                  {previewData?.approvableOrderCount ?? 0}/
                  {previewData?.selectedOrderCount ?? 0} Đơn khả thi (
                  {previewData?.approvableRatePercent ?? 0}%)
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-[300px]">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/40"
                size={16}
              />
              <input
                placeholder="Tìm nguyên liệu nhanh..."
                className="w-full bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-2xl h-12 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)]"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar snap-x">
            {(previewData?.materials || [])
              .filter(
                (m) =>
                  !productSearchTerm ||
                  m.materialName
                    .toLowerCase()
                    .includes(productSearchTerm.toLowerCase()),
              )
              .map((m, idx) => {
                const isShortage = m.shortageQty > 0;

                return (
                  <div
                    key={idx}
                    className="w-[260px] shrink-0 p-5 rounded-3xl bg-[var(--bg-root)] border border-[var(--border-primary)] hover:border-amber-500/30 transition-all group/item shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <span className="text-[13px] font-black text-[var(--text-primary)] uppercase italic leading-tight group-hover:text-amber-500 transition-colors line-clamp-2">
                        {m.materialName}
                      </span>
                      <Badge
                        className={cn(
                          "text-[10px] px-2.5 py-0.5 border-0 font-black italic whitespace-nowrap shrink-0",
                          isShortage
                            ? "bg-red-500/10 text-red-500"
                            : "bg-amber-500/10 text-amber-500",
                        )}
                      >
                        AVL: {m.availableQty}
                      </Badge>
                    </div>

                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest border-b border-[var(--border-primary)]/10 pb-1">
                        <span className="text-[var(--text-secondary)]/50">
                          Cần cho đơn chờ:
                        </span>
                        <span className="text-[var(--text-primary)]">
                          {m.requiredQtyForSelected} {m.unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest pt-1">
                        <span className="text-[var(--text-secondary)]/50">
                          Còn dư:
                        </span>
                        <span
                          className={cn(
                            isShortage ? "text-red-500" : "text-emerald-500",
                          )}
                        >
                          {isShortage
                            ? `Thiếu ${m.shortageQty}`
                            : `${m.remainingQty}`}{" "}
                          {m.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            {(!previewData?.materials ||
              previewData.materials.length === 0) && (
              <div className="w-full py-8 text-center text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest italic opacity-50">
                Chưa có dữ liệu tồn kho
              </div>
            )}
          </div>
        </div>

        {/* Operational Area */}
        <div className="flex flex-col gap-8">
          {/* Main Table Section */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between gap-6 bg-[var(--bg-card)] p-4 rounded-[2.5rem] border border-[var(--border-primary)] shadow-sm">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md group">
                  <Search
                    size={18}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/40 group-focus-within:text-amber-500 transition-colors"
                  />
                  <Input
                    placeholder="Tìm theo Mã đơn, Cửa hàng..."
                    className="pl-14 h-14 bg-[var(--bg-root)] border-[var(--border-primary)] focus:border-amber-500/40 focus:ring-amber-500/5 rounded-3xl transition-all text-xs font-bold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-2xl px-4 h-14 flex items-center gap-3">
                    <Package size={16} className="text-amber-500" />
                    <select
                      className="bg-transparent text-[10px] font-black text-[var(--text-secondary)] focus:outline-none cursor-pointer uppercase italic"
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                    >
                      <option value="all">Sản phẩm</option>
                      {productOptions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-2xl px-4 h-14 flex items-center gap-3">
                    <Calendar size={16} className="text-amber-500" />
                    <select
                      className="bg-transparent text-[10px] font-black text-[var(--text-secondary)] focus:outline-none cursor-pointer uppercase italic"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    >
                      <option value="all">Ngày giao</option>
                      {dateOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg border-0 transition-all flex items-center gap-2 shrink-0 disabled:opacity-30 italic"
                  onClick={() => {
                    const approvableIds = Array.from(selectedOrderIds).filter(
                      (id) =>
                        previewData?.orderResults?.find((r) => r.orderId === id)
                          ?.approvable !== false,
                    );
                    if (approvableIds.length > 0) {
                      handleApprove(approvableIds);
                    } else {
                      toast.error(
                        "Không có đơn hàng nào đủ điều kiện phê duyệt!",
                      );
                    }
                  }}
                  disabled={selectedOrderIds.size === 0 || isProcessing}
                >
                  <CheckCircle2 size={16} /> Duyệt khả thi (
                  {
                    Array.from(selectedOrderIds).filter(
                      (id) =>
                        previewData?.orderResults?.find((r) => r.orderId === id)
                          ?.approvable !== false,
                    ).length
                  }
                  ) Đơn
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => openRejectModal()}
                  disabled={selectedOrderIds.size === 0 || isProcessing}
                  className="h-14 px-6 text-red-500 hover:bg-red-500/5 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shrink-0 italic"
                >
                  Từ chối hàng loạt
                </Button>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] shadow-sm overflow-hidden group/table">
              <div className="overflow-auto custom-scrollbar">
                <DataTable
                  data={filteredOrders}
                  columns={columns}
                  layout="fixed"
                  keyExtractor={(order) => String(order.orderId)}
                  isLoading={isLoading}
                  className="[&_thead]:bg-[var(--bg-root)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isCoordinationModalOpen}
        onClose={() => setIsCoordinationModalOpen(false)}
        size="xl"
        title="Gợi ý Điều phối"
      >
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/10">
            <h3 className="text-sm font-black text-emerald-500 uppercase italic mb-6">
              Đơn hàng khả thi
            </h3>
            <div className="space-y-3">
              {filteredOrders
                .filter((o) => validationResults[o.orderId]?.isFeasible)
                .slice(0, 5)
                .map((o) => (
                  <div
                    key={o.orderId}
                    className="flex justify-between items-center bg-white/5 p-4 rounded-xl"
                  >
                    <span className="text-xs font-bold">ORD-{o.orderId}</span>
                    <Badge className="bg-emerald-500 text-black border-0 text-[10px]">
                      Safe
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
          <div className="bg-red-500/5 p-8 rounded-[2.5rem] border border-red-500/10">
            <h3 className="text-sm font-black text-red-500 uppercase italic mb-6">
              Cảnh báo quá tải
            </h3>
            <div className="space-y-3">
              {filteredOrders
                .filter((o) => !validationResults[o.orderId]?.isFeasible)
                .slice(0, 5)
                .map((o) => (
                  <div
                    key={o.orderId}
                    className="flex justify-between items-center bg-white/5 p-4 rounded-xl"
                  >
                    <span className="text-xs font-bold">ORD-{o.orderId}</span>
                    <Badge className="bg-red-500 text-white border-0 text-[10px]">
                      Overload
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Modal>

      {rescheduleData && (
        <RescheduleModal
          isOpen={true}
          onClose={() => setRescheduleData(null)}
          orderId={rescheduleData.id}
          currentDeliveryDate={rescheduleData.date}
          totalQuantity={rescheduleData.totalQuantity}
          onSuccess={() => fetchData()}
        />
      )}

      <OrderDetailDrawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onStatusUpdate={(id, s) => {
          if (s === "APPROVED") handleApprove([id]);
          else if (s === "REJECTED") openRejectModal(id);
        }}
      />

      {showRejectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-red-500 uppercase italic mb-2">
              Từ chối đơn hàng
            </h2>
            <p className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest mb-8">
              Yêu cầu xác minh lý do hệ thống
            </p>
            <textarea
              className="w-full h-40 bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-3xl p-6 text-sm italic font-bold placeholder:opacity-20 focus:outline-none focus:ring-4 focus:ring-red-500/5"
              placeholder="Nhập lý do chi tiết..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="mt-8 flex flex-col gap-3">
              <Button
                className="h-16 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs rounded-2xl italic shadow-lg shadow-red-500/20"
                onClick={handleReject}
                disabled={isProcessing}
              >
                Xác nhận từ chối matrix
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowRejectModal(false)}
                className="h-12 font-black uppercase text-[10px] text-[var(--text-secondary)]"
              >
                Quay lại
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
