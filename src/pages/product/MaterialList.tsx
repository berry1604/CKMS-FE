import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Wheat, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { materialApi } from '../../services/material.api';
import type { MaterialResponse } from '../../types/material';
import toast from 'react-hot-toast';
import { cn } from '../../utils/classNames';
import productHeaderBg from '../../assets/product_catalog_bg.png';

export const MaterialList = () => {
    const [materials, setMaterials] = useState<MaterialResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await materialApi.getAll();
            setMaterials(data);
        } catch (error) {
            console.error('Failed to fetch materials:', error);
            toast.error('Không thể tải danh sách nguyên liệu');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        navigate('/products/materials/create');
    };

    const handleEdit = (material: MaterialResponse) => {
        navigate(`/products/materials/${material.id}/edit`, { state: { material } });
    };

    const handleDelete = async (_id: number) => {
        toast.error('Chức năng xóa chưa được hỗ trợ bởi Backend.');
    };



    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-[1400px] mx-auto pb-20 animate-in fade-in duration-700">
            {/* Cinematic Header (Condensed) */}
            <div className="relative h-[250px] -mx-4 -mt-8 mb-12 overflow-hidden group/header">
                <div className="absolute inset-0 bg-[var(--bg-root)]">
                    <img
                        src={productHeaderBg}
                        alt="Material Cover"
                        className="w-full h-full object-cover opacity-80 scale-105 group-hover/header:scale-110 transition-transform duration-[3s] ease-out shadow-inner"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-root)] via-[var(--bg-root)]/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-root)] via-transparent to-[var(--bg-root)]"></div>
                </div>

                <div className="absolute bottom-8 left-10 right-10 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30">
                                <Wheat size={20} />
                            </div>
                            <h1 className="text-3xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter">
                                Nguyên liệu <span className="text-amber-400">Thô</span>
                            </h1>
                        </div>
                        <p className="text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] text-[10px] italic flex items-center gap-2">
                            <Sparkles size={10} className="text-amber-400" />
                            Kiểm soát nguồn cung thực phẩm ELITE
                        </p>
                    </div>

                    <Button
                        onClick={handleCreate}
                        className="bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest px-8 py-5 h-auto rounded-2xl shadow-[0_10px_25px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95 transition-all italic border-0"
                    >
                        <Plus size={20} className="mr-2" strokeWidth={3} /> Thêm Nguyên liệu
                    </Button>
                </div>
            </div>

            {/* Glass Toolbar */}
            <div className="bg-[var(--bg-card)]/60 backdrop-blur-3xl rounded-[2rem] border border-[var(--border-primary)] p-5 mb-8 shadow-sm">
                <div className="relative w-full md:w-[450px] group">
                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none transition-transform duration-500 group-focus-within:translate-x-1">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)]/40 group-focus-within:text-amber-400">
                            <Search size={18} />
                        </div>
                    </div>
                    <input
                        type="search"
                        placeholder="Tìm kiếm nguyên liệu..."
                        className="w-full h-12 pl-14 pr-6 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-amber-500/50 rounded-xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/30 focus:outline-none transition-all duration-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List components */}
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="p-20 text-center bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[2rem] border border-[var(--border-primary)]">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
                        <p className="mt-4 text-[var(--text-secondary)]/60 font-black uppercase tracking-widest text-[10px] italic">Đang tải nguyên liệu...</p>
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="p-20 text-center bg-[var(--bg-card)]/40 backdrop-blur-xl rounded-[2rem] border border-[var(--border-primary)]">
                        <p className="text-[var(--text-secondary)]/60 font-black uppercase tracking-widest text-[10px] italic">Không tìm thấy bản ghi nào</p>
                    </div>
                ) : (
                    filteredMaterials.map((material) => (
                        <div
                            key={material.id}
                            className="group flex flex-col md:flex-row items-center justify-between p-6 bg-[var(--bg-card)]/80 backdrop-blur-2xl rounded-[2rem] border border-[var(--border-primary)] transition-all duration-500 hover:border-amber-500/30 hover:shadow-xl hover:-translate-y-1"
                        >
                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-root)] flex items-center justify-center text-[var(--text-secondary)]/40 group-hover:text-amber-500 transition-colors shadow-inner border border-[var(--border-primary)]">
                                    <Wheat size={24} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter group-hover:text-amber-400 transition-colors">
                                            {material.name}
                                        </h3>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest italic border",
                                            material.isActive
                                                ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                                : "bg-[var(--bg-root)] text-[var(--text-secondary)]/40 border-[var(--border-primary)]"
                                        )}>
                                            {material.isActive ? 'Khả dụng' : 'Hết hàng'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[var(--text-secondary)]/60 text-sm font-black uppercase tracking-widest italic">Đơn vị: {material.unit}</span>
                                        <span className="text-[10px] font-mono text-[var(--text-secondary)]/30">ID: #M-{String(material.id).padStart(3, '0')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-6 md:mt-0 w-full md:w-auto">
                                <button
                                    onClick={() => handleEdit(material)}
                                    className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-[var(--bg-root)] text-[var(--text-secondary)]/60 hover:text-amber-400 border border-[var(--border-primary)] hover:border-amber-500/30 transition-all font-black uppercase tracking-widest text-[10px] italic flex items-center justify-center gap-2 shadow-inner"
                                >
                                    <Edit size={14} /> Chỉnh sửa
                                </button>
                                <button
                                    onClick={() => handleDelete(material.id)}
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
        </div>
    );
};
