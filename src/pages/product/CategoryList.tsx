import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Tag, Layers, ChevronRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoryApi } from '../../services/category.api';
import type { CategoryResponse } from '../../types/category';
import { cn } from '../../utils/classNames';
import { Button } from '../../components/ui/Button';
import productHeaderBg from '../../assets/product_catalog_bg.png';

export const CategoryList: React.FC = () => {
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryApi.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            // Error toast handled by interceptor for 403, etc.
            if ((error as any).response?.status !== 403 && (error as any).response?.status !== 401) {
                toast.error('Không thể tải danh sách danh mục');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const openCreateModal = () => {
        navigate('/products/categories/create');
    };

    const openEditModal = (category: CategoryResponse) => {
        navigate(`/products/categories/${category.id}/edit`, { state: { category } });
    };

    const openDeleteModal = (category: CategoryResponse) => {
        setSelectedCategory(category);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedCategory) return;

        try {
            await categoryApi.delete(selectedCategory.id);
            toast.success('Đã xóa danh mục thành công');
            setIsDeleteModalOpen(false);
            fetchCategories();
        } catch (error: any) {
            console.error('Failed to delete category:', error);
            if (error.response?.status !== 403 && error.response?.status !== 401) {
                toast.error(error.response?.data?.message || 'Xóa danh mục thất bại');
            }
        }
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-[1400px] mx-auto pb-20 animate-in fade-in duration-700">
            {/* Cinematic Header (Condensed) */}
            <div className="relative h-[250px] -mx-4 -mt-8 mb-12 overflow-hidden group/header">
                <div className="absolute inset-0 bg-[var(--bg-root)]">
                    <img
                        src={productHeaderBg}
                        alt="Category Cover"
                        className="w-full h-full object-cover opacity-80 scale-105 group-hover/header:scale-110 transition-transform duration-[3s] ease-out shadow-inner"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-root)] via-[var(--bg-root)]/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-root)] via-transparent to-[var(--bg-root)]"></div>
                </div>

                <div className="absolute bottom-8 left-10 right-10 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30">
                                <Layers size={20} />
                            </div>
                            <h1 className="text-3xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter">
                                Danh mục <span className="text-amber-400">Sản phẩm</span>
                            </h1>
                        </div>
                        <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] text-[9px] italic flex items-center gap-2">
                            <Sparkles size={10} className="text-amber-400" />
                            Quản lý phân loại thực đơn ELITE
                        </p>
                    </div>

                    <Button
                        onClick={openCreateModal}
                        className="bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest px-8 py-5 h-auto rounded-2xl shadow-[0_10px_25px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95 transition-all italic border-0"
                    >
                        <Plus size={20} className="mr-2" strokeWidth={3} /> Thêm Danh mục
                    </Button>
                </div>
            </div>

            {/* Glass Toolbar */}
            <div className="bg-[var(--bg-card)]/60 backdrop-blur-3xl rounded-[2rem] border border-[var(--border-primary)] p-5 mb-8 shadow-sm">
                <div className="relative w-full md:w-[450px] group">
                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none transition-transform duration-500 group-focus-within:translate-x-1">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)] group-focus-within:text-amber-400">
                            <Search size={18} />
                        </div>
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm danh mục..."
                        className="w-full h-12 pl-14 pr-6 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-amber-500/50 rounded-xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/30 focus:outline-none transition-all duration-300"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* List Components */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-20 text-center bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[2rem] border border-[var(--border-primary)]">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
                        <p className="mt-4 text-[var(--text-secondary)] font-black uppercase tracking-widest text-[10px] italic">Đang tải danh mục...</p>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="p-20 text-center bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[2rem] border border-[var(--border-primary)]">
                        <p className="text-[var(--text-secondary)] font-black uppercase tracking-widest text-[10px] italic">Không tìm thấy danh mục nào</p>
                    </div>
                ) : (
                    filteredCategories.map((category) => (
                        <div
                            key={category.id}
                            className="group flex flex-col md:flex-row items-center justify-between p-6 bg-[var(--bg-card)]/80 backdrop-blur-2xl rounded-[2rem] border border-[var(--border-primary)] transition-all duration-500 hover:border-amber-500/30 hover:shadow-xl hover:-translate-y-1"
                        >
                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)]/40 group-hover:text-amber-500 transition-colors shadow-inner border border-[var(--border-primary)]">
                                    <Tag size={24} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter group-hover:text-amber-400 transition-colors">
                                            {category.name}
                                        </h3>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest italic border",
                                            category.status === 'ACTIVE'
                                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                : "bg-[var(--bg-root)] text-[var(--text-secondary)]/40 border-[var(--border-primary)]"
                                        )}>
                                            {category.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                                        </span>
                                    </div>
                                    <p className="text-[var(--text-secondary)]/60 text-sm font-medium line-clamp-1 max-w-md italic">
                                        {category.description || 'Không có mô tả cho danh mục này'}
                                    </p>
                                    <div className="flex items-center gap-2 pt-1">
                                        <span className="text-[10px] font-mono text-[var(--text-secondary)]/30">ID: #{String(category.id).padStart(3, '0')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-6 md:mt-0 w-full md:w-auto">
                                <button
                                    onClick={() => openEditModal(category)}
                                    className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-[var(--bg-root)] text-[var(--text-secondary)]/60 hover:text-amber-400 border border-[var(--border-primary)] hover:border-amber-500/30 transition-all font-black uppercase tracking-widest text-[10px] italic flex items-center justify-center gap-2 shadow-inner"
                                >
                                    <Pencil size={14} /> Chỉnh sửa
                                </button>
                                <button
                                    onClick={() => openDeleteModal(category)}
                                    className="w-12 h-12 rounded-xl bg-[var(--bg-root)] text-[var(--text-secondary)]/40 hover:text-rose-500 border border-[var(--border-primary)] hover:border-rose-500/30 transition-all flex items-center justify-center shadow-inner"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <div className="ml-2 hidden md:block">
                                    <ChevronRight size={20} className="text-[var(--text-secondary)]/20 group-hover:text-amber-500/50 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Elite Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-primary)] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)] text-rose-500">
                                <Trash2 size={36} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-2xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter mb-3">Xác nhận xóa</h2>
                            <p className="text-[var(--text-secondary)] font-medium italic mb-10 leading-relaxed">
                                Bạn có chắc chắn muốn xóa danh mục <span className="text-rose-400 font-black">{selectedCategory?.name}</span>? <br />
                                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]/30">Hành động này không thể hoàn tác</span>
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 h-16 rounded-[1.25rem] bg-[var(--bg-root)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] transition-all font-black uppercase tracking-widest text-xs italic"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 h-16 rounded-[1.25rem] bg-rose-600 text-black hover:bg-rose-500 transition-all font-black uppercase tracking-widest text-xs italic shadow-[0_15px_30px_rgba(225,29,72,0.3)]"
                                >
                                    Đồng ý xóa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
