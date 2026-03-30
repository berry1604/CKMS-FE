import { useState, useEffect, useCallback } from "react";
import { CreditCard, Building2, Calendar, FileText } from "lucide-react";
import { cn } from "../../utils/classNames";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Drawer } from "../../components/ui/Drawer";
import { billingApi } from "../../services/billing.api";
import { toast } from "react-hot-toast";
import type {
  BillingStatementDetailResponse,
  PaymentStatementRequest,
} from "../../types/billing";
import { storeOrderApi } from "../../services/storeOrderApi";
import type { OrderDetailResponse } from "../../types/storeOrder";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState<PaymentStatementRequest>({
    paymentMethodId: 0,
    transactionReference: "",
    note: "",
  });
  const [orderDetailsMap, setOrderDetailsMap] = useState<
    Record<number, OrderDetailResponse[]>
  >({});

  // Fetch detail when opened
  const fetchDetail = useCallback(async () => {
    if (!statementId) return;
    setIsLoading(true);
    try {
      const data = await billingApi.getStatementDetail(statementId);
      setDetail(data);
    } catch (error) {
      console.error("Không thể tải chi tiết bảng kê:", error);
      toast.error("Không thể tải chi tiết bảng kê");
    } finally {
      setIsLoading(false);
    }
  }, [statementId]);

  // Trigger fetch when drawer opens
  useEffect(() => {
    if (isOpen && statementId) {
      fetchDetail();
    }
  }, [isOpen, statementId, fetchDetail]);

  // Fetch order details for each invoice
  useEffect(() => {
    if (detail?.invoices) {
      const fetchAllOrderDetails = async () => {
        const newMap: Record<number, OrderDetailResponse[]> = {
          ...orderDetailsMap,
        };
        let changed = false;

        const promises = detail.invoices
          .filter((inv) => inv.orderId && !orderDetailsMap[inv.orderId])
          .map(async (inv) => {
            try {
              const order = await storeOrderApi.getOrderById(inv.orderId!);
              if (order?.orderDetails) {
                newMap[inv.orderId!] = order.orderDetails;
                changed = true;
              }
            } catch (err) {
              console.error(`Failed to fetch order ${inv.orderId}`, err);
            }
          });

        await Promise.all(promises);
        if (changed) {
          setOrderDetailsMap(newMap);
        }
      };

      fetchAllOrderDetails();
    }
  }, [detail?.invoices, orderDetailsMap]);

  const handlePay = async () => {
    if (!statementId) return;
    setIsPaying(true);
    try {
      await billingApi.payStatement(statementId, payForm);
      toast.success("Xử lý thanh toán thành công!");
      setShowPayForm(false);
      onPaid?.();
      onClose();
    } catch (error: unknown) {
      let msg = "Thanh toán thất bại";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
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
        Đóng
      </Button>
      <div className="flex gap-2">
        {detail &&
          detail.status?.toUpperCase() !== "PAID" &&
          detail.status?.toUpperCase() !== "CANCELLED" && (
            <Button
              onClick={() => setShowPayForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CreditCard size={16} className="mr-2" /> Đánh dấu đã thanh toán
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
        title="Chi tiết bảng kê"
        description={statementId ? `Hồ sơ đối soát số hiệu #${statementId}` : ""}
        width="max-w-3xl"
        footer={footer}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] animate-pulse">Truy xuất dữ liệu...</p>
          </div>
        ) : detail ? (
          <div className="space-y-8 pb-10">
            {/* Header Status Board */}
            <div className="bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-3xl p-8 border border-[var(--border-primary)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full group-hover:bg-amber-500/10 transition-colors"></div>
              
              <div className="flex items-center gap-5 relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-amber-500 shadow-inner">
                  <Building2 size={28} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-[var(--text-primary)] tracking-tight uppercase italic group-hover:text-amber-500 transition-colors">
                    {detail.store?.name || `Store #${detail.store?.id}`}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40"></div>
                    <p className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] italic">
                      {detail.cycleName || "Kỳ thanh toán định kỳ"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end relative z-10">
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2rem] italic border mb-4",
                  getStatusVariant(detail.status) === 'success' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" :
                    getStatusVariant(detail.status) === 'warning' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      getStatusVariant(detail.status) === 'danger' ? "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse" :
                        "bg-[var(--bg-root)] text-[var(--text-secondary)]/40 border-[var(--border-primary)]"
                )}>
                  {detail.status?.toUpperCase()}
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-3xl font-black text-[var(--text-primary)] italic tracking-tighter">
                    {detail.totalAmount?.toLocaleString("vi-VN")} <span className="text-xs not-italic text-[var(--text-secondary)]/40 font-bold ml-1 uppercase">VND</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-5 border-[var(--border-primary)] shadow-sm bg-[var(--bg-card)]/30 backdrop-blur-md rounded-2xl group/stat hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--bg-root)] text-amber-500/50 rounded-xl border border-[var(--border-primary)] group-hover/stat:text-amber-500 transition-colors shadow-inner">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic leading-none mb-1.5">
                      Kỳ bắt đầu
                    </p>
                    <p className="font-black text-[var(--text-primary)] italic tracking-tight text-sm">
                      {detail.periodStart}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-5 border-[var(--border-primary)] shadow-sm bg-[var(--bg-card)]/30 backdrop-blur-md rounded-2xl group/stat hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--bg-root)] text-amber-500/50 rounded-xl border border-[var(--border-primary)] group-hover/stat:text-amber-500 transition-colors shadow-inner">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic leading-none mb-1.5">
                      Kỳ kết thúc
                    </p>
                    <p className="font-black text-[var(--text-primary)] italic tracking-tight text-sm">
                      {detail.periodEnd}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {detail.paidAt && (
              <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity">
                  <CreditCard size={80} className="text-emerald-500" />
                </div>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <p className="text-sm text-emerald-500 font-black italic tracking-tight uppercase">
                      Xác nhận thanh toán
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div>
                      <p className="text-[9px] font-black text-emerald-500/40 uppercase tracking-widest italic mb-1">Thời gian</p>
                      <p className="text-xs font-black text-[var(--text-secondary)] italic">
                        {new Date(detail.paidAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-emerald-500/40 uppercase tracking-widest italic mb-1">Phương thức</p>
                      <p className="text-xs font-black text-[var(--text-secondary)] italic">
                        {detail.paymentMethodName || "N/A"}
                      </p>
                    </div>
                  </div>
                  {detail.transactionReference && (
                    <div className="pt-2 border-t border-emerald-500/10">
                      <p className="text-[9px] font-black text-emerald-500/40 uppercase tracking-widest italic mb-1">Mã tham chiếu giao dịch</p>
                      <p className="text-xs font-mono font-black text-[var(--text-primary)] tracking-wider">
                        {detail.transactionReference}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoices Table */}
            {detail.invoices && detail.invoices.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-1">
                  <FileText size={16} className="text-amber-500/50" />
                  <h4 className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.3em] italic">Danh sách hóa đơn chi tiết</h4>
                  <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-primary)] to-transparent"></div>
                </div>
                {detail.invoices.map((inv, invIdx) => {
                  const items = inv.orderId
                    ? orderDetailsMap[inv.orderId] || []
                    : [];
                  return (
                    <Card
                      key={invIdx}
                      className="overflow-hidden border-[var(--border-primary)] bg-[var(--bg-card)]/20 backdrop-blur-sm rounded-2xl group/card hover:border-amber-500/20 transition-all duration-500"
                    >
                      {/* Invoice sub-header */}
                      <div className="bg-[var(--bg-root)]/50 px-6 py-5 border-b border-[var(--border-primary)]/40 flex items-center justify-between group-hover/card:bg-[var(--bg-root)] transition-colors">
                        <div className="flex items-center gap-5">
                          <div className="flex flex-col">
                            <span className="font-mono text-[10px] text-amber-500 font-black tracking-widest">
                              #{inv.invoiceId}
                            </span>
                            <span className="text-[9px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest italic mt-1 font-sans">
                              Đơn hàng #{inv.orderId || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          {inv.issuedAt && (
                            <span className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest italic hidden sm:block">
                              {new Date(inv.issuedAt).toLocaleDateString("vi-VN")}
                            </span>
                          )}
                          <div className="text-right">
                            {inv.shippingFee && inv.shippingFee > 0 && (
                              <div className="text-[8px] text-amber-500/60 font-black uppercase tracking-widest leading-none mb-1">
                                Phí vận chuyển: {inv.shippingFee.toLocaleString("vi-VN")}₫
                              </div>
                            )}
                            <span className="font-black text-xl text-[var(--text-primary)] tracking-tighter italic group-hover/card:text-amber-500 transition-colors">
                              {inv.amount?.toLocaleString("vi-VN")}{" "}
                              <span className="text-[10px] not-italic text-[var(--text-secondary)]/30 font-black ml-1">VND</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Line Items Table */}
                      <div className="bg-transparent overflow-x-auto">
                        <table className="min-w-full divide-y divide-[var(--border-primary)]/20">
                          <thead>
                            <tr className="bg-[var(--text-primary)]/[0.02]">
                              <th className="px-6 py-4 text-left text-[8px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em]">Sản phẩm</th>
                              <th className="px-6 py-4 text-center text-[8px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em]" style={{ width: "60px" }}>SL</th>
                              <th className="px-6 py-4 text-right text-[8px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em]" style={{ width: "120px" }}>Đơn giá</th>
                              <th className="px-6 py-4 text-right text-[8px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em]" style={{ width: "130px" }}>Tổng cộng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-primary)]/10">
                            {items.length > 0 ? (
                               items.map((item, itemIdx) => (
                                 <tr
                                   key={itemIdx}
                                   className="hover:bg-amber-500/[0.02] transition-colors group/row"
                                >
                                  <td className="px-6 py-4">
                                    <p className="text-xs text-[var(--text-primary)] font-black tracking-tight italic uppercase group-hover/row:text-amber-500 transition-colors">
                                      {item.productName}
                                    </p>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-black font-mono text-amber-500/80 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                      {item.quantity}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="text-[10px] text-[var(--text-secondary)]/60 font-bold italic">
                                      {item.unitPrice?.toLocaleString("vi-VN")}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className="text-xs text-[var(--text-primary)] font-black tracking-tighter font-mono italic">
                                      {item.subTotal?.toLocaleString("vi-VN")}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-6 py-12 text-center"
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                                    <p className="text-[8px] font-black text-[var(--text-secondary)]/30 uppercase tracking-[0.3em] italic">Đang truy xuất dữ liệu sản phẩm...</p>
                                  </div>
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
                <div className="bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-2xl border border-[var(--border-primary)] px-8 py-6 flex items-center justify-between shadow-xl relative overflow-hidden group/total">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex flex-col relative z-10">
                    <span className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.3em] italic">
                      Tổng giá trị đối soát
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)]/40 uppercase tracking-widest mt-1">
                      {detail.invoices.length} chứng từ hóa đơn
                    </span>
                  </div>
                  <div className="relative z-10 text-right">
                    <span className="text-4xl font-black text-[var(--text-primary)] tracking-tighter italic group-hover:text-amber-500 transition-colors">
                      {detail.totalAmount?.toLocaleString("vi-VN")}{" "}
                      <span className="text-xs font-black text-amber-500/60 not-italic ml-1 uppercase">VND</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[var(--text-secondary)]/40 text-center py-8">Không tìm thấy dữ liệu.</p>
        )}
      </Drawer>

      {showPayForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <Card className="bg-[var(--bg-card)] w-full max-w-md rounded-[2.5rem] border border-[var(--border-primary)] shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="p-10 border-b border-[var(--border-primary)] bg-amber-500/5 text-center">
                <h3 className="text-2xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter mb-1">Xác nhận thanh toán</h3>
                <p className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.3em] italic">Ghi nhận giao dịch hoàn tất</p>
             </div>
             
             <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic ml-1">Phương thức ghi nhận</label>
                  <select
                    className="w-full h-14 px-5 bg-[var(--bg-root)] border border-[var(--border-primary)] focus:border-amber-500/50 rounded-2xl text-[var(--text-primary)] font-bold text-sm outline-none transition-all appearance-none"
                    value={payForm.paymentMethodId}
                    onChange={(e) => setPayForm({ ...payForm, paymentMethodId: Number(e.target.value) })}
                  >
                    <option value={0}>Chọn phương thức...</option>
                    <option value={1}>Chuyển khoản ngân hàng</option>
                    <option value={2}>Tiền mặt / Khác</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic ml-1">Mã tham chiếu / Transaction ID</label>
                  <Input
                    placeholder="ví dụ: TXN-99887766"
                    className="h-14 bg-[var(--bg-root)] border-[var(--border-primary)] focus:border-amber-500 rounded-2xl font-black italic tracking-wider uppercase text-xs"
                    value={payForm.transactionReference}
                    onChange={(e) => setPayForm({ ...payForm, transactionReference: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic ml-1">Ghi chú nội bộ</label>
                  <Input
                    placeholder="Thông tin bổ sung..."
                    className="h-14 bg-[var(--bg-root)] border-[var(--border-primary)] focus:border-amber-500 rounded-2xl font-medium"
                    value={payForm.note}
                    onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                  />
                </div>
             </div>
             
             <div className="p-10 pt-0 flex gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowPayForm(false)}
                  className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Hủy bỏ
                </Button>
                <Button 
                  onClick={handlePay} 
                  disabled={isPaying || payForm.paymentMethodId === 0}
                  className="flex-1 h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all font-black uppercase tracking-widest"
                >
                  {isPaying ? "Đang xử lý..." : "Xác nhận"}
                </Button>
             </div>
          </Card>
        </div>
      )}
    </>
  );
};
