import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User as UserIcon, Mail, Lock, Save, Phone, MapPin, Calendar, FileText, Camera, BadgeCheck, Sparkles, Navigation, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user.service';
import { storeApi } from '../../services/store.api';
import { useAppStore } from '../../app/store';
import { toast } from 'react-hot-toast';

interface ProfileFormValues {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    bio?: string;
    latitude: number;
    longitude: number;
    password?: string;
    confirmPassword?: string;
}

const profileSchema = z.object({
    name: z.string().min(1, 'Tên là bắt buộc'),
    email: z.string().email('Email không hợp lệ'),
    phone: z.string().optional(),
    address: z.string().optional(),
    bio: z.string().optional(),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
}).refine((data) => {
    if (data.password && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
});

export const UserProfile = () => {
    const { user } = useAuth();
    const { updateUser } = useAppStore();
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingData, setPendingData] = useState<ProfileFormValues | null>(null);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema) as any,
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address: user?.address || '',
            bio: user?.bio || '',
            latitude: user?.latitude || 0,
            longitude: user?.longitude || 0,
            password: '',
            confirmPassword: ''
        }
    });

    const currentValues = watch();

    const changedFields = useMemo(() => {
        if (!user) return [];
        const diff: { label: string; old: any; new: any }[] = [];
        
        if (currentValues.name !== user.name) diff.push({ label: 'Họ và tên', old: user.name, new: currentValues.name || 'Trống' });
        if (currentValues.email !== user.email) diff.push({ label: 'Email', old: user.email, new: currentValues.email });
        if (currentValues.phone !== (user.phone || '')) diff.push({ label: 'Số điện thoại', old: user.phone || 'Trống', new: currentValues.phone || 'Trống' });
        if (currentValues.address !== (user.address || '')) diff.push({ label: 'Địa chỉ', old: user.address || 'Trống', new: currentValues.address || 'Trống' });
        if (currentValues.bio !== (user.bio || '')) diff.push({ label: 'Tiểu sử', old: 'Đã thay đổi', new: 'Đã thay đổi' });
        if (Number(currentValues.latitude) !== (user.latitude || 0)) diff.push({ label: 'Vĩ độ', old: user.latitude || 0, new: currentValues.latitude });
        if (Number(currentValues.longitude) !== (user.longitude || 0)) diff.push({ label: 'Kinh độ', old: user.longitude || 0, new: currentValues.longitude });
        if (currentValues.password) diff.push({ label: 'Mật khẩu', old: '********', new: '********' });
        
        return diff;
    }, [currentValues, user]);

    useEffect(() => {
        if (user) {
            setValue('name', user.name);
            setValue('email', user.email);
            setValue('phone', user.phone || '');
            setValue('address', user.address || '');
            setValue('bio', user.bio || '');
            setValue('latitude', Number(user.latitude) || 0);
            setValue('longitude', Number(user.longitude) || 0);

            // Fetch real store name if it's generic (e.g., "Cửa hàng 3")
            if (user.storeId && (!user.storeName || user.storeName.includes('Cửa hàng'))) {
                storeApi.getStoreById(Number(user.storeId))
                    .then(res => {
                        if (res.data?.name) {
                            updateUser({ storeName: res.data.name });
                        }
                    })
                    .catch(err => console.error('Failed to fetch store name', err));
            }
        }
    }, [user, setValue, updateUser]);

    const onSubmit = (data: any) => {
        if (changedFields.length === 0) {
            toast.error('Không có thông tin nào thay đổi.');
            return;
        }
        setPendingData(data);
        setShowConfirmModal(true);
    };

    const confirmUpdate = async () => {
        if (!user || !pendingData) return;
        setShowConfirmModal(false);
        setIsLoading(true);
        setSuccessMessage('');

        try {
            const updateData: any = {
                fullName: pendingData.name,
                email: pendingData.email,
                phone: pendingData.phone,
                address: pendingData.address,
                bio: pendingData.bio,
                latitude: Number(pendingData.latitude),
                longitude: Number(pendingData.longitude)
            };

            if (pendingData.password) {
                updateData.password = pendingData.password;
            }

            const response = await userService.updateProfile(Number(user.id), updateData);
            
            if (response) {
                updateUser({
                    name: pendingData.name,
                    email: pendingData.email,
                    phone: pendingData.phone,
                    address: pendingData.address,
                    bio: pendingData.bio,
                    latitude: Number(pendingData.latitude),
                    longitude: Number(pendingData.longitude)
                });
                
                toast.success('Hồ sơ đã được cập nhật thành công!');
                setSuccessMessage('Hồ sơ đã được cập nhật thành công!');
                setValue('password', '');
                setValue('confirmPassword', '');
            }
        } catch (error: any) {
            console.error('Failed to update profile', error);
            const errorMsg = error.response?.data?.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại sau.';
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
            setPendingData(null);
        }
    };

    if (!user) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto pb-20 px-4 pt-4 animate-in fade-in duration-700">
            {/* Cinematic Header Container */}
            <div className="relative h-[350px] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] mb-[-100px] z-0 border border-[var(--border-primary)]">
                <img
                    src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop"
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-root)] via-[var(--bg-root)]/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent"></div>

                {/* Header Content */}
                <div className="absolute bottom-32 left-10 md:left-16 flex flex-col md:flex-row items-end gap-6">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-amber-500 rounded-[2rem] blur-2xl group-hover:blur-3xl transition-all opacity-20 group-hover:opacity-40"></div>
                        <img
                            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=f59e0b&color=fff&bold=true`}
                            alt={user.name}
                            className="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] border-[6px] border-[var(--bg-root)] object-cover shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-105"
                        />
                        <button className="absolute bottom-2 right-2 bg-amber-500 text-black p-2.5 rounded-2xl z-20 shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-[var(--bg-root)]">
                            <Camera size={18} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic drop-shadow-lg">
                                {user.name}
                            </h1>
                            <BadgeCheck className="text-amber-500 drop-shadow-glow" size={28} fill="rgba(245,158,11,0.1)" />
                        </div>
                        <p className="text-[var(--text-secondary)] font-bold tracking-widest uppercase italic mt-1 flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-500/50" />
                            {user.role?.replace('ROLE_', '').replace('_', ' ')}
                            {user.storeName ? ` • ${user.storeName}` : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 px-2">
                {/* Left Sidebar Info */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[var(--bg-card)]/60 backdrop-blur-3xl rounded-[2.5rem] border border-[var(--border-primary)] p-8 shadow-2xl">
                        <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-8 flex items-center gap-2 italic">
                            <span className="w-2 h-2 rounded-full bg-amber-500/50"></span>
                            Thông tin liên hệ
                        </h3>

                        <div className="space-y-6">
                            <div className="flex items-center gap-5 group p-2 -m-2 rounded-2xl hover:bg-[var(--text-primary)]/5 transition-colors cursor-default">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-amber-500 transition-colors shadow-inner">
                                    <Mail size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]/60 font-black">Email</span>
                                    <span className="text-[var(--text-primary)] font-bold">{user.email}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 group p-2 -m-2 rounded-2xl hover:bg-[var(--text-primary)]/5 transition-colors cursor-default">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-amber-500 transition-colors shadow-inner">
                                    <Phone size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]/60 font-black">Số điện thoại</span>
                                    <span className="text-[var(--text-primary)] font-bold">{user.phone || 'Chưa cập nhật'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 group p-2 -m-2 rounded-2xl hover:bg-[var(--text-primary)]/5 transition-colors cursor-default">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-amber-500 transition-colors shadow-inner">
                                    <MapPin size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]/60 font-black">Địa chỉ</span>
                                    <span className="text-[var(--text-primary)] font-bold leading-tight">{user.address || 'Chưa cập nhật'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 group p-2 -m-2 rounded-2xl hover:bg-[var(--text-primary)]/5 transition-colors cursor-default">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-amber-500 transition-colors shadow-inner">
                                    <Calendar size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]/60 font-black">Ngày tham gia</span>
                                    <span className="text-[var(--text-primary)] font-bold leading-tight italic">
                                        {user.joinDate ? new Date(user.joinDate).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Chưa có thông tin'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-10 border-t border-[var(--border-primary)]">
                            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-4 italic">Tiểu sử</h3>
                            <p className="text-[var(--text-secondary)] text-sm italic font-medium leading-relaxed">
                                {user.bio || '"Người này chưa viết tiểu sử riêng. Một khởi đầu mới đầy hứa hẹn tại hệ thống FranchiseSys."'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Content Form */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-[var(--bg-card)]/80 backdrop-blur-3xl rounded-[2.5rem] border border-[var(--border-primary)] p-8 md:p-10 shadow-2xl relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full"></div>

                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div>
                                <h2 className="text-2xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter">Cập nhật hồ sơ</h2>
                                <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mt-1">Quản lý định danh và thông tin cá nhân</p>
                            </div>
                            <Button variant="ghost" className="rounded-2xl border border-[var(--border-primary)] hover:border-amber-500/30 text-[var(--text-secondary)] hover:text-amber-500 text-[10px] font-black tracking-widest uppercase italic px-6 py-3 h-auto">Xem log hđ</Button>
                        </div>

                        {successMessage && (
                            <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-black uppercase tracking-widest animate-in slide-in-from-top duration-500">
                                {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2 italic">Họ và tên</label>
                                    <div className="group relative transition-all duration-300">
                                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none transition-transform duration-500 group-focus-within:translate-x-1">
                                            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)] group-focus-within:text-amber-500 group-focus-within:shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                <UserIcon size={18} />
                                            </div>
                                        </div>
                                        <Input
                                            {...register('name')}
                                            className="pl-14 h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/30 transition-all duration-300"
                                            placeholder="Nhập tên của bạn"
                                            error={errors.name?.message}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2 italic">Địa chỉ Email</label>
                                    <div className="group relative transition-all duration-300">
                                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none transition-transform duration-500 group-focus-within:translate-x-1">
                                            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)] group-focus-within:text-amber-500 group-focus-within:shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                <Mail size={18} />
                                            </div>
                                        </div>
                                        <Input
                                            {...register('email')}
                                            className="pl-14 h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/30 transition-all duration-300"
                                            type="email"
                                            placeholder="example@mail.com"
                                            error={errors.email?.message}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2 italic">Số điện thoại</label>
                                    <div className="group relative transition-all duration-300">
                                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none transition-transform duration-500 group-focus-within:translate-x-1">
                                            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)] group-focus-within:text-amber-500 group-focus-within:shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                <Phone size={18} />
                                            </div>
                                        </div>
                                        <Input
                                            {...register('phone')}
                                            className="pl-14 h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/30 transition-all duration-300"
                                            placeholder="09xx xxx xxx"
                                            error={errors.phone?.message}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2 italic">Địa chỉ thường trú</label>
                                    <div className="group relative transition-all duration-300">
                                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none transition-transform duration-500 group-focus-within:translate-x-1">
                                            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)] group-focus-within:text-amber-500 group-focus-within:shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                <MapPin size={18} />
                                            </div>
                                        </div>
                                        <Input
                                            {...register('address')}
                                            className="pl-14 h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/30 transition-all duration-300"
                                            placeholder="Thành phố, Quận/Huyện,..."
                                            error={errors.address?.message}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2 italic">Vĩ độ</label>
                                    <div className="group relative transition-all duration-300">
                                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none transition-transform duration-500 group-focus-within:translate-x-1">
                                            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)] group-focus-within:text-amber-500 group-focus-within:shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                <Navigation size={18} className="rotate-45" />
                                            </div>
                                        </div>
                                        <Input
                                            type="number"
                                            step="any"
                                            {...register('latitude')}
                                            className="pl-14 h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/30 transition-all duration-300"
                                            placeholder="10.762..."
                                            error={errors.latitude?.message}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2 italic">Kinh độ</label>
                                    <div className="group relative transition-all duration-300">
                                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none transition-transform duration-500 group-focus-within:translate-x-1">
                                            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)] group-focus-within:text-amber-500 group-focus-within:shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                <Navigation size={18} className="-rotate-45" />
                                            </div>
                                        </div>
                                        <Input
                                            type="number"
                                            step="any"
                                            {...register('longitude')}
                                            className="pl-14 h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/30 transition-all duration-300"
                                            placeholder="106.66..."
                                            error={errors.longitude?.message}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2 italic">Tiểu sử cá nhân</label>
                                <div className="group relative transition-all duration-300">
                                    <div className="absolute top-2 left-1 pointer-events-none transition-transform duration-500 group-focus-within:translate-y-1">
                                        <div className="w-10 h-10 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)] group-focus-within:text-amber-500 group-focus-within:shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                            <FileText size={18} />
                                        </div>
                                    </div>
                                    <textarea
                                        {...register('bio')}
                                        className="w-full pl-14 pr-4 py-4 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-amber-500/50 rounded-3xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/30 focus:outline-none focus:ring-1 focus:ring-amber-500/30 min-h-[140px] transition-all duration-300"
                                        placeholder="Một vài dòng giới thiệu về bản thân..."
                                    />
                                </div>
                            </div>

                            {/* Security Section with High-End aesthetic */}
                            <div className="pt-10 border-t border-[var(--border-primary)] space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/5 scale-110">
                                        <Lock size={18} />
                                    </div>
                                    <h3 className="text-lg font-black text-[var(--text-primary)] italic uppercase tracking-tighter">Bảo mật hệ thống</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2 italic">Mật khẩu mới</label>
                                        <Input
                                            {...register('password')}
                                            type="password"
                                            className="h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/30"
                                            placeholder="Để trống nếu không đổi"
                                            error={errors.password?.message}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2 italic">Xác nhận mật khẩu</label>
                                        <Input
                                            {...register('confirmPassword')}
                                            type="password"
                                            className="h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/30"
                                            placeholder="Nhập lại mật khẩu mới"
                                            error={errors.confirmPassword?.message}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button
                                    type="submit"
                                    isLoading={isLoading}
                                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black uppercase tracking-widest px-10 py-6 h-auto rounded-[1.5rem] shadow-[0_10px_25px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_35px_rgba(245,158,11,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-95 italic"
                                >
                                    <Save size={20} className="mr-3" strokeWidth={3} />
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title="Xác nhận thay đổi thông tin"
                footer={
                    <div className="flex gap-3 w-full">
                        <Button
                            variant="ghost"
                            onClick={() => setShowConfirmModal(false)}
                            className="flex-1 h-12 rounded-2xl bg-[var(--text-primary)]/5 text-[var(--text-secondary)] font-black uppercase text-[10px] tracking-widest"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={confirmUpdate}
                            isLoading={isLoading}
                            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase text-[10px] tracking-widest"
                        >
                            Xác nhận cập nhật
                        </Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-black">
                            <AlertTriangle size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="text-[var(--text-primary)] font-black text-sm uppercase tracking-tight">Xác nhận thay đổi</p>
                            <p className="text-amber-500/80 text-[10px] font-bold uppercase tracking-widest">Bạn có chắc muốn lưu các thay đổi này?</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Danh sách thay đổi:</p>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                            {changedFields.map((field, idx) => (
                                <div key={idx} className="p-3 rounded-xl bg-[var(--text-primary)]/5 border border-[var(--border-primary)] flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{field.label}</span>
                                    <div className="flex items-center gap-2 text-xs font-bold">
                                        <span className="text-[var(--text-secondary)] line-through truncate max-w-[120px]">{field.old}</span>
                                        <Navigation size={10} className="text-[var(--text-secondary)]/30 rotate-90" />
                                        <span className="text-[var(--text-primary)] truncate">{field.new}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
