import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { ProductResponse } from '../../types/product';
import { Package, Tag } from 'lucide-react';

const productSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    categoryId: z.number().min(1, 'Category ID is required'),
    price: z.number().min(0, 'Price must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    description: z.string().optional()
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ProductFormData) => void;
    initialData?: ProductResponse | null;
    isLoading?: boolean;
}

export const ProductModal = ({ isOpen, onClose, onSubmit, initialData, isLoading }: ProductModalProps) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            categoryId: 1,
            price: 0,
            unit: 'KG',
            description: ''
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                categoryId: initialData.category?.id || 1,
                price: initialData.price,
                unit: initialData.unit || 'KG',
                description: initialData.description || ''
            });
        } else {
            reset({
                name: '',
                categoryId: 1,
                price: 0,
                unit: 'KG',
                description: ''
            });
        }
    }, [initialData, reset, isOpen]);

    const onSubmitForm = (data: ProductFormData) => {
        onSubmit(data);
    };

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
            </Button>
            <Button type="submit" form="product-form" disabled={isLoading} className="min-w-[120px]">
                {isLoading ? 'Saving...' : (initialData ? 'Update Product' : 'Create Product')}
            </Button>
        </div>
    );

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Product' : 'Add New Product'}
            description={initialData ? 'Update product information and inventory.' : 'Create a new product record.'}
            width="max-w-md"
            footer={footer}
        >
            <form id="product-form" onSubmit={handleSubmit(onSubmitForm)} className="space-y-8">

                {/* Basic Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-800 font-medium pb-2 border-b border-gray-100">
                        <Package size={18} className="text-blue-600" />
                        <h3>Basic Information</h3>
                    </div>
                    <div className="space-y-4">
                        <Input
                            label="Product Name"
                            placeholder="e.g. Signature Coffee"
                            error={errors.name?.message}
                            {...register('name')}
                        />
                        <Input
                            label="Description"
                            placeholder="e.g. A rich and smooth coffee blend"
                            error={errors.description?.message}
                            {...register('description')}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Unit"
                                placeholder="e.g. KG, PCS"
                                error={errors.unit?.message}
                                {...register('unit')}
                            />
                            <Input
                                label="Category ID"
                                type="number"
                                placeholder="1"
                                icon={<Tag size={16} className="text-gray-400" />}
                                error={errors.categoryId?.message}
                                {...register('categoryId', { valueAsNumber: true })}
                            />
                            <Input
                                label="Selling Price"
                                type="number"
                                step="0.01"
                                icon={<span className="text-gray-500 font-bold">$</span>}
                                error={errors.price?.message}
                                {...register('price', { valueAsNumber: true })}
                            />
                        </div>
                    </div>
                </div>

            </form>
        </Drawer>
    );
};
