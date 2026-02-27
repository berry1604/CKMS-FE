import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, CheckCircle, Clock, PlayCircle, List, ChevronLeft, ChevronRight, Plus, Search, Filter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { DataTable, type Column } from '../../components/ui/DataTable';
export interface ProductionTask {
    id: string;
    productName: string;
    quantity: number;
    unit: string;
    dueDate: string;
    dueTime: string;
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo: string;
    orderId?: string;
    recipeId?: string;
}
import { Drawer } from '../../components/ui/Drawer';

export const ProductionSchedule = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<ProductionTask[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<ProductionTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedTask, setSelectedTask] = useState<ProductionTask | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ProductionTask['status']>('all');

    const handleCreateTask = async () => {
        navigate('/kitchen/create-task');
    };

    useEffect(() => {
        loadTasks();
    }, []);

    useEffect(() => {
        let result = tasks;

        // Search Filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.productName.toLowerCase().includes(lowerQuery) ||
                t.assignedTo.toLowerCase().includes(lowerQuery) ||
                (t.orderId && t.orderId.toLowerCase().includes(lowerQuery))
            );
        }

        // Status Filter
        if (statusFilter !== 'all') {
            result = result.filter(t => t.status === statusFilter);
        }

        setFilteredTasks(result);
    }, [searchQuery, statusFilter, tasks]);

    const loadTasks = async () => {
        setIsLoading(true);
        try {
            // Placeholder for GET /production-schedule API
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (taskId: string, newStatus: ProductionTask['status']) => {
        try {
            // Placeholder: Update status via API
            loadTasks();
            if (selectedTask && selectedTask.id === taskId) {
                setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const getStatusBadge = (status: ProductionTask['status']) => {
        const configs = {
            pending: { variant: 'warning', icon: Clock, label: 'Pending' },
            in_progress: { variant: 'info', icon: PlayCircle, label: 'In Progress' },
            completed: { variant: 'success', icon: CheckCircle, label: 'Completed' }
        } as const;
        const config = configs[status] || configs.pending; // Fallback
        const Icon = config.icon;

        return (
            <Badge variant={config.variant as any} className="flex items-center gap-1.5">
                <Icon size={12} />
                {config.label}
            </Badge>
        );
    };

    // List View Columns
    const columns: Column<ProductionTask>[] = [
        {
            header: 'Product Details',
            cell: (row) => (
                <div>
                    <h4 className="font-medium text-gray-900">{row.productName}</h4>
                    {row.orderId && <p className="text-xs text-gray-500">Ref: {row.orderId}</p>}
                </div>
            )
        },
        {
            header: 'Status',
            cell: (row) => getStatusBadge(row.status)
        },
        {
            header: 'Assigned To',
            accessorKey: 'assignedTo',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        {row.assignedTo.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700">{row.assignedTo}</span>
                </div>
            )
        },
        {
            header: 'Quantity',
            cell: (row) => <span className="font-medium">{row.quantity} {row.unit}</span>
        },
        {
            header: 'Due Date',
            accessorKey: 'dueDate',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="text-gray-900 font-medium">{row.dueDate}</span>
                    {row.dueTime && <span className="text-xs text-gray-500">{row.dueTime}</span>}
                </div>
            )
        },
        {
            header: 'Actions',
            cell: (row) => (
                <Button variant="ghost" size="sm" onClick={() => setSelectedTask(row)}>
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
            days.push(<div key={`empty-${i}`} className="min-h-[120px] border-b border-r border-gray-100 bg-white" />);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = tasks.filter(t => t.dueDate === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            days.push(
                <div key={day} className={`min-h-[120px] border-b border-r border-gray-100 p-1 relative group hover:bg-gray-50 transition-colors flex flex-col`}>
                    <div className="flex justify-center py-1 mb-1">
                        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                            {day}
                        </span>
                    </div>

                    <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-1">
                        {dayTasks.map(task => (
                            <button
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className={`w-full text-left px-2 py-1 rounded text-xs border border-transparent shadow-sm truncate
                                    ${task.status === 'completed' ? 'bg-green-600 text-white hover:bg-green-700' :
                                        task.status === 'in_progress' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                            'bg-amber-500 text-white hover:bg-amber-600'}`}
                            >
                                <span className="opacity-90 font-medium text-[10px] mr-1">{task.dueTime || 'All Day'}</span>
                                <span className="font-medium">{task.productName}</span>
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <Card className="rounded-xl shadow-sm border border-gray-200 overflow-hidden bg-white">
                {/* Calendar Toolbar */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-normal text-gray-800">
                            {currentDate.toLocaleString('default', { month: 'long' })} <span className="text-gray-500">{year}</span>
                        </h2>
                        <div className="flex items-center rounded-md border border-gray-200 shadow-sm bg-white">
                            <button
                                onClick={() => setCurrentDate(new Date(year, month - 1))}
                                className="p-1.5 hover:bg-gray-50 text-gray-600 border-r border-gray-200"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date(year, month + 1))}
                                className="p-1.5 hover:bg-gray-50 text-gray-600 border-l border-gray-200"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                    <div>
                        {/* Could add View Toggle (Month/Week/Day) here if needed */}
                    </div>
                </div>

                {/* Calendar Grid Header */}
                <div className="grid grid-cols-7 border-b border-gray-200">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid Body */}
                <div className="grid grid-cols-7 bg-white">
                    {days}
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Production Schedule</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage kitchen tasks and timelines.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <List size={16} /> List View
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <CalendarIcon size={16} /> Calendar
                        </button>
                    </div>
                    <Button
                        className="shrink-0 shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleCreateTask}
                    >
                        <Plus size={18} className="mr-2" /> Create Task
                    </Button>
                </div>
            </div>

            {/* List View Controls */}
            {viewMode === 'list' && (
                <Card className="border-0 shadow-sm ring-1 ring-gray-200">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-80">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search tasks, staff, or ID..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <Filter size={16} className="text-gray-400 mr-1" />
                            <span className="text-sm text-gray-500 mr-2">Status:</span>
                            {['all', 'pending', 'in_progress', 'completed'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status as any)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap
                                        ${statusFilter === status
                                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {status === 'all' ? 'All Tasks' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </button>
                            ))}
                        </div>
                    </div>
                    <DataTable
                        data={filteredTasks}
                        columns={columns}
                        isLoading={isLoading}
                        keyExtractor={item => item.id}
                    />
                </Card>
            )}

            {/* Calendar View */}
            {viewMode === 'calendar' && renderCalendar()}

            {/* Task Details Drawer */}
            <Drawer
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                title={selectedTask?.productName || 'Task Details'}
                description={selectedTask?.orderId ? `Order Ref: ${selectedTask.orderId}` : 'Production task details'}
                width="max-w-md"
                footer={
                    selectedTask && (
                        <div className="flex flex-col gap-3 w-full">
                            <h4 className="font-medium text-gray-900 text-sm">Update Status</h4>
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1"
                                    variant={selectedTask.status === 'pending' ? 'primary' : 'outline'}
                                    onClick={() => handleStatusUpdate(selectedTask.id, 'pending')}
                                    disabled={selectedTask.status === 'pending'}
                                >
                                    Pending
                                </Button>
                                <Button
                                    className="flex-1"
                                    variant={selectedTask.status === 'in_progress' ? 'primary' : 'outline'}
                                    onClick={() => handleStatusUpdate(selectedTask.id, 'in_progress')}
                                    disabled={selectedTask.status === 'in_progress'}
                                >
                                    In Progress
                                </Button>
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    variant={selectedTask.status === 'completed' ? 'primary' : 'outline'}
                                    onClick={() => handleStatusUpdate(selectedTask.id, 'completed')}
                                    disabled={selectedTask.status === 'completed'}
                                >
                                    Completed
                                </Button>
                            </div>
                        </div>
                    )
                }
            >
                {selectedTask && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Current Status</p>
                                    {getStatusBadge(selectedTask.status)}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Due Date</p>
                                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                                        <CalendarIcon size={16} className="text-gray-400" />
                                        <span>{selectedTask.dueDate}</span>
                                    </div>
                                    {selectedTask.dueTime && <p className="text-xs text-gray-500 mt-0.5">{selectedTask.dueTime}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="py-2 space-y-4">
                            <div className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                                <span className="text-sm text-gray-500">Target Quantity</span>
                                <span className="font-bold text-gray-900 text-lg">{selectedTask.quantity} <span className="text-sm font-normal text-gray-500">{selectedTask.unit}</span></span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                                <span className="text-sm text-gray-500">Assigned Staff</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                                        {selectedTask.assignedTo.charAt(0)}
                                    </div>
                                    <span className="font-medium text-gray-900">{selectedTask.assignedTo}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                                <span className="text-sm text-gray-500">Task ID</span>
                                <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{selectedTask.id}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>

        </div>
    );
};
