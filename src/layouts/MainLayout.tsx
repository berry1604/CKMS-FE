import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
    Wheat
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavItem {
    name: string;
    href: string;
    icon: any;
    permission?: Permission | Permission[];
}

export interface NavGroup {
    category: string;
    items: NavItem[];
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
        category: 'Workspace: Cửa hàng',
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
            },
            {
                name: 'Nhận hàng',
                href: '/shipment/receive',
                icon: Package,
                permission: PERMISSIONS.RECEIVE_SHIPMENT,
            },
        ]
    },
    // SECTION: COORDINATOR
    {
        category: 'Workspace: Điều phối',
        items: [
            {
                name: 'Duyệt đơn hàng',
                href: '/orders/approvals',
                icon: ClipboardList,
                permission: PERMISSIONS.APPROVE_ORDERS,
            },
            {
                name: 'Lập kế hoạch SX',
                href: '/kitchen/create-plan',
                icon: ChefHat,
                permission: PERMISSIONS.PRODUCTION_PLANNING,
            },
            {
                name: 'Phân bổ hàng',
                href: '/warehouse/allocation',
                icon: Network,
                permission: PERMISSIONS.ALLOCATION_MANAGEMENT,
            },
            {
                name: 'Tạo Shipment',
                href: '/shipment/create',
                icon: Truck,
                permission: PERMISSIONS.CREATE_SHIPMENT,
            },
        ]
    },
    // SECTION: CENTRAL KITCHEN
    {
        category: 'Workspace: Bếp trung tâm',
        items: [
            {
                name: 'Lịch sản xuất',
                href: '/kitchen',
                icon: LayoutDashboard,
                permission: PERMISSIONS.PRODUCTION_SCHEDULE,
            },
            {
                name: 'Kho nguyên liệu',
                href: '/kitchen/inventory',
                icon: Database,
                permission: PERMISSIONS.MATERIAL_INVENTORY,
            },
        ]
    },
    // SECTION: MANAGER
    {
        category: 'Workspace: Quản lý',
        items: [
            {
                name: 'Sản phẩm & Menu',
                href: '/products',
                icon: Package,
                permission: PERMISSIONS.PRODUCT_MANAGEMENT,
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
        ]
    },
    // SECTION: ADMIN
    {
        category: 'Workspace: Hệ thống',
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

    // Filter navigation items to only those the user has permission for
    const filteredNavigation = navigation
        .map(nav => {
            if ('category' in nav) {
                const visibleItems = nav.items.filter(item =>
                    !item.permission || hasPermission(user, item.permission)
                );
                return visibleItems.length > 0 ? { ...nav, items: visibleItems } : null;
            }
            return !nav.permission || hasPermission(user, nav.permission) ? nav : null;
        })
        .filter((item): item is NavigationItem => item !== null);

    return (
        <div className="min-h-screen bg-zinc-950 flex">
            {/* Sidebar */}
            <div
                id="sidebar"
                className={cn(
                    "bg-zinc-900 shadow-xl fixed h-full z-20 hidden md:flex flex-col transition-all duration-300 ease-in-out border-r border-zinc-800",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800 focus-within:ring-1 focus-within:ring-amber-500">
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
                            id="collapse-sidebar-btn"
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
                        id="expand-sidebar-btn"
                        onClick={() => setIsCollapsed(false)}
                        className="absolute -right-3 top-20 bg-zinc-800 border border-zinc-700 shadow-sm p-1 rounded-full text-gray-400 hover:text-amber-500 z-50 transform hover:scale-110 transition-all"
                    >
                        <ChevronRight size={14} />
                    </button>
                )}

                <nav className="flex-1 p-3 space-y-4 overflow-y-auto mt-2 custom-scrollbar">
                    {filteredNavigation.map((group) => {
                        const isGroup = 'category' in group;
                        const items = isGroup ? group.items : [group];

                        return (
                            <div key={isGroup ? group.category : group.name} className="space-y-1">
                                {isGroup && !isCollapsed && (
                                    <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                        {group.category}
                                    </p>
                                )}

                                {items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink
                                            key={item.href}
                                            id={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                                            to={item.href}
                                            title={isCollapsed ? item.name : undefined}
                                            className={({ isActive }) =>
                                                cn(
                                                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative',
                                                    isCollapsed ? 'justify-center' : '',
                                                    isActive ? 'bg-amber-500/10 text-amber-500 shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                                )
                                            }
                                        >
                                            <Icon className={cn("h-5 w-5 shrink-0 transition-transform", "group-hover:scale-110", !isCollapsed && "mr-3")} />
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
                            </div>
                        );
                    })}
                </nav>

                {/* Footer / User Profile */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                    <div
                        id="user-profile-trigger"
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
                                <p className="text-xs text-gray-400 truncate uppercase tracking-tighter">
                                    {user?.role?.replace('ROLE_', '').replace('_', ' ') || ''}
                                    {user?.storeName ? ` • ${user.storeName}` : ''}
                                </p>
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <button
                            id="logout-btn"
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
