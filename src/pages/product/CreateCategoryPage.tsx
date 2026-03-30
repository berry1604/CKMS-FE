import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Tag, AlertCircle, Activity, FileText, Sparkles, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { categoryApi } from '../../services/category.api';
import type { CategoryResponse } from '../../types/category';

const createCategorySchema = z.object({
    name: z.string().min(1, 'Tên danh mục là bắt buộc').trim(),
    description: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE'])
});

type CreateCategoryFormData = z.infer<typeof createCategorySchema>;

export const CreateCategoryPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [backendError, setBackendError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid }
    } = useForm<CreateCategoryFormData>({
        resolver: zodResolver(createCategorySchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            description: '',
            status: 'ACTIVE'
        }
    });

    const location = useLocation();
    const categoryFromState = (location.state as any)?.category as CategoryResponse | undefined;

    useEffect(() => {
        const fetchCategory = async () => {
            if (!isEditMode) return;

            if (categoryFromState) {
                reset({
                    name: categoryFromState.name,
                    description: categoryFromState.description || '',
                    status: (categoryFromState.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE'
                });
                setIsLoading(false);
                return;
            }

            try {
                const data = await categoryApi.getById(Number(id));
                reset({
                    name: data.name,
                    description: data.description || '',
                    status: (data.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE'
                });
            } catch (error) {
                console.error('Failed to fetch category details:', error);
                toast.error('Không thể tải dữ liệu danh mục');
                navigate('/products/categories');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategory();
    }, [id, isEditMode, reset, navigate, categoryFromState]);

    const onSubmit = async (data: CreateCategoryFormData) => {
        setBackendError(null);
        setIsSubmitting(true);
        try {
            if (isEditMode) {
                await categoryApi.update(Number(id), data);
                toast.success('Cập nhật danh mục thành công');
            } else {
                await categoryApi.create(data);
                toast.success('Tạo danh mục thành công');
            }
            navigate('/products/categories');
        } catch (error: any) {
            console.error('Create category error:', error);
            const message = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
            setBackendError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)]">
            {/* Cinematic Header */}
            <div className="relative h-64 w-full overflow-hidden">
                <img
                    src="/Users/phunghuyphuoc/.gemini/antigravity/brain/5ad3745d-382e-481d-8167-b732c447a69b/product_catalog_bg_1773026965335.png"
                    className="w-full h-full object-cover scale-105 opacity-40 text-transparent"
                    alt="Background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-root)]/60 to-[var(--bg-root)]"></div>

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12 max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 text-amber-500/80 mb-4 animate-in fade-in slide-in-from-left duration-700">
                        <button
                            onClick={() => navigate('/products/categories')}
                            className="hover:text-amber-400 transition-colors flex items-center gap-1 text-sm font-medium"
                        >
                            <ArrowLeft size={16} />
                            Quay lại danh sách
                        </button>
                        <ChevronRight size={14} className="text-[var(--text-secondary)]/20" />
                        <span className="text-[var(--text-secondary)]/60 text-sm">Quản lý danh mục</span>
                    </div>

                    <div className="flex items-end justify-between gap-6">
                        <div className="animate-in fade-in slide-in-from-bottom duration-700">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                                    <Tag className="text-amber-500" size={24} />
                                </div>
                                <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] italic">
                                    {isEditMode ? 'CHỈNH SỬA' : 'THÊM MỚI'} <span className="text-amber-500">DANH MỤC</span>
                                </h1>
                            </div>
                            <p className="text-[var(--text-secondary)]/60 max-w-xl">
                                {isEditMode
                                    ? 'Cập nhật thông tin chi tiết cho danh mục sản phẩm hiện có.'
                                    : 'Bắt đầu tạo một danh mục mới để quản lý phân loại sản phẩm hiệu quả hơn.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 -mt-10 relative z-10 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="backdrop-blur-xl bg-[var(--bg-card)]/40 border border-[var(--border-primary)] rounded-[40px] p-10 shadow-2xl relative overflow-hidden group animate-in fade-in zoom-in-95 duration-1000">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Sparkles size={120} className="text-amber-500" />
                            </div>

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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] ml-1">Tên danh mục *</label>
                                        <div className="relative group/field">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Tag size={18} className="text-[var(--text-secondary)]/40 group-focus-within/field:text-amber-500/50 transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                {...register('name')}
                                                className={`w-full pl-12 pr-4 h-14 bg-[var(--bg-root)]/50 border rounded-2xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-amber-500/10 ${errors.name ? 'border-red-500/50' : 'border-[var(--border-primary)] hover:border-amber-500/30'
                                                    } text-[var(--text-primary)] font-medium placeholder:text-[var(--text-secondary)]/30`}
                                                placeholder="VD: Đồ uống"
                                            />
                                        </div>
                                        {errors.name && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-tight">{errors.name.message}</p>}
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] ml-1">Trạng thái *</label>
                                        <div className="relative group/field">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Activity size={18} className="text-[var(--text-secondary)]/40 group-focus-within/field:text-amber-500/50 transition-colors" />
                                            </div>
                                            <select
                                                {...register('status')}
                                                className={`w-full pl-12 pr-10 h-14 bg-[var(--bg-root)]/50 border rounded-2xl text-sm appearance-none transition-all focus:outline-none focus:ring-4 focus:ring-amber-500/10 ${errors.status ? 'border-red-500/50' : 'border-[var(--border-primary)] hover:border-amber-500/30'
                                                    } text-[var(--text-primary)] font-medium`}
                                            >
                                                <option value="ACTIVE" className="bg-[var(--bg-card)]">Hoạt động</option>
                                                <option value="INACTIVE" className="bg-[var(--bg-card)]">Ngưng hoạt động</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                <ChevronRight size={14} className="rotate-90 text-[var(--text-secondary)]/40" />
                                            </div>
                                        </div>
                                        {errors.status && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-tight">{errors.status.message}</p>}
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] ml-1">Mô tả chi tiết</label>
                                        <div className="relative group/field">
                                            <div className="absolute top-4 left-4 flex items-start pointer-events-none">
                                                <FileText size={18} className="text-[var(--text-secondary)]/40 group-focus-within/field:text-amber-500/50 transition-colors" />
                                            </div>
                                            <textarea
                                                {...register('description')}
                                                rows={4}
                                                className={`w-full pl-12 pr-4 py-4 bg-[var(--bg-root)]/50 border rounded-3xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-amber-500/10 resize-none ${errors.description ? 'border-red-500/50' : 'border-[var(--border-primary)] hover:border-amber-500/30'
                                                    } text-[var(--text-primary)] font-medium placeholder:text-[var(--text-secondary)]/30 min-h-[120px]`}
                                                placeholder="Nhập mô tả chi tiết cho danh mục này..."
                                            />
                                        </div>
                                        {errors.description && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-tight">{errors.description.message}</p>}
                                    </div>
                                </div>

                                <div className="pt-10 flex flex-col sm:flex-row justify-end gap-4 border-t border-[var(--border-primary)]/40">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => navigate('/products/categories')}
                                        className="h-14 px-8 rounded-2xl text-[var(--text-secondary)]/60 hover:text-[var(--text-primary)] font-black uppercase text-[10px] tracking-widest transition-all"
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
                                                Đang lưu...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <Save size={18} />
                                                {isEditMode ? 'Cập nhật' : 'Hoàn tất'}
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>


                    {/* Right Column: Tips/Preview */}
                    <div className="space-y-6">
                        <div className="backdrop-blur-xl bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                            <h3 className="text-amber-500 font-bold mb-4 flex items-center gap-2">
                                <Sparkles size={18} />
                                Ghi chú quan trọng
                            </h3>
                            <ul className="space-y-4 text-sm text-[var(--text-secondary)]/60">
                                <li className="flex gap-3">
                                    <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></div>
                                    <p><span className="text-[var(--text-primary)]">Tên danh mục</span> nên ngắn gọn, dễ nhớ để hiển thị tốt trên thực đơn.</p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></div>
                                    <p><span className="text-[var(--text-primary)]">Trạng thái</span> Ngưng hoạt động sẽ ẩn các sản phẩm thuộc danh mục này khỏi cửa hàng.</p>
                                </li>
                            </ul>
                        </div>

                        <div className="backdrop-blur-xl bg-[var(--text-primary)]/[0.02] border border-[var(--border-primary)]/40 rounded-2xl p-6 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-primary)]/40">
                                <Tag className="text-amber-500/60" size={32} />
                            </div>
                            <h4 className="text-[var(--text-primary)] font-semibold mb-1">Mẹo nhỏ</h4>
                            <p className="text-[var(--text-secondary)]/40 text-xs leading-relaxed">
                                Sử dụng mô tả chi tiết giúp nhân viên dễ dàng phân loại và tìm kiếm sản phẩm trong hệ thống.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


