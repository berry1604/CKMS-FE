import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Package, Tag, Edit2, Trash2, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { productApi } from '../../services/product.api';
import type { ProductResponse as Product } from '../../types/product';
import { ProductModal } from './ProductModal';
import { useProducts } from '../../hooks/useProducts';
import toast from 'react-hot-toast';

export const ProductCatalog = () => {
    const navigate = useNavigate();
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Custom Web Hook
    const {
        products,
        pageableInfo,
        isLoading,
        page,
        setPage,
        setSearch,
        refetch
    } = useProducts(10);

    // Use a local state for input delay (debounce)
    const [localSearch, setLocalSearch] = useState('');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearch(localSearch);
            setPage(0); // Reset to page 0 on search
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [localSearch, setSearch, setPage]);

    const handleCreate = () => {
        navigate('/products/create');
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await productApi.deleteProduct(id);
            toast.success('Product deleted successfully');
            refetch();
        } catch (error: any) {
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                toast.error(error.response?.data?.message || 'Failed to delete product');
            }
        }
    };

    const handleSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            if (editingProduct) {
                await productApi.updateProduct(editingProduct.id, data);
            } else {
                await productApi.createProduct(data);
            }
            setIsModalOpen(false);
            refetch();
            toast.success('Product saved successfully');
        } catch (error: any) {
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                toast.error(error.response?.data?.message || 'Failed to save product');
            }
        } finally {
            setIsSaving(false);
        }
    };


    // Desktop Columns
    const columns: Column<Product>[] = [
        {
            header: 'Product',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                        {row.imageUrl ? (
                            <img src={row.imageUrl} alt={row.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                                <Package size={16} />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{row.name}</div>
                        <div className="text-xs text-gray-500 font-mono">ID: {row.id}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Category',
            accessorKey: 'category',
            cell: (row) => (
                <div className="flex items-center gap-1.5 text-gray-600">
                    <Tag size={14} />
                    <span>{row.category?.name || 'Uncategorized'}</span>
                </div>
            )
        },
        {
            header: 'Price / Unit',
            cell: (row) => (
                <div>
                    <span className="font-medium text-gray-900">${row.price.toLocaleString()}</span>
                    <span className="text-gray-500 text-sm ml-1">/ {row.unit}</span>
                </div>
            )
        },
        {
            header: 'Status',
            accessorKey: 'isActive',
            cell: (row) => (
                <Badge variant={row.isActive ? 'success' : 'secondary'} className="flex items-center w-max gap-1">
                    {row.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {row.isActive ? 'Active' : 'Inactive'}
                </Badge>
            )
        },
        {
            header: 'Actions',
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-700">
                        <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 size={16} />
                    </Button>
                </div>
            )
        }
    ];


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product Catalog</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your product inventory and pricing.</p>
                </div>
                <Button onClick={handleCreate} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                    <Plus size={18} className="mr-2" /> Add Product
                </Button>
            </div>

            {/* Toolbar */}
            <Card className="border-0 shadow-sm ring-1 ring-gray-200 overflow-hidden">
                <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-gray-100 bg-white">
                    <div className="relative w-full md:w-96">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search products by name..."
                            className="pl-10 w-full"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop View */}
                <div className="hidden md:block">
                    <DataTable
                        data={products}
                        columns={columns}
                        isLoading={isLoading}
                        keyExtractor={item => item.id}
                    />
                </div>

                {/* Pagination Controls */}
                {pageableInfo && pageableInfo.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 border-t border-gray-100">
                        <div className="text-sm text-gray-500 mb-4 sm:mb-0">
                            Showing page <span className="font-medium">{page + 1}</span> of <span className="font-medium">{pageableInfo.totalPages}</span> ({pageableInfo.totalElements} items)
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={pageableInfo.first || isLoading}
                            >
                                <ChevronLeft size={16} /> Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={pageableInfo.last || isLoading}
                            >
                                Next <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Mobile View (Grid of Cards) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden flex flex-col shadow-sm border-gray-200">
                        <div className="p-4 flex gap-4">
                            <div className="h-20 w-20 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                        <Package size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-gray-900 truncate pr-2">{product.name}</h3>
                                    <Badge variant={product.isActive ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                                        {product.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">Cat: {product.category?.name || 'Uncategorized'}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="font-bold text-gray-900 text-lg">${product.price.toLocaleString()} <span className="text-xs text-gray-500 font-normal">/ {product.unit}</span></span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-end gap-3">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(product)} className="flex-1">
                                Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)} className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                Delete
                            </Button>
                        </div>
                    </Card>
                ))}
                {!isLoading && products.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                        No products found.
                    </div>
                )}
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingProduct}
                isLoading={isSaving}
            />
        </div>
    );
};
