import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
    return (
        <div className="min-h-screen relative flex flex-col justify-center py-12 px-6 lg:px-8 overflow-hidden bg-zinc-950">
            {/* Background Image with advanced overlay */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                    src="/src/assets/luxury_steakhouse_bg.png"
                    alt="Background"
                    className="w-full h-full object-cover scale-105 animate-slow-zoom"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/60 to-transparent"></div>
                <div className="absolute inset-0 backdrop-blur-[1px]"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-[480px] z-10 relative">
                <div className="text-center mb-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                        <span className="text-black text-3xl font-black">B</span>
                    </div>
                    <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl uppercase">
                        Bistack
                    </h2>
                    <div className="h-px w-12 bg-amber-500 my-4"></div>
                    <p className="text-zinc-400 text-xs font-black tracking-[0.3em] uppercase">
                        Premium Management System
                    </p>
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-2xl py-12 px-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] rounded-[40px] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                    <Outlet />
                </div>

                <div className="mt-10 text-center space-y-2">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} Bistack Franchise System
                    </p>
                    <p className="text-[9px] text-zinc-800 font-medium">Bản quyền thuộc về đội ngũ phát triển Bistack</p>
                </div>
            </div>
        </div>
    );
};
