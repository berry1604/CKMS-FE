import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Package, Tag, AlertCircle, DollarSign, Box } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { productApi } from '../../services/product.api';
import { categoryApi } from '../../services/category.api';
import { useProducts } from '../../hooks/useProducts';
import type { CategoryResponse } from '../../types/category';

const createProductSchema = z.object({
    name: z.string().min(1, 'Tên là bắt buộc'),
    categoryId: z.number().min(1, 'Mã danh mục là bắt buộc'),
    price: z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
    unit: z.string().min(1, 'Đơn vị là bắt buộc'),
    description: z.string().optional()
});

type CreateProductFormData = z.infer<typeof createProductSchema>;

export const CreateProductPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);
    const { refetch } = useProducts(10); // Optional, we can just navigate, but refetching is good

    // Fetch categories for dropdown
    const [categories, setCategories] = useState<CategoryResponse[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryApi.getAll();
                // Filter only active categories if backend supports it, else just map
                setCategories(data);
            } catch (error) {
                console.error('Không thể tải danh mục', error);
                toast.error('Không thể tải danh mục để lựa chọn');
            }
        };
        fetchCategories();
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset
    } = useForm<CreateProductFormData>({
        resolver: zodResolver(createProductSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            categoryId: 0, // Will force user to select one
            price: 0,
            unit: 'KG',
            description: ''
        }
    });

    const onSubmit = async (data: CreateProductFormData) => {
        if (!data.categoryId || data.categoryId === 0) {
            toast.error("Vui lòng chọn danh mục!");
            return;
        }

        setBackendError(null);
        setIsSubmitting(true);
        try {
            await productApi.createProduct(data);
            toast.success('Tạo sản phẩm thành công');
            reset();
            refetch(); // Trigger a refetch in cache if using a global store or context
            navigate('/products');
        } catch (error: any) {
            console.error('Create product error:', error);
            const message = error.response?.data?.message || 'Không thể tạo sản phẩm. Vui lòng thử lại.';
            setBackendError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-10 max-w-4xl mx-auto pb-20 pt-4">
            {/* Header */}
            <div className="flex items-center gap-6 animate-in fade-in slide-in-from-left-4 duration-700">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/products')}
                    className="h-12 w-12 rounded-2xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <Package size={24} className="text-amber-500" />
                        </div>
                        Thêm sản phẩm mới
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1 font-medium uppercase tracking-[0.2em] ml-1">Khởi tạo bản ghi sản phẩm trong hệ thống</p>
                </div>
            </div>

            <Card className="p-10 border-white/5 bg-zinc-900/40 backdrop-blur-xl rounded-[40px] shadow-2xl relative overflow-hidden group animate-in fade-in zoom-in-95 duration-1000">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>

                {backendError && (
                    <div className="mb-10 p-5 bg-red-500/5 border border-red-500/10 text-red-500 rounded-2xl flex items-start gap-4 animate-shake">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-black text-[10px] uppercase tracking-widest">Thao tác thất bại</h3>
                            <p className="text-xs mt-1 font-medium">{backendError}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Tên sản phẩm *</label>
                                <Input
                                    placeholder="VD: Cà phê Signature"
                                    icon={<Package size={18} className="text-zinc-600" />}
                                    error={errors.name?.message}
                                    {...register('name')}
                                    className="h-14 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Danh mục sản phẩm *</label>
                                <div className="relative group/field">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Tag size={18} className="text-zinc-600 group-focus-within/field:text-amber-500/50 transition-colors" />
                                    </div>
                                    <select
                                        className={`w-full pl-12 pr-4 h-14 bg-white/5 border border-white/5 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 text-zinc-100 rounded-2xl appearance-none transition-all duration-300 text-sm font-medium ${errors.categoryId ? 'border-red-500/50 ring-red-500/10' : ''}`}
                                        {...register('categoryId', { valueAsNumber: true })}
                                    >
                                        <option value={0} disabled className="bg-zinc-900">-- Chọn danh mục --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id} className="bg-zinc-900">
                                                {cat.categoryId ? `[${cat.categoryId}] ${cat.name}` : cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <Box size={14} className="text-zinc-600" />
                                    </div>
                                </div>
                                {errors.categoryId && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-tight">{errors.categoryId.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Giá bán niên yết (VNĐ) *</label>
                                <Input
                                    type="number"
                                    step="1000"
                                    placeholder="0"
                                    icon={<DollarSign size={18} className="text-zinc-600" />}
                                    error={errors.price?.message}
                                    {...register('price', { valueAsNumber: true })}
                                    className="h-14 bg-white/5 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300 font-mono"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Đơn vị tính *</label>
                                <div className="relative group/field">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Box size={18} className="text-zinc-600 group-focus-within/field:text-amber-500/50 transition-colors" />
                                    </div>
                                    <select
                                        className={`w-full pl-12 pr-4 h-14 bg-white/5 border border-white/5 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 text-zinc-100 rounded-2xl appearance-none transition-all duration-300 text-sm font-medium ${errors.unit ? 'border-red-500/50 ring-red-500/10' : ''}`}
                                        {...register('unit')}
                                    >
                                        <option value="KG" className="bg-zinc-900">KG</option>
                                        <option value="GRAM" className="bg-zinc-900">GRAM</option>
                                        <option value="LITER" className="bg-zinc-900">LITER</option>
                                        <option value="ML" className="bg-zinc-900">ML</option>
                                        <option value="PIECE" className="bg-zinc-900">PIECE</option>
                                        <option value="BOTTLE" className="bg-zinc-900">BOTTLE</option>
                                        <option value="BOX" className="bg-zinc-900">BOX</option>
                                    </select>
                                </div>
                                {errors.unit && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-tight">{errors.unit.message}</p>}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Mô tả sản phẩm</label>
                                <textarea
                                    className={`w-full px-5 py-4 bg-white/5 border border-white/5 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 text-zinc-100 rounded-3xl transition-all duration-300 text-sm placeholder:text-zinc-700 min-h-[120px] resize-none ${errors.description ? 'border-red-500/50 ring-red-500/10' : ''}`}
                                    placeholder="Nhập mô tả chi tiết về sản phẩm..."
                                    {...register('description')}
                                />
                                {errors.description && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-tight">{errors.description.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-end gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate('/products')}
                            disabled={isSubmitting}
                            className="h-14 px-10 rounded-2xl text-zinc-400 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !isValid}
                            className="h-14 px-10 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black uppercase text-xs tracking-widest transition-all duration-500 border-0 shadow-2xl shadow-amber-900/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    Đang xử lý...
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Save size={18} />
                                    Tạo sản phẩm
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
