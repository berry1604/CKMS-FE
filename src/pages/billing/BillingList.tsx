import { useEffect, useState } from 'react';
import { DollarSign, AlertCircle, TrendingUp, PiggyBank, Search, Filter, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { InvoiceDetailDrawer, type Invoice } from './InvoiceDetailDrawer';
import { billingApi } from '../../services/billing.api';
import { useAuth } from '../../hooks/useAuth';

export const BillingList = () => {
    const { user } = useAuth();
    const [_stats, _setStats] = useState<{ totalRevenue: number, outstanding: number, royalties: number, marketingFund: number } | null>({
        totalRevenue: 0,
        outstanding: 0,
        royalties: 0,
        marketingFund: 0
    });
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Modals
    const [showManualModal, setShowManualModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Manual Statement form
    const [manualForm, setManualForm] = useState({ storeId: '', periodStart: '', periodEnd: '' });

    // Batch Statement form
    const [batchForm, setBatchForm] = useState({ cycleName: '', periodStart: '', periodEnd: '' });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Placeholder for future GET /invoices API
            // For now, setting to empty data
            setInvoices([]);
            setFilteredInvoices([]);
        } catch (error) {
            console.error('Failed to fetch billing data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let result = invoices;
        if (searchTerm) {
            const lowerQuery = searchTerm.toLowerCase();
            result = result.filter(inv =>
                inv.storeName.toLowerCase().includes(lowerQuery) ||
                inv.id.toLowerCase().includes(lowerQuery)
            );
        }
        if (statusFilter !== 'all') {
            result = result.filter(inv => inv.status === statusFilter);
        }
        setFilteredInvoices(result);
    }, [invoices, searchTerm, statusFilter]);

    const handleStatusUpdate = async (_id: string, _status: Invoice['status']) => {
        // Placeholder for future update API
        // if (selectedInvoice && selectedInvoice.id === id) {
        //     setSelectedInvoice({ ...selectedInvoice, status });
        // }
    };

    const handleGenerateManual = async () => {
        if (!manualForm.storeId || !manualForm.periodStart || !manualForm.periodEnd) {
            alert('Please fill all fields');
            return;
        }
        setIsGenerating(true);
        try {
            await billingApi.generateManualStatement(Number(manualForm.storeId), manualForm.periodStart, manualForm.periodEnd);
            alert('Billing statement generated successfully');
            setShowManualModal(false);
            setManualForm({ storeId: '', periodStart: '', periodEnd: '' });
            fetchData();
        } catch (error) {
            alert('Failed to generate billing statement');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateBatch = async () => {
        if (!batchForm.cycleName || !batchForm.periodStart || !batchForm.periodEnd) {
            alert('Please fill all fields');
            return;
        }
        setIsGenerating(true);
        try {
            await billingApi.generateBatchStatements(batchForm);
            alert('Batch billing statements generated successfully');
            setShowBatchModal(false);
            setBatchForm({ cycleName: '', periodStart: '', periodEnd: '' });
            fetchData();
        } catch (error) {
            alert('Failed to generate batch billing statements');
        } finally {
            setIsGenerating(false);
        }
    };

    const columns: Column<Invoice>[] = [
        {
            header: 'Invoice ID',
            accessorKey: 'id',
            className: 'font-medium',
            cell: (inv) => <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{inv.id}</span>
        },
        {
            header: 'Store',
            accessorKey: 'storeName',
            className: 'font-medium text-gray-900'
        },
        {
            header: 'Due Date',
            accessorKey: 'dueDate',
            cell: (inv) => {
                const isOverdue = new Date(inv.dueDate) < new Date() && inv.status !== 'paid';
                return <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>{inv.dueDate}</span>;
            }
        },
        {
            header: 'Amount',
            accessorKey: 'amount',
            className: 'font-bold',
            cell: (inv) => `$${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        },
        {
            header: 'Status',
            cell: (inv) => {
                const variants: Record<string, "success" | "warning" | "danger" | "default"> = {
                    paid: 'success',
                    pending: 'warning',
                    overdue: 'danger',
                    cancelled: 'default'
                };
                return <Badge variant={variants[inv.status] || 'default'}>{inv.status.toUpperCase()}</Badge>;
            }
        },
        {
            header: 'Actions',
            cell: (inv) => (
                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(inv)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Eye size={16} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Billing & Invoices</h1>

                <div className="flex items-center gap-2">
                    {(user?.role === 'ADMIN' || user?.role === 'SYSTEM') && (
                        <Button variant="outline" onClick={() => setShowManualModal(true)}>
                            Generate Manual
                        </Button>
                    )}
                    {user?.role === 'SYSTEM' && (
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowBatchModal(true)}>
                            Generate Batch
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-0 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-start justify-between p-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">${_stats?.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="bg-white border-0 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-start justify-between p-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Outstanding</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">${_stats?.outstanding.toLocaleString()}</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <AlertCircle size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="bg-white border-0 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-start justify-between p-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Royalties (YTD)</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">${_stats?.royalties.toLocaleString()}</p>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="bg-white border-0 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-start justify-between p-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Marketing Fund</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">${_stats?.marketingFund.toLocaleString()}</p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <PiggyBank size={20} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Invoices Table */}
            <Card className="border-0 shadow-sm ring-1 ring-gray-200">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search invoices by store or ID..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Filter size={16} className="text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500 mr-2">Status:</span>
                        {['all', 'paid', 'pending', 'overdue'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap
                                    ${statusFilter === status
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <DataTable
                    data={filteredInvoices}
                    columns={columns}
                    isLoading={isLoading}
                    keyExtractor={inv => inv.id}
                />
            </Card>

            <InvoiceDetailDrawer
                invoice={selectedInvoice}
                isOpen={!!selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                onStatusUpdate={handleStatusUpdate}
            />

            {/* Manual Statement Modal */}
            {showManualModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md p-6 bg-white shadow-xl">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Generate Manual Statement</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store ID</label>
                                <Input type="number" min="1" value={manualForm.storeId} onChange={e => setManualForm({ ...manualForm, storeId: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
                                <Input type="date" value={manualForm.periodStart} onChange={e => setManualForm({ ...manualForm, periodStart: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
                                <Input type="date" value={manualForm.periodEnd} onChange={e => setManualForm({ ...manualForm, periodEnd: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowManualModal(false)} disabled={isGenerating}>Cancel</Button>
                            <Button className="bg-blue-600 text-white" onClick={handleGenerateManual} isLoading={isGenerating}>Generate</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Batch Statement Modal */}
            {showBatchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md p-6 bg-white shadow-xl">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Generate Batch Statements</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Name</label>
                                <Input placeholder="e.g. Q1-2024" value={batchForm.cycleName} onChange={e => setBatchForm({ ...batchForm, cycleName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
                                <Input type="date" value={batchForm.periodStart} onChange={e => setBatchForm({ ...batchForm, periodStart: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
                                <Input type="date" value={batchForm.periodEnd} onChange={e => setBatchForm({ ...batchForm, periodEnd: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowBatchModal(false)} disabled={isGenerating}>Cancel</Button>
                            <Button className="bg-blue-600 text-white" onClick={handleGenerateBatch} isLoading={isGenerating}>Generate Batch</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
