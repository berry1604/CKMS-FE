import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ChefHat, Save, X, Activity, Navigation } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { AddressInput } from '../../components/ui/AddressInput';
import { useAddressAutocomplete } from '../../hooks/useAddressAutocomplete';
import type { KitchenResponse } from '../../types/kitchen';

interface KitchenFormData {
    name: string;
    address: string;
    maxDailyCapacity: number;
    isActive: boolean;
    latitude?: number;
    longitude?: number;
}

interface KitchenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: KitchenFormData) => Promise<void>;
    initialData?: KitchenResponse | null;
    isLoading?: boolean;
}

export const KitchenModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: KitchenModalProps) => {
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<KitchenFormData>({
        defaultValues: {
            name: '',
            address: '',
            maxDailyCapacity: 0,
            isActive: true,
            latitude: undefined,
            longitude: undefined,
        }
    });

    const addressValue = watch('address');
    const { 
        suggestions, 
        loading: addressLoading, 
        error: addressError,
        setQuery: setAddressQuery,
        clearSuggestions 
    } = useAddressAutocomplete(addressValue);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    address: initialData.address,
                    maxDailyCapacity: initialData.maxDailyCapacity,
                    isActive: initialData.isActive,
                    latitude: initialData.latitude,
                    longitude: initialData.longitude,
                });
            } else {
                reset({
                    name: '',
                    address: '',
                    maxDailyCapacity: 0,
                    isActive: true,
                    latitude: undefined,
                    longitude: undefined,
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const handleAddressChange = (value: string) => {
        setAddressQuery(value);
        setValue('address', value);
    };

    const handleAddressSelect = (result: any) => {
        setValue('address', result.formattedAddress);
        setValue('latitude', result.latitude);
        setValue('longitude', result.longitude);
        clearSuggestions();
    };

    const handleFormSubmit = async (data: KitchenFormData) => {
        await onSubmit(data);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={initialData ? 'Cập nhật Bếp trung tâm' : 'Đăng ký Bếp trung tâm mới'}
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* Form fields */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                            <ChefHat size={14} className="text-amber-500" /> Tên Bếp trung tâm
                        </label>
                        <input
                            {...register('name', { required: 'Vui lòng nhập tên bếp.' })}
                            className="w-full bg-zinc-950/50 border border-white/5 focus:border-amber-500/50 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all"
                            placeholder="Vd: Bếp Trung Tâm Quận 1"
                        />
                        {errors.name && <p className="text-xs text-rose-500 font-bold ml-1">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1">Địa chỉ</label>
                        <AddressInput
                            value={addressValue}
                            onChange={handleAddressChange}
                            onSelectAddress={handleAddressSelect}
                            suggestions={suggestions}
                            loading={addressLoading}
                            error={addressError || errors.address?.message}
                            placeholder="Vd: 123 Nguyễn Thị Minh Khai, Quận 1"
                            disabled={isLoading}
                            className="bg-zinc-950/50 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/30 rounded-2xl transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1">Vĩ độ</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Navigation size={14} className="text-zinc-600 rotate-45" />
                                </div>
                                <input
                                    type="number"
                                    step="any"
                                    {...register('latitude')}
                                    className="w-full bg-zinc-950/50 border border-white/5 focus:border-amber-500/50 rounded-2xl pl-10 px-5 py-4 text-sm font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all"
                                    placeholder="10.762622"
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1">Kinh độ</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Navigation size={14} className="text-zinc-600 -rotate-45" />
                                </div>
                                <input
                                    type="number"
                                    step="any"
                                    {...register('longitude')}
                                    className="w-full bg-zinc-950/50 border border-white/5 focus:border-amber-500/50 rounded-2xl pl-10 px-5 py-4 text-sm font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all"
                                    placeholder="106.660172"
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1">Công suất tối đa (sản phẩm/ngày)</label>
                        <input
                            type="number"
                            min="0"
                            {...register('maxDailyCapacity', { 
                                required: 'Vui lòng nhập công suất.',
                                valueAsNumber: true,
                                min: { value: 1, message: 'Công suất phải lớn hơn 0' }
                            })}
                            className="w-full bg-zinc-950/50 border border-white/5 focus:border-amber-500/50 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all"
                            placeholder="Vd: 5000"
                        />
                        {errors.maxDailyCapacity && <p className="text-xs text-rose-500 font-bold ml-1">{errors.maxDailyCapacity.message}</p>}
                    </div>

                    <div className="space-y-2 pt-2">
                        <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                            <Activity size={14} className="text-amber-500" /> Trạng thái hoạt động
                        </label>
                        <div className="flex items-center gap-3 bg-zinc-950/50 border border-white/5 rounded-2xl p-4">
                            <input
                                type="checkbox"
                                id="isActive"
                                {...register('isActive')}
                                className="w-5 h-5 rounded border-zinc-800 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-950"
                            />
                            <label htmlFor="isActive" className="text-sm font-bold text-white cursor-pointer select-none">
                                Kích hoạt (Active)
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        className="border-white/10 text-zinc-400 hover:text-white rounded-2xl px-6 h-12 uppercase text-[10px] font-black tracking-widest"
                    >
                        <X size={16} className="mr-2" /> Hủy bỏ
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:scale-105 active:scale-95 transition-all outline-none border-none text-black font-black uppercase text-[10px] tracking-widest px-8 h-12 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                    >
                        {isLoading ? 'Đang lưu...' : <><Save size={16} className="mr-2" /> Lưu thông tin</>}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
