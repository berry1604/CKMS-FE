import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Calendar as CalendarIcon, CheckCircle, Clock, PlayCircle, List, ChevronLeft, ChevronRight, Plus, Search, Filter, Ban, CheckSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Drawer } from '../../components/ui/Drawer';
import { productionPlanApi } from '../../services/productionPlan.api';
import { kitchenInventoryApi } from '../../services/kitchenInventory.api';
import type { ProductionPlanSummaryResponse, ProductionPlanDetailResponse } from '../../types/productionPlan';
import type { KitchenStockItemResponse } from '../../types/kitchenInventory';
import toast from 'react-hot-toast';

export const ProductionSchedule = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [plans, setPlans] = useState<ProductionPlanSummaryResponse[]>([]);
    const [filteredPlans, setFilteredPlans] = useState<ProductionPlanSummaryResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'completed'>('list');

    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [selectedPlanDetail, setSelectedPlanDetail] = useState<ProductionPlanDetailResponse | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    // Kitchen stock map: materialName (lowercase) → available quantity
    const [materialStockMap, setMaterialStockMap] = useState<Map<string, number>>(new Map());

    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const handleCreateTask = () => {
        navigate('/kitchen/create-task');
    };

    useEffect(() => {
        loadPlans();
    }, []);

    useEffect(() => {
        if (selectedPlanId) {
            loadPlanDetail(selectedPlanId);
        } else {
            setSelectedPlanDetail(null);
        }
    }, [selectedPlanId]);

    // Fetch kitchen stock whenever detail panel opens
    useEffect(() => {
        if (!selectedPlanId) {
            setMaterialStockMap(new Map());
            return;
        }
        const fetchStock = async () => {
            // Use kitchenId from the plan detail once loaded, or from user session
            const kitchenId = selectedPlanDetail?.kitchenId || user?.kitchenId;
            if (!kitchenId) return;
            try {
                const warehouses = await kitchenInventoryApi.getWarehousesByKitchenId(kitchenId);
                if (warehouses.length === 0) return;
                // Aggregate stock across all warehouses
                const nameMap = new Map<string, number>();
                for (const w of warehouses) {
                    const res = await kitchenInventoryApi.getWarehouseStock(w.warehouseId);
                    const items: KitchenStockItemResponse[] = res.data || [];
                    for (const item of items) {
                        const key = item.itemName?.toLowerCase().trim();
                        if (key) {
                            nameMap.set(key, (nameMap.get(key) || 0) + item.quantity);
                        }
                    }
                }
                setMaterialStockMap(nameMap);
            } catch (e) {
                console.error('Failed to load kitchen stock for plan detail', e);
            }
        };
        fetchStock();
    }, [selectedPlanId, selectedPlanDetail?.kitchenId, user?.kitchenId]);

    useEffect(() => {
        let result = plans;

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.planName?.toLowerCase().includes(lowerQuery) ||
                p.batchCode?.toLowerCase().includes(lowerQuery) ||
                String(p.planId).includes(lowerQuery)
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(p => p.status?.toLowerCase() === statusFilter.toLowerCase());
        }

        setFilteredPlans(result);
    }, [searchQuery, statusFilter, plans]);

    const loadPlans = async () => {
        setIsLoading(true);
        try {
            const response = await productionPlanApi.getAllProductionPlans({ size: 100 });
            const data = response.content || [];
            // Sort by ID descending (newest first)
            setPlans(data.sort((a, b) => b.planId - a.planId));
        } catch (error) {
            console.error('Failed to load plans:', error);
            toast.error('Không thể tải kế hoạch sản xuất');
        } finally {
            setIsLoading(false);
        }
    };

    const loadPlanDetail = async (id: number) => {
        setIsDetailLoading(true);
        try {
            const detail = await productionPlanApi.getProductionPlanDetail(id);
            setSelectedPlanDetail(detail);
        } catch (error) {
            console.error('Failed to load plan detail:', error);
            toast.error('Không thể tải chi tiết kế hoạch');
            setSelectedPlanId(null);
        } finally {
            setIsDetailLoading(false);
        }
    };

    const handleStatusAction = async (action: 'ready' | 'start' | 'finish' | 'cancel', planIdOverride?: number, versionOverride?: number) => {
        const id = planIdOverride || selectedPlanDetail?.planId;
        const version = versionOverride !== undefined ? versionOverride : selectedPlanDetail?.version;

        if (!id) return;

        try {
            switch (action) {
                case 'ready':
                    await productionPlanApi.readyProductionPlan(id);
                    break;
                case 'start':
                    await productionPlanApi.startProductionPlan(id, version);
                    break;
                case 'finish':
                    await productionPlanApi.finishProductionPlan(id, version);
                    break;
                case 'cancel':
                    if (confirm('Bạn có chắc chắn muốn hủy kế hoạch này không?')) {
                        await productionPlanApi.cancelProductionPlan(id, version, true);
                    } else {
                        return;
                    }
                    break;
            }
            if (action === 'finish') {
                toast.success('Kế hoạch đã hoàn thành. Sản phẩm đã được cập nhật vào kho.');
            } else {
                toast.success('Cập nhật trạng thái thành công');
            }
            loadPlans();
            if (selectedPlanId === id) {
                loadPlanDetail(id);
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || `Failed to ${action} plan`;
            toast.error(msg);
            console.error(error);
        }
    };

    const getStatusBadge = (status: string) => {
        const s = status?.toUpperCase() || 'UNKNOWN';
        let variant: "default" | "primary" | "secondary" | "success" | "warning" | "info" | "danger" = 'default';
        let Icon = Clock;

        switch (s) {
            case 'DRAFT': variant = 'warning'; Icon = Clock; break;
            case 'PLANNED': variant = 'warning'; Icon = Clock; break;
            case 'READY_TO_PRODUCE': variant = 'info'; Icon = CheckSquare; break;
            case 'IN_PRODUCTION': variant = 'primary'; Icon = PlayCircle; break;
            case 'COMPLETED': variant = 'success'; Icon = CheckCircle; break;
            case 'FINISHED': variant = 'success'; Icon = CheckCircle; break;
            case 'CANCELLED': variant = 'danger'; Icon = Ban; break;
        }

        return (
            <Badge variant={variant} className="flex items-center gap-1.5 w-max">
                <Icon size={12} />
                {s === 'DRAFT' ? 'NHÁP' :
                    s === 'PLANNED' ? 'ĐANG LÊN KẾ HOẠCH' :
                        s === 'READY_TO_PRODUCE' ? 'SẴN SÀNG' :
                            s === 'IN_PRODUCTION' ? 'ĐANG SẢN XUẤT' :
                                s === 'COMPLETED' ? 'HOÀN THÀNH' :
                                    s === 'FINISHED' ? 'HOÀN THÀNH' :
                                        s === 'CANCELLED' ? 'ĐÃ HỦY' : s.replace('_', ' ')}
            </Badge>
        );
    };

    // List View Columns
    const columns: Column<ProductionPlanSummaryResponse>[] = [
        {
            header: 'Mã Kế Hoạch',
            accessorKey: 'planId',
            cell: (row) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-400">#{row.planId}</span>
        },
        {
            header: 'Tên Kế Hoạch / Mã Lô',
            cell: (row) => (
                <div>
                    <h4 className="font-medium text-gray-200">{row.planName || 'Kế hoạch chưa đặt tên'}</h4>
                    {row.batchCode && <p className="text-xs text-gray-400">Lô: {row.batchCode}</p>}
                </div>
            )
        },
        {
            header: 'Trạng Thái',
            cell: (row) => getStatusBadge(row.status)
        },
        {
            header: 'Mã Bếp',
            accessorKey: 'kitchenId',
            cell: (row) => <span className="text-sm text-gray-300">{row.kitchenId || 'Bếp mặc định'}</span>
        },
        {
            header: 'Ngày Tạo',
            accessorKey: 'createdAt',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="text-gray-200 text-sm">{row.createdAt ? new Date(row.createdAt).toLocaleDateString('vi-VN') : '-'}</span>
                    <span className="text-xs text-gray-400">{row.createdAt ? new Date(row.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
            )
        },
        {
            header: 'Thao Tác',
            cell: (row) => (
                <Button variant="ghost" size="sm" onClick={() => setSelectedPlanId(row.planId)}>
                    Xem
                </Button>
            )
        }
    ];

    // Calendar Helper Functions
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="min-h-[120px] border-b border-r border-zinc-800 bg-zinc-900/50" />);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayPlans = plans.filter(p => p.createdAt?.startsWith(dateStr));
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            days.push(
                <div key={day} className={`min-h-[120px] border-b border-r border-zinc-800 p-1 relative group hover:bg-zinc-900/80 transition-colors flex flex-col`}>
                    <div className="flex justify-center py-1 mb-1">
                        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-amber-600 text-white' : 'text-gray-300'}`}>
                            {day}
                        </span>
                    </div>

                    <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-1">
                        {dayPlans.map(plan => (
                            <button
                                key={plan.planId}
                                onClick={() => setSelectedPlanId(plan.planId)}
                                className={`w-full text-left px-2 py-1 rounded text-xs border border-transparent shadow-sm truncate
                                    ${plan.status === 'COMPLETED' ? 'bg-green-600 text-white hover:bg-green-700' :
                                        plan.status === 'IN_PRODUCTION' ? 'bg-amber-600 text-white hover:bg-blue-700' :
                                            plan.status === 'CANCELLED' ? 'bg-red-600 text-white hover:bg-red-700' :
                                                'bg-zinc-700 text-white hover:bg-zinc-600'}`}
                            >
                                <span className="opacity-90 font-medium text-[10px] mr-1">
                                    {plan.createdAt ? new Date(plan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                                <span className="font-medium">{plan.planName || 'Plan'}</span>
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <Card className="rounded-xl shadow-sm border border-zinc-700 overflow-hidden bg-zinc-900/50">
                <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-700">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-normal text-gray-300">
                            {currentDate.toLocaleString('default', { month: 'long' })} <span className="text-gray-400">{year}</span>
                        </h2>
                        <div className="flex items-center rounded-md border border-zinc-700 shadow-sm bg-zinc-900/50">
                            <button
                                onClick={() => setCurrentDate(new Date(year, month - 1))}
                                className="p-1.5 hover:bg-zinc-900/80 text-gray-400 border-r border-zinc-700"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-3 text-sm font-medium text-gray-300 hover:bg-zinc-900/80"
                            >
                                Hôm nay
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date(year, month + 1))}
                                className="p-1.5 hover:bg-zinc-900/80 text-gray-400 border-l border-zinc-700"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                    <div>
                    </div>
                </div>
                <div className="grid grid-cols-7 border-b border-zinc-700">
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-gray-400 tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 bg-zinc-900/50">
                    {days}
                </div>
            </Card>
        );
    };

    const renderCompletedView = () => {
        const inProgressPlans = plans.filter(p => p.status === 'IN_PRODUCTION');
        const completedPlans = plans.filter(p => p.status === 'COMPLETED' || p.status === 'FINISHED');

        return (
            <div className="space-y-6">
                {/* Active Production Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                            <PlayCircle size={20} className="text-amber-500" /> Đang Sản Xuất
                        </h3>
                        <Badge variant="warning">{inProgressPlans.length} Kế hoạch</Badge>
                    </div>

                    {inProgressPlans.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inProgressPlans.map(plan => (
                                <Card key={plan.planId} className="p-4 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-100">{plan.planName}</h4>
                                            <p className="text-xs text-gray-400 font-mono">#{plan.planId} | {plan.batchCode}</p>
                                        </div>
                                        {getStatusBadge(plan.status)}
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Bắt đầu lúc:</span>
                                            <span className="text-gray-300">{plan.createdAt ? new Date(plan.createdAt).toLocaleTimeString('vi-VN') : '-'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 text-xs"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedPlanId(plan.planId)}
                                        >
                                            <Search size={14} className="mr-1" /> Chi tiết
                                        </Button>
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                                            size="sm"
                                            onClick={() => handleStatusAction('finish', plan.planId, plan.version)}
                                        >
                                            <CheckCircle size={14} className="mr-1" /> Hoàn thành
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                                <PlayCircle size={24} className="text-gray-500" />
                            </div>
                            <p className="text-gray-400">Không có kế hoạch nào đang sản xuất.</p>
                        </div>
                    )}
                </div>

                {/* Completion History Section */}
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                            <CheckCircle size={20} className="text-green-500" /> Lịch Sử Hoàn Thành
                        </h3>
                    </div>

                    <Card className="border-0 shadow-sm ring-1 ring-zinc-700">
                        <DataTable
                            data={completedPlans}
                            columns={columns.slice(0, 5).concat([
                                {
                                    header: 'Thao Tác',
                                    cell: (row) => (
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedPlanId(row.planId)}>
                                            Xem lại
                                        </Button>
                                    )
                                }
                            ])}
                            isLoading={isLoading}
                            keyExtractor={item => String(item.planId)}
                        />
                    </Card>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Lịch Sản Xuất</h1>
                    <p className="text-sm text-gray-400 mt-1">Quản lý các kế hoạch và yêu cầu sản xuất của bếp.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-zinc-900/50 text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}
                        >
                            <List size={16} /> Danh sách
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'calendar' ? 'bg-zinc-900/50 text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}
                        >
                            <CalendarIcon size={16} /> Lịch
                        </button>
                        <button
                            onClick={() => setViewMode('completed')}
                            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'completed' ? 'bg-zinc-900/50 text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}
                        >
                            <CheckCircle size={16} /> Hoàn tất
                        </button>
                    </div>
                    <Button
                        className="shrink-0 shadow-sm bg-amber-600 hover:bg-blue-700 text-white"
                        onClick={handleCreateTask}
                    >
                        <Plus size={18} className="mr-2" /> Tạo Kế Hoạch
                    </Button>
                </div>
            </div>

            {viewMode === 'list' && (
                <Card className="border-0 shadow-sm ring-1 ring-zinc-700">
                    <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-80">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Tìm tên kế hoạch, mã lô..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <Filter size={16} className="text-gray-400 mr-1" />
                            <span className="text-sm text-gray-400 mr-2">Trạng thái:</span>
                            {['all', 'planned', 'ready_to_produce', 'in_production', 'finished', 'cancelled'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status as any)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap
                                        ${statusFilter === status
                                            ? 'bg-amber-500/10 border-blue-200 text-amber-500'
                                            : 'bg-zinc-900/50 border-zinc-700 text-gray-400 hover:bg-zinc-900/80'}`}
                                >
                                    {status === 'all' ? 'Tất cả' :
                                        status === 'planned' ? 'Đang lên KH' :
                                            status === 'ready_to_produce' ? 'Sẵn sàng' :
                                                status === 'in_production' ? 'Đang làm' :
                                                    status === 'finished' ? 'Xong' :
                                                        status === 'cancelled' ? 'Đã hủy' : status}
                                </button>
                            ))}
                        </div>
                    </div>
                    <DataTable
                        data={filteredPlans}
                        columns={columns}
                        isLoading={isLoading}
                        keyExtractor={item => String(item.planId)}
                    />
                </Card>
            )}

            {viewMode === 'calendar' && renderCalendar()}
            {viewMode === 'completed' && renderCompletedView()}

            <Drawer
                isOpen={!!selectedPlanId}
                onClose={() => setSelectedPlanId(null)}
                title={selectedPlanDetail?.planName || 'Chi Tiết Kế Hoạch'}
                description={selectedPlanDetail?.batchCode ? `Mã lô: ${selectedPlanDetail.batchCode}` : 'Chi tiết kế hoạch sản xuất'}
                width="max-w-2xl"
                footer={
                    selectedPlanDetail && selectedPlanDetail.status !== 'COMPLETED' && selectedPlanDetail.status !== 'FINISHED' && selectedPlanDetail.status !== 'CANCELLED' && (
                        <div className="flex flex-col gap-3 w-full">
                            <h4 className="font-medium text-gray-200 text-sm">Thao Tác</h4>
                            <div className="flex gap-2">
                                {(selectedPlanDetail.status === 'DRAFT' || selectedPlanDetail.status === 'PLANNED') && (
                                    <>
                                        <Button
                                            className="flex-1"
                                            variant="primary"
                                            onClick={() => handleStatusAction('ready')}
                                        >
                                            Đánh dấu Sẵn sàng
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            variant="danger"
                                            onClick={() => handleStatusAction('cancel')}
                                        >
                                            Hủy Kế Hoạch
                                        </Button>
                                    </>
                                )}
                                {selectedPlanDetail.status === 'READY_TO_PRODUCE' && (
                                    <>
                                        <Button
                                            className="flex-1 bg-amber-600 hover:bg-blue-700 text-white"
                                            onClick={() => handleStatusAction('start')}
                                        >
                                            Bắt Đầu Sản Xuất
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            variant="danger"
                                            onClick={() => handleStatusAction('cancel')}
                                        >
                                            Hủy Kế Hoạch
                                        </Button>
                                    </>
                                )}
                                {selectedPlanDetail.status === 'IN_PRODUCTION' && (
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleStatusAction('finish')}
                                    >
                                        Hoàn Thành Sản Xuất
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                }
            >
                {isDetailLoading ? (
                    <div className="p-8 text-center text-gray-400">Đang tải chi tiết...</div>
                ) : selectedPlanDetail ? (
                    <div className="space-y-6">
                        <div className="bg-amber-500/10 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Trạng Thái Hiện Tại</p>
                                {getStatusBadge(selectedPlanDetail.status)}
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Ngày Tạo</p>
                                <div className="flex items-center gap-2 text-gray-200 font-medium">
                                    <CalendarIcon size={16} className="text-gray-400" />
                                    <span>{new Date(selectedPlanDetail.createdAt).toLocaleString('vi-VN')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-200">Yêu Cầu Nguyên Liệu</h4>
                                {materialStockMap.size > 0 && (
                                    <span className="text-xs text-gray-500">Đối chiếu với tồn kho bếp</span>
                                )}
                            </div>
                            {selectedPlanDetail.materials && selectedPlanDetail.materials.length > 0 ? (
                                <table className="min-w-full divide-y divide-zinc-800 bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-800">
                                    <thead className="bg-zinc-800/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nguyên Liệu</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Yêu Cầu</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Tồn kho</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {selectedPlanDetail.materials.map((mat, idx) => {
                                            const key = mat.materialName?.toLowerCase().trim();
                                            const available = key ? materialStockMap.get(key) : undefined;
                                            const stockKnown = available !== undefined;
                                            const sufficient = !stockKnown || available! >= mat.requiredQuantity;
                                            return (
                                                <tr key={idx} className={`hover:bg-zinc-800/30 ${!sufficient ? 'bg-red-500/5' : ''}`}>
                                                    <td className="px-4 py-3 text-sm text-gray-300">{mat.materialName}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-300 text-right font-medium">
                                                        {mat.requiredQuantity} <span className="text-gray-500 text-xs ml-1">{mat.unit}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right">
                                                        {stockKnown ? (
                                                            <span className={`font-semibold ${available! < mat.requiredQuantity ? 'text-red-400' : 'text-green-400'}`}>
                                                                {available} <span className="text-gray-500 text-xs ml-0.5">{mat.unit}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs italic">Chưa rõ</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {!stockKnown ? (
                                                            <span className="text-xs text-gray-500">—</span>
                                                        ) : sufficient ? (
                                                            <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium">
                                                                <CheckCircle2 size={12} /> Đủ
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs text-red-400 font-semibold">
                                                                <AlertTriangle size={12} /> Thiếu {mat.requiredQuantity - available!} {mat.unit}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-4 text-center border border-zinc-800 rounded-lg bg-zinc-900/50 text-gray-400 text-sm">
                                    Không có yêu cầu nguyên liệu cho kế hoạch này.
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg shadow-sm">
                                <span className="text-xs text-gray-400 block mb-1">Mã Bếp</span>
                                <span className="font-medium text-gray-200">{selectedPlanDetail.kitchenId || 'Mặc định'}</span>
                            </div>
                            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg shadow-sm">
                                <span className="text-xs text-gray-400 block mb-1">ID Người Điều Phối</span>
                                <span className="font-medium text-gray-200">{selectedPlanDetail.coordinatorUserId || 'Tự động gán'}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-400">Lỗi khi tải cấu hình kế hoạch.</div>
                )}
            </Drawer>
        </div>
    );
};
