import { useState, useEffect, useCallback } from "react";
import { CreditCard, Building2, Calendar, X, Truck } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Drawer } from "../../components/ui/Drawer";
import { billingApi } from "../../services/billing.api";
import { storeOrderApi } from "../../services/storeOrderApi";
import { toast } from "react-hot-toast";
import type {
  BillingStatementDetailResponse,
  PaymentStatementRequest,
} from "../../types/billing";
import type { OrderDetailResponse } from "../../types/storeOrder";
import { useAuth } from "../../hooks/useAuth";

interface BillingDetailDrawerProps {
  statementId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onPaid?: () => void;
}

export const BillingDetailDrawer = ({
  statementId,
  isOpen,
  onClose,
  onPaid,
}: BillingDetailDrawerProps) => {
  const [detail, setDetail] = useState<BillingStatementDetailResponse | null>(
    null,
  );
  const { hasAuthority, user } = useAuth();
  const isStaff = hasAuthority("STORE_STAFF");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState<PaymentStatementRequest>({
    paymentMethodId: 0,
    transactionReference: "",
    note: "",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [orderDetailsMap, setOrderDetailsMap] = useState<
    Record<number, OrderDetailResponse[]>
  >({});

  // Fetch detail when opened
  const fetchDetail = useCallback(async () => {
    if (!statementId) return;
    setIsLoading(true);
    try {
      const data = await billingApi.getStatementDetail(
        statementId,
        isStaff ? user?.storeId : undefined,
      );
      setDetail(data);
    } catch (error) {
      console.error("Failed to fetch statement detail:", error);
      toast.error("Failed to load statement details");
    } finally {
      setIsLoading(false);
    }
  }, [statementId]);

  // Fetch order details for all invoices once detail is loaded
  const fetchOrderDetails = useCallback(
    async (invoices: { orderId?: number }[]) => {
      const uniqueOrderIds = [
        ...new Set(
          invoices
            .map((inv) => inv.orderId)
            .filter((id): id is number => id != null),
        ),
      ];
      if (uniqueOrderIds.length === 0) return;

      const results = await Promise.allSettled(
        uniqueOrderIds.map((orderId) => storeOrderApi.getOrderById(orderId)),
      );
      const map: Record<number, OrderDetailResponse[]> = {};
      results.forEach((result, idx) => {
        if (result.status === "fulfilled" && result.value?.orderDetails) {
          map[uniqueOrderIds[idx]] = result.value.orderDetails;
        }
      });
      setOrderDetailsMap(map);
    },
    [],
  );

  // Trigger fetch when drawer opens
  useEffect(() => {
    if (isOpen && statementId) {
      fetchDetail();
      // Reset form
      setPayForm({
        paymentMethodId: 0,
        transactionReference: "",
        note: "",
      });
      setFormErrors({});
      setShowPayForm(false);
      setOrderDetailsMap({});
    }
  }, [isOpen, statementId, fetchDetail]);

  // Fetch order details when detail is loaded
  useEffect(() => {
    if (detail?.invoices && detail.invoices.length > 0) {
      fetchOrderDetails(detail.invoices);
    }
  }, [detail, fetchOrderDetails]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!payForm.paymentMethodId) {
      errors.paymentMethodId = "Please select a payment method";
    }
    if (payForm.paymentMethodId === 2 && !payForm.transactionReference) {
      // Assuming ID 2 is Bank Transfer
      errors.transactionReference = "Reference is required for Bank Transfer";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePay = async () => {
    if (!statementId) return;
    if (!validateForm()) return;

    setIsPaying(true);
    try {
      const response = await billingApi.payStatement(
        statementId,
        payForm,
        isStaff ? user?.storeId : undefined,
      );
      toast.success("Payment processed successfully!");

      // Update local state immediately
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: "PAID",
              paidAt: response.paidAt,
              transactionReference: response.transactionReference,
              paymentMethodId: payForm.paymentMethodId, // Optimistic update or derived
            }
          : null,
      );

      setShowPayForm(false);
      onPaid?.();
      // Don't close immediately, let user see the update? Or close?
      // User might want to see the status change.
      // But usually "Mark as Paid" -> Close is fine.
      // Let's keep it open to show the updated status.
    } catch (error: unknown) {
      let msg = "Payment failed";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        msg = axiosError.response?.data?.message || msg;
      }
      toast.error(msg);
    } finally {
      setIsPaying(false);
    }
  };

  const getStatusVariant = (
    status: string,
  ): "success" | "warning" | "danger" | "default" => {
    const s = status?.toUpperCase();
    if (s === "PAID") return "success";
    if (s === "ISSUED" || s === "DRAFT") return "warning";
    if (s === "OVERDUE") return "danger";
    if (s === "CANCELLED") return "default";
    return "default";
  };

  const footer = (
    <div className="flex justify-between w-full">
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
      <div className="flex gap-2">
        {detail &&
          detail.status?.toUpperCase() !== "PAID" &&
          detail.status?.toUpperCase() !== "CANCELLED" &&
          isStaff && (
            <Button
              onClick={() => setShowPayForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CreditCard size={16} className="mr-2" /> Mark as Paid
            </Button>
          )}
      </div>
    </div>
  );

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Statement Details"
        description={statementId ? `Statement #${statementId}` : ""}
        width="max-w-3xl"
        footer={footer}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg
              className="animate-spin h-8 w-8 text-amber-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : detail ? (
          <div className="space-y-6">
            {/* Header Status Board */}
            <div className="bg-zinc-900/80 rounded-xl p-6 border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-zinc-900/50 border border-zinc-700 flex items-center justify-center text-gray-400">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-200">
                    {detail.store?.name || `Store #${detail.store?.id}`}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {detail.cycleName || "Bill To"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Badge
                  variant={getStatusVariant(detail.status)}
                  className="mb-2 text-sm px-3 py-1"
                >
                  {detail.status?.toUpperCase()}
                </Badge>
                <div className="text-right">
                  {detail.orderTotal !== undefined && (
                    <p className="text-xs text-gray-500">
                      Order: {detail.orderTotal.toLocaleString("vi-VN")} VND
                    </p>
                  )}
                  {detail.shippingTotal !== undefined && (
                    <p className="text-xs text-gray-500">
                      Shipping: {detail.shippingTotal.toLocaleString("vi-VN")}{" "}
                      VND
                    </p>
                  )}
                  <p className="text-2xl font-bold text-gray-200">
                    {detail.totalAmount?.toLocaleString("vi-VN")} VND
                  </p>
                </div>
              </div>
            </div>

            {/* Period Info */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border-zinc-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Period Start
                    </p>
                    <p className="font-medium text-gray-200">
                      {detail.periodStart}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-zinc-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Period End
                    </p>
                    <p className="font-medium text-gray-200">
                      {detail.periodEnd}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {detail.paidAt && (
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20 space-y-1">
                <p className="text-sm text-green-400 font-medium">
                  Paid at: {new Date(detail.paidAt).toLocaleString("vi-VN")}
                </p>
                {detail.paymentMethodName && (
                  <p className="text-sm text-green-400/80">
                    Method: {detail.paymentMethodName}
                  </p>
                )}
                {detail.transactionReference && (
                  <p className="text-sm text-green-400/80">
                    Ref: {detail.transactionReference}
                  </p>
                )}
                {detail.note && (
                  <p className="text-sm text-green-400/80 italic">
                    Note: {detail.note}
                  </p>
                )}
              </div>
            )}

            {/* Professional Invoice Line Items */}
            {detail.invoices && detail.invoices.length > 0 && (
              <div className="space-y-5">
                {detail.invoices.map((inv, invIdx) => {
                  const items = inv.orderId
                    ? orderDetailsMap[inv.orderId] || []
                    : [];
                  return (
                    <Card
                      key={invIdx}
                      className="overflow-hidden border-zinc-700 shadow-sm"
                    >
                      {/* Invoice sub-header */}
                      <div className="bg-zinc-900/60 px-6 py-3 border-b border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs bg-zinc-800 px-2.5 py-1 rounded text-amber-400 border border-zinc-700">
                            Invoice #{inv.invoiceId}
                          </span>
                          {inv.orderId && (
                            <span className="text-xs text-zinc-500">
                              Order #{inv.orderId}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {inv.issuedAt && (
                            <span className="text-xs text-zinc-500">
                              {new Date(inv.issuedAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </span>
                          )}
                          <span className="font-semibold text-sm text-gray-200">
                            {inv.amount?.toLocaleString("vi-VN")} VND
                          </span>
                        </div>
                      </div>

                      {/* Line Items Table */}
                      <div className="bg-zinc-900/30">
                        <table className="min-w-full divide-y divide-zinc-800/60">
                          <thead>
                            <tr className="bg-zinc-900/50">
                              <th
                                className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]"
                                style={{ width: "60px" }}
                              >
                                No.
                              </th>
                              <th className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
                                Item
                              </th>
                              <th
                                className="px-6 py-3 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]"
                                style={{ width: "80px" }}
                              >
                                Qty
                              </th>
                              <th
                                className="px-6 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]"
                                style={{ width: "140px" }}
                              >
                                Price
                              </th>
                              <th
                                className="px-6 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]"
                                style={{ width: "150px" }}
                              >
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/40">
                            {items.length > 0 ? (
                              items.map((item, itemIdx) => (
                                <tr
                                  key={itemIdx}
                                  className="hover:bg-zinc-800/30 transition-colors"
                                >
                                  <td className="px-6 py-3.5 text-sm text-zinc-500 font-mono">
                                    {itemIdx + 1}
                                  </td>
                                  <td className="px-6 py-3.5 text-sm text-gray-200 font-medium">
                                    {item.productName}
                                  </td>
                                  <td className="px-6 py-3.5 text-sm text-center text-amber-400 font-semibold">
                                    {item.quantity}
                                  </td>
                                  <td className="px-6 py-3.5 text-sm text-right text-gray-300">
                                    {item.unitPrice?.toLocaleString("vi-VN")} ₫
                                  </td>
                                  <td className="px-6 py-3.5 text-sm text-right text-gray-200 font-semibold">
                                    {item.subTotal?.toLocaleString("vi-VN")} ₫
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-6 py-6 text-center text-sm text-zinc-600 italic"
                                >
                                  Đang tải chi tiết đơn hàng...
                                </td>
                              </tr>
                            )}

                            {/* Hiển thị Phí vận chuyển như 1 dòng riêng trong bảng (nếu có) */}
                            {(inv.shippingFee ?? 0) > 0 && (
                              <tr className="bg-amber-500/5 hover:bg-amber-500/10 transition-colors border-t border-amber-500/20">
                                <td className="px-6 py-3.5 text-sm text-amber-500/50 font-mono italic">
                                  #
                                </td>
                                <td className="px-6 py-3.5 text-sm text-amber-400 font-bold flex items-center gap-2">
                                  <Truck size={14} className="text-amber-500" />{" "}
                                  Phí vận chuyển
                                </td>
                                <td className="px-6 py-3.5 text-sm text-center text-zinc-500 font-semibold italic">
                                  —
                                </td>
                                <td className="px-6 py-3.5 text-sm text-right text-zinc-500 italic">
                                  —
                                </td>
                                <td className="px-6 py-3.5 text-sm text-right text-amber-400 font-bold">
                                  {inv.shippingFee?.toLocaleString("vi-VN")} ₫
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  );
                })}

                {/* Grand Total */}
                <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 px-6 py-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                      Tổng giá trị đối soát
                    </span>
                    <span className="text-xs text-zinc-600 mt-0.5">
                      {detail.invoices.length} hóa đơn
                    </span>
                  </div>
                  <span className="text-2xl font-black text-amber-500 tracking-tight">
                    {detail.totalAmount?.toLocaleString("vi-VN")}{" "}
                    <span className="text-base font-bold text-amber-600">
                      VND
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No data found.</p>
        )}
      </Drawer>

      {/* Payment Modal */}
      {showPayForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-zinc-900 shadow-xl border border-zinc-700">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold text-gray-200">
                Confirm Payment
              </h2>
              <button
                onClick={() => setShowPayForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  className="w-full flex h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                  value={payForm.paymentMethodId || ""}
                  onChange={(e) =>
                    setPayForm({
                      ...payForm,
                      paymentMethodId: Number(e.target.value),
                    })
                  }
                >
                  <option
                    value=""
                    disabled
                    className="bg-zinc-900 text-gray-500"
                  >
                    Select Method
                  </option>
                  <option value="1" className="bg-zinc-900">
                    CASH
                  </option>
                  <option value="2" className="bg-zinc-900">
                    BANK_TRANSFER
                  </option>
                </select>
                {formErrors.paymentMethodId && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.paymentMethodId}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Transaction Reference
                </label>
                <Input
                  placeholder="e.g. TXN-12345"
                  value={payForm.transactionReference || ""}
                  onChange={(e) =>
                    setPayForm({
                      ...payForm,
                      transactionReference: e.target.value,
                    })
                  }
                />
                {formErrors.transactionReference && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.transactionReference}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Note (optional)
                </label>
                <Input
                  placeholder="Add any notes here..."
                  value={payForm.note || ""}
                  onChange={(e) =>
                    setPayForm({ ...payForm, note: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowPayForm(false)}
                disabled={isPaying}
                className="bg-zinc-800 border-zinc-700 text-gray-300 hover:text-white hover:bg-zinc-700"
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                onClick={handlePay}
                isLoading={isPaying}
                disabled={!payForm.paymentMethodId || isPaying}
              >
                <CreditCard size={16} className="mr-2" /> Pay Now
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};
