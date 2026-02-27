import { Package, Clock, CheckCircle, Truck, Printer, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import type { StoreOrderResponse } from '../../types/storeOrder';

interface OrderDetailDrawerProps {
    order: StoreOrderResponse | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusUpdate?: (orderId: number, status: string) => void;
}

export const OrderDetailDrawer = ({ order, isOpen, onClose, onStatusUpdate }: OrderDetailDrawerProps) => {
    if (!order) return null;

    const getStatusStep = (status: string) => {
        const steps = ['submitted', 'approved', 'scheduled', 'in_production', 'produced', 'shipping', 'completed'];
        return steps.indexOf(status.toLowerCase()) + 1;
    };

    const currentStep = getStatusStep(order.status);

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
                {(order.status === 'SUBMITTED' || order.status === 'submitted') && onStatusUpdate && (
                    <Button onClick={() => onStatusUpdate(order.orderId, 'approved')}>
                        Approve Order
                    </Button>
                )}
                {(order.status === 'SHIPPING' || order.status === 'shipping') && onStatusUpdate && (
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onStatusUpdate(order.orderId, 'completed')}>
                        Confirm Receipt
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
            description={`Store ID: ${order.storeId} • ${new Date(order.orderDate).toLocaleDateString()}`}
            width="max-w-4xl"
            footer={footer}
        >
            <div className="space-y-6">
                {/* Status Badge & Priority */}
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                            <Badge variant={
                                order.status === 'COMPLETED' ? 'success' :
                                    order.status === 'CANCELLED' ? 'danger' :
                                        order.status === 'IN_PRODUCTION' ? 'primary' : 'info'
                            } className="text-sm px-3 py-1">
                                {order.status.toUpperCase().replace('_', ' ')}
                            </Badge>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Amount</p>
                        <p className="text-xl font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <Card className="p-6 border-gray-200 shadow-sm">
                    <div className="relative">
                        <div className="overflow-hidden h-2 mb-6 text-xs flex rounded-full bg-gray-100">
                            <div style={{ width: `${(currentStep / 7) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"></div>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-gray-500">
                            <div className={`flex flex-col items-center gap-2 ${currentStep >= 1 ? 'text-blue-600' : ''}`}>
                                <div className={`p-2 rounded-full ${currentStep >= 1 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                    <Clock size={16} />
                                </div>
                                <span>Submitted</span>
                            </div>
                            <div className={`flex flex-col items-center gap-2 ${currentStep >= 2 ? 'text-blue-600' : ''}`}>
                                <div className={`p-2 rounded-full ${currentStep >= 2 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                    <CheckCircle size={16} />
                                </div>
                                <span>Approved</span>
                            </div>
                            <div className={`flex flex-col items-center gap-2 ${currentStep >= 4 ? 'text-blue-600' : ''}`}>
                                <div className={`p-2 rounded-full ${currentStep >= 4 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                    <Package size={16} />
                                </div>
                                <span>Production</span>
                            </div>
                            <div className={`flex flex-col items-center gap-2 ${currentStep >= 6 ? 'text-blue-600' : ''}`}>
                                <div className={`p-2 rounded-full ${currentStep >= 6 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                    <Truck size={16} />
                                </div>
                                <span>Shipping</span>
                            </div>
                            <div className={`flex flex-col items-center gap-2 ${currentStep >= 7 ? 'text-green-600' : ''}`}>
                                <div className={`p-2 rounded-full ${currentStep >= 7 ? 'bg-green-50' : 'bg-gray-50'}`}>
                                    <CheckCircle size={16} />
                                </div>
                                <span>Completed</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Order Items */}
                <Card className="overflow-hidden border-gray-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-semibold text-gray-900">Order Items</h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {order.orderDetails && order.orderDetails.length > 0 ? (
                                order.orderDetails.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName || `Product #${item.productId}`}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity} units</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${item.unitPrice?.toFixed(2) || '0.00'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">${item.subTotal?.toFixed(2) || (item.quantity * (item.unitPrice || 0)).toFixed(2)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">No items available</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50/50">
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-right font-medium text-gray-500">Subtotal</td>
                                <td className="px-6 py-4 text-right font-bold text-gray-900">${order.totalAmount.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </Card>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-6">
                    <Card className="p-4 border-gray-200 shadow-sm">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Delivery Information</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Store ID</span>
                                <span className="font-medium text-gray-900">{order.storeId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Date</span>
                                <span className="font-medium text-gray-900">{new Date(order.orderDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 border-gray-200 shadow-sm">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Notes</h4>
                        <p className="text-sm text-gray-500 italic">No special instructions provided for this order.</p>
                    </Card>
                </div>
            </div>
        </Drawer>
    );
};
