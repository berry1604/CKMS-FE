import {
    Truck, Package, User, Phone,
    Calendar, Clock, CheckCircle2,
    Printer, Trash2, Info, Plus, ExternalLink
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
        { id: 'IN_TRANSIT', label: 'ĐANG GIAO', icon: Truck, color: 'text-[#DE802B]', bg: 'bg-[#DE802B]/10' },
        { id: 'DELIVERED', label: 'ĐÃ GIAO', icon: CheckCircle2, color: 'text-[#5C6F2B]', bg: 'bg-[#5C6F2B]/10' }
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
                        className="bg-[#DE802B] hover:bg-[#c97327] text-black font-black uppercase text-[11px] tracking-widest px-8 grow shadow-xl shadow-[#DE802B]/20"
                    >
                        Xác nhận xuất kho & Giao
                    </Button>
                );
            case 'IN_TRANSIT':
                return (
                    <Button
                        onClick={() => onStatusAction(shipment.shipmentId, 'confirm')}
                        className="bg-[#5C6F2B] hover:bg-[#4d5c24] text-black font-black uppercase text-[11px] tracking-widest px-8 grow shadow-xl shadow-[#5C6F2B]/20"
                    >
                        Xác nhận đã giao hàng
                    </Button>
                );
            default:
                return (
                    <Button
                        disabled
                        className="bg-zinc-800 text-zinc-500 font-black uppercase text-[11px] tracking-widest px-8 grow border border-zinc-700"
                    >
                        {shipment.status === 'DELIVERED' ? 'Đã hoàn thành' : 'Không có hành động'}
                    </Button>
                );
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
                    <div className="w-10 h-10 rounded-xl bg-[#DE802B]/10 flex items-center justify-center text-[#DE802B]">
                        <Truck size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-zinc-100 uppercase tracking-tighter">Vận đơn #{shipment.shipmentId}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AhaMove:</span>
                            {shipment.ahamoveOrderId ? (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 border-zinc-700 bg-zinc-800 text-zinc-300 font-mono tracking-tighter">
                                    {shipment.ahamoveOrderId}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 border-zinc-800 bg-zinc-900 text-zinc-600 font-mono tracking-tighter italic">
                                    N/A
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            }
            width="max-w-5xl"
            footer={footer}
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 py-2 animate-in slide-in-from-right duration-500">
                {/* Left Column: Visual & Status */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-[40px] p-8 space-y-8 overflow-hidden relative group/sidebar">
                        {/* Luxury Visual Element */}
                        <div className="relative -mx-8 -mt-8 mb-8 group/img h-64 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/90 z-10"></div>
                            <div className="absolute inset-0 bg-[#DE802B]/10 blur-3xl rounded-full scale-150 group-hover/img:bg-[#DE802B]/20 transition-all duration-700"></div>
                            <img 
                                src="/src/assets/logistics_delivery.png" 
                                alt="Logistics Delivery" 
                                className="w-full h-full object-cover opacity-60 group-hover/img:opacity-100 group-hover/img:scale-110 transition-all duration-1000 grayscale group-hover/img:grayscale-0 sepia-[.3]"
                                onError={(e) => {
                                    // Fallback if image doesn't exist
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            <div className="absolute bottom-6 left-8 z-20">
                                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-[#DE802B]/30 shadow-lg shadow-[#DE802B]/10">
                                    <div className="w-2 h-2 rounded-full bg-[#DE802B] animate-pulse"></div>
                                    <span className="text-[10px] font-black text-[#DE802B] uppercase tracking-[0.2em]">AhaMove Partner</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Summary */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="orange"
                                        className="h-5 text-[9px] font-black border-0 tracking-widest uppercase bg-[#DE802B]/20 text-[#DE802B]"
                                    >
                                        DELIVERY_STATE
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center border border-zinc-800 bg-zinc-900 transition-colors",
                                        isCancelled ? "text-red-500" : "text-[#DE802B]"
                                    )}>
                                        <Truck size={24} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">CKMS Status</span>
                                        <Badge variant={isCancelled ? 'danger' : 'success'} className="text-[11px] px-3 py-0.5 h-6 border-0 font-black uppercase tracking-tight">
                                            {shipment.status}
                                        </Badge>
                                    </div>
                                    <div className="w-px h-8 bg-zinc-800 mx-2"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">AhaMove Status</span>
                                        {shipment.ahamoveStatus ? (
                                           <span className="text-xs font-black text-[#DE802B] uppercase tracking-tighter mt-1">{shipment.ahamoveStatus}</span>
                                        ) : (
                                            <span className="text-xs font-black text-zinc-600 uppercase tracking-tighter mt-1 italic">WAITING...</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-zinc-800/50"></div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar size={14} /> Ngày khởi tạo
                                        </span>
                                        <span className="text-sm font-black text-zinc-200 tracking-tight mt-1 truncate">
                                            {new Date(shipment.createdAt).toLocaleDateString("vi-VN")}
                                        </span>
                                    </div>
                                    {shipment.trackingLink && (
                                        <a
                                            href={shipment.trackingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-3 bg-[#DE802B] hover:bg-[#c97327] text-black rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-[#DE802B]/20 transition-all hover:scale-105 active:scale-95"
                                        >
                                            <ExternalLink size={14} /> Tracking Link
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logistics Specs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-zinc-900/40 rounded-[32px] border border-zinc-800/50 space-y-3 group/spec transition-colors hover:border-[#DE802B]/30">
                            <div className="flex items-center gap-2">
                                <User size={14} className="text-zinc-600 group-hover/spec:text-[#DE802B] transition-colors" />
                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Tài xế</span>
                            </div>
                            <span className="text-[13px] font-black text-zinc-300 uppercase truncate block min-h-[1.5rem]">
                                {shipment.driverName || 'Đang tìm tài xế...'}
                            </span>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <Phone size={10} className="text-zinc-500" />
                                <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-tighter italic">
                                    {shipment.driverPhone || 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div className="p-6 bg-zinc-900/40 rounded-[32px] border border-zinc-800/50 space-y-3 group/spec transition-colors hover:border-[#DE802B]/30">
                            <div className="flex items-center gap-2">
                                <Truck size={14} className="text-zinc-600 group-hover/spec:text-[#DE802B] transition-colors" />
                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Biển số xe</span>
                            </div>
                            <span className="text-[13px] font-black text-zinc-300 uppercase truncate block min-h-[1.5rem]">
                                {shipment.vehicleInfo || 'N/A'}
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className={cn(
                                        "h-full transition-all duration-1000",
                                        shipment.driverName ? "w-[85%] bg-gradient-to-r from-[#DE802B] to-[#5C6F2B]" : "w-[30%] bg-zinc-700"
                                    )}></div>
                                </div>
                                <span className={cn(
                                    "text-[9px] font-black",
                                    shipment.driverName ? "text-[#5C6F2B]" : "text-zinc-600 italic"
                                )}>
                                    {shipment.driverName ? 'FOUND' : 'SEARCHING'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Progress & Timeline */}
                <div className="lg:col-span-7 space-y-10">
                    {/* Progress Tracker */}
                    {!isCancelled && (
                        <div className="bg-zinc-900/20 backdrop-blur-sm rounded-[40px] border border-zinc-800/50 p-10 space-y-10">
                            <div className="flex items-center gap-3 ml-2">
                                <Package size={18} className="text-[#DE802B]/50" />
                                <h4 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">
                                    Tiến trình vận đơn CKMS
                                </h4>
                            </div>
                            
                            <div className="relative">
                                <div className="absolute top-[26px] left-[24px] right-[24px] h-[3px] bg-zinc-800/50 rounded-full"></div>
                                <div
                                    className="absolute top-[26px] left-[24px] h-[3px] bg-gradient-to-r from-[#DE802B] to-[#5C6F2B] rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(222,128,43,0.3)]"
                                    style={{ width: `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 48px)` }}
                                ></div>
                                <div className="relative flex justify-between">
                                    {steps.map((step, idx) => {
                                        const isActive = idx <= currentStepIndex;
                                        const isCurrent = idx === currentStepIndex;
                                        const StepIcon = step.icon;

                                        return (
                                            <div key={step.id} className="flex flex-col items-center gap-5 relative z-10 group/step">
                                                <div className={cn(
                                                    "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 bg-zinc-950",
                                                    isActive
                                                        ? "border-[#DE802B] text-[#DE802B] shadow-[0_0_25px_rgba(222,128,43,0.15)] bg-zinc-900"
                                                        : "border-zinc-800/50 text-zinc-700 hover:border-zinc-700"
                                                )}>
                                                    <StepIcon size={22} strokeWidth={isActive ? 3 : 2} className={cn(isActive && "animate-pulse-slow")} />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className={cn(
                                                        "text-[10px] font-black tracking-widest uppercase transition-colors whitespace-nowrap",
                                                        isActive ? "text-zinc-200" : "text-zinc-700"
                                                    )}>
                                                        {step.label}
                                                    </span>
                                                    {isCurrent && (
                                                        <div className="mt-2 h-1.5 w-1.5 rounded-full bg-[#DE802B] shadow-[0_0_10px_rgba(222,128,43,0.8)] animate-pulse"></div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Operational Logs */}
                    <div className="space-y-5">
                        <div className="flex items-center justify-between ml-2">
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-zinc-600" />
                                <h4 className="text-[12px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                    Nhật ký vận hành
                                </h4>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#DE802B]/10 border border-[#DE802B]/20 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#DE802B] animate-pulse"></div>
                                <span className="text-[9px] font-black text-[#DE802B] uppercase tracking-widest">Live Log</span>
                            </div>
                        </div>

                        <div className="bg-zinc-900/20 rounded-[36px] border border-zinc-800/50 divide-y divide-zinc-800/30 overflow-hidden">
                            <div className="p-8 space-y-8">
                                <div className="flex items-start gap-6 group/log animate-in fade-in duration-500">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover/log:text-[#5C6F2B] group-hover/log:border-[#5C6F2B]/30 transition-all">
                                        <Plus size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[14px] font-black text-zinc-200 tracking-tight uppercase group-hover/log:text-white transition-colors">Khởi tạo đơn hàng CKMS</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                                                {new Date(shipment.createdAt).toLocaleString('vi-VN')}
                                            </span>
                                            <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                                            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest blur-[0.2px]">
                                                By {shipment.createdByUsername || 'Hệ thống'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {shipment.shippedAt && (
                                    <div className="flex items-start gap-6 group/log animate-in slide-in-from-left duration-500">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover/log:text-[#DE802B] group-hover/log:border-[#DE802B]/30 transition-all">
                                            <Truck size={18} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[14px] font-black text-zinc-200 tracking-tight uppercase">Bắt đầu vận chuyển</p>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                                                {new Date(shipment.shippedAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {shipment.deliveredAt && (
                                    <div className="flex items-start gap-6 group/log animate-in slide-in-from-left duration-500">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover/log:text-[#5C6F2B] group-hover/log:border-[#5C6F2B]/30 transition-all">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[14px] font-black text-zinc-200 tracking-tight uppercase">Hoàn tất giao hàng</p>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                                                {new Date(shipment.deliveredAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {(shipment.remarks || (shipment as any).note) && (
                                <div className="bg-[#DE802B]/[0.03] p-8 border-t border-[#DE802B]/10 flex items-start gap-5">
                                    <div className="w-10 h-10 rounded-xl bg-[#DE802B]/10 border border-[#DE802B]/20 flex items-center justify-center text-[#DE802B]">
                                        <Info size={18} />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black text-[#DE802B] uppercase tracking-[0.2em] block">Ghi chú Shipment</span>
                                        <p className="text-[11px] text-zinc-400 font-medium italic leading-relaxed text-balance">"{shipment.remarks || (shipment as any).note}"</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Panel */}
                    <div className="relative group/panel overflow-hidden p-8 bg-zinc-950 border border-zinc-800 rounded-[36px] transition-all duration-500 hover:border-[#DE802B]/20 shadow-2xl">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#DE802B]/[0.03] blur-[80px] rounded-full transform translate-x-20 -translate-y-20 group-hover/panel:scale-150 transition-transform duration-1000"></div>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[24px] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover/panel:text-[#DE802B] group-hover/panel:border-[#DE802B]/30 group-hover/panel:bg-[#DE802B]/5 transition-all duration-500">
                                    <Printer size={28} />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px] font-black text-white uppercase tracking-tight">Cước bổ sung AhaMove</span>
                                        <Badge variant="orange" className="h-4 text-[7px] px-1.5 uppercase font-black bg-[#DE802B]/20 text-[#DE802B] border-0">AhaMove Bill</Badge>
                                    </div>
                                    <span className="text-xs text-zinc-500 font-medium mt-1.5 max-w-[200px] leading-relaxed italic">
                                        {(shipment as any).shippingFee ? `VND ${(shipment as any).shippingFee.toLocaleString()}` : 'Khoản phí sẽ được cập nhật tự động.'}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="h-14 px-10 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-black uppercase tracking-[0.2em] rounded-[22px] hover:bg-[#DE802B] hover:text-black hover:border-transparent transition-all duration-500 shadow-xl hover:shadow-[#DE802B]/20 pointer-events-none opacity-50"
                            >
                                Not Available
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    );
};

