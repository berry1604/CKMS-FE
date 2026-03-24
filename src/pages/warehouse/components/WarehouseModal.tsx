import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Store, MapPin, Hash } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { KitchenResponse, KitchenUpdateRequest } from '../../../types/kitchen';

interface WarehouseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: KitchenUpdateRequest) => Promise<void>;
    warehouse?: KitchenResponse | null;
    isLoading: boolean;
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    warehouse,
    isLoading
}) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<KitchenUpdateRequest>({
        defaultValues: {
            name: '',
            address: '',
            maxDailyCapacity: 0,
            isActive: true,
            latitude: 0,
            longitude: 0
        }
    });

    const isEditMode = !!warehouse;

    useEffect(() => {
        if (isOpen) {
            if (warehouse) {
                reset({
                    name: warehouse.name,
                    address: warehouse.address,
                    maxDailyCapacity: warehouse.maxDailyCapacity,
                    isActive: warehouse.isActive,
                    latitude: warehouse.latitude || 0,
                    longitude: warehouse.longitude || 0
                });
            } else {
                reset({
                    name: '',
                    address: '',
                    maxDailyCapacity: 300,
                    isActive: true,
                    latitude: 0,
                    longitude: 0
                });
            }
        }
    }, [isOpen, warehouse, reset]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />
            
            <div className="relative bg-zinc-950 border border-white/10 rounded-[2rem] w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-8 fade-in zoom-in-95 duration-500">
                {/* Decorative glow */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0"></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-[60px] pointer-events-none"></div>

                <div className="p-8 border-b border-white/5 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-amber-500/10 to-orange-500/5 flex items-center justify-center border border-amber-500/20 shadow-inner">
                            <Store className="w-7 h-7 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                {isEditMode ? 'Cập Nhật Kho' : 'Khởi Tạo Kho Mới'}
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1 font-medium">
                                {isEditMode ? `Đang chỉnh sửa dữ liệu kho #${warehouse.kitchenId.toString().padStart(4, '0')}` : 'Thiết lập thông tin hoạt động và cấu hình nền cho chi nhánh kho mới.'}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8 relative z-10 bg-gradient-to-b from-transparent to-black/20">
                    <div className="space-y-6">
                        {/* Name */}
                        <div className="group">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-2 group-focus-within:text-amber-500 transition-colors">
                                <Store className="w-3.5 h-3.5" />
                                Tên định danh kho *
                            </label>
                            <Input
                                {...register('name', { required: 'Vui lòng nhập tên kho' })}
                                placeholder="VD: Kho Nguyên Liệu Quận 1..."
                                className="bg-zinc-900/50 border-white/5 focus:border-amber-500/50 hover:bg-zinc-900 focus:bg-zinc-900 transition-colors h-12 text-sm"
                                error={errors.name?.message}
                            />
                        </div>

                        {/* Address */}
                        <div className="group">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-2 group-focus-within:text-amber-500 transition-colors">
                                <MapPin className="w-3.5 h-3.5" />
                                Địa chỉ cụ thể *
                            </label>
                            <Input
                                {...register('address', { required: 'Vui lòng nhập địa chỉ' })}
                                placeholder="Chỉ định địa chỉ giao nhận hàng hóa..."
                                className="bg-zinc-900/50 border-white/5 focus:border-amber-500/50 hover:bg-zinc-900 focus:bg-zinc-900 transition-colors h-12 text-sm"
                                error={errors.address?.message}
                            />
                        </div>

                        {/* Coordinates */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="group">
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-2 group-focus-within:text-amber-500 transition-colors">
                                    <MapPin className="w-3.5 h-3.5" />
                                    Vĩ độ
                                </label>
                                <Input
                                    type="number"
                                    step="any"
                                    {...register('latitude')}
                                    placeholder="10.762..."
                                    className="bg-zinc-900/50 border-white/5 focus:border-amber-500/50 hover:bg-zinc-900 focus:bg-zinc-900 transition-colors h-12 text-sm"
                                    error={errors.latitude?.message}
                                />
                            </div>
                            <div className="group">
                                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-2 group-focus-within:text-amber-500 transition-colors">
                                    <MapPin className="w-3.5 h-3.5" />
                                    Kinh độ
                                </label>
                                <Input
                                    type="number"
                                    step="any"
                                    {...register('longitude')}
                                    placeholder="106.66..."
                                    className="bg-zinc-900/50 border-white/5 focus:border-amber-500/50 hover:bg-zinc-900 focus:bg-zinc-900 transition-colors h-12 text-sm"
                                    error={errors.longitude?.message}
                                />
                            </div>
                        </div>

                        {/* Capacity */}
                        <div className="border border-amber-500/10 bg-amber-500/[0.02] p-6 rounded-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none transition-transform group-focus-within:scale-150 duration-700"></div>
                            <label className="text-xs font-black text-amber-500/80 uppercase tracking-widest flex items-center gap-2 mb-3">
                                <Hash className="w-4 h-4" />
                                Năng lực điều phối / Công suất (Units/Min)
                            </label>
                            <Input
                                type="number"
                                {...register('maxDailyCapacity', { 
                                    required: 'Vui lòng nhập công suất định mức',
                                    min: { value: 0, message: 'Công suất phải lớn hơn hoặc bằng 0' }
                                })}
                                placeholder="Thực tế vận hành: 300..."
                                className="bg-black/40 border-amber-500/20 focus:border-amber-500 text-amber-400 font-mono text-lg h-14 pl-4"
                                error={errors.maxDailyCapacity?.message}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            className="flex-1 h-12 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Hủy Bỏ
                        </Button>
                        <Button 
                            type="submit" 
                            className="flex-1 h-12 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:-translate-y-0.5"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Hệ thống đang xử lý...' : (isEditMode ? 'Lưu Thiết Lập' : 'Xác Nhận Tạo Kho')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
