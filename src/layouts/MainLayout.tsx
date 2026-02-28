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

export const MainLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Users', href: '/users', icon: Users, roles: ['ADMIN'] },
        { name: 'Roles', href: '/users/roles', icon: Shield, roles: ['ADMIN'] },
        { name: 'Franchise Stores', href: '/stores', icon: Store, roles: ['ADMIN', 'MANAGER'] },
        { name: 'Production Plan', href: '/kitchen', icon: ChefHat, roles: ['ADMIN', 'MANAGER', 'KITCHEN_STAFF'] },
        { name: 'Kitchen Inventory', href: '/kitchen/inventory', icon: Database, roles: ['ADMIN', 'MANAGER', 'KITCHEN_STAFF'] },
        { name: 'Products', href: '/products', icon: Package, roles: ['ADMIN', 'MANAGER', 'KITCHEN_STAFF'] },
        { name: 'Categories', href: '/products/categories', icon: Tags, roles: ['ADMIN', 'MANAGER'] },
        { name: 'Materials', href: '/products/materials', icon: Layers, roles: ['ADMIN', 'MANAGER', 'KITCHEN_STAFF'] },
        { name: 'Recipes', href: '/products/recipes', icon: ClipboardList, roles: ['ADMIN', 'MANAGER', 'KITCHEN_STAFF'] },
        { name: 'Warehouse Fulfillment', href: '/warehouse/fulfillment', icon: Warehouse, roles: ['ADMIN', 'MANAGER'] },
        { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'STORE_STAFF'] },
        { name: 'Billing', href: '/billing', icon: FileText, roles: ['ADMIN', 'MANAGER'] },
        { name: 'Shipment', href: '/shipment', icon: Truck, roles: ['ADMIN', 'SUPPLY_COORDINATOR'] },
        { name: 'Reports', href: '/reports', icon: BarChart, roles: ['ADMIN', 'MANAGER'] },
    ];



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

                {/* Collapsed Toggle Button (Floating when collapsed) */}
                {isCollapsed && (
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="absolute -right-3 top-20 bg-zinc-800 border border-zinc-700 shadow-sm p-1 rounded-full text-gray-400 hover:text-amber-500 z-50 transform hover:scale-110 transition-all"
                    >
                        <ChevronRight size={14} />
                    </button>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2 custom-scrollbar">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        // Check access: true if no roles defined, or if user has one of the required roles
                        const userRoleStr = typeof user?.role === 'string' ? user.role.replace('ROLE_', '') : '';
                        const hasAccess = !item.roles || (userRoleStr && item.roles.includes(userRoleStr as any));

                        return (
                            <NavLink
                                key={item.name}
                                to={hasAccess ? item.href : '#'}
                                onClick={(e) => {
                                    if (!hasAccess) {
                                        e.preventDefault();
                                    }
                                }}
                                title={isCollapsed ? item.name : undefined}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative',
                                        isCollapsed ? 'justify-center' : '',
                                        hasAccess
                                            ? (isActive ? 'bg-amber-500/10 text-amber-500 shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200')
                                            : 'opacity-40 cursor-not-allowed text-gray-600 pointer-events-none select-none'
                                    )
                                }
                            >
                                <Icon className={cn("h-5 w-5 transition-transform", hasAccess && "group-hover:scale-110", !isCollapsed && "mr-3")} />
                                {!isCollapsed && <span>{item.name}</span>}

                                {/* Active Indicator Bar */}
                                {isCollapsed && hasAccess && (
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
                        title="My Profile"
                    >
                        <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-sm">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        {!isCollapsed && (
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-semibold text-gray-200 truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.role?.replace('_', ' ') || ''}</p>
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-3 py-2 mt-3 text-sm font-medium text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="mr-3 h-4 w-4" />
                            Sign out
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
                    {/* Mobile menu button could go here */}
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-auto w-full max-w-[1600px] mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
