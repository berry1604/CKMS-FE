import { useEffect, useState, useMemo } from 'react';
import {
    Activity, AlertCircle, Clock, RefreshCw, Search, Bell,
    ShoppingBag, Users, Package, Truck, ChefHat
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
import { cn } from '../../utils/classNames';

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
    DRAFT: 'secondary',
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

            if (role === 'ADMIN' || role === 'COORDINATOR') {
                try {
                    const storeRes = await storeApi.getAllStores({ size: 1 });
                    newStats.activeStores = storeRes?.data?.totalElements || 0;
                } catch { /* ignore */ }
            }

            if (role !== 'KITCHEN_STAFF') {
                try {
                    let orderRes;
                    if (role === 'ADMIN' || role === 'COORDINATOR') {
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
                } catch { /* ignore */ }
            }

            if (role === 'ADMIN') {
                try {
                    const userRes = await userService.getUsers({ size: 1 });
                    newStats.activeUsers = userRes?.data?.totalElements || 0;
                } catch { /* ignore */ }
            }

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

            if (role === 'ADMIN') {
                try {
                    const billRes = await billingApi.getStatements({ size: 1, page: 0 });
                    newStats.totalRevenue = billRes?.totalElements || 0;
                } catch { /* ignore */ }
            }

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

    const permittedLinks = useMemo(() => {
        return navigation.reduce<NavItem[]>((acc, nav: NavigationItem) => {
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
    }, [user]);

    const StatCard = ({
        title, value, icon: Icon, onClick
    }: {
        title: string;
        value: string | number;
        icon: any;
        onClick?: () => void;
    }) => {
        return (
            <div
                onClick={onClick}
                className={cn(
                    "bg-[#141414] p-6 rounded-2xl border border-amber-500/10 flex items-center justify-between gap-4 transition-all duration-300 relative overflow-hidden group shadow-[0_0_20px_rgba(245,158,11,0.02)]",
                    onClick && "cursor-pointer hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.05)] hover:-translate-y-0.5"
                )}
            >
                {/* Accent Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 opacity-80" />

                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] mb-1">
                        {title}
                    </span>
                    <h3 className="text-2xl font-black text-white tracking-tighter">
                        {isLoading ? <span className="inline-block w-16 h-8 bg-white/5 animate-pulse rounded" /> : value}
                    </h3>
                </div>

                <div className="w-12 h-12 rounded-xl bg-amber-500/5 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                    <Icon size={22} className="text-amber-500" />
                </div>
            </div>
        );
    };

    const buildStatCards = () => {
        const cards = [];

        if (role === 'ADMIN') {
            cards.push(<StatCard key="rev" title="Tổng HT" value={stats.totalRevenue} icon={Activity} onClick={() => navigate('/billing')} />);
            cards.push(<StatCard key="stores" title="Cửa hàng" value={stats.activeStores} icon={ShoppingBag} onClick={() => navigate('/stores')} />);
            cards.push(<StatCard key="orders" title="Đơn hàng" value={stats.pendingOrders} icon={Package} onClick={() => navigate('/orders')} />);
            cards.push(<StatCard key="users" title="Người dùng" value={stats.activeUsers} icon={Users} onClick={() => navigate('/users')} />);
        } else if (role === 'COORDINATOR') {
            cards.push(<StatCard key="stores" title="Store Hoạt động" value={stats.activeStores} icon={ShoppingBag} onClick={() => navigate('/stores')} />);
            cards.push(<StatCard key="orders" title="Chờ xử lý" value={stats.pendingOrders} icon={Activity} onClick={() => navigate('/orders')} />);
            cards.push(<StatCard key="ship" title="Vận chuyển" value={stats.pendingShipments} icon={Truck} onClick={() => navigate('/shipment')} />);
            cards.push(<StatCard key="plans" title="Kế hoạch" value={stats.productionPlans} icon={Package} />);
        } else if (role === 'KITCHEN_STAFF') {
            cards.push(<StatCard key="plans" title="SX Hôm nay" value={stats.productionPlans} icon={ChefHat} />);
            cards.push(<StatCard key="ship" title="Chờ giao" value={stats.pendingShipments} icon={Truck} onClick={() => navigate('/shipment')} />);
        } else {
            cards.push(<StatCard key="orders" title="Đơn của tôi" value={stats.pendingOrders} icon={Activity} onClick={() => navigate('/orders')} />);
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                {cards}
            </div>
        );
    };

    const StatusBadge = ({ status }: { status: string }) => (
        <Badge
            variant={statusColor[status] as any || 'secondary'}
            className="rounded-none border-amber-500/20 text-amber-500/80 bg-amber-500/5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5"
        >
            {statusLabel[status] || status}
        </Badge>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] -m-8 p-12 space-y-12 font-sans text-slate-300">
            {/* Top Navigation Bar */}
            <div className="flex justify-between items-center bg-[#111] p-4 -mx-12 -mt-12 mb-12 border-b border-white/5">
                <div className="flex items-center gap-8 pl-8">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-500 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="SEARCH_COMMAND..."
                            className="bg-transparent border-0 py-2 pl-9 pr-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 focus:ring-0 w-64"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-6 pr-8">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">System Time</span>
                        <span className="text-xs font-mono text-white/60">{new Date().toLocaleTimeString('vi-VN')}</span>
                    </div>
                    <button className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg border border-white/5 text-white/30 hover:border-amber-500/50 hover:text-amber-500 transition-all">
                        <Bell size={18} />
                    </button>
                    <div className="flex items-center gap-3 pl-4 border-l border-white/5">
                        <div className="text-right">
                            <p className="text-xs font-black text-white uppercase tracking-wider">{user?.name || 'Director'}</p>
                            <p className="text-[9px] font-black text-amber-500/50 uppercase tracking-[0.3em]">{user?.role?.replace('_', ' ')}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 p-1">
                            <img src={`https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=FFBF00&color=000&bold=true`} alt="User" className="w-full h-full rounded" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Header Section */}
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-5xl font-black text-white tracking-tighter">
                        COMMAND_CENTER
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_#F59E0B]" />
                        <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] translate-y-[1px]">
                            Greetings, {user?.name?.split(' ')[0]} - System Operational {lastUpdated && `// ${lastUpdated.toLocaleTimeString()}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {loadError && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-bold uppercase tracking-widest animate-pulse">
                            <AlertCircle size={12} />
                            Sync_Error
                        </div>
                    )}
                    <Button
                        onClick={loadDashboardData}
                        className="bg-amber-500 text-black rounded-none px-10 py-7 h-auto text-[11px] font-black uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-3 border-none"
                        disabled={isLoading}
                    >
                        <RefreshCw size={18} className={cn(isLoading && "animate-spin")} />
                        {isLoading ? 'EXECUTING...' : 'SYNC_DATA'}
                    </Button>
                </div>
            </div>

            {/* Stats Grid - Now Horizontal Row */}
            {buildStatCards()}

            {/* Layout Grid */}
            <div className="grid grid-cols-12 gap-10">
                {/* Workspace area (Expanded) */}
                <div className="col-span-12 lg:col-span-8 space-y-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Workspace_Modules</h2>
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">{permittedLinks.length} AVAILABLE_SLOTS</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {permittedLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <button
                                    key={link.href}
                                    onClick={() => navigate(link.href)}
                                    className="group bg-[#111] p-10 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-6 transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(245,158,11,0.05)] text-center relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 translate-x-10 -translate-y-10 rounded-full group-hover:bg-amber-50/10 transition-colors" />

                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-all duration-300">
                                        <Icon size={28} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-amber-500 transition-colors">
                                            {link.name}
                                        </p>
                                        <div className="h-[2px] w-0 bg-amber-500 mx-auto group-hover:w-full transition-all duration-500" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Secondary Sidebar Area */}
                <div className="col-span-12 lg:col-span-4 space-y-10">
                    {/* System Diagnostics */}
                    <div className="bg-[#111] p-8 rounded-2xl border border-white/5 space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Diagnostics</h3>
                            <div className="flex gap-1">
                                <div className="w-1 h-1 bg-amber-500 rounded-full" />
                                <div className="w-1 h-1 bg-amber-500/20 rounded-full" />
                                <div className="w-1 h-1 bg-amber-500/20 rounded-full" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Network Latency</span>
                                <span className="text-[10px] font-mono text-amber-500">24ms</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="w-[85%] h-full bg-amber-500/40" />
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Database Sync</span>
                                <span className="text-[10px] font-mono text-amber-500">OPTIMAL</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="w-[98%] h-full bg-amber-500" />
                            </div>
                        </div>
                    </div>

                    {/* Operation Logs (Timeline) */}
                    <div className="bg-[#111] p-8 rounded-2xl border border-white/5 min-h-[400px]">
                        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-4">
                            <h2 className="text-xs font-black text-white uppercase tracking-widest">Operation_Logs</h2>
                            <span className="text-[9px] font-mono text-white/20">LIVE_FEED</span>
                        </div>

                        <div className="space-y-8">
                            {[...recentOrders, ...recentShipments].length > 0 ? (
                                <>
                                    {recentOrders.slice(0, 3).map((order) => (
                                        <div key={`order-${order.id}`} className="relative pl-6 group">
                                            <div className="absolute left-0 top-1 w-1 h-1 bg-amber-500 group-hover:h-8 transition-all duration-300" />
                                            <div className="flex items-start justify-between cursor-pointer" onClick={() => navigate('/orders')}>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-white/80 uppercase tracking-wider group-hover:text-amber-500 transition-colors">
                                                        TRX_{order.id} <span className="text-white/20">// {order.storeName}</span>
                                                    </p>
                                                    <StatusBadge status={order.status} />
                                                </div>
                                                <span className="text-[9px] font-mono text-white/20 whitespace-nowrap">
                                                    {new Date(order.orderDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {recentShipments.slice(0, 2).map((shipment) => (
                                        <div key={`shipment-${shipment.id}`} className="relative pl-6 group">
                                            <div className="absolute left-0 top-1 w-1 h-3 bg-white/10 group-hover:h-8 group-hover:bg-amber-500 transition-all duration-300" />
                                            <div className="flex items-start justify-between cursor-pointer" onClick={() => navigate('/shipment')}>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-white/80 uppercase tracking-wider group-hover:text-amber-500 transition-colors">
                                                        LOG_{shipment.id} <span className="text-white/20">// SHIPMENT_INIT</span>
                                                    </p>
                                                    <StatusBadge status={shipment.status} />
                                                </div>
                                                <span className="text-[9px] font-mono text-white/20 uppercase">Shipment</span>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                                    <Clock size={30} className="text-white mb-4" />
                                    <p className="text-[9px] font-black text-white uppercase tracking-[0.4em]">Standby_Mode</p>
                                </div>
                            )}
                        </div>

                        <button className="w-full mt-10 py-4 bg-white/5 text-[9px] font-black text-white/30 uppercase tracking-[0.3em] hover:bg-amber-500 hover:text-black transition-all">
                            Full_System_History
                        </button>
                    </div>
                </div>
            </div>

            {/* Background Decorative Element */}
            <div className="fixed bottom-0 right-0 p-20 opacity-[0.02] pointer-events-none select-none">
                <span className="text-[200px] font-black tracking-tighter leading-none">AMBER</span>
            </div>
        </div>
    );
};
