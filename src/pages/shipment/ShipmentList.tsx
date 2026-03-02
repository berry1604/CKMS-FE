import { useEffect, useState, useCallback } from 'react';
import { Truck, Filter, Eye, Plus, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { shipmentApi } from '../../services/shipment.api';
import type { ShipmentResponse, ShipmentStatus, CreateShipmentRequest } from '../../types/shipment';
import { ShipmentDetailDrawer } from './ShipmentDetailDrawer';
import { toast } from 'react-hot-toast';

type FilterStatus = 'all' | ShipmentStatus;

export const ShipmentList = () => {
    const [shipments, setShipments] = useState<ShipmentResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedShipment, setSelectedShipment] = useState<ShipmentResponse | null>(null);

    // Filters & Pagination
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Create shipment modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        productionPlanId: '',
        storeId: '',
        storeOrderIds: '',
        driverName: '',
        driverPhone: '',
        vehicleInfo: '',
        shippingFee: '',
        note: ''
    });
    const [isCreating, setIsCreating] = useState(false);

    const fetchShipments = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = { page, size: 10 };
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            const res = await shipmentApi.getShipments(params);
            setShipments(res.content || []);
            setTotalPages(res.totalPages || 0);
        } catch (error) {
            console.error('Failed to fetch shipments:', error);
            toast.error('Failed to load shipments');
        } finally {
            setIsLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchShipments();
    }, [fetchShipments]);

    useEffect(() => {
        setPage(0);
    }, [statusFilter]);

    const handleCreateShipment = async () => {
        const productionPlanId = Number(createForm.productionPlanId);
        const storeId = Number(createForm.storeId);
        const storeOrderIds = createForm.storeOrderIds
            .split(',')
            .map(s => Number(s.trim()))
            .filter(n => !isNaN(n) && n > 0);

        if (!productionPlanId || isNaN(productionPlanId)) {
            toast.error('Production Plan ID is required');
            return;
        }
        if (!storeId || isNaN(storeId)) {
            toast.error('Store ID is required');
            return;
        }
        if (storeOrderIds.length === 0) {
            toast.error('At least one Store Order ID is required');
            return;
        }

        const request: CreateShipmentRequest = {
            productionPlanId,
            storeId,
            storeOrderIds
        };

        if (createForm.driverName.trim()) request.driverName = createForm.driverName.trim();
        if (createForm.driverPhone.trim()) request.driverPhone = createForm.driverPhone.trim();
        if (createForm.vehicleInfo.trim()) request.vehicleInfo = createForm.vehicleInfo.trim();
        if (createForm.shippingFee && Number(createForm.shippingFee) > 0) request.shippingFee = Number(createForm.shippingFee);
        if (createForm.note.trim()) request.note = createForm.note.trim();

        setIsCreating(true);
        try {
            await shipmentApi.createShipment(request);
            toast.success('Shipment created successfully!');
            setShowCreateModal(false);
            setCreateForm({
                productionPlanId: '', storeId: '', storeOrderIds: '',
                driverName: '', driverPhone: '', vehicleInfo: '', shippingFee: '', note: ''
            });
            fetchShipments();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to create shipment';
            toast.error(msg);
        } finally {
            setIsCreating(false);
        }
    };

    const handleStatusAction = async (id: number, action: 'prepare' | 'transit' | 'confirm' | 'cancel') => {
        try {
            switch (action) {
                case 'prepare':
                    await shipmentApi.prepareShipment(id);
                    toast.success('Shipment prepared');
                    break;
                case 'transit':
                    await shipmentApi.startTransit(id);
                    toast.success('Shipment is now in transit');
                    break;
                case 'confirm':
                    await shipmentApi.confirmDelivery(id);
                    toast.success('Delivery confirmed');
                    break;
                case 'cancel':
                    const reason = prompt('Lý do hủy (tùy chọn):');
                    await shipmentApi.cancelShipment(id, reason || undefined);
                    toast.success('Shipment cancelled');
                    break;
            }
            setSelectedShipment(null);
            fetchShipments();
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${action} shipment`);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, 'info' | 'primary' | 'warning' | 'success' | 'danger' | 'default'> = {
            'PENDING': 'warning',
            'PREPARED': 'info',
            'IN_TRANSIT': 'primary',
            'DELIVERED': 'success',
            'CANCELLED': 'danger'
        };
        return <Badge variant={colors[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
    };

    const columns: Column<ShipmentResponse>[] = [
        {
            header: 'ID',
            cell: (s) => <span className="font-mono text-xs bg-zinc-800 px-2 py-1 rounded text-gray-300">#{s.shipmentId}</span>
        },
        {
            header: 'Store',
            cell: (s) => <span className="text-gray-200">{s.storeName || `Store #${s.storeId}`}</span>
        },
        {
            header: 'Driver',
            cell: (s) => (
                <div>
                    <p className="text-sm text-gray-200">{s.driverName || '—'}</p>
                    {s.vehicleInfo && <p className="text-xs text-gray-500">{s.vehicleInfo}</p>}
                </div>
            )
        },
        {
            header: 'Created',
            cell: (s) => <span className="text-sm text-gray-400">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</span>
        },
        {
            header: 'Status',
            cell: (s) => getStatusBadge(s.status)
        },
        {
            header: 'Actions',
            cell: (s) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedShipment(s)} className="text-amber-600 hover:text-amber-500 hover:bg-amber-500/10">
                        <Eye size={16} />
                    </Button>
                </div>
            )
        }
    ];

    const statusOptions: { value: FilterStatus; label: string }[] = [
        { value: 'all', label: 'All' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'PREPARED', label: 'Prepared' },
        { value: 'IN_TRANSIT', label: 'In Transit' },
        { value: 'DELIVERED', label: 'Delivered' },
        { value: 'CANCELLED', label: 'Cancelled' }
    ];

    const updateFormField = (field: string, value: string) => {
        setCreateForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Shipment Tracking</h1>
                    <p className="text-sm text-gray-400 mt-1">Quản lý vận chuyển, cập nhật trạng thái, và theo dõi giao hàng.</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Create Shipment
                </Button>
            </div>

            <Card className="border-0 shadow-sm ring-1 ring-zinc-700">
                <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Filter size={16} className="text-gray-400 mr-1" />
                        <span className="text-sm text-gray-400 mr-2">Status:</span>
                        {statusOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap
                                    ${statusFilter === opt.value
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                        : 'bg-zinc-900/50 border-zinc-700 text-gray-400 hover:bg-zinc-900/80'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <DataTable
                    data={shipments}
                    columns={columns}
                    isLoading={isLoading}
                    keyExtractor={s => String(s.shipmentId)}
                    onRowClick={(s) => setSelectedShipment(s)}
                />

                {totalPages > 1 && (
                    <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-sm text-gray-400">Page {page + 1} of {totalPages}</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                                Previous
                            </Button>
                            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* ====== Create Shipment Modal ====== */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-200 mb-5 flex items-center gap-2">
                            <Truck size={20} className="text-amber-500" /> Create Shipment
                        </h2>
                        <div className="space-y-4">
                            {/* Required Fields */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Production Plan ID *</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 1"
                                    value={createForm.productionPlanId}
                                    onChange={e => updateFormField('productionPlanId', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Store ID *</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 1"
                                    value={createForm.storeId}
                                    onChange={e => updateFormField('storeId', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Store Order IDs * (comma separated)</label>
                                <Input
                                    placeholder="e.g. 1, 2, 3"
                                    value={createForm.storeOrderIds}
                                    onChange={e => updateFormField('storeOrderIds', e.target.value)}
                                />
                            </div>

                            {/* Optional Fields */}
                            <div className="pt-3 border-t border-zinc-800">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Optional Details</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Driver Name</label>
                                        <Input
                                            placeholder="Driver name"
                                            value={createForm.driverName}
                                            onChange={e => updateFormField('driverName', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Driver Phone</label>
                                        <Input
                                            placeholder="Phone number"
                                            value={createForm.driverPhone}
                                            onChange={e => updateFormField('driverPhone', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Vehicle Info</label>
                                        <Input
                                            placeholder="e.g. 59A-12345"
                                            value={createForm.vehicleInfo}
                                            onChange={e => updateFormField('vehicleInfo', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Shipping Fee</label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={createForm.shippingFee}
                                            onChange={e => updateFormField('shippingFee', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Note</label>
                                    <Input
                                        placeholder="Any instructions..."
                                        value={createForm.note}
                                        onChange={e => updateFormField('note', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={isCreating}>Cancel</Button>
                            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleCreateShipment} disabled={isCreating}>
                                {isCreating ? 'Creating...' : 'Create'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ShipmentDetailDrawer
                shipment={selectedShipment}
                isOpen={!!selectedShipment}
                onClose={() => setSelectedShipment(null)}
                onStatusAction={handleStatusAction}
            />
        </div>
    );
};
