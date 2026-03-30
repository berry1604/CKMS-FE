import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Store as StoreIcon, Edit2, Trash2, ChevronRight, User, MapPin, PackageSearch } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { StoreResponse } from '../../types/store';
import { storeApi } from '../../services/store.api';
import { StoreModal } from './StoreModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';
import storeHeaderBg from '../../assets/store_list_header_bg.png';
import storeCardBg from '../../assets/luxury_steakhouse_bg.png';

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
            toast.error('Không thể tải danh sách cửa hàng');
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
            const msg = error.response?.data?.message || 'Không thể xóa cửa hàng';
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
        <div className="min-h-screen bg-[var(--bg-root)] animate-in fade-in duration-700 pb-20">
            {/* Cinematic Header Area */}
            <div className="relative h-[500px] w-full overflow-hidden">
                <img
                    src={storeHeaderBg}
                    className="w-full h-full object-cover scale-105 motion-safe:animate-[pulse_15s_ease-in-out_infinite] opacity-40 dark:opacity-60"
                    alt="Franchise Network Logistics"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-card)]/80 via-[var(--bg-card)]/20 to-[var(--bg-root)] backdrop-blur-[2px]" />

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-20 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-[2px] w-16 bg-amber-500/50" />
                        <span className="text-amber-500 font-black tracking-[0.4em] text-[10px] uppercase italic">Mạng lưới Vận hành Franchise</span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div className="space-y-4">
                            <h1 className="text-6xl md:text-8xl font-black text-[var(--text-primary)] tracking-tighter italic uppercase leading-none">
                                HỆ THỐNG <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">CỬA HÀNG</span>
                            </h1>
                            <p className="text-[var(--text-secondary)]/60 max-w-2xl text-lg font-medium leading-relaxed italic uppercase tracking-wider">
                                Điều phối và quản trị hiệu suất các điểm chạm thương hiệu Steakhouse trên toàn cầu thông qua hạ tầng dữ liệu tập trung.
                            </p>
                        </div>

                        <div className="flex items-center gap-6 mb-2">
                            <div className="bg-[var(--bg-card)]/40 backdrop-blur-3xl px-8 py-5 rounded-[2rem] border border-[var(--border-primary)] flex flex-col items-center min-w-[160px] shadow-2xl">
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1 italic">Thực thể HO</span>
                                <span className="text-4xl font-black text-[var(--text-primary)] italic tracking-tighter">{totalElements}</span>
                            </div>
                            <Button
                                onClick={() => navigate('/stores/create')}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-[10px] tracking-[0.2em] px-10 h-20 shadow-[0_20px_50px_rgba(245,158,11,0.3)] border-none flex items-center gap-3 rounded-[2rem] transition-all hover:scale-105 active:scale-95 italic"
                            >
                                <Plus size={20} strokeWidth={3} /> Đăng ký Chi nhánh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 -mt-10 relative z-10 space-y-12">
                {/* Search & Intelligence Area */}
                <div className="bg-[var(--bg-card)]/60 backdrop-blur-3xl rounded-[3rem] border border-[var(--border-primary)] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="relative w-full md:w-[600px] group/search">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/search:scale-110">
                                <Search size={20} className="text-[var(--text-secondary)]/30 group-focus-within/search:text-amber-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="TRUY XUẤT ĐỊNH DANH, TỌA ĐỘ HOẶC QUẢN TRỊ VIÊN..."
                                className="w-full pl-16 pr-8 h-16 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] focus:border-amber-500/30 rounded-2xl text-[var(--text-primary)] font-bold placeholder:text-[var(--text-secondary)]/20 focus:outline-none focus:ring-4 focus:ring-amber-500/5 transition-all duration-500 italic text-xs tracking-widest"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-widest italic ml-auto">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            Hệ thống Đồng bộ Thời gian thực
                        </div>
                    </div>
                </div>

                {/* Store Cards Grid */}
                {isLoading ? (
                    <div className="bg-[var(--bg-card)]/40 backdrop-blur-3xl rounded-[3rem] border border-[var(--border-primary)] p-32 text-center shadow-2xl">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-amber-500 opacity-20 mx-auto"></div>
                        <p className="mt-8 text-[var(--text-secondary)]/40 font-black uppercase tracking-[0.4em] text-[10px] italic">Đang đồng bộ hạ tầng mạng lưới...</p>
                    </div>
                ) : filteredStores.length === 0 ? (
                    <div className="bg-[var(--bg-card)]/40 backdrop-blur-3xl rounded-[3rem] border border-[var(--border-primary)] p-32 text-center shadow-2xl">
                        <div className="w-24 h-24 bg-[var(--bg-root)]/50 rounded-[2rem] border border-[var(--border-primary)] flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <StoreIcon className="w-10 h-10 text-[var(--text-secondary)]/10" />
                        </div>
                        <p className="text-[var(--text-secondary)]/30 font-black uppercase tracking-[0.3em] text-[10px] italic">Không tìm thấy thực thể chi nhánh phù hợp</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                        {filteredStores.map((store) => {
                            const actualId = store.id || store.storeId;
                            return (
                                <div
                                    key={actualId}
                                    className="group relative bg-[var(--bg-card)]/40 backdrop-blur-3xl rounded-[3rem] border border-[var(--border-primary)] overflow-hidden hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:border-amber-500/20 transition-all duration-700 cursor-pointer shadow-2xl"
                                    onClick={() => navigate(`/stores/${actualId}`)}
                                >
                                    {/* High-End Background Accent */}
                                    <div className="absolute inset-x-0 top-0 h-[200px] overflow-hidden opacity-10 group-hover:opacity-20 transition-opacity duration-700">
                                        <img src={storeCardBg} className="w-full h-full object-cover scale-150 group-hover:scale-100 transition-transform duration-1000" alt="Store Atmosphere" />
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-card)]" />
                                    </div>

                                    <div className="relative p-10 pt-16 z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-10">
                                            <div className="w-20 h-20 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-2xl group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black transition-all duration-700">
                                                <StoreIcon size={32} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(store); }}
                                                    className="w-12 h-12 rounded-2xl bg-[var(--bg-root)]/50 border border-[var(--border-primary)] text-[var(--text-secondary)]/40 hover:text-amber-500 hover:border-amber-500/30 transition-all flex items-center justify-center backdrop-blur-md"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(actualId!); }}
                                                    className="w-12 h-12 rounded-2xl bg-[var(--bg-root)]/50 border border-[var(--border-primary)] text-[var(--text-secondary)]/40 hover:text-rose-500 hover:border-rose-500/30 transition-all flex items-center justify-center backdrop-blur-md"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-6 flex-1">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] bg-amber-500/10 px-3 py-1 rounded-lg italic">Branch Identity</span>
                                                    <div className="h-[1px] flex-1 bg-amber-500/10" />
                                                </div>
                                                <h3 className="text-3xl font-black text-[var(--text-primary)] italic uppercase tracking-tighter group-hover:text-amber-500 transition-colors leading-none">
                                                    {store.name}
                                                </h3>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 text-[10px] font-black text-[var(--text-secondary)]/60 uppercase tracking-widest italic leading-relaxed">
                                                    <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/10 shrink-0">
                                                        <MapPin size={14} className="text-amber-500" />
                                                    </div>
                                                    <span className="line-clamp-2">{store.address}</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-[var(--bg-root)]/30 border border-[var(--border-primary)]/40 rounded-2xl p-4 flex flex-col gap-1">
                                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest italic opacity-50">Tọa độ GPS</span>
                                                        <span className="text-[10px] font-black text-[var(--text-primary)] tracking-tight">
                                                            {store.latitude ? Number(store.latitude).toFixed(4) : '0.000'} / {store.longitude ? Number(store.longitude).toFixed(4) : '0.000'}
                                                        </span>
                                                    </div>
                                                    <div className="bg-[var(--bg-root)]/30 border border-[var(--border-primary)]/40 rounded-2xl p-4 flex flex-col gap-1">
                                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest italic opacity-50">Liên hệ Giao dịch</span>
                                                        <span className="text-[10px] font-black text-[var(--text-primary)] tracking-tight">
                                                            {store.phone || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="bg-[var(--bg-root)]/30 border border-[var(--border-primary)]/40 rounded-2xl p-5 flex items-center justify-between group/manager">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                                                            <User size={18} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] italic">Chỉ huy sở tại</span>
                                                            <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight italic">
                                                                {store.managerName || 'Chưa điều động'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-[9px] font-black text-[var(--text-secondary)]/30 uppercase tracking-widest bg-[var(--bg-root)]/50 px-3 py-1.5 rounded-lg italic border border-[var(--border-primary)]/50">
                                                        {staffNames[actualId!] || '...'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-8 mt-8 border-t border-[var(--border-primary)]/20 flex justify-between items-center">
                                            <Button
                                                variant="ghost"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/stores/inventory?storeId=${actualId}`); }}
                                                className="h-12 px-6 bg-amber-500/5 hover:bg-amber-500 text-amber-500 hover:text-black border border-amber-500/20 hover:border-transparent rounded-xl transition-all font-black uppercase tracking-widest text-[9px] italic flex items-center gap-2 group/btn"
                                            >
                                                <PackageSearch className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                                Logistics Kho
                                            </Button>
                                            
                                            <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest italic opacity-0 group-hover:opacity-100 transition-all duration-700 translate-x-4 group-hover:translate-x-0">
                                                Phân tích chi tiết <ChevronRight size={16} strokeWidth={3} className="animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-10 py-8 bg-[var(--bg-card)]/60 backdrop-blur-3xl rounded-[3rem] border border-[var(--border-primary)] shadow-2xl relative overflow-hidden">
                    <div className="text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.4em] italic flex items-center gap-4">
                        <div className="h-1 w-8 bg-amber-500/20 rounded-full" />
                        {totalElements > 0 ? (
                            <>Protocol <span className="text-[var(--text-primary)]">{startItem}-{endItem}</span> / Infrastructure <span className="text-amber-500">{totalElements}</span></>
                        ) : (
                            'Nền tảng Offline'
                        )}
                    </div>
                    <div className="flex gap-4">
                        <Button
                            variant="ghost"
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/5 rounded-2xl px-10 h-14 transition-all italic disabled:opacity-10 border border-[var(--border-primary)]/50 flex items-center gap-2"
                        >
                            <ChevronRight size={14} className="rotate-180" strokeWidth={3} /> Lùi bước
                        </Button>
                        <Button
                            variant="ghost"
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/5 rounded-2xl px-10 h-14 transition-all italic disabled:opacity-10 border border-[var(--border-primary)]/50 flex items-center gap-2"
                        >
                            Tiếp bước <ChevronRight size={14} strokeWidth={3} />
                        </Button>
                    </div>
                </div>
            </div>

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
                title="Yêu cầu Thu hồi Chi nhánh"
                message="Giao thức này sẽ chấm dứt quyền hoạt động của thực thể cửa hàng đã chọn. Xác thực yêu cầu?"
                confirmText="Xác nhận Thu hồi"
                cancelText="Hủy bỏ"
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
};
