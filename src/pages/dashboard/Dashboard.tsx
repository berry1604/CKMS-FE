import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, Activity, TrendingUp, AlertCircle, CheckCircle, Plus, Truck, Store, Package } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { dashboardService } from '../../services/mock/dashboard.mock';
import type { DashboardStats, RecentActivity } from '../../services/mock/dashboard.mock';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    // Initialize with fallback/empty data to ensure UI renders immediately if needed
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        activeStores: 0,
        pendingOrders: 0,
        activeUsers: 0
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [statsRes, activityRes] = await Promise.all([
                    dashboardService.getStats(user?.role),
                    dashboardService.getRecentActivity()
                ]);
                setStats(statsRes.data);
                setRecentActivity(activityRes.data);
            } catch (error) {
                console.error('Failed to load dashboard data', error);
                // In case of error, we can either keep the default empty state
                // or set specific "error" state data if requirements change.
                // For now, the requirements say "show placeholder/empty state", which the default provided above covers.
                // If we want to show MOCK data specifically on failure (if API was real but failed):
                // setStats(MOCK_STATS); // We'd need to import MOCK_STATS or similar.
                // Since dashboardService IS the mock, if it fails, it's a deeper issue, but we'll stick to non-blocking.
            } finally {
                // Ensure loading is always turned off
                setIsLoading(false);
            }
        };

        if (user) loadDashboardData();
    }, [user]);

    // Removed blocking loading check: if (isLoading) return ...

    const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string; value: string | number; icon: any; color: string, trend?: string }) => (
        <Card className="flex flex-col p-5 border-0 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} text-white`}>
                    <Icon size={22} />
                </div>
                {trend && (
                    <Badge variant="success" className="text-xs px-2 py-0.5">
                        <TrendingUp size={12} className="mr-1" /> {trend}
                    </Badge>
                )}
            </div>
            <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {value !== undefined && value !== null ? value : '-'}
                </h3>
                <p className="text-sm font-medium text-gray-500">{title}</p>
            </div>
        </Card>
    );

    const QuickAction = ({ label, icon: Icon, onClick, color }: { label: string; icon: any; onClick: () => void, color: string }) => (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group"
        >
            <div className={`p-3 rounded-full ${color} text-white mb-2 group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
        </button>
    );

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{currentDate}</p>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            Welcome back, {user?.name || 'User'}!
                        </h1>
                        {isLoading && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full animate-pulse">
                                Updating...
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 mt-1">Here's what's happening in your franchise today.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => navigate('/notifications')} variant="outline">
                        Notifications
                    </Button>
                </div>
            </div>

            {/* Quick Actions - Role Based */}
            {user?.role !== 'KITCHEN_STAFF' && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <QuickAction label="New Order" icon={Plus} color="bg-blue-600" onClick={() => navigate('/orders/create')} />
                    <QuickAction label="Add Product" icon={Package} color="bg-indigo-600" onClick={() => navigate('/products')} />
                    <QuickAction label="Shipment" icon={Truck} color="bg-orange-600" onClick={() => navigate('/shipments')} />
                    <QuickAction label="New Store" icon={Store} color="bg-purple-600" onClick={() => navigate('/stores')} />
                </div>
            )}


            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {user?.role !== 'KITCHEN_STAFF' && (
                    <StatCard
                        title="Total Revenue"
                        value={`$${stats?.totalRevenue.toLocaleString()}`}
                        icon={DollarSign}
                        color="bg-green-500"
                        trend="+12%"
                    />
                )}

                <StatCard
                    title={user?.role === 'MANAGER' ? 'My Store' : "Active Stores"}
                    value={stats?.activeStores || 0}
                    icon={ShoppingBag}
                    color="bg-blue-500"
                    trend={user?.role === 'ADMIN' ? '+2 this week' : undefined}
                />

                <StatCard
                    title={user?.role === 'KITCHEN_STAFF' ? 'Production Tasks' : "Pending Orders"}
                    value={stats?.pendingOrders || 0}
                    icon={Activity}
                    color="bg-orange-500"
                />

                <StatCard
                    title={user?.role === 'MANAGER' ? 'Staff Members' : "Active Users"}
                    value={stats?.activeUsers || 0}
                    icon={Users}
                    color="bg-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <Card title="Revenue Trends" className="lg:col-span-2 border-0 shadow-sm ring-1 ring-gray-200">
                    <div className="h-64 flex items-end justify-between px-4 mt-6 gap-2">
                        {[65, 59, 80, 81, 56, 55, 40, 70, 75, 60, 90, 85].map((val, idx) => (
                            <div key={idx} className="w-full flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full relative h-48 flex items-end justify-center">
                                    <div
                                        className="w-full max-w-[30px] bg-blue-500 rounded-t-md opacity-80 group-hover:opacity-100 transition-all duration-300"
                                        style={{ height: `${val}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">{'JFMAMJJASOND'[idx]}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card title="Recent Activity" className="border-0 shadow-sm ring-1 ring-gray-200 h-full">
                    <div className="space-y-0 divide-y divide-gray-100 mt-2">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start py-4 first:pt-0 last:pb-0">
                                <div className="mr-3 mt-0.5">
                                    {activity.status === 'success' && <CheckCircle className="text-green-500" size={16} />}
                                    {activity.status === 'warning' && <TrendingUp className="text-orange-500" size={16} />}
                                    {activity.status === 'error' && <AlertCircle className="text-red-500" size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                                    <div className="flex items-center mt-1">
                                        <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-600 font-bold mr-2">
                                            {activity.user.charAt(0)}
                                        </div>
                                        <p className="text-xs text-gray-500">by {activity.user} • {activity.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {recentActivity.length === 0 && (
                            <p className="text-center text-gray-500 py-4">No recent activity.</p>
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 text-center">
                        <Button variant="ghost" size="sm" className="w-full text-blue-600">View All Activity</Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};
