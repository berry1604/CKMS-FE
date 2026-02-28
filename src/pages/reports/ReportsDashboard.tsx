import { useEffect, useState } from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Store } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
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
                // Placeholder for actual reporting APIs
                setSalesData([]);
                setTopStores([]);
                setTopProducts([]);
            } catch (error) {
                console.error("Failed to load report data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // Calculate totals for KPI cards
    const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
    const totalProfit = salesData.reduce((sum, item) => sum + item.profit, 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Simple Bar Chart Component
    const RevenueChart = ({ data }: { data: SalesData[] }) => {
        const maxVal = Math.max(...data.map(d => d.revenue));
        return (
            <div className="flex items-end justify-between h-48 gap-2 mt-4 px-2">
                {data.map((item) => (
                    <div key={item.month} className="flex flex-col items-center gap-2 group w-full">
                        <div className="relative w-full flex justify-center items-end h-full">
                            <div
                                className="w-full max-w-[40px] bg-amber-500 rounded-t-sm hover:bg-amber-600 transition-all relative group-hover:shadow-lg"
                                style={{ height: `${(item.revenue / maxVal) * 100}%` }}
                            >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    Rev: ${item.revenue.toLocaleString()}
                                    <br />
                                    Exp: ${item.expenses.toLocaleString()}
                                </div>
                            </div>
                            <div
                                className="absolute bottom-0 w-full max-w-[40px] bg-blue-200 rounded-t-sm z-0"
                                style={{ height: `${(item.expenses / maxVal) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-400">{item.month}</span>
                    </div>
                ))}
            </div>
        );
    };

    if (isLoading) {
        return <div className="p-12 text-center text-gray-400">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Analytics Dashboard</h1>
                    <p className="text-sm text-gray-400 mt-1">Performance metrics and financial overview.</p>
                </div>
                <Button variant="outline" className="shrink-0">
                    <Download className="mr-2 h-4 w-4" /> Export Report
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm ring-1 ring-zinc-800 p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Total Revenue (6M)</p>
                            <h3 className="text-2xl font-bold text-gray-200 mt-1">${totalRevenue.toLocaleString()}</h3>
                            <div className="flex items-center mt-1 text-green-600 text-xs font-medium">
                                <TrendingUp size={14} className="mr-1" /> +12.5% vs last period
                            </div>
                        </div>
                        <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="border-0 shadow-sm ring-1 ring-zinc-800 p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Net Profit</p>
                            <h3 className="text-2xl font-bold text-gray-200 mt-1">${totalProfit.toLocaleString()}</h3>
                            <div className="flex items-center mt-1 text-green-600 text-xs font-medium">
                                <TrendingUp size={14} className="mr-1" /> {profitMargin.toFixed(1)}% Margin
                            </div>
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <ShoppingBag size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="border-0 shadow-sm ring-1 ring-zinc-800 p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Active Stores</p>
                            <h3 className="text-2xl font-bold text-gray-200 mt-1">{topStores.length}</h3>
                            <div className="flex items-center mt-1 text-gray-400 text-xs font-medium">
                                2 New this month
                            </div>
                        </div>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Store size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="border-0 shadow-sm ring-1 ring-zinc-800 p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Total Products</p>
                            <h3 className="text-2xl font-bold text-gray-200 mt-1">{topProducts.length}</h3>
                            <div className="flex items-center mt-1 text-amber-600 text-xs font-medium">
                                Top 5 performers shown
                            </div>
                        </div>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Users size={20} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts & Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card title="Revenue vs Expenses" className="shadow-sm border-zinc-700 h-full">
                        <div className="mt-4">
                            <RevenueChart data={salesData} />
                            <div className="flex justify-center gap-6 mt-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
                                    <span className="text-sm text-gray-400">Revenue</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
                                    <span className="text-sm text-gray-400">Expenses</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
                <div>
                    <Card title="Top Performing Stores" className="shadow-sm border-zinc-700 h-full">
                        <div className="space-y-5 mt-2">
                            {topStores.map((store, idx) => (
                                <div key={store.storeName}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-200">{idx + 1}. {store.storeName}</span>
                                        <span className="font-bold text-gray-200">${(store.revenue / 1000).toFixed(0)}k</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-amber-600 h-2 rounded-full"
                                            style={{ width: `${(store.revenue / 500000) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>{store.orders} orders</span>
                                        <span className="flex items-center text-yellow-600">★ {store.rating}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Top Products Table */}
            <Card title="Product Performance" className="shadow-sm border-zinc-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-800">
                        <thead>
                            <tr className="text-left">
                                <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Product Name</th>
                                <th className="pb-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Units Sold</th>
                                <th className="pb-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Growth</th>
                                <th className="pb-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {topProducts.map((product) => (
                                <tr key={product.name}>
                                    <td className="py-3 text-sm font-medium text-gray-200">{product.name}</td>
                                    <td className="py-3 text-sm text-gray-400 text-right">{product.sales.toLocaleString()}</td>
                                    <td className="py-3 text-sm text-right">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${product.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {product.growth > 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                                            {Math.abs(product.growth)}%
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <div className="flex justify-end">
                                            <div className={`w-2 h-2 rounded-full ${product.growth > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
