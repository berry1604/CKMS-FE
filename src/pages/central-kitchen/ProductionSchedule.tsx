import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, CheckCircle, Clock, PlayCircle, List, ChevronLeft, ChevronRight, Plus, Search, Filter, Ban, CheckSquare } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Drawer } from '../../components/ui/Drawer';
import { productionPlanApi } from '../../services/productionPlan.api';
import type { ProductionPlanSummaryResponse, ProductionPlanDetailResponse } from '../../types/productionPlan';
import toast from 'react-hot-toast';

export const ProductionSchedule = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState<ProductionPlanSummaryResponse[]>([]);
    const [filteredPlans, setFilteredPlans] = useState<ProductionPlanSummaryResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [selectedPlanDetail, setSelectedPlanDetail] = useState<ProductionPlanDetailResponse | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

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
            toast.error('Failed to load production plans');
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
            toast.error('Failed to load plan details');
            setSelectedPlanId(null);
        } finally {
            setIsDetailLoading(false);
        }
    };

    const handleStatusAction = async (action: 'ready' | 'start' | 'finish' | 'cancel') => {
        if (!selectedPlanDetail) return;
        try {
            switch (action) {
                case 'ready':
                    await productionPlanApi.readyProductionPlan(selectedPlanDetail.planId);
                    break;
                case 'start':
                    await productionPlanApi.startProductionPlan(selectedPlanDetail.planId, selectedPlanDetail.version);
                    break;
                case 'finish':
                    await productionPlanApi.finishProductionPlan(selectedPlanDetail.planId, selectedPlanDetail.version);
                    break;
                case 'cancel':
                    if (confirm('Are you sure you want to cancel this plan?')) {
                        await productionPlanApi.cancelProductionPlan(selectedPlanDetail.planId, selectedPlanDetail.version, true);
                    } else {
                        return;
                    }
                    break;
            }
            toast.success(`Plan marked as ${action}`);
            loadPlans();
            loadPlanDetail(selectedPlanDetail.planId);
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
            case 'READY': variant = 'info'; Icon = CheckSquare; break;
            case 'IN_PROGRESS': variant = 'primary'; Icon = PlayCircle; break;
            case 'COMPLETED': variant = 'success'; Icon = CheckCircle; break;
            case 'CANCELLED': variant = 'danger'; Icon = Ban; break;
        }

        return (
            <Badge variant={variant} className="flex items-center gap-1.5 w-max">
                <Icon size={12} />
                {s.replace('_', ' ')}
            </Badge>
        );
    };

    // List View Columns
    const columns: Column<ProductionPlanSummaryResponse>[] = [
        {
            header: 'Plan ID',
            accessorKey: 'planId',
            cell: (row) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-400">#{row.planId}</span>
        },
        {
            header: 'Plan Name / Batch',
            cell: (row) => (
                <div>
                    <h4 className="font-medium text-gray-200">{row.planName || 'Unnamed Plan'}</h4>
                    {row.batchCode && <p className="text-xs text-gray-400">Batch: {row.batchCode}</p>}
                </div>
            )
        },
        {
            header: 'Status',
            cell: (row) => getStatusBadge(row.status)
        },
        {
            header: 'Kitchen ID',
            accessorKey: 'kitchenId',
            cell: (row) => <span className="text-sm text-gray-300">{row.kitchenId || 'Standard Kitchen'}</span>
        },
        {
            header: 'Created At',
            accessorKey: 'createdAt',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="text-gray-200 text-sm">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</span>
                    <span className="text-xs text-gray-400">{row.createdAt ? new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
            )
        },
        {
            header: 'Actions',
            cell: (row) => (
                <Button variant="ghost" size="sm" onClick={() => setSelectedPlanId(row.planId)}>
                    View
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
                                    plan.status === 'IN_PROGRESS' ? 'bg-amber-600 text-white hover:bg-blue-700' :
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
                                Today
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
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Production Schedule</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage kitchen production plans and requirements.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-zinc-900/50 text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}
                        >
                            <List size={16} /> List View
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'calendar' ? 'bg-zinc-900/50 text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}
                        >
                            <CalendarIcon size={16} /> Calendar
                        </button>
                    </div>
                    <Button
                        className="shrink-0 shadow-sm bg-amber-600 hover:bg-blue-700 text-white"
                        onClick={handleCreateTask}
                    >
                        <Plus size={18} className="mr-2" /> Create Plan
                    </Button>
                </div>
            </div>

            {viewMode === 'list' && (
                <Card className="border-0 shadow-sm ring-1 ring-zinc-700">
                    <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-80">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search plan name, batch..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <Filter size={16} className="text-gray-400 mr-1" />
                            <span className="text-sm text-gray-400 mr-2">Status:</span>
                            {['all', 'draft', 'ready', 'in_progress', 'completed', 'cancelled'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status as any)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap
                                        ${statusFilter === status
                                            ? 'bg-amber-500/10 border-blue-200 text-amber-500'
                                            : 'bg-zinc-900/50 border-zinc-700 text-gray-400 hover:bg-zinc-900/80'}`}
                                >
                                    {status === 'all' ? 'All Plans' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

            <Drawer
                isOpen={!!selectedPlanId}
                onClose={() => setSelectedPlanId(null)}
                title={selectedPlanDetail?.planName || 'Plan Details'}
                description={selectedPlanDetail?.batchCode ? `Batch: ${selectedPlanDetail.batchCode}` : 'Production plan details'}
                width="max-w-2xl"
                footer={
                    selectedPlanDetail && selectedPlanDetail.status !== 'COMPLETED' && selectedPlanDetail.status !== 'CANCELLED' && (
                        <div className="flex flex-col gap-3 w-full">
                            <h4 className="font-medium text-gray-200 text-sm">Actions</h4>
                            <div className="flex gap-2">
                                {selectedPlanDetail.status === 'DRAFT' && (
                                    <>
                                        <Button
                                            className="flex-1"
                                            variant="primary"
                                            onClick={() => handleStatusAction('ready')}
                                        >
                                            Mark as Ready
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            variant="danger"
                                            onClick={() => handleStatusAction('cancel')}
                                        >
                                            Cancel Plan
                                        </Button>
                                    </>
                                )}
                                {selectedPlanDetail.status === 'READY' && (
                                    <>
                                        <Button
                                            className="flex-1 bg-amber-600 hover:bg-blue-700 text-white"
                                            onClick={() => handleStatusAction('start')}
                                        >
                                            Start Production
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            variant="danger"
                                            onClick={() => handleStatusAction('cancel')}
                                        >
                                            Cancel Plan
                                        </Button>
                                    </>
                                )}
                                {selectedPlanDetail.status === 'IN_PROGRESS' && (
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleStatusAction('finish')}
                                    >
                                        Complete Production
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                }
            >
                {isDetailLoading ? (
                    <div className="p-8 text-center text-gray-400">Loading details...</div>
                ) : selectedPlanDetail ? (
                    <div className="space-y-6">
                        <div className="bg-amber-500/10 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Current Status</p>
                                {getStatusBadge(selectedPlanDetail.status)}
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Created</p>
                                <div className="flex items-center gap-2 text-gray-200 font-medium">
                                    <CalendarIcon size={16} className="text-gray-400" />
                                    <span>{new Date(selectedPlanDetail.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-200">Material Requirements</h4>
                            {selectedPlanDetail.materials && selectedPlanDetail.materials.length > 0 ? (
                                <table className="min-w-full divide-y divide-zinc-800 bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-800">
                                    <thead className="bg-zinc-800/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Material</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Required Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {selectedPlanDetail.materials.map((mat, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-800/30">
                                                <td className="px-4 py-3 text-sm text-gray-300">{mat.materialName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-300 text-right font-medium">
                                                    {mat.requiredQuantity} <span className="text-gray-500 text-xs ml-1">{mat.unit}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-4 text-center border border-zinc-800 rounded-lg bg-zinc-900/50 text-gray-400 text-sm">
                                    No materials required for this plan.
                                </div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg shadow-sm">
                                <span className="text-xs text-gray-400 block mb-1">Kitchen ID</span>
                                <span className="font-medium text-gray-200">{selectedPlanDetail.kitchenId || 'Standard'}</span>
                            </div>
                            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg shadow-sm">
                                <span className="text-xs text-gray-400 block mb-1">Coordinator User ID</span>
                                <span className="font-medium text-gray-200">{selectedPlanDetail.coordinatorUserId || 'Auto-Assigned'}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-400">Error loading plan configuration.</div>
                )}
            </Drawer>
        </div>
    );
};
