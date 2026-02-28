import { useEffect, useState } from 'react';
import { Truck, Search, Filter, Calendar, ArrowRight, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { DataTable, type Column } from '../../components/ui/DataTable';
export interface Shipment {
    id: string;
    origin: string;
    destination: string;
    driver: string;
    vehicle: string;
    status: 'scheduled' | 'in_transit' | 'delivered' | 'delayed';
    eta: string;
    orderIds: string[];
    updates?: { timestamp: string; location: string; details: string; }[];
}
import { ShipmentDetailDrawer } from './ShipmentDetailDrawer';

export const ShipmentList = () => {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Placeholder: Call API get shipments
            setShipments([]);
            setFilteredShipments([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let result = shipments;
        if (searchTerm) {
            const lowerQuery = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.id.toLowerCase().includes(lowerQuery) ||
                s.driver.toLowerCase().includes(lowerQuery) ||
                s.destination.toLowerCase().includes(lowerQuery)
            );
        }
        if (statusFilter !== 'all') {
            result = result.filter(s => s.status === statusFilter);
        }
        setFilteredShipments(result);
    }, [shipments, searchTerm, statusFilter]);

    const handleCreateShipment = async () => {
        // Placeholder for GET ready orders API
        const readyOrders: any[] = []; // response.data
        if (readyOrders.length === 0) {
            alert('No orders are ready for shipment (Status: Produced).');
            return;
        }

        const confirmMsg = `Found ${readyOrders.length} orders ready for shipping.\nCreate shipment for them?`;
        if (!confirm(confirmMsg)) return;

        setIsLoading(true);
        // const _orderIds = readyOrders.map(o => o.id);

        // Placeholder: Call API to create shipment
        // await createShipment(orderIds, ...);

        fetchData();
    };

    const handleStatusUpdate = async (id: string, status: Shipment['status']) => {
        // Placeholder: Call API update shipment status
        // await updateStatus(id, status);
        fetchData();
        if (selectedShipment && selectedShipment.id === id) {
            // Optimistic update for drawer
            setSelectedShipment(prev => prev ? { ...prev, status } : null);
        }
    };

    const columns: Column<Shipment>[] = [
        {
            header: 'Shipment ID',
            accessorKey: 'id',
            className: 'font-medium',
            cell: (s) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{s.id}</span>
                </div>
            )
        },
        {
            header: 'Route',
            cell: (s) => (
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">{s.origin}</span>
                    <ArrowRight size={14} className="text-gray-300" />
                    <span className="font-medium text-gray-200">{s.destination}</span>
                </div>
            )
        },
        {
            header: 'Driver / Vehicle',
            cell: (s) => (
                <div>
                    <p className="text-sm font-medium text-gray-200">{s.driver}</p>
                    <p className="text-xs text-gray-400">{s.vehicle}</p>
                </div>
            )
        },
        {
            header: 'ETA',
            accessorKey: 'eta',
            cell: (s) => (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={14} />
                    <span>{s.eta}</span>
                </div>
            )
        },
        {
            header: 'Status',
            cell: (s) => {
                const colors = {
                    scheduled: 'info',
                    in_transit: 'primary',
                    delivered: 'success',
                    delayed: 'danger'
                } as const;
                return <Badge variant={colors[s.status] || 'default'}>{s.status.replace('_', ' ').toUpperCase()}</Badge>;
            }
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Shipment Tracking</h1>
                    <p className="text-sm text-gray-400 mt-1">Monitor logistics, update statuses, and track deliveries.</p>
                </div>
                <Button onClick={handleCreateShipment} className="shrink-0 bg-amber-600 hover:bg-blue-700 text-white shadow-sm">
                    <Truck className="mr-2 h-4 w-4" /> Schedule Shipment
                </Button>
            </div>

            <Card className="border-0 shadow-sm ring-1 ring-zinc-700">
                <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search by ID, driver, destination..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Filter size={16} className="text-gray-400 mr-1" />
                        <span className="text-sm text-gray-400 mr-2">Status:</span>
                        {['all', 'scheduled', 'in_transit', 'delivered', 'delayed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap
                                    ${statusFilter === status
                                        ? 'bg-amber-500/10 border-blue-200 text-amber-500'
                                        : 'bg-zinc-900/50 border-zinc-700 text-gray-400 hover:bg-zinc-900/80'}`}
                            >
                                {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <DataTable
                    data={filteredShipments}
                    columns={columns}
                    isLoading={isLoading}
                    keyExtractor={s => s.id}
                />
            </Card>

            <ShipmentDetailDrawer
                shipment={selectedShipment}
                isOpen={!!selectedShipment}
                onClose={() => setSelectedShipment(null)}
                onStatusUpdate={handleStatusUpdate}
            />
        </div>
    );
};
