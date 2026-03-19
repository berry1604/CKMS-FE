import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { billingApi } from "../../services/billing.api";
import { useAuth } from "../../hooks/useAuth";

/**
 * VNPayReturn page – handles the browser redirect from VNPay after payment.
 * VNPay appends query params: vnp_ResponseCode, vnp_Amount, vnp_OrderInfo, etc.
 * The backend has already verified the signature via GET /api/v1/billing-statements/vnpay-return.
 * This page just reads vnp_ResponseCode and shows success or failure UI.
 */
export const VNPayReturn = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
    const [orderId, setOrderId] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [bankCode, setBankCode] = useState<string>("");
    const [transactionNo, setTransactionNo] = useState<string>("");
    const { user, hasAuthority } = useAuth();
    const isStaff = hasAuthority("STORE_STAFF");

    useEffect(() => {
        const responseCode = searchParams.get("vnp_ResponseCode");
        const vnpAmount = searchParams.get("vnp_Amount");
        const vnpOrderInfo = searchParams.get("vnp_OrderInfo");
        const vnpBankCode = searchParams.get("vnp_BankCode");
        const vnpTransactionNo = searchParams.get("vnp_TransactionNo");

        setOrderId(vnpOrderInfo || "");
        setAmount(vnpAmount ? (Number(vnpAmount) / 100).toLocaleString("vi-VN") : "");
        setBankCode(vnpBankCode || "");
        setTransactionNo(vnpTransactionNo || "");

        // vnp_ResponseCode "00" = success
        setStatus(responseCode === "00" ? "success" : "failed");

        // Gọi backend để lưu thông tin và xác nhận (dù IPN có thể đã chạy hoặc chưa)
        if (responseCode === "00") {
            const paramsToVerify: Record<string, string> = {};
            searchParams.forEach((val, key) => {
                paramsToVerify[key] = val;
            });

            billingApi.verifyVnPayReturn(paramsToVerify, isStaff ? user?.storeId : undefined)
                .then(() => console.log("Backend verified VNPay return successfully"))
                .catch((err: any) => console.error("VNPay verfication failed", err));
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
            <div className="w-full max-w-lg bg-[#0a0a0a] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95">
                {status === "loading" && (
                    <div className="p-20 flex flex-col items-center gap-6">
                        <Loader2 size={48} className="text-amber-400 animate-spin" />
                        <p className="text-zinc-400 font-black uppercase tracking-widest text-[10px] italic">
                            Đang xác nhận thanh toán...
                        </p>
                    </div>
                )}

                {status === "success" && (
                    <>
                        <div className="bg-green-500/5 p-12 text-center border-b border-white/5">
                            <CheckCircle size={56} className="text-green-400 mx-auto mb-4" />
                            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
                                Thanh toán thành công
                            </h1>
                            <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] italic">
                                Giao dịch đã được xác nhận bởi VNPay
                            </p>
                        </div>

                        <div className="p-10 space-y-4">
                            {[
                                { label: "Mã đơn hàng", value: orderId },
                                { label: "Số tiền", value: `${amount} VND` },
                                { label: "Ngân hàng", value: bankCode },
                                { label: "Mã giao dịch VNPay", value: transactionNo },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">{label}</span>
                                    <span className="text-sm font-black text-zinc-200">{value || "—"}</span>
                                </div>
                            ))}
                        </div>

                        <div className="px-10 pb-10">
                            <button
                                onClick={() => navigate("/billing")}
                                className="w-full h-16 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-black font-black uppercase tracking-widest text-xs italic shadow-[0_15px_30px_rgba(16,185,129,0.2)] transition-all"
                            >
                                Quay lại Billing
                            </button>
                        </div>
                    </>
                )}

                {status === "failed" && (
                    <>
                        <div className="bg-rose-500/5 p-12 text-center border-b border-white/5">
                            <XCircle size={56} className="text-rose-400 mx-auto mb-4" />
                            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
                                Thanh toán thất bại
                            </h1>
                            <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] italic">
                                Giao dịch không thành công hoặc bị hủy
                            </p>
                        </div>

                        <div className="p-10 space-y-4">
                            {[
                                { label: "Mã đơn hàng", value: orderId },
                                { label: "Mã giao dịch VNPay", value: transactionNo },
                                { label: "Mã lỗi", value: searchParams.get("vnp_ResponseCode") || "—" },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">{label}</span>
                                    <span className="text-sm font-black text-rose-400">{value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="px-10 pb-10 flex gap-4">
                            <button
                                onClick={() => navigate("/billing")}
                                className="flex-1 h-16 rounded-2xl bg-zinc-900 text-zinc-400 font-black uppercase tracking-widest text-xs italic hover:text-white transition-all"
                            >
                                Quay lại Billing
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
