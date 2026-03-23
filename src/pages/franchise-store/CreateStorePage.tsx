import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store as StoreIcon, MapPin, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { storeApi } from '../../services/store.api';

const createStoreSchema = z.object({
    name: z.string().min(1, 'Vui lòng nhập tên cửa hàng'),
    location: z.string().min(1, 'Vui lòng nhập địa chỉ'),
    phone: z.string().regex(/^(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại không hợp lệ').min(1, 'Vui lòng nhập số điện thoại'),
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
        },
    });


    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await storeApi.createStore({
                name: data.name,
                address: data.location,
                phone: data.phone,
                isActive: data.isActive,
            });
            toast.success('Đã tạo cửa hàng thành công');
            navigate('/dashboard/franchise-store');
        } catch (error: any) {
            console.error('Error creating store:', error);
            const message = error.response?.data?.message || 'Không thể tạo cửa hàng. Vui lòng thử lại sau.';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/dashboard/franchise-store')}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Đăng ký Cửa hàng mới</h1>
                    <p className="text-gray-400">Thêm một chi nhánh nhượng quyền mới vào hệ thống.</p>
                </div>
            </div>

            <Card className="p-8 bg-zinc-900/50 border-zinc-800">
                <form id="create-store-form" onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-300 block mb-2">Tên Cửa hàng *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <StoreIcon size={16} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-zinc-950 border-zinc-700 text-white ${errors.name ? 'border-red-500 focus:ring-red-500/20' : 'focus:ring-amber-500/20'}`}
                                    placeholder="VD: Chi nhánh Quận 1"
                                    {...register('name')}
                                />
                            </div>
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-300 block mb-2">Địa chỉ *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin size={16} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-zinc-950 border-zinc-700 text-white ${errors.location ? 'border-red-500 focus:ring-red-500/20' : 'focus:ring-amber-500/20'}`}
                                    placeholder="VD: 123 Nguyễn Huệ, TP.HCM"
                                    {...register('location')}
                                />
                            </div>
                            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-300 block mb-2">Số điện thoại *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400 p-1">📞</span>
                                </div>
                                <input
                                    type="text"
                                    className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-zinc-950 border-zinc-700 text-white ${errors.phone ? 'border-red-500 focus:ring-red-500/20' : 'focus:ring-amber-500/20'}`}
                                    placeholder="VD: 0912345678 or 84912345678"
                                    {...register('phone')}
                                />
                            </div>
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                        </div>


                    </div>

                    <div className="flex justify-end pt-6 border-t border-zinc-800">
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold px-8 h-11"
                        >
                            {!isSubmitting && <Save size={18} className="mr-2" />}
                            Đăng ký Cửa hàng
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
