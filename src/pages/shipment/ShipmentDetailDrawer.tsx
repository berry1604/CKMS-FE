import {
    Truck, Package, MapPin, User, Phone,
    Calendar, Clock, AlertCircle, CheckCircle2,
    ArrowRight, X, Printer, Trash2, Info
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/classNames';
import type { ShipmentResponse } from '../../types/shipment';

interface ShipmentDetailDrawerProps {
    shipment: ShipmentResponse | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusAction: (id: number, action: 'prepare' | 'transit' | 'confirm' | 'cancel', data?: any) => void;
}

export const ShipmentDetailDrawer = ({
    shipment,
    isOpen,
    onClose,
    onStatusAction
}: ShipmentDetailDrawerProps) => {
    if (!shipment) return null;

    const steps = [
        { id: 'PENDING', label: 'MỚI TẠO', icon: Package, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { id: 'PREPARED', label: 'ĐÃ CHUẨN BỊ', icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { id: 'IN_TRANSIT', label: 'ĐANG GIAO', icon: Truck, color: 'text-primary-500', bg: 'bg-primary-500/10' },
        { id: 'DELIVERED', label: 'ĐÃ GIAO', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === shipment.status);
    const isCancelled = shipment.status === 'CANCELLED';

    const renderActionButtons = () => {
        if (isCancelled) return null;

        switch (shipment.status) {
            case 'PENDING':
                return (
                    <Button
                        onClick={() => onStatusAction(shipment.shipmentId, 'prepare')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[11px] tracking-widest px-8 grow"
                    >
                        Xác nhận chuẩn bị hàng
                    </Button>
                );
            case 'PREPARED':
                return (
                    <Button
                        onClick={() => onStatusAction(shipment.shipmentId, 'transit')}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-black uppercase text-[11px] tracking-widest px-8 grow"
                    >
                        Xác nhận xuất kho & Giao
                    </Button>
                );
            case 'IN_TRANSIT':
                return (
                    <Button
                        onClick={() => onStatusAction(shipment.shipmentId, 'confirm')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[11px] tracking-widest px-8 grow"
                    >
                        Xác nhận đã giao hàng
                    </Button>
                );
            default:
                return null;
        }
    };

    const footer = (
        <div className="flex items-center gap-4 w-full px-2">
            {!isCancelled && shipment.status !== 'DELIVERED' && (
                <Button
                    variant="ghost"
                    onClick={() => onStatusAction(shipment.shipmentId, 'cancel')}
                    className="text-red-500 hover:bg-red-500/10 font-black uppercase text-[11px] tracking-widest border border-red-500/20"
                >
                    <Trash2 size={16} className="mr-2" /> Hủy bỏ
                </Button>
            )}
            <div className="flex-1"></div>
            {renderActionButtons()}
            <Button variant="outline" onClick={onClose} className="border-zinc-800 text-zinc-400 font-black uppercase text-[11px] tracking-widest">
                Đóng
            </Button>
        </div>
    );

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Truck size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-zinc-100 uppercase tracking-tighter">Vận đơn #{shipment.shipmentId}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Trạng thái:</span>
                            <Badge variant={isCancelled ? 'danger' : 'success'} className="text-[9px] px-1.5 py-0 h-4 border-0">{shipment.status}</Badge>
                        </div>
                    </div>
                </div>
            }
            width="max-w-2xl"
            footer={footer}
        >
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
                {/* Progress Tracker */}
                {!isCancelled && (
                    <div className="relative pt-4 pb-8">
                        <div className="absolute top-[52px] left-0 right-0 h-[2px] bg-zinc-800"></div>
                        <div
                            className="absolute top-[52px] left-0 h-[2px] bg-amber-500 transition-all duration-700"
                            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                        ></div>
                        <div className="relative flex justify-between">
                            {steps.map((step, idx) => {
                                const isActive = idx <= currentStepIndex;
                                const isCurrent = idx === currentStepIndex;
                                const StepIcon = step.icon;

                                return (
                                    <div key={step.id} className="flex flex-col items-center gap-4 relative z-10">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                                            isActive
                                                ? "bg-zinc-950 border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                                                : "bg-zinc-950 border-zinc-800 text-zinc-700"
                                        )}>
                                            <StepIcon size={20} strokeWidth={isActive ? 3 : 2} />
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className={cn(
                                                "text-[9px] font-black tracking-widest uppercase transition-colors",
                                                isActive ? "text-zinc-200" : "text-zinc-700"
                                            )}>
                                                {step.label}
                                            </span>
                                            {isCurrent && (
                                                <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-amber-500 animate-pulse"></div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-zinc-900/40 p-5 rounded-[24px] border border-zinc-800/50 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <User size={12} />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Người vận chuyển</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[15px] font-black text-zinc-200 tracking-tight">{shipment.driverName || 'N/A'}</p>
                            <p className="text-xs font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-tighter">
                                <Phone size={10} className="text-zinc-600" /> {shipment.driverPhone || 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-zinc-900/40 p-5 rounded-[24px] border border-zinc-800/50 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <Truck size={12} />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Phương tiện</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[15px] font-black text-zinc-200 tracking-tight uppercase">{shipment.vehicleInfo || 'N/A'}</p>
                            <p className="text-xs font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-tighter">
                                <Info size={10} className="text-zinc-600" /> Biển số / Loại xe
                            </p>
                        </div>
                    </div>
                </div>

                {/* Timeline & Notes */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Nhật ký vận hành</h3>
                    <div className="bg-zinc-900/40 rounded-[28px] border border-zinc-800/50 overflow-hidden">
                        <div className="p-6 space-y-6">
                            <div className="flex items-start gap-5">
                                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg mt-1">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <p className="text-[13px] font-black text-zinc-200 uppercase tracking-tight">Khởi tạo đơn hàng</p>
                                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-tighter mt-0.5">
                                        {new Date(shipment.createdAt).toLocaleString('vi-VN')} — Bởi {shipment.createdByUsername || 'Hệ thống'}
                                    </p>
                                </div>
                            </div>

                            {shipment.shippedAt && (
                                <div className="flex items-start gap-5">
                                    <div className="p-2 bg-primary-500/10 text-primary-500 rounded-lg mt-1">
                                        <Truck size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-black text-zinc-200 uppercase tracking-tight">Bắt đầu vận chuyển</p>
                                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-tighter mt-0.5">
                                            {new Date(shipment.shippedAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {shipment.deliveredAt && (
                                <div className="flex items-start gap-5">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg mt-1">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-black text-zinc-200 uppercase tracking-tight">Hoàn tất giao hàng</p>
                                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-tighter mt-0.5">
                                            {new Date(shipment.deliveredAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {shipment.note && (
                            <div className="bg-amber-500/5 p-6 border-t border-amber-500/10 flex items-start gap-4">
                                <InfoIcon size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Ghi chú từ Coordinator</span>
                                    <p className="text-[11px] text-zinc-400 font-medium italic leading-relaxed">{shipment.note}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Print / Share */}
                <div className="flex items-center justify-between p-6 bg-zinc-950 border border-zinc-800 rounded-[24px]">
                    <div className="flex items-center gap-3">
                        <Printer size={18} className="text-zinc-600" />
                        <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">In phiếu xuất kho / Vận đơn</span>
                    </div>
                    <Button variant="ghost" className="h-10 px-5 text-indigo-400 font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500/5 bg-transparent border border-indigo-500/20">
                        In phiếu (.PDF)
                    </Button>
                </div>
            </div>
        </Drawer>
    );
};

const InfoIcon = Info;
