import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, UserPlus, Mail, Shield, Store } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { userService } from '../../services/user.service';
import { roleApi } from '../../services/role.api';
import { storeApi } from '../../services/store.api';
import type { RoleResponse } from '../../types/role';

const createUserSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    roleId: z.number().min(1, 'Vui lòng chọn vai trò'),
    storeId: z.coerce.number().optional().nullable(),
    kitchenId: z.number().optional(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const CreateUserPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [stores, setStores] = useState<any[]>([]);

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
            storeId: null
        }
    });

    const roleId = useWatch({ control, name: 'roleId' });
    const selectedRole = roles.find(r => r.roleId === roleId)?.roleName;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesData, storesData] = await Promise.all([
                    roleApi.getAllRoles(),
                    storeApi.getAllStores({ size: 100 })
                ]);
                setRoles(rolesData);
                setStores(storesData.data.content);
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
            kitchenId: data.kitchenId
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
        <div className="min-h-screen bg-[#0a0a0a] pb-20">
            {/* Cinematic Header */}
            <div className="relative h-[350px] w-full overflow-hidden">
                <img
                    src="/Users/phunghuyphuoc/.gemini/antigravity/brain/5ad3745d-382e-481d-8167-b732c447a69b/system_onboarding_bg_1773028432172.png"
                    className="w-full h-full object-cover scale-110 motion-safe:animate-[pulse_8s_ease-in-out_infinite]"
                    alt="System Onboarding Background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#0a0a0a] backdrop-blur-[1px]" />

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-16 max-w-5xl mx-auto w-full">
                    <button
                        onClick={() => navigate('/users')}
                        className="group flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-6 w-fit"
                    >
                        <div className="p-2 rounded-full bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                            <ArrowLeft size={16} />
                        </div>
                        <span className="text-sm font-medium tracking-widest uppercase">Quay lại danh sách</span>
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-[2px] w-12 bg-indigo-500" />
                        <span className="text-indigo-400 font-bold tracking-[0.3em] text-[10px] uppercase">Khởi tạo tài khoản</span>
                    </div>

                    <h1 className="text-6xl font-black text-white tracking-tighter mb-4">
                        KHỞI TẠO <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">THÀNH VIÊN</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl text-lg font-light leading-relaxed">
                        Thiết lập thông tin định danh và cấp quyền truy cập hệ thống cho thành viên mới của đội ngũ vận hành.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-8 -mt-12 relative z-10 transition-all duration-700 ease-out animate-in fade-in slide-in-from-bottom-8">
                <div className="backdrop-blur-2xl bg-white/[0.02] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-12 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <UserPlus size={120} className="text-blue-500" />
                    </div>

                    {backendError && (
                        <div className="mb-10 p-6 bg-red-500/5 border border-red-500/20 rounded-3xl flex items-start gap-4 animate-in zoom-in-95">
                            <div className="p-2 bg-red-500/10 rounded-xl">
                                <Shield size={20} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white uppercase tracking-wider text-xs mb-1">Cảnh báo hệ thống</h3>
                                <p className="text-red-400 text-sm leading-relaxed font-light">{backendError}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-12">
                        {/* Section 1: Identity */}
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Mail size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Thông tin định danh</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Địa chỉ Email</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                                            <Mail size={18} className="text-gray-500 group-focus-within:text-blue-500" />
                                        </div>
                                        <input
                                            type="email"
                                            className={`w-full pl-12 pr-4 py-4 bg-white/[0.03] border rounded-2xl text-white placeholder:text-gray-700 focus:outline-none focus:ring-4 transition-all ${errors.email
                                                ? 'border-red-500/40 focus:ring-red-500/10'
                                                : 'border-white/10 focus:ring-blue-500/10 focus:border-blue-500/50 group-hover:bg-white/[0.05]'
                                                }`}
                                            placeholder="VD: john.doe@ckms.com"
                                            {...register('email')}
                                        />
                                    </div>
                                    {errors.email && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.email.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Họ và tên</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                                            <UserPlus size={18} className="text-gray-500 group-focus-within:text-blue-500" />
                                        </div>
                                        <input
                                            type="text"
                                            className={`w-full pl-12 pr-4 py-4 bg-white/[0.03] border rounded-2xl text-white placeholder:text-gray-700 focus:outline-none focus:ring-4 transition-all ${errors.fullName
                                                ? 'border-red-500/40 focus:ring-red-500/10'
                                                : 'border-white/10 focus:ring-blue-500/10 focus:border-blue-500/50 group-hover:bg-white/[0.05]'
                                                }`}
                                            placeholder="VD: Nguyễn Văn A"
                                            {...register('fullName')}
                                        />
                                    </div>
                                    {errors.fullName && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.fullName.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Authority */}
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 delay-150">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Shield size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Phân quyền hệ thống</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Vai trò truy cập</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                                            <Shield size={18} className="text-gray-500 group-focus-within:text-indigo-500" />
                                        </div>
                                        <select
                                            className={`w-full pl-12 pr-10 py-4 bg-white/[0.03] border rounded-2xl text-white appearance-none focus:outline-none focus:ring-4 transition-all cursor-pointer ${errors.roleId
                                                ? 'border-red-500/40 focus:ring-red-500/10'
                                                : 'border-white/10 focus:ring-indigo-500/10 focus:border-indigo-500/50 group-hover:bg-white/[0.05]'
                                                }`}
                                            {...register('roleId', { valueAsNumber: true })}
                                        >
                                            <option value={0} disabled className="bg-[#1a1a1a]">Chọn vai trò phù hợp...</option>
                                            {roles.map(role => (
                                                <option key={role.roleId} value={role.roleId} className="bg-[#1a1a1a]">
                                                    {role.roleName?.replace(/_/g, ' ') || `Role ${role.roleId}`}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    {errors.roleId && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.roleId.message}</p>}
                                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-3 ml-1">Xác định các module và hành động được phép thực hiện.</p>
                                </div>

                                {(selectedRole === 'STORE_STAFF' || selectedRole === 'MANAGER' || selectedRole === 'STAFF') && (
                                    <div className="space-y-2 animate-in zoom-in-95 duration-300">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Cửa hàng gán trực tiếp</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                                                <Store size={18} className="text-gray-500 group-focus-within:text-blue-500" />
                                            </div>
                                            <select
                                                className={`w-full pl-12 pr-10 py-4 bg-white/[0.03] border rounded-2xl text-white appearance-none focus:outline-none focus:ring-4 transition-all cursor-pointer ${errors.storeId
                                                    ? 'border-red-500/40 focus:ring-red-500/10'
                                                    : 'border-white/10 focus:ring-blue-500/10 focus:border-blue-500/50 group-hover:bg-white/[0.05]'
                                                    }`}
                                                {...register('storeId')}
                                            >
                                                <option value="" className="bg-[#1a1a1a]">Tạm thời chưa gán chi nhánh</option>
                                                {stores.map(store => (
                                                    <option key={store.storeId} value={store.storeId} className="bg-[#1a1a1a]">
                                                        {store.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        {errors.storeId && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.storeId.message}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-end gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate('/users')}
                                disabled={isSubmitting}
                                className="h-14 px-10 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all order-2 md:order-1"
                            >
                                Hủy bỏ yêu cầu
                            </Button>
                            <Button
                                type="submit"
                                className={`h-14 px-12 rounded-2xl font-bold tracking-widest uppercase text-xs shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] order-1 md:order-2 ${!isValid || isSubmitting
                                    ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-none shadow-blue-500/20'
                                    }`}
                                disabled={isSubmitting || !isValid}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>Đang khởi tạo...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Save size={18} />
                                        <span>Kích hoạt tài khoản</span>
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
