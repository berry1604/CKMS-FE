import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { materialApi } from '../../services/material.api';
import type { MaterialResponse } from '../../types/material';
import toast from 'react-hot-toast';

export const MaterialList = () => {
    const [materials, setMaterials] = useState<MaterialResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await materialApi.getAll();
            setMaterials(data);
        } catch (error) {
            console.error('Failed to fetch materials:', error);
            toast.error('Failed to load materials');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        navigate('/products/materials/create');
    };

    const handleEdit = (material: MaterialResponse) => {
        navigate(`/products/materials/${material.id}/edit`, { state: { material } });
    };

    const handleDelete = async (_id: number) => {
        toast.error('Delete functionality is not implemented on Backend yet.');
    };



    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns: Column<MaterialResponse>[] = [
        {
            header: 'ID',
            accessorKey: 'id',
        },
        {
            header: 'Material Name',
            cell: (row) => <div className="font-medium text-gray-200">{row.name}</div>
        },
        {
            header: 'Unit',
            accessorKey: 'unit'
        },
        {
            header: 'Status',
            cell: (row) => (
                <Badge variant={row.isActive ? 'success' : 'secondary'}>
                    {row.isActive ? 'ACTIVE' : 'INACTIVE'}
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
                        className="text-amber-600 hover:text-amber-500 p-1 h-auto"
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
                <h1 className="text-2xl font-bold text-gray-200">Material Management</h1>
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
                    <Button onClick={handleCreate}>
                        <Plus size={16} className="mr-2" /> Add Material
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredMaterials}
                isLoading={isLoading}
                keyExtractor={(item) => item.id.toString()}
            />
        </div>
    );
};
