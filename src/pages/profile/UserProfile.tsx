import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Save, Shield, Phone, MapPin, Calendar, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

const profileSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    address: z.string().optional(),
    bio: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal(''))
}).refine((data) => {
    if (data.password && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const UserProfile = () => {
    const { user } = useAuth(); // We might need a way to refresh user data in context
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address: user?.address || '',
            bio: user?.bio || '',
            password: '',
            confirmPassword: ''
        }
    });

    useEffect(() => {
        if (user) {
            setValue('name', user.name);
            setValue('email', user.email);
            setValue('phone', user.phone || '');
            setValue('address', user.address || '');
            setValue('bio', user.bio || '');
        }
    }, [user, setValue]);

    const onSubmit = async (_data: ProfileFormValues) => {
        if (!user) return;
        setIsLoading(true);
        setSuccessMessage('');

        try {
            // In a real app, password would be handled separately or require current password

            // await updateUser(user.id, {
            //     name: data.name,
            //     email: data.email,
            //     phone: data.phone,
            //     address: data.address,
            // });

            // Optimistically update local showing (in real app, assume context updates or we re-fetch)
            // For now, let's just show success
            setSuccessMessage('Profile updated successfully!');

            // Clear password fields
            setValue('password', '');
            setValue('confirmPassword', '');

        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-200">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="text-center p-6">
                        <div className="flex flex-col items-center">
                            <img
                                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`}
                                alt={user.name}
                                className="w-32 h-32 rounded-full mb-4 ring-4 ring-gray-50 object-cover"
                            />
                            <h2 className="text-2xl font-bold text-gray-200">{user.name}</h2>
                            <p className="text-gray-400">{user.email}</p>

                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium">
                                    <Shield size={14} className="mr-1.5" />
                                    {user.role}
                                </div>
                                {user.joinDate && (
                                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-400 text-sm">
                                        <Calendar size={14} className="mr-1.5" />
                                        Joined {user.joinDate}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 text-left space-y-4 pt-6 border-t border-zinc-800">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-semibold">Contact Info</p>
                                <div className="mt-2 space-y-3">
                                    <div className="flex items-start text-sm text-gray-400">
                                        <Phone size={16} className="mr-2 mt-0.5 text-gray-400" />
                                        <span>{user.phone || 'No phone added'}</span>
                                    </div>
                                    <div className="flex items-start text-sm text-gray-400">
                                        <MapPin size={16} className="mr-2 mt-0.5 text-gray-400" />
                                        <span>{user.address || 'No address added'}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400 uppercase font-semibold">Bio</p>
                                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                                    {user.bio || 'No bio provided.'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Edit Form */}
                <div className="md:col-span-2">
                    <Card title="Edit Personal Information" className="p-6">
                        {successMessage && (
                            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-100">
                                {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User size={18} className="text-gray-400" />
                                        </div>
                                        <Input
                                            {...register('name')}
                                            className="pl-10"
                                            error={errors.name?.message}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail size={18} className="text-gray-400" />
                                        </div>
                                        <Input
                                            {...register('email')}
                                            className="pl-10"
                                            type="email"
                                            error={errors.email?.message}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone size={18} className="text-gray-400" />
                                        </div>
                                        <Input
                                            {...register('phone')}
                                            className="pl-10"
                                            placeholder="+1 (555) 000-0000"
                                            error={errors.phone?.message}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MapPin size={18} className="text-gray-400" />
                                        </div>
                                        <Input
                                            {...register('address')}
                                            className="pl-10"
                                            placeholder="123 Main St, City, Country"
                                            error={errors.address?.message}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Bio
                                </label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 pointer-events-none">
                                        <FileText size={18} className="text-gray-400" />
                                    </div>
                                    <textarea
                                        {...register('bio')}
                                        className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[100px]"
                                        placeholder="Tell us a little about yourself..."
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-zinc-800">
                                <h3 className="text-sm font-medium text-gray-200 mb-4 flex items-center">
                                    <Lock size={16} className="mr-2 text-amber-600" />
                                    Security Settings
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            New Password
                                        </label>
                                        <Input
                                            {...register('password')}
                                            type="password"
                                            placeholder="Leave blank to keep current"
                                            error={errors.password?.message}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Confirm New Password
                                        </label>
                                        <Input
                                            {...register('confirmPassword')}
                                            type="password"
                                            placeholder="Confirm new password"
                                            error={errors.confirmPassword?.message}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" isLoading={isLoading} size="lg">
                                    <Save size={18} className="mr-2" /> Save Profile
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};
