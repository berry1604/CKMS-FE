import { useEffect, useState, useCallback } from 'react';
import { Search, ChefHat, Edit2, MapPin, Activity } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { KitchenResponse, KitchenCreateRequest } from '../../types/kitchen';
import { kitchenApi } from '../../services/kitchen.api';
import { KitchenModal } from './KitchenModal';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/classNames';

export const KitchensList = () => {
    const [kitchens, setKitchens] = useState<KitchenResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingKitchen, setEditingKitchen] = useState<KitchenResponse | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadKitchens = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await kitchenApi.getAllKitchens();
            setKitchens(response.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi tải danh sách Bếp trung tâm');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadKitchens();
    }, [loadKitchens]);

    const filteredKitchens = kitchens.slice(0, 1).filter(k => 
        k.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        k.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (kitchen: KitchenResponse) => {
        setEditingKitchen(kitchen);
        setIsModalOpen(true);
    };


    const handleSubmit = async (data: KitchenCreateRequest) => {
        setIsSaving(true);
        try {
            if (editingKitchen) {
                await kitchenApi.updateKitchen(editingKitchen.kitchenId, data);
                toast.success('Cập nhật bếp trung tâm thành công!');
            } else {
                await kitchenApi.createKitchen(data);
                toast.success('Đăng ký bếp trung tâm thành công!');
            }
            setIsModalOpen(false);
            setEditingKitchen(null);
            loadKitchens();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Lỗi khi lưu bếp trung tâm';
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-700">
            {/* Header section (Cinematic) */}
            <div className="relative h-[280px] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-8 bg-zinc-950 flex items-center">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-600/10"></div>
                <div className="absolute -left-20 -top-20 w-96 h-96 bg-amber-500/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>

                <div className="relative z-10 w-full px-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 p-[1px] shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                                <div className="w-full h-full bg-zinc-950 rounded-[15px] flex items-center justify-center">
                                    <ChefHat className="text-amber-500" size={28} />
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 italic uppercase tracking-tighter drop-shadow-lg">
                                Bếp Trung Tâm
                            </h1>
                        </div>
                        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs italic ml-1">
                            Quản lý, điều phối mạng lưới cung cấp thực phẩm
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-black/40 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/10 flex flex-col items-center min-w-[120px]">
                            <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest mb-1.5">Số lượng bếp</span>
                            <span className="text-3xl font-black text-white italic tracking-tighter leading-none">{kitchens.length}</span>
                        </div>
                        {/* <Button
                            onClick={handleCreate}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black uppercase tracking-widest px-8 h-[72px] rounded-3xl shadow-[0_10px_25px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 transition-all outline-none border-none"
                        >
                            <Plus className="mr-3 h-5 w-5" strokeWidth={3} /> Đăng ký Bếp mới
                        </Button> */}
                    </div>
                </div>
            </div>

            {/* Toolbar Area */}
            <div className="relative z-10 bg-[#080808]/60 backdrop-blur-3xl rounded-[2rem] border border-white/5 p-5 mb-8 shadow-2xl flex flex-col md:flex-row gap-6 justify-between items-center">
                <div className="relative w-full md:w-[450px] group">
                    <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none transition-transform duration-500 group-focus-within:translate-x-1">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950/80 flex items-center justify-center text-zinc-500 group-focus-within:text-amber-500 group-focus-within:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-colors">
                            <Search size={18} />
                        </div>
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm bếp trung tâm theo tên hoặc địa chỉ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-4 h-14 bg-zinc-950/50 border border-white/5 focus:border-amber-500/50 rounded-[1.5rem] text-sm text-zinc-100 font-bold placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all duration-300"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            {isLoading ? (
                <div className="bg-zinc-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-32 flex flex-col items-center justify-center">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-t-2 border-r-2 border-amber-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-b-2 border-l-2 border-orange-500 rounded-full animate-spin animation-delay-150"></div>
                    </div>
                    <p className="mt-6 text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px] italic">Đang tải cấu hình bếp...</p>
                </div>
            ) : filteredKitchens.length === 0 ? (
                <div className="bg-zinc-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-32 flex flex-col items-center justify-center">
                    <ChefHat className="text-zinc-700 h-16 w-16 mb-4" />
                    <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px] italic">Không tìm thấy bếp trung tâm phù hợp</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredKitchens.map(kitchen => (
                        <div 
                            key={kitchen.kitchenId} 
                            className="bg-zinc-950/80 backdrop-blur-md border border-white/5 hover:border-amber-500/30 transition-all duration-500 rounded-[2rem] overflow-hidden group hover:shadow-[0_15px_40px_rgba(245,158,11,0.05)] flex flex-col"
                        >
                            <div className="p-6 flex-1 space-y-5">
                                <div className="flex justify-between items-start">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-amber-500 group-hover:bg-amber-500/5 transition-all duration-500 shadow-inner group-hover:scale-105 group-hover:rotate-3">
                                        <ChefHat size={26} strokeWidth={1.5} />
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-inner",
                                        kitchen.isActive 
                                            ? "bg-[#5C6F2B]/10 text-[#5C6F2B] border border-[#5C6F2B]/20" 
                                            : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                    )}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full", kitchen.isActive ? "bg-[#5C6F2B]" : "bg-rose-500 animate-pulse")}></span>
                                        {kitchen.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2 group-hover:text-amber-500 transition-colors line-clamp-1">
                                        {kitchen.name}
                                    </h3>
                                    <div className="flex items-start gap-2.5 text-zinc-500 mt-2">
                                        <MapPin size={14} className="shrink-0 mt-0.5 text-zinc-600 group-hover:text-amber-500/50 transition-colors" />
                                        <span className="text-xs font-bold leading-relaxed line-clamp-2">{kitchen.address}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="bg-zinc-900/50 rounded-xl p-3 border border-white/5">
                                        <div className="flex items-center gap-1.5 text-zinc-600 mb-1">
                                            <Activity size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Công suất M/N</span>
                                        </div>
                                        <span className="text-sm font-black text-zinc-300 tracking-tight italic">
                                            {kitchen.maxDailyCapacity.toLocaleString()} sp
                                        </span>
                                    </div>
                                    <div className="bg-zinc-900/50 rounded-xl p-3 border border-white/5">
                                        <div className="flex items-center gap-1.5 text-zinc-600 mb-1">
                                            <ChefHat size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">ID Hệ thống</span>
                                        </div>
                                        <span className="text-sm font-black text-zinc-300 tracking-tight">
                                            #{kitchen.kitchenId.toString().padStart(4, '0')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Card Footer Actions */}
                            <div className="p-2 border-t border-white/5 flex gap-2 overflow-hidden bg-black/20">
                                <Button 
                                    onClick={() => handleEdit(kitchen)}
                                    variant="ghost" 
                                    className="flex-1 bg-zinc-900 hover:bg-amber-500/10 hover:text-amber-500 text-zinc-400 font-bold text-[10px] uppercase tracking-widest h-12 rounded-xl transition-colors border-0"
                                >
                                    <Edit2 size={14} className="mr-2" /> Chỉnh sửa
                                </Button>
                                {/* <Button 
                                    onClick={() => handleDeleteClick(kitchen.kitchenId)}
                                    variant="ghost" 
                                    className="flex-none px-4 bg-zinc-900 hover:bg-rose-500/10 hover:text-rose-500 text-zinc-500 h-12 rounded-xl transition-colors border-0"
                                >
                                    <Trash2 size={16} />
                                </Button> */}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <KitchenModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingKitchen}
                isLoading={isSaving}
            />

        </div>
    );
};
