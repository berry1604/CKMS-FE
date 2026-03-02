import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Tag, AlertCircle, Activity, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { categoryApi } from '../../services/category.api';
import type { CategoryResponse } from '../../types/category';

const createCategorySchema = z.object({
    categoryId: z.string().min(1, 'Category ID is required').trim(),
    name: z.string().min(1, 'Category name is required').trim(),
    description: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE'])
});

type CreateCategoryFormData = z.infer<typeof createCategorySchema>;

export const CreateCategoryPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [backendError, setBackendError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid }
    } = useForm<CreateCategoryFormData>({
        resolver: zodResolver(createCategorySchema),
        mode: 'onChange',
        defaultValues: {
            categoryId: '',
            name: '',
            description: '',
            status: 'ACTIVE'
        }
    });

    const location = useLocation();
    const categoryFromState = (location.state as any)?.category as CategoryResponse | undefined;

    useEffect(() => {
        const fetchCategory = async () => {
            if (!isEditMode) return;

            // If we got category data from route state, use it directly
            if (categoryFromState) {
                reset({
                    categoryId: categoryFromState.categoryId || String(categoryFromState.id),
                    name: categoryFromState.name,
                    description: categoryFromState.description || '',
                    status: (categoryFromState.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE'
                });
                setIsLoading(false);
                return;
            }

            // Fallback: fetch from API
            try {
                const data = await categoryApi.getById(Number(id));
                reset({
                    categoryId: data.categoryId || String(data.id),
                    name: data.name,
                    description: data.description || '',
                    status: (data.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE'
                });
            } catch (error) {
                console.error('Failed to fetch category details:', error);
                toast.error('Failed to load category data');
                navigate('/products/categories');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategory();
    }, [id, isEditMode, reset, navigate, categoryFromState]);

    const onSubmit = async (data: CreateCategoryFormData) => {
        setBackendError(null);
        setIsSubmitting(true);
        try {
            if (isEditMode) {
                await categoryApi.update(Number(id), data);
                toast.success('Category updated successfully');
            } else {
                await categoryApi.create(data);
                toast.success('Category created successfully');
            }
            navigate('/products/categories');
        } catch (error: any) {
            console.error('Create category error:', error);
            const message = error.response?.data?.message || 'Failed to create category. Please try again.';
            setBackendError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/products/categories')}
                    className="hover:bg-zinc-800/80 rounded-full p-2 h-auto"
                >
                    <ArrowLeft size={20} className="text-gray-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-2">
                        <Tag size={24} className="text-amber-600" />
                        {isEditMode ? 'Edit Category' : 'Create Category'}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {isEditMode ? 'Update the details of the existing category.' : 'Add a new category for products or materials.'}
                    </p>
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
                                <label className="text-sm font-medium text-gray-300 block">Category ID *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Tag size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.categoryId ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                        placeholder="e.g. CAT-001"
                                        disabled={isEditMode}
                                        {...register('categoryId')}
                                    />
                                </div>
                                {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Category Name *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Tag size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.name ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                        placeholder="e.g. Beverages"
                                        {...register('name')}
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Status *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Activity size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-zinc-900/50 ${errors.status ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                        {...register('status')}
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </div>
                                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <label className="text-sm font-medium text-gray-300 block flex items-center gap-2">
                                    <FileText size={16} className="text-gray-400" />
                                    Description
                                </label>
                                <textarea
                                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none h-24 mt-1 ${errors.description ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                    placeholder="Enter category description"
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
                            onClick={() => navigate('/products/categories')}
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
                                    Creating...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save size={18} />
                                    {isEditMode ? 'Update Category' : 'Create Category'}
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
