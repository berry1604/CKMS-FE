import { useState, useEffect } from "react";
import { Camera, AlertCircle, Save, Package } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { storeOrderApi } from "../../services/storeOrderApi";
import { productApi } from "../../services/product.api";
import type { StoreOrderResponse } from "../../types/storeOrder";
import type { ProductResponse } from "../../types/product";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../utils/classNames";

interface ComponentProps {
  shipmentId: number;
  storeOrderIds: number[];
  status: string;
  shippingFee?: number;
  onCancel: () => void;
  onSubmit: (data: {
    note: string;
    receivedQuantities: Record<number, number>;
  }) => void;
  isSubmitting: boolean;
}

export const ReceiveShipmentForm = ({
  shipmentId,
  storeOrderIds,
  status,
  shippingFee,
  onCancel,
  onSubmit,
  isSubmitting,
}: ComponentProps) => {
  const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
  const [productDetails, setProductDetails] = useState<
    Record<number, ProductResponse>
  >({});
  const [receivedQuantities, setReceivedQuantities] = useState<
    Record<string, number>
  >({}); // key format: orderId-productId
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const isReadOnly = status !== "IN_TRANSIT" && status !== "ARRIVED";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const fetchedOrders: StoreOrderResponse[] = [];
        const pDetails: Record<number, ProductResponse> = {};
        const initialReceived: Record<string, number> = {};

        // 1. Fetch Orders
        for (const orderId of storeOrderIds) {
          const order = await storeOrderApi.getOrderById(orderId);
          fetchedOrders.push(order);
        }
        setOrders(fetchedOrders);

        // 2. Fetch unique products and initialize quantities
        const uniqueProductIds = new Set<number>();
        fetchedOrders.forEach((order) => {
          order.orderDetails?.forEach((detail) => {
            uniqueProductIds.add(detail.productId);
            initialReceived[`${order.orderId}-${detail.productId}`] =
              detail.quantity;
          });
        });

        // Fetch details for all unique products
        await Promise.all(
          Array.from(uniqueProductIds).map(async (pid) => {
            try {
              const res = await productApi.getProductById(pid);
              if (res.data) pDetails[pid] = res.data;
            } catch (err) {
              console.error(`Failed to fetch product ${pid}`, err);
            }
          }),
        );

        setProductDetails(pDetails);
        setReceivedQuantities(initialReceived);
      } catch (error) {
        console.error("Failed to fetch order details for shipment", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (storeOrderIds && storeOrderIds.length > 0) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [storeOrderIds]);

  const handleQuantityChange = (
    orderId: number,
    productId: number,
    val: string,
  ) => {
    const num = parseInt(val, 10);
    const key = `${orderId}-${productId}`;
    setReceivedQuantities((prev) => ({
      ...prev,
      [key]: isNaN(num) ? 0 : num,
    }));
  };

  const shortageInfo = ordresWithShortage();

  function ordresWithShortage() {
    const ordersWithShortages: number[] = [];
    orders.forEach((order) => {
      const hasShort = order.orderDetails?.some((d) => {
        const received =
          receivedQuantities[`${order.orderId}-${d.productId}`] ?? d.quantity;
        return received < d.quantity;
      });
      if (hasShort) ordersWithShortages.push(order.orderId);
    });
    return ordersWithShortages;
  }

  const hasShortage = shortageInfo.length > 0;

  const handleSubmit = () => {
    // Aggregate back to original flat structure requested by API if needed,
    // though the backend ideally wants per stop.
    // Current confirmStopDelivery API in shipment.api expects Record<number, number> (productId -> totalQuantity)

    const totalReceived: Record<number, number> = {};
    Object.entries(receivedQuantities).forEach(([key, qty]) => {
      const productId = parseInt(key.split("-")[1], 10);
      totalReceived[productId] = (totalReceived[productId] || 0) + qty;
    });

    onSubmit({
      note,
      receivedQuantities: totalReceived,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-[var(--text-secondary)]/60 uppercase text-[10px] font-black tracking-widest">
        Đang tải danh sách mặt hàng...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Form Header Alert */}
      <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-[32px] relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.05),_transparent_60%)]"></div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-inner">
            <Camera
              size={24}
              className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            />
          </div>
          <div>
            <h3 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] mb-2">
              Biểu Mẫu Nhận Hàng — Vận đơn #{shipmentId}
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] font-bold leading-relaxed uppercase tracking-[0.1em]">
              Vui lòng kiểm đếm thực tế số lượng hàng hóa nhận được theo từng
              đơn hàng dưới đây.
            </p>
            {/* Shipping Fee Note for Store Staff */}
            {(shippingFee ?? 0) > 0 && (
              <div className="mt-4 flex items-center gap-3 py-2 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl w-fit">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  Cước phí vận chuyển dự kiến:
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono tracking-tighter">
                  {shippingFee?.toLocaleString("vi-VN")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grouped by Order */}
      <div className="space-y-12">
        {orders.map((order) => (
          <div
            key={order.orderId}
            className="bg-[var(--bg-card)]/10 border border-[var(--border-primary)] rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            {/* Order Header */}
            <div className="px-10 py-6 bg-gradient-to-r from-[var(--bg-card)]/80 to-transparent border-b border-[var(--border-primary)] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Package size={22} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] mb-0.5">
                    Mã đơn hàng
                  </h4>
                  <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter italic">
                    #{order.orderId}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest mb-1">
                  Ngày yêu cầu
                </div>
                <span className="text-xs font-bold text-[var(--text-secondary)]/60 font-mono">
                  {new Date(order.orderDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                <thead>
                  <tr className="bg-[var(--text-primary)]/[0.02] border-b border-[var(--border-primary)]/30">
                    <th className="px-10 py-5 text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em]">
                      Sản phẩm & Hình ảnh
                    </th>
                    <th className="px-6 py-5 text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] text-center">
                      Yêu cầu (Dự kiến)
                    </th>
                    <th className="px-6 py-5 text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] text-center w-48">
                      Thực Nhận
                    </th>
                    <th className="px-6 py-5 text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.3em] text-center">
                      Tình trạng
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]/40">
                  {order.orderDetails?.map((item) => {
                    const received =
                      receivedQuantities[
                        `${order.orderId}-${item.productId}`
                      ] ?? item.quantity;
                    const isMissing = received < item.quantity;
                    const details = productDetails[item.productId];

                    return (
                      <tr
                        key={`${order.orderId}-${item.productId}`}
                        className={cn(
                          "group/row transition-all duration-500",
                          isMissing
                            ? "bg-red-500/[0.04] hover:bg-red-500/[0.08]"
                            : "hover:bg-amber-500/[0.03]",
                        )}
                      >
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] overflow-hidden shadow-lg group-hover/row:scale-105 transition-transform duration-500">
                              {details?.imageUrl ? (
                                <img
                                  src={details.imageUrl}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[var(--bg-card)]">
                                  <Package
                                    size={24}
                                    className="text-[var(--text-secondary)]/20"
                                  />
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="block font-black text-[var(--text-primary)] text-base tracking-tight mb-1">
                                {item.productName}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="default"
                                  className="text-[9px] font-black tracking-widest h-5 border-[var(--border-primary)]/50 bg-[var(--text-primary)]/5"
                                >
                                  {details?.category?.name || "Sản phẩm"}
                                </Badge>
                                <span className="text-[10px] font-bold text-[var(--text-secondary)]/40 uppercase tracking-tighter">
                                  Đơn giá: {item.unitPrice?.toLocaleString("vi-VN")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-[var(--text-primary)] font-mono tracking-tighter">
                              {item.quantity}
                            </span>
                            <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest mt-0.5">
                              {details?.unit || "đơn vị"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="relative group/input max-w-[140px] mx-auto">
                            <input
                              type="number"
                              className={cn(
                                "w-full h-14 bg-[var(--bg-root)] border rounded-2xl text-center font-black font-mono text-xl focus:ring-8 outline-none transition-all duration-500 shadow-2xl",
                                isMissing
                                  ? "border-red-500/50 text-red-500 focus:ring-red-500/10 focus:border-red-400"
                                  : "border-[var(--border-primary)] text-emerald-500 focus:ring-emerald-500/5 focus:border-emerald-500/50",
                              )}
                              value={received.toString()}
                              onChange={(e) =>
                                handleQuantityChange(
                                  order.orderId,
                                  item.productId,
                                  e.target.value,
                                )
                              }
                              min={0}
                              disabled={isReadOnly}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          {isMissing ? (
                            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 shadow-xl shadow-red-500/5">
                              <AlertCircle
                                size={16}
                                className="animate-pulse"
                              />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Thiếu {item.quantity - received}
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Đủ hàng
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
          </div>
        ))}
      </div>

      {hasShortage && (
        <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[40px] flex gap-6 items-start animate-in fade-in zoom-in-95 duration-700 shadow-[0_20px_60px_-20px_rgba(239,68,68,0.2)]">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
            <AlertCircle className="text-red-500" size={26} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-black text-red-400 uppercase tracking-[0.2em]">
              Phát hiện thiếu hàng tại Đơn #{shortageInfo.join(", #")}
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] font-bold leading-relaxed uppercase tracking-[0.1em]">
              Số lượng thực nhận thấp hơn yêu cầu. Hệ thống đã ghi nhận sai
              lệch. Vui lòng ghi rõ lý do vào phần ghi chú bên dưới để hoàn tất
              biên bản đồng kiểm.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3 group/note">
        <label className="text-[10px] font-black text-[var(--text-secondary)]/40 group-focus-within/note:text-amber-500 uppercase tracking-[0.3em] ml-2 transition-colors">
          Ghi chú / Nhận xét lúc nhận hàng
        </label>
        <div className="relative">
          <Input
            placeholder="Tình trạng bao bì, nhiệt độ, lý do thiếu hàng..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isReadOnly}
            className="h-14 bg-[var(--bg-card)]/40 border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300 text-sm font-medium px-5 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="pt-8 flex justify-end gap-5 border-t border-[var(--border-primary)]/80">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-14 px-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-secondary)]/40 hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-inner"
        >
          Hủy Nhận
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isReadOnly}
          className="group relative h-14 px-10 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] text-[var(--text-primary)] font-black uppercase text-[10px] tracking-[0.2em] overflow-hidden transition-all duration-500 shadow-2xl hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:border-[var(--border-primary)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
          <div className="relative z-10 flex items-center justify-center gap-3">
            {isSubmitting ? (
              <span className="animate-pulse">ĐANG KÝ XÁC NHẬN...</span>
            ) : (
              <>
                <Save size={18} /> LƯU BIÊN BẢN & XÁC NHẬN
              </>
            )}
          </div>
        </Button>
      </div>
    </div>
  );
};
