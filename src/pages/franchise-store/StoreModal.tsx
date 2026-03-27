import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Store as StoreIcon, MapPin, Phone, Mail, CreditCard, Navigation } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { StoreResponse, StoreCreateRequest } from '../../types/store';
import { GoongMapPicker } from '../../components/map/GoongMapPicker';

const storeSchema = z.object({
    name: z.string().min(1, 'Tên cửa hàng là bắt buộc'),
    address: z.string().min(1, 'Địa chỉ là bắt buộc'),
    phone: z.string().optional(),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    paymentCycle: z.enum(['MONTHLY', 'WEEKLY', 'QUARTERLY']),
    latitude: z.preprocess((value) => (value === '' || value === null || value === undefined ? undefined : Number(value)), z.number().min(-90).max(90, 'Vĩ độ không hợp lệ').optional()),
    longitude: z.preprocess((value) => (value === '' || value === null || value === undefined ? undefined : Number(value)), z.number().min(-180).max(180, 'Kinh độ không hợp lệ').optional()),
    isActive: z.boolean().optional()
});

type StoreFormData = z.infer<typeof storeSchema>;

interface StoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: StoreCreateRequest) => void;
    initialData?: StoreResponse | null;
    isLoading?: boolean;
}

export const StoreModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: StoreModalProps) => {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<StoreFormData>({
        resolver: zodResolver(storeSchema) as any,
        defaultValues: {
            name: '',
            address: '',
            phone: '',
            email: '',
            paymentCycle: 'MONTHLY',
            latitude: undefined,
            longitude: undefined,
            isActive: true
        }
    });


    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name || '',
                address: initialData.address || '',
                phone: initialData.phone || '',
                email: initialData.email || '',
                paymentCycle: initialData.paymentCycle || 'MONTHLY',
                latitude: initialData.latitude,
                longitude: initialData.longitude,
                isActive: initialData.isActive ?? true,
            });
        } else {
            reset({
                name: '',
                address: '',
                phone: '',
                email: '',
                paymentCycle: 'MONTHLY',
                latitude: undefined,
                longitude: undefined,
                isActive: true,
            });
        }
    }, [initialData, reset, isOpen]);

    const onSubmitForm = (data: StoreFormData) => {
        const payload = {
            name: data.name,
            address: data.address,
            phone: data.phone || undefined,
            email: data.email || undefined,
            paymentCycle: data.paymentCycle,
            latitude: Number.isFinite(data.latitude) ? data.latitude : undefined,
            longitude: Number.isFinite(data.longitude) ? data.longitude : undefined,
            isActive: data.isActive !== undefined ? data.isActive : true,
        } as StoreCreateRequest;
        onSubmit(payload);
    };

    const onError = (errors: any) => {
        console.error('Validation errors:', errors);
    };

    const latitude = watch('latitude');
    const longitude = watch('longitude');
    const address = watch('address');
    const hasValidCoords = Number.isFinite(latitude) && Number.isFinite(longitude) && !(Number(latitude) === 0 && Number(longitude) === 0);

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Cập nhật Cửa hàng' : 'Đăng ký Cửa hàng mới'}
            description={initialData ? 'Cập nhật thông tin và trạng thái cửa hàng.' : 'Đăng ký chi nhánh nhượng quyền mới.'}
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="h-12 px-8 rounded-2xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        form="store-form"
                        disabled={isLoading}
                        className="h-12 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black uppercase text-[10px] tracking-widest transition-all duration-300 border-0 shadow-2xl shadow-amber-900/40"
                    >
                        {isLoading ? 'Đang lưu...' : (initialData ? 'Cập nhật' : 'Đăng ký')}
                    </Button>
                </div>
            }
        >
            <form id="store-form" onSubmit={handleSubmit(onSubmitForm, onError)} className="space-y-10 py-2">
                {/* Section 1: Basic Info */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <StoreIcon size={18} className="text-amber-500" />
                        </div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Thông tin cửa hàng</h3>
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Tên cửa hàng</label>
                            <Input
                                placeholder="VD: Chi nhánh Quận 1"
                                icon={<StoreIcon size={18} className="text-zinc-600" />}
                                error={errors.name?.message}
                                {...register('name')}
                                className="h-14 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Địa chỉ chính xác</label>
                            <Input
                                placeholder="Nhập địa chỉ cửa hàng"
                                icon={<MapPin size={18} className="text-zinc-600" />}
                                error={errors.address?.message}
                                {...register('address')}
                                className="h-14 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Bản đồ Goong</label>
                            <GoongMapPicker
                                initialAddress={address}
                                initialLngLat={hasValidCoords ? [Number(longitude), Number(latitude)] : undefined}
                                mapHeightClassName="h-[260px]"
                                enableDirections={false}
                                onLocationSelected={({ address: selectedAddress, lngLat }) => {
                                    setValue('address', selectedAddress, { shouldDirty: true, shouldValidate: false });
                                    setValue('longitude', lngLat[0], { shouldDirty: true, shouldValidate: false });
                                    setValue('latitude', lngLat[1], { shouldDirty: true, shouldValidate: true });
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Điện thoại</label>
                                <Input
                                    placeholder="090..."
                                    icon={<Phone size={18} className="text-zinc-600" />}
                                    {...register('phone')}
                                    className="h-14 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Email liên hệ</label>
                                <Input
                                    type="email"
                                    placeholder="store@email.com"
                                    icon={<Mail size={18} className="text-zinc-600" />}
                                    error={errors.email?.message}
                                    {...register('email')}
                                    className="h-14 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Chu kỳ thanh toán</label>
                            <div className="relative group/select">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10 transition-transform duration-300 group-focus-within/select:scale-110">
                                    <CreditCard size={18} className="text-zinc-600 group-focus-within/select:text-amber-500 transition-colors" />
                                </div>
                                <select
                                    className={`w-full h-14 pl-14 pr-10 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300 appearance-none font-bold text-sm cursor-pointer ${errors.paymentCycle ? 'border-red-500' : ''}`}
                                    {...register('paymentCycle')}
                                >
                                    <option value="WEEKLY">Theo tuần</option>
                                    <option value="MONTHLY">Theo tháng</option>
                                    <option value="QUARTERLY">Theo quý</option>
                                </select>
                                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-zinc-600 group-focus-within/select:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            {errors.paymentCycle && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1">{errors.paymentCycle.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-6 pb-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Vĩ độ</label>
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder="10.762..."
                                    icon={<Navigation size={18} className="text-zinc-600 rotate-45" />}
                                    error={errors.latitude?.message}
                                    {...register('latitude')}
                                    className="h-14 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Kinh độ</label>
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder="106.66..."
                                    icon={<Navigation size={18} className="text-zinc-600 -rotate-45" />}
                                    error={errors.longitude?.message}
                                    {...register('longitude')}
                                    className="h-14 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Drawer>
    );
};
