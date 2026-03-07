import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/classNames';
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
    Bell,
    Layers,
    Tags,
    ClipboardList,
    Warehouse,
    Shield,
    Database
} from 'lucide-react';

// ─── Permission Helper ────────────────────────────────────────────────────────

/**
 * Returns true if the user has the given privilege OR if no privilege is required (public item).
 * Also returns true if the user is ADMIN (admin sees everything).
 */
function hasPermission(
    _authorities: string[] | undefined,
    _role: any | undefined,
    _requiredPrivilege: string | null
): boolean {
    return true;
}

// ─── Navigation Config ────────────────────────────────────────────────────────

const navigation = [
    {
        name: 'Tổng quan',
        href: '/',
        icon: LayoutDashboard,
        privilege: null, // Everyone sees dashboard
    },
    {
        name: 'Thông báo',
        href: '/notifications',
        icon: Bell,
        privilege: null, // Everyone sees notifications
    },
    {
        name: 'Người dùng',
        href: '/users',
        icon: Users,
        privilege: 'VIEW_USER',
    },
    {
        name: 'Vai trò & Quyền',
        href: '/users/roles',
        icon: Shield,
        privilege: 'VIEW_ROLE',
    },
    {
        name: 'Cửa hàng Nhượng quyền',
        href: '/stores',
        icon: Store,
        privilege: 'VIEW_STORE',
    },
    {
        name: 'Kho Cửa hàng',
        href: '/stores/inventory',
        icon: Database,
        privilege: 'VIEW_STORE_INVENTORY',
    },
    {
        name: 'Kế hoạch Sản xuất',
        href: '/kitchen',
        icon: ChefHat,
        privilege: 'VIEW_PRODUCTION_PLAN',
    },
    {
        name: 'Kho Bếp trung tâm',
        href: '/kitchen/inventory',
        icon: Database,
        privilege: 'VIEW_KITCHEN_INVENTORY',
    },
    {
        name: 'Sản phẩm',
        href: '/products',
        icon: Package,
        privilege: 'VIEW_PRODUCT',
    },
    {
        name: 'Danh mục',
        href: '/products/categories',
        icon: Tags,
        privilege: 'VIEW_CATEGORY',
    },
    {
        name: 'Nguyên liệu',
        href: '/products/materials',
        icon: Layers,
        privilege: 'VIEW_MATERIAL',
    },
    {
        name: 'Công thức',
        href: '/products/recipes',
        icon: ClipboardList,
        privilege: 'VIEW_RECIPE',
    },
    {
        name: 'Điều phối Kho',
        href: '/warehouse/fulfillment',
        icon: Warehouse,
        privilege: 'ORGANIZE_PRODUCTION',
    },
    {
        name: 'Đơn hàng',
        href: '/orders',
        icon: ShoppingCart,
        privilege: 'VIEW_STORE_ORDER',
    },
    {
        name: 'Thanh toán & Hóa đơn',
        href: '/billing',
        icon: FileText,
        privilege: 'VIEW_BILLING',
    },
    {
        name: 'Giao hàng',
        href: '/shipment',
        icon: Truck,
        privilege: 'VIEW_SHIPMENT',
    },
    {
        name: 'Báo cáo',
        href: '/reports',
        icon: BarChart,
        privilege: 'VIEW_REPORT',
    },
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

    // Filter navigation items to only those the user has permission for
    const visibleNavigation = navigation.filter((item) =>
        hasPermission(user?.authorities, user?.role, item.privilege)
    );

    return (
        <div className="min-h-screen bg-zinc-950 flex">
            {/* Sidebar */}
            <div
                className={cn(
                    "bg-zinc-900 shadow-xl fixed h-full z-20 hidden md:flex flex-col transition-all duration-300 ease-in-out border-r border-zinc-800",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
                    {!isCollapsed && (
                        <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent truncate">
                            FranchiseSys
                        </span>
                    )}
                    {isCollapsed && (
                        <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold mx-auto">
                            F
                        </div>
                    )}

                    {!isCollapsed && (
                        <button
                            onClick={() => setIsCollapsed(true)}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-zinc-800 hover:text-gray-300 transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}
                </div>

                {/* Collapsed Toggle Button */}
                {isCollapsed && (
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="absolute -right-3 top-20 bg-zinc-800 border border-zinc-700 shadow-sm p-1 rounded-full text-gray-400 hover:text-amber-500 z-50 transform hover:scale-110 transition-all"
                    >
                        <ChevronRight size={14} />
                    </button>
                )}

                <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2 custom-scrollbar">
                    {visibleNavigation.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                title={isCollapsed ? item.name : undefined}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative',
                                        isCollapsed ? 'justify-center' : '',
                                        isActive ? 'bg-amber-500/10 text-amber-500 shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                    )
                                }
                            >
                                <Icon className={cn("h-5 w-5 transition-transform", "group-hover:scale-110", !isCollapsed && "mr-3")} />
                                {!isCollapsed && (
                                    <span className="flex-1 truncate">{item.name}</span>
                                )}

                                {/* Active Indicator Bar (collapsed mode) */}
                                {isCollapsed && (
                                    <NavLink
                                        to={item.href}
                                        className={({ isActive }) => isActive ? "absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-amber-600 rounded-r-full" : "hidden"}
                                    />
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Footer / User Profile */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                    <div
                        className={cn(
                            "flex items-center cursor-pointer hover:bg-zinc-800 p-2 rounded-xl transition-all border border-transparent hover:border-zinc-700 hover:shadow-sm",
                            isCollapsed ? "justify-center" : "px-3"
                        )}
                        onClick={() => navigate('/profile')}
                        title="Hồ sơ cá nhân"
                    >
                        <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-sm">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        {!isCollapsed && (
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-semibold text-gray-200 truncate">{user?.name || 'Người dùng'}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.role?.replace('ROLE_', '').replace('_', ' ') || ''}</p>
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-3 py-2 mt-3 text-sm font-medium text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="mr-3 h-4 w-4" />
                            Đăng xuất
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
                <header className="h-16 bg-zinc-900 shadow-sm flex items-center justify-between px-4 md:px-8 border-b border-zinc-800 md:hidden z-10 sticky top-0">
                    <span className="text-lg font-bold text-amber-500">FranchiseSys</span>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-auto w-full max-w-[1600px] mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
