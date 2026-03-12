import { useEffect, useState } from 'react';
import {
    DollarSign, ShoppingBag, Users, Activity, TrendingUp,
    AlertCircle, CheckCircle, Clock, Package, Truck, ChefHat,
    RefreshCw
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { NavItem, NavigationItem } from '../../layouts/MainLayout';
import { navigation } from '../../layouts/MainLayout';
import { hasPermission } from '../../config/permissions';
import { storeApi } from '../../services/store.api';
import { storeOrderApi } from '../../services/storeOrderApi';
import { userService } from '../../services/user.service';
import { shipmentApi } from '../../services/shipment.api';
import { billingApi } from '../../services/billing.api';
import { productionPlanApi } from '../../services/productionPlan.api';

interface DashboardStats {
    totalRevenue: number;
    activeStores: number;
    pendingOrders: number;
    activeUsers: number;
    pendingShipments: number;
    totalBilling: number;
    productionPlans: number;
}

interface RecentOrderItem {
    id: number;
    storeName: string;
    status: string;
    totalAmount: number;
    orderDate: string;
}

interface RecentShipmentItem {
    id: number;
    storeName: string;
    status: string;
    createdAt: string;
}

const statusColor: Record<string, string> = {
    SUBMITTED: 'warning',
    APPROVED: 'orange',
    ALLOCATED: 'info',
    DELIVERED: 'success',
    REJECTED: 'danger',
    DRAFT: 'default',
    PENDING: 'orange',
    PREPARED: 'info',
    IN_TRANSIT: 'primary',
    CANCELLED: 'danger',
};

const statusLabel: Record<string, string> = {
    SUBMITTED: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    ALLOCATED: 'Đã phân bổ',
    DELIVERED: 'Hoàn thành',
    REJECTED: 'Từ chối',
    DRAFT: 'Bản nháp',
    PENDING: 'Mới tạo',
    PREPARED: 'Đã chuẩn bị',
    IN_TRANSIT: 'Đang giao',
    CANCELLED: 'Đã hủy',
};

export const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        activeStores: 0,
        pendingOrders: 0,
        activeUsers: 0,
        pendingShipments: 0,
        totalBilling: 0,
        productionPlans: 0,
    });

    const [recentOrders, setRecentOrders] = useState<RecentOrderItem[]>([]);
    const [recentShipments, setRecentShipments] = useState<RecentShipmentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const role = user?.role;

    const loadDashboardData = async () => {
        setIsLoading(true);
        setLoadError(false);
        try {
            const newStats: DashboardStats = {
                totalRevenue: 0,
                activeStores: 0,
                pendingOrders: 0,
                activeUsers: 0,
                pendingShipments: 0,
                totalBilling: 0,
                productionPlans: 0,
            };

            // --- Stores count (ADMIN, COORDINATOR) ---
            if (role === 'ADMIN' || role === 'COORDINATOR') {
                try {
                    const storeRes = await storeApi.getAllStores({ size: 1 });
                    newStats.activeStores = storeRes?.data?.totalElements || 0;
                } catch { /* permission not available */ }
            }

            // --- Orders (all roles except KITCHEN_STAFF) ---
            if (role !== 'KITCHEN_STAFF') {
                try {
                    let orderRes;
                    if (role === 'ADMIN' || role === 'COORDINATOR') {
                        orderRes = await storeOrderApi.getAllOrders({ size: 5, page: 0 });
                    } else {
                        orderRes = await storeOrderApi.getMyOrders({ size: 5, page: 0 });
                    }
                    // Total pending/submitted
                    newStats.pendingOrders = orderRes?.totalElements || 0;
                    // Recent orders for activity feed
                    const items = (orderRes?.content || []).slice(0, 5).map((o: any) => ({
                        id: o.orderId,
                        storeName: o.storeName || `Cửa hàng #${o.storeId}`,
                        status: o.status,
                        totalAmount: o.totalAmount || 0,
                        orderDate: o.orderDate,
                    }));
                    setRecentOrders(items);
                } catch { /* ignore */ }
            }

            // --- Users count (ADMIN only) ---
            if (role === 'ADMIN') {
                try {
                    const userRes = await userService.getUsers({ size: 1 });
                    newStats.activeUsers = userRes?.data?.totalElements || 0;
                } catch { /* ignore */ }
            }

            // --- Shipments (ADMIN, COORDINATOR, KITCHEN_STAFF) ---
            if (role === 'ADMIN' || role === 'COORDINATOR' || role === 'KITCHEN_STAFF') {
                try {
                    const shipRes = await shipmentApi.getShipments({ size: 5, page: 0 });
                    newStats.pendingShipments = shipRes?.totalElements || 0;
                    const shipItems = (shipRes?.content || []).slice(0, 5).map((s: any) => ({
                        id: s.shipmentId,
                        storeName: s.storeName || `Cửa hàng #${s.storeId}`,
                        status: s.status,
                        createdAt: s.createdAt,
                    }));
                    setRecentShipments(shipItems);
                } catch { /* ignore */ }
            }

            // --- Billing (ADMIN only) ---
            if (role === 'ADMIN') {
                try {
                    const billRes = await billingApi.getStatements({ size: 1 });
                    newStats.totalRevenue = billRes?.totalElements || 0;
                } catch { /* ignore */ }
            }

            // --- Production Plans (KITCHEN_STAFF, COORDINATOR, ADMIN) ---
            if (role === 'KITCHEN_STAFF' || role === 'COORDINATOR' || role === 'ADMIN') {
                try {
                    const planRes = await productionPlanApi.getAllProductionPlans({ size: 1, page: 0 });
                    newStats.productionPlans = (planRes as any)?.totalElements || 0;
                } catch { /* ignore */ }
            }

            setStats(newStats);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to load dashboard data', error);
            setLoadError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) loadDashboardData();
    }, [user]);

    // Gather permitted quick links from `navigation`
    const permittedLinks = navigation.reduce<NavItem[]>((acc, nav: NavigationItem) => {
        if ('category' in nav) {
            const allowedItems = nav.items.filter((item: NavItem) => !item.permission || hasPermission(user, item.permission));
            acc.push(...allowedItems);
        } else {
            if (!nav.permission || hasPermission(user, nav.permission)) {
                if (nav.href !== '/') acc.push(nav);
            }
        }
        return acc;
    }, []);

    const StatCard = ({
        title, value, icon: Icon, colorClass, borderClass, trend, subtitle, onClick
    }: {
        title: string;
        value: string | number;
        icon: any;
        colorClass: string;
        borderClass: string;
        trend?: string;
        subtitle?: string;
        onClick?: () => void;
    }) => (
        <Card
            onClick={onClick}
            className={`relative overflow-hidden flex flex-col p-6 border-0 shadow-lg ${borderClass} bg-zinc-900/60 backdrop-blur-sm group hover:-translate-y-1 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
        >
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
                    {isLoading ? (
                        <span className="inline-block w-16 h-8 bg-zinc-800 animate-pulse rounded-lg" />
                    ) : (
                        value !== undefined && value !== null ? value : '-'
                    )}
                </h3>
                <p className="text-sm font-medium text-zinc-400">{title}</p>
                {subtitle && <p className="text-xs text-zinc-600 mt-1">{subtitle}</p>}
            </div>
        </Card>
    );

    const currentDate = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Build stat cards based on role
    const buildStatCards = () => {
        const cards = [];

        if (role === 'ADMIN') {
            cards.push(
                <StatCard
                    key="billing"
                    title="Tổng hóa đơn"
                    value={stats.totalRevenue}
                    icon={DollarSign}
                    colorClass="bg-emerald-500"
                    borderClass="ring-1 ring-emerald-500/20"
                    subtitle="Tổng số billing statements"
                    onClick={() => navigate('/billing')}
                />
            );
            cards.push(
                <StatCard
                    key="stores"
                    title="Cửa hàng hoạt động"
                    value={stats.activeStores}
                    icon={ShoppingBag}
                    colorClass="bg-blue-500"
                    borderClass="ring-1 ring-blue-500/20"
                    onClick={() => navigate('/stores')}
                />
            );
            cards.push(
                <StatCard
                    key="orders"
                    title="Đơn hàng"
                    value={stats.pendingOrders}
                    icon={Activity}
                    colorClass="bg-orange-500"
                    borderClass="ring-1 ring-orange-500/20"
                    onClick={() => navigate('/orders')}
                />
            );
            cards.push(
                <StatCard
                    key="users"
                    title="Tổng người dùng"
                    value={stats.activeUsers}
                    icon={Users}
                    colorClass="bg-purple-500"
                    borderClass="ring-1 ring-purple-500/20"
                    onClick={() => navigate('/users')}
                />
            );
        } else if (role === 'COORDINATOR') {
            cards.push(
                <StatCard
                    key="stores"
                    title="Cửa hàng"
                    value={stats.activeStores}
                    icon={ShoppingBag}
                    colorClass="bg-blue-500"
                    borderClass="ring-1 ring-blue-500/20"
                    onClick={() => navigate('/stores')}
                />
            );
            cards.push(
                <StatCard
                    key="orders"
                    title="Tổng đơn hàng"
                    value={stats.pendingOrders}
                    icon={Activity}
                    colorClass="bg-orange-500"
                    borderClass="ring-1 ring-orange-500/20"
                    onClick={() => navigate('/orders')}
                />
            );
            cards.push(
                <StatCard
                    key="shipments"
                    title="Tổng vận chuyển"
                    value={stats.pendingShipments}
                    icon={Truck}
                    colorClass="bg-cyan-500"
                    borderClass="ring-1 ring-cyan-500/20"
                    onClick={() => navigate('/shipment')}
                />
            );
            cards.push(
                <StatCard
                    key="plans"
                    title="Kế hoạch sản xuất"
                    value={stats.productionPlans}
                    icon={Package}
                    colorClass="bg-indigo-500"
                    borderClass="ring-1 ring-indigo-500/20"
                />
            );
        } else if (role === 'KITCHEN_STAFF') {
            cards.push(
                <StatCard
                    key="plans"
                    title="Kế hoạch sản xuất"
                    value={stats.productionPlans}
                    icon={ChefHat}
                    colorClass="bg-amber-500"
                    borderClass="ring-1 ring-amber-500/20"
                />
            );
            cards.push(
                <StatCard
                    key="shipments"
                    title="Tổng vận chuyển"
                    value={stats.pendingShipments}
                    icon={Truck}
                    colorClass="bg-cyan-500"
                    borderClass="ring-1 ring-cyan-500/20"
                    onClick={() => navigate('/shipment')}
                />
            );
        } else {
            // STORE_STAFF, MANAGER, etc.
            cards.push(
                <StatCard
                    key="orders"
                    title="Đơn hàng của tôi"
                    value={stats.pendingOrders}
                    icon={Activity}
                    colorClass="bg-orange-500"
                    borderClass="ring-1 ring-orange-500/20"
                    onClick={() => navigate('/orders')}
                />
            );
        }

        return cards;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {/* Global Cinematic Backdrop */}
            <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-zinc-950/80 to-zinc-950"></div>

            {/* Premium Header Section */}
            <div className="relative overflow-hidden rounded-[40px] border border-zinc-800/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] p-10 bg-zinc-950/40 backdrop-blur-3xl group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-teal-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
                
                {/* Abstract Geometric Accents */}
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-zinc-100 transform rotate-12 group-hover:rotate-6 group-hover:scale-110 transition-all duration-[2s] ease-out">
                    <Activity size={250} strokeWidth={0.5} />
                </div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-orange-500/20 blur-[80px] rounded-full"></div>
                <div className="absolute top-10 right-20 w-32 h-32 bg-teal-500/20 blur-[60px] rounded-full"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-950/80 border border-amber-500/30 text-amber-500 text-[11px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            <Clock size={14} className="animate-pulse" />
                            {currentDate}
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 tracking-tighter mb-2 leading-tight">
                                Chào mừng, {user?.name || 'Director'}
                            </h1>
                            <p className="text-zinc-500 text-sm font-medium tracking-wide">
                                {role === 'KITCHEN_STAFF' ? 'COMMAND: PRODUCTION & INVENTORY CONTROL' :
                                    role === 'COORDINATOR' ? 'COMMAND: LOGISTICS & DISTRIBUTION ' :
                                        role === 'ADMIN' ? 'COMMAND: SYSTEM MASTERY & OVERSIGHT' :
                                            'COMMAND: STORE OPERATIONS'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-center">
                        {loadError && (
                            <div className="flex items-center px-4 py-2 bg-red-950/50 border border-red-500/30 text-red-500 text-[11px] font-black uppercase tracking-widest rounded-xl gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                <AlertCircle size={14} className="animate-pulse" /> 
                                Lỗi Đồng Bộ
                            </div>
                        )}
                        <div className="flex flex-col items-end gap-2">
                            {lastUpdated && !isLoading && (
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                                    Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            )}
                            <button
                                onClick={loadDashboardData}
                                disabled={isLoading}
                                className="group/btn relative flex items-center gap-2 px-6 py-2.5 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:border-amber-500/50 overflow-hidden text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                                <RefreshCw size={14} className={isLoading ? 'animate-spin text-amber-500' : 'group-hover/btn:rotate-180 transition-transform duration-500'} />
                                {isLoading ? 'Đang tải...' : 'Đồng Bộ Hóa'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {buildStatCards()}
            </div>

            {/* Quick Access/Workspace Grid */}
            {permittedLinks.length > 0 && (
                <div className="relative rounded-[32px] overflow-hidden border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-3xl p-8 shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-50"></div>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                            <Activity size={20} className="text-amber-500" />
                            Command Center
                        </h2>
                        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-zinc-900 text-zinc-500 border border-zinc-800 uppercase tracking-[0.2em] shadow-inner">
                            Truy cập nhanh
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-5">
                        {permittedLinks.map((link: NavItem, idx: number) => {
                            const Icon = link.icon;
                            // Curated premium color palette
                            const glowColors = [
                                'rgba(59,130,246,0.5)', 'rgba(99,102,241,0.5)', 'rgba(168,85,247,0.5)', 
                                'rgba(236,72,153,0.5)', 'rgba(244,63,94,0.5)', 'rgba(249,115,22,0.5)', 
                                'rgba(245,158,11,0.5)', 'rgba(16,185,129,0.5)', 'rgba(20,184,166,0.5)', 
                                'rgba(6,182,212,0.5)', 'rgba(14,165,233,0.5)'
                            ];
                            const textColors = [
                                'text-blue-400', 'text-indigo-400', 'text-purple-400', 
                                'text-pink-400', 'text-rose-400', 'text-orange-400', 
                                'text-amber-400', 'text-emerald-400', 'text-teal-400', 
                                'text-cyan-400', 'text-sky-400'
                            ];
                            const shadowColor = glowColors[idx % glowColors.length];
                            const textColor = textColors[idx % textColors.length];
                            
                            return (
                                <button
                                    key={link.href}
                                    onClick={() => navigate(link.href)}
                                    className="group relative flex flex-col items-center justify-center p-6 bg-zinc-900/50 rounded-[24px] border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-300 overflow-hidden"
                                    style={{ '--glow-color': shadowColor } as React.CSSProperties}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--glow-color)] to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                    <div 
                                        className={`relative z-10 p-4 rounded-full bg-zinc-950 mb-3 group-hover:-translate-y-2 group-hover:scale-110 transition-all duration-500 ring-1 ring-zinc-800 shadow-inner group-hover:ring-zinc-600 ${textColor}`}
                                        style={{ boxShadow: `0 0 20px var(--glow-color)` }}
                                    >
                                        <Icon size={24} className="opacity-90 drop-shadow-lg" />
                                    </div>
                                    <span className="relative z-10 text-[11px] font-bold text-zinc-400 group-hover:text-white transition-colors text-center uppercase tracking-wider line-clamp-2">
                                        {link.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bottom section: Orders + Shipments activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                {/* Recent Orders */}
                {recentOrders.length > 0 && (
                    <Card title="Giao Dịch Gần Đây" className="border border-zinc-800/80 shadow-2xl bg-zinc-950/60 backdrop-blur-3xl rounded-[32px] p-8 overflow-hidden relative group/card">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none group-hover/card:bg-orange-500/10 transition-colors duration-1000"></div>
                        <div className="space-y-4 mt-6 relative z-10">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="group flex items-center justify-between p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/80 transition-all duration-300 border border-zinc-800/50 hover:border-orange-500/30 cursor-pointer hover:shadow-[0_10px_30px_rgba(249,115,22,0.1)]"
                                    onClick={() => navigate('/orders')}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:border-orange-500/50 group-hover:bg-orange-500/10 transition-colors shadow-inner">
                                            <Activity size={20} className="text-zinc-500 group-hover:text-orange-500 transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">Order <span className="text-orange-500">#{order.id}</span></p>
                                            <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">
                                                {order.storeName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant={statusColor[order.status] as any || 'default'} className="text-[9px] px-2.5 py-1 border-0 uppercase tracking-widest font-black shadow-sm">
                                            {statusLabel[order.status] || order.status}
                                        </Badge>
                                        <span className="text-xs text-zinc-300 font-black tracking-tight flex items-baseline gap-1">
                                            {(order.totalAmount || 0).toLocaleString()} <span className="text-[9px] text-zinc-600 font-bold uppercase">VNĐ</span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-zinc-800/50 relative z-10">
                            <Button
                                variant="ghost"
                                className="w-full h-12 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-orange-400 hover:bg-zinc-900 rounded-xl transition-all border border-transparent hover:border-orange-500/20"
                                onClick={() => navigate('/orders')}
                            >
                                Truy xuất toàn bộ hóa đơn
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Recent Shipments */}
                {recentShipments.length > 0 && (
                    <Card title="Vận Tải Gần Đây" className="border border-zinc-800/80 shadow-2xl bg-zinc-950/60 backdrop-blur-3xl rounded-[32px] p-8 overflow-hidden relative group/card">
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none group-hover/card:bg-cyan-500/10 transition-colors duration-1000"></div>
                        <div className="space-y-4 mt-6 relative z-10">
                            {recentShipments.map((ship) => (
                                <div
                                    key={ship.id}
                                    className="group flex items-center justify-between p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/80 transition-all duration-300 border border-zinc-800/50 hover:border-cyan-500/30 cursor-pointer hover:shadow-[0_10px_30px_rgba(6,182,212,0.1)]"
                                    onClick={() => navigate('/shipment')}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10 transition-colors shadow-inner">
                                            <Truck size={20} className="text-zinc-500 group-hover:text-cyan-500 transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">Logistics <span className="text-cyan-500">#{ship.id}</span></p>
                                            <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">
                                                {ship.storeName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant={statusColor[ship.status] as any || 'default'} className="text-[9px] px-2.5 py-1 border-0 uppercase tracking-widest font-black shadow-sm">
                                            {statusLabel[ship.status] || ship.status}
                                        </Badge>
                                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(ship.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-zinc-800/50 relative z-10">
                            <Button
                                variant="ghost"
                                className="w-full h-12 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-cyan-400 hover:bg-zinc-900 rounded-xl transition-all border border-transparent hover:border-cyan-500/20"
                                onClick={() => navigate('/shipment')}
                            >
                                Truy xuất toàn bộ vận đơn
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Fallback if no recent data */}
                {recentOrders.length === 0 && recentShipments.length === 0 && !isLoading && (
                    <Card title="Hồ Sơ Hoạt Động" className="lg:col-span-2 border border-zinc-800/80 shadow-2xl bg-zinc-950/60 backdrop-blur-3xl rounded-[32px] p-10">
                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                            <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-inner">
                                <CheckCircle size={40} className="text-zinc-600" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">Hệ thống tĩnh - Không có bản ghi mới</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};
