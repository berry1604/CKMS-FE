import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Store as StoreIcon, MapPin, User, Activity } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { type Store } from './StoreList';

const storeSchema = z.object({
    name: z.string().min(1, 'Store Name is required'),
    location: z.string().min(1, 'Location is required'),
    manager: z.string().min(1, 'Manager Name is required'),
    status: z.enum(['active', 'inactive', 'pending'])
});

type StoreFormData = z.infer<typeof storeSchema>;

interface StoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: StoreFormData) => void;
    initialData?: Store | null;
    isLoading?: boolean;
}

export const StoreModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: StoreModalProps) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<StoreFormData>({
        resolver: zodResolver(storeSchema),
        defaultValues: {
            name: '',
            location: '',
            manager: '',
            status: 'pending'
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                location: initialData.location,
                manager: initialData.manager,
                status: initialData.status
            });
        } else {
            reset({
                name: '',
                location: '',
                manager: '',
                status: 'pending'
            });
        }
    }, [initialData, reset, isOpen]);

    const onSubmitForm = (data: StoreFormData) => {
        onSubmit(data);
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Store' : 'Register New Store'}
            description={initialData ? 'Update store details and status.' : 'Register a new franchise location.'}
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" onClick={handleSubmit(onSubmitForm)} disabled={isLoading} className="min-w-[120px]">
                        {isLoading ? 'Saving...' : (initialData ? 'Update Store' : 'Register Store')}
                    </Button>
                </div>
            }
        >
            <form className="space-y-8">
                {/* Section 1: Basic Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-300 font-medium pb-2 border-b border-zinc-800">
                        <StoreIcon size={18} className="text-amber-600" />
                        <h3>Store Details</h3>
                    </div>

                    <div className="grid gap-5">
                        <Input
                            label="Store Name"
                            placeholder="e.g. Downtown Branch"
                            icon={<StoreIcon size={18} className="text-gray-400" />}
                            error={errors.name?.message}
                            {...register('name')}
                        />

                        <Input
                            label="Location"
                            placeholder="e.g. 123 Main St, NY"
                            icon={<MapPin size={18} className="text-gray-400" />}
                            error={errors.location?.message}
                            {...register('location')}
                        />
                    </div>
                </div>

                {/* Section 2: Management */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-300 font-medium pb-2 border-b border-zinc-800">
                        <User size={18} className="text-amber-600" />
                        <h3>Management</h3>
                    </div>

                    <Input
                        label="Manager Name"
                        placeholder="e.g. John Doe"
                        icon={<User size={18} className="text-gray-400" />}
                        error={errors.manager?.message}
                        {...register('manager')}
                    />
                </div>

                {/* Section 3: Status */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-300 font-medium pb-2 border-b border-zinc-800">
                        <Activity size={18} className="text-amber-600" />
                        <h3>Operational Status</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {['active', 'pending', 'inactive'].map((status) => (
                            <label
                                key={status}
                                className={`
                                    relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all
                                    ${
                                    // @ts-ignore
                                    register('status').value === status // Note: Simple check logic might need watching 'status' via useWatch if we want instant style update
                                        ? 'border-amber-500 bg-amber-500/10'
                                        : 'border-zinc-800 hover:border-zinc-700'
                                    }
                                `}
                            >
                                <input
                                    type="radio"
                                    value={status}
                                    {...register('status')}
                                    className="sr-only peer"
                                />
                                <div className="flex items-center justify-center w-full">
                                    <span className="capitalize text-sm font-medium peer-checked:text-amber-500">
                                        {status}
                                    </span>
                                </div>
                                <div className="absolute inset-0 rounded-lg ring-2 ring-transparent peer-checked:ring-amber-500 peer-checked:bg-amber-500/10/10 pointer-events-none" />
                            </label>
                        ))}
                    </div>
                </div>
            </form>
        </Drawer>
    );
};
