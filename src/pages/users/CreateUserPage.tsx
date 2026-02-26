import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, UserPlus, Mail, User as UserIcon, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { userService } from '../../services/user.service';
import type { CreateUserRequest } from '../../types/user';

const createUserSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
    email: z.string().email('Invalid email address'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    roleId: z.number().min(1, 'Please select a role'),
});

export const CreateUserPage = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset
    } = useForm<CreateUserRequest>({
        resolver: zodResolver(createUserSchema),
        mode: 'onChange',
        defaultValues: {
            username: '',
            email: '',
            fullName: '',
            roleId: 2 // Assuming 2 is MANAGER from schema. Can change accordingly.
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
                    className="hover:bg-gray-100 rounded-full p-2 h-auto"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <UserPlus size={24} className="text-blue-600" />
                        Create New User
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Add a new user to the system and assign their role.</p>
                </div>
            </div>

            <Card className="p-6 md:p-8 border-0 shadow-sm ring-1 ring-gray-200 bg-white">
                {backendError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
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
                                <label className="text-sm font-medium text-gray-700 block">Username *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.username ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-blue-500'}`}
                                        placeholder="e.g. johndoe"
                                        {...register('username')}
                                    />
                                </div>
                                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 block">Email Address *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.email ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-blue-500'}`}
                                        placeholder="e.g. john@example.com"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 block">Full Name *</label>
                                <Input
                                    placeholder="e.g. John Doe"
                                    error={errors.fullName?.message}
                                    {...register('fullName')}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 block">System Role *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Shield size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${errors.roleId ? 'border-red-300 focus:ring-red-500 ring-1 ring-red-100' : 'border-gray-300 focus:ring-blue-500'}`}
                                        {...register('roleId', { valueAsNumber: true })}
                                    >
                                        <option value={1}>Administrator (ADMIN)</option>
                                        <option value={2}>Manager (MANAGER)</option>
                                        <option value={3}>Staff (STAFF)</option>
                                    </select>
                                </div>
                                {errors.roleId && <p className="text-red-500 text-xs mt-1">{errors.roleId.message}</p>}
                                <p className="text-xs text-gray-500 mt-1">This role determines the user's permissions across the system.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
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
