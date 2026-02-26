import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CustomToast } from '../../components/ui/CustomToast';
import { authApi } from '../../services/auth.api';

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [showForgot, setShowForgot] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: 'admin',
            password: 'admin',
        },
    });

    const onSubmit = async (data: LoginForm) => {
        setError(null);
        // Loading toast
        const toastId = toast.loading('Logging in...');

        try {
            const errorMsg = await login(data.username, data.password);

            if (!errorMsg) {
                // Success
                toast.custom((t) => (
                    <CustomToast
                        t={t}
                        title="Login Successful"
                        message="Redirecting to dashboard..."
                        type="success"
                    />
                ), { duration: 3000, id: toastId });

                // Navigate after short delay to let user see the toast
                setTimeout(() => navigate('/'), 800);
            } else {
                // Error handled by login hook returning message
                toast.custom((t) => (
                    <CustomToast
                        t={t}
                        title="Login Failed"
                        message={errorMsg}
                        type="error"
                    />
                ), { duration: 5000, id: toastId });
                setError(errorMsg);
            }
        } catch (err) {
            // Unexpected error (login hook catches most, but just in case)
            toast.custom((t) => (
                <CustomToast
                    t={t}
                    title="Error"
                    message="An unexpected error occurred"
                    type="error"
                />
            ), { id: toastId });
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetMessage(null);

        if (!resetEmail) {
            setResetMessage('Please enter your email');
            return;
        }

        const toastId = toast.loading('Sending reset link...');

        try {
            await authApi.forgotPassword(resetEmail);
            toast.success('Reset link sent successfully', { id: toastId });
            setResetMessage('Password reset link has been sent to your email');
            setResetEmail('');
        } catch (error: any) {
            toast.error(error.message || 'Something went wrong', { id: toastId });
            setResetMessage(error.message || 'Something went wrong');
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-serif font-bold text-white">Welcome Back</h1>
                <p className="mt-2 text-sm text-gray-300">
                    Sign in to manage your restaurant
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <div className="relative">
                        <Input
                            label="Username"
                            type="text"
                            placeholder="admin"
                            error={errors.username?.message}
                            {...register('username')}
                            className="bg-white/5 border-white/10 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-white placeholder-gray-500 transition-all duration-200"
                            labelClassName="text-gray-300 uppercase text-xs tracking-wider"
                        />
                    </div>

                    <div className="relative">
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            error={errors.password?.message}
                            {...register('password')}
                            className="bg-white/5 border-white/10 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-white placeholder-gray-500 transition-all duration-200"
                            labelClassName="text-gray-300 uppercase text-xs tracking-wider"
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-400 bg-red-900/20 border border-red-900/50 p-3 rounded-md">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white border-none shadow-lg hover:shadow-amber-900/20 transition-all py-2.5"
                    isLoading={isSubmitting}
                >
                    Sign in
                </Button>
            </form>

            <div className="text-right">
                <button
                    type="button"
                    onClick={() => setShowForgot(!showForgot)}
                    className="text-sm text-amber-400 hover:underline"
                >
                    Forgot Password?
                </button>
            </div>

            {showForgot && (
                <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                    <div>
                        <Input
                            label="Email"
                            type="email"
                            placeholder="Enter your email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            labelClassName="text-gray-300 uppercase text-xs tracking-wider"
                        />
                    </div>

                    {resetMessage && (
                        <div className="text-sm text-green-400 bg-green-900/20 border border-green-900/50 p-3 rounded-md">
                            {resetMessage}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
                    >
                        Send Reset Link
                    </Button>
                </form>
            )}

            <div className="mt-4 text-center text-xs text-gray-400">
                <p>Demo Credentials:</p>
                <p>Username: admin / manager / staff</p>
                <p>Password: admin / manager / staff</p>
            </div>
        </div>
    );
};
