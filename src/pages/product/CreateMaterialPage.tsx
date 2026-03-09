import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Package, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { materialApi } from '../../services/material.api';
import type { MaterialResponse } from '../../types/material';

const createMaterialSchema = z.object({
    name: z.string().min(1, 'Material name is required').trim(),
    unit: z.enum(['KG', 'GRAM', 'LITER', 'ML', 'PIECE']),
});

type CreateMaterialFormData = z.infer<typeof createMaterialSchema>;

export const CreateMaterialPage = () => {
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
    } = useForm<CreateMaterialFormData>({
        resolver: zodResolver(createMaterialSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            unit: 'KG',
        }
    });

    const location = useLocation();
    const materialFromState = (location.state as any)?.material as MaterialResponse | undefined;

    useEffect(() => {
        const fetchMaterial = async () => {
            if (!isEditMode) return;

            if (materialFromState) {
                reset({
                    name: materialFromState.name,
                    unit: materialFromState.unit as any,
                });
                setIsLoading(false);
                return;
            }

            try {
                const data = await materialApi.getById(Number(id));
                reset({
                    name: data.name,
                    unit: data.unit as any,
                });
            } catch (error) {
                console.error('Failed to fetch material details:', error);
                toast.error('Failed to load material data');
                navigate('/products/materials');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMaterial();
    }, [id, isEditMode, reset, navigate, materialFromState]);

    const onSubmit = async (data: CreateMaterialFormData) => {
        setBackendError(null);
        setIsSubmitting(true);
        try {
            if (isEditMode) {
                await materialApi.update(Number(id), data);
                toast.success('Material updated successfully!');
            } else {
                await materialApi.create(data);
                toast.success('Material created successfully!');
            }
            navigate('/products/materials');
        } catch (error: any) {
            console.error('Create material error:', error);
            const message = error.response?.data?.message || 'Failed to create material. Please try again.';
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
                    onClick={() => navigate('/products/materials')}
                    className="hover:bg-zinc-800/80 rounded-full p-2 h-auto"
                >
                    <ArrowLeft size={20} className="text-gray-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-2">
                        <Package size={24} className="text-amber-600" />
                        {isEditMode ? 'Edit Material' : 'Add New Material'}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {isEditMode ? 'Update the details of the existing material.' : 'Register a new raw material for inventory tracking.'}
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
                                <label className="text-sm font-medium text-gray-300 block">Material Name *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Package size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.name ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                        placeholder="e.g. Raw Beef"
                                        {...register('name')}
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Unit *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <RefreshCw size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-zinc-900/50 ${errors.unit ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                        {...register('unit')}
                                    >
                                        <option value="KG">Kilogram (KG)</option>
                                        <option value="GRAM">Gram (GRAM)</option>
                                        <option value="LITER">Liter (LITER)</option>
                                        <option value="ML">Milliliter (ML)</option>
                                        <option value="PIECE">Pieces (PIECE)</option>
                                    </select>
                                </div>
                                {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit.message}</p>}
                            </div>

                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/products/materials')}
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
                                    {isEditMode ? 'Update Material' : 'Create Material'}
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div >
    );
};
