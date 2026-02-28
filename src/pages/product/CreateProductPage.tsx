import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Package, Tag, AlertCircle, DollarSign, Box } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { productApi } from '../../services/product.api';
import { categoryApi } from '../../services/category.api';
import { useProducts } from '../../hooks/useProducts';
import type { CategoryResponse } from '../../types/category';

const createProductSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    categoryId: z.number().min(1, 'Category ID is required'),
    price: z.number().min(0, 'Price must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    description: z.string().optional()
});

type CreateProductFormData = z.infer<typeof createProductSchema>;

export const CreateProductPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);
    const { refetch } = useProducts(10); // Optional, we can just navigate, but refetching is good

    // Fetch categories for dropdown
    const [categories, setCategories] = useState<CategoryResponse[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryApi.getAll();
                // Filter only active categories if backend supports it, else just map
                setCategories(data);
            } catch (error) {
                console.error('Failed to load categories', error);
                toast.error('Failed to load categories for selection');
            }
        };
        fetchCategories();
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset
    } = useForm<CreateProductFormData>({
        resolver: zodResolver(createProductSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            categoryId: 0, // Will force user to select one
            price: 0,
            unit: 'KG',
            description: ''
        }
    });

    const onSubmit = async (data: CreateProductFormData) => {
        if (!data.categoryId || data.categoryId === 0) {
            toast.error("Vui lòng chọn Category!");
            return;
        }

        setBackendError(null);
        setIsSubmitting(true);
        try {
            await productApi.createProduct(data);
            toast.success('Product created successfully');
            reset();
            refetch(); // Trigger a refetch in cache if using a global store or context
            navigate('/products');
        } catch (error: any) {
            console.error('Create product error:', error);
            const message = error.response?.data?.message || 'Failed to create product. Please try again.';
            setBackendError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/products')}
                    className="hover:bg-zinc-800/80 rounded-full p-2 h-auto"
                >
                    <ArrowLeft size={20} className="text-gray-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-2">
                        <Package size={24} className="text-amber-600" />
                        Add New Product
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Create a new product record in the catalog.</p>
                </div>
            </div>

            <Card className="p-6 md:p-8 border-0 shadow-sm ring-1 ring-zinc-700 bg-zinc-900/50">
                {backendError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
                        <div className="mt-0.5">
                            <AlertCircle size={18} className="text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Action Failed</h3>
                            <p className="text-sm">{backendError}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Product Name *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Package size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.name ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                        placeholder="e.g. Signature Coffee"
                                        {...register('name')}
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Category *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Tag size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-zinc-900/50 ${errors.categoryId ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                        {...register('categoryId', { valueAsNumber: true })}
                                    >
                                        <option value={0} disabled>-- Select Category --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.categoryId ? `[${cat.categoryId}] ${cat.name}` : cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Selling Price *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.price ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                        placeholder="0.00"
                                        {...register('price', { valueAsNumber: true })}
                                    />
                                </div>
                                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Unit *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Box size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.unit ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                        {...register('unit')}
                                    >
                                        <option value="KG">KG</option>
                                        <option value="GRAM">GRAM</option>
                                        <option value="LITER">LITER</option>
                                        <option value="ML">ML</option>
                                        <option value="PIECE">PIECE</option>
                                        <option value="BOTTLE">BOTTLE</option>
                                        <option value="BOX">BOX</option>
                                    </select>
                                </div>
                                {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit.message}</p>}
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <label className="text-sm font-medium text-gray-300 block">Description</label>
                                <textarea
                                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.description ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                    placeholder="e.g. A rich and smooth coffee blend"
                                    rows={3}
                                    {...register('description')}
                                />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/products')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-amber-600 hover:bg-blue-700 text-white min-w-[140px]"
                            disabled={isSubmitting || !isValid}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save size={18} />
                                    Add Product
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
