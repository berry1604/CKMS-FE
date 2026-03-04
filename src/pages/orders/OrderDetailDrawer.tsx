import { useState } from 'react';
import { Package, Clock, CheckCircle, Truck, Printer, Download, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import type { StoreOrderResponse } from '../../types/storeOrder';
import { useAuth } from '../../hooks/useAuth';

interface OrderDetailDrawerProps {
    order: StoreOrderResponse | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusUpdate?: (orderId: number, status: string) => void;
    onCancelOrder?: (orderId: number) => void;
}

export const OrderDetailDrawer = ({ order, isOpen, onClose, onStatusUpdate, onCancelOrder }: OrderDetailDrawerProps) => {
    const { hasAuthority } = useAuth();
    const [isCancelling, setIsCancelling] = useState(false);

    if (!order) return null;

    // hasAuthority securely unwraps "ROLE_" prefixes and falls back to JWT if needed.
    const canApprove = hasAuthority('APPROVE_STORE_ORDER') || hasAuthority('COORDINATOR') || hasAuthority('MANAGER') || hasAuthority('ADMIN');

    const getStatusStep = (status: string) => {
        const steps = ['submitted', 'grouped', 'confirmed', 'preparing', 'ready', 'completed'];
        return steps.indexOf(status.toLowerCase()) + 1;
    };

    const currentStep = getStatusStep(order.status);

    const canCancel = ['SUBMITTED'].includes(order.status?.toUpperCase());
    const canReject = ['SUBMITTED'].includes(order.status?.toUpperCase());

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this order?')) return;
        setIsCancelling(true);
        try {
            await onCancelOrder?.(order.orderId);
        } finally {
            setIsCancelling(false);
        }
    };

    const footer = (
        <div className="flex justify-between w-full">
            <div className="flex gap-2">
                <Button variant="outline" size="sm">
                    <Printer size={16} className="mr-2" /> Print
                </Button>
                <Button variant="outline" size="sm">
                    <Download size={16} className="mr-2" /> Invoice
                </Button>
            </div>
            <div className="flex gap-2">
                {canCancel && onCancelOrder && (
                    <Button
                        variant="outline"
                        className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                        onClick={handleCancel}
                        disabled={isCancelling}
                    >
                        <XCircle size={16} className="mr-2" />
                        {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                    </Button>
                )}
                {canReject && onStatusUpdate && canApprove && (
                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => onStatusUpdate(order.orderId, 'REJECTED')}
                    >
                        Reject
                    </Button>
                )}
                {(order.status === 'SUBMITTED' || order.status === 'submitted') && onStatusUpdate && canApprove && (
                    <Button onClick={() => onStatusUpdate(order.orderId, 'CONFIRMED')}>
                        Confirm/Approve
                    </Button>
                )}

                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    );

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={`Order #${order.orderId}`}
            description={`${order.storeName || `Store ID: ${order.storeId}`} • ${new Date(order.orderDate).toLocaleDateString()}`}
            width="max-w-4xl"
            footer={footer}
        >
            <div className="space-y-6">
                {/* Status Badge & Priority */}
                <div className="flex justify-between items-center bg-zinc-900/80 p-4 rounded-lg border border-zinc-800">
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                            <Badge variant={
                                order.status === 'COMPLETED' ? 'success' :
                                    order.status === 'REJECTED' ? 'danger' :
                                        order.status === 'PREPARING' ? 'primary' : 'info'
                            } className="text-sm px-3 py-1">
                                {order.status.toUpperCase().replace('_', ' ')}
                            </Badge>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Amount</p>
                        <p className="text-xl font-bold text-gray-200">${order.totalAmount.toFixed(2)}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <Card className="p-6 border-zinc-700 shadow-sm">
                    {order.status !== 'REJECTED' ? (
                        <div className="relative">
                            <div className="overflow-hidden h-2 mb-6 text-xs flex rounded-full bg-gray-100">
                                <div style={{ width: `${(currentStep / 6) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-600 transition-all duration-500"></div>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-gray-400">
                                <div className={`flex flex-col items-center gap-2 ${currentStep >= 1 ? 'text-amber-600' : ''}`}>
                                    <div className={`p-2 rounded-full ${currentStep >= 1 ? 'bg-amber-500/10' : 'bg-zinc-900/80'}`}>
                                        <Clock size={16} />
                                    </div>
                                    <span>Submitted</span>
                                </div>
                                <div className={`flex flex-col items-center gap-2 ${currentStep >= 3 ? 'text-amber-600' : ''}`}>
                                    <div className={`p-2 rounded-full ${currentStep >= 3 ? 'bg-amber-500/10' : 'bg-zinc-900/80'}`}>
                                        <CheckCircle size={16} />
                                    </div>
                                    <span>Confirmed</span>
                                </div>
                                <div className={`flex flex-col items-center gap-2 ${currentStep >= 4 ? 'text-amber-600' : ''}`}>
                                    <div className={`p-2 rounded-full ${currentStep >= 4 ? 'bg-amber-500/10' : 'bg-zinc-900/80'}`}>
                                        <Package size={16} />
                                    </div>
                                    <span>Preparing</span>
                                </div>
                                <div className={`flex flex-col items-center gap-2 ${currentStep >= 5 ? 'text-amber-600' : ''}`}>
                                    <div className={`p-2 rounded-full ${currentStep >= 5 ? 'bg-amber-500/10' : 'bg-zinc-900/80'}`}>
                                        <Truck size={16} />
                                    </div>
                                    <span>Ready</span>
                                </div>
                                <div className={`flex flex-col items-center gap-2 ${currentStep >= 6 ? 'text-green-600' : ''}`}>
                                    <div className={`p-2 rounded-full ${currentStep >= 6 ? 'bg-green-50' : 'bg-zinc-900/80'}`}>
                                        <CheckCircle size={16} />
                                    </div>
                                    <span>Completed</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 text-red-500 justify-center font-semibold">
                            This order was rejected.
                        </div>
                    )}
                </Card>

                {/* Order Items */}
                <Card className="overflow-hidden border-zinc-700 shadow-sm">
                    <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/80/50">
                        <h3 className="font-semibold text-gray-200">Order Items</h3>
                    </div>
                    <table className="min-w-full divide-y divide-zinc-800">
                        <thead className="bg-zinc-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Available Stock</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Order Qty</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-zinc-900/50 divide-y divide-zinc-800">
                            {order.orderDetails && order.orderDetails.length > 0 ? (
                                order.orderDetails.map((item, idx) => {
                                    const stockQty = item.kitchenStockQuantity || 0;
                                    const isLowStock = stockQty < item.quantity;
                                    return (
                                        <tr key={idx} className="hover:bg-zinc-900/80/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{item.productName || `Product #${item.productId}`}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${isLowStock ? 'bg-red-500/10 text-red-500' : 'text-gray-400'}`}>
                                                    {stockQty} units
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-right">{item.quantity} units</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-right">${item.unitPrice?.toFixed(2) || '0.00'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200 text-right">${item.subTotal?.toFixed(2) || (item.quantity * (item.unitPrice || 0)).toFixed(2)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No items available</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-zinc-900/80/50">
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-right font-medium text-gray-400">Subtotal</td>
                                <td className="px-6 py-4 text-right font-bold text-gray-200">${order.totalAmount.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </Card>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-6">
                    <Card className="p-4 border-zinc-700 shadow-sm">
                        <h4 className="text-sm font-medium text-gray-200 mb-3">Delivery Information</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Store</span>
                                <span className="font-medium text-gray-200">{order.storeName || `Store #${order.storeId}`}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Date</span>
                                <span className="font-medium text-gray-200">{new Date(order.orderDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 border-zinc-700 shadow-sm">
                        <h4 className="text-sm font-medium text-gray-200 mb-3">Notes</h4>
                        <p className="text-sm text-gray-400 italic">No special instructions provided for this order.</p>
                    </Card>
                </div>
            </div>
        </Drawer>
    );
};
