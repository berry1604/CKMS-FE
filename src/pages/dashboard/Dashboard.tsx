import { useEffect, useState } from 'react';
import {
    DollarSign, Users, Activity,
    Package, Truck, ChefHat,
    RefreshCw, Store
} from 'lucide-react';
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
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const role = user?.role;

    const loadDashboardData = async () => {
        setIsLoading(true);
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

            if (role === 'ADMIN' || role === 'COORDINATOR') {
                try {
                    const storeRes = await storeApi.getAllStores({ size: 1 });
                    newStats.activeStores = storeRes?.data?.totalElements || 0;
                } catch { }
            }

            if (role === 'COORDINATOR' || role === 'STORE_STAFF') {
                try {
                    let orderRes;
                    if (role === 'COORDINATOR') {
                        orderRes = await storeOrderApi.getAllOrders({ size: 5, page: 0 });
                    } else {
                        orderRes = await storeOrderApi.getMyOrders({ size: 5, page: 0 });
                    }
                    newStats.pendingOrders = orderRes?.totalElements || 0;
                    const items = (orderRes?.content || []).slice(0, 5).map((o: any) => ({
                        id: o.orderId,
                        storeName: o.storeName || `Cửa hàng #${o.storeId}`,
                        status: o.status,
                        totalAmount: o.totalAmount || 0,
                        orderDate: o.orderDate,
                    }));
                    setRecentOrders(items);
                } catch { }
            }

            if (role === 'ADMIN') {
                try {
                    const userRes = await userService.getUsers({ size: 1 });
                    newStats.activeUsers = userRes?.data?.totalElements || 0;
                } catch { }
            }

            if (role === 'COORDINATOR' || role === 'KITCHEN_STAFF') {
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
                } catch { }
            }

            if (role === 'ADMIN') {
                try {
                    const billRes = await billingApi.getStatements({ size: 1, page: 0 });
                    newStats.totalRevenue = billRes?.totalElements || 0;
                } catch { }
            }

            if (role === 'KITCHEN_STAFF' || role === 'COORDINATOR') {
                try {
                    const planRes = await productionPlanApi.getAllProductionPlans({ size: 1, page: 0 });
                    newStats.productionPlans = (planRes as any)?.totalElements || 0;
                } catch { }
            }

            setStats(newStats);
            setLastUpdated(new Date());
        } catch (error) {
            // Error handling
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) loadDashboardData();
    }, [user]);

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

    const Sparkline = ({ color }: { color: string }) => (
        <svg className="w-16 h-8 opacity-50" viewBox="0 0 100 40">
            <path
                d="M0 35 Q 20 10, 40 25 T 80 5 T 100 20"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );

    const StatCard = ({
        title, value, icon: Icon, colorHex, index = 1, trend
    }: {
        title: string;
        value: string | number;
        icon: any;
        colorHex: string;
        index?: number;
        trend?: string;
    }) => (
        <div 
            className="relative p-6 rounded-3xl bg-[#0F0F0F]/40 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden group hover:border-amber-500/30 transition-all duration-700 animate-slide-up-fade"
            style={{ animationDelay: `${index * 150}ms` }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5 text-amber-500 group-hover:scale-110 transition-transform duration-500">
                    <Icon size={20} />
                </div>
                {trend && (
                    <span className="text-[10px] font-black text-amber-500/80 tracking-widest uppercase">{trend}</span>
                )}
            </div>
            <div>
                <h3 className="text-3xl font-black text-amber-500 tracking-tighter mb-1">
                    {isLoading ? <span className="block w-20 h-8 bg-white/5 animate-pulse rounded-lg" /> : value}
                </h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{title}</p>
            </div>
            <div className="mt-4 flex justify-end">
                <Sparkline color={colorHex} />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen relative py-8 px-4 md:px-0">
            {/* 12-Column Industrial Layout */}
            <div className="grid grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Stat Cards (3 Cols) */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="px-2 mb-4">
                        <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] italic flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500/20 animate-pulse"></span>
                            Analytics Stream
                        </h2>
                    </div>
                    {role === 'ADMIN' && (
                        <>
                            <StatCard title="Tổng doanh thu" value={stats.totalRevenue.toLocaleString()} icon={DollarSign} colorHex="#F59E0B" trend="+12.5%" />
                            <StatCard title="Cửa hàng" value={stats.activeStores} icon={Store} colorHex="#F59E0B" />
                            <StatCard title="Người dùng" value={stats.activeUsers} icon={Users} colorHex="#F59E0B" />
                        </>
                    )}
                    {role === 'COORDINATOR' && (
                        <>
                            <StatCard title="Đơn hàng chờ" value={stats.pendingOrders} icon={Activity} colorHex="#F59E0B" trend="Active" />
                            <StatCard title="Vận chuyển" value={stats.pendingShipments} icon={Truck} colorHex="#F59E0B" />
                            <StatCard title="Kho bãi" value={stats.activeStores} icon={Store} colorHex="#F59E0B" />
                        </>
                    )}
                    {role === 'KITCHEN_STAFF' && (
                        <>
                            <StatCard title="Kế hoạch SX" value={stats.productionPlans} icon={ChefHat} colorHex="#F59E0B" trend="Priority" />
                            <StatCard title="Vận chuyển" value={stats.pendingShipments} icon={Truck} colorHex="#F59E0B" />
                        </>
                    )}
                    {(role === 'STORE_STAFF' || role === 'MANAGER') && (
                        <StatCard title="Đơn hàng" value={stats.pendingOrders} icon={Activity} colorHex="#F59E0B" trend="Current" />
                    )}
                </div>

                {/* MIDDLE AREA: Command Center (6 Cols) */}
                <div className="col-span-12 lg:col-span-6 space-y-8">
                    {/* Simplified Header */}
                    <div className="relative p-10 rounded-[40px] bg-[#0A0A0A] border border-white/5 overflow-hidden shadow-2xl group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-white">
                            <Activity size={200} strokeWidth={0.5} />
                        </div>
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest mb-6">
                                <Activity size={12} className="animate-pulse" />
                                Operational Node: {user?.role?.replace('ROLE_', '') || 'Active'}
                            </div>
                            <h1 className="text-5xl font-black text-white tracking-tighter mb-2 italic">
                                Chào mừng, {user?.name?.split(' ')[0] || 'Director'}
                            </h1>
                            <p className="text-zinc-500 text-sm font-medium tracking-wide">
                                System Status: Optimal • Last Sync: {lastUpdated?.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    {/* Quick Access / Command Center Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] italic flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500/20"></span>
                                Command Center
                            </h2>
                            <button onClick={loadDashboardData} className="text-zinc-600 hover:text-amber-500 transition-colors">
                                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {permittedLinks.slice(0, 9).map((link, idx) => {
                                const Icon = link.icon;
                                return (
                                    <button
                                        key={link.href}
                                        onClick={() => navigate(link.href)}
                                        className="group relative flex flex-col items-center justify-center p-8 bg-[#0F0F0F]/60 rounded-3xl border border-white/5 hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-1"
                                        style={{ animationDelay: `${700 + (idx * 50)}ms` }}
                                    >
                                        <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/[0.02] transition-colors rounded-3xl"></div>
                                        <div className="p-4 rounded-full bg-zinc-900 border border-white/5 text-amber-500/40 group-hover:text-amber-500 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all duration-500 mb-4">
                                            <Icon size={22} strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-200 transition-colors uppercase tracking-[0.2em] text-center">
                                            {link.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Recent Activity (3 Cols) */}
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    <div className="px-2 mb-4">
                        <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] italic flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500/20"></span>
                            Recent Activity
                        </h2>
                    </div>
                    
                    <div className="space-y-3">
                        {recentOrders.length > 0 ? (
                            recentOrders.map((order: RecentOrderItem) => (
                                <div 
                                    key={order.id}
                                    onClick={() => navigate('/orders')}
                                    className="p-5 rounded-[2rem] bg-[#0F0F0F]/40 border border-white/5 hover:border-amber-500/20 transition-all duration-500 cursor-pointer group flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 transition-colors border border-white/5">
                                            <Package size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-zinc-100 group-hover:text-amber-500 transition-colors uppercase">#{order.id}</p>
                                            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">{order.storeName}</p>
                                        </div>
                                    </div>
                                    <Badge variant={statusColor[order.status] as any || 'default'} className="bg-amber-500/10 text-amber-500 border-0 text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5">
                                        {statusLabel[order.status] || order.status}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center opacity-20">
                                <Activity size={40} className="mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No Recent Events</p>
                            </div>
                        )}

                        {recentShipments.length > 0 && recentShipments.map((ship: RecentShipmentItem) => (
                            <div 
                                key={ship.id}
                                onClick={() => navigate('/shipment')}
                                className="p-5 rounded-[2rem] bg-[#0F0F0F]/40 border border-white/5 hover:border-amber-500/20 transition-all duration-500 cursor-pointer group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 transition-colors border border-white/5">
                                        <Truck size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-zinc-100 group-hover:text-amber-500 transition-colors uppercase">TRK-{ship.id}</p>
                                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">{ship.storeName}</p>
                                    </div>
                                </div>
                                <Badge variant={statusColor[ship.status] as any || 'default'} className="bg-amber-500/10 text-amber-500 border-0 text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5">
                                    {statusLabel[ship.status] || ship.status}
                                </Badge>
                            </div>
                        ))}
                    </div>

                    <Button 
                        variant="ghost" 
                        onClick={() => navigate('/reports')}
                        className="w-full mt-4 py-6 rounded-2xl border border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 hover:text-amber-500 hover:bg-zinc-900 italic transition-all"
                    >
                        Access Archive System
                    </Button>
                </div>
            </div>
            
            {/* Ambient Lighting Accents */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/5 blur-[120px]"></div>
            </div>
        </div>
    );
};
