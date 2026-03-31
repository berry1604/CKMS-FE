import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import type { User } from "../types/user";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../utils/classNames";
import logo from "../assets/logo-in.png";
import {
  PERMISSIONS,
  hasPermission,
  type Permission,
} from "../config/permissions";
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
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

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
    name: "Tổng quan",
    href: "/",
    icon: LayoutDashboard,
    // Dashboard is available to any authenticated user
    permission: undefined,
  },
  // SECTION: FRANCHISE STORE
  {
    category: "Cửa hàng",
    headerPermission: [
      PERMISSIONS.CREATE_ORDER,
      PERMISSIONS.VIEW_MY_ORDERS,
      PERMISSIONS.RECEIVE_SHIPMENT,
    ],
    items: [
      {
        name: "Tạo đơn hàng",
        href: "/orders/create",
        icon: ShoppingCart,
        permission: PERMISSIONS.CREATE_ORDER,
      },
      {
        name: "Đơn hàng của tôi",
        href: "/orders",
        icon: FileText,
        permission: PERMISSIONS.VIEW_MY_ORDERS,
        hidden: (user) => {
          const role = user?.role?.toUpperCase().replace("ROLE_", "");
          return role === "KITCHEN_STAFF" || role === "COORDINATOR";
        },
      },
      {
        name: "Nhận hàng",
        href: "/shipment/receive",
        icon: Package,
        permission: PERMISSIONS.RECEIVE_SHIPMENT,
        hidden: (user) => {
          const role = user?.role?.toUpperCase().replace("ROLE_", "");
          return role === "KITCHEN_STAFF" || role === "COORDINATOR";
        },
      },
      {
        name: "Quản Lý Kho",
        href: "/stores/inventory",
        icon: Database,
        permission: PERMISSIONS.STORE_INVENTORY,
        hidden: (user) => {
          const role = user?.role?.toUpperCase().replace("ROLE_", "");
          return role === "ADMIN" || role === "MANAGER";
        },
      },
      {
        name: "Bếp trung tâm",
        href: "/warehouse",
        icon: ChefHat,
        permission: PERMISSIONS.STORE_INVENTORY,
        hidden: (user) => {
          const role = user?.role?.toUpperCase().replace("ROLE_", "");
          return role !== "ADMIN" && role !== "MANAGER";
        },
      },
    ],
  },
  // SECTION: COORDINATOR
  {
    category: "Điều phối",
    headerPermission: [
      PERMISSIONS.APPROVE_ORDERS,
      PERMISSIONS.PRODUCTION_PLANNING,
      PERMISSIONS.ALLOCATION_MANAGEMENT,
      PERMISSIONS.CREATE_SHIPMENT,
    ],
    items: [
      {
        name: "Duyệt đơn hàng",
        href: "/orders/approvals",
        icon: ClipboardList,
        permission: PERMISSIONS.APPROVE_ORDERS,
        hidden: (user) => {
          const role = user?.role?.toUpperCase().replace("ROLE_", "");
          return role === "KITCHEN_STAFF" || role === "ADMIN";
        },
      },
      {
        name: "Lập kế hoạch SX",
        href: "/kitchen/create-plan",
        icon: ChefHat,
        permission: PERMISSIONS.PRODUCTION_PLANNING,
        hidden: (user) => {
          const role = user?.role?.toUpperCase().replace("ROLE_", "");
          return role === "KITCHEN_STAFF" || role === "ADMIN";
        },
      },
      {
        name: "Lịch sản xuất",
        href: "/kitchen",
        icon: LayoutDashboard,
        permission: PERMISSIONS.PRODUCTION_SCHEDULE,
        hidden: (user) =>
          user?.role?.toUpperCase().replace("ROLE_", "") === "MANAGER",
      },
      {
        name: "Phân bổ hàng",
        href: "/warehouse/allocation",
        icon: Network,
        permission: PERMISSIONS.ALLOCATION_MANAGEMENT,
        hidden: (user) =>
          user?.role?.toUpperCase().replace("ROLE_", "") === "KITCHEN_STAFF",
      },
      {
        name: "Vận chuyển",
        href: "/shipment",
        icon: Truck,
        permission: [PERMISSIONS.CREATE_SHIPMENT, PERMISSIONS.PREPARE_SHIPMENT],
      },
    ],
  },
  // SECTION: MANAGER
  {
    category: "Quản lý",
    headerPermission: [
      PERMISSIONS.CATEGORY_MANAGEMENT,
      PERMISSIONS.BILLING_MANAGEMENT,
      PERMISSIONS.REVENUE_REPORTS,
      PERMISSIONS.PRODUCTION_SCHEDULE,
    ],
    items: [
      {
        name: "Kho nguyên liệu",
        href: "/kitchen/inventory",
        icon: Database,
        permission: PERMISSIONS.MATERIAL_INVENTORY,
        hidden: (user) => {
          const role = user?.role?.toUpperCase().replace("ROLE_", "");
          return role === "MANAGER" || role === "COORDINATOR";
        },
      },
      {
        name: "Cửa hàng",
        href: "/stores",
        icon: Store,
        permission: PERMISSIONS.STORE_MANAGEMENT,
        hidden: (user) => {
          const role = user?.role?.toUpperCase().replace("ROLE_", "");
          return role !== "MANAGER" && role !== "ADMIN";
        },
      },
      {
        name: "Sản phẩm & Menu",
        href: "/products",
        icon: Package,
        permission: PERMISSIONS.PRODUCT_MANAGEMENT,
        hidden: (user) => {
          const role = user?.role?.toUpperCase().replace("ROLE_", "");
          return role === "KITCHEN_STAFF" || role === "COORDINATOR";
        },
      },
      {
        name: "Danh mục",
        href: "/products/categories",
        icon: LibraryBig,
        permission: PERMISSIONS.CATEGORY_MANAGEMENT,
      },
      {
        name: "Nguyên liệu",
        href: "/products/materials",
        icon: Wheat,
        permission: PERMISSIONS.INGREDIENT_MANAGEMENT,
        hidden: (user) => {
          const role = user?.role?.toUpperCase().replace("ROLE_", "");
          return role === "KITCHEN_STAFF" || role === "COORDINATOR";
        },
      },
      {
        name: "Hóa đơn & Billing",
        href: "/billing",
        icon: FileText,
        permission: PERMISSIONS.BILLING_MANAGEMENT,
      },
      {
        name: "Báo cáo doanh thu",
        href: "/reports",
        icon: BarChart,
        permission: PERMISSIONS.REVENUE_REPORTS,
        hidden: (user) =>
          user?.role?.toUpperCase().replace("ROLE_", "") === "ADMIN",
      },
      {
        name: "Quản lý kho bếp",
        href: "/warehouse",
        icon: Store,
        permission: PERMISSIONS.PRODUCTION_SCHEDULE,
        hidden: (user) => {
          const role = user?.role?.toUpperCase().replace("ROLE_", "");
          return role !== "COORDINATOR";
        },
      },
    ],
  },
  // SECTION: ADMIN
  {
    category: "Hệ thống",
    items: [
      {
        name: "Người dùng",
        href: "/users",
        icon: Users,
        permission: PERMISSIONS.USER_MANAGEMENT,
      },
      {
        name: "Vai trò & Quyền",
        href: "/users/roles",
        icon: Shield,
        permission: PERMISSIONS.ROLE_PERMISSION_MANAGEMENT,
      },
      {
        name: "Cửa hàng",
        href: "/stores",
        icon: Store,
        permission: PERMISSIONS.STORE_MANAGEMENT,
        hidden: true, // Hidden because Quản lý Cửa hàng covers this
      },
    ],
  },
];

// ─── Main Layout ──────────────────────────────────────────────────────────────

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Filter and flatten navigation items
  let flattenedNavigation = navigation.reduce((acc: NavItem[], nav) => {
    if ("category" in nav) {
      const visibleItems = nav.items.filter((item) => {
        const isPermissionOk =
          !item.permission || hasPermission(user, item.permission);
        const isNotHidden =
          typeof item.hidden === "function" ? !item.hidden(user) : !item.hidden;
        return isPermissionOk && isNotHidden;
      });
      return [...acc, ...visibleItems];
    }
    const isPermissionOk =
      !nav.permission || hasPermission(user, nav.permission);
    const isNotHidden =
      typeof nav.hidden === "function" ? !nav.hidden(user) : !nav.hidden;
    return isPermissionOk && isNotHidden ? [...acc, nav] : acc;
  }, []);

  if (user?.role?.toUpperCase().replace("ROLE_", "") === "ADMIN") {
    const adminOrder = [
      "Tổng quan",
      "Người dùng",
      "Cửa hàng",
      "Bếp trung tâm",
      "Vai trò & Quyền",
      "Lịch sản xuất",
      "Hóa đơn & Billing",
    ];
    flattenedNavigation.sort((a, b) => {
      let indexA = adminOrder.indexOf(a.name);
      let indexB = adminOrder.indexOf(b.name);
      if (indexA === -1) indexA = 999;
      if (indexB === -1) indexB = 999;
      return indexA - indexB;
    });
  }

  return (
    <div className="min-h-screen bg-[var(--bg-root)] flex transition-colors duration-300">
      {/* Sidebar */}
      <div
        id="sidebar"
        className={cn(
          "bg-[var(--bg-card)] backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.2)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] fixed h-full z-20 hidden md:flex flex-col transition-all duration-500 ease-in-out border-r border-[var(--border-primary)]",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        {/* Header Branding */}
        <div className={cn(
          "h-24 flex items-center border-b border-[var(--border-primary)] relative overflow-hidden transition-all duration-500",
          isCollapsed ? "justify-center px-0" : "justify-between px-6"
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-30"></div>

          <div
            className={cn(
              "flex items-center gap-3 relative z-10 transition-all duration-500 cursor-pointer",
              isCollapsed ? "flex-col gap-0" : "flex-row"
            )}
            onClick={() => isCollapsed && setIsCollapsed(false)}
          >
            {/* Bull Icon in Orange Rounded Box */}
            <div className={cn(
              "relative bg-amber-500 rounded-2xl overflow-hidden transition-all duration-500 group-hover:bg-amber-400 group-hover:scale-110 flex items-center justify-center",
              isCollapsed ? "w-14 h-14 p-2.5" : "w-11 h-11 p-2"
            )}>
              <img
                src={logo}
                alt="Bull Icon"
                className="w-full h-full object-contain brightness-0 invert"
              />
            </div>

            {/* Typography Branding (Hidden when collapsed) */}
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                <span className="text-xl font-black tracking-widest uppercase leading-none">
                  <span className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">STEAK</span>
                  <span className="text-[var(--text-primary)]">CHAIN</span>
                </span>
                <span className="text-[8px] font-bold text-zinc-500 tracking-[0.4em] uppercase mt-1">
                  Management Sys
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1 relative z-20">
              <button
                id="collapse-sidebar-btn"
                onClick={() => setIsCollapsed(true)}
                className="p-2 rounded-xl text-stone-500 hover:bg-white/5 hover:text-amber-500 transition-all active:scale-95"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
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
                id={`nav-link-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                to={item.href}
                end={true}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-300 group relative overflow-hidden",
                    isCollapsed ? "justify-center mx-1" : "",
                    isActive
                      ? "bg-gradient-to-r from-amber-500/10 to-transparent text-[var(--accent-amber)] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.02)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5",
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

                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-all duration-500 relative z-10",
                    "group-hover:scale-110 group-active:scale-95",
                    !isCollapsed && "mr-3",
                  )}
                />

                {!isCollapsed && (
                  <span className="flex-1 truncate relative z-10 tracking-tight">
                    {item.name}
                  </span>
                )}

                {/* Active Indicator Bar */}
                <NavLink
                  to={item.href}
                  end={true}
                  className={({ isActive }) =>
                    isActive
                      ? cn(
                        "absolute h-6 w-1 bg-[var(--accent-amber)] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.4)] transition-all duration-500",
                        isCollapsed ? "left-0" : "left-0",
                      )
                      : "hidden"
                  }
                />
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-[var(--border-primary)] bg-white/[0.01] dark:bg-black/20 backdrop-blur-md">
          <div
            id="user-profile-trigger"
            className={cn(
              "flex items-center cursor-pointer hover:bg-white/5 p-3 rounded-[1.25rem] transition-all border border-transparent hover:border-white/10 group",
              isCollapsed ? "justify-center" : "px-3",
            )}
            onClick={() => navigate("/profile")}
            title="Hồ sơ cá nhân"
          >
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black shadow-lg shadow-amber-500/10 group-hover:rotate-3 group-hover:scale-110 transition-all duration-500">
              {user?.name?.charAt(0) || "U"}
            </div>
            {!isCollapsed && (
              <div className="ml-4 overflow-hidden">
                <p className="text-sm font-black text-[var(--text-primary)] truncate italic uppercase tracking-tighter">
                  {user?.name || "Người dùng"}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] truncate font-black uppercase tracking-widest mt-0.5">
                  {user?.role?.replace("ROLE_", "").replace("_", " ") || ""}
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
          isCollapsed && "md:ml-20",
        )}
      >
        <header className="h-16 bg-[var(--bg-card)] shadow-sm flex items-center justify-between px-4 md:px-8 border-b border-[var(--border-primary)] md:hidden z-10 sticky top-0 backdrop-blur-md">
          <img
            src={logo}
            alt="Logo"
            className="h-9 w-auto [filter:drop-shadow(0_0_12px_rgba(245,158,11,0.4))_brightness(1.2)]"
          />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-500/10 hover:text-[var(--accent-amber)] transition-all active:scale-95"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Premium Floating Theme Toggle */}
      <div className="fixed top-8 right-8 z-50 hidden md:block animate-in fade-in slide-in-from-top-4 duration-1000">
        <button
          onClick={toggleTheme}
          className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--bg-card)]/80 backdrop-blur-2xl border border-[var(--border-primary)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:border-amber-500/50 transition-all duration-500 hover:scale-110 active:scale-95 overflow-hidden"
          title={theme === 'light' ? "Chuyển sang chế độ tối" : "Chuyển sang chế độ sáng"}
        >
          {/* Animated glow background */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Icon with rotation animation */}
          <div className="relative z-10 transition-transform duration-700 ease-out group-hover:rotate-[135deg]">
            {theme === 'light' ? (
              <Moon size={24} className="text-slate-600 group-hover:text-amber-600 drop-shadow-sm transition-colors duration-500" strokeWidth={1.5} />
            ) : (
              <Sun size={24} className="text-amber-100 group-hover:text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-colors duration-500" strokeWidth={1.5} />
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
