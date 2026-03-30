import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store as StoreIcon, MapPin, Save, CreditCard, Navigation, ChevronLeft, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { storeApi } from '../../services/store.api';
import { cn } from '../../utils/classNames';
import storeHeaderBg from '../../assets/store_list_header_bg.png';

const createStoreSchema = z.object({
    name: z.string().min(1, 'Vui lòng nhập tên cửa hàng'),
    location: z.string().min(1, 'Vui lòng nhập địa chỉ'),
    phone: z.string().regex(/^(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại không hợp lệ').min(1, 'Vui lòng nhập số điện thoại'),
    paymentCycle: z.enum(['MONTHLY', 'WEEKLY', 'QUARTERLY']),
    latitude: z.coerce.number().min(-90).max(90, 'Vĩ độ không hợp lệ'),
    longitude: z.coerce.number().min(-180).max(180, 'Kinh độ không hợp lệ'),
    isActive: z.boolean().default(true),
});

type CreateStoreFormValues = z.infer<typeof createStoreSchema>;

export default function CreateStorePage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateStoreFormValues>({
        resolver: zodResolver(createStoreSchema) as any,
        defaultValues: {
            isActive: true,
            paymentCycle: 'MONTHLY',
        },
    });


    const onSubmit = async (data: CreateStoreFormValues) => {
        setIsSubmitting(true);
        try {
            await storeApi.createStore({
                name: data.name,
                address: data.location,
                phone: data.phone,
                paymentCycle: data.paymentCycle,
                latitude: data.latitude,
                longitude: data.longitude,
                isActive: data.isActive,
            });
            toast.success('Đã tạo cửa hàng thành công');
            navigate('/stores');
        } catch (error: any) {
            console.error('Error creating store:', error);
            const message = error.response?.data?.message || 'Không thể tạo cửa hàng. Vui lòng thử lại sau.';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-root)] animate-in fade-in duration-700 pb-20">
            {/* Cinematic Header Area */}
            <div className="relative h-[400px] w-full overflow-hidden">
                <img
                    src={storeHeaderBg}
                    className="w-full h-full object-cover scale-105 motion-safe:animate-[pulse_10s_ease-in-out_infinite] opacity-40 dark:opacity-60"
                    alt="Store Infrastructure Background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-card)]/80 via-[var(--bg-card)]/20 to-[var(--bg-root)] backdrop-blur-[2px]" />

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-16 max-w-7xl mx-auto w-full">
                    <button
                        onClick={() => navigate('/stores')}
                        className="group flex items-center gap-3 text-amber-500 hover:text-amber-400 transition-all mb-8 w-fit bg-amber-500/5 px-6 py-3 rounded-2xl border border-amber-500/10 backdrop-blur-md"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase italic">Quay lại Hệ thống Mạng lưới</span>
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-[2px] w-16 bg-amber-500/50" />
                        <span className="text-amber-500 font-black tracking-[0.4em] text-[10px] uppercase italic">Giao thức Đăng ký Thực thể</span>
                    </div>

                    <h1 className="text-6xl md:text-7xl font-black text-[var(--text-primary)] tracking-tighter mb-4 italic uppercase leading-none">
                        ĐĂNG KÝ <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">CHI NHÁNH</span>
                    </h1>
                    <p className="text-[var(--text-secondary)]/60 max-w-2xl text-lg font-medium leading-relaxed italic uppercase tracking-wider">
                        Khởi tạo một thực thể kinh doanh mới trong hệ sinh thái Steakhouse. Cấu hình các tham số vận hành và tọa độ logistics.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 -mt-16 relative z-10">
                <div className="bg-[var(--bg-card)]/60 backdrop-blur-3xl border border-[var(--border-primary)] rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
                    
                    <form id="create-store-form" onSubmit={handleSubmit(onSubmit as any)} className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Section 1: Identity */}
                            <div className="md:col-span-2 flex items-center gap-4 pb-4 border-b border-[var(--border-primary)]/10">
                                <div className="p-3 bg-amber-500/10 rounded-xl">
                                    <StoreIcon size={20} className="text-amber-500" />
                                </div>
                                <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight italic uppercase">Định danh Cửa hàng</h3>
                            </div>

                            <div className="space-y-3 group/field">
                                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Tên Cửa hàng (Legal Name) *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/field:scale-110">
                                        <StoreIcon size={18} className="text-[var(--text-secondary)]/30 group-focus-within/field:text-amber-500" />
                                    </div>
                                    <input
                                        {...register('name')}
                                        placeholder="VD: Chi nhánh Steakhouse Quận 1"
                                        className={cn(
                                            "w-full pl-16 pr-6 py-5 bg-[var(--bg-root)]/50 border rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/20 focus:outline-none focus:ring-4 transition-all italic text-sm",
                                            errors.name
                                                ? 'border-red-500/40 focus:ring-red-500/5'
                                                : 'border-[var(--border-primary)] focus:ring-amber-500/5 focus:border-amber-500/30'
                                        )}
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-4 italic">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-3 group/field">
                                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Liên hệ Giao dịch (Hotline) *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/field:scale-110">
                                        <Globe size={18} className="text-[var(--text-secondary)]/30 group-focus-within/field:text-amber-500" />
                                    </div>
                                    <input
                                        {...register('phone')}
                                        placeholder="VD: 0912 345 678"
                                        className={cn(
                                            "w-full pl-16 pr-6 py-5 bg-[var(--bg-root)]/50 border rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/20 focus:outline-none focus:ring-4 transition-all italic text-sm",
                                            errors.phone
                                                ? 'border-red-500/40 focus:ring-red-500/5'
                                                : 'border-[var(--border-primary)] focus:ring-amber-500/5 focus:border-amber-500/30'
                                        )}
                                    />
                                </div>
                                {errors.phone && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-4 italic">{errors.phone.message}</p>}
                            </div>

                            {/* Section 2: Logistics & Geography */}
                            <div className="md:col-span-2 flex items-center gap-4 pb-4 border-b border-[var(--border-primary)]/10 mt-6">
                                <div className="p-3 bg-amber-500/10 rounded-xl">
                                    <MapPin size={20} className="text-amber-500" />
                                </div>
                                <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight italic uppercase">Địa bàn & Logistics</h3>
                            </div>

                            <div className="md:col-span-2 space-y-3 group/field">
                                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Địa chỉ Toàn hành (Physical Address) *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/field:scale-110">
                                        <MapPin size={18} className="text-[var(--text-secondary)]/30 group-focus-within/field:text-amber-500" />
                                    </div>
                                    <input
                                        {...register('location')}
                                        placeholder="VD: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM"
                                        className={cn(
                                            "w-full pl-16 pr-6 py-5 bg-[var(--bg-root)]/50 border rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/20 focus:outline-none focus:ring-4 transition-all italic text-sm",
                                            errors.location
                                                ? 'border-red-500/40 focus:ring-red-500/5'
                                                : 'border-[var(--border-primary)] focus:ring-amber-500/5 focus:border-amber-500/30'
                                        )}
                                    />
                                </div>
                                {errors.location && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-4 italic">{errors.location.message}</p>}
                            </div>

                            <div className="space-y-3 group/field">
                                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Vĩ độ (Latitude) *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/field:scale-110">
                                        <Navigation size={18} className="text-[var(--text-secondary)]/30 rotate-45 group-focus-within/field:text-amber-500" />
                                    </div>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('latitude')}
                                        placeholder="VD: 10.7626"
                                        className={cn(
                                            "w-full pl-16 pr-6 py-5 bg-[var(--bg-root)]/50 border rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/20 focus:outline-none focus:ring-4 transition-all italic text-sm",
                                            errors.latitude
                                                ? 'border-red-500/40 focus:ring-red-500/5'
                                                : 'border-[var(--border-primary)] focus:ring-amber-500/5 focus:border-amber-500/30'
                                        )}
                                    />
                                </div>
                                {errors.latitude && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-4 italic">{errors.latitude.message}</p>}
                            </div>

                            <div className="space-y-3 group/field">
                                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Kinh độ (Longitude) *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/field:scale-110">
                                        <Navigation size={18} className="text-[var(--text-secondary)]/30 -rotate-45 group-focus-within/field:text-amber-500" />
                                    </div>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('longitude')}
                                        placeholder="VD: 106.6601"
                                        className={cn(
                                            "w-full pl-16 pr-6 py-5 bg-[var(--bg-root)]/50 border rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/20 focus:outline-none focus:ring-4 transition-all italic text-sm",
                                            errors.longitude
                                                ? 'border-red-500/40 focus:ring-red-500/5'
                                                : 'border-[var(--border-primary)] focus:ring-amber-500/5 focus:border-amber-500/30'
                                        )}
                                    />
                                </div>
                                {errors.longitude && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-4 italic">{errors.longitude.message}</p>}
                            </div>

                            {/* Section 3: Financial & Operations */}
                            <div className="md:col-span-2 flex items-center gap-4 pb-4 border-b border-[var(--border-primary)]/10 mt-6">
                                <div className="p-3 bg-amber-500/10 rounded-xl">
                                    <CreditCard size={20} className="text-amber-500" />
                                </div>
                                <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight italic uppercase">Tài chính & Vận hành</h3>
                            </div>

                            <div className="md:col-span-2 space-y-3 group/field">
                                <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Chu kỳ Thanh toán (Settlement Cycle) *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                        <CreditCard size={18} className="text-[var(--text-secondary)]/30 group-focus-within/field:text-amber-500" />
                                    </div>
                                    <select
                                        {...register('paymentCycle')}
                                        className={cn(
                                            "w-full pl-16 pr-12 py-5 bg-[var(--bg-root)]/50 border rounded-2xl text-[var(--text-primary)] font-black italic uppercase appearance-none focus:outline-none focus:ring-4 transition-all text-xs tracking-widest cursor-pointer",
                                            errors.paymentCycle
                                                ? 'border-red-500/40 focus:ring-red-500/5'
                                                : 'border-[var(--border-primary)] focus:ring-amber-500/5 focus:border-amber-500/30'
                                        )}
                                    >
                                        <option value="WEEKLY">THEO TUẦN (WEEKLY INTEL)</option>
                                        <option value="MONTHLY">THEO THÁNG (MONTHLY AUDIT)</option>
                                        <option value="QUARTERLY">THEO QUÝ (QUARTERLY CONSOLIDATION)</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-amber-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-[var(--border-primary)]/10 flex flex-col md:flex-row gap-6 justify-end items-center">
                            <button
                                type="button"
                                onClick={() => navigate('/stores')}
                                className="w-full md:w-auto px-10 h-16 rounded-2xl bg-[var(--bg-root)]/50 border border-[var(--border-primary)] text-[var(--text-secondary)]/40 hover:text-amber-500 hover:border-amber-500/20 transition-all font-black uppercase text-[10px] tracking-widest italic"
                            >
                                Hủy bỏ yêu cầu
                            </button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className={cn(
                                    "w-full md:w-auto h-16 px-12 rounded-2xl font-black tracking-widest uppercase text-[10px] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] italic",
                                    isSubmitting
                                        ? 'bg-[var(--bg-card)] text-[var(--text-secondary)]/30 border border-[var(--border-primary)]'
                                        : 'bg-amber-500 hover:bg-amber-600 text-black border-none shadow-amber-500/20'
                                )}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        <span>Đang khởi tạo...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Save size={18} />
                                        <span>Đăng ký Chi nhánh mới</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            
            <style>{`
                select {
                    background-image: none !important;
                }
            `}</style>
        </div>
    );
}
