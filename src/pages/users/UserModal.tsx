import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Shield, Briefcase, Key, CheckCircle2, Store } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserResponse } from '../../types/user';
import type { RoleResponse } from '../../types/role';
import { storeApi } from '../../services/store.api';
import { roleApi } from '../../services/role.api';

const userSchema = z.object({
    name: z.string().min(2, 'Họ tên là bắt buộc'),
    email: z.string().email('Email không hợp lệ'),
    roleId: z.number().min(1, 'Vai trò là bắt buộc'),
    storeId: z.union([z.number(), z.string(), z.null()]).optional(),
    kitchenId: z.union([z.number(), z.string(), z.null()]).optional(),
});

type UserForm = z.infer<typeof userSchema>;

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    user?: UserResponse | null;
}

export const UserModal = ({ isOpen, onClose, onSubmit, user }: UserModalProps) => {
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [stores, setStores] = useState<any[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting },
    } = useForm<UserForm>({
        resolver: zodResolver(userSchema) as any,
        defaultValues: {
            roleId: 0,
            storeId: 'null',
            kitchenId: 'null',
        },
    });

    const selectedRoleId = useWatch({ control, name: 'roleId' });
    const selectedRoleName = roles.find(r => r.roleId === selectedRoleId)?.roleName;

    // Fetch roles and stores
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesList, storesList] = await Promise.all([
                    roleApi.getAllRoles(),
                    storeApi.getAllStores({ size: 100 }),
                ]);
                setRoles(rolesList);
                setStores(storesList.data.content);
            } catch (error) {
                console.error('Error fetching modal data:', error);
            }
        };
        fetchData();
    }, []);

    // Reset form when user or roles change
    useEffect(() => {
        if (user && roles.length > 0) {
            const userRole = roles.find(r => r.roleName === user.roleName);
            reset({
                name: user.fullName || user.username,
                email: user.email,
                roleId: userRole?.roleId || 0,
                storeId: user.storeId || 'null',
                kitchenId: user.kitchenId || 'null',
            });
        } else if (!user) {
            reset({
                name: '',
                email: '',
                roleId: 0,
                storeId: 'null',
                kitchenId: 'null',
            });
        }
    }, [user, isOpen, reset, roles]);

    const handleFormSubmit = async (data: any) => {
        const payload = {
            fullName: data.name,
            email: data.email,
            roleId: Number(data.roleId),
            storeId: data.storeId && data.storeId !== 'null' ? Number(data.storeId) : null,
            kitchenId: data.kitchenId && data.kitchenId !== 'null' ? Number(data.kitchenId) : null,
        };
        await onSubmit(payload);
        onClose();
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={user ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
            description={user ? 'Cập nhật thông tin và quyền hạn của nhân viên.' : 'Tạo tài khoản nhân viên mới.'}
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="h-12 px-8 rounded-2xl bg-[var(--bg-root)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/[0.05] border border-[var(--border-primary)] font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit(handleFormSubmit)}
                        isLoading={isSubmitting}
                        className="h-12 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black uppercase text-[10px] tracking-widest transition-all duration-300 border-0 shadow-lg shadow-amber-500/20"
                    >
                        {user ? 'Lưu thay đổi' : 'Tạo nhân viên'}
                    </Button>
                </div>
            }
        >
            <form className="space-y-10 py-2">
                {/* Section 1: Basic Info */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-primary)]">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <Briefcase size={18} className="text-amber-500" />
                        </div>
                        <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Thông tin cơ bản</h3>
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1">Họ và tên</label>
                            <Input
                                placeholder="Nhập đầy đủ họ tên"
                                icon={<User size={18} className="text-[var(--text-secondary)]/40" />}
                                error={errors.name?.message}
                                {...register('name')}
                                className="h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1">Địa chỉ Email</label>
                            <Input
                                type="email"
                                placeholder="example@bistack.com"
                                icon={<Mail size={18} className="text-[var(--text-secondary)]/40" />}
                                error={errors.email?.message}
                                {...register('email')}
                                className="h-14 bg-[var(--bg-root)]/50 border-[var(--border-primary)] focus:border-amber-500/50 focus:ring-amber-500/10 text-[var(--text-primary)] rounded-2xl transition-all duration-300"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Roles & Assignments */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-primary)]">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <Shield size={18} className="text-amber-500" />
                        </div>
                        <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Vai trò và Cửa hàng</h3>
                    </div>

                    <div className="bg-[var(--bg-root)]/40 border border-[var(--border-primary)] rounded-[32px] p-8 space-y-6 relative overflow-hidden group/card shadow-sm">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1">Vai trò hệ thống</label>
                            <div className="relative group/select">
                                <select
                                    className="flex h-14 w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]/40 pl-4 pr-12 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500/50 appearance-none transition-all duration-300 font-bold uppercase"
                                    {...register('roleId', { valueAsNumber: true })}
                                >
                                    <option value={0} disabled className="bg-[var(--bg-card)]">Chọn vai trò...</option>
                                    {roles.map(role => (
                                        <option key={role.roleId} value={role.roleId} className="bg-[var(--bg-card)]">
                                            {role.roleName?.replace(/_/g, ' ') || `Role ${role.roleId}`}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[var(--text-secondary)] group-focus-within/select:text-amber-500 transition-colors">
                                    <Shield size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Store Assignment */}
                        {(selectedRoleName === 'STORE_STAFF' || selectedRoleName === 'MANAGER' || selectedRoleName === 'STAFF') && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1">Đơn vị công tác</label>
                                <div className="relative group/select">
                                    <select
                                        className="flex h-14 w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]/40 pl-4 pr-12 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500/50 appearance-none transition-all duration-300 font-bold uppercase"
                                        {...register('storeId')}
                                    >
                                        <option value="null" className="bg-[var(--bg-card)]">Chưa gán đơn vị</option>
                                        {stores.map(store => (
                                            <option key={store.storeId} value={store.storeId} className="bg-[var(--bg-card)]">
                                                {store.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[var(--text-secondary)] group-focus-within/select:text-amber-500 transition-colors">
                                        <Store size={20} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl transition-colors hover:bg-amber-500/10">
                            <Key size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-medium text-amber-500/80 leading-relaxed uppercase tracking-wide">
                                Việc gán vai trò sẽ tự động cấp các đặc quyền tương ứng cho người dùng này trong hệ thống.
                            </p>
                        </div>
                    </div>
                    {errors.roleId && <p className="text-[10px] font-bold text-red-500 ml-1 tracking-wider uppercase bg-red-500/10 p-2 rounded-lg inline-block">{errors.roleId.message}</p>}
                </div>

                {!user && (
                    <div className="bg-emerald-500/5 rounded-3xl p-6 flex items-start gap-4 border border-emerald-500/10 animate-in fade-in zoom-in-95 duration-700 shadow-sm">
                        <CheckCircle2 size={24} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="text-xs font-black text-emerald-500/80 uppercase tracking-widest">Kích hoạt tức thì</h4>
                            <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed uppercase tracking-wide">
                                Hệ thống tự động gửi email mời thiết lập mật khẩu đến nhân viên ngay sau khi khởi tạo.
                            </p>
                        </div>
                    </div>
                )}
            </form>
        </Drawer>
    );
};
