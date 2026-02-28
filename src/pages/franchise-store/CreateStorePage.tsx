import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Store as StoreIcon, MapPin, User, Activity, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const createStoreSchema = z.object({
    name: z.string().min(1, 'Store Name is required'),
    location: z.string().min(1, 'Location is required'),
    manager: z.string().min(1, 'Manager Name is required'),
    status: z.enum(['active', 'inactive', 'pending'])
});

type CreateStoreFormData = z.infer<typeof createStoreSchema>;

export const CreateStorePage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset
    } = useForm<CreateStoreFormData>({
        resolver: zodResolver(createStoreSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            location: '',
            manager: '',
            status: 'pending'
        }
    });

    const onSubmit = async (data: CreateStoreFormData) => {
        console.log('Creating store with data:', data);
        setBackendError(null);
        setIsSubmitting(true);
        try {
            // Placeholder: Call actual API here
            // await storeService.createStore(data);

            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast.success('Store created successfully');
            reset();
            navigate('/stores');
        } catch (error: any) {
            console.error('Create store error:', error);
            const message = error.response?.data?.message || 'Failed to create store. Please try again.';
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
                    onClick={() => navigate('/stores')}
                    className="hover:bg-zinc-800/80 rounded-full p-2 h-auto"
                >
                    <ArrowLeft size={20} className="text-gray-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-2">
                        <StoreIcon size={24} className="text-amber-600" />
                        Register New Store
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Register a new franchise location and assign its manager.</p>
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
                                <label className="text-sm font-medium text-gray-300 block">Store Name *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <StoreIcon size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.name ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                        placeholder="e.g. Downtown Branch"
                                        {...register('name')}
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Location *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.location ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                        placeholder="e.g. 123 Main St, NY"
                                        {...register('location')}
                                    />
                                </div>
                                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Manager Name *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.manager ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                        placeholder="e.g. John Doe"
                                        {...register('manager')}
                                    />
                                </div>
                                {errors.manager && <p className="text-red-500 text-xs mt-1">{errors.manager.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Operational Status *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Activity size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.status ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-amber-500'}`}
                                        {...register('status')}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
                                <p className="text-xs text-gray-400 mt-1">This status determines if the store is fully operational.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/stores')}
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
                                    Registering...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save size={18} />
                                    Register Store
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
