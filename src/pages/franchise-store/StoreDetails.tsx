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
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-stone-500">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                <p className="text-xs font-black tracking-[0.2em] uppercase opacity-60">Đang chuẩn bị không gian tinh hoa...</p>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-stone-400 p-8 rounded-[3rem] bg-white/[0.02] border border-white/5">
                <StoreIcon className="w-16 h-16 text-stone-700 mb-6" />
                <h2 className="text-2xl font-light tracking-widest uppercase mb-2">Cửa hàng không tồn tại</h2>
                <p className="text-stone-600 mb-8 italic">Dữ liệu có thể đã bị di dời hoặc ID không chính xác.</p>
                <Button
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 tracking-widest uppercase text-[10px] font-black px-8 py-6 rounded-full"
                    onClick={() => navigate('/stores')}
                >
                    <ArrowLeft size={14} className="mr-3" /> Trở lại danh sách
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
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20 animate-in fade-in duration-1000">
            {/* Header Cinematic with Glassmorphism */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#121212] via-[#080808] to-[#121212] border border-white/5 p-8 md:p-12 shadow-2xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/[0.03] blur-[150px] -mr-40 -mt-40 rounded-full group-hover:bg-amber-500/10 transition-all duration-1000"></div>

                <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-stone-500 text-[10px] font-black tracking-[0.4em] uppercase">
                            <span className="hover:text-amber-500 cursor-pointer transition-colors" onClick={() => navigate('/stores')}>Franchise</span>
                            <span className="opacity-30">/</span>
                            <span className="text-stone-100">Cửa hàng #{store.storeId || store.id}</span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-8">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-stone-900 border border-white/5 flex items-center justify-center text-amber-500 shadow-2xl group-hover:scale-105 transition-all duration-700 group-hover:shadow-amber-500/20 group-hover:rotate-2">
                                <StoreIcon className="w-10 h-10 md:w-14 md:h-14" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-4">
                                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-2xl">
                                        {store.name}
                                    </h1>
                                </div>
                                <div className="flex flex-wrap items-center gap-8 text-stone-400 font-medium tracking-wide">
                                    <div className="flex items-center gap-2 group/loc cursor-default">
                                        <div className="p-1.5 rounded-lg bg-white/5 text-amber-500/80 group-hover/loc:bg-amber-500 group-hover/loc:text-black transition-all">
                                            <MapPin size={12} />
                                        </div>
                                        <span className="text-sm opacity-80 group-hover/loc:opacity-100 transition-opacity">{store.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Shield size={16} className="text-amber-500/60" />
                                        <span className="text-xs uppercase font-black tracking-[0.1em] opacity-40">Hệ thống phân phối tinh hoa</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button
                            onClick={() => navigate(`/ stores / ${store.storeId || store.id}/edit`)}
                            className="flex-1 md:flex-none bg-white/5 hover:bg-white/10 text-stone-300 border-white/5 hover:border-white/20 tracking-widest uppercase text-[10px] font-black px-8 py-7 h-auto rounded-[1.5rem] transition-all"
                        >
                            Hiệu chỉnh
                        </Button >
                        <Button
                            className="flex-1 md:flex-none bg-gradient-to-br from-amber-400 to-orange-600 hover:from-amber-500 hover:to-orange-700 text-black border-none tracking-widest uppercase text-[10px] font-black px-10 py-7 h-auto rounded-full shadow-[0_20px_40px_rgba(245,158,11,0.15)] hover:shadow-amber-500/40 hover:-translate-y-1 transition-all group/btn active:scale-95"
                            onClick={() => navigate('/orders/create', { state: { storeId: store.storeId || store.id } })}
                        >
                            Tạo đơn hàng <ExternalLink size={14} className="ml-3 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                        </Button>
                    </div >
                </div >
            </div >

            {/* Info Cards - Modern Dashboard Aesthetic */}
            < div className="grid grid-cols-1 md:grid-cols-3 gap-8" >
                {/* Contact Card */}
                < div className="group relative bg-[#0a0a0a] border border-white/[0.03] rounded-[2.5rem] p-10 hover:border-amber-500/20 transition-all duration-700 overflow-hidden shadow-2xl" >
                    <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 blur-3xl -ml-12 -mt-12 group-hover:bg-amber-500/10 transition-all"></div>

                    <div className="relative space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:rotate-6 transition-transform">
                                <UserIcon size={24} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-stone-500 group-hover:text-stone-300 transition-colors">Quản lý trực tiếp</h3>
                                <p className="text-sm font-medium text-stone-600 italic">Nhân sự chịu trách nhiệm</p>
                            </div>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-white/5">
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-amber-500/60 mb-2">Tên định danh</p>
                                <p className="text-2xl font-bold text-gray-100 tracking-tight italic uppercase">{store.managerName || 'Vô danh'}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-stone-400 hover:text-white transition-all hover:bg-white/[0.04]">
                                    <Phone size={16} className="text-amber-500/60" />
                                    <span className="text-sm font-mono tracking-tight">{store.phone || manager?.phone || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-stone-400 hover:text-white transition-all hover:bg-white/[0.04]">
                                    <Mail size={16} className="text-amber-500/60" />
                                    <span className="text-sm truncate font-medium">{store.email || manager?.email || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-stone-400 hover:text-white transition-all hover:bg-white/[0.04]">
                                    <MapPin size={16} className="text-amber-500/60 mt-0.5" />
                                    <span className="text-sm font-medium leading-relaxed">{store.address || manager?.address || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.01] border border-white/5 text-stone-500 hover:text-stone-300 transition-all">
                                        <Navigation size={14} className="text-amber-500/40 rotate-45" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase font-black tracking-widest opacity-40">Vĩ độ</span>
                                            <span className="text-xs font-mono">{store.latitude || '0.0'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.01] border border-white/5 text-stone-500 hover:text-stone-300 transition-all">
                                        <Navigation size={14} className="text-amber-500/40 -rotate-45" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase font-black tracking-widest opacity-40">Kinh độ</span>
                                            <span className="text-xs font-mono">{store.longitude || '0.0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* System Stats / Overview Card */}
                < div className="group relative bg-[#0a0a0a] border border-white/[0.03] rounded-[2.5rem] p-10 hover:border-amber-500/20 transition-all duration-700 overflow-hidden shadow-2xl" >
                    <div className="relative space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:rotate-6 transition-transform">
                                <LayoutDashboard size={24} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-stone-500 group-hover:text-stone-300 transition-colors">Tín hiệu hệ thống</h3>
                                <p className="text-sm font-medium text-stone-600 italic">Thống kê vận hành</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div className="p-5 rounded-3xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-colors">
                                <p className="text-[9px] uppercase font-black tracking-widest text-stone-600 mb-1">Hiệu suất</p>
                                <p className="text-xl font-black text-emerald-400">98.2%</p>
                            </div>
                            <div className="p-5 rounded-3xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-colors">
                                <p className="text-[9px] uppercase font-black tracking-widest text-stone-600 mb-1">Đơn hàng</p>
                                <p className="text-xl font-black text-amber-400">124</p>
                            </div>
                        </div>

                        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10">
                            <p className="text-[10px] uppercase font-black tracking-widest text-stone-400 mb-2">Ngày nhập hệ thống</p>
                            <p className="text-sm text-stone-100 font-bold tracking-wide italic">
                                {store.createdAt ? new Date(store.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }) : '01 Tháng 01, 2024'}
                            </p>
                        </div>
                    </div>
                </div >
            </div >

            {/* Navigation Tabs - Floating Bar Aesthetic */}
            < div className="sticky top-20 z-50 bg-[#080808]/80 backdrop-blur-3xl border border-white/5 rounded-full p-2.5 mt-16 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] max-w-2xl mx-auto" >
                <nav className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-700 whitespace-nowrap group relative
                                    ${active
                                        ? 'text-black'
                                        : 'text-stone-500 hover:text-stone-200'}
                                `}
                            >
                                {active && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-in zoom-in-95 duration-500"></div>
                                )}
                                <Icon size={18} className={`relative z-10 ${active ? 'scale-110' : 'opacity-40 group-hover:opacity-100 group-hover:scale-110'} transition-all duration-300`} />
                                <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div >

            {/* Tab Content Display Area */}
            < div className="relative mt-8 min-h-[600px] animate-in slide-in-from-bottom-12 fade-in duration-1000" >
                {activeTab === 'Overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Dynamic Quick Stats */}
                        {[
                            { label: 'Doanh thu trung bình', value: '18.2M', trend: '+14%', color: 'text-emerald-400', sub: 'Mỗi tháng' },
                            { label: 'Số sản phẩm lưu kho', value: '42', trend: 'Stable', color: 'text-stone-400', sub: 'Danh mục' },
                            { label: 'Thời gian vận chuyển', value: '45m', trend: '-8m', color: 'text-sky-400', sub: 'Trung bình' },
                            { label: 'Điểm hài lòng', value: '4.9/5', trend: 'Elite', color: 'text-amber-400', sub: 'Phản hồi' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-[#0a0a0a] border border-white/[0.03] rounded-[2rem] p-8 hover:bg-white/[0.01] transition-all hover:-translate-y-1 shadow-xl">
                                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-stone-600 mb-6">{stat.label}</p>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-3xl font-black text-white tracking-tighter italic">{stat.value}</p>
                                        <p className="text-[9px] text-stone-600 font-bold uppercase mt-1 tracking-widest">{stat.sub}</p>
                                    </div>
                                    <span className={`text-[9px] font-black tracking-[0.2em] px-2.5 py-1 rounded-full bg-white/5 border border-white/5 ${stat.color} uppercase`}>
                                        {stat.trend}
                                    </span>
                                </div>
                            </div>
                        ))}

                        <div className="col-span-full h-[500px] bg-[#0a0a0a] border-2 border-dashed border-white/[0.03] rounded-[3rem] flex items-center justify-center text-stone-700 group overflow-hidden relative shadow-2xl">
                            <div className="absolute inset-0 bg-stone-900/10 pointer-events-none"></div>
                            <div className="relative text-center max-w-md px-10">
                                <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-white/5 flex items-center justify-center text-stone-800 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                                    <LayoutDashboard className="w-10 h-10" />
                                </div>
                                <h4 className="text-xl font-black text-stone-400 uppercase tracking-widest mb-4">Mô-đun Phân tích Cao cấp</h4>
                                <p className="text-sm font-medium text-stone-600 italic leading-relaxed">
                                    Hệ thống đang thu thập dữ liệu vận hành từ mạng lưới IoT và AI để kiến tạo các biểu đồ trực quan hóa dữ liệu tinh vi nhất.
                                </p>
                                <div className="mt-10 flex items-center justify-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-700 italic">Đang được chuẩn bị cho v2.0-ELITE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {
                    activeTab === 'Inventory' && (
                        <div className="animate-in fade-in zoom-in-95 duration-700 rounded-[3rem] overflow-hidden shadow-2xl">
                            <StoreInventory storeId={Number(id)} />
                        </div>
                    )
                }

                {
                    activeTab === 'Orders' && (
                        <div className="animate-in fade-in duration-700">
                            <StoreOrders storeId={Number(id)!} />
                        </div>
                    )
                }

                {
                    activeTab === 'Staff' && (
                        <div className="animate-in fade-in duration-700">
                            <StoreStaff storeId={Number(id)!} />
                        </div>
                    )
                }

                {
                    activeTab === 'Settings' && (
                        <div className="max-w-3xl mx-auto space-y-8 py-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                            <div className="bg-[#0a0a0a] border border-white/[0.03] rounded-[3rem] p-12 space-y-10 shadow-2xl">

                                <div className="flex items-center justify-between border-b border-white/5 pb-10 opacity-40">
                                    <div className="max-w-md">
                                        <h4 className="text-white font-black tracking-widest uppercase text-base mb-2 italic">Chế độ Thanh toán ELITE</h4>
                                        <p className="text-xs text-stone-600 font-medium italic leading-relaxed">Tự động kết xuất báo cáo tài chính tinh lọc và thanh toán tự động qua cổng quốc tế.</p>
                                    </div>
                                    <div className="w-20 h-10 bg-white/5 rounded-full border border-white/10 relative cursor-not-allowed">
                                        <div className="absolute top-1 left-1 w-8 h-8 bg-stone-800 rounded-full border border-white/5"></div>
                                    </div>
                                </div>

                                <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <p className="text-[10px] text-stone-700 font-black uppercase tracking-[0.3em] italic">Thực hiện thay đổi với sự cẩn trọng tối đa</p>
                                    <Button variant="ghost" className="text-rose-500 hover:bg-rose-500/10 tracking-widest uppercase text-[10px] font-black italic px-8 py-5 h-auto rounded-2xl border border-transparent hover:border-rose-500/20">Xóa vĩnh viễn dữ liệu cửa hàng</Button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
};
