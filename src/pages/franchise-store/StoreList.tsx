import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Store as StoreIcon, Edit2, Trash2, ChevronRight, User, MapPin, DollarSign, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
export interface Store {
    id: string;
    name: string;
    location: string;
    manager: string;
    revenue: number;
    status: 'active' | 'inactive' | 'pending';
    inventoryStatus: 'good' | 'warning' | 'critical';
}
import { StoreModal } from './StoreModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const StoreList = () => {
    const navigate = useNavigate();
    const [stores, setStores] = useState<Store[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive' | 'pending'>('ALL');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<Store | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteStoreId, setDeleteStoreId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadStores = async () => {
        setIsLoading(true);
        try {
            // Placeholder for GET /stores API
            setStores([]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStores();
    }, []);

    const filteredStores = stores.filter(store => {
        const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            store.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            store.manager.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || store.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCreate = () => {
        navigate('/stores/create');
    };

    const handleEdit = (store: Store) => {
        setEditingStore(store);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteStoreId(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteStoreId) return;
        setIsDeleting(true);
        try {
            // Placeholder: Call actual DELETE API here
            setIsDeleteModalOpen(false);
            loadStores();
        } catch (error) {
            alert('Failed to delete store');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (_data: any) => {
        setIsSaving(true);
        try {
            // Placeholder: Call actual POST/PUT API here
            if (editingStore) {
                // await updateStore(editingStore.id, data);
            } else {
                // await createStore(data);
            }
            setIsModalOpen(false);
            loadStores();
        } catch (error) {
            alert('Failed to save store');
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusVariant = (status: string) => {
        const colors: Record<string, any> = {
            active: 'success',
            inactive: 'secondary',
            pending: 'warning'
        };
        return colors[status] || 'default';
    };

    const getInventoryVariant = (status: string) => {
        const colors: Record<string, any> = {
            good: 'success',
            warning: 'warning',
            critical: 'danger'
        };
        return colors[status] || 'default';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Franchise Stores</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage store locations and performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-700 text-sm font-medium text-gray-400 shadow-sm">
                        <span className="text-gray-200 font-bold">{stores.length}</span> Total Stores
                    </div>
                    <Button onClick={handleCreate} className="shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Register New Store
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search store, location, or manager..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Filter size={16} className="text-gray-400 hidden md:block" />
                        <span className="text-sm text-gray-400 whitespace-nowrap hidden md:block">Filter by Status:</span>
                        {(['ALL', 'active', 'pending', 'inactive'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize whitespace-nowrap ${statusFilter === status
                                    ? 'bg-amber-500/20 text-amber-500'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    }`}
                            >
                                {status === 'ALL' ? 'All Stores' : status}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Card className="overflow-hidden shadow-sm border-zinc-700 p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-900/80/50 border-b border-zinc-800 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Store Name</th>
                                    <th className="px-6 py-4">Manager</th>
                                    <th className="px-6 py-4">Revenue</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Inventory</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mb-2"></div>
                                                Loading stores...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStores.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            No stores found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStores.map((store) => (
                                        <tr
                                            key={store.id}
                                            className="hover:bg-amber-500/10/30 transition-colors group cursor-pointer"
                                            onClick={() => navigate(`/stores/${store.id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="bg-amber-500/10 p-2 rounded-lg mr-3 text-amber-600">
                                                        <StoreIcon size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-200 group-hover:text-amber-600 transition-colors">{store.name}</div>
                                                        <div className="text-gray-400 text-xs flex items-center mt-0.5">
                                                            <MapPin size={10} className="mr-1" />
                                                            {store.location}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm text-gray-300">
                                                    <User size={14} className="mr-2 text-gray-400" />
                                                    {store.manager}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm font-medium text-gray-200">
                                                    <DollarSign size={14} className="mr-1 text-gray-400" />
                                                    {store.revenue.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={getStatusVariant(store.status)} className="shadow-sm">
                                                    {store.status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={getInventoryVariant(store.inventoryStatus)} className="shadow-sm">
                                                    {store.inventoryStatus.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(store)}
                                                        className="h-8 w-8 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-500/10"
                                                    >
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(store.id)}
                                                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-gray-400"
                                                    >
                                                        <ChevronRight size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Mobile Grid View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">Loading...</div>
                ) : filteredStores.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">No stores found.</div>
                ) : (
                    filteredStores.map((store) => (
                        <Card
                            key={store.id}
                            className="p-4 relative active:scale-[0.99] transition-transform"
                            onClick={() => navigate(`/stores/${store.id}`)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-amber-500/20 p-2 rounded-lg text-amber-600">
                                        <StoreIcon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-200">{store.name}</h3>
                                        <div className="text-xs text-gray-400 flex items-center">
                                            <MapPin size={10} className="mr-1" />
                                            {store.location}
                                        </div>
                                    </div>
                                </div>
                                <Badge variant={getStatusVariant(store.status)} className="shadow-none">
                                    {store.status.toUpperCase()}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                                    <div className="text-xs text-gray-400 mb-1 flex items-center">
                                        <User size={10} className="mr-1" /> Manager
                                    </div>
                                    <div className="text-sm font-medium text-gray-200 truncate">{store.manager}</div>
                                </div>
                                <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                                    <div className="text-xs text-gray-400 mb-1 flex items-center">
                                        <DollarSign size={10} className="mr-1" /> Revenue
                                    </div>
                                    <div className="text-sm font-medium text-gray-200">${store.revenue.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <Package size={14} className="text-gray-400" />
                                    <Badge variant={getInventoryVariant(store.inventoryStatus)} size="sm">
                                        {store.inventoryStatus.replace('_', ' ')} Inventory
                                    </Badge>
                                </div>
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => handleEdit(store)}
                                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-500/10 rounded-full"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(store.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <StoreModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingStore}
                isLoading={isSaving}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Store"
                message="Are you sure you want to delete this store? This action cannot be undone."
                confirmText="Delete Store"
                cancelText="Cancel"
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
};
