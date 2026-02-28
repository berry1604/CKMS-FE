import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, UserPlus, Mail, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { userService } from '../../services/user.service';
import { roleApi } from '../../services/role.api';
import type { CreateUserRequest } from '../../types/user';
import type { RoleResponse } from '../../types/role';

const createUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    roleId: z.number().min(1, 'Please select a role'),
    kitchenId: z.number().optional(),
    storeId: z.number().optional(),
});

export const CreateUserPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);
    const [roles, setRoles] = useState<RoleResponse[]>([]);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await roleApi.getAllRoles();
                setRoles(data);
            } catch (error) {
                console.error('Failed to fetch roles:', error);
            }
        };
        fetchRoles();
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset
    } = useForm<CreateUserRequest>({
        resolver: zodResolver(createUserSchema),
        mode: 'onChange',
        defaultValues: {
            email: '',
            fullName: '',
            roleId: 0
        }
    });

    const onSubmit = async (data: CreateUserRequest) => {
        setBackendError(null);
        setIsSubmitting(true);
        try {
            await userService.createUser(data);
            toast.success('User created successfully');
            reset();
            navigate('/users');
        } catch (error: any) {
            console.error('Create user error:', error);
            const message = error.response?.data?.message || 'Failed to create user. Please try again.';
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
                    onClick={() => navigate('/users')}
                    className="hover:bg-zinc-800 rounded-full p-2 h-auto"
                >
                    <ArrowLeft size={20} className="text-gray-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-2">
                        <UserPlus size={24} className="text-amber-500" />
                        Create New User
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Add a new user to the system and assign their role.</p>
                </div>
            </div>

            <Card className="p-6 md:p-8 border-0 shadow-sm ring-1 ring-zinc-800 bg-zinc-900/50">
                {backendError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-start gap-3">
                        <div className="mt-0.5">
                            <Shield size={18} className="text-red-500" />
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
                                <label className="text-sm font-medium text-gray-300 block">Email Address *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm bg-zinc-900/50 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:border-transparent transition-all ${errors.email ? 'border-red-500/50 focus:ring-red-500 ring-1 ring-red-500/20' : 'border-zinc-700 focus:ring-amber-500 focus:border-amber-500'}`}
                                        placeholder="e.g. john@example.com"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Full Name *</label>
                                <Input
                                    placeholder="e.g. John Doe"
                                    error={errors.fullName?.message}
                                    {...register('fullName')}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">System Role *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Shield size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm bg-zinc-900/50 text-gray-200 focus:outline-none focus:ring-1 focus:border-transparent transition-all appearance-none ${errors.roleId ? 'border-red-500/50 focus:ring-red-500 ring-1 ring-red-500/20' : 'border-zinc-700 focus:ring-amber-500 focus:border-amber-500'}`}
                                        {...register('roleId', { valueAsNumber: true })}
                                    >
                                        <option value={0} disabled>Select a role...</option>
                                        {roles.map(role => (
                                            <option key={role.roleId} value={role.roleId}>
                                                {role.roleName?.replace(/_/g, ' ') || `Role ${role.roleId}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.roleId && <p className="text-red-500 text-xs mt-1">{errors.roleId.message}</p>}
                                <p className="text-xs text-gray-400 mt-1">This role determines the user's permissions across the system.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Kitchen ID (Optional)</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 1"
                                    error={errors.kitchenId?.message}
                                    {...register('kitchenId', { valueAsNumber: true })}
                                />
                                <p className="text-xs text-gray-400 mt-1">Required for Kitchen Staff/Managers.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Store ID (Optional)</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 1"
                                    error={errors.storeId?.message}
                                    {...register('storeId', { valueAsNumber: true })}
                                />
                                <p className="text-xs text-gray-400 mt-1">Required for Store Staff/Managers.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/users')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-amber-600 hover:bg-amber-700 text-white min-w-[140px]"
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
                                    Create User
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
