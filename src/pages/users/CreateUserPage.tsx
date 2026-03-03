import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, UserPlus, Mail, Shield, Store, ChefHat } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { userService } from '../../services/user.service';
import { roleApi } from '../../services/role.api';
import { storeApi } from '../../services/store.api';
import type { CreateUserRequest } from '../../types/user';
import type { RoleResponse } from '../../types/role';
import type { StoreResponse } from '../../types/store';

const createUserSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    roleId: z.number().min(1, 'Vui lòng chọn vai trò'),
    kitchenId: z.number().optional(),
    storeId: z.number().optional(),
});

export const CreateUserPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);
    const [roles, setRoles] = useState<RoleResponse[]>([]);
    const [stores, setStores] = useState<StoreResponse[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [selectedKitchenId, setSelectedKitchenId] = useState<string>('');

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await roleApi.getAllRoles();
                setRoles(data);
            } catch (error) {
                console.error('Failed to fetch roles:', error);
            }
        };
        fetchRoles();

        // Load stores for dropdown
        storeApi.getAllStores({ size: 100 }).then(res => {
            const storeList = res.data?.content || [];
            setStores(storeList);
        }).catch(err => {
            console.error('Failed to load stores:', err);
        });
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset,
        watch
    } = useForm<CreateUserRequest>({
        resolver: zodResolver(createUserSchema),
        mode: 'onChange',
        defaultValues: {
            email: '',
            fullName: '',
            roleId: 0
        }
    });

    const selectedRoleId = watch('roleId');
    const selectedRole = roles.find(r => r.roleId === selectedRoleId);
    const roleName = selectedRole?.roleName?.toUpperCase() || '';

    // Determine if kitchen/store fields should show
    const needsKitchen = ['COORDINATOR', 'KITCHEN_STAFF', 'SUPPLY_COORDINATOR'].includes(roleName);
    const needsStore = ['STORE_STAFF', 'MANAGER'].includes(roleName);

    const onSubmit = async (data: CreateUserRequest) => {
        setBackendError(null);
        setIsSubmitting(true);

        // Add store/kitchen IDs from dropdowns
        const payload: CreateUserRequest = {
            ...data,
            storeId: selectedStoreId ? Number(selectedStoreId) : undefined,
            kitchenId: selectedKitchenId ? Number(selectedKitchenId) : undefined,
        };

        try {
            await userService.createUser(payload);
            toast.success('Tạo người dùng thành công!');
            reset();
            setSelectedStoreId('');
            setSelectedKitchenId('');
            navigate('/users');
        } catch (error: any) {
            console.error('Create user error:', error);
            const message = error.response?.data?.message || 'Tạo người dùng thất bại. Vui lòng thử lại.';
            setBackendError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/users')}
                    className="hover:bg-zinc-800 rounded-full p-2 h-auto"
                >
                    <ArrowLeft size={20} className="text-gray-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-2">
                        <UserPlus size={24} className="text-amber-500" />
                        Tạo người dùng mới
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Thêm người dùng mới vào hệ thống và gán vai trò.</p>
                </div>
            </div>

            <Card className="p-6 md:p-8 border-0 shadow-sm ring-1 ring-zinc-800 bg-zinc-900/50">
                {backendError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-start gap-3">
                        <div className="mt-0.5">
                            <Shield size={18} className="text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Thao tác thất bại</h3>
                            <p className="text-sm">{backendError}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-300 font-medium pb-2 border-b border-zinc-800">
                            <UserPlus size={18} className="text-amber-600" />
                            <h3>Thông tin cơ bản</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Email *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm bg-zinc-900/50 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:border-transparent transition-all ${errors.email ? 'border-red-500/50 focus:ring-red-500 ring-1 ring-red-500/20' : 'border-zinc-700 focus:ring-amber-500 focus:border-amber-500'}`}
                                        placeholder="VD: john@example.com"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Họ và tên *</label>
                                <Input
                                    placeholder="VD: Nguyễn Văn A"
                                    error={errors.fullName?.message}
                                    {...register('fullName')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Role & Assignment */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-300 font-medium pb-2 border-b border-zinc-800">
                            <Shield size={18} className="text-amber-600" />
                            <h3>Vai trò & Phân công</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Role Dropdown */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Vai trò *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Shield size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm bg-zinc-900/50 text-gray-200 focus:outline-none focus:ring-1 focus:border-transparent transition-all appearance-none ${errors.roleId ? 'border-red-500/50 focus:ring-red-500 ring-1 ring-red-500/20' : 'border-zinc-700 focus:ring-amber-500 focus:border-amber-500'}`}
                                        {...register('roleId', { valueAsNumber: true })}
                                    >
                                        <option value={0} disabled>Chọn vai trò...</option>
                                        {roles.map(role => (
                                            <option key={role.roleId} value={role.roleId}>
                                                {role.roleName?.replace(/_/g, ' ') || `Role ${role.roleId}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.roleId && <p className="text-red-500 text-xs mt-1">{errors.roleId.message}</p>}
                                <p className="text-xs text-gray-400 mt-1">Vai trò quyết định quyền hạn trong hệ thống.</p>
                            </div>

                            {/* Store Dropdown - shows for store-related roles */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block flex items-center gap-1.5">
                                    <Store size={14} className="text-gray-400" />
                                    Gán vào Cửa hàng
                                    {needsStore && <span className="text-amber-500 text-xs">(Bắt buộc)</span>}
                                </label>
                                <select
                                    value={selectedStoreId}
                                    onChange={(e) => setSelectedStoreId(e.target.value)}
                                    className="w-full px-3 py-2 border border-zinc-700 rounded-md text-sm bg-zinc-900/50 text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                >
                                    <option value="">-- Không gán cửa hàng --</option>
                                    {stores.map(store => (
                                        <option key={store.id} value={String(store.id)}>
                                            {store.name} {store.address ? `(${store.address})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">
                                    {needsStore
                                        ? 'Bắt buộc cho Store Staff / Manager. User sẽ thuộc cửa hàng này.'
                                        : 'Tùy chọn. Gán user vào một cửa hàng cụ thể.'
                                    }
                                </p>
                            </div>

                            {/* Kitchen ID - shows for kitchen-related roles */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block flex items-center gap-1.5">
                                    <ChefHat size={14} className="text-gray-400" />
                                    Gán vào Bếp trung tâm (Kitchen ID)
                                    {needsKitchen && <span className="text-amber-500 text-xs">(Bắt buộc)</span>}
                                </label>
                                <input
                                    type="number"
                                    value={selectedKitchenId}
                                    onChange={(e) => setSelectedKitchenId(e.target.value)}
                                    placeholder="VD: 1"
                                    className="w-full px-3 py-2 border border-zinc-700 rounded-md text-sm bg-zinc-900/50 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    {needsKitchen
                                        ? 'Bắt buộc cho Coordinator / Kitchen Staff. User phải thuộc kitchen mới tạo được Production Plan.'
                                        : 'Tùy chọn. Nhập ID bếp trung tâm để gán user.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/users')}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            className="bg-amber-600 hover:bg-amber-700 text-white min-w-[140px]"
                            disabled={isSubmitting || !isValid}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang tạo...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save size={18} />
                                    Tạo người dùng
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
