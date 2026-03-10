import { useEffect, useState } from 'react';
import {
    Download, TrendingUp, DollarSign,
    ShoppingBag, Users, Store, Activity, BarChart3,
    Target, Zap, Sparkles, ChevronRight, Calendar
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export interface SalesData {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

export interface StorePerformance {
    storeName: string;
    revenue: number;
    orders: number;
    rating: number;
}

export interface ProductPerformance {
    name: string;
    sales: number;
    growth: number;
    status: 'HOT' | 'STABLE' | 'TRENDING';
}

export const ReportsDashboard = () => {
    const [salesData, setSalesData] = useState<SalesData[]>([]);
    const [topStores, setTopStores] = useState<StorePerformance[]>([]);
    const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Enhanced Mock Data for Cinematic Effect
                setSalesData([
                    { month: 'Jan', revenue: 450000, expenses: 310000, profit: 140000 },
                    { month: 'Feb', revenue: 520000, expenses: 340000, profit: 180000 },
                    { month: 'Mar', revenue: 480000, expenses: 320000, profit: 160000 },
                    { month: 'Apr', revenue: 610000, expenses: 380000, profit: 230000 },
                    { month: 'May', revenue: 590000, expenses: 370000, profit: 220000 },
                    { month: 'Jun', revenue: 750000, expenses: 420000, profit: 330000 },
                ]);

                setTopStores([
                    { storeName: 'Hà Nội Central', revenue: 1250000, orders: 4500, rating: 4.9 },
                    { storeName: 'Sài Gòn Elite', revenue: 980000, orders: 3800, rating: 4.8 },
                    { storeName: 'Đà Nẵng Riverside', revenue: 750000, orders: 2900, rating: 4.7 },
                ]);

                setTopProducts([
                    { name: 'Thịt bò Wagyu A5', sales: 1240, growth: 15.4, status: 'HOT' },
                    { name: 'Sườn cừu Premium', sales: 890, growth: 8.2, status: 'TRENDING' },
                    { name: 'Rượu vang Chateau', sales: 650, growth: -2.1, status: 'STABLE' },
                    { name: 'Hải sản tổng hợp', sales: 520, growth: 12.5, status: 'HOT' },
                ]);
            } catch (error) {
                console.error("Failed to load report data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
    const totalProfit = salesData.reduce((sum, item) => sum + item.profit, 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const EliteBarChart = ({ data }: { data: SalesData[] }) => {
        const maxVal = Math.max(...data.map(d => d.revenue));
        return (
            <div className="flex items-end justify-between h-64 gap-4 mt-8 px-4 relative">
                {/* Background Grid Lines */}
                <div className="absolute inset-x-0 top-0 h-px bg-white/5"></div>
                <div className="absolute inset-x-0 top-1/4 h-px bg-white/5"></div>
                <div className="absolute inset-x-0 top-2/4 h-px bg-white/5"></div>
                <div className="absolute inset-x-0 top-3/4 h-px bg-white/5"></div>

                {data.map((item) => (
                    <div key={item.month} className="flex flex-col items-center gap-4 group w-full relative z-10">
                        <div className="relative w-full flex justify-center items-end h-full">
                            {/* Revenue Bar */}
                            <div
                                className="w-full max-w-[48px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] relative"
                                style={{ height: `${(item.revenue / maxVal) * 100}%` }}
                            >
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 text-white text-[10px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 whitespace-nowrap z-20 shadow-xl">
                                    <div className="text-amber-400 font-bold">DT: {item.revenue.toLocaleString()}đ</div>
                                    <div className="text-gray-400">CP: {item.expenses.toLocaleString()}đ</div>
                                </div>
                            </div>

                            {/* Expense Overlay Line (Abstract) */}
                            <div
                                className="absolute bottom-0 w-1.5 bg-white/20 rounded-full blur-[1px]"
                                style={{ height: `${(item.expenses / maxVal) * 100}% ` }}
                            ></div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter group-hover:text-amber-500 transition-colors">
                            {item.month}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-spin"></div>
                </div>
                <div className="text-amber-500 text-sm font-bold tracking-widest animate-pulse italic uppercase">Tracing Analytics...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-100 pb-20">
            {/* Immersive Analytical Header */}
            <div className="relative h-80 w-full overflow-hidden">
                <img
                    src="/Users/phunghuyphuoc/.gemini/antigravity/brain/5ad3745d-382e-481d-8167-b732c447a69b/analytics_dashboard_bg_1773027497501.png"
                    className="w-full h-full object-cover scale-110 opacity-30 text-transparent blur-[2px]"
                    alt="Analytics Cockpit"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/70 to-[#0a0a0a]"></div>

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-16 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between gap-6">
                        <div className="animate-in fade-in slide-in-from-bottom duration-1000">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                    <BarChart3 className="text-amber-500" size={28} />
                                </div>
                                <div>
                                    <h1 className="text-5xl font-black tracking-tighter text-white italic uppercase leading-none">
                                        REPORT <span className="text-amber-500">COCKPIT</span>
                                    </h1>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Calendar size={14} className="text-amber-500/60" />
                                        <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Q2 2024 Performance Overview</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 animate-in fade-in slide-in-from-right duration-1000">
                            <Button variant="ghost" className="bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl h-12 px-6">
                                <Activity size={18} className="mr-2" /> Live Monitor
                            </Button>
                            <Button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black px-8 rounded-xl shadow-xl shadow-amber-500/20 h-12 flex items-center gap-2 active:scale-95 transition-all">
                                <Download size={20} /> XUẤT BÁO CÁO
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 -mt-10 relative z-10 space-y-8">
                {/* Luminous KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Tổng Doanh Thu', value: `${(totalRevenue / 1000000).toFixed(1)} M`, trend: '+12.5%', icon: DollarSign, color: 'amber' },
                        { label: 'Lợi Nhuận Ròng', value: `${(totalProfit / 1000000).toFixed(1)} M`, trend: `${profitMargin.toFixed(1)}% `, icon: TrendingUp, color: 'blue' },
                        { label: 'Điểm Bán Hoạt Động', value: topStores.length, trend: '+2 Mới', icon: Store, color: 'purple' },
                        { label: 'Tỉ Lệ Chuyển Đổi', value: '24.8%', trend: '+1.2%', icon: Target, color: 'green' }
                    ].map((kpi, i) => (
                        <div key={i} className="group relative">
                            <div className={`absolute - inset - 0.5 bg - gradient - to - r ${kpi.color === 'amber' ? 'from-amber-500 to-orange-500' :
                                    kpi.color === 'blue' ? 'from-blue-500 to-indigo-500' :
                                        kpi.color === 'purple' ? 'from-purple-500 to-pink-500' :
                                            'from-green-500 to-emerald-500'
                                } rounded - 2xl opacity - 10 group - hover: opacity - 25 transition duration - 500 blur`}></div>
                            <div className="relative backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-2xl h-full flex flex-col justify-between transition-transform duration-500 hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p - 2 bg - ${kpi.color} -500 / 20 rounded - lg border border - ${kpi.color} -500 / 30`}>
                                        <kpi.icon className={`text - ${kpi.color} -500`} size={20} />
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                        <Zap size={10} /> {kpi.trend}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{kpi.label}</p>
                                    <h3 className="text-3xl font-black text-white mt-1 italic leading-none">{kpi.value}</h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Multi-Layer Chart */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <TrendingUp size={120} className="text-amber-500" />
                            </div>

                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Doanh Thu vs Chi Phí</h3>
                                    <p className="text-xs text-gray-500 font-medium">Phân tích dòng tiền 6 tháng gần nhất</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doanh thu</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-white/20 rounded-full"></div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chi phí</span>
                                    </div>
                                </div>
                            </div>

                            <EliteBarChart data={salesData} />
                        </div>

                        {/* Secondary Product Performance */}
                        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Xếp hạng sản phẩm</h3>
                                <button className="text-[10px] font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest flex items-center gap-2">
                                    Xem tất cả <ChevronRight size={14} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {topProducts.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-colors group">
                                        <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-amber-500 font-black text-lg group-hover:bg-amber-500 group-hover:text-black transition-colors shadow-inner">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-gray-200 truncate">{p.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-white bg-white/10 px-2 py-0.5 rounded uppercase">{p.status}</span>
                                                <span className={`text - [10px] font - bold ${p.growth > 0 ? 'text-green-500' : 'text-red-500'} `}>
                                                    {p.growth > 0 ? '+' : ''}{p.growth}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-white">{p.sales.toLocaleString()}</div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Đơn vị</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Store Performance Cockpit */}
                    <div className="space-y-6">
                        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl h-full flex flex-col">
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Performance Cửa Hàng</h3>
                                <p className="text-xs text-gray-500 font-medium">Bảng xếp hạng hiệu năng điểm bán</p>
                            </div>

                            <div className="space-y-8 flex-1">
                                {topStores.map((store, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-[10px] font-black text-amber-500 block mb-1">RANK #{idx + 1}</span>
                                                <h4 className="text-sm font-bold text-white uppercase tracking-tight">{store.storeName}</h4>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-white">{(store.revenue / 1000000).toFixed(2)}M</div>
                                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Doanh thu</div>
                                            </div>
                                        </div>
                                        <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-600/50 to-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all duration-1000 delay-300"
                                                style={{ width: `${(store.revenue / 1500000) * 100}% ` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <ShoppingBag size={12} className="text-amber-500/60" />
                                                <span>{store.orders} GD</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users size={12} className="text-amber-500/60" />
                                                <span>Rating {store.rating}/5</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl relative overflow-hidden">
                                <Sparkles className="absolute -right-4 -bottom-4 text-amber-500 opacity-10" size={80} />
                                <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">Hệ thống đồng bộ</h4>
                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                    Dữ liệu được cập nhật thời gian thực từ tất cả các điểm bán trên toàn quốc.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
