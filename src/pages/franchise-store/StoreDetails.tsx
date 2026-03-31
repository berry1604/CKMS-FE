import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Box,
    ShoppingCart,
    MapPin,
    Phone,
    Mail,
    User as UserIcon,
    Settings,
    LayoutDashboard,
    ExternalLink,
    Store as StoreIcon,
    Shield,
    Loader2,
    Navigation
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/classNames';
import { storeApi } from '../../services/store.api';
import { StoreInventory } from './StoreInventory';
import StoreStaff from './StoreStaff';
import StoreOrders from './StoreOrders';
import { toast } from 'react-hot-toast';
import type { StoreResponse } from '../../types/store';

export const StoreDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [store, setStore] = useState<StoreResponse | null>(null);
    const [manager, setManager] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');

    useEffect(() => {
        if (id) {
            const loadStore = async () => {
                setIsLoading(true);
                try {
                    const response = await storeApi.getStoreById(Number(id));
                    setStore(response.data);
                    
                    // Fetch manager details
                    if (response.data.managerName) {
                        const { userService } = await import('../../services/user.service');
                        try {
                            const userRes = await userService.getUserByUsernameOrEmail(response.data.managerName);
                            setManager(userRes.data);
                        } catch (e) {
                            console.error('Error fetching manager details:', e);
                        }
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Không thể tải thông tin cửa hàng');
                } finally {
                    setIsLoading(false);
                }
            };
            loadStore();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                <p className="text-[10px] font-black tracking-[0.4em] uppercase text-[var(--text-secondary)]/40 italic">Đang chuẩn bị không gian vận hành...</p>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm">
                <StoreIcon className="w-16 h-16 text-[var(--text-secondary)]/20 mb-6" />
                <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)] uppercase italic mb-2">Cửa hàng không tồn tại</h2>
                <p className="text-[var(--text-secondary)] mb-8 italic">Dữ liệu có thể đã bị di dời hoặc ID không chính xác.</p>
                <Button
                    variant="outline"
                    className="border-[var(--border-primary)] hover:bg-[var(--text-primary)]/5 tracking-widest uppercase text-[10px] font-black px-8 py-6 rounded-2xl"
                    onClick={() => navigate('/stores')}
                >
                    <ArrowLeft size={14} className="mr-3 text-amber-500" /> Trở lại danh sách
                </Button>
            </div>
        );
    }

    const tabs = [
        { id: 'Overview', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'Inventory', label: 'Kho hàng', icon: Box },
        { id: 'Orders', label: 'Đơn hàng', icon: ShoppingCart },
        { id: 'Staff', label: 'Nhân viên', icon: UserIcon },
        { id: 'Settings', label: 'Cấu hình', icon: Settings },
    ];

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 pb-20 animate-in fade-in duration-1000 pt-8">
            {/* Header Cinematic with Glassmorphism */}
            <div className="relative group overflow-hidden rounded-3xl bg-[var(--bg-card)] border border-[var(--border-primary)] p-8 md:p-14 shadow-2xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/[0.02] blur-[150px] -mr-40 -mt-40 rounded-full group-hover:bg-amber-500/5 transition-all duration-1000"></div>
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-amber-500/[0.01] blur-[100px] rounded-full"></div>

                <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
                    <div className="space-y-8 flex-1">
                        <div className="flex items-center gap-4 text-[var(--text-secondary)]/60 text-[10px] font-black tracking-[0.4em] uppercase italic">
                            <span className="hover:text-amber-500 cursor-pointer transition-colors" onClick={() => navigate('/stores')}>Franchise Network</span>
                            <span className="opacity-30">/</span>
                            <span className="text-[var(--text-primary)]">Store Identity #{store.storeId || store.id}</span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-8">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-amber-500 shadow-xl group-hover:scale-105 transition-all duration-700 group-hover:shadow-amber-500/10 group-hover:rotate-2">
                                <StoreIcon className="w-10 h-10 md:w-14 md:h-14" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <h1 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-none drop-shadow-xl">
                                        {store.name}
                                    </h1>
                                </div>
                                <div className="flex flex-wrap items-center gap-8 text-[var(--text-secondary)] font-medium tracking-wide">
                                    <div className="flex items-center gap-2 group/loc cursor-default">
                                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover/loc:bg-amber-500 group-hover/loc:text-black transition-all shadow-sm">
                                            <MapPin size={14} />
                                        </div>
                                        <span className="text-sm font-bold opacity-80 group-hover/loc:opacity-100 transition-opacity italic">{store.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[10px] font-black tracking-widest uppercase">
                                            Hệ thống tinh hoa
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button
                            onClick={() => navigate(`/stores/${store.storeId || store.id}/edit`)}
                            className="flex-1 md:flex-none bg-[var(--bg-root)] hover:bg-[var(--text-primary)]/5 text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-amber-500/30 tracking-widest uppercase text-[10px] font-black px-10 py-7 h-auto rounded-[1.5rem] transition-all"
                        >
                            Hiệu chỉnh
                        </Button>
                        <Button
                            className="flex-1 md:flex-none bg-gradient-to-br from-amber-400 to-orange-600 hover:from-amber-500 hover:to-orange-700 text-black border-none tracking-widest uppercase text-[10px] font-black px-12 py-7 h-auto rounded-full shadow-[0_20px_40px_rgba(245,158,11,0.2)] hover:shadow-amber-500/40 hover:-translate-y-1 transition-all group/btn active:scale-95"
                            onClick={() => navigate('/orders/create', { state: { storeId: store.storeId || store.id } })}
                        >
                            Tạo đơn hàng <ExternalLink size={16} className="ml-3 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Info Cards - Modern Dashboard Aesthetic */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Contact Card */}
                <div className="group relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl p-10 hover:border-amber-500/20 transition-all duration-700 overflow-hidden shadow-sm">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 blur-3xl -ml-12 -mt-12 group-hover:bg-amber-500/10 transition-all"></div>

                    <div className="relative space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:rotate-6 transition-transform shadow-sm">
                                <UserIcon size={24} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-[var(--text-secondary)]/60 group-hover:text-amber-500 transition-colors italic">Quản lý cơ sở</h3>
                                <p className="text-[10px] font-bold text-[var(--text-secondary)]/40 uppercase tracking-widest">Nhân sự chịu trách nhiệm</p>
                            </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-[var(--border-primary)]/10">
                            <div>
                                <p className="text-[9px] uppercase font-black tracking-[0.3em] text-amber-500/60 mb-2 italic">Họ tên định danh</p>
                                <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight italic uppercase">{store.managerName || 'Vô danh'}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-[var(--bg-root)]/50 border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all hover:border-amber-500/20">
                                    <Phone size={16} className="text-amber-500/60" />
                                    <span className="text-sm font-black tracking-tight font-mono">{store.phone || manager?.phone || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-[var(--bg-root)]/50 border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all hover:border-amber-500/20">
                                    <Mail size={16} className="text-amber-500/60" />
                                    <span className="text-sm truncate font-bold italic lowercase">{store.email || manager?.email || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex items-start gap-4 p-4 rounded-[1.5rem] bg-[var(--bg-root)]/50 border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all hover:border-amber-500/20">
                                    <MapPin size={16} className="text-amber-500/60 mt-0.5" />
                                    <span className="text-sm font-medium leading-relaxed italic">{store.address || manager?.address || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-root)]/30 border border-[var(--border-primary)]/50 text-[var(--text-secondary)]/60 hover:text-[var(--text-secondary)] transition-all">
                                        <Navigation size={14} className="text-amber-500/40 rotate-45" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase font-black tracking-widest opacity-40">Vĩ độ</span>
                                            <span className="text-xs font-mono font-black">{store.latitude || '0.000'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-root)]/30 border border-[var(--border-primary)]/50 text-[var(--text-secondary)]/60 hover:text-[var(--text-secondary)] transition-all">
                                        <Navigation size={14} className="text-amber-500/40 -rotate-45" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase font-black tracking-widest opacity-40">Kinh độ</span>
                                            <span className="text-xs font-mono font-black">{store.longitude || '0.000'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Stats / Overview Card */}
                <div className="group relative bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl p-10 hover:border-amber-500/20 transition-all duration-700 overflow-hidden shadow-sm col-span-1 md:col-span-2">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.02] blur-3xl -mr-32 -mt-32"></div>
                    <div className="relative space-y-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
                                <LayoutDashboard size={24} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-[var(--text-secondary)]/60 group-hover:text-amber-500 transition-colors italic">Chỉ số vận hành</h3>
                                <p className="text-[10px] font-bold text-[var(--text-secondary)]/40 uppercase tracking-widest">Hiệu năng thời gian thực</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-[2.5rem] bg-[var(--bg-root)]/50 border border-[var(--border-primary)] hover:bg-[var(--text-primary)]/[0.02] transition-colors relative overflow-hidden group/stat">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-2xl"></div>
                                    <p className="text-[9px] uppercase font-black tracking-widest text-[var(--text-secondary)]/50 mb-3 italic">Hiệu suất</p>
                                    <p className="text-3xl font-black text-emerald-500 tracking-tighter italic">98.2%</p>
                                </div>
                                <div className="p-6 rounded-[2.5rem] bg-[var(--bg-root)]/50 border border-[var(--border-primary)] hover:bg-[var(--text-primary)]/[0.02] transition-colors relative overflow-hidden group/stat">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 blur-2xl"></div>
                                    <p className="text-[9px] uppercase font-black tracking-widest text-[var(--text-secondary)]/50 mb-3 italic">Đơn hàng</p>
                                    <p className="text-3xl font-black text-amber-500 tracking-tighter italic">124</p>
                                </div>
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-amber-500/[0.03] to-transparent border border-amber-500/10 flex flex-col justify-center">
                                <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)]/60 mb-3 italic">Ngày khởi tạo hệ thống</p>
                                <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight italic uppercase">
                                    {store.createdAt ? new Date(store.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }) : '01 Tháng 01, 2024'}
                                </p>
                                <div className="flex items-center gap-2 mt-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Hoạt động ổn định</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs - Floating Bar Aesthetic */}
            <div className="sticky top-20 z-50 bg-[var(--bg-card)]/80 backdrop-blur-3xl border border-[var(--border-primary)]/50 rounded-full p-2 mt-16 shadow-xl max-w-3xl mx-auto">
                <nav className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-3 px-8 py-5 rounded-full transition-all duration-700 whitespace-nowrap group relative",
                                    active
                                        ? 'text-black font-black'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                )}
                            >
                                {active && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-lg animate-in zoom-in-95 duration-500"></div>
                                )}
                                <Icon size={18} className={cn(
                                    "relative z-10 transition-all duration-300",
                                    active ? "scale-110" : "opacity-40 group-hover:opacity-100 group-hover:scale-110"
                                )} />
                                <span className="relative z-10 text-[10px] uppercase font-black tracking-[0.2em]">{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content Display Area */}
            <div className="relative mt-8 min-h-[600px] animate-in slide-in-from-bottom-12 fade-in duration-1000">
                {activeTab === 'Overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: 'Doanh thu trung bình', value: '18.2M', trend: '+14%', color: 'text-emerald-400', sub: 'Mỗi tháng' },
                            { label: 'Số sản phẩm lưu kho', value: '42', trend: 'Stable', color: 'text-[var(--text-secondary)]', sub: 'Danh mục' },
                            { label: 'Thời gian vận chuyển', value: '45m', trend: '-8m', color: 'text-sky-400', sub: 'Trung bình' },
                            { label: 'Điểm hài lòng', value: '4.9/5', trend: 'Elite', color: 'text-amber-400', sub: 'Phản hồi' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[2.5rem] p-8 hover:bg-[var(--text-primary)]/[0.02] transition-all hover:-translate-y-1 shadow-sm">
                                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-[var(--text-secondary)]/40 mb-6 italic">{stat.label}</p>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-3xl font-black text-[var(--text-primary)] tracking-tighter italic">{stat.value}</p>
                                        <p className="text-[9px] text-[var(--text-secondary)]/40 font-bold uppercase mt-1 tracking-widest">{stat.sub}</p>
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-black tracking-[0.2em] px-2.5 py-1 rounded-full bg-[var(--bg-root)] border border-[var(--border-primary)] uppercase",
                                        stat.color
                                    )}>
                                        {stat.trend}
                                    </span>
                                </div>
                            </div>
                        ))}

                        <div className="col-span-full h-[500px] bg-[var(--bg-card)] border-2 border-dashed border-[var(--border-primary)] rounded-3xl flex items-center justify-center text-[var(--text-secondary)]/20 group overflow-hidden relative shadow-sm">
                            <div className="absolute inset-0 bg-[var(--text-primary)]/[0.01] pointer-events-none"></div>
                            <div className="relative text-center max-w-md px-10">
                                <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)]/40 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                                    <LayoutDashboard className="w-10 h-10" />
                                </div>
                                <h4 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-widest mb-4 italic">Mô-đun Phân tích Cao cấp</h4>
                                <p className="text-sm font-medium text-[var(--text-secondary)]/60 italic leading-relaxed">
                                    Hệ thống đang thu thập dữ liệu vận hành từ mạng lưới IoT và AI để kiến tạo các biểu đồ trực quan hóa dữ liệu tinh vi nhất.
                                </p>
                                <div className="mt-10 flex items-center justify-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)]/40 italic">Đang được chuẩn bị cho v2.0-ELITE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Inventory' && (
                    <div className="animate-in fade-in zoom-in-95 duration-700 rounded-3xl overflow-hidden shadow-2xl">
                        <StoreInventory storeId={Number(id)} />
                    </div>
                )}

                {activeTab === 'Orders' && (
                    <div className="animate-in fade-in duration-700">
                        <StoreOrders storeId={Number(id)!} />
                    </div>
                )}

                {activeTab === 'Staff' && (
                    <div className="animate-in fade-in duration-700">
                        <StoreStaff storeId={Number(id)!} />
                    </div>
                )}

                {activeTab === 'Settings' && (
                    <div className="max-w-3xl mx-auto space-y-8 py-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl p-12 space-y-10 shadow-sm">
                            <div className="flex items-center justify-between border-b border-[var(--border-primary)]/10 pb-10 opacity-60">
                                <div className="max-w-md">
                                    <h4 className="text-[var(--text-primary)] font-black tracking-widest uppercase text-base mb-2 italic">Chế độ Thanh toán ELITE</h4>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium italic leading-relaxed">Tự động kết xuất báo cáo tài chính tinh lọc và thanh toán tự động qua cổng quốc tế.</p>
                                </div>
                                <div className="w-20 h-10 bg-[var(--bg-root)] rounded-full border border-[var(--border-primary)] relative cursor-not-allowed">
                                    <div className="absolute top-1 left-1 w-8 h-8 bg-[var(--bg-card)] rounded-full border border-[var(--border-primary)]/50 shadow-sm"></div>
                                </div>
                            </div>

                            <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                <p className="text-[10px] text-[var(--text-secondary)]/40 font-black uppercase tracking-[0.3em] italic text-center md:text-left">Thực hiện thay đổi với sự cẩn trọng tối đa</p>
                                <Button variant="ghost" className="text-rose-500 hover:bg-rose-500/10 tracking-widest uppercase text-[10px] font-black italic px-8 py-5 h-auto rounded-2xl border border-transparent hover:border-rose-500/20">Xóa vĩnh viễn dữ liệu cửa hàng</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
