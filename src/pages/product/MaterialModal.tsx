import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { MaterialResponse, MaterialRequest } from '../../types/material';

const materialSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    unit: z.enum(['KG', 'GRAM', 'LITER', 'ML', 'PIECE']),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface MaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: MaterialRequest) => void;
    initialData?: MaterialResponse | null;
    isLoading?: boolean;
}

export const MaterialModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: MaterialModalProps) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<MaterialFormData>({
        resolver: zodResolver(materialSchema),
        defaultValues: {
            name: '',
            unit: 'KG',
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                unit: initialData.unit,
            });
        } else {
            reset({
                name: '',
                unit: 'KG',
            });
        }
    }, [initialData, reset, isOpen]);

    const onSubmitForm = (data: MaterialFormData) => {
        onSubmit(data);
    };

    const footer = (
        <>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
            </Button>
            <Button type="submit" form="material-form" disabled={isLoading}>
                {isLoading ? 'Saving...' : (initialData ? 'Update Material' : 'Create Material')}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Material' : 'Add New Material'}
            size="md"
            footer={footer}
        >
            <form id="material-form" onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 p-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Material Name *</label>
                    <Input {...register('name')} placeholder="e.g. Raw Beef" />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Unit *</label>
                        <select
                            {...register('unit')}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-zinc-900/50 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="KG">Kilogram (KG)</option>
                            <option value="GRAM">Gram (GRAM)</option>
                            <option value="LITER">Liter (LITER)</option>
                            <option value="ML">Milliliter (ML)</option>
                            <option value="PIECE">Pieces (PIECE)</option>
                        </select>
                        {errors.unit && <p className="text-red-500 text-xs">{errors.unit.message}</p>}
                    </div>
                </div>
            </form>
        </Modal>
    );
};

