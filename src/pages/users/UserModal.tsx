import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Shield, Briefcase, Key, CheckCircle2 } from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { User as UserType } from '../../types/user';

const userSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    role: z.enum(['ADMIN', 'MANAGER', 'SUPPLY_COORDINATOR', 'KITCHEN_STAFF', 'STORE_STAFF'] as const),
});

type UserForm = z.infer<typeof userSchema>;

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: UserForm) => Promise<void>;
    user?: UserType | null;
}

export const UserModal = ({ isOpen, onClose, onSubmit, user }: UserModalProps) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<UserForm>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            role: 'STORE_STAFF',
        },
    });

    useEffect(() => {
        if (user) {
            reset({
                name: user.name,
                email: user.email,
                role: user.role as 'ADMIN' | 'MANAGER' | 'SUPPLY_COORDINATOR' | 'KITCHEN_STAFF' | 'STORE_STAFF',
            });
        } else {
            reset({
                name: '',
                email: '',
                role: 'STORE_STAFF',
            });
        }
    }, [user, isOpen, reset]);

    const handleFormSubmit = async (data: UserForm) => {
        await onSubmit(data);
        onClose();
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={user ? 'Edit Member Details' : 'Add New Member'}
            description={user ? 'Update member information and permissions.' : 'Create a new team member account.'}
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(handleFormSubmit)} isLoading={isSubmitting} className="min-w-[120px]">
                        {user ? 'Save Changes' : 'Create Member'}
                    </Button>
                </div>
            }
        >
            <form className="space-y-8">
                {/* Section 1: Basic Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-800 font-medium pb-2 border-b border-gray-100">
                        <Briefcase size={18} className="text-blue-600" />
                        <h3>Professional Information</h3>
                    </div>

                    <div className="grid gap-5">
                        <Input
                            label="Full Name"
                            placeholder="e.g. John Doe"
                            icon={<User size={18} className="text-gray-400" />}
                            error={errors.name?.message}
                            {...register('name')}
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="e.g. john@franchise.com"
                            icon={<Mail size={18} className="text-gray-400" />}
                            error={errors.email?.message}
                            {...register('email')}
                        />
                    </div>
                </div>

                {/* Section 2: Roles */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-800 font-medium pb-2 border-b border-gray-100">
                        <Shield size={18} className="text-blue-600" />
                        <h3>Role & Permissions</h3>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-3">
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Role</label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-md border border-gray-300 bg-white pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 appearance-none transition-shadow"
                                    {...register('role')}
                                >
                                    <option value="ADMIN">Admin (Full Access)</option>
                                    <option value="MANAGER">Manager (Store & Operations)</option>
                                    <option value="SUPPLY_COORDINATOR">Supply Coordinator (Logistics)</option>
                                    <option value="KITCHEN_STAFF">Kitchen Staff (Production)</option>
                                    <option value="STORE_STAFF">Store Staff (Sales & Orders)</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 p-3 bg-blue-50/50 rounded text-xs text-blue-800">
                            <Key size={14} className="mt-0.5" />
                            <p>Assigning a role will automatically grant the corresponding permissions to this user.</p>
                        </div>
                    </div>
                    {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
                </div>

                {/* Additional Info Box */}
                <div className="bg-green-50 rounded-lg p-4 flex items-start gap-3 border border-green-100">
                    <CheckCircle2 size={18} className="text-green-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-green-900">Account Activation</h4>
                        <p className="text-xs text-green-700 mt-1 leading-relaxed">
                            An invitation email will be sent to <strong>{user?.email || 'the provided email'}</strong> with instructions to set their password and active their account.
                        </p>
                    </div>
                </div>
            </form>
        </Drawer>
    );
};
