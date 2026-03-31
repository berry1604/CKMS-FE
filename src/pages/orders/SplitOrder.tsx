import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Scissors, Plus, Minus, Info, 
    AlertTriangle, Loader2, Package 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { storeOrderApi } from '../../services/storeOrderApi';
import { toast } from 'react-hot-toast';
import type { StoreOrderResponse } from '../../types/storeOrder';

export const SplitOrder = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<StoreOrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // Split state: productId -> quantity to move to NEW order
    const [splitItems, setSplitItems] = useState<Record<number, number>>({});

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            try {
                const data = await storeOrderApi.getOrderById(id);
                setOrder(data);
                // Initialize split items with 0
                const initial: Record<number, number> = {};
                data.orderDetails.forEach(item => {
                    initial[item.productId] = 0;
                });
                setSplitItems(initial);
            } catch (error) {
                toast.error('Không thể tải thông tin đơn hàng');
                navigate('/orders/approvals');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-amber-500 mb-4" size={32} />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (!order) return null;

    const handleUpdateQuantity = (productId: number, delta: number, max: number) => {
        setSplitItems(prev => {
            const current = prev[productId] || 0;
            const next = Math.max(0, Math.min(max, current + delta));
            return { ...prev, [productId]: next };
        });
    };

    // Calculate totals
    const calculateTotals = () => {
        let originalTotal = 0;
        let newTotal = 0;
        let splitCount = 0;

        order.orderDetails.forEach(item => {
            const splitQty = splitItems[item.productId] || 0;
            const remainingQty = item.quantity - splitQty;
            const price = parseFloat(item.unitPrice.toString());
            
            originalTotal += remainingQty * price;
            newTotal += splitQty * price;
            if (splitQty > 0) splitCount++;
        });

        return { originalTotal, newTotal, splitCount };
    };

    const { originalTotal, newTotal, splitCount } = calculateTotals();

    const handleConfirmSplit = async () => {
        setIsSubmitting(true);
        try {
            const payload = order.orderDetails
                .filter(item => splitItems[item.productId] > 0)
                .map(item => ({
                    productId: item.productId,
                    quantity: splitItems[item.productId]
                }));

            await storeOrderApi.splitOrder(order.orderId, payload);
            toast.success('Tách đơn hàng thành công!');
            navigate('/orders/approvals');
        } catch (error) {
            // Error handled by interceptor
            console.error('Split failed:', error);
        } finally {
            setIsSubmitting(false);
            setShowConfirmModal(false);
        }
    };

    const isSplitValid = splitCount > 0 && originalTotal > 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="space-y-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-zinc-500 hover:text-amber-500 transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Quay lại Dashboard</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                            <Scissors size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">
                                Tách đơn hàng <span className="text-indigo-500">#{order.orderId}</span>
                            </h1>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                                Điều phối & Phân bổ nguồn lực
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={!isSplitValid || isSubmitting}
                        className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-indigo-500 hover:bg-indigo-600 border-0 text-white shadow-lg shadow-indigo-500/20"
                    >
                        Xác nhận tách đơn
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left Column: Original Order (Source) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm bg-zinc-400 dark:bg-zinc-600" />
                            Đơn hàng gốc (Sau khi tách)
                        </h2>
                        <Badge variant="indigo" className="font-bold">ORD-{order.orderId}</Badge>
                    </div>
                    
                    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-sm dark:shadow-none">
                        <div className="p-6 space-y-4">
                            {order.orderDetails.map((item, idx) => {
                                const splitQty = splitItems[item.productId] || 0;
                                const remainingQty = item.quantity - splitQty;
                                
                                return (
                                    <div key={idx} className="group flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-200">{item.productName}</h3>
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                                                    Đơn giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unitPrice)}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-black text-emerald-400">{remainingQty}</span>
                                                <span className="text-[10px] font-bold text-zinc-600 uppercase">Còn lại</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                                <button 
                                                    onClick={() => handleUpdateQuantity(item.productId, -1, item.quantity)}
                                                    disabled={splitQty <= 0}
                                                    className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30 transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <div className="w-8 text-center">
                                                    <span className="text-xs font-black text-indigo-400">{splitQty}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleUpdateQuantity(item.productId, 1, item.quantity)}
                                                    disabled={splitQty >= item.quantity}
                                                    className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-indigo-500 disabled:opacity-30 transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="p-6 bg-zinc-50 dark:bg-zinc-950/80 border-t border-zinc-200 dark:border-zinc-800">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tổng giá trị đơn gốc:</span>
                                <span className="text-lg font-black text-zinc-900 dark:text-white">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalTotal)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: New Order (Target) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xs font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm bg-indigo-500" />
                            Đơn hàng mới (Dự phóng)
                        </h2>
                        <Badge variant="indigo" className="font-bold">NEW ORDER</Badge>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl overflow-hidden backdrop-blur-xl flex flex-col h-full min-h-[400px] shadow-sm dark:shadow-none">
                        <div className="p-6 flex-1 space-y-4">
                            {splitCount === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] bg-white dark:bg-zinc-950/20">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 dark:text-zinc-700 mb-4">
                                        <Plus size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider max-w-[200px]">
                                        Hãy di chuyển sản phẩm từ đơn gốc sang đơn này
                                    </p>
                                </div>
                            ) : (
                                order.orderDetails.map((item, idx) => {
                                    const splitQty = splitItems[item.productId] || 0;
                                    if (splitQty === 0) return null;
                                    
                                    return (
                                        <div key={`new-${idx}`} className="flex items-center justify-between p-4 rounded-2xl bg-indigo-100/50 dark:bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-500/20">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-indigo-200 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-200">{item.productName}</h3>
                                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">
                                                        Tách {splitQty} đơn vị
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-indigo-700 dark:text-white">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(splitQty * parseFloat(item.unitPrice.toString()))}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {splitCount > 0 && (
                            <div className="p-6 bg-indigo-100/30 dark:bg-indigo-500/10 border-t border-indigo-200/50 dark:border-indigo-500/20">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Tổng giá trị đơn mới:</span>
                                    <span className="text-lg font-black text-indigo-900 dark:text-white">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(newTotal)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Warning Section */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-amber-600 dark:text-amber-500 uppercase tracking-tight mb-1">Lưu ý quan trọng</h3>
                    <ul className="text-xs font-bold text-zinc-500 dark:text-zinc-400 space-y-2 list-disc ml-4">
                        <li>Hành động này sẽ tạo ra 2 mã đơn hàng mới thay thế cho mã cũ.</li>
                        <li>Đơn hàng cũ <span className="text-zinc-900 dark:text-zinc-200 font-black">#{order.orderId}</span> sẽ được chuyển sang trạng thái <Badge variant="indigo" size="sm">SPLIT</Badge>.</li>
                        <li>Cả 2 đơn hàng mới sẽ được gửi thông báo cập nhật cho Khách hàng.</li>
                    </ul>
                </div>
            </div>

            {/* Notification Preview Hint */}
            <div className="pb-12 flex justify-center">
               <div className="flex items-center gap-2 text-zinc-500 bg-white dark:bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <Info size={14} className="text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Hệ thống sẽ tự động tạo Billing Statement cho cả 2 đơn hàng mới</span>
               </div>
            </div>

            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSplit}
                title="Xác nhận tách đơn"
                message={`Bạn có chắc chắn muốn tách đơn hàng #${order.orderId} thành 2 đơn hàng mới? Đơn hàng hiện tại sẽ bị hủy và thay thế bằng 2 đơn hàng với tổng trị giá tương ứng.`}
                confirmText="Tách đơn ngay"
                cancelText="Hủy bỏ"
                isLoading={isSubmitting}
                variant="warning"
            />
        </div>
    );
};
