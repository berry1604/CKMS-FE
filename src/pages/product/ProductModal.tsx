import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { ProductResponse } from '../../types/product';
import { Package, Tag } from 'lucide-react';

const productSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    categoryId: z.number().min(1, 'Category ID is required'),
    price: z.number().min(0, 'Price must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    description: z.string().optional()
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ProductFormData) => void;
    initialData?: ProductResponse | null;
    isLoading?: boolean;
}

export const ProductModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: ProductModalProps) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            categoryId: 1,
            price: 0,
            unit: 'KG',
            description: ''
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                categoryId: initialData.category?.id || 1,
                price: initialData.price,
                unit: initialData.unit || 'KG',
                description: initialData.description || ''
            });
        } else {
            reset({
                name: '',
                categoryId: 1,
                price: 0,
                unit: 'KG',
                description: ''
            });
        }
    }, [initialData, reset, isOpen]);

    const onSubmitForm = (data: ProductFormData) => {
        onSubmit(data);
    };

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="h-12 px-8 rounded-2xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 font-black uppercase text-[10px] tracking-widest transition-all"
            >
                Hủy
            </Button>
            <Button
                type="submit"
                form="product-form"
                disabled={isLoading}
                className="h-12 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black uppercase text-[10px] tracking-widest transition-all duration-300 border-0 shadow-2xl shadow-amber-900/40"
            >
                {isLoading ? 'Đang lưu...' : (initialData ? 'Cập nhật' : 'Thêm mới')}
            </Button>
        </div>
    );

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            description={initialData ? 'Cập nhật thông tin và danh mục sản phẩm.' : 'Khởi tạo bản ghi sản phẩm mới trong hệ thống.'}
            width="max-w-md"
            footer={footer}
        >
            <form id="product-form" onSubmit={handleSubmit(onSubmitForm)} className="space-y-10 py-2">

                {/* Basic Info */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <Package size={18} className="text-amber-500" />
                        </div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Thông tin cơ bản</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Tên sản phẩm</label>
                            <Input
                                placeholder="VD: Cà phê Signature"
                                icon={<Package size={18} className="text-zinc-600" />}
                                error={errors.name?.message}
                                {...register('name')}
                                className="h-14 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Mô tả chi tiết</label>
                            <Input
                                placeholder="Mô tả ngắn gọn về sản phẩm..."
                                error={errors.description?.message}
                                {...register('description')}
                                className="h-14 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Đơn vị tính</label>
                                <Input
                                    placeholder="KG, Cái, Chai..."
                                    error={errors.unit?.message}
                                    {...register('unit')}
                                    className="h-14 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Mã danh mục</label>
                                <Input
                                    type="number"
                                    placeholder="1"
                                    icon={<Tag size={16} className="text-zinc-600" />}
                                    error={errors.categoryId?.message}
                                    {...register('categoryId', { valueAsNumber: true })}
                                    className="h-14 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Giá bán niên yết (VNĐ)</label>
                            <Input
                                type="number"
                                step="1000"
                                placeholder="0"
                                icon={<span className="text-zinc-600 font-bold">₫</span>}
                                error={errors.price?.message}
                                {...register('price', { valueAsNumber: true })}
                                className="h-14 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300 font-mono"
                            />
                        </div>
                    </div>
                </div>

            </form>
        </Drawer>
    );
};
