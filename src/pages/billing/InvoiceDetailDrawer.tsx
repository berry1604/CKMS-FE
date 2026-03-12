import { useState, useEffect, useCallback } from "react";
import { CreditCard, Building2, Calendar, X, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Drawer } from "../../components/ui/Drawer";
import { billingApi } from "../../services/billing.api";
import { useAuth } from "../../hooks/useAuth"; // Added useAuth
import { toast } from "react-hot-toast";
import type {
  BillingStatementDetailResponse,
  PaymentStatementRequest,
} from "../../types/billing";

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
  const { hasAuthority } = useAuth(); // Use auth hook
  const [detail, setDetail] = useState<BillingStatementDetailResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState<PaymentStatementRequest>({
    paymentMethodId: 0,
    transactionReference: "",
    note: "",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Fetch detail when opened
  const fetchDetail = useCallback(async () => {
    if (!statementId) return;
    setIsLoading(true);
    try {
      const data = await billingApi.getStatementDetail(statementId);
      setDetail(data);
    } catch (error) {
      console.error("Failed to fetch statement detail:", error);
      toast.error("Failed to load statement details");
    } finally {
      setIsLoading(false);
    }
  }, [statementId]);

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
    }
  }, [isOpen, statementId, fetchDetail]);

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
      const response = await billingApi.payStatement(statementId, payForm);
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
          detail.status?.toUpperCase() !== "CANCELLED" && (
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

            {/* Invoices Table */}
            {detail.invoices && detail.invoices.length > 0 && (
              <Card className="overflow-hidden border-zinc-700 shadow-sm">
                <div className="bg-zinc-900/50">
                  <table className="min-w-full divide-y divide-zinc-800">
                    <thead>
                      <tr className="bg-zinc-900/80">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Invoice ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {detail.invoices.map((inv, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                            <span className="font-mono text-xs bg-zinc-800 px-2 py-1 rounded text-gray-300">
                              #{inv.invoiceId}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {inv.orderId ? (
                              <div>
                                <span className="font-mono text-xs">
                                  Order #{inv.orderId}
                                </span>
                                {inv.orderDate && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {new Date(inv.orderDate).toLocaleDateString(
                                      "vi-VN",
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {inv.status ? (
                              <Badge
                                variant={
                                  inv.status === "PAID" ? "success" : "warning"
                                }
                                size="sm"
                              >
                                {inv.status}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200 text-right">
                            {inv.amount?.toLocaleString("vi-VN")} VND
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-900/80">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-4 text-right text-base font-bold text-gray-200"
                        >
                          Total
                        </td>
                        <td className="px-6 py-4 text-right text-base font-bold text-amber-600">
                          {detail.totalAmount?.toLocaleString("vi-VN")} VND
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-200">
                Confirm Payment
              </h2>
              <button
                onClick={() => setShowPayForm(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
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
                  <option value="" disabled>
                    Select Method
                  </option>
                  <option value="1">CASH</option>
                  <option value="2">BANK_TRANSFER</option>
                </select>
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
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handlePay}
                isLoading={isPaying}
                disabled={!payForm.paymentMethodId}
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
