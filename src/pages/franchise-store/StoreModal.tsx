import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Store as StoreIcon, MapPin, Activity, Phone, Mail } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { StoreResponse, StoreCreateRequest } from '../../types/store';

const storeSchema = z.object({
    name: z.string().min(1, 'Tên cửa hàng là bắt buộc'),
    address: z.string().min(1, 'Địa chỉ là bắt buộc'),
    phone: z.string().optional(),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    isActive: z.boolean().optional()
});

interface StoreFormData {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
}

interface StoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: StoreCreateRequest) => void;
    initialData?: StoreResponse | null;
    isLoading?: boolean;
}

export const StoreModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: StoreModalProps) => {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<StoreFormData>({
        resolver: zodResolver(storeSchema),
        defaultValues: {
            name: '',
            address: '',
            phone: '',
            email: '',
            isActive: true
        }
    });

    const isActive = watch('isActive');

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name || '',
                address: initialData.address || '',
                phone: initialData.phone || '',
                email: initialData.email || '',
                isActive: initialData.isActive ?? true,
            });
        } else {
            reset({
                name: '',
                address: '',
                phone: '',
                email: '',
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
            isActive: data.isActive !== undefined ? data.isActive : true,
            active: data.isActive !== undefined ? data.isActive : true,
            status: data.isActive ? 'ACTIVE' : 'INACTIVE'
        } as StoreCreateRequest;
        onSubmit(payload);
    };

    const onError = (errors: any) => {
        console.error('Validation errors:', errors);
    };

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
                    </div>
                </div>

                {/* Section 2: Status */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <Activity size={18} className="text-amber-500" />
                        </div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Trạng thái vận hành</h3>
                    </div>

                    <div className="bg-zinc-900/40 border border-white/5 rounded-[32px] p-8 grid grid-cols-2 gap-4 relative overflow-hidden group/card shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>

                        {[
                            { value: true, label: 'Hoạt động', desc: 'Có thể nhận đơn', color: 'emerald' },
                            { value: false, label: 'Ngừng hoạt động', desc: 'Tạm dừng phục vụ', color: 'red' }
                        ].map((opt) => (
                            <label
                                key={String(opt.value)}
                                className={`
                                    relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300
                                    ${isActive === opt.value
                                        ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
                                        : 'border-white/5 bg-black/20 hover:border-white/10 text-zinc-500'
                                    }
                                `}
                            >
                                <input
                                    type="radio"
                                    checked={isActive === opt.value}
                                    onChange={() => setValue('isActive', opt.value)}
                                    className="sr-only"
                                />
                                <span className={`text-xs font-black uppercase tracking-widest ${isActive === opt.value ? 'text-white' : ''}`}>
                                    {opt.label}
                                </span>
                                <span className="text-[10px] font-medium mt-1 uppercase tracking-tight opacity-50">
                                    {opt.desc}
                                </span>
                                {isActive === opt.value && (
                                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${opt.color === 'emerald' ? 'bg-emerald-500 text-emerald-500' : 'bg-red-500 text-red-500'}`}></div>
                                )}
                            </label>
                        ))}
                    </div>
                </div>
            </form>
        </Drawer>
    );
};
