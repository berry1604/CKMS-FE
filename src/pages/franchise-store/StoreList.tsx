import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Store as StoreIcon, Edit2, Trash2, ChevronRight, User, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { StoreResponse } from '../../types/store';
import { storeApi } from '../../services/store.api';
import { StoreModal } from './StoreModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';
import storeHeaderBg from '../../assets/store_list_header_bg.png';

export const StoreList = () => {
    const navigate = useNavigate();
    const [stores, setStores] = useState<StoreResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<StoreResponse | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [staffNames, setStaffNames] = useState<Record<number, string>>({});

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteStoreId, setDeleteStoreId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadStores = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await storeApi.getAllStores({
                page: currentPage,
                size: pageSize,
                search: searchTerm || undefined,
            });
            const pageData = response.data;
            setStores(pageData.content);
            setTotalPages(pageData.totalPages);
            setTotalElements(pageData.totalElements);

            // Fetch staff for each store
            const names: Record<number, string> = {};
            const { userService } = await import('../../services/user.service');
            
            await Promise.all(pageData.content.map(async (store: StoreResponse) => {
                const sid = store.id || store.storeId;
                if (sid) {
                    try {
                        const staffRes = await userService.getUsers({ storeId: sid, size: 20 });
                        // Filter by storeId locally to be sure
                        const list = staffRes.data.content || [];
                        const assigned = list.filter((u: any) => u.storeId === sid);
                        if (assigned.length > 0) {
                            names[sid] = assigned[0].fullName;
                        } else {
                            names[sid] = 'Chưa có NV';
                        }
                    } catch (e) {
                        names[sid] = 'Lỗi';
                    }
                }
            }));
            setStaffNames(prev => ({ ...prev, ...names }));
        } catch (error) {
            console.error(error);
            toast.error('Failed to load stores');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, searchTerm]);

    useEffect(() => {
        loadStores();
    }, [loadStores]);

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(0);
    }, [searchTerm]);

    const filteredStores = stores;

    const handleCreate = () => {
        setEditingStore(null);
        setIsModalOpen(true);
    };

    const handleEdit = (store: StoreResponse) => {
        setEditingStore(store);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setDeleteStoreId(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteStoreId) return;
        setIsDeleting(true);
        try {
            await storeApi.deleteStore(deleteStoreId);
            toast.success('Xóa cửa hàng thành công');
            setIsDeleteModalOpen(false);
            loadStores();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to delete store';
            toast.error(msg);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            if (editingStore) {
                // Backend ĐÃ CÓ API update store
                const updateId = editingStore.id || editingStore.storeId;
                if (!updateId) throw new Error("Store ID is missing");
                await storeApi.updateStore(updateId, data);
                toast.success('Cập nhật cửa hàng thành công!');
            } else {
                await storeApi.createStore(data);
                toast.success('Tạo cửa hàng thành công!');
            }
            setIsModalOpen(false);
            setEditingStore(null);
            loadStores();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Lỗi khi lưu cửa hàng';
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const startItem = currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

    return (
        <div className="max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-700">
            {/* Cinematic Header */}
            <div className="relative h-[300px] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-8 group">
                <img
                    src={storeHeaderBg}
                    alt="Store Cover"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent"></div>

                <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                                <StoreIcon size={24} strokeWidth={2.5} />
                            </div>
                            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg">
                                Hệ thống <span className="text-amber-500">Cửa hàng</span>
                            </h1>
                        </div>
                        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs italic ml-1">
                            Quản lý mạng lưới và hiệu suất vận hành franchise
                        </p>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex flex-col items-center min-w-[120px]">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Tổng cộng</span>
                            <span className="text-2xl font-black text-white italic tracking-tighter">{totalElements}</span>
                        </div>
                        <Button
                            onClick={handleCreate}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black uppercase tracking-widest px-8 py-6 h-auto rounded-[1.5rem] shadow-[0_10px_25px_rgba(245,158,11,0.3)] hover:scale-[1.05] active:scale-95 transition-all italic border-0"
                        >
                            <Plus className="mr-3 h-5 w-5" strokeWidth={3} /> Đăng ký Cửa hàng mới
                        </Button>
                    </div>
                </div>
            </div>

            {/* Toolbar - Glassmorphism */}
            <div className="relative z-10 bg-[#080808]/60 backdrop-blur-3xl rounded-[2rem] border border-white/5 p-5 mb-8 shadow-2xl overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full"></div>

                <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
                    <div className="relative w-full md:w-[450px] group">
                        <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none transition-transform duration-500 group-focus-within:translate-x-1">
                            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-500 group-focus-within:text-amber-500 group-focus-within:shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                <Search size={18} />
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm cửa hàng, vị trí, hoặc quản lý..."
                            className="w-full pl-14 pr-4 h-12 bg-zinc-950/50 border border-white/5 focus:border-amber-500/50 rounded-2xl text-zinc-100 font-bold placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all duration-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                </div>
            </div>

            {/* Main List - High-End Cards */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="bg-zinc-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
                        <p className="mt-4 text-zinc-500 font-bold uppercase tracking-widest text-[10px] italic">Đang tải danh sách...</p>
                    </div>
                ) : filteredStores.length === 0 ? (
                    <div className="bg-zinc-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-20 text-center">
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] italic">Không tìm thấy cửa hàng nào phù hợp</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredStores.map((store) => {
                            const actualId = store.id || store.storeId;
                            return (
                                <div
                                    key={actualId}
                                    className="group relative bg-[#0d0d0d]/80 backdrop-blur-3xl rounded-[2rem] border border-white/5 p-6 hover:border-amber-500/30 transition-all duration-500 hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] cursor-pointer overflow-hidden"
                                    onClick={() => navigate(`/stores/${actualId}`)}
                                >
                                    {/* Active background effect */}
                                    <div className="absolute inset-y-0 left-0 w-1 bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]"></div>
                                    <div className="absolute -right-20 -top-20 w-40 h-40 bg-amber-500/5 blur-[60px] rounded-full group-hover:bg-amber-500/10 transition-colors duration-700"></div>

                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                                        <div className="flex items-center gap-5 flex-1">
                                            <div className="w-16 h-16 rounded-[1.25rem] bg-zinc-950 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 transition-all duration-500 shadow-inner group-hover:scale-105">
                                                <StoreIcon size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter group-hover:text-amber-500 transition-colors">
                                                    {store.name}
                                                </h3>
                                                <div className="flex items-center gap-4 mt-1.5">
                                                    <div className="flex items-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                                        <MapPin size={12} className="mr-1.5 text-amber-500 opacity-50" />
                                                        {store.address}
                                                    </div>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                                                    <div className="flex items-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                                        <User size={12} className="mr-1.5 text-amber-500 opacity-50" />
                                                        {store.managerName || 'N/A'}
                                                        <span className="ml-2 text-zinc-700">({staffNames[actualId!] || 'Đang tải...'})</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-8 w-full lg:w-auto">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Liên hệ</span>
                                                <span className="text-zinc-300 text-sm font-bold tracking-tight">
                                                    {store.phone || <span className="opacity-30 italic">No phone</span>}
                                                </span>
                                            </div>


                                            <div className="flex items-center gap-2 ml-auto lg:ml-0" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(store)}
                                                    className="w-12 h-12 rounded-2xl bg-zinc-950 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 border border-white/5 transition-all p-0 shadow-inner group-hover:border-amber-500/20"
                                                >
                                                    <Edit2 size={18} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(actualId!)}
                                                    className="w-12 h-12 rounded-2xl bg-zinc-950 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 border border-white/5 transition-all p-0 shadow-inner group-hover:border-rose-500/20 ml-2"
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                                <div className="w-10 h-10 flex items-center justify-center text-zinc-700 group-hover:text-amber-500 transition-all duration-700 group-hover:translate-x-1">
                                                    <ChevronRight size={24} strokeWidth={3} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination ELITE */}
                <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 px-10 py-6 bg-zinc-900/20 backdrop-blur-md rounded-[2.5rem] border border-white/5">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">
                        {totalElements > 0 ? (
                            <>Hiển thị <span className="text-zinc-200">{startItem}</span> - <span className="text-zinc-200">{endItem}</span> của <span className="text-amber-500">{totalElements}</span> cửa hàng</>
                        ) : (
                            'Không có dữ liệu'
                        )}
                    </div>
                    <div className="flex gap-4">
                        <Button
                            variant="ghost"
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-2xl px-8 h-12 transition-all italic disabled:opacity-20"
                        >
                            Trước
                        </Button>
                        <Button
                            variant="ghost"
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-2xl px-8 h-12 transition-all italic disabled:opacity-20"
                        >
                            Tiếp theo
                        </Button>
                    </div>
                </div>
            </div>

            <p className="hidden">Responsive grid removed in favor of Unified High-End Card List</p>

            <StoreModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingStore}
                isLoading={isSaving}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Xóa cửa hàng"
                message="Bạn có chắc muốn xóa cửa hàng này? Hành động này không thể hoàn tác."
                confirmText="Xóa cửa hàng"
                cancelText="Hủy"
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
};
