import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, UserPlus, Mail, Shield, Store, Warehouse, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { userService } from '../../services/user.service';
import { roleApi } from '../../services/role.api';
import { storeApi } from '../../services/store.api';
import { kitchenApi } from '../../services/kitchen.api';
import type { RoleResponse } from '../../types/role';
import securityAuthBg from '../../assets/security_auth.png';

const createUserSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    roleId: z.number().min(1, 'Vui lòng chọn vai trò'),
    storeId: z.coerce.number().optional().nullable(),
    kitchenId: z.coerce.number().optional().nullable(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const CreateUserPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [kitchens, setKitchens] = useState<any[]>([]);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid },
        reset
    } = useForm<CreateUserFormValues>({
        resolver: zodResolver(createUserSchema) as any,
        mode: 'onChange',
        defaultValues: {
            email: '',
            fullName: '',
            roleId: 0,
            storeId: null,
            kitchenId: null
        }
    });

    const roleId = useWatch({ control, name: 'roleId' });
    const selectedRole = roles.find(r => r.roleId === roleId)?.roleName;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesData, storesData, kitchensData] = await Promise.all([
                    roleApi.getAllRoles(),
                    storeApi.getAllStores({ size: 100 }),
                    kitchenApi.getAllKitchens()
                ]);
                setRoles(rolesData);
                setStores(storesData.data.content);
                setKitchens(kitchensData.data || []);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        fetchData();
    }, []);

    const onSubmit = async (data: any) => {
        setBackendError(null);
        setIsSubmitting(true);

        const payload: any = {
            email: data.email,
            fullName: data.fullName,
            roleId: data.roleId,
            storeId: data.storeId && data.storeId !== '' ? Number(data.storeId) : undefined,
            kitchenId: data.kitchenId && data.kitchenId !== '' ? Number(data.kitchenId) : undefined
        };

        try {
            await userService.createUser(payload);
            toast.success('Khởi tạo tài khoản thành công!');
            reset();
            navigate('/users');
        } catch (error: any) {
            console.error('Create user error:', error);
            const message = error.response?.data?.message || 'Khởi tạo tài khoản thất bại. Vui lòng kiểm tra lại.';
            setBackendError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-root)] pb-20 animate-in fade-in duration-700">
            {/* Cinematic Header */}
            <div className="relative h-[400px] w-full overflow-hidden">
                <img
                    src={securityAuthBg}
                    className="w-full h-full object-cover scale-105 motion-safe:animate-[pulse_10s_ease-in-out_infinite] opacity-60"
                    alt="System Authority Background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-card)]/80 via-[var(--bg-card)]/20 to-[var(--bg-root)] backdrop-blur-[2px]" />

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-16 max-w-6xl mx-auto w-full">
                    <button
                        onClick={() => navigate('/users')}
                        className="group flex items-center gap-3 text-amber-500 hover:text-amber-400 transition-all mb-8 w-fit bg-amber-500/5 px-6 py-3 rounded-2xl border border-amber-500/10 backdrop-blur-md"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase italic">Quay lại</span>
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-[2px] w-16 bg-amber-500/50" />
                        <span className="text-amber-500 font-black tracking-[0.4em] text-[10px] uppercase italic">Thêm người dùng</span>
                    </div>

                    <h1 className="text-6xl md:text-7xl font-black text-[var(--text-primary)] tracking-tighter mb-4 italic uppercase leading-none">
                        TẠO NGƯỜI <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">DÙNG</span>
                    </h1>
                    <p className="text-[var(--text-secondary)]/60 max-w-2xl text-lg font-medium leading-relaxed italic uppercase tracking-wider">
                        Tạo tài khoản và phân quyền truy cập
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 -mt-16 relative z-10 transition-all duration-700 ease-out animate-in fade-in slide-in-from-bottom-8">
                <div className="backdrop-blur-3xl bg-[var(--bg-card)]/60 border border-[var(--border-primary)] rounded-[3rem] shadow-2xl overflow-hidden p-10 md:p-20 relative group/form">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover/form:opacity-10 transition-opacity duration-1000">
                        <UserPlus size={180} className="text-amber-500" />
                    </div>

                    {backendError && (
                        <div className="mb-10 p-6 bg-red-500/5 border border-red-500/20 rounded-3xl flex items-start gap-4 animate-in zoom-in-95">
                            <div className="p-2 bg-red-500/10 rounded-xl">
                                <Shield size={20} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-xs mb-1">Cảnh báo hệ thống</h3>
                                <p className="text-red-500/80 text-sm leading-relaxed font-light italic">{backendError}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-12">
                        {/* Section 1: Identity */}
                        <div className="space-y-10">
                            <div className="flex items-center gap-6 pb-6 border-b border-[var(--border-primary)]/40">
                                <div className="h-14 w-14 rounded-[1.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                                    <Mail size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight italic uppercase">Thông tin người dùng</h3>
                                    <p className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest italic leading-none">Nhập thông tin cơ bản</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/field:scale-110">
                                            <Mail size={18} className="text-[var(--text-secondary)]/30 group-focus-within/field:text-amber-500" />
                                        </div>
                                        <input
                                            type="email"
                                            className={`w-full pl-16 pr-6 py-5 bg-[var(--bg-root)]/50 border rounded-[1.5rem] text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/20 focus:outline-none focus:ring-4 transition-all italic text-sm ${errors.email
                                                ? 'border-red-500/40 focus:ring-red-500/5'
                                                : 'border-[var(--border-primary)] focus:ring-amber-500/5 focus:border-amber-500/30'
                                                }`}
                                            placeholder="VD: alpha.manager@steakchain.vn"
                                            {...register('email')}
                                        />
                                    </div>
                                    {errors.email && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-4 italic">{errors.email.message}</p>}
                                </div>

                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Họ và tên</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/field:scale-110">
                                            <UserPlus size={18} className="text-[var(--text-secondary)]/30 group-focus-within/field:text-amber-500" />
                                        </div>
                                        <input
                                            type="text"
                                            className={`w-full pl-16 pr-6 py-5 bg-[var(--bg-root)]/50 border rounded-[1.5rem] text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/20 focus:outline-none focus:ring-4 transition-all italic text-sm ${errors.fullName
                                                ? 'border-red-500/40 focus:ring-red-500/5'
                                                : 'border-[var(--border-primary)] focus:ring-amber-500/5 focus:border-amber-500/30'
                                                }`}
                                            placeholder="VD: PHẠM KHÁNH NAM"
                                            {...register('fullName')}
                                        />
                                    </div>
                                    {errors.fullName && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-4 italic">{errors.fullName.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Authority */}
                        <div className="space-y-10">
                            <div className="flex items-center gap-6 pb-6 border-b border-[var(--border-primary)]/40">
                                <div className="h-14 w-14 rounded-[1.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                                    <Shield size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight italic uppercase">Phân quyền</h3>
                                    <p className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-widest italic leading-none">Chọn quyền cho người dùng</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3 group/field">
                                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Vai trò</label>
                                    <div className="relative group/select">
                                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/select:scale-110">
                                            <Shield size={18} className="text-[var(--text-secondary)]/30 group-focus-within/select:text-amber-500" />
                                        </div>
                                        <select
                                            className={`w-full pl-16 pr-10 py-5 bg-[var(--bg-root)]/50 border rounded-[1.5rem] text-[var(--text-primary)] font-bold appearance-none focus:outline-none focus:ring-4 transition-all cursor-pointer italic text-sm ${errors.roleId
                                                ? 'border-red-500/40 focus:ring-red-500/5'
                                                : 'border-[var(--border-primary)] focus:ring-amber-500/5 focus:border-amber-500/30'
                                                }`}
                                            {...register('roleId', { valueAsNumber: true })}
                                        >
                                            <option value={0} disabled className="bg-[var(--bg-card)]">-- Chọn vai trò --</option>
                                            {roles.map(role => (
                                                <option key={role.roleId} value={role.roleId} className="bg-[var(--bg-card)]">
                                                    {role.roleName?.replace(/_/g, ' ') || `Role ${role.roleId}`}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-[var(--text-secondary)]/30">
                                            <ChevronRight size={16} className="rotate-90" />
                                        </div>
                                    </div>
                                    {errors.roleId && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-4 italic">{errors.roleId.message}</p>}
                                </div>

                                {selectedRole === 'STORE_STAFF' && (
                                    <div className="space-y-3 group/field animate-in zoom-in-95 duration-500">
                                        <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Cửa hàng Gán trực tiếp (Direct Store)</label>
                                        <div className="relative group/select">
                                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/select:scale-110">
                                                <Store size={18} className="text-[var(--text-secondary)]/30 group-focus-within/select:text-amber-500" />
                                            </div>
                                            <select
                                                className={`w-full pl-16 pr-10 py-5 bg-[var(--bg-root)]/50 border rounded-[1.5rem] text-[var(--text-primary)] font-bold appearance-none focus:outline-none focus:ring-4 transition-all cursor-pointer italic text-sm ${errors.storeId
                                                    ? 'border-red-500/40 focus:ring-red-500/5'
                                                    : 'border-[var(--border-primary)] focus:ring-amber-500/5 focus:border-amber-500/30'
                                                    }`}
                                                {...register('storeId')}
                                            >
                                                <option value="" className="bg-[var(--bg-card)]">Tạm thời chưa gán chi nhánh</option>
                                                {stores.map(store => (
                                                    <option key={store.storeId} value={store.storeId} className="bg-[var(--bg-card)]">
                                                        {store.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-[var(--text-secondary)]/30">
                                                <ChevronRight size={16} className="rotate-90" />
                                            </div>
                                        </div>
                                        {errors.storeId && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-4 italic">{errors.storeId.message}</p>}
                                    </div>
                                )}

                                {selectedRole === 'KITCHEN_STAFF' && (
                                    <div className="space-y-3 group/field animate-in zoom-in-95 duration-500">
                                        <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] ml-2 italic">Bếp Trung Tâm Gán trực tiếp (Direct Kitchen)</label>
                                        <div className="relative group/select">
                                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/select:scale-110">
                                                <Warehouse size={18} className="text-[var(--text-secondary)]/30 group-focus-within/select:text-amber-500" />
                                            </div>
                                            <select
                                                className={`w-full pl-16 pr-10 py-5 bg-[var(--bg-root)]/50 border rounded-[1.5rem] text-[var(--text-primary)] font-bold appearance-none focus:outline-none focus:ring-4 transition-all cursor-pointer italic text-sm ${errors.kitchenId
                                                    ? 'border-red-500/40 focus:ring-red-500/5'
                                                    : 'border-[var(--border-primary)] focus:ring-amber-500/5 focus:border-amber-500/30'
                                                    }`}
                                                {...register('kitchenId')}
                                            >
                                                <option value="" className="bg-[var(--bg-card)]">-- Tuyển chọn Bếp Trung Tâm --</option>
                                                {kitchens.map(kitchen => (
                                                    <option key={kitchen.kitchenId} value={kitchen.kitchenId} className="bg-[var(--bg-card)]">
                                                        {kitchen.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-[var(--text-secondary)]/30">
                                                <ChevronRight size={16} className="rotate-90" />
                                            </div>
                                        </div>
                                        {errors.kitchenId && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-2 ml-4 italic">{errors.kitchenId.message}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-16 border-t border-[var(--border-primary)] flex flex-col md:flex-row justify-end gap-6">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate('/users')}
                                disabled={isSubmitting}
                                className="h-16 px-12 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] text-[var(--text-secondary)]/60 hover:text-amber-500 hover:border-amber-500/30 transition-all order-2 md:order-1 font-black uppercase text-[10px] tracking-widest italic"
                            >
                                Hủy bỏ yêu cầu
                            </Button>
                            <Button
                                type="submit"
                                className={`h-16 px-16 rounded-2xl font-black tracking-widest uppercase text-[10px] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] order-1 md:order-2 italic ${!isValid || isSubmitting
                                    ? 'bg-[var(--bg-card)] text-[var(--text-secondary)]/30 border border-[var(--border-primary)] cursor-not-allowed opacity-50'
                                    : 'bg-amber-500 hover:bg-amber-600 text-black border-none shadow-amber-500/20'
                                    }`}
                                disabled={isSubmitting || !isValid}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        <span>Đang xử lý...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Save size={18} />
                                        <span>Tạo người dùng</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateUserPage;
