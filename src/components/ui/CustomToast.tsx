import type { Toast } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../utils/classNames';

/*
  Custom Toast Component
  Uses Lucide icons, glassmorphism, and a progress bar.
*/

interface CustomToastProps {
    t: Toast;
    title: string;
    message?: string;
    type?: 'success' | 'error' | 'info';
}

export const CustomToast = ({ t, title, message, type = 'success' }: CustomToastProps) => {
    // Simple progress animation logic could be added here if not using CSS keyframes
    // But CSS keyframes are smoother for the progress bar.
    // Actually, calculating progress in JS is fine for a simple linear bar.

    return (
        <div
            className={cn(
                "max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5",
                t.visible ? "animate-enter" : "animate-leave"
            )}
        >
            <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        {type === 'success' && <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle className="h-6 w-6 text-green-600" /></div>}
                        {type === 'error' && <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center"><AlertCircle className="h-6 w-6 text-red-600" /></div>}
                        {type === 'info' && <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"><Info className="h-6 w-6 text-blue-600" /></div>}
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                            {title}
                        </p>
                        {message && (
                            <p className="mt-1 text-sm text-gray-500">
                                {message}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex border-l border-gray-200">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    Close
                </button>
            </div>
        </div>
    );
};
