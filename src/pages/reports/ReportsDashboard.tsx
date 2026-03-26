import { useEffect, useState } from 'react';
import {
    Download, TrendingUp, DollarSign,
    ShoppingBag, Store, Activity, BarChart3,
    Target, Zap, Sparkles, AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { billingApi } from '../../services/billing.api';
import { useAuth } from '../../hooks/useAuth';

export interface SalesData {
    month: string;
    revenue: number;
    expenses: number;
    profit: number; // calculated for UI compatibility, although we only have Revenue
}

export interface StorePerformance {
    storeName: string;
    revenue: number;
    orders: number;
    rating: number; // Placeholder since Backend doesn't have ratings yet
}

export const ReportsDashboard = () => {
    const { user } = useAuth();
    const role = user?.role?.replace('ROLE_', '');

    const [salesData, setSalesData] = useState<SalesData[]>([]);
    const [topStores, setTopStores] = useState<StorePerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalUnpaid, setTotalUnpaid] = useState(0);
    const [totalOverdue, setTotalOverdue] = useState(0);
    const [totalStatements, setTotalStatements] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            if (role !== 'MANAGER') {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                // Lấy 500 hóa đơn gần nhất để thống kê
                const res = await billingApi.getStatements({ page: 0, size: 500 });
                const statements = res.content || [];
                setTotalStatements(statements.length);

                let revenue = 0;
                let unpaid = 0;
                let overdue = 0;

                const monthMap: Record<string, number> = {};
                const storeMap: Record<string, { storeName: string, revenue: number, orders: number }> = {};

                statements.forEach((stmt: any) => {
                    const amount = stmt.totalAmount || 0;
                    
                    if (stmt.status === 'PAID') {
                        revenue += amount;
                        
                        // Parse month from paidAt or issuedAt
                        const dateCode = stmt.paidAt || stmt.issuedAt;
                        if (dateCode) {
                            const d = new Date(dateCode);
                            const year = d.getFullYear();
                            const quarter = Math.floor(d.getMonth() / 3) + 1;
                            const key = `${year}-Q${quarter}`;
                            
                            if (!monthMap[key]) monthMap[key] = 0;
                            monthMap[key] += amount;
                        }

                        // Tính Store Performance
                        const storeName = stmt.store?.storeName || `Cửa hàng #${stmt.store?.storeId || 'N/A'}`;
                        if (!storeMap[storeName]) storeMap[storeName] = { storeName, revenue: 0, orders: 0 };
                        storeMap[storeName].revenue += amount;
                        storeMap[storeName].orders += 1;

                    } else if (stmt.status === 'UNPAID') {
                        unpaid += amount;
                    } else if (stmt.status === 'OVERDUE') {
                        overdue += amount;
                    }
                });

                setTotalRevenue(revenue);
                setTotalUnpaid(unpaid);
                setTotalOverdue(overdue);

                // Format và Sort SalesData theo thời gian
                const sortedKeys = Object.keys(monthMap).sort();
                // Lấy 4 quý gần nhất
                const recentKeys = sortedKeys.slice(-4);
                
                const finalSalesData = recentKeys.map(key => {
                    const [year, quarter] = key.split('-');
                    return {
                        month: `${quarter}/${year.slice(-2)}`,
                        revenue: monthMap[key],
                        expenses: 0, 
                        profit: monthMap[key] 
                    };
                });
                setSalesData(finalSalesData);

                // Sort Top Stores theo Doanh thu
                const sortedStores = Object.values(storeMap)
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5)
                    .map(store => ({ ...store, rating: 5.0 })); // Backend chưa có rating
                
                setTopStores(sortedStores);

            } catch (error) {
                console.error("Lỗi khi tải dữ liệu báo cáo:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [role]);

    const EliteBarChart = ({ data }: { data: SalesData[] }) => {
        const maxVal = Math.max(...data.map(d => d.revenue), 1);
        
        if (data.length === 0) {
            return (
                <div className="flex items-center justify-center h-64 text-gray-500 italic text-sm">
                    Chưa có dữ liệu doanh thu hợp lệ để vẽ biểu đồ
                </div>
            )
        }

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
                                    <div className="text-amber-400 font-bold">DT: {item.revenue.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter group-hover:text-amber-500 transition-colors">
                            {item.month}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    if (role !== 'MANAGER') {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <AlertCircle size={48} className="text-red-500 mb-4 opacity-80" />
                <h2 className="text-2xl font-black tracking-tighter text-white">CHỈ DÀNH CHO MANAGER</h2>
                <div className="text-gray-500 text-sm italic">Báo cáo doanh thu là tính năng bảo mật cấp cao, chỉ Manager mới có quyền truy cập.</div>
            </div>
        );
    }

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
        <div className="min-h-screen bg-[#0a0a0a] text-gray-100 pb-20 -m-4 md:-m-8">
            {/* Immersive Analytical Header */}
            <div className="relative h-80 w-full overflow-hidden bg-zinc-900 border-b border-white/[0.02]">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px]"></div>
                
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
                                        REVENUE <span className="text-amber-500">COCKPIT</span>
                                    </h1>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Activity size={14} className="text-amber-500/60" />
                                        <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">SteakChain Manager Real-time Report</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 animate-in fade-in slide-in-from-right duration-1000">
                            <Button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black px-8 rounded-xl shadow-xl shadow-amber-500/20 h-12 flex items-center gap-2 active:scale-95 transition-all outline-none">
                                <Download size={20} /> XUẤT CSV
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 -mt-10 relative z-10 space-y-8">
                {/* Luminous KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Doanh Thu Đã Thu', value: `${(totalRevenue / 1000000).toFixed(1)}M`, trend: `${totalStatements} Hóa Đơn`, icon: DollarSign, color: 'emerald' },
                        { label: 'Chờ Thanh Toán', value: `${(totalUnpaid / 1000000).toFixed(1)}M`, trend: 'Billing Mới', icon: Target, color: 'blue' },
                        { label: 'Công Nợ Quá Hạn', value: `${(totalOverdue / 1000000).toFixed(1)}M`, trend: 'Alert', icon: AlertCircle, color: 'red' },
                        { label: 'Điểm Bán Active', value: topStores.length, trend: 'Có doanh thu', icon: Store, color: 'amber' }
                    ].map((kpi, i) => (
                        <div key={i} className="group relative">
                            <div className={`absolute -inset-0.5 bg-gradient-to-r ${
                                    kpi.color === 'amber' ? 'from-amber-500 to-orange-500' :
                                    kpi.color === 'blue' ? 'from-blue-500 to-indigo-500' :
                                    kpi.color === 'red' ? 'from-red-500 to-rose-500' :
                                    'from-green-500 to-emerald-500'
                                } rounded-2xl opacity-10 group-hover:opacity-25 transition duration-500 blur`}></div>
                            <div className="relative backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-2xl h-full flex flex-col justify-between transition-transform duration-500 hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 bg-${kpi.color}-500/20 rounded-lg border border-${kpi.color}-500/30`}>
                                        <kpi.icon className={`text-${kpi.color}-500`} size={20} />
                                    </div>
                                    <div className={`flex items-center gap-1 text-[10px] font-black text-${kpi.color}-500 bg-${kpi.color}-500/10 px-2 py-0.5 rounded-full border border-${kpi.color}-500/20`}>
                                        <Zap size={10} /> {kpi.trend}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{kpi.label}</p>
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
                        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group h-full flex flex-col">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <TrendingUp size={120} className="text-amber-500" />
                            </div>

                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Doanh Thu Các Quý</h3>
                                    <p className="text-xs text-gray-500 font-medium">Lưu lượng tiền thực tế (chỉ tính hóa đơn PAID)</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DT Thực thu</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <EliteBarChart data={salesData} />
                            </div>
                        </div>
                    </div>

                    {/* Store Performance Cockpit */}
                    <div className="space-y-6">
                        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl h-[450px] flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Cửa Hàng Tích Cực</h3>
                                <p className="text-xs text-gray-500 font-medium">Bảng xếp hạng đóng góp doanh thu</p>
                            </div>

                            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-2">
                                {topStores.length === 0 && (
                                    <div className="text-center text-sm text-gray-500 italic mt-10">
                                        Chưa có cửa hàng nào tạo lợi nhuận...
                                    </div>
                                )}
                                {topStores.map((store, idx) => (
                                    <div key={idx} className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <span className="text-[10px] font-black text-amber-500 block mb-0.5">TOP #{idx + 1}</span>
                                                <h4 className="text-[13px] font-bold text-white uppercase tracking-tight truncate max-w-[120px]">{store.storeName}</h4>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-white">{(store.revenue / 1000000).toFixed(2)}M</div>
                                            </div>
                                        </div>
                                        <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-600/50 to-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all duration-1000 delay-300"
                                                style={{ width: `${(store.revenue / Math.max(...topStores.map(s=>s.revenue))) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <ShoppingBag size={12} className="text-amber-500/60" />
                                                <span>{store.orders} Hóa Đơn (Phát sinh)</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Decorative Sparkle Footer */}
                            <div className="absolute right-4 bottom-4 w-12 h-12 flex justify-end items-end">
                                <Sparkles className="text-amber-500/10" size={80} style={{ transform: 'translate(40%, 40%)' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
