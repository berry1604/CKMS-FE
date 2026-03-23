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

export const OrderApproval = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<StoreOrderResponse[]>(
    [],
  );
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    console.log("Fetching OrderApproval data...");
    try {
      // Fetch orders and products separately to be resilient
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

      // Robust extraction utility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Gặp lỗi khi tải dữ liệu đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Only show orders that are in SUBMITTED state for approval
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
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900"
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
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900"
            checked={selectedOrderIds.has(order.orderId)}
            onChange={(e) => handleSelectOne(order.orderId, e.target.checked)}
          />
        </div>
      ),
    },
    {
      header: <div className="w-full text-center">ĐƠN HÀNG</div>,
      accessorKey: "orderId",
      className: "font-bold text-zinc-100 min-w-[70px]",
      headerClassName: "px-2 py-3",
      cellClassName: "px-2 py-4",
      cell: (order) => (
        <div className="flex justify-center w-full">
          <span className="font-black text-[11px] text-zinc-100 tabular-nums tracking-tighter bg-zinc-800/50 px-2 py-1 rounded-lg">
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
          <span className="text-[11px] text-zinc-200 font-bold tracking-tight">
            {new Date(order.orderDate).toLocaleDateString("vi-VN")}
          </span>
          <span className="text-[10px] text-zinc-500 font-black tracking-widest uppercase mt-0.5">
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
          <span className="font-bold text-zinc-200 text-[12px] truncate max-w-[140px]">
            {order.storeName || `Cửa hàng #${order.storeId}`}
          </span>
          <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-0.5">
            ID: {order.storeId}
          </span>
        </div>
      ),
    },
    {
      header: "SẢN PHẨM",
      className: "min-w-[150px]",
      headerClassName: "px-2 py-3",
      cellClassName: "px-2 py-4",
      cell: (order) => (
        <div className="flex flex-col gap-1 min-w-[150px]">
          {(order.orderDetails || [])
            .slice(0, 3)
            .map((item: OrderDetailResponse, idx: number) => (
              <div key={idx} className="flex items-center gap-2 group/prod">
                <div className="w-1 h-1 rounded-full bg-amber-500/30 shrink-0 group-hover/prod:bg-amber-500 transition-colors" />
                <span className="text-[11px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">
                  {item.productName}
                </span>
              </div>
            ))}
          {order.orderDetails.length > 3 && (
            <span className="text-[10px] text-amber-500/50 font-black italic pl-3 mt-1">
              +{order.orderDetails.length - 3} sản phẩm khác...
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
            <span className="text-zinc-100 font-black text-sm tabular-nums leading-none">
              {total}
            </span>
            <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest leading-none">
              ĐV
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
                ? "animate-pulse-once bg-amber-500/20 text-amber-500"
                : "text-zinc-300",
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
        <div className="flex justify-center w-full" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center bg-zinc-950/40 p-0.5 rounded-lg border border-zinc-800/50 shadow-inner">
            <div className="flex items-center gap-0.5 px-0.5 border-r border-zinc-800/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOrder(order)}
                className="h-7 w-7 p-0 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-md transition-all"
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
                className="h-7 w-7 p-0 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-md transition-all"
                title="Đổi ngày"
              >
                <Calendar size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/orders/${order.orderId}/split`)}
                className="h-7 w-7 p-0 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-all"
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
                className="h-7 w-7 p-0 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
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
    <div className="flex flex-col h-screen overflow-hidden bg-black text-white p-6 gap-6">
      {/* 1. High-Density Coordination Status Bar (Hub) */}
      <div className="flex-shrink-0 bg-zinc-900/60 border border-zinc-800 rounded-[32px] p-4 shadow-2xl backdrop-blur-sm relative overflow-hidden group/hub transition-all hover:bg-zinc-900/80">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] -mr-32 -mt-32 rounded-full" />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <AlertCircle size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-zinc-100 uppercase tracking-tight">
                  Hub Điều phối & Phê duyệt
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    Trung tâm Điều phối Thông minh
                  </span>
                  <div className="w-1 h-1 rounded-full bg-zinc-700" />
                  <div
                    className="flex items-center gap-1.5"
                    title="Hệ thống vận hành ổn định"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase italic">
                      Ổn định
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">
                  Tổng Công suất Hệ thống
                </span>
                <span className="text-2xl font-black text-amber-500 tabular-nums tracking-tighter">
                  {totalMaxCapacity.toLocaleString()}
                  <span className="text-[10px] text-zinc-600 ml-2 font-black uppercase">
                    Đơn vị
                  </span>
                </span>
              </div>
              <div className="w-px h-10 bg-zinc-800" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCoordinationModalOpen(true)}
                className="h-10 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.05]"
              >
                <Sparkles size={14} className="mr-2" />
                Gợi ý Điều phối
              </Button>
            </div>
          </div>

          {/* Kitchen Cards - Horizontal Scroll */}
          <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1 custom-scrollbar-thin scroll-smooth snap-x">
            {(kitchens || []).map((kitchen) => (
              <div
                key={kitchen.kitchenId}
                className="flex-shrink-0 w-64 snap-center bg-zinc-950/40 border border-zinc-800/80 hover:border-amber-500/30 rounded-2xl p-3 transition-all group/card relative overflow-hidden"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 group-hover/card:text-amber-500 transition-colors">
                      <Package size={12} />
                    </div>
                    <span className="text-[11px] font-black text-zinc-100 uppercase tracking-tight truncate">
                      {kitchen.name}
                    </span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] font-black px-1 py-0 h-4">
                    HOẠT ĐỘNG
                  </Badge>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                    Năng lực
                  </span>
                  <span className="text-lg font-black text-zinc-100 tabular-nums">
                    {kitchen.maxDailyCapacity.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Operational Area */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Left Column: Order Table & Filters (75%) */}
        <div className="flex-[3] flex flex-col gap-6 min-w-0">
          {/* Table Controls Row */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-[28px] p-4 flex items-center justify-between gap-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md group">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors"
                />
                <Input
                  placeholder="Tìm theo Mã đơn, Cửa hàng..."
                  className="pl-12 h-11 bg-zinc-950/50 border-zinc-800 focus:border-amber-500/40 focus:ring-amber-500/5 rounded-xl transition-all text-xs font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Package size={12} className="text-amber-500" />
                  <select
                    className="bg-transparent text-[10px] font-black text-zinc-400 focus:outline-none cursor-pointer uppercase tracking-widest"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <option value="all" className="bg-zinc-900">
                      Sản phẩm
                    </option>
                    {productOptions.map((p) => (
                      <option key={p} value={p} className="bg-zinc-900">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Calendar size={12} className="text-amber-500" />
                  <select
                    className="bg-transparent text-[10px] font-black text-zinc-400 focus:outline-none cursor-pointer uppercase tracking-widest"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  >
                    <option value="all" className="bg-zinc-900">
                      Ngày giao
                    </option>
                    {dateOptions.map((d) => (
                      <option key={d} value={d} className="bg-zinc-900">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-emerald-900/10 border-0 transition-all flex items-center gap-2 shrink-0 disabled:opacity-30"
                onClick={() => handleApprove(Array.from(selectedOrderIds))}
                disabled={
                  selectedOrderIds.size === 0 ||
                  isProcessing ||
                  !isCapacityFeasibleForArray(Array.from(selectedOrderIds))
                }
              >
                <CheckCircle2 size={14} />
                Duyệt {selectedOrderIds.size > 0
                  ? selectedOrderIds.size
                  : ""}{" "}
                Đơn
              </Button>
              <div className="w-px h-8 bg-zinc-800" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openRejectModal()}
                disabled={selectedOrderIds.size === 0 || isProcessing}
                className="h-10 px-4 text-zinc-500 hover:text-red-500 hover:bg-red-500/5 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shrink-0"
              >
                Từ chối hàng loạt
              </Button>
            </div>
          </div>

          {/* Dominant Order Table Container */}
          <div className="flex-1 bg-zinc-900/20 border border-zinc-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative group/table">
            <div className="absolute inset-0 bg-amber-500/0 group-hover/table:bg-amber-500/2 pointer-events-none transition-all duration-700" />
            <div className="overflow-auto flex-1 custom-scrollbar relative z-10">
              <DataTable
                data={filteredOrders}
                columns={columns}
                layout="fixed"
                keyExtractor={(order: StoreOrderResponse) =>
                  String(order.orderId)
                }
                isLoading={isLoading}
                className="[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-zinc-900/95 [&_thead]:backdrop-blur-md"
                emptyMessage={
                  <div className="flex flex-col items-center gap-3 py-20">
                    <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-600">
                      <CheckCircle2 size={32} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                        Tất cả đã hoàn tất
                      </p>
                      <p className="text-[11px] text-zinc-600 font-medium mt-1">
                        Hiện không có đơn hàng nào cần xét duyệt.
                      </p>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </div>

        {/* Right Column: Product Catalog Sidebar (25%) */}
        <div className="w-[340px] flex-shrink-0 flex flex-col overflow-hidden">
          <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-5 shadow-2xl backdrop-blur-sm flex flex-col overflow-hidden group/catalog hover:bg-zinc-900/50 transition-all">
            <div className="flex items-center gap-3 mb-5 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg group-hover/catalog:scale-105 transition-transform">
                <Package size={20} />
              </div>
              <div>
                <h3 className="text-[13px] font-black text-zinc-100 uppercase tracking-tight leading-none mb-1">
                  Danh mục Sản phẩm
                </h3>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                  Kho vận hành
                </p>
              </div>
            </div>

            <div className="relative mb-6 shrink-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700"
                size={14}
              />
              <input
                type="text"
                placeholder="Tìm sản phẩm nhanh..."
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-3 text-[11px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/40 transition-all font-bold"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
              {Array.from(
                new Set(products.map((p) => p.category?.name || "Khác")),
              ).map((catName, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Leaf size={12} className="text-amber-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">
                      {catName}
                    </span>
                    <div className="flex-1 h-px bg-zinc-800/50" />
                  </div>
                  <div className="space-y-3">
                    {products
                      .filter((p) => (p.category?.name || "Khác") === catName)
                      .filter(
                        (p) =>
                          !productSearchTerm ||
                          p.name
                            .toLowerCase()
                            .includes(productSearchTerm.toLowerCase()),
                      )
                      .map((product, pIdx) => (
                        <div
                          key={pIdx}
                          className="group p-4 rounded-[22px] bg-zinc-950/60 border border-zinc-800 hover:border-amber-500/20 transition-all duration-300"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[12px] font-bold text-zinc-300 group-hover:text-amber-500 transition-colors line-clamp-2">
                              {product.name}
                            </span>
                            <span className="text-[11px] font-black text-amber-500 tabular-nums shrink-0">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(product.price)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-extrabold flex items-center gap-1.5 leading-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                              {product.unit}
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-zinc-900 text-zinc-500 border-zinc-800 text-[8px] h-4 font-black"
                            >
                              HOẠT ĐỘNG
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              className="w-full mt-6 h-12 text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-amber-500 hover:bg-amber-500/5 border border-zinc-800 rounded-2xl shrink-0 transition-all"
              onClick={() => fetchData()}
            >
              Làm mới Danh mục
            </Button>
          </div>
        </div>
      </div>

      {/* Modals & Overlays */}
      <Modal
        isOpen={isCoordinationModalOpen}
        onClose={() => setIsCoordinationModalOpen(false)}
        size="xl"
        title="Trung tâm Gợi ý Điều phối Thông minh"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-2">
          {/* Opportunities Panel */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] p-6 shadow-xl relative overflow-hidden group/opt">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] -mr-16 -mt-16 rounded-full" />
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-500 uppercase tracking-tight">
                  Cơ hội Duyệt ngay
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  Đơn hàng an toàn, đủ công suất
                </p>
              </div>
            </div>
            <div className="space-y-4 relative z-10">
              {filteredOrders
                .filter((o) => validationResults[o.orderId]?.isFeasible)
                .sort(
                  (a, b) =>
                    new Date(a.orderDate).getTime() -
                    new Date(b.orderDate).getTime(),
                )
                .slice(0, 4)
                .map((o) => (
                  <div
                    key={o.orderId}
                    className="flex justify-between items-center p-4 bg-zinc-950/60 border border-emerald-500/10 rounded-2xl hover:border-emerald-500/30 transition-all duration-300"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white">
                        ORD-{o.orderId}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[140px]">
                        {o.storeName}
                      </span>
                    </div>
                    <Badge className="bg-emerald-500 text-black border-0 font-black text-[9px] h-5 px-2">
                      CÓ THỂ DUYỆT
                    </Badge>
                  </div>
                ))}
              {filteredOrders.filter(
                (o) => validationResults[o.orderId]?.isFeasible,
              ).length === 0 && (
                <div className="py-12 text-center bg-zinc-950/40 rounded-[28px] border border-dashed border-zinc-800">
                  <span className="text-zinc-600 font-black uppercase text-[10px] tracking-widest italic">
                    Không có gợi ý ưu tiên
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Overload Risks Panel */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-[32px] p-6 shadow-xl relative overflow-hidden group/risk">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[60px] -mr-16 -mt-16 rounded-full" />
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-red-500 uppercase tracking-tight">
                  Rủi ro Quá tải
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  Phát hiện thiếu hụt công suất
                </p>
              </div>
            </div>
            <div className="space-y-4 relative z-10">
              {filteredOrders
                .filter(
                  (o) =>
                    validationResults[o.orderId] &&
                    !validationResults[o.orderId].isFeasible,
                )
                .slice(0, 4)
                .map((o) => (
                  <div
                    key={o.orderId}
                    className="flex justify-between items-center p-4 bg-zinc-950/60 border border-red-500/10 rounded-2xl hover:border-red-500/30 transition-all hover:translate-x-1 duration-300"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white">
                        ORD-{o.orderId}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[140px]">
                        {o.storeName}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-red-500 font-black text-sm tabular-nums">
                        -
                        {validationResults[o.orderId].totalOrderQuantity -
                          (validationResults[o.orderId].capacityDetail
                            ?.remainingCapacity || 0)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-red-500/10 text-red-500 border-0 font-black text-[8px] h-4 mt-1"
                      >
                        QUÁ TẢI
                      </Badge>
                    </div>
                  </div>
                ))}
              {filteredOrders.filter(
                (o) =>
                  validationResults[o.orderId] &&
                  !validationResults[o.orderId].isFeasible,
              ).length === 0 && (
                <div className="py-12 text-center bg-zinc-950/40 rounded-[28px] border border-dashed border-zinc-800">
                  <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest italic">
                    Hệ thống Ổn định
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Persistence Modals */}
      {rescheduleData && (
        <RescheduleModal
          isOpen={!!rescheduleData}
          onClose={() => setRescheduleData(null)}
          orderId={rescheduleData.id}
          currentDeliveryDate={rescheduleData.date}
          totalQuantity={rescheduleData.totalQuantity}
          onSuccess={(newDate: string) => {
            setOrders((prev) =>
              prev.map((o) =>
                o.orderId === rescheduleData.id
                  ? { ...o, deliveryDate: newDate }
                  : o,
              ),
            );
            setRescheduledId(rescheduleData.id);
            setTimeout(() => setRescheduledId(null), 3000);
            fetchData();
          }}
        />
      )}

      <OrderDetailDrawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onStatusUpdate={(id: number, status: string) => {
          if (status === "APPROVED") handleApprove([id]);
          else if (status === "REJECTED") openRejectModal(id);
        }}
      />

      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600/50"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-lg border border-red-500/20">
                <AlertCircle size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-100 uppercase tracking-tight leading-none mb-1">
                  Từ chối Đơn hàng
                </h3>
                <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest underline decoration-red-500/30 underline-offset-4">
                  {rejectingOrderId
                    ? `Mã đơn: #ORD-${rejectingOrderId}`
                    : `${selectedOrderIds.size} Đơn hàng đang chọn`}
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-8">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">
                Lý do từ chối (Bắt buộc)
              </label>
              <textarea
                className="w-full bg-zinc-950 border border-zinc-800 rounded-[22px] p-5 text-sm text-zinc-200 placeholder:text-zinc-800 focus:outline-none focus:border-red-500/40 focus:ring-red-500/5 transition-all min-h-[140px] resize-none font-medium custom-scrollbar"
                placeholder="Ví dụ: Sản phẩm tạm hết hàng..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button
                className="bg-red-600 hover:bg-red-700 text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-900/20 border-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleReject}
                disabled={isProcessing || !rejectReason.trim()}
              >
                {isProcessing ? "Đang xử lý..." : "Xác nhận Từ chối"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowRejectModal(false)}
                disabled={isProcessing}
                className="h-10 text-zinc-600 hover:text-zinc-300 font-black uppercase text-[10px] tracking-widest transition-colors"
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
