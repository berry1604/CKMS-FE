import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, ShoppingCart, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { StoreResponse } from '../../types/store';
import { storeApi } from '../../services/store.api';
import { StoreInventory } from './StoreInventory';
import { toast } from 'react-hot-toast';

export const StoreDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [store, setStore] = useState<StoreResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');

    useEffect(() => {
        if (id) {
            const loadStore = async () => {
                setIsLoading(true);
                try {
                    const response = await storeApi.getStoreById(Number(id));
                    setStore(response.data);
                } catch (error) {
                    console.error(error);
                    toast.error('Không thể tải thông tin cửa hàng');
                } finally {
                    setIsLoading(false);
                }
            };
            loadStore();
        }
    }, [id]);

    if (isLoading) return <div className="p-8 text-center text-gray-400">Loading Store Details...</div>;
    if (!store) return (
        <div className="p-8 text-center text-gray-400">
            <p>Store not found.</p>
            <Button variant="ghost" className="mt-4" onClick={() => navigate('/stores')}>
                <ArrowLeft size={16} className="mr-2" /> Back to Stores
            </Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/stores')}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200">{store.name}</h1>
                    <div className="flex items-center text-gray-400 text-sm mt-1">
                        <MapPin size={14} className="mr-1" /> {store.address}
                    </div>
                </div>
                <Badge variant={store.isActive ? 'success' : 'secondary'} className="ml-auto">
                    {store.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Contact Info">
                    <div className="space-y-3">
                        <p className="font-medium text-gray-200">{store.managerName || 'No manager assigned'}</p>
                        <div className="flex items-center text-gray-400 text-sm">
                            <Phone size={14} className="mr-2" /> {store.phone || 'N/A'}
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                            <Mail size={14} className="mr-2" /> {store.email || 'N/A'}
                        </div>
                    </div>
                </Card>

                <Card title="Store Info">
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-400">Store ID</p>
                            <p className="text-lg font-bold text-gray-200">#{store.id || store.storeId}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Created At</p>
                            <p className="text-sm text-gray-200">
                                {store.createdAt ? new Date(store.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </p>
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
                    <StoreInventory />
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
