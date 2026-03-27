import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  AlertCircle,
  Filter,
  Eye,
  FileText,
  Layers,
  Trash2,
  Calendar,
  Wallet,
  ArrowRight,
  TrendingUp,
  Sparkles,
  CreditCard,
  Loader2,
} from "lucide-react";
import { BillingDetailDrawer } from "./InvoiceDetailDrawer";
import { billingApi } from "../../services/billing.api";
import { toast } from "react-hot-toast";
import type { BillingStatementSummaryResponse } from "../../types/billing";
import type { BatchBillingStatementResponse } from "../../types/billing";
import { cn } from "../../utils/classNames";
import { Button } from "../../components/ui/Button";
import billingHeaderBg from "../../assets/billing_dashboard_bg.png";
import { useAuth } from "../../hooks/useAuth";

type BillingStatus =
  | "all"
  | "DRAFT"
  | "ISSUED"
  | "OVERDUE"
  | "PAID"
  | "CANCELLED";

export const BillingList = () => {
  const [statements, setStatements] = useState<
    BillingStatementSummaryResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(
    null,
  );
  const { hasAuthority, user } = useAuth();
  const isStaff = hasAuthority("STORE_STAFF");

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<BillingStatus>("all");

  // Modals
  const [showManualModal, setShowManualModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statementToDelete, setStatementToDelete] = useState<number | null>(null);
  
  // Store name map (statementId -> storeName)
  const [storeNameMap, setStoreNameMap] = useState<Record<number, string>>({});

  // VNPay state
  const [isPayingVNPay, setIsPayingVNPay] = useState<number | null>(null);

  // Manual Statement form
  const [manualForm, setManualForm] = useState({
    storeId: "",
    periodStart: "",
    periodEnd: "",
  });

  // Batch Statement form
  const [batchForm, setBatchForm] = useState({
    cycleName: "",
    periodStart: "",
    periodEnd: "",
  });

  // Store ID filter
  const [storeIdFilter, setStoreIdFilter] = useState("");

  // Batch result
  const [_batchResult, setBatchResult] =
    useState<BatchBillingStatementResponse | null>(null);

  const fetchStatements = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: {
        storeId?: number;
        status?: string;
        page: number;
        size: number;
      } = {
        page,
        size: 10,
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (isStaff && user?.storeId) {
        params.storeId = Number(user.storeId);
      } else if (storeIdFilter) {
        params.storeId = Number(storeIdFilter);
      }
      const res = await billingApi.getStatements(params);
      const stmts = res.content || [];
      setStatements(stmts);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);

      // Fetch store names for each statement via detail API
      if (stmts.length > 0) {
        const results = await Promise.allSettled(
          stmts.map((s) => billingApi.getStatementDetail(s.statementId, isStaff ? user?.storeId : undefined))
        );
        const nameMap: Record<number, string> = {};
        results.forEach((result, idx) => {
          if (result.status === "fulfilled" && result.value?.store?.name) {
            nameMap[stmts[idx].statementId] = result.value.store.name;
          }
        });
        setStoreNameMap(nameMap);
      }
    } catch (error) {
      console.error("Không thể tải danh sách bảng kê:", error);
      toast.error("Không thể tải danh sách bảng kê");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, storeIdFilter]);

  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [statusFilter, storeIdFilter]);

  const handleDelete = (id: number) => {
    setStatementToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!statementToDelete) return;
    try {
      await billingApi.deleteStatement(statementToDelete);
      toast.success("Xóa bảng kê thành công");
      fetchStatements();
      setIsDeleteModalOpen(false);
    } catch (error: unknown) {
      let msg = "Không thể xóa bảng kê";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        msg = axiosError.response?.data?.message || msg;
      }
      toast.error(msg);
    } finally {
    }
  };

  const handleVNPayPayment = async (statementId: number) => {
    setIsPayingVNPay(statementId);
    try {
      const paymentUrl = await billingApi.createVnPayUrl(statementId, isStaff ? user?.storeId : undefined);
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        toast.error("Không thể tạo link thanh toán VNPay");
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Lỗi khi tạo link thanh toán VNPay";
      toast.error(msg);
    } finally {
      setIsPayingVNPay(null);
    }
  };


  const handleGenerateManual = async () => {
    if (
      !manualForm.storeId ||
      !manualForm.periodStart ||
      !manualForm.periodEnd
    ) {
      toast.error("Vui lòng nhập đầy đủ các trường");
      return;
    }
    setIsGenerating(true);
    try {
      await billingApi.generateManualStatement(
        Number(manualForm.storeId),
        manualForm.periodStart,
        manualForm.periodEnd,
      );
      toast.success("Tạo bảng kê thành công!");
      setShowManualModal(false);
      setManualForm({ storeId: "", periodStart: "", periodEnd: "" });
      fetchStatements();
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Không thể tạo bảng kê";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBatch = async () => {
    if (
      !batchForm.cycleName ||
      !batchForm.periodStart ||
      !batchForm.periodEnd
    ) {
      toast.error("Vui lòng nhập đầy đủ các trường");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await billingApi.generateBatchStatements(batchForm);
      setBatchResult(result);
      toast.success(
        `Hoàn tất xử lý loạt: tạo ${result.totalStatementsCreated}, bỏ qua ${result.storesSkippedNoInvoices}`,
      );
      setShowBatchModal(false);
      setBatchForm({ cycleName: "", periodStart: "", periodEnd: "" });
      fetchStatements();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Không thể tạo bảng kê hàng loạt";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusVariant = (
    status: string,
  ): "success" | "warning" | "danger" | "default" => {
    const s = status?.toUpperCase();
    if (s === "PAID") return "success";
    if (s === "ISSUED" || s === "DRAFT") return "warning";
    if (s === "OVERDUE") return "danger";
    return "default";
  };



  const statusOptions: { value: BillingStatus; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "DRAFT", label: "Nháp" },
    { value: "ISSUED", label: "Đã phát hành" },
    { value: "PAID", label: "Đã thanh toán" },
    { value: "OVERDUE", label: "Quá hạn" },
    { value: "CANCELLED", label: "Đã hủy" },
  ];

  // Count summary stats from current page (basic)
  const paidCount = statements.filter(
    (s) => s.status?.toUpperCase() === "PAID",
  ).length;
  const overdueCount = statements.filter(
    (s) => s.status?.toUpperCase() === "OVERDUE",
  ).length;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-700">
      {/* Cinematic Financial Header */}
      <div className="relative h-[350px] rounded-[3rem] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.4)] mb-8 group border border-white/5">
        <img
          src={billingHeaderBg}
          alt="Billing Dashboard"
          className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-[4000ms] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent"></div>

        <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row justify-between items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                <Wallet size={32} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter drop-shadow-2xl leading-none">
                  Hóa đơn <span className="text-amber-400">&</span> Đối soát
                </h1>
                <p className="text-zinc-400 font-black uppercase tracking-[0.4em] text-[10px] italic mt-2 flex items-center gap-2">
                  <Sparkles size={12} className="text-amber-400 animate-pulse" />
                  Hệ thống quản lý tài chính ELITE NETWORK
                </p>
              </div>
            </div>
          </div>

          {!isStaff && (
            <div className="flex flex-wrap items-center gap-4 relative z-10">
              <Button
                variant="outline"
                onClick={() => setShowManualModal(true)}
                className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-zinc-300 font-black uppercase tracking-widest text-[10px] px-8 py-6 h-auto rounded-2xl transition-all hover:scale-105 active:scale-95 italic border-0"
              >
                <FileText size={18} className="mr-2 text-zinc-400" /> Tạo đơn lẻ
              </Button>
              <Button
                onClick={() => setShowBatchModal(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black uppercase tracking-widest px-10 py-6 h-auto rounded-[1.75rem] shadow-[0_15px_30px_rgba(245,158,11,0.2)] hover:scale-[1.05] active:scale-95 transition-all italic border-0 h-full"
              >
                <Layers size={18} className="mr-3" strokeWidth={3} /> Xuất hóa đơn loạt
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Luminous Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4">
            <TrendingUp className="text-zinc-800" size={40} />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic mb-2 block">Tổng quyết toán</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white italic tracking-tighter">{totalElements}</span>
              <span className="text-zinc-700 text-[10px] font-black uppercase italic">Văn bản</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1 w-12 bg-amber-500/30 rounded-full"></div>
              <span className="text-[9px] text-zinc-500 font-bold uppercase italic">Dữ liệu thời gian thực</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-green-500/30 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4">
            <DollarSign className="text-green-500/20" size={40} />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic mb-2 block">Thành công</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-green-500 italic tracking-tighter">{paidCount}</span>
              <span className="text-green-900/50 text-[10px] font-black uppercase italic">Hợp lệ</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1 w-12 bg-green-500/30 rounded-full"></div>
              <span className="text-[9px] text-zinc-500 font-bold uppercase italic">Đã thanh toán</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-rose-500/30 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4">
            <AlertCircle className="text-rose-500/20" size={40} />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic mb-2 block">Trễ hạn</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-rose-500 italic tracking-tighter">{overdueCount}</span>
              <span className="text-rose-900/50 text-[10px] font-black uppercase italic">Rủi ro</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1 w-12 bg-rose-500/30 rounded-full"></div>
              <span className="text-[9px] text-zinc-500 font-bold uppercase italic">Cần đối soát</span>
            </div>
          </div>
        </div>
      </div>

      {/* Glass Filtering Toolbar */}
      <div className="bg-[#080808]/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-6 mb-8 shadow-2xl overflow-hidden relative">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/5 blur-[120px] rounded-full"></div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-500 border border-white/5 mr-2">
              <Filter size={18} />
            </div>
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all border",
                  statusFilter === opt.value
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                    : "bg-zinc-950 border-white/5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-5 w-full lg:w-auto bg-zinc-950/80 px-6 py-3 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">Mã cửa hàng</span>
            <div className="w-px h-6 bg-zinc-800"></div>
            <input
              type="number"
              min="1"
              placeholder="Tất cả"
              className="bg-transparent border-0 text-white font-bold w-24 text-center focus:outline-none placeholder:text-zinc-800"
              value={storeIdFilter}
              onChange={(e) => setStoreIdFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Modernized Billing List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-zinc-950/50 backdrop-blur-xl rounded-[3rem] p-32 text-center border border-white/5">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-6 text-zinc-600 font-black uppercase tracking-[0.4em] text-[10px] italic">Đang đồng bộ hóa sổ cái...</p>
          </div>
        ) : statements.length === 0 ? (
          <div className="bg-zinc-950/50 backdrop-blur-xl rounded-[3rem] p-32 text-center border border-white/5">
            <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-[10px] italic">Không tìm thấy dữ liệu hóa đơn</p>
          </div>
        ) : (
          statements.map((s) => (
            <div
              key={s.statementId}
              className="group flex flex-col xl:flex-row items-center justify-between p-8 bg-[#0d0d0d]/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] hover:-translate-y-1 relative overflow-hidden"
              onClick={() => setSelectedStatementId(s.statementId)}
            >
              <div className="absolute -right-20 -top-20 w-48 h-48 bg-amber-500/5 blur-[80px] rounded-full group-hover:bg-amber-500/10 transition-colors duration-700"></div>

              <div className="flex flex-col md:flex-row items-center gap-8 w-full xl:w-auto relative z-10">
                <div className="w-20 h-20 rounded-[1.75rem] bg-zinc-950 flex flex-col items-center justify-center text-zinc-700 group-hover:text-amber-500 transition-colors border border-white/5 shadow-inner">
                  <FileText size={24} className="mb-1" />
                  <span className="text-[10px] font-mono opacity-50">#{s.statementId}</span>
                </div>

                <div className="space-y-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-amber-400 transition-colors">
                      {storeNameMap[s.statementId] || s.storeName || (isStaff && user?.storeName ? user.storeName : `Cửa hàng #${s.statementId}`)}
                    </h3>
                    <div className={cn(
                      "px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border",
                      getStatusVariant(s.status) === 'success' ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]" :
                        getStatusVariant(s.status) === 'warning' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          getStatusVariant(s.status) === 'danger' ? "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse" :
                            "bg-zinc-950 text-zinc-600 border-white/5"
                    )}>
                      {s.status?.toUpperCase() || 'Chưa xác định'}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-zinc-700" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">{s.cycleName || '—'}</span>
                    </div>
                    <div className="w-1 h-1 bg-zinc-800 rounded-full"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-600 uppercase italic">Ngày tạo:</span>
                      <span className="text-[10px] font-black text-zinc-700 uppercase italic">{s.issuedAt ? new Date(s.issuedAt).toLocaleDateString("vi-VN") : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-12 mt-10 xl:mt-0 w-full xl:w-auto relative z-10">
                <div className="flex flex-col items-center md:items-end">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1 italic">Giá trị đối soát</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white italic tracking-tighter transition-all group-hover:text-amber-400">
                      {s.totalAmount?.toLocaleString("vi-VN")}
                    </span>
                    <span className="text-zinc-600 text-xs font-black uppercase italic">VND</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedStatementId(s.statementId)}
                    className="flex-1 md:flex-none h-14 px-10 rounded-2xl bg-zinc-950 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/30 transition-all font-black uppercase tracking-widest text-xs italic flex items-center justify-center gap-3 shadow-inner group/btn"
                  >
                    <Eye size={18} className="transition-transform group-hover/btn:scale-110" /> Xem Chi tiết
                  </button>

                  {!['PAID', 'CANCELLED'].includes(s.status?.toUpperCase() || '') && isStaff && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedStatementId(s.statementId)}
                        className="h-14 px-6 rounded-2xl bg-zinc-950 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/30 transition-all font-black uppercase tracking-widest text-[10px] italic flex items-center justify-center gap-2 shadow-inner"
                      >
                        <CreditCard size={16} />
                        Thanh toán
                      </button>
                      <button
                        onClick={() => handleVNPayPayment(s.statementId)}
                        disabled={isPayingVNPay === s.statementId}
                        className="h-14 px-6 rounded-2xl bg-[#004791]/20 text-[#004791] hover:bg-[#004791] hover:text-white border border-[#004791]/30 transition-all font-black uppercase tracking-widest text-[10px] italic flex items-center justify-center gap-2 shadow-inner disabled:opacity-50"
                      >
                        {isPayingVNPay === s.statementId ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CreditCard size={16} />
                        )}
                        VNPay
                      </button>
                    </div>
                  )}

                  {!isStaff && (
                    <button
                      onClick={() => handleDelete(s.statementId)}
                      className="w-14 h-14 rounded-2xl bg-zinc-950 text-zinc-800 hover:text-rose-500 border border-white/5 hover:border-rose-500/40 transition-all flex items-center justify-center shadow-inner"
                    >
                      <Trash2 size={24} />
                    </button>
                  )}
                  <div className="ml-4 hidden md:block">
                    <ArrowRight size={28} className="text-zinc-900 group-hover:text-amber-400 group-hover:translate-x-2 transition-all duration-500" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Elite Pagination */}
      {totalPages > 1 && (
        <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-10 px-12 py-8 bg-[#080808]/60 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] italic mb-1">Dữ liệu tài chính</span>
            <div className="text-xs font-black text-zinc-400 uppercase tracking-widest italic">
              Trang <span className="text-amber-400">{page + 1}</span> / <span className="text-zinc-200">{totalPages}</span>
              <span className="mx-3 opacity-20">|</span>
              <span className="text-zinc-500">{totalElements} bản ghi đối soát</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="bg-zinc-950 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 border border-white/5 hover:border-amber-400/30 rounded-2xl px-12 h-14 font-black uppercase tracking-[0.2em] italic transition-all disabled:opacity-10"
            >
              Trước
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="bg-zinc-950 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 border border-white/5 hover:border-amber-400/30 rounded-2xl px-12 h-14 font-black uppercase tracking-[0.2em] italic transition-all disabled:opacity-10"
            >
              Tiếp theo
            </Button>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <BillingDetailDrawer
        statementId={selectedStatementId}
        isOpen={!!selectedStatementId}
        onClose={() => setSelectedStatementId(null)}
        onPaid={fetchStatements}
      />

      {/* Modal Re-implementations with Elite Aesthetic */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0f0f0f] rounded-[2.5rem] border border-white/10 shadow-2xl w-full max-w-md p-10 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-rose-500 border border-rose-500/20">
              <Trash2 size={32} />
            </div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Xác nhận xóa tài liệu</h2>
            <p className="text-zinc-500 italic mb-8">Bạn có chắc chắn muốn xóa bản đối soát này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 h-16 rounded-2xl bg-zinc-900 text-zinc-400 font-bold uppercase tracking-widest text-xs italic">Hủy</button>
              <button onClick={confirmDelete} className="flex-1 h-16 rounded-2xl bg-rose-600 text-black font-bold uppercase tracking-widest text-xs italic shadow-lg">Xóa bản ghi</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual & Batch Modals (Redesigned as Elite Overlays) */}
      {showManualModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] w-full max-w-lg rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-amber-500/5 p-12 text-center border-b border-white/5">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Tạo hóa đơn lẻ</h2>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] italic">Khởi tạo chứng từ đối soát thủ công</p>
            </div>

            <div className="p-12 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Mã cửa hàng đối tác</label>
                <input
                  type="number"
                  min="1"
                  placeholder="ví dụ: 1"
                  value={manualForm.storeId}
                  onChange={(e) => setManualForm({ ...manualForm, storeId: e.target.value })}
                  className="w-full h-16 px-6 bg-zinc-950 border border-white/5 focus:border-amber-500/50 rounded-2xl text-white font-bold outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Kỳ bắt đầu</label>
                  <input
                    type="date"
                    value={manualForm.periodStart}
                    onChange={(e) => setManualForm({ ...manualForm, periodStart: e.target.value })}
                    className="w-full h-16 px-6 bg-zinc-950 border border-white/5 focus:border-amber-500/50 rounded-2xl text-white font-bold outline-none transition-all color-scheme-dark"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Kỳ kết thúc</label>
                  <input
                    type="date"
                    value={manualForm.periodEnd}
                    onChange={(e) => setManualForm({ ...manualForm, periodEnd: e.target.value })}
                    className="w-full h-16 px-6 bg-zinc-950 border border-white/5 focus:border-amber-500/50 rounded-2xl text-white font-bold outline-none transition-all color-scheme-dark"
                  />
                </div>
              </div>
            </div>

            <div className="px-12 pb-12 flex gap-4">
              <button
                onClick={() => setShowManualModal(false)}
                className="flex-1 h-16 rounded-2xl bg-zinc-900 text-zinc-500 hover:text-white font-black uppercase tracking-widest text-xs italic transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleGenerateManual}
                disabled={isGenerating}
                className="flex-1 h-16 rounded-2xl bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest text-xs italic shadow-[0_15px_30px_rgba(245,158,11,0.2)] transition-all flex items-center justify-center"
              >
                {isGenerating ? <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" /> : "Phát hành hóa đơn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Statement Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] w-full max-w-lg rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-orange-500/5 p-12 text-center border-b border-white/5">
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Quyết toán loạt</h2>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] italic">Pht hành chứng từ đồng bộ toàn hệ thống</p>
            </div>

            <div className="p-12 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Tên chu kỳ tài chính</label>
                <input
                  placeholder="ví dụ: Q1-2026"
                  value={batchForm.cycleName}
                  onChange={(e) => setBatchForm({ ...batchForm, cycleName: e.target.value })}
                  className="w-full h-16 px-6 bg-zinc-950 border border-white/5 focus:border-orange-500/50 rounded-2xl text-white font-bold outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Kỳ bắt đầu</label>
                  <input
                    type="date"
                    value={batchForm.periodStart}
                    onChange={(e) => setBatchForm({ ...batchForm, periodStart: e.target.value })}
                    className="w-full h-16 px-6 bg-zinc-950 border border-white/5 focus:border-orange-500/50 rounded-2xl text-white font-bold outline-none transition-all color-scheme-dark"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Kỳ kết thúc</label>
                  <input
                    type="date"
                    value={batchForm.periodEnd}
                    onChange={(e) => setBatchForm({ ...batchForm, periodEnd: e.target.value })}
                    className="w-full h-16 px-6 bg-zinc-950 border border-white/5 focus:border-orange-500/50 rounded-2xl text-white font-bold outline-none transition-all color-scheme-dark"
                  />
                </div>
              </div>
            </div>

            <div className="px-12 pb-12 flex gap-4">
              <button
                onClick={() => setShowBatchModal(false)}
                className="flex-1 h-16 rounded-2xl bg-zinc-900 text-zinc-500 hover:text-white font-black uppercase tracking-widest text-xs italic transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleGenerateBatch}
                disabled={isGenerating}
                className="flex-1 h-16 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-black font-black uppercase tracking-widest text-xs italic shadow-[0_15px_30px_rgba(234,88,12,0.2)] transition-all flex items-center justify-center"
              >
                {isGenerating ? <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" /> : "Khởi tạo hàng loạt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
