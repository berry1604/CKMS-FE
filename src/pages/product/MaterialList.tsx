import { useEffect, useState } from 'react';
import { Plus, Filter, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { materialService, type Material } from '../../services/mock/material.mock';
import { MaterialModal } from './MaterialModal';

export const MaterialList = () => {
    const navigate = useNavigate();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = () => {
        setIsLoading(true);
        materialService.getMaterials()
            .then(res => setMaterials(res.data))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        setEditingMaterial(null);
        setIsModalOpen(true);
    };

    const handleEdit = (material: Material) => {
        setEditingMaterial(material);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this material?')) return;
        setIsLoading(true);
        try {
            await materialService.deleteMaterial(id);
            fetchData();
        } catch (error) {
            alert('Failed to delete material');
            setIsLoading(false);
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            if (editingMaterial) {
                await materialService.updateMaterial(editingMaterial.id, data);
            } else {
                await materialService.createMaterial(data);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            alert('Failed to save material');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns: Column<Material>[] = [
        {
            header: 'Item',
            cell: (row) => (
                <div>
                    <div className="font-medium text-gray-900">{row.name}</div>
                    <div className="text-xs text-gray-400">{row.sku}</div>
                </div>
            )
        },
        {
            header: 'Category',
            accessorKey: 'category'
        },
        {
            header: 'Stock',
            cell: (row) => (
                <div className="flex items-center space-x-2">
                    <span className={row.stock <= row.minStockLevel ? 'text-red-600 font-bold' : ''}>
                        {row.stock} {row.unit}
                    </span>
                    {row.stock <= row.minStockLevel && (
                        <AlertTriangle size={14} className="text-red-500" />
                    )}
                </div>
            )
        },
        {
            header: 'Cost',
            cell: (row) => `$${row.cost.toFixed(2)}`
        },
        {
            header: 'Supplier',
            accessorKey: 'supplier'
        },
        {
            header: 'Status',
            cell: (row) => (
                <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
                    {row.status.toUpperCase()}
                </Badge>
            )
        },
        {
            header: 'Actions',
            cell: (row) => (
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 p-1 h-auto"
                        onClick={() => handleEdit(row)}
                    >
                        <Edit size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 p-1 h-auto"
                        onClick={() => handleDelete(row.id)}
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Material Management</h1>
                <div className="flex space-x-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                            placeholder="Search materials..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">
                        <Filter size={16} className="mr-2" /> Filter
                    </Button>
                    <Button
                        variant="secondary"
                        className="bg-red-50 text-red-600 hover:bg-red-100 hidden sm:flex"
                        onClick={() => navigate('/products/beefsteak-materials')}
                    >
                        Ví dụ: Món Bò Bít Tết
                    </Button>
                    <Button onClick={handleCreate}>
                        <Plus size={16} className="mr-2" /> Add Material
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredMaterials}
                isLoading={isLoading}
                keyExtractor={(item) => item.id}
            />

            <MaterialModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingMaterial}
                isLoading={isSaving}
            />
        </div>
    );
};
