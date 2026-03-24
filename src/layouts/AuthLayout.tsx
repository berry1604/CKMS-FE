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
                    <div className="w-24 h-24 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:scale-110 transition-all duration-500 border border-amber-500/20">
                        <img src="/logo.svg" alt="SteakChain" className="w-16 h-16 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]" />
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter drop-shadow-2xl uppercase italic flex justify-center gap-1">
                        <span className="text-amber-500">Steak</span>
                        <span className="text-amber-500">Chain</span>
                    </h2>
                    <div className="h-px w-20 bg-gradient-to-r from-transparent via-amber-500 to-transparent my-5"></div>
                    <p className="text-stone-300 text-xs font-black tracking-[0.4em] uppercase">
                        Hệ thống nhượng quyền
                    </p>
                </div>

                <div className="bg-zinc-950/60 backdrop-blur-3xl py-12 px-8 sm:px-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] rounded-[40px] border border-zinc-800/80 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/80 to-transparent"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.05),_transparent_50%)] pointer-events-none"></div>
                    <div className="relative z-10">
                        <Outlet />
                    </div>
                </div>

                <div className="mt-12 text-center space-y-3">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                        &copy; {new Date().getFullYear()} FranchiseSys Protocol
                    </p>
                    <p className="text-[9px] text-zinc-700 font-bold tracking-widest uppercase">Bản quyền thuộc về đội ngũ phát triển FranchiseSys</p>
                </div>
            </div>
        </div>
    );
};
