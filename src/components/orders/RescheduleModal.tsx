import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, X, AlertTriangle, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { storeOrderApi } from '../../services/storeOrderApi';
import { kitchenApi } from '../../services/kitchen.api';
import { dispatchApi } from '../../services/dispatch.api';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/classNames';
import type { KitchenResponse } from '../../types/kitchen';

interface RescheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: number | string;
    currentDeliveryDate: string;
    totalQuantity: number;
    onSuccess: (newDate: string) => void;
}

export const RescheduleModal = ({
    isOpen,
    onClose,
    orderId,
    currentDeliveryDate,
    totalQuantity,
    onSuccess
}: RescheduleModalProps) => {
    const [selectedDate, setSelectedDate] = useState<string>(currentDeliveryDate);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [capacityStatus, setCapacityStatus] = useState<'safe' | 'warning' | 'full' | 'checking'>('checking');
    const [capacityInfo, setCapacityInfo] = useState<string>('');

    const [kitchens, setKitchens] = useState<KitchenResponse[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Initial kitchen fetch
    useEffect(() => {
        if (!isOpen) return;
        const fetchKitchens = async () => {
            try {
                const res = await kitchenApi.getAllKitchens();
                setKitchens(res.data || []);
            } catch (err) {
                console.error('Failed to fetch kitchens:', err);
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchKitchens();
    }, [isOpen]);

    // Real capacity check
    useEffect(() => {
        if (!isOpen || isInitialLoading || kitchens.length === 0) return;
        
        const checkCapacity = async () => {
            setCapacityStatus('checking');
            
            try {
                let totalRemaining = 0;
                
                // Aggregate remaining capacity across all kitchens for this HQ view
                await Promise.all(kitchens.map(async (kitchen: KitchenResponse) => {
                    try {
                        const suggestRes = await dispatchApi.getSuggestion(kitchen.kitchenId, selectedDate);
                        const suggestions = suggestRes.data || [];
                        if (Array.isArray(suggestions) && suggestions.length > 0) {
                            const cap = (suggestions[0] as { kitchenCapacity: number }).kitchenCapacity;
                            totalRemaining += (Number(cap) || 0);
                        } else {
                            totalRemaining += (Number(kitchen.maxDailyCapacity) || 0);
                        }
                    } catch {
                        totalRemaining += (Number(kitchen.maxDailyCapacity) || 0);
                    }
                }));

                const isFull = totalQuantity > totalRemaining;
                const isWarning = totalQuantity > totalRemaining * 0.8; // Warning at 80% usage relative to this order

                if (isFull) {
                    setCapacityStatus('full');
                    setCapacityInfo(`Hệ thống quá tải cho ngày này. Còn trống: ${totalRemaining} đơn vị.`);
                } else if (isWarning) {
                    setCapacityStatus('warning');
                    setCapacityInfo(`Công suất còn thấp (${totalRemaining} đơn vị). Vui lòng cân nhắc.`);
                } else {
                    setCapacityStatus('safe');
                    setCapacityInfo(`CÔNG SUẤT KHẢ DỤNG: ${totalRemaining} đơn vị (Đủ cho đơn hàng ${totalQuantity} SP).`);
                }
            } catch {
                setCapacityStatus('safe'); // Fallback
                setCapacityInfo('Dữ liệu công suất hiện không khả dụng.');
            }
        };

        checkCapacity();
    }, [selectedDate, isOpen, isInitialLoading, kitchens, totalQuantity]);

    const handleReschedule = async () => {
        if (!selectedDate) return;
        
        setIsSubmitting(true);
        try {
            await storeOrderApi.rescheduleOrder(orderId, selectedDate);
            toast.success('Đổi ngày giao hàng thành công!');
            onSuccess(selectedDate);
            onClose();
        } catch (error: unknown) {
            console.error('Reschedule failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Generate simple calendar dates for the next 14 days
    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    };

    const availableDates = generateDates();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Đổi ngày giao hàng">
            <div className="space-y-6">
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-zinc-400">Đơn hàng:</span>
                        <span className="font-black text-zinc-100 uppercase tracking-tighter">Đơn hàng {orderId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-zinc-400">Ngày giao hiện tại:</span>
                        <Badge variant="secondary" className="font-bold">
                            {new Date(currentDeliveryDate).toLocaleDateString('vi-VN')}
                        </Badge>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <CalendarIcon size={12} /> Chọn ngày mới (Smart Date Picker)
                    </label>
                    
                    <div className="grid grid-cols-7 gap-2">
                        {availableDates.map((dateStr) => {
                            const date = new Date(dateStr);
                            const day = date.getDate();
                            const isSelected = selectedDate === dateStr;
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            
                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all h-16",
                                        isSelected 
                                            ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20" 
                                            : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300",
                                        isWeekend && !isSelected && "bg-zinc-950/50"
                                    )}
                                >
                                    <span className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">
                                        {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                                    </span>
                                    <span className="text-sm font-black">{day}</span>
                                    
                                    {/* Capacity Indicator Dot - Simplified for HQ view */}
                                    <div className={cn(
                                        "absolute bottom-1 w-1 h-1 rounded-full",
                                        "bg-zinc-700" // Neutral for calendar dots to avoid too many API calls
                                    )} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Capacity Alert Area */}
                <div className={cn(
                    "p-4 rounded-2xl border transition-all duration-300",
                    capacityStatus === 'full' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                    capacityStatus === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                    capacityStatus === 'safe' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                    "bg-zinc-800/20 border-zinc-800 text-zinc-500"
                )}>
                    <div className="flex gap-3 items-start">
                        {capacityStatus === 'checking' ? (
                            <Loader2 size={18} className="animate-spin mt-0.5" />
                        ) : capacityStatus === 'full' ? (
                            <X size={18} className="mt-0.5" />
                        ) : capacityStatus === 'warning' ? (
                            <AlertTriangle size={18} className="mt-0.5" />
                        ) : (
                            <CheckCircle2 size={18} className="mt-0.5" />
                        )}
                        <div>
                            <p className="text-xs font-bold leading-relaxed">
                                {capacityStatus === 'checking' ? 'Đang kiểm tra công suất bếp...' : capacityInfo}
                            </p>
                            {capacityStatus === 'full' && (
                                <p className="text-[10px] font-medium opacity-80 mt-1 uppercase tracking-wider font-bold">Vui lòng chọn ngày khác</p>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Email Preview Hint */}
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-950/50 p-3 rounded-xl border border-dashed border-zinc-800">
                    <Mail size={14} className="text-indigo-500" />
                    <span>Sau khi đổi ngày, một Email thông báo sẽ được gửi tới Khách hàng</span>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Button
                        onClick={handleReschedule}
                        disabled={isSubmitting || capacityStatus === 'full' || capacityStatus === 'checking' || selectedDate === currentDeliveryDate}
                        className={cn(
                            "h-12 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg border-0 bg-amber-500 hover:bg-amber-600 text-black",
                            (capacityStatus === 'full' || capacityStatus === 'checking' || selectedDate === currentDeliveryDate) && "opacity-50 grayscale"
                        )}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" />
                                Đang xử lý...
                            </div>
                        ) : (
                            'Xác nhận Đổi ngày'
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="h-10 text-zinc-500 hover:text-zinc-200 font-bold uppercase text-[10px] tracking-widest"
                    >
                        Hủy bỏ
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
