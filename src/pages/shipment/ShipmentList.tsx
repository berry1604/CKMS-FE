import { useEffect, useState, useCallback } from 'react';
import { Truck, Filter, Eye, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { shipmentApi } from '../../services/shipment.api';
import { productionPlanApi } from '../../services/productionPlan.api';
import { storeApi } from '../../services/store.api';
import { storeOrderApi } from '../../services/storeOrderApi';
import type { ShipmentResponse, ShipmentStatus, CreateShipmentRequest } from '../../types/shipment';
import type { StoreResponse } from '../../types/store';
import type { StoreOrderResponse } from '../../types/storeOrder';
import type { ProductionPlanSummaryResponse } from '../../types/productionPlan';
import { ShipmentDetailDrawer } from './ShipmentDetailDrawer';
import { toast } from 'react-hot-toast';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

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
    const [planCheckResult, setPlanCheckResult] = useState<{ status: string, name: string } | null>(null);
    const [isCheckingPlan, setIsCheckingPlan] = useState(false);
    const [planError, setPlanError] = useState<string | null>(null);
    const [availablePlans, setAvailablePlans] = useState<ProductionPlanSummaryResponse[]>([]);
    const [availableStores, setAvailableStores] = useState<StoreResponse[]>([]);
    const [availableOrders, setAvailableOrders] = useState<StoreOrderResponse[]>([]);

    useEffect(() => {
        if (showCreateModal) {
            fetchAvailableOptions();
        }
    }, [showCreateModal]);

    const fetchAvailableOptions = async () => {
        try {
            // Fetch Plans
            const planRes = await productionPlanApi.getAllProductionPlans({ size: 100 });
            const completedPlans = (planRes.content || []).filter(p => p.status === 'FINISHED' || p.status === 'COMPLETED');
            setAvailablePlans(completedPlans.sort((a, b) => b.planId - a.planId));

            // Fetch Stores
            const storeRes = await storeApi.getAllStores({ size: 100 });
            setAvailableStores(storeRes.data?.content || []);

        } catch (error) {
            console.error('Failed to fetch modal options:', error);
        }
    };

    // When store changes, fetch its matching orders
    useEffect(() => {
        const fetchStoreOrders = async () => {
            if (!createForm.storeId) {
                setAvailableOrders([]);
                return;
            }
            try {
                // Fetch all orders
                const ordersRes = await storeOrderApi.getAllOrders({ size: 100 });
                // Filter by selected store and those that are ready for shipment
                const storeOrders = (ordersRes.content || []).filter(o =>
                    o.storeId.toString() === createForm.storeId &&
                    (o.status === 'READY' || o.status === 'CONFIRMED' || o.status === 'PREPARING')
                );
                setAvailableOrders(storeOrders);
            } catch (error) {
                console.error('Failed to fetch store orders', error);
            }
        };
        fetchStoreOrders();
    }, [createForm.storeId]);

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
            toast.error('Không thể tải danh sách vận chuyển');
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

    // Check Production Plan Status Logic
    useEffect(() => {
        const planId = Number(createForm.productionPlanId);
        if (!planId || isNaN(planId)) {
            setPlanCheckResult(null);
            setPlanError(null);
            return;
        }

        const timer = setTimeout(async () => {
            setIsCheckingPlan(true);
            setPlanError(null);
            try {
                const detail = await productionPlanApi.getProductionPlanDetail(planId);
                setPlanCheckResult({ status: detail.status, name: detail.planName });
                if (detail.status !== 'FINISHED' && detail.status !== 'COMPLETED') {
                    setPlanError(`Kế hoạch này đang ở trạng thái ${detail.status}. Cần được HOÀN THÀNH trước khi tạo đơn.`);
                }
            } catch (err: any) {
                setPlanCheckResult(null);
                setPlanError('Không tìm thấy kế hoạch sản xuất này');
            } finally {
                setIsCheckingPlan(false);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [createForm.productionPlanId]);

    const handleCreateShipment = async () => {
        const productionPlanId = Number(createForm.productionPlanId);
        const storeId = Number(createForm.storeId);
        const storeOrderIds = createForm.storeOrderIds
            .split(',')
            .map(s => Number(s.trim()))
            .filter(n => !isNaN(n) && n > 0);

        if (!productionPlanId || isNaN(productionPlanId)) {
            toast.error('Mã kế hoạch sản xuất là bắt buộc');
            return;
        }
        if (!storeId || isNaN(storeId)) {
            toast.error('Mã cửa hàng là bắt buộc');
            return;
        }
        if (storeOrderIds.length === 0) {
            toast.error('Ít nhất một mã đơn hàng cửa hàng là bắt buộc');
            return;
        }

        const selectedOrders = availableOrders.filter(o => storeOrderIds.includes(o.orderId));
        const invalidOrders = selectedOrders.filter(o => o.status !== 'READY' && o.status !== 'ready');
        if (invalidOrders.length > 0) {
            toast.error(`Đơn hàng #${invalidOrders.map(o => o.orderId).join(', ')} đang ở trạng thái "${invalidOrders[0].status}". Vui lòng đưa đơn hàng vào Lịch Sản Xuất và Hoàn Thành kế hoạch trước khi vận chuyển.`);
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
            toast.success('Đã tạo đơn vận chuyển thành công!');
            setShowCreateModal(false);
            setCreateForm({
                productionPlanId: '', storeId: '', storeOrderIds: '',
                driverName: '', driverPhone: '', vehicleInfo: '', shippingFee: '', note: ''
            });
            fetchShipments();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Không thể tạo đơn vận chuyển';
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
                    toast.success('Đã chuẩn bị xong hàng');
                    break;
                case 'transit':
                    await shipmentApi.startTransit(id);
                    toast.success('Đơn hàng đang được vận chuyển');
                    break;
                case 'confirm':
                    await shipmentApi.confirmDelivery(id);
                    toast.success('Đã xác nhận giao hàng');
                    break;
                case 'cancel':
                    const reason = prompt('Lý do hủy (tùy chọn):');
                    await shipmentApi.cancelShipment(id, reason || undefined);
                    toast.success('Đã hủy đơn vận chuyển');
                    break;
            }
            setSelectedShipment(null);
            fetchShipments();
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Không thể thực hiện thao tác ${action}`);
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
        const labels: Record<string, string> = {
            'PENDING': 'CHỜ XỬ LÝ',
            'PREPARED': 'ĐÃ CHUẨN BỊ',
            'IN_TRANSIT': 'ĐANG GIAO',
            'DELIVERED': 'ĐÃ GIAO',
            'CANCELLED': 'ĐÃ HỦY'
        };
        return <Badge variant={colors[status] || 'default'}>{labels[status] || status.replace('_', ' ')}</Badge>;
    };

    const columns: Column<ShipmentResponse>[] = [
        {
            header: 'Mã Đơn',
            cell: (s) => <span className="font-mono text-xs bg-zinc-800 px-2 py-1 rounded text-gray-300">#{s.shipmentId}</span>
        },
        {
            header: 'Cửa Hàng',
            cell: (s) => <span className="text-gray-200">{s.storeName || `Cửa hàng #${s.storeId}`}</span>
        },
        {
            header: 'Tài Xế',
            cell: (s) => (
                <div>
                    <p className="text-sm text-gray-200">{s.driverName || '—'}</p>
                    {s.vehicleInfo && <p className="text-xs text-gray-500">{s.vehicleInfo}</p>}
                </div>
            )
        },
        {
            header: 'Ngày Tạo',
            cell: (s) => <span className="text-sm text-gray-400">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</span>
        },
        {
            header: 'Trạng Thái',
            cell: (s) => getStatusBadge(s.status)
        },
        {
            header: 'Thao Tác',
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
        { value: 'all', label: 'Tất cả' },
        { value: 'PENDING', label: 'Chờ xử lý' },
        { value: 'PREPARED', label: 'Đã chuẩn bị' },
        { value: 'IN_TRANSIT', label: 'Đang giao' },
        { value: 'DELIVERED', label: 'Đã giao' },
        { value: 'CANCELLED', label: 'Đã hủy' }
    ];

    const updateFormField = (field: string, value: string) => {
        setCreateForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Theo Dõi Vận Chuyển</h1>
                    <p className="text-sm text-gray-400 mt-1">Quản lý vận chuyển, cập nhật trạng thái, và theo dõi giao hàng.</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Tạo Đơn Vận Chuyển
                </Button>
            </div>

            <Card className="border-0 shadow-sm ring-1 ring-zinc-700">
                <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Filter size={16} className="text-gray-400 mr-1" />
                        <span className="text-sm text-gray-400 mr-2">Trạng thái:</span>
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
                        <span className="text-sm text-gray-400">Trang {page + 1} / {totalPages}</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                                Trước
                            </Button>
                            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                                Sau
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
                            <Truck size={20} className="text-amber-500" /> Tạo Đơn Vận Chuyển
                        </h2>
                        <div className="space-y-4">
                            {/* Required Fields */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Mã Kế Hoạch Sản Xuất *</label>
                                <div className="relative">
                                    <select
                                        value={createForm.productionPlanId}
                                        onChange={e => updateFormField('productionPlanId', e.target.value)}
                                        className={`w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-gray-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none ${planError ? 'border-red-500/50' : (planCheckResult && !planError) ? 'border-green-500/50' : ''}`}
                                    >
                                        <option value="" disabled>-- Chọn kế hoạch đã hoàn thành --</option>
                                        {availablePlans.map(plan => (
                                            <option key={plan.planId} value={plan.planId}>
                                                #{plan.planId} - {plan.planName}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        {isCheckingPlan ? (
                                            <Loader2 size={16} className="animate-spin text-gray-400" />
                                        ) : (
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        )}
                                    </div>
                                </div>
                                {planCheckResult && (
                                    <div className="mt-2 text-xs flex items-center gap-1.5 px-2">
                                        {planError ? (
                                            <>
                                                <AlertCircle size={14} className="text-red-400" />
                                                <span className="text-red-400">[{planCheckResult.status}] {planCheckResult.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={14} className="text-green-400" />
                                                <span className="text-green-400">Sẵn sàng: {planCheckResult.name}</span>
                                            </>
                                        )}
                                    </div>
                                )}
                                {planError && !planCheckResult && (
                                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                                        <AlertCircle size={12} /> {planError}
                                    </p>
                                )}
                                {planError && planCheckResult && (
                                    <p className="mt-1 text-[10px] text-red-500/70 ml-6 italic">
                                        * Vui lòng vào "Lịch Sản Xuất" để hoàn thành kế hoạch này trước.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Cửa Hàng *</label>
                                <div className="relative">
                                    <select
                                        value={createForm.storeId}
                                        onChange={e => {
                                            updateFormField('storeId', e.target.value);
                                            updateFormField('storeOrderIds', ''); // Reset order when store changes
                                        }}
                                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-gray-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none"
                                    >
                                        <option value="" disabled>-- Chọn Cửa Hàng --</option>
                                        {availableStores.map(store => {
                                            const sId = store.id || (store as any).storeId;
                                            return (
                                                <option key={sId} value={sId}>
                                                    #{sId} - {store.name}
                                                </option>
                                            )
                                        })}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Đơn Hàng *</label>
                                <div className="relative">
                                    <select
                                        value={createForm.storeOrderIds}
                                        onChange={e => updateFormField('storeOrderIds', e.target.value)}
                                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-gray-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none disabled:bg-zinc-800 disabled:text-gray-500"
                                        disabled={!createForm.storeId}
                                    >
                                        <option value="" disabled>-- Chọn Đơn Hàng --</option>
                                        {availableOrders.map(order => (
                                            <option key={order.orderId} value={order.orderId}>
                                                #{order.orderId} - Tổng {order.totalAmount?.toLocaleString('vi-VN')}đ
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                                {!createForm.storeId && (
                                    <p className="mt-1 text-[10px] text-gray-500 italic">* Vui lòng chọn cửa hàng trước</p>
                                )}
                                {createForm.storeId && availableOrders.length === 0 && (
                                    <p className="mt-1 text-[10px] text-amber-500/70 italic">* Cửa hàng này không có đơn hàng nào</p>
                                )}
                            </div>

                            {/* Optional Fields */}
                            <div className="pt-3 border-t border-zinc-800">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Thông tin bổ sung (tùy chọn)</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Tên tài xế</label>
                                        <Input
                                            placeholder="Tên tài xế"
                                            value={createForm.driverName}
                                            onChange={e => updateFormField('driverName', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Số điện thoại</label>
                                        <Input
                                            placeholder="Số điện thoại"
                                            value={createForm.driverPhone}
                                            onChange={e => updateFormField('driverPhone', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Thông tin xe</label>
                                        <Input
                                            placeholder="Ví dụ: 59A-123.45"
                                            value={createForm.vehicleInfo}
                                            onChange={e => updateFormField('vehicleInfo', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Phí vận chuyển</label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={createForm.shippingFee}
                                            onChange={e => updateFormField('shippingFee', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Ghi chú</label>
                                    <Input
                                        placeholder="Hướng dẫn giao hàng..."
                                        value={createForm.note}
                                        onChange={e => updateFormField('note', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={isCreating}>Hủy</Button>
                            <Button
                                className={`${planError ? 'bg-zinc-800 text-gray-500 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                                onClick={handleCreateShipment}
                                disabled={isCreating || !!planError || isCheckingPlan}
                            >
                                {isCreating ? 'Đang tạo...' : 'Tạo Đơn'}
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
