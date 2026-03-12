import { useState } from 'react';
import { Package, Clock, CheckCircle, Truck, Printer, Download, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { StoreOrderResponse } from '../../types/storeOrder';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/classNames';

interface OrderDetailDrawerProps {
    order: StoreOrderResponse | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusUpdate?: (orderId: number, status: string) => void;
    onCancelOrder?: (orderId: number) => void;
    onSubmitOrder?: (orderId: number) => void;
}

export const OrderDetailDrawer = ({ order, isOpen, onClose, onStatusUpdate, onCancelOrder, onSubmitOrder }: OrderDetailDrawerProps) => {
    const { hasAuthority } = useAuth();
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    if (!order) return null;

    // Permissions check
    const canApprove = hasAuthority('APPROVE_STORE_ORDER') || hasAuthority('COORDINATOR') || hasAuthority('MANAGER') || hasAuthority('ADMIN');

    const getStatusStep = (status: string) => {
        const steps = ['SUBMITTED', 'APPROVED', 'ALLOCATED', 'DELIVERED'];
        const index = steps.indexOf(status?.toUpperCase());
        return index >= 0 ? index + 1 : 0;
    };

    const currentStep = getStatusStep(order.status);
    const orderStatus = order.status?.toUpperCase();

    const canCancel = orderStatus === 'SUBMITTED';
    const canReject = orderStatus === 'SUBMITTED';

    const handleCancel = () => {
        setIsCancelModalOpen(true);
    };

    const confirmCancel = async () => {
        setIsCancelling(true);
        try {
            await onCancelOrder?.(order.orderId);
            setIsCancelModalOpen(false);
        } finally {
            setIsCancelling(false);
        }
    };

    const footer = (
        <div className="flex justify-between w-full items-center">
            <div className="flex gap-2 text-zinc-400">
                <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-400 hover:text-white rounded-lg h-9">
                    <Printer size={16} className="mr-2" /> In đơn
                </Button>
                <Button variant="outline" size="sm" className="border-zinc-800 text-zinc-400 hover:text-white rounded-lg h-9">
                    <Download size={16} className="mr-2" /> Xuất hóa đơn
                </Button>
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
                        {isCancelling ? 'Đang hủy...' : 'Hủy đơn'}
                    </Button>
                )}
                {orderStatus === 'DRAFT' && onSubmitOrder && (hasAuthority('STORE_STAFF') || hasAuthority('CREATE_STORE_ORDER') || hasAuthority('MANAGER')) && (
                    <Button
                        className="bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-[10px] tracking-widest h-9 px-6 rounded-lg shadow-lg shadow-emerald-900/20 border-0"
                        onClick={() => onSubmitOrder(order.orderId)}
                    >
                        Gửi Đơn
                    </Button>
                )}
                {canReject && onStatusUpdate && canApprove && (
                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[10px] tracking-widest h-9 px-4 rounded-lg shadow-lg shadow-red-900/20 border-0"
                        onClick={() => onStatusUpdate(order.orderId, 'REJECTED')}
                    >
                        Từ chối
                    </Button>
                )}
                {orderStatus === 'SUBMITTED' && onStatusUpdate && canApprove && (
                    <Button
                        onClick={() => onStatusUpdate(order.orderId, 'APPROVED')}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-widest h-9 px-6 rounded-lg shadow-lg shadow-amber-900/20 border-0"
                    >
                        Duyệt Đơn
                    </Button>
                )}

                <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-zinc-100 font-bold uppercase text-[10px] tracking-widest h-9 px-4">
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
                title={`Chi tiết đơn hàng #${order.orderId}`}
                description={`${order.storeName || `Cửa hàng ID: ${order.storeId}`} • Đặt ngày: ${new Date(order.orderDate).toLocaleDateString('vi-VN')}`}
                width="max-w-4xl"
                footer={footer}
            >
                <div className="space-y-8 py-2">
                    {/* Status Badge & Total Summary */}
                    <div className="flex justify-between items-center bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800/50 shadow-inner overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Trạng thái hiện tại</p>
                                <div className="flex items-center gap-3">
                                    <Badge variant={
                                        orderStatus === 'DELIVERED' ? 'success' :
                                            orderStatus === 'REJECTED' ? 'danger' :
                                                orderStatus === 'APPROVED' ? 'orange' :
                                                    orderStatus === 'ALLOCATED' ? 'info' : 'warning'
                                    } className="text-[11px] font-black px-4 py-1 uppercase tracking-tighter border-0 shadow-lg">
                                        {orderStatus === 'SUBMITTED' ? 'CHỜ DUYỆT' :
                                            orderStatus === 'APPROVED' ? 'ĐA DUYỆT' :
                                                orderStatus === 'ALLOCATED' ? 'ĐA PHÂN BỔ' :
                                                    orderStatus === 'DELIVERED' ? 'HOÀN THÀNH' :
                                                        orderStatus === 'REJECTED' ? 'TỪ CHỐI' : orderStatus}
                                    </Badge>
                                    <span className="text-[10px] text-zinc-600 font-medium italic">Cập nhật: Mới đây</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right space-y-1 relative z-10">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tổng giá trị đơn hàng</p>
                            <p className="text-3xl font-black text-amber-500 tracking-tighter drop-shadow-sm">
                                {(order.totalAmount || 0).toLocaleString()} <span className="text-xs text-amber-500/50">VNĐ</span>
                            </p>
                        </div>
                    </div>

                    {/* Standardized Progress Bar */}
                    <div className="px-4">
                        {orderStatus !== 'REJECTED' ? (
                            <div className="relative pt-4 pb-10">
                                {/* Connector Line */}
                                <div className="absolute top-1/2 left-0 w-full h-[3px] bg-zinc-800 -translate-y-[28px] z-0 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${Math.max(0, ((currentStep - 1) / 3) * 100)}%` }}
                                        className="h-full bg-amber-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                                    ></div>
                                </div>

                                {/* Steps */}
                                <div className="relative z-10 flex justify-between">
                                    {[
                                        { step: 1, label: 'Chờ duyệt', icon: Clock },
                                        { step: 2, label: 'Đã duyệt', icon: CheckCircle },
                                        { step: 3, label: 'Phân bổ', icon: Truck },
                                        { step: 4, label: 'Giao hàng', icon: Package },
                                    ].map((item) => {
                                        const Icon = item.icon;
                                        const isActive = currentStep >= item.step;
                                        const isCurrent = currentStep === item.step;
                                        return (
                                            <div key={item.step} className="flex flex-col items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                                                    isActive
                                                        ? "bg-amber-500 border-amber-400 text-black shadow-xl shadow-amber-500/10"
                                                        : "bg-zinc-900 border-zinc-800/50 text-zinc-700",
                                                    isCurrent && "ring-4 ring-amber-500/20 scale-110"
                                                )}>
                                                    <Icon size={20} strokeWidth={isActive ? 3 : 2} />
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
                                                    isActive ? "text-zinc-200" : "text-zinc-700"
                                                )}>
                                                    {item.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 py-8 bg-red-500/5 rounded-3xl border border-red-500/10 border-dashed">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                    <XCircle size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-red-500 uppercase tracking-widest">ĐƠN HÀNG ĐÃ BỊ TỪ CHỐI</p>
                                    <p className="text-[11px] text-zinc-500 font-medium mt-1">Vui lòng liên hệ Coordinator để biết thêm chi tiết.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-1">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center font-bold text-amber-500 text-sm">
                                <Package size={16} />
                            </div>
                            <h3 className="text-xs font-black text-zinc-200 uppercase tracking-widest">Danh sách sản phẩm</h3>
                            <span className="text-[10px] text-zinc-600 font-bold ml-auto px-2 py-1 bg-zinc-900 rounded-lg">{order.orderDetails?.length || 0} món</span>
                        </div>

                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-zinc-800/50">
                                <thead className="bg-zinc-950/40">
                                    <tr>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sản phẩm</th>
                                        <th className="px-6 py-5 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tồn kho bếp</th>
                                        <th className="px-6 py-5 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest">Số lượng</th>
                                        <th className="px-6 py-5 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest">Đơn giá</th>
                                        <th className="px-6 py-5 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/20">
                                    {order.orderDetails && order.orderDetails.length > 0 ? (
                                        order.orderDetails.map((item, idx) => {
                                            const stockQty = item.kitchenStockQuantity || 0;
                                            const isLowStock = stockQty < item.quantity;
                                            return (
                                                <tr key={idx} className="hover:bg-zinc-800/30 transition-all group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-zinc-200 group-hover:text-amber-500 transition-colors">{item.productName || `Sản phẩm #${item.productId}`}</span>
                                                            <span className="text-[10px] text-zinc-600 font-medium">SKU: {item.productId}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter",
                                                            isLowStock ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-zinc-800/50 text-zinc-500 border border-zinc-700/50"
                                                        )}>
                                                            {stockQty} đv
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-bold text-zinc-100 text-right">{item.quantity} đv</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-[13px] text-zinc-500 font-medium text-right">{(item.unitPrice || 0).toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-black text-amber-500/90 text-right">
                                                        {(item.subTotal || (item.quantity * (item.unitPrice || 0))).toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-20">
                                                    <Package size={48} />
                                                    <p className="text-xs font-black uppercase tracking-[0.2em]">Không tìm thấy dữ liệu</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                Thông tin vận chuyển
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                    <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Cửa hàng</span>
                                    <span className="text-xs font-black text-zinc-200">{order.storeName || order.storeId}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Mã người tạo</span>
                                    <span className="text-xs font-black text-zinc-200">UID: {order.createdByUserId || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">
                                Ghi chú bổ sung
                            </h4>
                            <div className="min-h-[60px] flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl p-4">
                                <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-widest opacity-50">
                                    CHƯA CÓ GHI CHÚ
                                </p>
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
        </>
    );
};
