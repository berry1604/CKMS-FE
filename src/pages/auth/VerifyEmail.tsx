import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const VerifyEmail = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    // If backend already validated, we might not even need to read token here, just show success.

    useEffect(() => {
        // Countdown interval
        const intervalId = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalId);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Redirect timeout after 5 seconds
        const timeoutId = setTimeout(() => {
            navigate('/login');
        }, 5000);

        // Cleanup
        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, [navigate]);

    return (
        <div className="min-h-screen bg-zinc-900/80 flex items-center justify-center p-4">
            <div className="bg-zinc-900/50 p-8 md:p-12 rounded-2xl shadow-xl border border-zinc-800 max-w-md w-full text-center flex flex-col items-center">
                <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                    <CheckCircle2 className="text-green-500 w-12 h-12" />
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-200 mb-3">
                    Xác thực thành công!
                </h1>

                <p className="text-gray-400 mb-8">
                    Tài khoản của bạn đã được xác thực. Cảm ơn bạn đã tham gia hệ thống FranchiseSys.
                </p>

                <div className="bg-amber-500/10 text-amber-500 w-full py-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center gap-1 mb-6">
                    <span className="text-sm font-medium">Tự động chuyển đến trang Đăng nhập sau</span>
                    <span className="text-3xl font-bold font-mono">{countdown}</span>
                    <span className="text-xs">giây</span>
                </div>

                <Button
                    className="w-full bg-amber-600 hover:bg-blue-700 text-white rounded-xl h-11"
                    onClick={() => navigate('/login')}
                >
                    Đăng nhập ngay
                    <ArrowRight size={16} className="ml-2" />
                </Button>
            </div>
        </div>
    );
};
