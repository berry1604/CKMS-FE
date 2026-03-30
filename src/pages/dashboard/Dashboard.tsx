import { useEffect, useState, useMemo } from 'react';
import {
    Users, Activity,
    Package, Truck, ChefHat,
    RefreshCw, Store, ExternalLink
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

            // 1. Stores - Admin and Coordinator can see store stats
            if (role === 'ADMIN' || role === 'COORDINATOR') {
                try {
                    const storeRes = await storeApi.getAllStores({ size: 1 });
                    newStats.activeStores = storeRes?.data?.totalElements || 0;
                } catch { /* ignore */ }
            }

            // 2. Orders - Admin excluded from fetching orders on dashboard now
            if (role !== 'KITCHEN_STAFF' && role !== 'ADMIN') {
                try {
                    let orderRes;
                    if (role === 'COORDINATOR') {
                        orderRes = await storeOrderApi.getAllOrders({ size: 5, page: 0 });
                    } else {
                        orderRes = await storeOrderApi.getMyOrders({ size: 5, page: 0 });
                    }

                    if (orderRes) {
                        newStats.pendingOrders = orderRes.totalElements || 0;
                        const items = (orderRes.content || []).slice(0, 5).map((o: any) => ({
                            id: o.orderId,
                            storeName: o.storeName || `Cửa hàng #${o.storeId}`,
                            status: o.status,
                            totalAmount: o.totalAmount || 0,
                            orderDate: o.orderDate,
                        }));
                        setRecentOrders(items);
                    }
                } catch { /* ignore */ }
            }

            // 3. Users - Admin only
            if (role === 'ADMIN') {
                try {
                    const userRes = await userService.getUsers({ size: 1 });
                    newStats.activeUsers = userRes?.data?.totalElements || 0;
                } catch { /* ignore */ }
            }

            // 4. Shipments - Coordinator, Kitchen, and Staff
            if (role !== 'ADMIN' && role !== 'MANAGER') {
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

            // 5. Production Plans - Coordinator and Kitchen
            if (role === 'KITCHEN_STAFF' || role === 'COORDINATOR') {
                try {
                    const planRes = await productionPlanApi.getAllProductionPlans({ size: 1, page: 0 });
                    newStats.productionPlans = (planRes as any)?.totalElements || 0;
                } catch { /* ignore */ }
            }

            setStats(newStats);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to load dashboard data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) loadDashboardData();
    }, [user]);

    const permittedLinks = useMemo(() => {
        const flattened = navigation.reduce<NavItem[]>((acc, nav: NavigationItem) => {
            if ('category' in nav) {
                const allowedItems = nav.items.filter((item: NavItem) => {
                    const hasPerm = !item.permission || hasPermission(user, item.permission);
                    const isHidden = typeof item.hidden === 'function' ? item.hidden(user) : !!item.hidden;
                    return hasPerm && !isHidden;
                });
                acc.push(...allowedItems);
            } else {
                const hasPerm = !nav.permission || hasPermission(user, nav.permission);
                const isHidden = typeof nav.hidden === 'function' ? nav.hidden(user) : !!nav.hidden;
                if (hasPerm && !isHidden) {
                    if (nav.href !== '/') acc.push(nav);
                }
            }
            return acc;
        }, []);

        if (user?.role?.toUpperCase().replace("ROLE_", "") === "ADMIN") {
            const adminOrder = [
                "Tổng quan",
                "Người dùng",
                "Cửa hàng",
                "Bếp trung tâm",
                "Vai trò & Quyền",
                "Lịch sản xuất",
                "Hóa đơn & Billing",
            ];
            flattened.sort((a, b) => {
                let indexA = adminOrder.indexOf(a.name);
                let indexB = adminOrder.indexOf(b.name);
                if (indexA === -1) indexA = 999;
                if (indexB === -1) indexB = 999;
                return indexA - indexB;
            });
        }

        return flattened;
    }, [user]);

    const StatCard = ({
        title, value, icon: Icon, colorClass, index = 1, bgClass = 'bg-[var(--bg-card)]'
    }: {
        title: string;
        value: string | number;
        icon: any;
        colorClass: string;
        index?: number;
        bgClass?: string;
    }) => (
        <div
            className={`flex flex-col relative p-6 rounded-3xl ${bgClass} border border-[var(--border-primary)] hover:bg-[var(--text-primary)]/[0.04] transition-all duration-300 shadow-sm hover:shadow-lg animate-in fade-in slide-in-from-bottom-4`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-[var(--text-primary)]/[0.05] ${colorClass}`}>
                    <Icon size={24} strokeWidth={1.5} />
                </div>
            </div>
            <div className="mt-auto">
                <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-1">
                    {isLoading ? <span className="block w-24 h-9 bg-[var(--text-primary)]/10 animate-pulse rounded-lg" /> : value}
                </h3>
                <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
            </div>
            {/* Subtle glow effect behind card */}
            <div className="absolute inset-0 rounded-3xl opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-tr from-[var(--text-primary)]/[0.02] to-transparent pointer-events-none" />
        </div>
    );

    const getVietnameseRole = (currentRole?: string) => {
        if (!currentRole) return 'Đang hoạt động';
        const strippedRole = currentRole.replace('ROLE_', '');
        switch (strippedRole) {
            case 'ADMIN': return 'Quản trị viên';
            case 'MANAGER': return 'Quản lý phân phối';
            case 'STORE_STAFF': return 'Nhân viên cửa hàng';
            case 'KITCHEN_STAFF': return 'Nhân viên bếp';
            case 'COORDINATOR': return 'Điều phối viên';
            default: return strippedRole;
        }
    };

    return (
        <div className="min-h-screen relative p-4 md:p-8 space-y-6 text-[var(--text-primary)]">

            {/* Hero Welcome Banner */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-primary)] p-8 md:p-10 shadow-xl">
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--text-primary)]/[0.05] border border-[var(--border-primary)] text-[var(--text-secondary)] text-xs font-semibold mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            Vai trò hoạt động: {getVietnameseRole(user?.role)}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-3">
                            Chào mừng trở lại, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-600">{user?.name?.split(' ')[0] || 'Khách'}</span>
                        </h1>
                        <p className="text-[var(--text-secondary)] text-sm md:text-base max-w-lg leading-relaxed">
                            Theo dõi hoạt động, quản lý tài nguyên và các chỉ số quan trọng trên toàn hệ thống.
                        </p>
                    </div>
                    <div className="flex flex-col items-start md:items-end justify-center">
                        <Button onClick={loadDashboardData} disabled={isLoading} variant="outline" className="rounded-xl border-[var(--border-primary)] bg-[var(--text-primary)]/[0.02] text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/[0.08] hover:text-[var(--text-primary)] transition-all shadow-sm">
                            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Đồng bộ dữ liệu
                        </Button>
                        {lastUpdated && (
                            <p className="text-xs text-[var(--text-secondary)]/70 font-medium mt-3">
                                Cập nhật lần cuối: {lastUpdated.toLocaleDateString('vi-VN')} {lastUpdated.toLocaleTimeString('vi-VN')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Analytics Row - Spans based on role */}
                <div className="col-span-12 space-y-4">
                    <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 px-1 uppercase tracking-wider">
                        <Activity size={16} className="text-amber-500" /> Chỉ Số Hoạt Động
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {role === 'ADMIN' && (
                            <>
                                <StatCard title="Số Cửa Hàng" value={stats.activeStores} icon={Store} colorClass="text-amber-500" index={1} />
                                <StatCard title="Tổng Người Dùng" value={stats.activeUsers} icon={Users} colorClass="text-blue-400" index={2} />
                            </>
                        )}
                        {role === 'COORDINATOR' && (
                            <>
                                <StatCard title="Đơn Hàng Chờ Xử Lý" value={stats.pendingOrders} icon={Package} colorClass="text-orange-400" index={1} />
                                <StatCard title="Chuyến Xe Đang Giao" value={stats.pendingShipments} icon={Truck} colorClass="text-blue-400" index={2} />
                                <StatCard title="Tổng Cửa Hàng" value={stats.activeStores} icon={Store} colorClass="text-amber-500" index={3} />
                            </>
                        )}
                        {role === 'KITCHEN_STAFF' && (
                            <>
                                <StatCard title="Kế Hoạch Sản Xuất" value={stats.productionPlans} icon={ChefHat} colorClass="text-amber-500" index={1} />
                                <StatCard title="Chuyến Xe Vận Chuyển" value={stats.pendingShipments} icon={Truck} colorClass="text-blue-400" index={2} />
                            </>
                        )}
                        {(role === 'STORE_STAFF' || role === 'MANAGER') && (
                            <StatCard title="Đơn Hàng Của Tôi" value={stats.pendingOrders} icon={Activity} colorClass="text-amber-500" index={1} />
                        )}
                    </div>
                </div>

                {/* Command Center (Navigation) */}
                <div className="col-span-12 lg:col-span-8 space-y-4">
                    <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 px-1 uppercase tracking-wider">
                        <Store size={16} className="text-amber-500" /> Trung Tâm Quản Lý
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {permittedLinks.slice(0, 9).map((link) => {
                            const Icon = link.icon;
                            return (
                                <button
                                    key={link.href}
                                    onClick={() => navigate(link.href)}
                                    className="group relative flex items-center p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] hover:bg-[var(--text-primary)]/[0.04] hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg text-left"
                                >
                                    <div className="p-3 rounded-xl bg-[var(--bg-root)] border border-[var(--border-primary)] text-[var(--text-secondary)] group-hover:text-amber-500 transition-colors mr-4 shadow-sm">
                                        <Icon size={20} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex flex-col pointer-events-none">
                                        <span className="text-[13px] font-bold text-[var(--text-primary)] group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors uppercase tracking-tight">
                                            {link.name}
                                        </span>
                                        <span className="text-[11px] text-[var(--text-secondary)] leading-tight mt-0.5">
                                            Truy cập quản lý
                                        </span>
                                    </div>
                                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 absolute right-4 top-4 text-amber-500/50 transition-opacity" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="col-span-12 lg:col-span-4 space-y-4">
                    <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 px-1 uppercase tracking-wider">
                        <RefreshCw size={16} className="text-amber-500" /> Hoạt Động Gần Đây
                    </h2>

                    <div className="flex flex-col gap-3">
                        {recentOrders.length > 0 ? (
                            recentOrders.map((order: RecentOrderItem) => (
                                <div
                                    key={order.id}
                                    onClick={() => navigate('/orders')}
                                    className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] hover:bg-[var(--text-primary)]/[0.04] transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-root)] text-[var(--text-secondary)] border border-[var(--border-primary)] group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-colors">
                                            <Package size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-[var(--text-primary)] group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">Mã ĐH: #{order.id}</p>
                                            <p className="text-[11px] text-[var(--text-secondary)] font-medium">{order.storeName}</p>
                                        </div>
                                    </div>
                                    <Badge variant={statusColor[order.status] as any || 'default'} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-[var(--text-primary)]/[0.05] shadow-sm border border-[var(--border-primary)]">
                                        {statusLabel[order.status] || order.status}
                                    </Badge>
                                </div>
                            ))
                        ) : recentShipments.length > 0 ? (
                            recentShipments.map((ship: RecentShipmentItem) => (
                                <div
                                    key={ship.id}
                                    onClick={() => navigate('/shipment')}
                                    className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] hover:bg-[var(--text-primary)]/[0.04] transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-root)] text-[var(--text-secondary)] border border-[var(--border-primary)] group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-colors">
                                            <Truck size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-[var(--text-primary)] group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">Xe: TRK-{ship.id}</p>
                                            <p className="text-[11px] text-[var(--text-secondary)] font-medium">{ship.storeName}</p>
                                        </div>
                                    </div>
                                    <Badge variant={statusColor[ship.status] as any || 'default'} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-[var(--text-primary)]/[0.05] shadow-sm border border-[var(--border-primary)]">
                                        {statusLabel[ship.status] || ship.status}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="py-16 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.01]">
                                <Activity size={32} className="mx-auto mb-3 text-zinc-600" />
                                <p className="text-[11px] font-medium text-zinc-500">Không có hoạt động mới nào</p>
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            onClick={() => navigate('/reports')}
                            className="w-full mt-2 py-5 rounded-xl border border-[var(--border-primary)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/[0.04] transition-all bg-[var(--bg-card)] uppercase tracking-widest shadow-sm"
                        >
                            Xem Cổng Báo Cáo
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};
