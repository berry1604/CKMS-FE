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
    username: z.string().min(1, 'Tên đăng nhập là bắt buộc'),
    password: z.string().min(1, 'Mật khẩu là bắt buộc'),
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
        const toastId = toast.loading('Đang đăng nhập...');

        try {
            const errorMsg = await login(data.username, data.password);

            if (!errorMsg) {
                // Success
                toast.custom((t) => (
                    <CustomToast
                        t={t}
                        title="Đăng nhập thành công"
                        message="Đang chuyển đến trang chủ..."
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
                        title="Đăng nhập thất bại"
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
                    title="Lỗi"
                    message="Đã xảy ra lỗi không xác định"
                    type="error"
                />
            ), { id: toastId });
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetMessage(null);

        if (!resetEmail) {
            setResetMessage('Vui lòng nhập email của bạn');
            return;
        }

        const toastId = toast.loading('Đang gửi link đặt lại mật khẩu...');

        try {
            await authApi.forgotPassword(resetEmail);
            toast.success('Đã gửi link đặt lại mật khẩu thành công', { id: toastId });
            setResetMessage('Link đặt lại mật khẩu đã được gửi đến email của bạn');
            setResetEmail('');
        } catch (error: any) {
            toast.error(error.message || 'Đã xảy ra lỗi', { id: toastId });
            setResetMessage(error.message || 'Đã xảy ra lỗi');
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-md">Xác Định Danh Tính</h1>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">
                    Nhập thông tin xác thực để truy cập hệ thống
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-6">
                    <div className="space-y-3 group/input">
                        <label className="text-[10px] font-black text-zinc-500 group-focus-within/input:text-amber-500 uppercase tracking-[0.2em] ml-1 transition-colors">Định danh (Username)</label>
                        <Input
                            type="text"
                            placeholder="Nhập tên đăng nhập"
                            error={errors.username?.message}
                            {...register('username')}
                            className="h-14 bg-black/50 border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/20 text-white rounded-2xl transition-all duration-300 placeholder:text-zinc-700 shadow-inner text-sm font-medium px-5"
                        />
                    </div>

                    <div className="space-y-3 group/input">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-black text-zinc-500 group-focus-within/input:text-amber-500 uppercase tracking-[0.2em] transition-colors">Mã Bảo Mật (Password)</label>
                            <button
                                type="button"
                                onClick={() => setShowForgot(!showForgot)}
                                className="text-[10px] font-black text-amber-600 hover:text-amber-400 uppercase tracking-widest transition-colors"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            error={errors.password?.message}
                            {...register('password')}
                            className="h-14 bg-black/50 border-zinc-800 focus:border-amber-500/50 focus:ring-amber-500/20 text-white rounded-2xl transition-all duration-300 placeholder:text-zinc-700 shadow-inner text-sm font-medium px-5 tracking-[0.2em]"
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-500/20 p-4 rounded-2xl animate-in slide-in-from-top-2 flex items-center justify-center text-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="group relative w-full h-14 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                    isLoading={isSubmitting}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
                    <span className="relative z-10 group-hover:drop-shadow-md transition-all">Ủy Quyền Truy Cập</span>
                </Button>
            </form>

            {showForgot && (
                <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                    <div>
                        <Input
                            label="Email"
                            type="email"
                            placeholder="Nhập email của bạn"
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
                        Gửi link đặt lại mật khẩu
                    </Button>
                </form>
            )}

        </div>
    );
};
