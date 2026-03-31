import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Package, Tag, Edit2, Trash2, ChevronLeft, ChevronRight, ChefHat, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { productApi } from '../../services/product.api';
import type { ProductResponse as Product } from '../../types/product';
import type { RecipeResponse } from '../../types/recipe';
import { ProductModal } from './ProductModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useProducts } from '../../hooks/useProducts';
import { recipeApi } from '../../services/recipe.api';
import toast from 'react-hot-toast';
import { cn } from '../../utils/classNames';
import productHeaderBg from '../../assets/product_catalog_bg.png';

export const ProductCatalog = () => {
    const navigate = useNavigate();
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Custom Web Hook
    const {
        products,
        pageableInfo,
        isLoading,
        page,
        setPage,
        setSearch,
        refetch
    } = useProducts(10);

    // Use a local state for input delay (debounce)
    const [localSearch, setLocalSearch] = useState('');
    const [recipeMap, setRecipeMap] = useState<Record<number, RecipeResponse | null>>({});

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearch(localSearch);
            setPage(0); // Reset to page 0 on search
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [localSearch, setSearch, setPage]);

    // Fetch recipes for all products in current page
    useEffect(() => {
        if (products.length === 0) return;
        const fetchRecipes = async () => {
            const map: Record<number, RecipeResponse | null> = {};
            await Promise.allSettled(
                products.map(async (p) => {
                    try {
                        const res = await recipeApi.getActiveRecipe(p.id);
                        map[p.id] = res.data;
                    } catch {
                        map[p.id] = null;
                    }
                })
            );
            setRecipeMap(map);
        };
        fetchRecipes();
    }, [products]);

    const handleCreate = () => {
        navigate('/products/create');
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        setProductToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await productApi.deleteProduct(productToDelete);
            toast.success('Đã xóa sản phẩm thành công');
            setIsDeleteModalOpen(false);
            refetch();
        } catch (error: any) {
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                toast.error(error.response?.data?.message || 'Xóa sản phẩm thất bại');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            if (editingProduct) {
                await productApi.updateProduct(editingProduct.id, data);
            } else {
                await productApi.createProduct(data);
            }
            setIsModalOpen(false);
            setRecipeMap({}); // force re-fetch recipes
            refetch();
            toast.success('Đã lưu sản phẩm thành công');
        } catch (error: any) {
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                toast.error(error.response?.data?.message || 'Lưu sản phẩm thất bại');
            }
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-700">
            {/* Cinematic Header */}
            <div className="relative h-[280px] -mx-4 -mt-8 mb-12 overflow-hidden group/header">
                <div className="absolute inset-0 bg-[var(--bg-root)]">
                    <img
                        src={productHeaderBg}
                        alt="Product Catalog Cover"
                        className="w-full h-full object-cover opacity-80 scale-105 group-hover/header:scale-110 transition-transform duration-[3s] ease-out shadow-inner"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-root)] via-[var(--bg-root)]/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-root)] via-transparent to-[var(--bg-root)]"></div>
                </div>

                <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] border border-white/20">
                                <Package size={28} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-5xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter drop-shadow-2xl">
                                    Thực đơn <span className="text-emerald-400">&</span> Catalog
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                                    <p className="text-[var(--text-secondary)] font-black uppercase tracking-[.25em] text-[10px] italic">
                                        Chuẩn hóa thực đơn ELITE Culinary
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 relative z-10">
                        <Button
                            onClick={handleCreate}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black uppercase tracking-widest px-10 py-6 h-auto rounded-[1.75rem] shadow-[0_15px_30px_rgba(16,185,129,0.3)] hover:scale-[1.05] active:scale-95 transition-all italic border-0 h-full"
                        >
                            <Plus className="mr-3 h-6 w-6" strokeWidth={3} /> Thêm Sản phẩm
                        </Button>
                    </div>
                </div>
            </div>

            {/* Glass Toolbar */}
            <div className="bg-[var(--bg-card)]/60 backdrop-blur-3xl rounded-[2.5rem] border border-[var(--border-primary)] p-6 mb-10 shadow-sm relative overflow-hidden">
                <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full"></div>

                <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
                    <div className="relative w-full md:w-[600px] group">
                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none transition-transform duration-500 group-focus-within:translate-x-1">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)] group-focus-within:text-emerald-400 group-focus-within:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                <Search size={22} />
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm theo tên..."
                            className="w-full h-14 pl-16 pr-6 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-emerald-500/50 rounded-[1.25rem] text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all duration-300"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4 bg-[var(--bg-root)]/80 px-6 py-3 rounded-2xl border border-[var(--border-primary)]">
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest italic">Phân loại</span>
                        <div className="w-px h-4 bg-[var(--border-primary)]"></div>
                        <span className="text-[var(--text-primary)] font-bold text-sm tracking-tighter">
                            Tất cả sản phẩm
                        </span>
                    </div>
                </div>
            </div>

            {/* Catalog Grid */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="bg-[var(--bg-root)]/40 backdrop-blur-xl rounded-3xl border border-[var(--border-primary)] p-32 text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
                        <p className="mt-6 text-[var(--text-secondary)] font-black uppercase tracking-[0.3em] text-xs italic">Đang tải dữ liệu thực đơn...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-[var(--bg-root)]/40 backdrop-blur-xl rounded-3xl border border-[var(--border-primary)] p-32 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)]/20 mx-auto mb-6 shadow-inner border border-[var(--border-primary)]">
                            <Package size={40} />
                        </div>
                        <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.3em] text-xs italic">Không tìm thấy sản phẩm nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="group relative bg-[var(--bg-card)]/80 backdrop-blur-3xl rounded-[2.5rem] border border-[var(--border-primary)] p-8 transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] cursor-pointer overflow-hidden border-b-4 border-b-transparent hover:border-b-emerald-500/50"
                                onClick={() => handleEdit(product)}
                            >
                                <div className="absolute -right-20 -top-20 w-48 h-48 bg-emerald-500/5 blur-[70px] rounded-full group-hover:bg-emerald-500/10 transition-colors duration-700"></div>

                                <div className="flex flex-col gap-6 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="w-24 h-24 rounded-2xl bg-[var(--bg-root)] overflow-hidden border border-[var(--border-primary)] shadow-inner group-hover:scale-105 transition-transform duration-500">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]/20 group-hover:text-emerald-500 transition-colors">
                                                    <Package size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div className={cn(
                                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border transition-all duration-500",
                                            product.isActive
                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                                : "bg-[var(--bg-root)] text-[var(--text-secondary)] border-[var(--border-primary)]"
                                        )}>
                                            {product.isActive ? 'Công khai' : 'Nháp'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Tag size={12} className="text-[var(--text-secondary)]/40" />
                                            <span className="text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest italic">{product.category?.name || 'Chưa phân loại'}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter group-hover:text-emerald-400 transition-colors leading-[0.9]">
                                            {product.name}
                                        </h3>
                                        <span className="text-[10px] font-mono text-[var(--text-secondary)]/30 block pt-1 opacity-50">SKU: PD-{String(product.id).padStart(5, '0')}</span>

                                        {/* Recipe badge */}
                                        {recipeMap[product.id] !== undefined && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                                                    recipeMap[product.id]
                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                        : "bg-[var(--bg-root)] text-[var(--text-secondary)]/40 border-[var(--border-primary)]"
                                                )}>
                                                    <ChefHat size={10} />
                                                    {recipeMap[product.id]
                                                        ? `${recipeMap[product.id]!.recipeDetails.length} NL · Yield ${recipeMap[product.id]!.yield}`
                                                        : 'Chưa có công thức'
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-end justify-between pt-4 border-t border-[var(--border-primary)] mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest mb-1 italic">Đơn giá niêm yết</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-[var(--text-primary)] text-3xl font-black italic tracking-tighter">{product.price.toLocaleString('vi-VN')}</span>
                                                <span className="text-[var(--text-secondary)]/40 text-[10px] font-black uppercase italic tracking-widest">VND / {product.unit}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="w-12 h-12 rounded-2xl bg-[var(--bg-root)] text-[var(--text-secondary)] hover:text-emerald-400 hover:border-emerald-500/30 border border-[var(--border-primary)] transition-all flex items-center justify-center p-0 shadow-inner"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="w-12 h-12 rounded-2xl bg-[var(--bg-root)] text-[var(--text-secondary)] hover:text-rose-500 hover:border-rose-500/30 border border-[var(--border-primary)] transition-all flex items-center justify-center p-0 shadow-inner ml-1"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination Elite */}
                {pageableInfo && pageableInfo.totalPages > 1 && (
                    <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-10 px-12 py-8 bg-[var(--bg-card)]/60 backdrop-blur-2xl rounded-3xl border border-[var(--border-primary)] shadow-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.4em] italic mb-1">Phân trang dữ liệu</span>
                            <div className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest italic">
                                Trang <span className="text-emerald-400">{page + 1}</span> / <span className="text-[var(--text-primary)]">{pageableInfo?.totalPages || 0}</span>
                                <span className="mx-3 opacity-20">|</span>
                                <span className="text-[var(--text-secondary)]/50">{pageableInfo?.totalElements || 0} sản phẩm thực đơn</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={pageableInfo?.first || isLoading}
                                className="bg-[var(--bg-root)] hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-emerald-400 border border-[var(--border-primary)] hover:border-emerald-400/30 rounded-2xl px-12 h-14 font-black uppercase tracking-[0.2em] italic transition-all disabled:opacity-10"
                            >
                                <ChevronLeft size={20} className="mr-3" /> Trước
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setPage(p => p + 1)}
                                disabled={pageableInfo?.last || isLoading}
                                className="bg-[var(--bg-root)] hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-emerald-400 border border-[var(--border-primary)] hover:border-emerald-400/30 rounded-2xl px-12 h-14 font-black uppercase tracking-[0.2em] italic transition-all disabled:opacity-10"
                            >
                                Sau <ChevronRight size={20} className="ml-3" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingProduct}
                isLoading={isSaving}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Xóa sản phẩm"
                message="Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
};
