import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, ShoppingCart, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { type Store } from './StoreList';
import { StoreInventory } from './StoreInventory';

export const StoreDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [store, setStore] = useState<Store | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');

    useEffect(() => {
        if (id) {
            // Placeholder for GET /stores/:id API
            setStore(null);
            setIsLoading(false);
        }
    }, [id, navigate]);

    if (isLoading) return <div className="p-8 text-center text-gray-400">Loading Store Details...</div>;
    if (!store) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/stores')}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200">{store.name}</h1>
                    <div className="flex items-center text-gray-400 text-sm mt-1">
                        <MapPin size={14} className="mr-1" /> {store.location}
                    </div>
                </div>
                <Badge variant={store.status === 'active' ? 'success' : 'secondary'} className="ml-auto">
                    {store.status.toUpperCase()}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Contact Info">
                    <div className="space-y-3">
                        <p className="font-medium text-gray-200">{store.manager}</p>
                        <div className="flex items-center text-gray-400 text-sm">
                            <Phone size={14} className="mr-2" /> (555) 123-4567
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                            <Mail size={14} className="mr-2" /> store@{store.id}.franchise.com
                        </div>
                    </div>
                </Card>

                <Card title="Performance">
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-400">Current Revenue</p>
                            <p className="text-2xl font-bold text-gray-200">${store.revenue.toLocaleString()}</p>
                        </div>

                        {/* Mock Progress Bar */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span>Monthly Target</span>
                                <span>75%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-amber-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Quick Actions">
                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full justify-start hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
                            onClick={() => navigate('/orders/create')}
                        >
                            <ShoppingCart size={16} className="mr-2" /> Create Order
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
                            onClick={() => setActiveTab('Inventory')}
                        >
                            <Box size={16} className="mr-2" /> View Inventory
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Tabs */}
            <div className="border-b border-zinc-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {['Overview', 'Inventory', 'Orders', 'Staff', 'Settings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab
                                ? 'border-amber-500 text-amber-600'
                                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="min-h-[300px]">
                {activeTab === 'Overview' && (
                    <div className="h-64 bg-zinc-900/80 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center text-gray-400">
                        Overview Dashboard Coming Soon
                    </div>
                )}
                {activeTab === 'Inventory' && (
                    <StoreInventory storeId={store.id} />
                )}
                {activeTab === 'Orders' && (
                    <div className="h-64 bg-zinc-900/80 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center text-gray-400">
                        Orders List Coming Soon
                    </div>
                )}
                {activeTab === 'Staff' && (
                    <div className="h-64 bg-zinc-900/80 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center text-gray-400">
                        Staff List Coming Soon
                    </div>
                )}
                {activeTab === 'Settings' && (
                    <div className="h-64 bg-zinc-900/80 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center text-gray-400">
                        Store Settings Coming Soon
                    </div>
                )}
            </div>
        </div>
    );
};
