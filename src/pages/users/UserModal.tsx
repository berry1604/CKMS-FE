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
                    storeApi.getAllStores({ size: 100 })
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
            });
        } else if (!user) {
            reset({
                name: '',
                email: '',
                roleId: 0,
                storeId: 'null',
            });
        }
    }, [user, isOpen, reset, roles]);

    const handleFormSubmit = async (data: any) => {
        const payload = {
            fullName: data.name,
            email: data.email,
            roleId: Number(data.roleId),
            storeId: data.storeId && data.storeId !== 'null' ? Number(data.storeId) : null,
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
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit(handleFormSubmit)} isLoading={isSubmitting} className="min-w-[120px]">
                        {user ? 'Lưu thay đổi' : 'Tạo nhân viên'}
                    </Button>
                </div>
            }
        >
            <form className="space-y-8">
                {/* Section 1: Basic Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-200 font-medium pb-2 border-b border-zinc-800">
                        <Briefcase size={18} className="text-amber-500" />
                        <h3>Thông tin cơ bản</h3>
                    </div>

                    <div className="grid gap-5">
                        <Input
                            label="Họ và tên"
                            placeholder="VD: Nguyễn Văn A"
                            icon={<User size={18} className="text-gray-400" />}
                            error={errors.name?.message}
                            {...register('name')}
                        />

                        <Input
                            label="Địa chỉ Email"
                            type="email"
                            placeholder="VD: person@example.com"
                            icon={<Mail size={18} className="text-gray-400" />}
                            error={errors.email?.message}
                            {...register('email')}
                        />
                    </div>
                </div>

                {/* Section 2: Roles & Assignments */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-200 font-medium pb-2 border-b border-zinc-800">
                        <Shield size={18} className="text-amber-500" />
                        <h3>Vai trò & Quyền hạn</h3>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-4">
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Vai trò được gán</label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-md border border-zinc-700 bg-zinc-900/50 pl-3 pr-10 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 appearance-none transition-shadow"
                                    {...register('roleId', { valueAsNumber: true })}
                                >
                                    <option value={0} disabled>Chọn vai trò...</option>
                                    {roles.map(role => (
                                        <option key={role.roleId} value={role.roleId}>
                                            {role.roleName?.replace(/_/g, ' ') || `Role ${role.roleId}`}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Shield size={16} className="text-gray-500" />
                                </div>
                            </div>
                        </div>

                        {/* Store Assignment - Conditional based on Role Name */}
                        {(selectedRoleName === 'STORE_STAFF' || selectedRoleName === 'MANAGER' || selectedRoleName === 'STAFF') && (
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Cửa hàng chi nhánh</label>
                                <div className="relative">
                                    <select
                                        className="flex h-11 w-full rounded-md border border-zinc-700 bg-zinc-900/50 pl-3 pr-10 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 appearance-none transition-shadow"
                                        {...register('storeId')}
                                    >
                                        <option value="null">Chưa gán cửa hàng</option>
                                        {stores.map(store => (
                                            <option key={store.storeId} value={store.storeId}>
                                                {store.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <Store size={18} className="text-gray-400" />
                                    </div>
                                </div>
                                {errors.storeId && <p className="text-sm text-red-500 mt-1">{errors.storeId.message}</p>}
                            </div>
                        )}

                        <div className="flex gap-2 p-3 bg-amber-500/10 rounded text-xs text-amber-500">
                            <Key size={14} className="mt-0.5" />
                            <p>Việc gán vai trò sẽ tự động cấp các quyền tương ứng cho người dùng này.</p>
                        </div>
                    </div>
                    {errors.roleId && <p className="text-sm text-red-500">{errors.roleId.message}</p>}
                </div>

                {!user && (
                    <div className="bg-green-500/10 rounded-lg p-4 flex items-start gap-3 border border-green-500/20">
                        <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-green-400">Kích hoạt tài khoản</h4>
                            <p className="text-xs text-green-500/80 mt-1 leading-relaxed">
                                Một email mời sẽ được gửi đến email này để thiết lập mật khẩu.
                            </p>
                        </div>
                    </div>
                )}
            </form>
        </Drawer>
    );
};
