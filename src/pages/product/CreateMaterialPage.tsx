import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Package, AlertCircle, RefreshCw, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { materialApi } from '../../services/material.api';

const createMaterialSchema = z.object({
    name: z.string().min(1, 'Material name is required').trim(),
    unit: z.enum(['KG', 'G', 'L', 'ML', 'PCS', 'BOX', 'PACK']),
    minStockLevel: z.number().min(0, 'Min stock cannot be negative'),
});

type CreateMaterialFormData = z.infer<typeof createMaterialSchema>;

export const CreateMaterialPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid }
    } = useForm<CreateMaterialFormData>({
        resolver: zodResolver(createMaterialSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            unit: 'KG',
            minStockLevel: 0,
        }
    });

    const onSubmit = async (data: CreateMaterialFormData) => {
        setBackendError(null);
        setIsSubmitting(true);
        try {
            await materialApi.create(data);
            toast.success('Material created successfully!');
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

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/products/materials')}
                    className="hover:bg-gray-100 rounded-full p-2 h-auto"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Package size={24} className="text-blue-600" />
                        Add New Material
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Register a new raw material for inventory tracking.</p>
                </div>
            </div>

            <Card className="p-6 md:p-8 border-0 shadow-sm ring-1 ring-gray-200 bg-white">
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
                                <label className="text-sm font-medium text-gray-700 block">Material Name *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Package size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.name ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-blue-500'}`}
                                        placeholder="e.g. Raw Beef"
                                        {...register('name')}
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 block">Unit *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <RefreshCw size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white ${errors.unit ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-blue-500'}`}
                                        {...register('unit')}
                                    >
                                        <option value="KG">Kilogram (KG)</option>
                                        <option value="G">Gram (G)</option>
                                        <option value="L">Liter (L)</option>
                                        <option value="ML">Milliliter (ML)</option>
                                        <option value="PCS">Pieces (PCS)</option>
                                        <option value="BOX">Box</option>
                                        <option value="PACK">Pack</option>
                                    </select>
                                </div>
                                {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 block">Min Stock Level *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.minStockLevel ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-blue-500'}`}
                                        placeholder="0"
                                        {...register('minStockLevel', { valueAsNumber: true })}
                                    />
                                </div>
                                {errors.minStockLevel && <p className="text-red-500 text-xs mt-1">{errors.minStockLevel.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
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
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
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
                                    Create Material
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
