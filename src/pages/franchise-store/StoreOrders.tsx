import React, { useEffect, useState } from 'react';
import { storeOrderApi } from '../../services/storeOrderApi';
import type { StoreOrderResponse } from '../../types/storeOrder';
import { ShoppingBag, Calendar, ChevronRight, Loader2, Package } from 'lucide-react';

interface StoreOrdersProps {
    storeId: number;
}

const StoreOrders: React.FC<StoreOrdersProps> = ({ storeId }) => {
    const [orders, setOrders] = useState<StoreOrderResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Using getAllOrders which now supports storeId
                const response = await storeOrderApi.getAllOrders({ storeId, size: 50, sortBy: 'orderDate', sortDir: 'desc' });
                if (response.content) {
                    setOrders(response.content);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [storeId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUBMITTED': return 'text-sky-400 border-sky-400/20 bg-sky-400/10';
            case 'APPROVED': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10';
            case 'REJECTED': return 'text-rose-400 border-rose-400/20 bg-rose-400/10';
            case 'IN_TRANSIT': return 'text-amber-400 border-amber-400/20 bg-amber-400/10';
            case 'DELIVERED': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
            default: return 'text-stone-400 border-stone-400/20 bg-stone-400/10';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-sm uppercase tracking-widest font-medium">Đang tải lịch sử đơn hàng...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-20 bg-black/20 backdrop-blur-md rounded-2xl border border-white/5">
                <ShoppingBag className="w-12 h-12 text-stone-600 mx-auto mb-4" />
                <h3 className="text-stone-300 font-medium text-lg">Chưa có đơn hàng nào</h3>
                <p className="text-stone-500 text-sm mt-1">Lịch sử đặt hàng của cửa hàng sẽ xuất hiện tại đây.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {orders.map((order) => (
                <div
                    key={order.orderId}
                    className="group bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] transition-all duration-300 flex flex-wrap md:flex-nowrap items-center gap-6"
                >
                    <div className="w-14 h-14 rounded-2xl bg-stone-900 border border-white/5 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-black/40">
                        <Package className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-white font-bold tracking-widest uppercase text-sm">
                                Đơn hàng #{order.orderId}
                            </h3>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-tighter ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-stone-500 text-xs">
                            <div className="flex items-center gap-1.5 font-mono italic">
                                <Calendar className="w-3.5 h-3.5 opacity-60" />
                                {new Date(order.orderDate).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ShoppingBag className="w-3.5 h-3.5 opacity-60" />
                                {order.orderDetails.length} sản phẩm
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest mb-0.5 opacity-60">Tổng thanh toán</p>
                        <p className="text-amber-500 font-black text-lg tracking-tight">
                            {order.totalAmount.toLocaleString('vi-VN')} đ
                        </p>
                    </div>

                    <div className="pl-4 border-l border-white/5 flex items-center gap-4">
                        <button className="p-3 rounded-xl bg-white/5 hover:bg-amber-500/20 text-stone-400 hover:text-amber-400 transition-all border border-transparent hover:border-amber-500/30">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StoreOrders;
