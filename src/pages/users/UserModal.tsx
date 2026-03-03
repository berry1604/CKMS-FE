import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Shield, Briefcase, Key, CheckCircle2, Store, Warehouse } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserResponse } from '../../types/user';

const userSchema = z.object({
    name: z.string().min(2, 'Họ tên là bắt buộc'),
    email: z.string().email('Email không hợp lệ'),
    role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'COORDINATOR', 'STORE_STAFF'] as const),
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
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting },
    } = useForm<UserForm>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            role: 'STORE_STAFF',
        },
    });

    const selectedRole = useWatch({ control, name: 'role' });

    useEffect(() => {
        if (user) {
            reset({
                name: user.fullName || user.username,
                email: user.email,
                role: user.roleName as 'ADMIN' | 'MANAGER' | 'STAFF' | 'COORDINATOR' | 'STORE_STAFF',
                storeId: user.storeId || null,
                kitchenId: user.kitchenId || null,
            });
        } else {
            reset({
                name: '',
                email: '',
                role: 'STORE_STAFF',
                storeId: null,
                kitchenId: null,
            });
        }
    }, [user, isOpen, reset]);

    const handleFormSubmit = async (data: any) => {
        // Map fields to match what handleSubmit in UsersList expects or what backend expects
        const payload = {
            fullName: data.name,
            email: data.email,
            roleName: data.role,
            storeId: data.storeId ? Number(data.storeId) : null,
            kitchenId: data.kitchenId ? Number(data.kitchenId) : null
        };
        await onSubmit(payload);
        onClose();
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={user ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
            description={user ? 'Cập nhật thông tin và quyền hạn của thành viên.' : 'Tạo tài khoản thành viên mới.'}
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit(handleFormSubmit)} isLoading={isSubmitting} className="min-w-[120px]">
                        {user ? 'Lưu thay đổi' : 'Tạo thành viên'}
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
                            placeholder="VD: example@franchise.com"
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
                                    {...register('role')}
                                >
                                    <option value="ADMIN">Admin (Toàn quyền)</option>
                                    <option value="MANAGER">Manager (Quản lý cửa hàng)</option>
                                    <option value="STAFF">Staff (Nhân viên tổng hợp)</option>
                                    <option value="COORDINATOR">Coordinator (Điều phối sản xuất)</option>
                                    <option value="STORE_STAFF">Store Staff (Nhập đơn hàng)</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Store Assignment */}
                        {(selectedRole === 'STORE_STAFF' || selectedRole === 'MANAGER') && (
                            <Input
                                label="Mã Cửa hàng (Store ID)"
                                type="number"
                                placeholder="Nhập Store ID"
                                icon={<Store size={18} className="text-gray-400" />}
                                error={errors.storeId?.message}
                                {...register('storeId')}
                            />
                        )}

                        {/* Kitchen Assignment */}
                        {(selectedRole === 'COORDINATOR' || selectedRole === 'ADMIN') && (
                            <Input
                                label="Mã Bếp trung tâm (Kitchen ID)"
                                type="number"
                                placeholder="Nhập Kitchen ID"
                                icon={<Warehouse size={18} className="text-gray-400" />}
                                error={errors.kitchenId?.message}
                                {...register('kitchenId')}
                            />
                        )}

                        <div className="flex gap-2 p-3 bg-amber-500/10 rounded text-xs text-amber-500">
                            <Key size={14} className="mt-0.5" />
                            <p>Việc gán vai trò sẽ tự động cấp các quyền tương ứng cho người dùng này.</p>
                        </div>
                    </div>
                    {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
                </div>

                {/* Additional Info Box */}
                {!user && (
                    <div className="bg-green-500/10 rounded-lg p-4 flex items-start gap-3 border border-green-500/20">
                        <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-green-400">Kích hoạt tài khoản</h4>
                            <p className="text-xs text-green-500/80 mt-1 leading-relaxed">
                                Một email mời sẽ được gửi đến email đã cung cấp với hướng dẫn thiết lập mật khẩu và kích hoạt tài khoản.
                            </p>
                        </div>
                    </div>
                )}
            </form>
        </Drawer>
    );
};
