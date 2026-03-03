import { Truck, CheckCircle, XCircle, Package, Clock, User, Phone, Car } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import type { ShipmentResponse } from '../../types/shipment';

interface ShipmentDetailDrawerProps {
    shipment: ShipmentResponse | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusAction?: (id: number, action: 'prepare' | 'transit' | 'confirm' | 'cancel') => void;
}

export const ShipmentDetailDrawer = ({ shipment, isOpen, onClose, onStatusAction }: ShipmentDetailDrawerProps) => {
    if (!shipment) return null;

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
        return <Badge variant={colors[status] || 'default'} className="text-sm px-3 py-1">{labels[status] || status.replace('_', ' ')}</Badge>;
    };

    const steps = [
        { key: 'PENDING', label: 'Chờ xử lý', icon: Clock, time: shipment.createdAt },
        { key: 'PREPARED', label: 'Đã chuẩn bị', icon: Package, time: undefined },
        { key: 'IN_TRANSIT', label: 'Đang giao', icon: Truck, time: shipment.shippedAt },
        { key: 'DELIVERED', label: 'Đã giao', icon: CheckCircle, time: shipment.deliveredAt },
    ];
    const statusOrder = ['PENDING', 'PREPARED', 'IN_TRANSIT', 'DELIVERED'];
    const currentIdx = statusOrder.indexOf(shipment.status);

    const footer = (
        <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClose}>Đóng</Button>
            <div className="flex gap-2">
                {shipment.status === 'PENDING' && onStatusAction && (
                    <>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => onStatusAction(shipment.shipmentId, 'cancel')}
                        >
                            <XCircle size={16} className="mr-2" /> Hủy Đơn
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => onStatusAction(shipment.shipmentId, 'prepare')}
                        >
                            <Package size={16} className="mr-2" /> Đã Chuẩn Bị
                        </Button>
                    </>
                )}
                {shipment.status === 'PREPARED' && onStatusAction && (
                    <>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => onStatusAction(shipment.shipmentId, 'cancel')}
                        >
                            <XCircle size={16} className="mr-2" /> Hủy Đơn
                        </Button>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => onStatusAction(shipment.shipmentId, 'transit')}
                        >
                            <Truck size={16} className="mr-2" /> Bắt Đầu Giao
                        </Button>
                    </>
                )}
                {shipment.status === 'IN_TRANSIT' && onStatusAction && (
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onStatusAction(shipment.shipmentId, 'confirm')}
                    >
                        <CheckCircle size={16} className="mr-2" /> Xác Nhận Đã Giao
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={`Đơn Vận Chuyển #${shipment.shipmentId}`}
            description={`${shipment.storeName || `Cửa hàng #${shipment.storeId}`} • Tạo ngày ${new Date(shipment.createdAt).toLocaleDateString('vi-VN')}`}
            width="max-w-3xl"
            footer={footer}
        >
            <div className="space-y-6">
                {/* Status & Info Header */}
                <div className="bg-zinc-900/80 rounded-xl p-6 border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Trạng thái</p>
                        {getStatusBadge(shipment.status)}
                    </div>
                    {shipment.shippingFee != null && shipment.shippingFee > 0 && (
                        <div className="text-right">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Cước phí</p>
                            <p className="text-lg font-bold text-gray-200">{shipment.shippingFee.toLocaleString('vi-VN')}₫</p>
                        </div>
                    )}
                </div>

                {/* Driver Info */}
                {(shipment.driverName || shipment.driverPhone || shipment.vehicleInfo) && (
                    <Card className="p-4 border-zinc-700">
                        <h4 className="text-sm font-medium text-gray-200 mb-3">Thông Tin Tài Xế</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            {shipment.driverName && (
                                <div className="flex items-center gap-2">
                                    <User size={14} className="text-gray-500" />
                                    <span className="text-gray-300">{shipment.driverName}</span>
                                </div>
                            )}
                            {shipment.driverPhone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-500" />
                                    <span className="text-gray-300">{shipment.driverPhone}</span>
                                </div>
                            )}
                            {shipment.vehicleInfo && (
                                <div className="flex items-center gap-2">
                                    <Car size={14} className="text-gray-500" />
                                    <span className="text-gray-300">{shipment.vehicleInfo}</span>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Progress Steps */}
                {shipment.status !== 'CANCELLED' ? (
                    <Card className="p-6 border-zinc-700 shadow-sm">
                        <div className="relative">
                            <div className="overflow-hidden h-2 mb-6 flex rounded-full bg-zinc-800">
                                <div
                                    style={{ width: `${((currentIdx + 1) / steps.length) * 100}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-600 transition-all duration-500"
                                />
                            </div>
                            <div className="flex justify-between text-xs font-medium text-gray-400">
                                {steps.map((step, idx) => {
                                    const Icon = step.icon;
                                    const isActive = idx <= currentIdx;
                                    return (
                                        <div key={step.key} className={`flex flex-col items-center gap-2 ${isActive ? 'text-amber-500' : ''}`}>
                                            <div className={`p-2 rounded-full ${isActive ? 'bg-amber-500/10' : 'bg-zinc-800'}`}>
                                                <Icon size={16} />
                                            </div>
                                            <span>{step.label}</span>
                                            {step.time && (
                                                <span className="text-[10px] text-gray-500">{new Date(step.time).toLocaleString('vi-VN')}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/20 text-center space-y-2">
                        <XCircle className="mx-auto text-red-500" size={32} />
                        <p className="text-red-400 font-semibold">Đơn vận chuyển đã bị hủy</p>
                    </div>
                )}

                {/* Note */}
                {shipment.note && (
                    <Card className="p-4 border-zinc-700">
                        <h4 className="text-sm font-medium text-gray-200 mb-2">Ghi chú</h4>
                        <p className="text-sm text-gray-400">{shipment.note}</p>
                    </Card>
                )}

                {/* Order IDs */}
                <Card className="border-zinc-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
                        <h3 className="font-semibold text-gray-200">Đơn Hàng Bao Gồm</h3>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {shipment.storeOrderIds?.map(orderId => (
                            <div key={orderId} className="px-6 py-3 flex items-center gap-3 hover:bg-zinc-900/50 transition-colors">
                                <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded">
                                    <Package size={16} />
                                </div>
                                <span className="text-sm font-medium text-gray-200">Đơn hàng #{orderId}</span>
                            </div>
                        ))}
                        {(!shipment.storeOrderIds || shipment.storeOrderIds.length === 0) && (
                            <div className="px-6 py-8 text-center text-sm text-gray-400">Không có đơn hàng nào</div>
                        )}
                    </div>
                </Card>

                {/* Timeline */}
                <Card className="p-4 border-zinc-700">
                    <h4 className="text-sm font-medium text-gray-200 mb-3">Lịch Sử Trạng Thái</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Thời gian tạo</span>
                            <span className="font-medium text-gray-200">{new Date(shipment.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                        {shipment.createdByUsername && (
                            <div className="flex justify-between">
                                <span className="text-gray-400">Người tạo</span>
                                <span className="font-medium text-gray-200">{shipment.createdByUsername}</span>
                            </div>
                        )}
                        {shipment.shippedAt && (
                            <div className="flex justify-between">
                                <span className="text-gray-400">Bắt đầu giao</span>
                                <span className="font-medium text-gray-200">{new Date(shipment.shippedAt).toLocaleString('vi-VN')}</span>
                            </div>
                        )}
                        {shipment.deliveredAt && (
                            <div className="flex justify-between">
                                <span className="text-gray-400">Đã giao tận nơi</span>
                                <span className="font-medium text-green-400">{new Date(shipment.deliveredAt).toLocaleString('vi-VN')}</span>
                            </div>
                        )}
                        {shipment.confirmedByUsername && (
                            <div className="flex justify-between">
                                <span className="text-gray-400">Người xác nhận</span>
                                <span className="font-medium text-gray-200">{shipment.confirmedByUsername}</span>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </Drawer>
    );
};
