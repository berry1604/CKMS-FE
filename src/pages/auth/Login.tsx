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
            username: '',
            password: '',
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Chào mừng trở lại</h1>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                    Đăng nhập để quản lý hệ thống của bạn
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Tên đăng nhập</label>
                        <Input
                            type="text"
                            placeholder="Nhập username"
                            error={errors.username?.message}
                            {...register('username')}
                            className="h-14 bg-black/40 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300 placeholder:text-zinc-700"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Mật khẩu</label>
                            <button
                                type="button"
                                onClick={() => setShowForgot(!showForgot)}
                                className="text-[10px] font-black text-amber-500/80 hover:text-amber-500 uppercase tracking-widest transition-colors"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            error={errors.password?.message}
                            {...register('password')}
                            className="h-14 bg-black/40 border-white/5 focus:border-amber-500/50 focus:ring-amber-500/10 text-zinc-100 rounded-2xl transition-all duration-300 placeholder:text-zinc-700"
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-[11px] font-bold text-red-500 bg-red-500/5 border border-red-500/10 p-4 rounded-xl animate-shake">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl border-0 shadow-2xl shadow-amber-900/40 transition-all duration-500 hover:scale-[1.02] active:scale-95"
                    isLoading={isSubmitting}
                >
                    Đăng nhập ngay
                </Button>
            </form>

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

        </div>
    );
};
