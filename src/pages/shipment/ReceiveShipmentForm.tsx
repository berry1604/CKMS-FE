import { useState, useEffect } from 'react';
import { Camera, AlertCircle, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { storeOrderApi } from '../../services/storeOrderApi';
import type { OrderDetailResponse } from '../../types/storeOrder';
import { cn } from '../../utils/classNames';

interface ComponentProps {
    shipmentId: number;
    storeOrderIds: number[];
    onCancel: () => void;
    onSubmit: (data: { note: string, receivedQuantities: Record<number, number> }) => void;
    isSubmitting: boolean;
}

export const ReceiveShipmentForm = ({ shipmentId, storeOrderIds, onCancel, onSubmit, isSubmitting }: ComponentProps) => {
    const [expectedItems, setExpectedItems] = useState<Map<number, OrderDetailResponse>>(new Map());
    const [receivedQuantities, setReceivedQuantities] = useState<Record<number, number>>({});
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            setIsLoading(true);
            try {
                const itemMap = new Map<number, OrderDetailResponse>();

                // Fetch each order sequentially or in parallel
                for (const orderId of storeOrderIds) {
                    const order = await storeOrderApi.getOrderById(orderId);
                    if (order.orderDetails) {
                        for (const detail of order.orderDetails) {
                            if (itemMap.has(detail.productId)) {
                                const existing = itemMap.get(detail.productId)!;
                                itemMap.set(detail.productId, {
                                    ...existing,
                                    quantity: existing.quantity + detail.quantity
                                });
                            } else {
                                itemMap.set(detail.productId, detail);
                            }
                        }
                    }
                }
                setExpectedItems(itemMap);

                // Initialize received quantities to be equal to expected originally
                const initialReceived: Record<number, number> = {};
                itemMap.forEach((detail, productId) => {
                    initialReceived[productId] = detail.quantity;
                });
                setReceivedQuantities(initialReceived);

            } catch (error) {
                console.error("Failed to fetch order details for shipment", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (storeOrderIds && storeOrderIds.length > 0) {
            fetchOrderDetails();
        } else {
            setIsLoading(false);
        }
    }, [storeOrderIds]);

    const handleQuantityChange = (productId: number, val: string) => {
        const num = parseInt(val, 10);
        setReceivedQuantities(prev => ({
            ...prev,
            [productId]: isNaN(num) ? 0 : num
        }));
    };

    const hasShortage = Array.from(expectedItems.entries()).some(
        ([productId, detail]) => (receivedQuantities[productId] || 0) < detail.quantity
    );

    const handleSubmit = () => {
        onSubmit({
            note,
            receivedQuantities
        });
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-400">Đang tải danh sách mặt hàng...</div>;
    }

    if (expectedItems.size === 0) {
        return <div className="p-8 text-center text-gray-500">Đơn hàng không có sản phẩm nào để nhận.</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Form Header Alert */}
            <div className="bg-amber-950/20 border border-amber-500/20 p-6 rounded-[32px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.05),_transparent_60%)]"></div>
                <div className="relative z-10 flex items-start gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-inner">
                        <Camera size={24} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] mb-2">
                            Biểu Mẫu Nhận Hàng — Đơn #{shipmentId}
                        </h3>
                        <p className="text-[11px] text-zinc-400 font-bold leading-relaxed uppercase tracking-[0.1em]">
                            Vui lòng kiểm đếm thực tế số lượng hàng hóa nhận được. Cập nhật số lượng nếu có mất mát hoặc hư hỏng.
                        </p>
                    </div>
                </div>
            </div>

            {/* Items Table Container */}
            <div className="bg-black/40 border border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/50 border-b border-zinc-800">
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Sản phẩm</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-center">Giao (Dự kiến)</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-center w-40">Thực Nhận</th>
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-center">Tình trạng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 bg-transparent">
                            {Array.from(expectedItems.values()).map((item) => {
                                const received = receivedQuantities[item.productId] ?? 0;
                                const isMissing = received < item.quantity;

                                return (
                                    <tr 
                                        key={item.productId} 
                                        className={cn(
                                            "group/row transition-colors duration-500",
                                            isMissing ? 'bg-red-500/[0.03] hover:bg-red-500/[0.06]' : 'hover:bg-amber-500/[0.02]'
                                        )}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-amber-500/30 group-hover/row:bg-amber-500 transition-colors"></div>
                                                <span className="font-bold text-zinc-100 tracking-tight">{item.productName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center text-zinc-500 font-black font-mono tracking-tighter text-base">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="relative group/input">
                                                <input
                                                    type="number"
                                                    className={cn(
                                                        "w-full h-12 bg-black/60 border rounded-2xl text-center font-black font-mono text-lg focus:ring-4 outline-none transition-all duration-300 shadow-inner",
                                                        isMissing 
                                                            ? 'border-red-500/40 text-red-500 focus:ring-red-500/10 focus:border-red-500' 
                                                            : 'border-zinc-800 text-emerald-500 focus:ring-emerald-500/10 focus:border-emerald-500'
                                                    )}
                                                    value={received.toString()}
                                                    onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                                    min={0}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {isMissing ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400">
                                                    <AlertCircle size={14} className="animate-pulse" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Thiếu {item.quantity - received}</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400">
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Đủ hàng</span>
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

            {hasShortage && (
                <div className="bg-red-950/20 border border-red-500/20 p-6 rounded-[32px] flex gap-5 items-start animate-in fade-in zoom-in-95 duration-700 shadow-[0_20px_40px_-20px_rgba(239,68,68,0.1)]">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={24} />
                    <div className="space-y-1">
                        <p className="text-xs font-black text-red-400 uppercase tracking-[0.2em]">Phát hiện thiếu hàng / hư hỏng</p>
                        <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase tracking-[0.1em]">
                            Vui lòng ghi rõ lý do và chụp ảnh đính kèm (Tính năng cập nhật sau) để lưu vết biên bản đồng kiểm.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-3 group/note">
                <label className="text-[10px] font-black text-zinc-500 group-focus-within/note:text-amber-500 uppercase tracking-[0.3em] ml-2 transition-colors">
                    Ghi chú / Nhận xét lúc nhận hàng
                </label>
                <div className="relative">
                    <Input
                        placeholder="Tình trạng bao bì, nhiệt độ, lý do thiếu hàng..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="h-14 bg-black/40 border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/10 text-white rounded-2xl transition-all duration-300 text-sm font-medium px-5"
                    />
                </div>
            </div>

            <div className="pt-8 flex justify-end gap-5 border-t border-zinc-800/80">
                <Button 
                    variant="ghost" 
                    onClick={onCancel} 
                    disabled={isSubmitting}
                    className="h-14 px-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-inner"
                >
                    Hủy Nhận
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="group relative h-14 px-10 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-black uppercase text-[10px] tracking-[0.2em] overflow-hidden transition-all duration-500 shadow-2xl hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:border-emerald-500/50"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
                    <div className="relative z-10 flex items-center justify-center gap-3">
                        {isSubmitting ? (
                            <span className="animate-pulse">ĐANG KÝ XÁC NHẬN...</span>
                        ) : (
                            <><Save size={18} /> LƯU BIÊN BẢN & XÁC NHẬN</>
                        )}
                    </div>
                </Button>
            </div>
        </div>
    );
};
