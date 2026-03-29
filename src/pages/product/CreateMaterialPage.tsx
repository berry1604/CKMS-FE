import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, AlertCircle, Sparkles, ChevronRight, Ruler, Wheat } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { materialApi } from '../../services/material.api';
import type { MaterialResponse } from '../../types/material';

const createMaterialSchema = z.object({
    name: z.string().min(1, 'Tên nguyên liệu là bắt buộc').trim(),
    unit: z.enum(['KG', 'GRAM', 'LITER', 'ML', 'PIECE']),
});

type CreateMaterialFormData = z.infer<typeof createMaterialSchema>;

export const CreateMaterialPage = () => {
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
    } = useForm<CreateMaterialFormData>({
        resolver: zodResolver(createMaterialSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            unit: 'KG',
        }
    });

    const location = useLocation();
    const materialFromState = (location.state as any)?.material as MaterialResponse | undefined;

    useEffect(() => {
        const fetchMaterial = async () => {
            if (!isEditMode) return;

            if (materialFromState) {
                reset({
                    name: materialFromState.name,
                    unit: materialFromState.unit as any,
                });
                setIsLoading(false);
                return;
            }

            try {
                const data = await materialApi.getById(Number(id));
                reset({
                    name: data.name,
                    unit: data.unit as any,
                });
            } catch (error) {
                console.error('Failed to fetch material details:', error);
                toast.error('Không thể tải dữ liệu nguyên liệu');
                navigate('/products/materials');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMaterial();
    }, [id, isEditMode, reset, navigate, materialFromState]);

    const onSubmit = async (data: CreateMaterialFormData) => {
        setBackendError(null);
        setIsSubmitting(true);
        try {
            if (isEditMode) {
                await materialApi.update(Number(id), data);
                toast.success('Cập nhật nguyên liệu thành công!');
            } else {
                await materialApi.create(data);
                toast.success('Tạo nguyên liệu thành công!');
            }
            navigate('/products/materials');
        } catch (error: any) {
            console.error('Create material error:', error);
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
                    src="/Users/phunghuyphuoc/.gemini/antigravity/brain/5ad3745d-382e-481d-8167-b732c447a69b/luxury_steakhouse_bg_1773024882624.png"
                    className="w-full h-full object-cover scale-105 opacity-40 blur-[1px] text-transparent"
                    alt="Background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-root)]/60 to-[var(--bg-root)]"></div>

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12 max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 text-amber-500/80 mb-4 animate-in fade-in slide-in-from-left duration-700">
                        <button
                            onClick={() => navigate('/products/materials')}
                            className="hover:text-amber-400 transition-colors flex items-center gap-1 text-sm font-medium"
                        >
                            <ArrowLeft size={16} />
                            Quay lại nguyên liệu
                        </button>
                        <ChevronRight size={14} className="text-[var(--text-secondary)]/20" />
                        <span className="text-[var(--text-secondary)]/60 text-sm">Kho nguyên liệu</span>
                    </div>

                    <div className="flex items-end justify-between gap-6">
                        <div className="animate-in fade-in slide-in-from-bottom duration-700">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                                    <Wheat className="text-amber-500" size={24} />
                                </div>
                                <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] italic uppercase">
                                    {isEditMode ? 'CẬP NHẬT' : 'THÊM MỚI'} <span className="text-amber-500">NGUYÊN LIỆU</span>
                                </h1>
                            </div>
                            <p className="text-[var(--text-secondary)]/60 max-w-xl">
                                {isEditMode
                                    ? 'Chỉnh sửa các thông số kỹ thuật và đơn vị tính của nguyên liệu sản xuất.'
                                    : 'Đăng ký nguyên liệu thô mới vào hệ thống quản lý kho và sản xuất.'}
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
                                    {/* Material Name */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] ml-1">Tên nguyên liệu *</label>
                                        <div className="relative group/field">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Wheat size={18} className="text-[var(--text-secondary)]/40 group-focus-within/field:text-amber-500/50 transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                {...register('name')}
                                                className={`w-full pl-12 pr-4 h-14 bg-[var(--bg-root)]/50 border rounded-2xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-amber-500/10 ${errors.name ? 'border-red-500/50' : 'border-[var(--border-primary)] hover:border-amber-500/30'
                                                    } text-[var(--text-primary)] font-medium placeholder:text-[var(--text-secondary)]/30`}
                                                placeholder="VD: Thịt bò Wagyu"
                                            />
                                        </div>
                                        {errors.name && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-tight">{errors.name.message}</p>}
                                    </div>

                                    {/* Unit */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-[0.2em] ml-1">Đơn vị tính *</label>
                                        <div className="relative group/field">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Ruler size={18} className="text-[var(--text-secondary)]/40 group-focus-within/field:text-amber-500/50 transition-colors" />
                                            </div>
                                            <select
                                                {...register('unit')}
                                                className={`w-full pl-12 pr-10 h-14 bg-[var(--bg-root)]/50 border rounded-2xl text-sm appearance-none transition-all focus:outline-none focus:ring-4 focus:ring-amber-500/10 ${errors.unit ? 'border-red-500/50' : 'border-[var(--border-primary)] hover:border-amber-500/30'
                                                    } text-[var(--text-primary)] font-medium`}
                                            >
                                                <option value="KG" className="bg-[var(--bg-card)]">Kilogram (KG)</option>
                                                <option value="GRAM" className="bg-[var(--bg-card)]">Gram (GRAM)</option>
                                                <option value="LITER" className="bg-[var(--bg-card)]">Lít (LITER)</option>
                                                <option value="ML" className="bg-[var(--bg-card)]">Millilit (ML)</option>
                                                <option value="PIECE" className="bg-[var(--bg-card)]">Cái/Miếng (PIECE)</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                <ChevronRight size={14} className="rotate-90 text-[var(--text-secondary)]/40" />
                                            </div>
                                        </div>
                                        {errors.unit && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 uppercase tracking-tight">{errors.unit.message}</p>}
                                    </div>
                                </div>

                                <div className="pt-10 flex flex-col sm:flex-row justify-end gap-4 border-t border-[var(--border-primary)]/40">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => navigate('/products/materials')}
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
                                Tiêu chuẩn nhập liệu
                            </h3>
                            <ul className="space-y-4 text-sm text-[var(--text-secondary)]/60">
                                <li className="flex gap-3">
                                    <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></div>
                                    <p><span className="text-[var(--text-primary)]">Đơn vị tính</span> đồng nhất giúp việc tính toán định lượng và kiểm kho chính xác.</p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></div>
                                    <p><span className="text-[var(--text-primary)]">Tên nguyên liệu</span> nên bao gồm thông tin chủng loại để dễ phân biệt (vd: Sữa tươi Long Thành).</p>
                                </li>
                            </ul>
                        </div>

                        <div className="backdrop-blur-xl bg-[var(--text-primary)]/[0.02] border border-[var(--border-primary)]/40 rounded-2xl p-6 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-primary)]/40">
                                <Wheat className="text-amber-500/60" size={32} />
                            </div>
                            <h4 className="text-[var(--text-primary)] font-semibold mb-1">Mẹo quản lý</h4>
                            <p className="text-[var(--text-secondary)]/40 text-xs leading-relaxed">
                                Kiểm tra kỹ các đơn vị đo lường cơ bản trước khi lưu để tránh sai lệch trong báo cáo định lượng sau này.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
