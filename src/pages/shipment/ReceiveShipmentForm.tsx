import { useState, useEffect } from 'react';
import { Camera, AlertCircle, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { storeOrderApi } from '../../services/storeOrderApi';
import type { OrderDetailResponse } from '../../types/storeOrder';

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
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
                <h3 className="font-semibold text-indigo-400 mb-1 flex items-center gap-2">
                    <Camera size={18} /> Biểu Mẫu Nhận Hàng — Đơn #{shipmentId}
                </h3>
                <p className="text-xs text-indigo-300/80">
                    Vui lòng kiểm đếm thực tế số lượng hàng hóa nhận được. Cập nhật số lượng nếu có mất mát hoặc hư hỏng.
                </p>
            </div>

            <div className="border border-zinc-700 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-zinc-800/80">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-300">Sản phẩm</th>
                            <th className="px-4 py-3 font-semibold text-gray-300 text-center">SL Giao (Dự kiến)</th>
                            <th className="px-4 py-3 font-semibold text-gray-300 text-center w-32">Thực Nhận</th>
                            <th className="px-4 py-3 font-semibold text-gray-300 text-center">Tình trạng</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-900/40">
                        {Array.from(expectedItems.values()).map(item => {
                            const received = receivedQuantities[item.productId] ?? 0;
                            const isMissing = received < item.quantity;

                            return (
                                <tr key={item.productId} className={isMissing ? 'bg-red-500/5' : ''}>
                                    <td className="px-4 py-3 font-medium text-gray-200">{item.productName}</td>
                                    <td className="px-4 py-3 text-center text-gray-400 font-mono">{item.quantity}</td>
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="number"
                                            className={`w-full bg-zinc-950 border rounded px-2 py-1.5 text-center font-bold font-mono focus:ring-2 outline-none
                                                ${isMissing ? 'border-red-500/50 text-red-400 focus:ring-red-500' : 'border-zinc-700 text-green-400 focus:ring-green-500'}`}
                                            value={received.toString()}
                                            onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                            min={0}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {isMissing ? (
                                            <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded font-medium flex items-center justify-center gap-1">
                                                <AlertCircle size={12} /> Thiếu {item.quantity - received}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded font-medium">
                                                Đủ hàng
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {hasShortage && (
                <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex gap-3 items-start">
                    <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                    <div>
                        <p className="text-sm font-semibold text-red-400">Phát hiện thiếu hàng / hư hỏng</p>
                        <p className="text-xs text-red-300/80 mt-1">Vui lòng ghi rõ lý do và chụp ảnh đính kèm (Tính năng cập nhật sau) để lưu vết biên bản đồng kiểm.</p>
                    </div>
                </div>
            )}

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Ghi chú / Nhận xét lúc nhận hàng</label>
                <Input
                    placeholder="Tình trạng bao bì, nhiệt độ, lý do thiếu hàng..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-sm"
                />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800">
                <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Hủy Nhận</Button>
                <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Đang lưu...' : <><Save size={16} className="mr-2" /> Lưu Biên Bản & Xác Nhận</>}
                </Button>
            </div>
        </div>
    );
};
