import { MapPin, Calendar, Truck, User, Phone, FileText, CheckCircle, Navigation } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { type Shipment } from './ShipmentList';

interface ShipmentDetailDrawerProps {
    shipment: Shipment | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusUpdate?: (id: string, status: Shipment['status']) => void;
}

export const ShipmentDetailDrawer = ({ shipment, isOpen, onClose, onStatusUpdate }: ShipmentDetailDrawerProps) => {
    if (!shipment) return null;

    const getStatusBadge = (status: Shipment['status']) => {
        const colors = {
            scheduled: 'info',
            in_transit: 'primary',
            delivered: 'success',
            delayed: 'danger'
        } as const;
        return <Badge variant={colors[status]}>{status.replace('_', ' ').toUpperCase()}</Badge>;
    };

    const footer = (
        <div className="flex justify-between w-full">
            <div className="flex gap-2">
                <Button variant="outline" size="sm">
                    <FileText size={16} className="mr-2" /> Manifest
                </Button>
                <Button variant="outline" size="sm">
                    <Phone size={16} className="mr-2" /> Contact Driver
                </Button>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
                {shipment.status === 'scheduled' && onStatusUpdate && (
                    <Button
                        onClick={() => onStatusUpdate(shipment.id, 'in_transit')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Truck size={16} className="mr-2" /> Start Shipment
                    </Button>
                )}
                {shipment.status === 'in_transit' && onStatusUpdate && (
                    <Button
                        onClick={() => onStatusUpdate(shipment.id, 'delivered')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <CheckCircle size={16} className="mr-2" /> Mark Delivered
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Tracking Details"
            description={`Shipment #${shipment.id}`}
            width="max-w-3xl"
            footer={footer}
        >
            <div className="space-y-6">
                {/* Status & ETA Header */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl text-gray-900">{shipment.status.replace('_', ' ').toUpperCase()}</h3>
                            {getStatusBadge(shipment.status)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <Calendar size={16} className="mr-2 text-gray-400" />
                            <span>ETA: <span className="font-semibold text-gray-900">{shipment.eta}</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">{shipment.driver}</p>
                            <p className="text-xs text-gray-500">{shipment.vehicle}</p>
                        </div>
                    </div>
                </div>

                {/* Route Visual */}
                <Card className="p-6 border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Navigation size={120} />
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                        <div className="text-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 ring-4 ring-green-100"></div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Origin</p>
                            <p className="font-bold text-gray-900 text-lg">{shipment.origin}</p>
                        </div>
                        <div className="flex-1 px-4 self-center pb-6">
                            <div className="h-1 bg-gray-200 rounded-full relative">
                                <div
                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${shipment.status === 'delivered' ? 'w-full bg-green-500' :
                                        shipment.status === 'in_transit' ? 'w-1/2 bg-blue-500' : 'w-0'
                                        }`}
                                ></div>
                                {shipment.status === 'in_transit' && (
                                    <div className="absolute left-1/2 -top-1.5 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-sm transform -translate-x-1/2"></div>
                                )}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-2 ring-4 ring-red-100"></div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Destination</p>
                            <p className="font-bold text-gray-900 text-lg">{shipment.destination}</p>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Timeline */}
                    <div className="lg:col-span-2">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                            <Truck size={18} className="mr-2 text-gray-500" /> Shipment Updates
                        </h4>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 relative">
                            <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-gray-100"></div>
                            <div className="space-y-8 relative">
                                {shipment.updates?.map((update, idx) => (
                                    <div key={idx} className="flex gap-4 relative">
                                        <div className={`shrink-0 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 
                                            ${idx === 0 ? 'bg-blue-600 ring-4 ring-blue-50' : 'bg-gray-400'}`}>
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                        <div className="pt-0.5">
                                            <p className="font-bold text-gray-900 text-sm">{update.details}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{update.timestamp}</span>
                                                <span className="text-xs text-gray-500 flex items-center">
                                                    <MapPin size={10} className="mr-0.5" /> {update.location}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!shipment.updates || shipment.updates.length === 0) && (
                                    <p className="text-sm text-gray-500 italic pl-10">No tracking updates available yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order List */}
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                            <FileText size={18} className="mr-2 text-gray-500" /> Content
                        </h4>
                        <Card className="border-gray-200 shadow-sm p-0 overflow-hidden">
                            <div className="divide-y divide-gray-100">
                                {shipment.orderIds.map(id => (
                                    <div key={id} className="p-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors">
                                        <div className="p-1.5 bg-green-50 text-green-600 rounded">
                                            <CheckCircle size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Order #{id}</p>
                                            <p className="text-xs text-gray-500">Ready for delivery</p>
                                        </div>
                                    </div>
                                ))}
                                {shipment.orderIds.length === 0 && (
                                    <div className="p-4 text-center text-sm text-gray-500">No specific orders linked.</div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </Drawer>
    );
};
