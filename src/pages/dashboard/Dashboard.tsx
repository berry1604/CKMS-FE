import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, Activity, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { NavItem, NavigationItem } from '../../layouts/MainLayout';
import { navigation } from '../../layouts/MainLayout';
import { hasPermission } from '../../config/permissions';

export interface DashboardStats {
    totalRevenue: number;
    activeStores: number;
    pendingOrders: number;
    activeUsers: number;
}

export interface RecentActivity {
    id: string;
    action: string;
    user: string;
    time: string;
    status: 'success' | 'warning' | 'error' | 'pending';
    type: 'order' | 'inventory' | 'system' | 'user';
}

export const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [_stats, _setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        activeStores: 0,
        pendingOrders: 0,
        activeUsers: 0
    });

    // Add some mock recent activity just for visual presentation
    const [recentActivity, _setRecentActivity] = useState<RecentActivity[]>([
        { id: '1', action: 'Đơn hàng #ORD-001 mới được tạo', user: 'Hệ thống', time: '10 phút trước', status: 'success', type: 'order' },
        { id: '2', action: 'Cảnh báo tồn kho: Bột mì', user: 'Hệ thống', time: '1 giờ trước', status: 'warning', type: 'inventory' },
        { id: '3', action: 'Người dùng mới đăng ký', user: 'Admin', time: '2 giờ trước', status: 'success', type: 'user' },
    ]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // Placeholder for actual API integration
            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) loadDashboardData();
    }, [user]);

    // Gather permitted quick links from `navigation`
    const permittedLinks = navigation.reduce<NavItem[]>((acc, nav: NavigationItem) => {
        if ('category' in nav) {
            const allowedItems = nav.items.filter((item: NavItem) => !item.permission || hasPermission(user, item.permission));
            acc.push(...allowedItems);
        } else {
            if (!nav.permission || hasPermission(user, nav.permission)) {
                if (nav.href !== '/') acc.push(nav); // Skip Dashboard itself
            }
        }
        return acc;
    }, []);

    const StatCard = ({ title, value, icon: Icon, colorClass, borderClass, trend }: { title: string; value: string | number; icon: any; colorClass: string, borderClass: string, trend?: string }) => (
        <Card className={`relative overflow-hidden flex flex-col p-6 border-0 shadow-lg ${borderClass} bg-zinc-900/60 backdrop-blur-sm group hover:-translate-y-1 transition-all duration-300`}>
            {/* Background Glow */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colorClass} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 text-white shadow-inner ring-1 ring-white/5`}>
                    <Icon size={24} className="opacity-90" />
                </div>
                {trend && (
                    <Badge variant="success" className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm">
                        <TrendingUp size={12} className="mr-1" /> {trend}
                    </Badge>
                )}
            </div>
            <div className="relative z-10">
                <h3 className="text-3xl font-extrabold text-white mb-1 tracking-tight drop-shadow-sm">
                    {value !== undefined && value !== null ? value : '-'}
                </h3>
                <p className="text-sm font-medium text-zinc-400">{title}</p>
            </div>
        </Card>
    );

    const currentDate = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/30 p-8 border border-zinc-800 shadow-xl">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Activity size={200} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold mb-4 backdrop-blur-md">
                            <Clock size={14} />
                            {currentDate}
                        </div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tight mb-2">
                            Chào mừng trở lại, {user?.name || 'User'}!
                        </h1>
                        <p className="text-zinc-400 text-lg">Hôm nay FranchiseSys có gì mới?</p>
                    </div>
                    <div className="flex gap-3">
                        {isLoading && (
                            <span className="flex items-center px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-medium rounded-xl animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-ping"></div>
                                Đang tải...
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {user?.role !== 'KITCHEN_STAFF' && (
                    <StatCard
                        title="Tổng doanh thu"
                        value={`$${_stats?.totalRevenue.toLocaleString()}`}
                        icon={DollarSign}
                        colorClass="bg-emerald-500"
                        borderClass="ring-1 ring-emerald-500/20"
                        trend="+12%"
                    />
                )}
                <StatCard
                    title={user?.role === 'MANAGER' ? 'Cửa hàng của tôi' : "Cửa hàng hoạt động"}
                    value={_stats?.activeStores || 0}
                    icon={ShoppingBag}
                    colorClass="bg-blue-500"
                    borderClass="ring-1 ring-blue-500/20"
                    trend={user?.role === 'ADMIN' ? '+2 tuần này' : undefined}
                />
                <StatCard
                    title={user?.role === 'KITCHEN_STAFF' ? 'Nhiệm vụ sản xuất' : "Đơn hàng chờ xử lý"}
                    value={_stats?.pendingOrders || 0}
                    icon={Activity}
                    colorClass="bg-orange-500"
                    borderClass="ring-1 ring-orange-500/20"
                />
                <StatCard
                    title={user?.role === 'MANAGER' ? 'Nhân viên' : "Người dùng hoạt động"}
                    value={_stats?.activeUsers || 0}
                    icon={Users}
                    colorClass="bg-purple-500"
                    borderClass="ring-1 ring-purple-500/20"
                />
            </div>

            {/* Quick Access/Workspace Grid */}
            {permittedLinks.length > 0 && (
                <div className="backdrop-blur-sm bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        Bảng điều khiển tác vụ
                        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">Truy cập nhanh</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                        {permittedLinks.map((link: NavItem, idx: number) => {
                            const Icon = link.icon;
                            // Consistent color palette
                            const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500'];
                            const colorClass = colors[idx % colors.length];

                            return (
                                <button
                                    key={link.href}
                                    onClick={() => navigate(link.href)}
                                    className="flex flex-col items-center justify-center p-5 bg-zinc-900/60 rounded-2xl shadow-sm border border-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700 hover:shadow-md transition-all duration-300 group"
                                >
                                    <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-20 text-white mb-3 group-hover:-translate-y-1 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 ring-1 ring-white/10`}>
                                        <Icon size={24} className="opacity-90 drop-shadow-md" />
                                    </div>
                                    <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors text-center line-clamp-2">
                                        {link.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <Card title="Biểu đồ doanh thu" className="lg:col-span-2 border border-zinc-800/60 shadow-lg bg-zinc-900/50 backdrop-blur-sm rounded-3xl overflow-hidden p-6">
                    <div className="h-72 flex items-end justify-between px-2 mt-4 gap-3 relative">
                        {/* Horizontal guide lines */}
                        <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none opacity-10">
                            {[0, 1, 2, 3, 4].map(l => <div key={l} className="w-full border-t border-white" />)}
                        </div>

                        {[65, 59, 80, 81, 56, 55, 40, 70, 75, 60, 90, 85].map((val, idx) => (
                            <div key={idx} className="w-full flex-1 flex flex-col items-center gap-3 group relative z-10 hover:cursor-crosshair">
                                {/* Tooltip */}
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap shadow-xl border border-zinc-700">
                                    {val}%
                                </div>
                                <div className="w-full relative h-[220px] flex items-end justify-center">
                                    <div
                                        className="w-full max-w-[36px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-xl opacity-70 group-hover:opacity-100 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-300"
                                        style={{ height: `${val}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-zinc-500 font-bold uppercase group-hover:text-zinc-300 transition-colors">
                                    {'T1,T2,T3,T4,T5,T6,T7,T8,T9,T10,T11,T12'.split(',')[idx]}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card title="Hoạt động gần đây" className="border border-zinc-800/60 shadow-lg bg-zinc-900/50 backdrop-blur-sm h-full rounded-3xl p-6">
                    <div className="space-y-4 mt-4">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="group flex items-start p-4 rounded-2xl hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-800/80">
                                <div className="mr-4 mt-1 relative">
                                    <div className="absolute inset-0 bg-current opacity-20 blur-md rounded-full group-hover:opacity-40 transition-opacity"></div>
                                    <div className="relative">
                                        {activity.status === 'success' && <CheckCircle className="text-emerald-500" size={20} />}
                                        {activity.status === 'warning' && <AlertCircle className="text-amber-500" size={20} />}
                                        {activity.status === 'error' && <AlertCircle className="text-rose-500" size={20} />}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{activity.action}</p>
                                    <div className="flex items-center mt-2.5">
                                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600 flex items-center justify-center text-[10px] text-white font-bold mr-2 shadow-sm">
                                            {activity.user.charAt(0)}
                                        </div>
                                        <p className="text-xs text-zinc-500 font-medium">Bởi <span className="text-zinc-400">{activity.user}</span> • {activity.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {recentActivity.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                <Activity className="text-zinc-500 mb-3" size={32} />
                                <p className="text-center text-zinc-500 text-sm font-medium">Không có hoạt động gần đây.</p>
                            </div>
                        )}
                    </div>
                    {recentActivity.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-zinc-800/60 text-center">
                            <Button variant="ghost" size="sm" className="w-full text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 font-semibold rounded-xl">
                                Xem toàn bộ hoạt động
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};
