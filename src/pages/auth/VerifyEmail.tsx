import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../services/auth.api';
import toast from 'react-hot-toast';

type Step = 'activating' | 'set-password' | 'done' | 'error';

export const VerifyEmail = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [step, setStep] = useState<Step>('activating');
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [countdown, setCountdown] = useState(5);

    // Activate account on mount
    useEffect(() => {
        if (!token) {
            setStep('error');
            setError('Token không hợp lệ. Vui lòng kiểm tra lại link kích hoạt.');
            return;
        }

        authApi.activateAccount({ token })
            .then(() => {
                setStep('set-password');
            })
            .catch((err: any) => {
                const msg = err.response?.data?.message || err.message || 'Kích hoạt thất bại';
                // If already activated, still allow setting password
                if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('đã kích hoạt')) {
                    setStep('set-password');
                } else {
                    setStep('set-password'); // Still show password form in case activation was already done via redirect
                    console.warn('Activation response:', msg);
                }
            });
    }, [token]);

    // Countdown for done step
    useEffect(() => {
        if (step !== 'done') return;
        const intervalId = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalId);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const timeoutId = setTimeout(() => {
            navigate('/login');
        }, 5000);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, [step, navigate]);

    const handleSetPassword = async () => {
        if (password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsSubmitting(true);
        try {
            await authApi.resetPassword(token, password);
            toast.success('Đặt mật khẩu thành công!');
            setStep('done');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Đặt mật khẩu thất bại. Vui lòng thử lại.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-900/80 flex items-center justify-center p-4">
            <div className="bg-zinc-900/50 p-8 md:p-12 rounded-2xl shadow-xl border border-zinc-800 max-w-md w-full text-center flex flex-col items-center">

                {/* Step: Activating */}
                {step === 'activating' && (
                    <>
                        <div className="h-20 w-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
                            <Loader2 className="text-amber-500 w-10 h-10 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-200 mb-3">Đang kích hoạt...</h1>
                        <p className="text-gray-400">Vui lòng chờ trong giây lát.</p>
                    </>
                )}

                {/* Step: Error */}
                {step === 'error' && (
                    <>
                        <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                            <AlertCircle className="text-red-500 w-12 h-12" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-200 mb-3">Kích hoạt thất bại</h1>
                        <p className="text-gray-400 mb-6">{error}</p>
                        <Button
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-11"
                            onClick={() => navigate('/login')}
                        >
                            Về trang đăng nhập
                        </Button>
                    </>
                )}

                {/* Step: Set Password */}
                {step === 'set-password' && (
                    <>
                        <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="text-green-500 w-12 h-12" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-200 mb-2">Xác thực thành công!</h1>
                        <p className="text-gray-400 mb-6">
                            Tài khoản đã được kích hoạt. Hãy đặt mật khẩu để đăng nhập.
                        </p>

                        <div className="w-full space-y-4 text-left">
                            {/* Password */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Mật khẩu mới</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                                        className="w-full pl-10 pr-10 py-2.5 border border-zinc-700 rounded-lg text-sm bg-zinc-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-300 block">Xác nhận mật khẩu</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Nhập lại mật khẩu"
                                        className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm bg-zinc-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${confirmPassword && confirmPassword !== password
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-zinc-700 focus:ring-amber-500'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                                    >
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {confirmPassword && confirmPassword !== password && (
                                    <p className="text-red-500 text-xs mt-1">Mật khẩu không khớp</p>
                                )}
                            </div>

                            <Button
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-11 mt-2"
                                onClick={handleSetPassword}
                                disabled={isSubmitting || !password || !confirmPassword || password !== confirmPassword}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        Đang xử lý...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Lock size={16} />
                                        Đặt mật khẩu & Tiếp tục
                                    </div>
                                )}
                            </Button>
                        </div>
                    </>
                )}

                {/* Step: Done */}
                {step === 'done' && (
                    <>
                        <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                            <CheckCircle2 className="text-green-500 w-12 h-12" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-200 mb-3">
                            Sẵn sàng đăng nhập!
                        </h1>
                        <p className="text-gray-400 mb-8">
                            Mật khẩu đã được đặt thành công. Bạn có thể đăng nhập ngay bây giờ.
                        </p>

                        <div className="bg-amber-500/10 text-amber-500 w-full py-4 rounded-xl border border-amber-500/20 flex flex-col items-center justify-center gap-1 mb-6">
                            <span className="text-sm font-medium">Tự động chuyển đến trang Đăng nhập sau</span>
                            <span className="text-3xl font-bold font-mono">{countdown}</span>
                            <span className="text-xs">giây</span>
                        </div>

                        <Button
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-11"
                            onClick={() => navigate('/login')}
                        >
                            Đăng nhập ngay
                            <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};
