import React, { useEffect, useState, useMemo } from 'react';
import {
    Download, DollarSign, ShoppingBag, Store, Activity, BarChart3,
    Target, AlertCircle, Truck, ChefHat, Users, CheckCircle2,
    Clock, RefreshCw, ShieldAlert, ChevronRight,
    AlertTriangle, Flame, Award
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { billingApi } from '../../services/billing.api';
import { storeApi } from '../../services/store.api';
import { storeOrderApi } from '../../services/storeOrderApi';
import { shipmentApi } from '../../services/shipment.api';
import { productionPlanApi } from '../../services/productionPlan.api';
import { userService } from '../../services/user.service';
import { useAuth } from '../../hooks/useAuth';

export interface SalesData {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

export const ReportsDashboard: React.FC = () => {
    const { user } = useAuth();
    const role = user?.role?.toUpperCase().replace('ROLE_', '');

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'finance' | 'ops' | 'stores_hr' | 'alerts'>('all');

    // Data States for the 8 Groups
    const [statements, setStatements] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [shipments, setShipments] = useState<any[]>([]);
    const [productionPlans, setProductionPlans] = useState<any[]>([]);
    const [userList, setUserList] = useState<any[]>([]);

    const loadData = async (showRefreshSpinner = false) => {
        if (role !== 'MANAGER' && role !== 'ADMIN') {
            setIsLoading(false);
            return;
        }

        if (showRefreshSpinner) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            // Fetch 6 datasets concurrently with graceful fallbacks
            const [stmtRes, storeRes, orderRes, shipRes, planRes, userRes] = await Promise.all([
                billingApi.getStatements({ page: 0, size: 500 }).catch(() => ({ content: [] })),
                storeApi.getAllStores({ page: 0, size: 100 }).catch(() => ({ data: { content: [] } })),
                storeOrderApi.getAllOrders({ page: 0, size: 500 }).catch(() => ({ content: [] })),
                shipmentApi.getShipments({ page: 0, size: 500 }).catch(() => ({ content: [] })),
                productionPlanApi.getAllProductionPlans({ page: 0, size: 500 }).catch(() => ({ content: [] })),
                userService.getUsers({ page: 0, size: 500 }).catch(() => ({ data: { content: [] } })),
            ]);

            setStatements(stmtRes.content || []);
            setStores(storeRes.data?.content || []);
            setOrders(orderRes.content || []);
            setShipments(shipRes.content || []);
            setProductionPlans(planRes.content || []);
            setUserList(userRes.data?.content || []);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu báo cáo tổng thể:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [role]);

    // =========================================================================
    // GROUP 1 & 2 CALCULATIONS: REVENUE, DEBT & KPI
    // =========================================================================
    const financeData = useMemo(() => {
        let revenue = 0;
        let debt = 0;
        let overdueAmount = 0;
        let paidCount = 0;
        let issuedCount = 0;
        let overdueCount = 0;
        let draftCount = 0;
        let cancelledCount = 0;

        const monthMap: Record<string, number> = {};
        const storeFinMap: Record<string, { storeId: number; storeName: string; revenue: number; debt: number; orders: number }> = {};

        statements.forEach((stmt: any) => {
            const amount = Number(stmt.totalAmount || 0);
            const status = String(stmt.status || '').toUpperCase();
            const storeName = stmt.storeName || stmt.store?.storeName || `Cửa hàng #${stmt.storeId || 'N/A'}`;
            const storeId = Number(stmt.storeId || 0);

            if (!storeFinMap[storeName]) {
                storeFinMap[storeName] = { storeId, storeName, revenue: 0, debt: 0, orders: 0 };
            }

            if (status === 'PAID') {
                revenue += amount;
                paidCount++;
                storeFinMap[storeName].revenue += amount;
                storeFinMap[storeName].orders += 1;

                const dateCode = stmt.paidAt || stmt.issuedAt || stmt.createdAt;
                if (dateCode) {
                    const d = new Date(dateCode);
                    const year = d.getFullYear();
                    const quarter = Math.floor(d.getMonth() / 3) + 1;
                    const key = `${year}-Q${quarter}`;
                    monthMap[key] = (monthMap[key] || 0) + amount;
                }
            } else if (status === 'OVERDUE') {
                debt += amount;
                overdueAmount += amount;
                overdueCount++;
                storeFinMap[storeName].debt += amount;
            } else if (status === 'ISSUED' || status === 'UNPAID') {
                debt += amount;
                issuedCount++;
                storeFinMap[storeName].debt += amount;
            } else if (status === 'DRAFT') {
                draftCount++;
            } else if (status === 'CANCELLED') {
                cancelledCount++;
            }
        });

        const sortedKeys = Object.keys(monthMap).sort().slice(-4);
        const salesChartData: SalesData[] = sortedKeys.map(key => {
            const [year, quarter] = key.split('-');
            return {
                month: `${quarter}/${year.slice(-2)}`,
                revenue: monthMap[key],
                expenses: 0,
                profit: monthMap[key]
            };
        });

        const storesArray = Object.values(storeFinMap);
        const topRevenueStores = [...storesArray].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        const topDebtorStores = [...storesArray].filter(s => s.debt > 0).sort((a, b) => b.debt - a.debt).slice(0, 5);

        return {
            revenue,
            debt,
            overdueAmount,
            paidCount,
            issuedCount,
            overdueCount,
            draftCount,
            cancelledCount,
            salesChartData,
            topRevenueStores,
            topDebtorStores,
            storeFinMap
        };
    }, [statements]);

    // =========================================================================
    // GROUP 3 CALCULATIONS: ORDERS
    // =========================================================================
    const orderStats = useMemo(() => {
        const total = orders.length;
        let delivered = 0, confirmed = 0, submitted = 0, approved = 0, scheduled = 0, inTransit = 0, rejected = 0, failed = 0, cancelled = 0;

        orders.forEach((o: any) => {
            const status = String(o.status || '').toUpperCase();
            if (status === 'DELIVERED') delivered++;
            else if (status === 'CONFIRMED') confirmed++;
            else if (status === 'SUBMITTED') submitted++;
            else if (status === 'APPROVED') approved++;
            else if (status === 'SCHEDULED' || status === 'ALLOCATED' || status === 'PREPARING' || status === 'READY') scheduled++;
            else if (status === 'IN_TRANSIT') inTransit++;
            else if (status === 'REJECTED') rejected++;
            else if (status === 'DELIVERY_FAILED') failed++;
            else if (status === 'CANCELLED') cancelled++;
        });

        const success = delivered + confirmed;
        const rate = total > 0 ? ((success / total) * 100).toFixed(1) : '0.0';

        return { total, success, rate, delivered, confirmed, submitted, approved, scheduled, inTransit, rejected, failed, cancelled };
    }, [orders]);

    // =========================================================================
    // GROUP 4 CALCULATIONS: SHIPMENTS
    // =========================================================================
    const shipmentStats = useMemo(() => {
        const total = shipments.length;
        let delivered = 0, inTransit = 0, preparing = 0, created = 0, failed = 0, returned = 0, cancelled = 0;
        let totalCost = 0;

        shipments.forEach((s: any) => {
            const status = String(s.status || '').toUpperCase();
            if (status === 'DELIVERED') delivered++;
            else if (status === 'IN_TRANSIT') inTransit++;
            else if (status === 'PREPARED' || status === 'PREPARING' || status === 'READY_FOR_PICKUP') preparing++;
            else if (status === 'PENDING' || status === 'CREATED') created++;
            else if (status === 'DELIVERY_FAILED') failed++;
            else if (status === 'RETURNED') returned++;
            else if (status === 'CANCELLED') cancelled++;

            totalCost += Number(s.shippingFee || s.shippingCost || 0);
        });

        const rate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0.0';
        return { total, delivered, rate, totalCost, inTransit, preparing, created, failed, returned, cancelled };
    }, [shipments]);

    // =========================================================================
    // GROUP 5 CALCULATIONS: PRODUCTION PLANS
    // =========================================================================
    const productionStats = useMemo(() => {
        const total = productionPlans.length;
        let completed = 0, inProgress = 0, ready = 0, draft = 0, cancelled = 0;

        productionPlans.forEach((p: any) => {
            const status = String(p.status || '').toUpperCase();
            if (status === 'COMPLETED' || status === 'FINISHED' || status === 'PRODUCED') completed++;
            else if (status === 'IN_PROGRESS' || status === 'PRODUCING' || status === 'READY_TO_PRODUCE' || status === 'IN_PRODUCTION') inProgress++;
            else if (status === 'READY' || status === 'ALLOCATED' || status === 'APPROVED') ready++;
            else if (status === 'DRAFT' || status === 'PLANNED') draft++;
            else if (status === 'CANCELLED') cancelled++;
        });

        const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
        return { total, completed, rate, inProgress, ready, draft, cancelled };
    }, [productionPlans]);

    // =========================================================================
    // GROUP 6 CALCULATIONS: STORE COMPARISON TABLE
    // =========================================================================
    const storeComparisonList = useMemo(() => {
        return stores.map((st: any) => {
            const storeId = Number(st.id || st.storeId || 0);
            const name = st.name || st.storeName || `Cửa hàng #${storeId}`;
            const fin = Object.values(financeData.storeFinMap).find(f => f.storeId === storeId || f.storeName === name) || { revenue: 0, debt: 0, orders: 0 };
            
            const storeOrders = orders.filter(o => Number(o.storeId) === storeId || o.storeName === name);
            const totalOrd = storeOrders.length;
            const successOrd = storeOrders.filter(o => {
                const s = String(o.status || '').toUpperCase();
                return s === 'DELIVERED' || s === 'CONFIRMED';
            }).length;
            const ordSuccessRate = totalOrd > 0 ? Math.round((successOrd / totalOrd) * 100) : 100;

            return {
                storeId,
                name,
                address: st.address || 'Chưa cập nhật',
                ordersCount: totalOrd || fin.orders,
                revenue: fin.revenue,
                debt: fin.debt,
                successRate: ordSuccessRate
            };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [stores, financeData.storeFinMap, orders]);

    // =========================================================================
    // GROUP 7 CALCULATIONS: PERSONNEL (USERS & ROLES)
    // =========================================================================
    const hrStats = useMemo(() => {
        const total = userList.length;
        let active = 0, inactive = 0;
        let adminCount = 0, managerCount = 0, coordinatorCount = 0, kitchenCount = 0, storeStaffCount = 0;

        userList.forEach((u: any) => {
            const isActive = u.isActive !== false && u.status !== 'BLOCKED' && u.status !== 'DELETED' && u.status !== 'INACTIVE';
            if (isActive) active++; else inactive++;

            const rCode = String(u.role || u.roleName || '').toUpperCase().replace('ROLE_', '');
            if (rCode.includes('ADMIN')) adminCount++;
            else if (rCode.includes('MANAGER')) managerCount++;
            else if (rCode.includes('COORDINATOR')) coordinatorCount++;
            else if (rCode.includes('KITCHEN')) kitchenCount++;
            else if (rCode.includes('STORE') || rCode.includes('STAFF')) storeStaffCount++;
            else storeStaffCount++; // fallback
        });

        return { total, active, inactive, adminCount, managerCount, coordinatorCount, kitchenCount, storeStaffCount };
    }, [userList]);

    // =========================================================================
    // GROUP 8 CALCULATIONS: URGENT ALERTS & ACTIONS
    // =========================================================================
    const urgentAlerts = useMemo(() => {
        const overdueBills = statements.filter(stmt => String(stmt.status || '').toUpperCase() === 'OVERDUE');
        const failedShips = shipments.filter(s => {
            const st = String(s.status || '').toUpperCase();
            return st === 'DELIVERY_FAILED' || st === 'RETURNED';
        });
        const longPendingOrders = orders.filter(o => {
            if (String(o.status || '').toUpperCase() !== 'SUBMITTED') return false;
            const dateStr = o.orderDate || o.createdAt;
            if (!dateStr) return false;
            const diffHours = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
            return diffHours >= 4;
        });

        return { overdueBills, failedShips, longPendingOrders, totalCount: overdueBills.length + failedShips.length + longPendingOrders.length };
    }, [statements, shipments, orders]);

    // =========================================================================
    // ELITE BAR CHART COMPONENT (PRESERVED)
    // =========================================================================
    const EliteBarChart = ({ data }: { data: SalesData[] }) => {
        const maxVal = Math.max(...data.map(d => d.revenue), 1);
        if (data.length === 0) {
            return (
                <div className="flex items-center justify-center h-64 text-[var(--text-secondary)] italic text-sm">
                    Chưa có dữ liệu doanh thu hợp lệ để vẽ biểu đồ
                </div>
            );
        }

        return (
            <div className="flex items-end justify-between h-64 gap-4 mt-6 px-4 relative">
                <div className="absolute inset-x-0 top-0 h-px bg-[var(--text-primary)]/5"></div>
                <div className="absolute inset-x-0 top-1/4 h-px bg-[var(--text-primary)]/5"></div>
                <div className="absolute inset-x-0 top-2/4 h-px bg-[var(--text-primary)]/5"></div>
                <div className="absolute inset-x-0 top-3/4 h-px bg-[var(--text-primary)]/5"></div>

                {data.map((item) => (
                    <div key={item.month} className="flex flex-col items-center gap-4 group w-full relative z-10">
                        <div className="relative w-full flex justify-center items-end h-full">
                            <div
                                className="w-full max-w-[48px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] relative"
                                style={{ height: `${(item.revenue / maxVal) * 100}%` }}
                            >
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-primary)] text-[var(--text-primary)] text-[10px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 whitespace-nowrap z-20 shadow-xl">
                                    <div className="text-amber-500 font-bold">DT: {(item.revenue / 1000000).toFixed(2)}M</div>
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tighter group-hover:text-amber-500 transition-colors">
                            {item.month}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    if (role !== 'MANAGER' && role !== 'ADMIN') {
        return (
            <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <AlertCircle size={48} className="text-red-500 mb-4 opacity-80" />
                <h2 className="text-2xl font-black tracking-tighter text-[var(--text-primary)] uppercase">CHỈ DÀNH CHO MANAGER & ADMIN</h2>
                <div className="text-[var(--text-secondary)] text-sm italic">Báo cáo quản trị tổng thể là tính năng bảo mật cấp cao, chỉ Manager và Admin mới có quyền truy cập.</div>
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
                <div className="text-amber-500 text-sm font-bold tracking-widest animate-pulse italic uppercase">Đang tổng hợp dữ liệu 8 nhóm báo cáo...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] pb-20 -m-4 md:-m-8">
            {/* Header / Hero Section */}
            <div className="relative h-72 w-full overflow-hidden bg-[var(--bg-card)] border-b border-[var(--border-primary)]">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-root)]/70 to-[var(--bg-root)]"></div>

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                    <BarChart3 className="text-amber-500" size={28} />
                                </div>
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] italic uppercase leading-none">
                                        REVENUE <span className="text-amber-500">COCKPIT</span>
                                    </h1>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Activity size={14} className="text-amber-500/60" />
                                        <span className="text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase">
                                            Trung Tâm Phân Tích Toàn Diện 8 Nhóm Quản Trị • {role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                onClick={() => loadData(true)}
                                disabled={isRefreshing}
                                className="bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] text-[var(--text-primary)] font-bold px-4 h-11 rounded-xl flex items-center gap-2 active:scale-95 transition-all shadow-md"
                            >
                                <RefreshCw size={18} className={isRefreshing ? "animate-spin text-amber-500" : ""} />
                                <span>{isRefreshing ? "Đang tải..." : "Làm mới"}</span>
                            </Button>
                            <Button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black px-6 h-11 rounded-xl shadow-xl shadow-amber-500/20 flex items-center gap-2 active:scale-95 transition-all">
                                <Download size={18} /> XUẤT BÁO CÁO
                            </Button>
                        </div>
                    </div>

                    {/* Quick Category Navigation Tabs */}
                    <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { id: 'all', label: '⚡ Tất cả (8 Nhóm)', count: null },
                            { id: 'finance', label: '💰 Nhóm 1 & 2: KPI & Doanh thu', count: null },
                            { id: 'ops', label: '📦 Nhóm 3, 4, 5: Đơn & Vận hành', count: null },
                            { id: 'stores_hr', label: '🏪 Nhóm 6 & 7: Điểm bán & Nhân sự', count: null },
                            { id: 'alerts', label: '🚨 Nhóm 8: Cảnh báo & Hành động', count: urgentAlerts.totalCount }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                                    activeTab === tab.id
                                        ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-primary)] hover:border-amber-500/30'
                                }`}
                            >
                                <span>{tab.label}</span>
                                {tab.count !== null && tab.count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                        activeTab === tab.id ? 'bg-black text-amber-500' : 'bg-red-500 text-white animate-pulse'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 mt-6 relative z-10 space-y-12">
                
                {/* =============================================================== */}
                {/* NHÓM 1: KPI TỔNG QUAN (EXECUTIVE SUMMARY)                       */}
                {/* =============================================================== */}
                {(activeTab === 'all' || activeTab === 'finance') && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                            <h2 className="text-xl font-black italic uppercase tracking-tight text-[var(--text-primary)]">
                                Nhóm 1: KPI Chỉ Số Vận Hành Tổng Quan
                            </h2>
                            <span className="text-xs text-[var(--text-secondary)] font-medium">({statements.length} HĐ • {orders.length} Đơn • {stores.length} Điểm bán)</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {[
                                { label: 'Doanh Thu Đã Thu', value: `${(financeData.revenue / 1000000).toFixed(1)}M`, sub: `${financeData.paidCount} hóa đơn PAID`, icon: DollarSign, color: 'emerald' },
                                { label: 'Công Nợ Chưa Thu', value: `${(financeData.debt / 1000000).toFixed(1)}M`, sub: `${financeData.issuedCount + financeData.overdueCount} HĐ chờ / nợ`, icon: Target, color: 'blue' },
                                { label: 'Cửa Hàng Active', value: stores.length, sub: 'Điểm bán trong hệ thống', icon: Store, color: 'amber' },
                                { label: 'Đang Vận Chuyển', value: shipmentStats.inTransit, sub: 'Chuyến xe trên đường', icon: Truck, color: 'purple' },
                                { label: 'Đơn Chờ > 4 Tiếng', value: urgentAlerts.longPendingOrders.length, sub: 'Cần duyệt gấp', icon: Clock, color: urgentAlerts.longPendingOrders.length > 0 ? 'amber' : 'slate' },
                                { label: 'Hóa Đơn Quá Hạn', value: financeData.overdueCount, sub: `${(financeData.overdueAmount / 1000000).toFixed(1)}M tiền nợ`, icon: AlertCircle, color: financeData.overdueCount > 0 ? 'red' : 'slate' },
                                { label: 'Giao Thất Bại / Hoàn', value: shipmentStats.failed + shipmentStats.returned, sub: 'Cần kiểm tra sự cố', icon: ShieldAlert, color: (shipmentStats.failed + shipmentStats.returned) > 0 ? 'red' : 'slate' },
                                { label: 'Tỷ Lệ Giao Thành Công', value: `${shipmentStats.rate}%`, sub: `${shipmentStats.delivered}/${shipmentStats.total} chuyến hoàn tất`, icon: CheckCircle2, color: 'emerald' },
                            ].map((kpi, idx) => (
                                <div key={idx} className="group relative">
                                    <div className="relative backdrop-blur-xl bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`p-2.5 bg-${kpi.color}-500/10 rounded-xl border border-${kpi.color}-500/20 text-${kpi.color}-500`}>
                                                <kpi.icon size={20} />
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block">{kpi.label}</span>
                                                <h3 className="text-2xl font-black text-[var(--text-primary)] mt-0.5 italic">{kpi.value}</h3>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-[var(--border-primary)] flex items-center justify-between text-[11px] font-medium text-[var(--text-secondary)]">
                                            <span>{kpi.sub}</span>
                                            <ChevronRight size={14} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* =============================================================== */}
                {/* NHÓM 2: DOANH THU & CÔNG NỢ                                    */}
                {/* =============================================================== */}
                {(activeTab === 'all' || activeTab === 'finance') && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                            <h2 className="text-xl font-black italic uppercase tracking-tight text-[var(--text-primary)]">
                                Nhóm 2: Phân Tích Doanh Thu & Công Nợ Chi Tiết
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Revenue Chart */}
                            <div className="lg:col-span-2 backdrop-blur-xl bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-7 shadow-2xl flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-[var(--text-primary)] italic uppercase tracking-tight">Biểu Đồ Doanh Thu Các Quý</h3>
                                        <p className="text-xs text-[var(--text-secondary)]">Lưu lượng tiền thực thu (hóa đơn PAID)</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">DT Thực thu</span>
                                    </div>
                                </div>
                                <EliteBarChart data={financeData.salesChartData} />

                                {/* Invoice Status Breakdown Progress Bars */}
                                <div className="mt-8 pt-6 border-t border-[var(--border-primary)] space-y-4">
                                    <h4 className="text-xs font-black uppercase text-[var(--text-secondary)] tracking-wider">Phân Bố Trạng Thái Hóa Đơn ({statements.length} tổng)</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {[
                                            { label: 'Đã Thu (PAID)', count: financeData.paidCount, color: 'bg-emerald-500', text: 'text-emerald-500' },
                                            { label: 'Đang Chờ (ISSUED)', count: financeData.issuedCount, color: 'bg-blue-500', text: 'text-blue-500' },
                                            { label: 'Quá Hạn (OVERDUE)', count: financeData.overdueCount, color: 'bg-red-500', text: 'text-red-500' },
                                            { label: 'Nháp (DRAFT)', count: financeData.draftCount, color: 'bg-amber-500', text: 'text-amber-500' },
                                            { label: 'Đã Hủy (CANCEL)', count: financeData.cancelledCount, color: 'bg-gray-500', text: 'text-gray-400' },
                                        ].map((item, i) => (
                                            <div key={i} className="bg-[var(--bg-root)] p-3 rounded-xl border border-[var(--border-primary)]">
                                                <div className="flex justify-between text-[11px] font-bold mb-1">
                                                    <span className="text-[var(--text-secondary)]">{item.label}</span>
                                                    <span className={item.text}>{item.count}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-[var(--text-primary)]/10 rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.color}`} style={{ width: `${statements.length > 0 ? (item.count / statements.length) * 100 : 0}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Top Debtors & Top Revenue Sidebar */}
                            <div className="space-y-6">
                                {/* Top 5 Debtor Stores */}
                                <div className="backdrop-blur-xl bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Flame className="text-red-500" size={20} />
                                            <h3 className="text-sm font-black uppercase italic tracking-tight text-[var(--text-primary)]">Top 5 Cửa Hàng Nợ Nhiều Nhất</h3>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {financeData.topDebtorStores.length === 0 ? (
                                            <p className="text-xs text-[var(--text-secondary)] italic text-center py-4">Tuyệt vời! Không có cửa hàng nào nợ công nợ.</p>
                                        ) : (
                                            financeData.topDebtorStores.map((store, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="w-6 h-6 rounded-lg bg-red-500 text-white font-black text-xs flex items-center justify-center">#{idx + 1}</span>
                                                        <div>
                                                            <div className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[130px]">{store.storeName}</div>
                                                            <div className="text-[10px] text-[var(--text-secondary)]">Mã CH #{store.storeId}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-black text-red-500">{(store.debt / 1000000).toFixed(2)}M</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Top 5 Revenue Stores */}
                                <div className="backdrop-blur-xl bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Award className="text-amber-500" size={20} />
                                            <h3 className="text-sm font-black uppercase italic tracking-tight text-[var(--text-primary)]">Top 5 Doanh Thu Điểm Bán</h3>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {financeData.topRevenueStores.map((store, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-root)] border border-[var(--border-primary)] hover:border-amber-500/40 transition-colors">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 font-black text-xs flex items-center justify-center">#{idx + 1}</span>
                                                    <div>
                                                        <div className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[130px]">{store.storeName}</div>
                                                        <div className="text-[10px] text-[var(--text-secondary)]">{store.orders} hóa đơn</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-[var(--text-primary)]">{(store.revenue / 1000000).toFixed(2)}M</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =============================================================== */}
                {/* NHÓM 3, 4, 5: VẬN HÀNH (ĐƠN HÀNG, VẬN CHUYỂN, KẾ HOẠCH SX)       */}
                {/* =============================================================== */}
                {(activeTab === 'all' || activeTab === 'ops') && (
                    <div className="space-y-8">
                        <div className="flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                            <h2 className="text-xl font-black italic uppercase tracking-tight text-[var(--text-primary)]">
                                Nhóm 3, 4, 5: Hiệu Quả Chuỗi Vận Hành (Đơn • Vận Chuyển • Sản Xuất)
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Group 3: Orders Breakdown */}
                            <div className="backdrop-blur-xl bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
                                                <ShoppingBag size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight">Nhóm 3: Đơn Hàng</h3>
                                                <p className="text-[11px] text-[var(--text-secondary)]">Tỷ lệ thành công: <strong className="text-blue-500">{orderStats.rate}%</strong></p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black italic text-[var(--text-primary)]">{orderStats.total}</span>
                                    </div>

                                    <div className="space-y-2.5 mt-6">
                                        {[
                                            { label: 'Thành công (DELIVERED/CONFIRMED)', count: orderStats.success, color: 'bg-emerald-500', text: 'text-emerald-500' },
                                            { label: 'Chờ duyệt (SUBMITTED)', count: orderStats.submitted, color: 'bg-amber-500', text: 'text-amber-500' },
                                            { label: 'Đã duyệt / Lên lịch', count: orderStats.approved + orderStats.scheduled, color: 'bg-blue-500', text: 'text-blue-500' },
                                            { label: 'Đang giao (IN_TRANSIT)', count: orderStats.inTransit, color: 'bg-purple-500', text: 'text-purple-500' },
                                            { label: 'Từ chối / Hủy / Lỗi', count: orderStats.rejected + orderStats.failed + orderStats.cancelled, color: 'bg-red-500', text: 'text-red-500' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-[11px] font-bold">
                                                    <span className="text-[var(--text-secondary)]">{item.label}</span>
                                                    <span className={item.text}>{item.count}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-[var(--text-primary)]/10 rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.color}`} style={{ width: `${orderStats.total > 0 ? (item.count / orderStats.total) * 100 : 0}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Group 4: Shipments Breakdown */}
                            <div className="backdrop-blur-xl bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/20">
                                                <Truck size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight">Nhóm 4: Vận Chuyển</h3>
                                                <p className="text-[11px] text-[var(--text-secondary)]">Phí ship: <strong className="text-purple-500">{(shipmentStats.totalCost / 1000).toLocaleString()}k</strong></p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black italic text-[var(--text-primary)]">{shipmentStats.total}</span>
                                    </div>

                                    <div className="space-y-2.5 mt-6">
                                        {[
                                            { label: 'Giao hoàn tất (DELIVERED)', count: shipmentStats.delivered, color: 'bg-emerald-500', text: 'text-emerald-500' },
                                            { label: 'Đang trên đường (IN_TRANSIT)', count: shipmentStats.inTransit, color: 'bg-purple-500', text: 'text-purple-500' },
                                            { label: 'Đang chuẩn bị (PREPARED)', count: shipmentStats.preparing, color: 'bg-blue-500', text: 'text-blue-500' },
                                            { label: 'Mới tạo (PENDING)', count: shipmentStats.created, color: 'bg-amber-500', text: 'text-amber-500' },
                                            { label: 'Giao lỗi / Hoàn (FAILED)', count: shipmentStats.failed + shipmentStats.returned + shipmentStats.cancelled, color: 'bg-red-500', text: 'text-red-500' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-[11px] font-bold">
                                                    <span className="text-[var(--text-secondary)]">{item.label}</span>
                                                    <span className={item.text}>{item.count}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-[var(--text-primary)]/10 rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.color}`} style={{ width: `${shipmentStats.total > 0 ? (item.count / shipmentStats.total) * 100 : 0}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Group 5: Production Plans Breakdown */}
                            <div className="backdrop-blur-xl bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                                                <ChefHat size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight">Nhóm 5: Sản Xuất</h3>
                                                <p className="text-[11px] text-[var(--text-secondary)]">Hoàn thành: <strong className="text-amber-500">{productionStats.rate}%</strong></p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black italic text-[var(--text-primary)]">{productionStats.total}</span>
                                    </div>

                                    <div className="space-y-2.5 mt-6">
                                        {[
                                            { label: 'Hoàn tất (COMPLETED)', count: productionStats.completed, color: 'bg-emerald-500', text: 'text-emerald-500' },
                                            { label: 'Đang nấu (IN_PROGRESS)', count: productionStats.inProgress, color: 'bg-amber-500', text: 'text-amber-500' },
                                            { label: 'Sẵn sàng (READY/ALLOCATED)', count: productionStats.ready, color: 'bg-blue-500', text: 'text-blue-500' },
                                            { label: 'Kế hoạch nháp (DRAFT)', count: productionStats.draft, color: 'bg-slate-500', text: 'text-slate-400' },
                                            { label: 'Đã hủy (CANCELLED)', count: productionStats.cancelled, color: 'bg-red-500', text: 'text-red-500' },
                                        ].map((item, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-[11px] font-bold">
                                                    <span className="text-[var(--text-secondary)]">{item.label}</span>
                                                    <span className={item.text}>{item.count}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-[var(--text-primary)]/10 rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.color}`} style={{ width: `${productionStats.total > 0 ? (item.count / productionStats.total) * 100 : 0}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =============================================================== */}
                {/* NHÓM 6 & 7: ĐIỂM BÁN & NHÂN SỰ                                 */}
                {/* =============================================================== */}
                {(activeTab === 'all' || activeTab === 'stores_hr') && (
                    <div className="space-y-8">
                        <div className="flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                            <h2 className="text-xl font-black italic uppercase tracking-tight text-[var(--text-primary)]">
                                Nhóm 6 & 7: So Sánh Hiệu Quả Điểm Bán & Cân Đối Nhân Sự
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Group 6: Store Comparison Table (2 columns width) */}
                            <div className="lg:col-span-2 backdrop-blur-xl bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-2xl flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                                            <Store className="text-amber-500" size={20} />
                                            <span>Nhóm 6: Bảng So Sánh Hiệu Quả Cửa Hàng</span>
                                        </h3>
                                        <p className="text-xs text-[var(--text-secondary)]">Đánh giá đa chiều Đơn hàng / Doanh thu / Công nợ / % Giao thành công</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-[var(--border-primary)] text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                                                <th className="pb-3 pl-2"># / Cửa hàng</th>
                                                <th className="pb-3 text-center">Đơn hàng</th>
                                                <th className="pb-3 text-right">Doanh số</th>
                                                <th className="pb-3 text-right">Công nợ</th>
                                                <th className="pb-3 text-right pr-2">% Giao thành công</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-primary)] text-xs">
                                            {storeComparisonList.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-6 text-[var(--text-secondary)] italic">Chưa có dữ liệu cửa hàng</td>
                                                </tr>
                                            ) : (
                                                storeComparisonList.map((st, idx) => (
                                                    <tr key={st.storeId} className={`hover:bg-[var(--bg-hover)] transition-colors ${st.debt > 0 ? 'bg-red-500/5' : ''}`}>
                                                        <td className="py-3.5 pl-2 font-bold text-[var(--text-primary)]">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded bg-[var(--text-primary)]/10 text-[10px] flex items-center justify-center font-black">{idx + 1}</span>
                                                                <div>
                                                                    <div className="text-xs font-black truncate max-w-[150px]">{st.name}</div>
                                                                    <div className="text-[10px] text-[var(--text-secondary)] truncate max-w-[150px]">{st.address}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 text-center font-bold">{st.ordersCount}</td>
                                                        <td className="py-3.5 text-right font-black text-[var(--text-primary)]">{(st.revenue / 1000000).toFixed(2)}M</td>
                                                        <td className="py-3.5 text-right font-black">
                                                            {st.debt > 0 ? (
                                                                <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">{(st.debt / 1000000).toFixed(2)}M</span>
                                                            ) : (
                                                                <span className="text-emerald-500">0đ</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 text-right pr-2 font-bold">
                                                            <span className={st.successRate >= 90 ? 'text-emerald-500' : st.successRate >= 75 ? 'text-amber-500' : 'text-red-500'}>
                                                                {st.successRate}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Group 7: Personnel Distribution */}
                            <div className="backdrop-blur-xl bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                                                <Users className="text-blue-500" size={20} />
                                                <span>Nhóm 7: Nhân Sự</span>
                                            </h3>
                                            <p className="text-xs text-[var(--text-secondary)]">Tổng quan tài khoản & vai trò hệ thống</p>
                                        </div>
                                        <span className="text-3xl font-black italic text-blue-500">{hrStats.total}</span>
                                    </div>

                                    {/* Active / Inactive boxes */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between">
                                            <span className="text-xs font-bold text-emerald-500">Đang hoạt động</span>
                                            <span className="text-base font-black text-emerald-500">{hrStats.active}</span>
                                        </div>
                                        <div className="bg-slate-500/10 border border-slate-500/20 p-3 rounded-xl flex items-center justify-between">
                                            <span className="text-xs font-bold text-[var(--text-secondary)]">Khóa / Nghỉ</span>
                                            <span className="text-base font-black text-[var(--text-secondary)]">{hrStats.inactive}</span>
                                        </div>
                                    </div>

                                    {/* Role Breakdown */}
                                    <div className="space-y-3.5">
                                        <h4 className="text-xs font-black uppercase text-[var(--text-secondary)] tracking-wider">Cơ Cấu 5 Vai Trò Chính</h4>
                                        {[
                                            { label: 'Quản trị viên (ADMIN)', count: hrStats.adminCount, color: 'bg-red-500', text: 'text-red-500' },
                                            { label: 'Quản lý chuỗi (MANAGER)', count: hrStats.managerCount, color: 'bg-amber-500', text: 'text-amber-500' },
                                            { label: 'Điều phối viên (COORDINATOR)', count: hrStats.coordinatorCount, color: 'bg-blue-500', text: 'text-blue-500' },
                                            { label: 'Nhân sự bếp (KITCHEN_STAFF)', count: hrStats.kitchenCount, color: 'bg-purple-500', text: 'text-purple-500' },
                                            { label: 'Quản lý CH (STORE_STAFF)', count: hrStats.storeStaffCount, color: 'bg-emerald-500', text: 'text-emerald-500' },
                                        ].map((roleItem, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-[var(--text-secondary)]">{roleItem.label}</span>
                                                    <span className={roleItem.text}>{roleItem.count} người ({hrStats.total > 0 ? Math.round((roleItem.count / hrStats.total) * 100) : 0}%)</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-[var(--text-primary)]/10 rounded-full overflow-hidden">
                                                    <div className={`h-full ${roleItem.color}`} style={{ width: `${hrStats.total > 0 ? (roleItem.count / hrStats.total) * 100 : 0}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =============================================================== */}
                {/* NHÓM 8: CẢNH BÁO & HÀNH ĐỘNG (URGENT ALERTS)                    */}
                {/* =============================================================== */}
                {(activeTab === 'all' || activeTab === 'alerts') && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-l-4 border-red-500 pl-3">
                            <h2 className="text-xl font-black italic uppercase tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                                <AlertTriangle className="text-red-500 animate-bounce" size={24} />
                                <span>Nhóm 8: Cảnh Báo Khẩn & Hành Động Quản Trị</span>
                            </h2>
                        </div>

                        {urgentAlerts.totalCount === 0 ? (
                            <div className="backdrop-blur-xl bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-3">
                                <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
                                <h3 className="text-xl font-black text-emerald-500 uppercase">Mọi Chỉ Số Vận Hành Đang Ở Ngưỡng An Toàn Tuyệt Đối!</h3>
                                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                                    Không có hóa đơn quá hạn, không có chuyến xe giao thất bại và không có đơn đặt hàng nào bị ngâm duyệt quá 4 tiếng.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Alert 1: Overdue Bills */}
                                <div className="backdrop-blur-xl bg-red-500/5 border border-red-500/30 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-wider">Khẩn cấp 🔴</span>
                                            <span className="text-lg font-black text-red-500">{urgentAlerts.overdueBills.length} Hóa đơn</span>
                                        </div>
                                        <h3 className="text-base font-black uppercase text-[var(--text-primary)] mb-1">Hóa Đơn Quá Hạn Thanh Toán</h3>
                                        <p className="text-xs text-[var(--text-secondary)] mb-4">Các điểm bán chậm trễ thanh toán kỳ đối soát</p>

                                        <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar">
                                            {urgentAlerts.overdueBills.map((stmt, idx) => (
                                                <div key={idx} className="p-3 bg-[var(--bg-card)] rounded-xl border border-red-500/20 flex justify-between items-center text-xs">
                                                    <div>
                                                        <div className="font-bold text-[var(--text-primary)]">{stmt.storeName || `CH #${stmt.storeId}`}</div>
                                                        <div className="text-[10px] text-[var(--text-secondary)]">Kỳ: {stmt.cycleName}</div>
                                                    </div>
                                                    <span className="font-black text-red-500">{(Number(stmt.totalAmount || 0) / 1000000).toFixed(2)}M</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-black text-xs h-10 rounded-xl mt-4">
                                        Gửi Thông Báo Nhắc Nợ
                                    </Button>
                                </div>

                                {/* Alert 2: Failed Shipments */}
                                <div className="backdrop-blur-xl bg-orange-500/5 border border-orange-500/30 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider">Cảnh báo 🔴</span>
                                            <span className="text-lg font-black text-orange-500">{urgentAlerts.failedShips.length} Chuyến</span>
                                        </div>
                                        <h3 className="text-base font-black uppercase text-[var(--text-primary)] mb-1">Sự Cố Giao Hàng / Hoàn Xe</h3>
                                        <p className="text-xs text-[var(--text-secondary)] mb-4">Chuyến xe bị lỗi giao hoặc hoàn trả về kho</p>

                                        <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar">
                                            {urgentAlerts.failedShips.length === 0 ? (
                                                <p className="text-xs text-[var(--text-secondary)] italic text-center py-4">Không có chuyến xe nào thất bại</p>
                                            ) : (
                                                urgentAlerts.failedShips.map((ship, idx) => (
                                                    <div key={idx} className="p-3 bg-[var(--bg-card)] rounded-xl border border-orange-500/20 flex justify-between items-center text-xs">
                                                        <div>
                                                            <div className="font-bold text-[var(--text-primary)]">Chuyến #{ship.shipmentId}</div>
                                                            <div className="text-[10px] text-orange-500 font-bold">{ship.status}</div>
                                                        </div>
                                                        <span className="text-[11px] text-[var(--text-secondary)] truncate max-w-[100px]">{ship.remarks || ship.note || 'Lỗi vận chuyển'}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-xs h-10 rounded-xl mt-4">
                                        Kiểm Tra Sự Cố Vận Chuyển
                                    </Button>
                                </div>

                                {/* Alert 3: Long Pending Orders */}
                                <div className="backdrop-blur-xl bg-amber-500/5 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider">Chú ý 🟡</span>
                                            <span className="text-lg font-black text-amber-500">{urgentAlerts.longPendingOrders.length} Đơn</span>
                                        </div>
                                        <h3 className="text-base font-black uppercase text-[var(--text-primary)] mb-1">Đơn Đặt Hàng Chờ Duyệt Lâu</h3>
                                        <p className="text-xs text-[var(--text-secondary)] mb-4">Đơn ở trạng thái SUBMITTED trên 4 tiếng</p>

                                        <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar">
                                            {urgentAlerts.longPendingOrders.length === 0 ? (
                                                <p className="text-xs text-[var(--text-secondary)] italic text-center py-4">Tất cả đơn đặt hàng đều được xử lý nhanh chóng!</p>
                                            ) : (
                                                urgentAlerts.longPendingOrders.map((ord, idx) => (
                                                    <div key={idx} className="p-3 bg-[var(--bg-card)] rounded-xl border border-amber-500/20 flex justify-between items-center text-xs">
                                                        <div>
                                                            <div className="font-bold text-[var(--text-primary)]">Đơn #{ord.orderId} ({ord.storeName || `CH #${ord.storeId}`})</div>
                                                            <div className="text-[10px] text-[var(--text-secondary)]">Ngày giao: {ord.deliveryDate}</div>
                                                        </div>
                                                        <span className="text-xs font-black text-amber-500">SUBMITTED</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black text-xs h-10 rounded-xl mt-4">
                                        Chuyển Trang Duyệt Đơn Ngay
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
