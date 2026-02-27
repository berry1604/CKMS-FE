import { Printer, Download, CreditCard, Send, Building2, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
export interface Invoice {
    id: string;
    storeName: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    date: string;
    dueDate: string;
    items: {
        description: string;
        quantity: number;
        price: number;
    }[];
}

interface InvoiceDetailDrawerProps {
    invoice: Invoice | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusUpdate?: (id: string, status: Invoice['status']) => void;
}

export const InvoiceDetailDrawer = ({ invoice, isOpen, onClose, onStatusUpdate }: InvoiceDetailDrawerProps) => {
    if (!invoice) return null;

    const footer = (
        <div className="flex justify-between w-full">
            <div className="flex gap-2">
                <Button variant="outline" size="sm">
                    <Printer size={16} className="mr-2" /> Print
                </Button>
                <Button variant="outline" size="sm">
                    <Download size={16} className="mr-2" /> PDF
                </Button>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
                {invoice.status !== 'paid' && onStatusUpdate && (
                    <Button
                        onClick={() => onStatusUpdate(invoice.id, 'paid')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <CreditCard size={16} className="mr-2" /> Mark as Paid
                    </Button>
                )}
                {invoice.status !== 'paid' && (
                    <Button variant="outline">
                        <Send size={16} className="mr-2" /> Send Reminder
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Invoice Details"
            description={`Invoice #${invoice.id}`}
            width="max-w-3xl"
            footer={footer}
        >
            <div className="space-y-6">
                {/* Header Status Board */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">{invoice.storeName}</h3>
                            <p className="text-sm text-gray-500">Bill To</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <Badge variant={
                            invoice.status === 'paid' ? 'success' :
                                invoice.status === 'overdue' ? 'danger' :
                                    invoice.status === 'pending' ? 'warning' : 'default'
                        } className="mb-2 text-sm px-3 py-1">
                            {invoice.status.toUpperCase()}
                        </Badge>
                        <p className="text-2xl font-bold text-gray-900">${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                {/* Dates Information */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice Date</p>
                                <p className="font-medium text-gray-900">{invoice.date}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</p>
                                <p className="font-medium text-gray-900">{invoice.dueDate}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Line Items */}
                <Card className="overflow-hidden border-gray-200 shadow-sm">
                    <div className="bg-white">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoice.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${item.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-500">Subtotal</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">${invoice.amount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-6 py-2 text-right text-sm font-medium text-gray-500">Tax (0%)</td>
                                    <td className="px-6 py-2 text-right text-sm font-bold text-gray-900">$0.00</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-right text-base font-bold text-gray-900">Total Due</td>
                                    <td className="px-6 py-4 text-right text-base font-bold text-blue-600">${invoice.amount.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>

                {/* Notes */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                    <p className="text-sm text-yellow-800 font-medium mb-1">Payment Instructions</p>
                    <p className="text-sm text-yellow-700">Please make checks payable to "Headquarters Inc." and include the invoice number on the check.</p>
                </div>
            </div>
        </Drawer>
    );
};
