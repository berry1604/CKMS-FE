import React from 'react';
import { Outlet } from 'react-router-dom';
import logoIn from '../assets/logo.png';

export const AuthLayout: React.FC = () => {
    return (
        <div className="min-h-screen relative flex flex-col items-center pt-8 md:pt-16 pb-20 px-6 overflow-hidden bg-zinc-950">
            {/* Background Image with advanced overlay */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                    src="/src/assets/luxury_steakhouse_bg.png"
                    alt="Background"
                    className="w-full h-full object-cover scale-105 animate-slow-zoom"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/80 to-transparent"></div>
                <div className="absolute inset-0 backdrop-blur-[1px]"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-[480px] z-10 relative flex flex-col items-center">
                {/* Logo Heading (Outside Card) */}
                <div className="flex flex-col items-center mb-8 transition-transform duration-700 hover:scale-105">
                    <div className="relative">
                        <div className="absolute -inset-10 bg-amber-500/10 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                        <img
                            src={logoIn}
                            alt="SteakChain Management System"
                            className="w-56 md:w-80 h-auto [filter:drop-shadow(0_0_25px_rgba(245,158,11,0.5))_drop-shadow(0_0_10px_rgba(255,255,255,0.2))_brightness(1.2)_contrast(1.1)] relative z-10 transition-all duration-500 hover:scale-105 group-hover:brightness-135"
                        />
                    </div>
                </div>

                {/* Login Card */}
                <div className="w-full bg-zinc-950/60 backdrop-blur-3xl py-12 px-8 sm:px-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] rounded-[40px] border border-zinc-800/80 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/80 to-transparent"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.05),_transparent_50%)] pointer-events-none"></div>
                    <div className="relative z-10">
                        <Outlet />
                    </div>
                </div>
            </div>

            {/* Anchored Footer */}
            <div className="absolute bottom-8 left-0 right-0 z-10 text-center space-y-2 px-6">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] opacity-80">
                    &copy; {new Date().getFullYear()} SteakChain Management System
                </p>
                <p className="text-[8px] text-zinc-700 font-bold tracking-widest uppercase opacity-60">
                    FranchiseSys Protocol &bull; All Rights Reserved
                </p>
            </div>
        </div>
    );
};
