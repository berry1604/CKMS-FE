import type { User, UserRole } from '../types/user';

// ─── Permission Definitions ─────────────────────────────────────────────────────

export type Permission =
    | 'CREATE_ORDER'
    | 'VIEW_MY_ORDERS'
    | 'RECEIVE_SHIPMENT'
    | 'APPROVE_ORDERS'
    | 'PRODUCTION_PLANNING'
    | 'ALLOCATION_MANAGEMENT'
    | 'CREATE_SHIPMENT'
    | 'PRODUCTION_SCHEDULE'
    | 'MATERIAL_INVENTORY'
    | 'PRODUCT_MANAGEMENT'
    | 'CATEGORY_MANAGEMENT'
    | 'INGREDIENT_MANAGEMENT'
    | 'BILLING_MANAGEMENT'
    | 'REVENUE_REPORTS'
    | 'USER_MANAGEMENT'
    | 'ROLE_PERMISSION_MANAGEMENT'
    | 'STORE_MANAGEMENT'
    | 'ORGANIZE_PRODUCTION'
    | 'EXECUTE_PRODUCTION';

export const PERMISSIONS: Record<Permission, Permission> = {
    CREATE_ORDER: 'CREATE_ORDER',
    VIEW_MY_ORDERS: 'VIEW_MY_ORDERS',
    RECEIVE_SHIPMENT: 'RECEIVE_SHIPMENT',
    APPROVE_ORDERS: 'APPROVE_ORDERS',
    PRODUCTION_PLANNING: 'PRODUCTION_PLANNING',
    ALLOCATION_MANAGEMENT: 'ALLOCATION_MANAGEMENT',
    CREATE_SHIPMENT: 'CREATE_SHIPMENT',
    PRODUCTION_SCHEDULE: 'PRODUCTION_SCHEDULE',
    MATERIAL_INVENTORY: 'MATERIAL_INVENTORY',
    PRODUCT_MANAGEMENT: 'PRODUCT_MANAGEMENT',
    CATEGORY_MANAGEMENT: 'CATEGORY_MANAGEMENT',
    INGREDIENT_MANAGEMENT: 'INGREDIENT_MANAGEMENT',
    BILLING_MANAGEMENT: 'BILLING_MANAGEMENT',
    REVENUE_REPORTS: 'REVENUE_REPORTS',
    USER_MANAGEMENT: 'USER_MANAGEMENT',
    ROLE_PERMISSION_MANAGEMENT: 'ROLE_PERMISSION_MANAGEMENT',
    STORE_MANAGEMENT: 'STORE_MANAGEMENT',
    ORGANIZE_PRODUCTION: 'ORGANIZE_PRODUCTION',
    EXECUTE_PRODUCTION: 'EXECUTE_PRODUCTION',
};

// Limit roles here to the ones we actually map permissions for
type MappedRole =
    | 'STORE_STAFF'
    | 'COORDINATOR'
    | 'KITCHEN_STAFF'
    | 'MANAGER'
    | 'ADMIN';

// ─── Role → Permission Mapping ──────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<MappedRole, Permission[]> = {
    STORE_STAFF: [
        PERMISSIONS.CREATE_ORDER,
        PERMISSIONS.VIEW_MY_ORDERS,
        PERMISSIONS.RECEIVE_SHIPMENT,
    ],
    COORDINATOR: [
        PERMISSIONS.APPROVE_ORDERS,
        PERMISSIONS.PRODUCTION_PLANNING,
        PERMISSIONS.ALLOCATION_MANAGEMENT,
        PERMISSIONS.CREATE_SHIPMENT,
        PERMISSIONS.PRODUCTION_SCHEDULE,
        PERMISSIONS.ORGANIZE_PRODUCTION,
    ],
    KITCHEN_STAFF: [
        PERMISSIONS.PRODUCTION_SCHEDULE,
        PERMISSIONS.MATERIAL_INVENTORY,
        PERMISSIONS.PRODUCT_MANAGEMENT, // Cần để fetch data dropdown (đã ẩn mục này trong sidebar)
        PERMISSIONS.INGREDIENT_MANAGEMENT, // Cần để fetch data dropdown (đã ẩn mục này trong sidebar)
        PERMISSIONS.EXECUTE_PRODUCTION, // Quyền thực thi sản xuất (Bắt đầu nấu, Hoàn tất mẻ)
    ],
    MANAGER: [
        PERMISSIONS.PRODUCT_MANAGEMENT,
        PERMISSIONS.CATEGORY_MANAGEMENT,
        PERMISSIONS.INGREDIENT_MANAGEMENT,
        PERMISSIONS.BILLING_MANAGEMENT,
        PERMISSIONS.REVENUE_REPORTS,
        PERMISSIONS.MATERIAL_INVENTORY,
    ],
    ADMIN: [
        PERMISSIONS.USER_MANAGEMENT,
        PERMISSIONS.ROLE_PERMISSION_MANAGEMENT,
        PERMISSIONS.STORE_MANAGEMENT,
    ],
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function normalizeRole(role: UserRole | undefined | null): MappedRole | null {
    if (!role) return null;
    const clean = String(role).toUpperCase().replace(/^ROLE_/, '');
    if (['STORE_STAFF', 'COORDINATOR', 'KITCHEN_STAFF', 'MANAGER', 'ADMIN'].includes(clean)) {
        return clean as MappedRole;
    }
    return null;
}

function normalizeAuthorities(authorities?: string[]): string[] {
    if (!authorities) return [];
    return authorities.map(a => a.toUpperCase());
}

/**
 * Core permission check used across the app.
 * - First checks explicit authorities/privileges from backend.
 * - Then falls back to role → permission mapping.
 */
export function hasPermission(
    user: User | null | undefined,
    permission: Permission | Permission[]
): boolean {
    if (!user) return false;

    const requested = Array.isArray(permission) ? permission : [permission];
    if (requested.length === 0) return true;

    const upperRequested = requested.map(p => p.toUpperCase());

    // 1) Check explicit authorities/privileges coming from backend
    const authorities = normalizeAuthorities(user.authorities);
    if (authorities.length > 0) {
        const match = upperRequested.some(p => authorities.includes(p));
        if (match) return true;
    }

    // 2) Fallback: map from role → permissions
    const role = normalizeRole(user.role);
    if (!role) return false;

    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    const normalizedRolePerms = rolePermissions.map(p => p.toUpperCase());

    return upperRequested.some(p => normalizedRolePerms.includes(p));
}

