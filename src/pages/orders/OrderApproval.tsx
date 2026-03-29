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
import { productApi } from "../../services/product.api";
import type { ProductResponse } from "../../types/product";
import { storeOrderApi } from "../../services/storeOrderApi";
import type { StoreOrderResponse } from "../../types/storeOrder";
import { toast } from "react-hot-toast";
import { OrderDetailDrawer } from "./OrderDetailDrawer";
import { RescheduleModal } from "../../components/orders/RescheduleModal";
import type { OrderDetailResponse } from "../../types/storeOrder";
import { kitchenInventoryApi } from "../../services/kitchenInventory.api";
import { useAuth } from "../../hooks/useAuth";

export const OrderApproval = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<StoreOrderResponse[]>(
    [],
  );
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockMap, setStockMap] = useState<Record<number, number>>({});

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
      const ordersPromise = storeOrderApi.getAllOrders({
        size: 100,
        status: "SUBMITTED",
      });
      const productsPromise = productApi
        .getProducts({ size: 100 })
        .catch((err) => {
          console.error("Failed to fetch products:", err);
          return { data: { content: [] } };
        });

      const [ordersRes, productsRes] = await Promise.all([
        ordersPromise,
        productsPromise,
      ]);

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
      const productsData = extract(productsRes);

      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setProducts(productsData);
      setSelectedOrderIds(new Set());

      // Fetch stock data
      const kitchenId = user?.kitchenId || (kitchens.length > 0 ? kitchens[0].kitchenId : null);
      if (kitchenId) {
        try {
          const stockRes = await kitchenInventoryApi.getWarehouseStock(kitchenId);
          const map: Record<number, number> = {};
          (stockRes.data || []).forEach(item => {
            if (item.itemId) map[item.itemId] = (map[item.itemId] || 0) + item.quantity;
          });
          setStockMap(map);
        } catch (err) {
          console.error("Failed to fetch stock:", err);
        }
      }
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
      cell: (order) => (
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          {(order.orderDetails || [])
            .slice(0, 3)
            .map((item: OrderDetailResponse, idx: number) => {
              const stock = stockMap[item.productId] || 0;
              const isLow = stock < item.quantity;
              return (
                <div key={idx} className="flex flex-col gap-0.5 group/prod">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1 h-1 rounded-full shrink-0 transition-colors",
                      isLow ? "bg-red-500" : "bg-emerald-500"
                    )} />
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors truncate">
                      {item.productName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pl-3">
                    <span className="text-[9px] font-black text-[var(--text-secondary)]/30 uppercase tracking-widest italic">Stock:</span>
                    <span className={cn(
                      "text-[9px] font-black italic",
                      isLow ? "text-red-500" : "text-emerald-500"
                    )}>
                      {stock} parts
                    </span>
                  </div>
                </div>
              );
            })}
          {order.orderDetails.length > 3 && (
            <span className="text-[10px] text-amber-500/50 font-black italic pl-3 mt-1">
              +{order.orderDetails.length - 3} sx...
            </span>
          )}
        </div>
      ),
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
            <span className="text-[8px] text-[var(--text-secondary)] font-black uppercase tracking-widest leading-none">
              QTY
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
              <span className="text-amber-500/80 font-black tracking-[0.2em] text-[10px] uppercase italic">Order Approval Intelligence</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                <div>
                    <h1 className="text-5xl lg:text-6xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-[0.85] mb-3">
                      Phê duyệt <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Đơn hàng chi nhánh</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] max-w-2xl text-sm font-bold leading-relaxed uppercase tracking-wide opacity-80">
                      Giao thức thẩm định nhu cầu từ các chi nhánh SteakChain, tối ưu hóa <span className="text-amber-500">tồn kho</span> và năng lực sản xuất thực tế.
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="bg-[var(--bg-card)]/40 backdrop-blur-xl border border-[var(--border-primary)] rounded-3xl px-8 py-5 flex flex-col items-end shadow-2xl relative group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent" />
                      <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] italic mb-1">Hệ thống sản xuất</span>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                           <span className="text-2xl font-black text-amber-500 italic tabular-nums leading-none">
                            {(kitchens || []).reduce((sum, k) => sum + (k.todayUsedCapacity ?? 0), 0).toLocaleString()}
                            <span className="text-[10px] text-[var(--text-secondary)]/40 mx-1">/</span>
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

      <div className="max-w-[1600px] mx-auto px-4 space-y-8">
        {/* Coordination Dashboard Slider */}
        <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x">
          {(kitchens || []).map((kitchen) => {
            const isProducing = kitchen.currentStatus === "IN_PRODUCTION";
            const usedCapacity = kitchen.todayUsedCapacity ?? 0;
            const maxCapacity = kitchen.maxDailyCapacity || 1;
            const usagePercent = Math.min(Math.round((usedCapacity / maxCapacity) * 100), 100);
            
            return (
              <div key={kitchen.kitchenId} className="flex-shrink-0 w-80 snap-center bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[2rem] p-6 hover:border-amber-500/30 transition-all group/card relative overflow-hidden shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Package size={14} />
                    </div>
                    <span className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-tight italic">{kitchen.name}</span>
                  </div>
                  <Badge className={cn("border-0 text-[8px] font-black px-2 py-0.5 uppercase italic rounded-full", isProducing ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                    {isProducing ? "Producing" : "Ready"}
                  </Badge>
                </div>
                <div className="h-1.5 w-full bg-[var(--bg-root)] rounded-full overflow-hidden p-[1.5px] border border-[var(--border-primary)]/10">
                  <div className={cn("h-full rounded-full transition-all duration-1000", usagePercent > 90 ? "bg-red-500" : "bg-gradient-to-r from-amber-400 to-orange-500")} style={{ width: `${usagePercent}%` }} />
                </div>
                <div className="flex justify-between mt-2">
                   <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase italic tracking-widest">{usagePercent}% MATRIX LOAD</span>
                   <span className="text-[9px] font-black text-amber-500 italic">{usedCapacity}/{maxCapacity}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Operational Area */}
        <div className="flex gap-8">
          {/* Main Table Section */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between gap-6 bg-[var(--bg-card)] p-4 rounded-[2.5rem] border border-[var(--border-primary)] shadow-sm">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md group">
                  <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/40 group-focus-within:text-amber-500 transition-colors" />
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
                      <select className="bg-transparent text-[10px] font-black text-[var(--text-secondary)] focus:outline-none cursor-pointer uppercase italic" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                        <option value="all">Sản phẩm</option>
                        {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                   </div>
                   <div className="bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-2xl px-4 h-14 flex items-center gap-3">
                      <Calendar size={16} className="text-amber-500" />
                      <select className="bg-transparent text-[10px] font-black text-[var(--text-secondary)] focus:outline-none cursor-pointer uppercase italic" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
                        <option value="all">Ngày giao</option>
                        {dateOptions.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                   </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg border-0 transition-all flex items-center gap-2 shrink-0 disabled:opacity-30 italic"
                  onClick={() => handleApprove(Array.from(selectedOrderIds))}
                  disabled={selectedOrderIds.size === 0 || isProcessing}
                >
                  <CheckCircle2 size={16} /> Duyệt {selectedOrderIds.size > 0 ? selectedOrderIds.size : ""} Đơn
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

          {/* Catalog Sidebar */}
          <div className="w-[400px] flex flex-col gap-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] p-8 shadow-sm flex flex-col h-full group/catalog">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight italic">Tồn kho vận hành</h3>
                    <p className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest italic mt-1">Matrix Resource Control</p>
                  </div>
               </div>

               <div className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/40" size={16} />
                  <input
                    placeholder="Tìm sản phẩm nhanh..."
                    className="w-full bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-2xl h-14 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)]"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                  />
               </div>

               <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                  {Array.from(new Set(products.map(p => p.category?.name || "Khác"))).map((cat, ci) => (
                    <div key={ci} className="space-y-4">
                      <div className="flex items-center gap-4 px-2">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] italic">{cat}</span>
                        <div className="flex-1 h-px bg-[var(--border-primary)]/10" />
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {products
                          .filter(p => (p.category?.name || "Khác") === cat)
                          .filter(p => !productSearchTerm || p.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
                          .map((p, pi) => (
                          <div key={pi} className="p-5 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] border-transparent hover:border-amber-500/20 transition-all group/item shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-black text-[var(--text-primary)] uppercase italic leading-tight group-hover:text-amber-500 transition-colors">{p.name}</span>
                              <Badge className="bg-amber-500/10 text-amber-500 text-[8px] border-0 h-4 font-black italic">{stockMap[p.id] || 0} unit</Badge>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-black italic text-[var(--text-secondary)]/40 uppercase tracking-widest">
                               <span>{p.unit}</span>
                               <span className="text-amber-500/60 tabular-nums">{(p.price || 0).toLocaleString()} VNĐ</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
              <h3 className="text-sm font-black text-emerald-500 uppercase italic mb-6">Đơn hàng khả thi</h3>
              <div className="space-y-3">
                {filteredOrders.filter(o => validationResults[o.orderId]?.isFeasible).slice(0, 5).map(o => (
                  <div key={o.orderId} className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                    <span className="text-xs font-bold">ORD-{o.orderId}</span>
                    <Badge className="bg-emerald-500 text-black border-0 text-[10px]">Safe</Badge>
                  </div>
                ))}
              </div>
           </div>
           <div className="bg-red-500/5 p-8 rounded-[2.5rem] border border-red-500/10">
              <h3 className="text-sm font-black text-red-500 uppercase italic mb-6">Cảnh báo quá tải</h3>
              <div className="space-y-3">
                {filteredOrders.filter(o => !validationResults[o.orderId]?.isFeasible).slice(0, 5).map(o => (
                  <div key={o.orderId} className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                    <span className="text-xs font-bold">ORD-{o.orderId}</span>
                    <Badge className="bg-red-500 text-white border-0 text-[10px]">Overload</Badge>
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
             <h2 className="text-2xl font-black text-red-500 uppercase italic mb-2">Từ chối đơn hàng</h2>
             <p className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest mb-8">Yêu cầu xác minh lý do hệ thống</p>
             <textarea
               className="w-full h-40 bg-[var(--bg-root)] border border-[var(--border-primary)] rounded-3xl p-6 text-sm italic font-bold placeholder:opacity-20 focus:outline-none focus:ring-4 focus:ring-red-500/5"
               placeholder="Nhập lý do chi tiết..."
               value={rejectReason}
               onChange={(e) => setRejectReason(e.target.value)}
             />
             <div className="mt-8 flex flex-col gap-3">
                <Button className="h-16 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs rounded-2xl italic shadow-lg shadow-red-500/20" onClick={handleReject} disabled={isProcessing}>
                  Xác nhận từ chối matrix
                </Button>
                <Button variant="ghost" onClick={() => setShowRejectModal(false)} className="h-12 font-black uppercase text-[10px] text-[var(--text-secondary)]">Quay lại</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
