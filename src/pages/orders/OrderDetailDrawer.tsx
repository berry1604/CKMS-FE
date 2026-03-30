import { useState, useEffect } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Phone,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Drawer } from "../../components/ui/Drawer";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import type { StoreOrderResponse } from "../../types/storeOrder";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../utils/classNames";
import { storeOrderApi } from "../../services/storeOrderApi";
import { toast } from "react-hot-toast";
import { RescheduleModal } from "../../components/orders/RescheduleModal";

interface OrderDetailDrawerProps {
  order: StoreOrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (orderId: number, status: string) => void;
  onCancelOrder?: (orderId: number) => void;
  onSubmitOrder?: (orderId: number) => void;
}

export const OrderDetailDrawer = ({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
  onCancelOrder,
  onSubmitOrder,
}: OrderDetailDrawerProps) => {
  const { hasAuthority } = useAuth();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<StoreOrderResponse | null>(
    null,
  );
  const [isFetching, setIsFetching] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && order?.orderId) {
      const fetchFullDetails = async () => {
        setIsFetching(true);
        try {
          const fullOrder = await storeOrderApi.getOrderById(order.orderId);
          setOrderDetails(fullOrder);
        } catch (error) {
          console.error("Failed to fetch order details:", error);
          toast.error("Không thể tải chi tiết đơn hàng");
          setOrderDetails(null);
        } finally {
          setIsFetching(false);
        }
      };
      fetchFullDetails();
    } else if (!isOpen) {
      setOrderDetails(null);
      setIsRescheduleModalOpen(false);
    }
  }, [isOpen, order?.orderId]);

  if (!order) return null;

  const currentOrder = orderDetails || order;
  const orderStatus = currentOrder.status?.toUpperCase();

  // Permissions check
  const canApprove =
    hasAuthority("APPROVE_STORE_ORDER") ||
    hasAuthority("COORDINATOR") ||
    hasAuthority("MANAGER") ||
    hasAuthority("ADMIN");

  const getStatusStep = (status: string) => {
    const steps = ["SUBMITTED", "APPROVED", "ALLOCATED", "DELIVERED"];
    const index = steps.indexOf(status?.toUpperCase());
    return index >= 0 ? index + 1 : 0;
  };

  const currentStep = getStatusStep(currentOrder.status);

  const canCancel = orderStatus === "SUBMITTED";
  const canReject = orderStatus === "SUBMITTED";

  const handleCancel = () => {
    setIsCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancelOrder?.(currentOrder.orderId);
      setIsCancelModalOpen(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRescheduleSuccess = (newDate: string) => {
    if (orderDetails) {
      setOrderDetails({ ...orderDetails, deliveryDate: newDate });
    } else if (order) {
      setOrderDetails({ ...order, deliveryDate: newDate });
    }
    if (onStatusUpdate) {
      // Optional: trigger refresh in parent if needed
    }
  };

  const footer = (
    <div className="flex justify-between w-full items-center px-4">
      <div className="flex gap-2 text-[var(--text-secondary)] opacity-0 pointer-events-none">
        {/* Placeholder to keep layout consistent if needed, but the gap-3 div below already handles right-alignment */}
      </div>
      <div className="flex gap-3">
        {canCancel && onCancelOrder && (
          <Button
            variant="outline"
            className="text-red-500 border-red-500/30 hover:bg-red-500/10 font-bold uppercase text-[10px] tracking-widest h-9 px-4 rounded-lg"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            <XCircle size={16} className="mr-2" />
            {isCancelling ? "Đang hủy..." : "Hủy đơn"}
          </Button>
        )}
        {orderStatus === "DRAFT" &&
          onSubmitOrder &&
          (hasAuthority("STORE_STAFF") ||
            hasAuthority("CREATE_STORE_ORDER") ||
            hasAuthority("MANAGER")) && (
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-[10px] tracking-widest h-9 px-6 rounded-lg shadow-lg shadow-emerald-900/20 border-0"
              onClick={() => onSubmitOrder(currentOrder.orderId)}
            >
              Gửi Đơn
            </Button>
          )}
        {canReject && onStatusUpdate && canApprove && (
          <Button
            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[10px] tracking-widest h-9 px-4 rounded-lg shadow-lg shadow-red-900/20 border-0"
            onClick={() => onStatusUpdate(currentOrder.orderId, "REJECTED")}
          >
            Từ chối
          </Button>
        )}
        {orderStatus === "SUBMITTED" && onStatusUpdate && canApprove && (
          <Button
            onClick={() => onStatusUpdate(currentOrder.orderId, "APPROVED")}
            className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-widest h-9 px-6 rounded-lg shadow-lg shadow-amber-900/20 border-0"
          >
            Duyệt Đơn
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={onClose}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold uppercase text-[10px] tracking-widest h-9 px-4"
        >
          Đóng
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Chi tiết đơn hàng #${currentOrder.orderId}`}
        description={`${currentOrder.storeName || `Cửa hàng ID: ${currentOrder.storeId}`} • Ngày đặt hàng: ${new Date(currentOrder.orderDate).toLocaleDateString("vi-VN")}`}
        width="max-w-5xl"
        footer={footer}
      >
        {isFetching && (
          <div className="absolute inset-x-0 top-0 h-1 z-[60]">
            <div className="h-full bg-amber-500 animate-[loading_2s_ease-in-out_infinite] w-1/3"></div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 py-2 animate-in slide-in-from-right duration-500">
          {/* Left Column: Visual & Global Status */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[var(--bg-card)]/40 backdrop-blur-md border border-[var(--border-primary)] rounded-[40px] p-8 space-y-8 overflow-hidden relative group/sidebar shadow-2xl">
              {/* Luxury Visual Element */}
              <div className="relative -mx-8 -mt-8 mb-8 group/img h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-root)]/90 z-10"></div>
                <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full scale-150 group-hover/img:bg-amber-500/20 transition-all duration-700"></div>
                <img
                  src="/Users/phunghuyphuoc/.gemini/antigravity/brain/0e7878ef-fd61-49a8-909f-b3ae8c725512/order_management_luxury_1773305899211.png"
                  alt="Order Management"
                  className="w-full h-full object-cover opacity-60 group-hover/img:opacity-100 group-hover/img:scale-110 transition-all duration-[2s]"
                />
                <div className="absolute bottom-6 left-8 z-20">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[var(--bg-root)]/80 backdrop-blur-md border border-amber-500/30 shadow-lg shadow-amber-500/10">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">
                      Trung tâm Quản lý Hệ thống
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      orderStatus === "DELIVERED"
                        ? "success"
                        : orderStatus === "REJECTED"
                          ? "danger"
                          : orderStatus === "APPROVED"
                            ? "orange"
                            : orderStatus === "ALLOCATED"
                              ? "info"
                              : "warning"
                    }
                    className="text-[11px] font-black px-4 py-1 uppercase tracking-widest border-0 shadow-lg"
                  >
                    {orderStatus === "SUBMITTED"
                      ? "CHỜ DUYỆT"
                      : orderStatus === "APPROVED"
                        ? "ĐA DUYỆT"
                        : orderStatus === "ALLOCATED"
                          ? "ĐA PHÂN BỔ"
                          : orderStatus === "DELIVERED"
                            ? "HOÀN THÀNH"
                            : orderStatus === "REJECTED"
                              ? "TỪ CHỐI"
                              : orderStatus}
                  </Badge>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-tighter">
                    Trạng thái Hiện tại
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-amber-500 shadow-inner">
                    <Package size={28} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">
                      Mã đơn hàng
                    </span>
                    <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">
                      #{currentOrder.orderId}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-medium italic leading-relaxed">
                  Thông tin chi tiết về đơn hàng được khởi tạo từ chuỗi cửa hàng
                  nhượng quyền.
                </p>
              </div>

              <div className="h-px bg-[var(--border-primary)]/50"></div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                  Tổng giá trị thanh toán
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-amber-500 tracking-tighter">
                    {(currentOrder.totalAmount || 0).toLocaleString()}
                  </span>
                  <span className="text-sm font-black text-amber-500/50 uppercase tracking-widest">
                    VNĐ
                  </span>
                </div>
              </div>
            </div>

            {/* Meta Specs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-[var(--bg-card)]/40 rounded-[32px] border border-[var(--border-primary)] space-y-3 group/spec">
                <span className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest block">
                  Cửa hàng đặt hàng
                </span>
                <span className="text-[13px] font-black text-[var(--text-primary)] uppercase truncate block">
                  {currentOrder.storeName || `Shop #${currentOrder.storeId}`}
                </span>
                {currentOrder.storePhone ? (
                  <div className="flex items-center gap-1.5">
                    <Phone size={10} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] font-mono tracking-tighter">
                      {currentOrder.storePhone}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 opacity-60">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] font-mono tracking-tighter uppercase italic">
                      Xác thực Terminal
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6 bg-[var(--bg-card)]/40 rounded-[32px] border border-[var(--border-primary)] space-y-3 group/spec">
                <span className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest block">
                  Ngày đặt hàng
                </span>
                <span className="text-[13px] font-black text-[var(--text-primary)] uppercase truncate block">
                  {new Date(currentOrder.orderDate).toLocaleDateString("vi-VN")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-[var(--text-secondary)]/60 font-mono uppercase">
                    {new Date(currentOrder.orderDate).toLocaleTimeString(
                      "vi-VN",
                    )}
                  </span>
                </div>
              </div>
              <div className="p-6 bg-[var(--bg-card)]/40 rounded-[32px] border border-[var(--border-primary)] space-y-3 group/spec col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">
                    Ngày giao hàng dự kiến
                  </span>
                  {canApprove &&
                    (orderStatus === "SUBMITTED" ||
                      orderStatus === "APPROVED" ||
                      orderStatus === "ALLOCATED") && (
                      <button
                        onClick={() => setIsRescheduleModalOpen(true)}
                        className="text-[10px] font-black text-[var(--text-secondary)] hover:text-amber-500 uppercase tracking-widest transition-colors"
                      >
                        Thay đổi
                      </button>
                    )}
                </div>

                <span className="text-[15px] font-black text-[var(--text-primary)] uppercase truncate block">
                  {currentOrder.deliveryDate
                    ? new Date(currentOrder.deliveryDate).toLocaleDateString(
                        "vi-VN",
                      )
                    : "N/A"}
                </span>
                <div className="flex items-center gap-1.5 opacity-60">
                  <Clock size={12} className="text-amber-500" />
                  <span className="text-[10px] font-bold text-[var(--text-secondary)]/60 font-mono tracking-tighter uppercase italic">
                    Lịch trình vận chuyển dự kiến
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Progress & Product List */}
          <div className="lg:col-span-7 space-y-10">
            {/* Progress Tracker */}
            {orderStatus !== "REJECTED" ? (
              <div className="bg-[var(--bg-card)]/20 backdrop-blur-sm rounded-[40px] border border-[var(--border-primary)] p-10 space-y-10 shadow-xl">
                <div className="flex items-center gap-3 ml-2">
                  <Clock size={18} className="text-amber-500/50" />
                  <h4 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">
                    Lộ trình xử lý đơn hàng
                  </h4>
                </div>

                <div className="relative">
                  <div className="absolute top-[26px] left-[24px] right-[24px] h-[3px] bg-[var(--border-primary)]/50 rounded-full"></div>
                  <div
                    className="absolute top-[26px] left-[24px] h-[3px] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    style={{
                      width: `calc(${((currentStep - 1) / 3) * 100}% - 48px)`,
                    }}
                  ></div>
                  <div className="relative flex justify-between">
                    {[
                      { step: 1, label: "Chờ duyệt", icon: Clock },
                      { step: 2, label: "Đã duyệt", icon: CheckCircle },
                      { step: 3, label: "Phân bổ", icon: Truck },
                      { step: 4, label: "Giao hàng", icon: Package },
                    ].map((item) => {
                      const StepIcon = item.icon;
                      const isActive = currentStep >= item.step;
                      const isCurrent = currentStep === item.step;

                      return (
                        <div
                          key={item.step}
                          className="flex flex-col items-center gap-5 relative z-10 group/step"
                        >
                          <div
                            className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 bg-[var(--bg-root)]",
                              isActive
                                ? "border-amber-500 text-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.15)] bg-[var(--bg-card)]"
                                : "border-[var(--border-primary)] text-[var(--text-secondary)]/30 hover:border-[var(--text-secondary)]/50",
                            )}
                          >
                            <StepIcon
                              size={22}
                              strokeWidth={isActive ? 3 : 2}
                              className={cn(isActive && "animate-pulse-slow")}
                            />
                          </div>
                          <div className="flex flex-col items-center">
                            <span
                              className={cn(
                                "text-[10px] font-black tracking-widest uppercase transition-colors whitespace-nowrap",
                                isActive ? "text-zinc-200" : "text-zinc-700",
                              )}
                            >
                              {item.label}
                            </span>
                            {isCurrent && (
                              <div className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse"></div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-12 bg-red-500/5 rounded-[40px] border border-red-500/20 border-dashed animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 rounded-[32px] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <XCircle size={40} />
                </div>
                <div className="text-center space-y-2">
                  <h5 className="text-[16px] font-black text-red-500 uppercase tracking-[0.2em]">
                    HỆ THỐNG ĐÃ TỪ CHỐI
                  </h5>
                  <p className="text-[12px] text-[var(--text-secondary)] font-medium max-w-md mx-auto italic">
                    Vui lòng kiểm tra lại thông tin đơn hàng hoặc liên hệ
                    Coordinator để nhận hỗ trợ kỹ thuật.
                  </p>
                </div>
              </div>
            )}

            {/* Product List Table */}
            <div className="space-y-5">
              <div className="flex items-center justify-between ml-2">
                <div className="flex items-center gap-3">
                  <Package size={18} className="text-[var(--text-secondary)]/60" />
                  <h4 className="text-[12px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em]">
                    Danh mục sản phẩm
                  </h4>
                </div>
                <div className="px-3 py-1 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-full">
                  <span className="text-[10px] text-[var(--text-secondary)]/60 font-black uppercase tracking-widest">
                    {currentOrder.orderDetails?.reduce(
                      (acc, curr) => acc + curr.quantity,
                      0,
                    ) || 0}{" "}
                    ĐƠN VỊ
                  </span>
                </div>
              </div>

              <div className="bg-[var(--bg-card)]/20 rounded-[36px] border border-[var(--border-primary)] overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-[var(--bg-root)]/40 border-b border-[var(--border-primary)]">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest whitespace-nowrap">
                        Số lượng
                      </th>
                      <th className="px-8 py-5 text-right text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)]/30">
                    {currentOrder.orderDetails?.map((item, idx) => {
                      return (
                        <tr
                          key={idx}
                          className="group/row hover:bg-[var(--text-primary)]/[0.02] transition-colors"
                        >
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-[14px] font-black text-[var(--text-primary)] uppercase tracking-tight group-hover/row:text-amber-500 transition-colors">
                                {item.productName || `SKU #${item.productId}`}
                              </span>
                              <span className="text-[10px] text-[var(--text-secondary)]/40 font-bold font-mono tracking-tighter italic">
                                Unit ID: {item.productId}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="text-[14px] font-black text-[var(--text-secondary)]">
                              {item.quantity} đơn vị
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-[14px] font-black text-amber-500/90 tracking-tight">
                                {(
                                  item.subTotal ||
                                  item.quantity * (item.unitPrice || 0)
                                ).toLocaleString()}
                              </span>
                              <span className="text-[9px] text-[var(--text-secondary)]/40 font-bold uppercase tracking-widest">
                                VNĐ
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Note Section */}
                <div className="bg-amber-500/[0.03] p-8 border-t border-[var(--border-primary)] flex items-start gap-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Clock size={18} />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] block">
                      Ghi chú điều phối chuyên biệt
                    </span>
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium italic leading-relaxed text-balance">
                      {currentOrder.note ||
                        "Hệ thống chưa ghi nhận ghi chú bổ sung cho đơn hàng này."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancel}
        title="Hủy Đơn Hàng"
        message="Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác."
        confirmText="Hủy Đơn"
        cancelText="Quay Lại"
        isLoading={isCancelling}
        variant="danger"
      />
      {isRescheduleModalOpen && (
        <RescheduleModal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          orderId={currentOrder.orderId}
          currentDeliveryDate={currentOrder.deliveryDate}
          totalQuantity={currentOrder.orderDetails?.reduce((sum, item) => sum + item.quantity, 0) || 0}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </>
  );
};
