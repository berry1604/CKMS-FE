import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import type { User } from '../types/user';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/classNames';
import { PERMISSIONS, hasPermission, type Permission } from '../config/permissions';
import {
    LayoutDashboard,
    Users,
    Store,
    ChefHat,
    Package,
    ShoppingCart,
    FileText,
    Truck,
    BarChart,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Shield,
    Database,
    Network,
    LibraryBig,
    Wheat,
    Settings
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavItem {
    name: string;
    href: string;
    icon: any;
    permission?: Permission | Permission[];
    hidden?: boolean | ((user: User | null) => boolean);
}

export interface NavGroup {
    category: string;
    items: NavItem[];
    headerPermission?: Permission | Permission[];
}

export type NavigationItem = NavItem | NavGroup;

// ─── Navigation Config ────────────────────────────────────────────────────────

export const navigation: NavigationItem[] = [
    {
        name: 'Tổng quan',
        href: '/',
        icon: LayoutDashboard,
        // Dashboard is available to any authenticated user
        permission: undefined,
    },
    // SECTION: FRANCHISE STORE
    {
        category: 'Cửa hàng',
        headerPermission: [PERMISSIONS.CREATE_ORDER, PERMISSIONS.VIEW_MY_ORDERS, PERMISSIONS.RECEIVE_SHIPMENT],
        items: [
            {
                name: 'Tạo đơn hàng',
                href: '/orders/create',
                icon: ShoppingCart,
                permission: PERMISSIONS.CREATE_ORDER,
            },
            {
                name: 'Đơn hàng của tôi',
                href: '/orders',
                icon: FileText,
                permission: PERMISSIONS.VIEW_MY_ORDERS,
                hidden: (user) => {
                    const role = user?.role?.toUpperCase().replace('ROLE_', '');
                    return role === 'KITCHEN_STAFF' || role === 'COORDINATOR';
                },
            },
            {
                name: 'Nhận hàng',
                href: '/shipment/receive',
                icon: Package,
                permission: PERMISSIONS.RECEIVE_SHIPMENT,
                hidden: (user) => {
                    const role = user?.role?.toUpperCase().replace('ROLE_', '');
                    return role === 'KITCHEN_STAFF' || role === 'COORDINATOR';
                },
            },
        ]
    },
    // SECTION: COORDINATOR
    {
        category: 'Điều phối',
        headerPermission: [PERMISSIONS.APPROVE_ORDERS, PERMISSIONS.PRODUCTION_PLANNING, PERMISSIONS.ALLOCATION_MANAGEMENT, PERMISSIONS.CREATE_SHIPMENT],
        items: [
            {
                name: 'Duyệt đơn hàng',
                href: '/orders/approvals',
                icon: ClipboardList,
                permission: PERMISSIONS.APPROVE_ORDERS,
                hidden: (user) => user?.role?.toUpperCase().replace('ROLE_', '') === 'KITCHEN_STAFF',
            },
            {
                name: 'Lập kế hoạch SX',
                href: '/kitchen/create-plan',
                icon: ChefHat,
                permission: PERMISSIONS.PRODUCTION_PLANNING,
                hidden: (user) => user?.role?.toUpperCase().replace('ROLE_', '') === 'KITCHEN_STAFF',
            },
            {
                name: 'Lịch sản xuất',
                href: '/kitchen',
                icon: LayoutDashboard,
                permission: PERMISSIONS.PRODUCTION_SCHEDULE,
                hidden: (user) => user?.role?.toUpperCase().replace('ROLE_', '') === 'MANAGER',
            },
            {
                name: 'Phân bổ hàng',
                href: '/warehouse/allocation',
                icon: Network,
                permission: PERMISSIONS.ALLOCATION_MANAGEMENT,
                hidden: (user) => user?.role?.toUpperCase().replace('ROLE_', '') === 'KITCHEN_STAFF',
            },
            {
                name: 'Vận chuyển',
                href: '/shipment',
                icon: Truck,
                permission: PERMISSIONS.CREATE_SHIPMENT,
            },
        ]
    },
    // SECTION: MANAGER
    {
        category: 'Quản lý',
        headerPermission: [PERMISSIONS.CATEGORY_MANAGEMENT, PERMISSIONS.BILLING_MANAGEMENT, PERMISSIONS.REVENUE_REPORTS, PERMISSIONS.PRODUCTION_SCHEDULE],
        items: [
            {
                name: 'Kho nguyên liệu',
                href: '/kitchen/inventory',
                icon: Database,
                permission: PERMISSIONS.MATERIAL_INVENTORY,
            },
            {
                name: 'Bếp trung tâm',
                href: '/kitchens',
                icon: ChefHat,
                permission: PERMISSIONS.MANAGE_KITCHEN_CONFIG,
            },
            {
                name: 'Sản phẩm & Menu',
                href: '/products',
                icon: Package,
                permission: PERMISSIONS.PRODUCT_MANAGEMENT,
                hidden: (user) => {
                    const role = user?.role?.toUpperCase().replace('ROLE_', '');
                    return role === 'KITCHEN_STAFF' || role === 'COORDINATOR';
                },
            },
            {
                name: 'Danh mục',
                href: '/products/categories',
                icon: LibraryBig,
                permission: PERMISSIONS.CATEGORY_MANAGEMENT,
            },
            {
                name: 'Nguyên liệu',
                href: '/products/materials',
                icon: Wheat,
                permission: PERMISSIONS.INGREDIENT_MANAGEMENT,
                hidden: (user) => {
                    const role = user?.role?.toUpperCase().replace('ROLE_', '');
                    return role === 'KITCHEN_STAFF' || role === 'COORDINATOR';
                },
            },
            {
                name: 'Hóa đơn & Billing',
                href: '/billing',
                icon: FileText,
                permission: PERMISSIONS.BILLING_MANAGEMENT,
            },
            {
                name: 'Báo cáo doanh thu',
                href: '/reports',
                icon: BarChart,
                permission: PERMISSIONS.REVENUE_REPORTS,
            },
            {
                name: 'Quản lý kho',
                href: '/warehouse',
                icon: Store,
                permission: PERMISSIONS.PRODUCTION_SCHEDULE,
                hidden: (user) => {
                    const role = user?.role?.toUpperCase().replace('ROLE_', '');
                    return role !== 'MANAGER' && role !== 'COORDINATOR';
                },
            },
        ]
    },
    // SECTION: ADMIN
    {
        category: 'Hệ thống',
        items: [
            {
                name: 'Người dùng',
                href: '/users',
                icon: Users,
                permission: PERMISSIONS.USER_MANAGEMENT,
            },
            {
                name: 'Vai trò & Quyền',
                href: '/users/roles',
                icon: Shield,
                permission: PERMISSIONS.ROLE_PERMISSION_MANAGEMENT,
            },
            {
                name: 'Cửa hàng',
                href: '/stores',
                icon: Store,
                permission: PERMISSIONS.STORE_MANAGEMENT,
            },
        ]
    }
];

// ─── Main Layout ──────────────────────────────────────────────────────────────

export const MainLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Filter and flatten navigation items
    const flattenedNavigation = navigation.reduce((acc: NavItem[], nav) => {
        if ('category' in nav) {
            const visibleItems = nav.items.filter(item => {
                const isPermissionOk = !item.permission || hasPermission(user, item.permission);
                const isNotHidden = typeof item.hidden === 'function' ? !item.hidden(user) : !item.hidden;
                return isPermissionOk && isNotHidden;
            });
            return [...acc, ...visibleItems];
        }
        const isPermissionOk = !nav.permission || hasPermission(user, nav.permission);
        const isNotHidden = typeof nav.hidden === 'function' ? !nav.hidden(user) : !nav.hidden;
        return isPermissionOk && isNotHidden ? [...acc, nav] : acc;
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 flex">
            {/* Sidebar */}
            <div
                id="sidebar"
                className={cn(
                    "bg-[#080808]/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] fixed h-full z-20 hidden md:flex flex-col transition-all duration-500 ease-in-out border-r border-white/5",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                {/* Header */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 relative z-10">
                            <img src="/logo.svg" alt="SteakChain Logo" className="w-8 h-8 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                            <span className="text-xl font-black bg-clip-text tracking-tighter uppercase italic flex flex-col justify-center leading-none">
                                <div>
                                    <span className="text-amber-500 drop-shadow-md">Steak</span>
                                    <span className="text-amber-500 drop-shadow-md">Chain</span>
                                </div>
                                <span className="text-stone-400 font-bold text-[9px] mt-0.5 tracking-[0.2em] not-italic">Franchise System</span>
                            </span>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto hover:scale-110 transition-transform cursor-pointer" onClick={() => setIsCollapsed(false)}>
                            <img src="/logo.svg" alt="SteakChain Logo" className="w-8 h-8 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        </div>
                    )}

                    {!isCollapsed && (
                        <button
                            id="collapse-sidebar-btn"
                            onClick={() => setIsCollapsed(true)}
                            className="p-2 rounded-xl text-stone-500 hover:bg-white/5 hover:text-amber-500 transition-all active:scale-95"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}
                </div>

                {/* Collapsed Toggle Button */}
                {isCollapsed && (
                    <button
                        id="expand-sidebar-btn"
                        onClick={() => setIsCollapsed(false)}
                        className="absolute -right-3 top-24 bg-amber-500 border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] p-1 rounded-full text-black hover:scale-125 z-50 transition-all active:scale-95"
                    >
                        <ChevronRight size={14} />
                    </button>
                )}

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-4 no-scrollbar">
                    {flattenedNavigation.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.href}
                                id={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                                to={item.href}
                                end={true}
                                title={isCollapsed ? item.name : undefined}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-300 group relative overflow-hidden',
                                        isCollapsed ? 'justify-center mx-1' : '',
                                        isActive
                                            ? 'bg-gradient-to-r from-amber-500/10 to-transparent text-amber-500 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.02)]'
                                            : 'text-stone-500 hover:text-stone-200 hover:bg-white/[0.03]'
                                    )
                                }
                            >
                                {/* Active Background Glow */}
                                <NavLink
                                    to={item.href}
                                    end={true}
                                    className={({ isActive }) =>
                                        isActive
                                            ? "absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-100 transition-opacity duration-700"
                                            : "absolute inset-0 opacity-0"
                                    }
                                />

                                <Icon className={cn(
                                    "h-5 w-5 shrink-0 transition-all duration-500 relative z-10",
                                    "group-hover:scale-110 group-active:scale-95",
                                    !isCollapsed && "mr-3"
                                )} />

                                {!isCollapsed && (
                                    <span className="flex-1 truncate relative z-10 tracking-tight">{item.name}</span>
                                )}

                                {/* Active Indicator Bar */}
                                <NavLink
                                    to={item.href}
                                    end={true}
                                    className={({ isActive }) =>
                                        isActive
                                            ? cn(
                                                "absolute h-6 w-1 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all duration-500",
                                                isCollapsed ? "left-0" : "left-0"
                                            )
                                            : "hidden"
                                    }
                                />
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Footer / User Profile */}
                <div className="p-4 border-t border-white/5 bg-white/[0.01] backdrop-blur-md">
                    <div
                        id="user-profile-trigger"
                        className={cn(
                            "flex items-center cursor-pointer hover:bg-white/5 p-3 rounded-[1.25rem] transition-all border border-transparent hover:border-white/10 group",
                            isCollapsed ? "justify-center" : "px-3"
                        )}
                        onClick={() => navigate('/profile')}
                        title="Hồ sơ cá nhân"
                    >
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black shadow-lg shadow-amber-500/10 group-hover:rotate-3 group-hover:scale-110 transition-all duration-500">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        {!isCollapsed && (
                            <div className="ml-4 overflow-hidden">
                                <p className="text-sm font-black text-stone-100 truncate italic uppercase tracking-tighter">{user?.name || 'Người dùng'}</p>
                                <p className="text-[10px] text-stone-500 truncate font-black uppercase tracking-widest mt-0.5">
                                    {user?.role?.replace('ROLE_', '').replace('_', ' ') || ''}
                                </p>
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <button
                            id="logout-btn"
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/80 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-95 italic border border-transparent hover:border-rose-500/20"
                        >
                            <LogOut className="mr-3 h-4 w-4" />
                            Đăng xuất hệ thống
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div
                className={cn(
                    "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
                    "md:ml-64",
                    isCollapsed && "md:ml-20"
                )}
            >
                <header className="h-16 bg-zinc-900 shadow-sm flex items-center gap-2 px-4 md:px-8 border-b border-zinc-800 md:hidden z-10 sticky top-0">
                    <img src="/logo.svg" alt="Logo" className="w-8 h-8 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    <span className="text-lg font-black tracking-tight uppercase italic">
                        <span className="text-amber-500">Steak</span>
                        <span className="text-amber-500">Chain</span>
                    </span>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-auto w-full max-w-[1600px] mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
