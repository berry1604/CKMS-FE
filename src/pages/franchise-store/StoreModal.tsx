import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Store as StoreIcon, MapPin, User, Activity, Phone, Mail, Box } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { StoreResponse, StoreCreateRequest } from '../../types/store';
import type { UserResponse } from '../../types/user';
import { userService } from '../../services/user.service';

const storeSchema = z.object({
    name: z.string().min(1, 'Tên cửa hàng là bắt buộc'),
    address: z.string().min(1, 'Địa chỉ là bắt buộc'),
    phone: z.string().optional(),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    managerId: z.number().optional(),
    warehouseCapacity: z.number().min(0, 'Sức chứa kho phải là số dương hoặc 0'),
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
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [selectedManagerId, setSelectedManagerId] = useState<string>('');
    const [isActive, setIsActive] = useState(true);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<StoreFormData>({
        resolver: zodResolver(storeSchema),
        defaultValues: {
            name: '',
            address: '',
            phone: '',
            email: '',
            managerId: undefined,
            warehouseCapacity: 0,
            isActive: true
        }
    });

    // Load users for dropdown
    useEffect(() => {
        if (isOpen) {
            setIsLoadingUsers(true);
            userService.getUsers({ size: 100 }).then(res => {
                const userList = res.data?.content || [];
                setUsers(userList);
            }).catch(err => {
                console.error('Failed to load users:', err);
            }).finally(() => {
                setIsLoadingUsers(false);
            });
        }
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name || '',
                address: initialData.address || '',
                phone: initialData.phone || '',
                email: initialData.email || '',
                warehouseCapacity: initialData.warehouseCapacity || 0,
            });
            setIsActive(initialData.isActive);
            setSelectedManagerId('');
        } else {
            reset({
                name: '',
                address: '',
                phone: '',
                email: '',
                warehouseCapacity: 0,
            });
            setIsActive(true);
            setSelectedManagerId('');
        }
    }, [initialData, reset, isOpen]);

    const onSubmitForm = (data: StoreFormData) => {
        const payload: StoreCreateRequest = {
            name: data.name,
            address: data.address,
            phone: data.phone || undefined,
            email: data.email || undefined,
            managerId: selectedManagerId ? Number(selectedManagerId) : undefined,
            warehouseCapacity: Number(data.warehouseCapacity)
        };
        console.log('Store payload:', payload);
        onSubmit(payload);
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Cập nhật Cửa hàng' : 'Đăng ký Cửa hàng mới'}
            description={initialData ? 'Cập nhật thông tin và trạng thái cửa hàng.' : 'Đăng ký chi nhánh nhượng quyền mới.'}
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Hủy
                    </Button>
                    <Button type="submit" onClick={handleSubmit(onSubmitForm)} disabled={isLoading} className="min-w-[120px]">
                        {isLoading ? 'Đang lưu...' : (initialData ? 'Cập nhật' : 'Đăng ký')}
                    </Button>
                </div>
            }
        >
            <form className="space-y-8">
                {/* Section 1: Basic Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-300 font-medium pb-2 border-b border-zinc-800">
                        <StoreIcon size={18} className="text-amber-600" />
                        <h3>Thông tin cửa hàng</h3>
                    </div>

                    <div className="grid gap-5">
                        <Input
                            label="Tên cửa hàng"
                            placeholder="VD: Chi nhánh Quận 1"
                            icon={<StoreIcon size={18} className="text-gray-400" />}
                            error={errors.name?.message}
                            {...register('name')}
                        />

                        <Input
                            label="Địa chỉ"
                            placeholder="VD: 123 Nguyễn Huệ, Q.1, TP.HCM"
                            icon={<MapPin size={18} className="text-gray-400" />}
                            error={errors.address?.message}
                            {...register('address')}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Số điện thoại"
                                placeholder="VD: 0901234567"
                                icon={<Phone size={18} className="text-gray-400" />}
                                {...register('phone')}
                            />
                            <Input
                                label="Email"
                                placeholder="VD: store@email.com"
                                icon={<Mail size={18} className="text-gray-400" />}
                                error={errors.email?.message}
                                {...register('email')}
                            />
                        </div>

                        <Input
                            label="Sức chứa kho (kg/đv)"
                            type="number"
                            min="0"
                            placeholder="VD: 500"
                            icon={<Box size={18} className="text-gray-400" />}
                            error={errors.warehouseCapacity?.message}
                            {...register('warehouseCapacity', { valueAsNumber: true })}
                        />
                    </div>
                </div>

                {/* Section 2: Manager Assignment */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-300 font-medium pb-2 border-b border-zinc-800">
                        <User size={18} className="text-amber-600" />
                        <h3>Gán Quản lý</h3>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                            Chọn người quản lý cửa hàng
                        </label>
                        <select
                            value={selectedManagerId}
                            onChange={(e) => setSelectedManagerId(e.target.value)}
                            className="w-full h-10 px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        >
                            <option value="">-- Chọn quản lý (tùy chọn) --</option>
                            {isLoadingUsers ? (
                                <option disabled>Đang tải...</option>
                            ) : (
                                users.map(user => (
                                    <option key={user.id} value={String(user.id)}>
                                        {user.fullName || user.username} — {user.roleName} {user.email ? `(${user.email})` : ''}
                                    </option>
                                ))
                            )}
                        </select>
                        <p className="text-xs text-gray-500">
                            Người được chọn sẽ có quyền quản lý cửa hàng này và tạo đơn hàng.
                        </p>
                        {initialData?.managerName && (
                            <p className="text-xs text-amber-500 mt-1">
                                Quản lý hiện tại: <strong>{initialData.managerName}</strong>
                            </p>
                        )}
                    </div>
                </div>

                {/* Section 3: Status */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-300 font-medium pb-2 border-b border-zinc-800">
                        <Activity size={18} className="text-amber-600" />
                        <h3>Trạng thái hoạt động</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { value: true, label: 'Hoạt động', color: 'emerald' },
                            { value: false, label: 'Ngừng hoạt động', color: 'red' }
                        ].map((opt) => (
                            <label
                                key={String(opt.value)}
                                className={`
                                    relative flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all
                                    ${isActive === opt.value
                                        ? 'border-amber-500 bg-amber-500/10'
                                        : 'border-zinc-800 hover:border-zinc-700'
                                    }
                                `}
                            >
                                <input
                                    type="radio"
                                    checked={isActive === opt.value}
                                    onChange={() => setIsActive(opt.value)}
                                    className="sr-only"
                                />
                                <span className="text-sm font-medium">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </form>
        </Drawer>
    );
};
