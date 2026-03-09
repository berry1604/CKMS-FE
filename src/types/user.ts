export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'COORDINATOR' | 'STORE_STAFF' | 'KITCHEN_STAFF' | 'SUPPLY_COORDINATOR' | string;

export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'DELETED';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    authorities?: string[];
    avatarUrl?: string;
    phone?: string;
    address?: string;
    bio?: string;
    joinDate?: string;
    isActive?: boolean;
    status?: UserStatus;
    storeId?: number;
    storeName?: string;
    kitchenId?: number;
    kitchenName?: string;
}

export interface CreateUserRequest {
    email: string;
    fullName: string;
    roleId: number;
    storeId?: number;
    kitchenId?: number;
}

export interface CreateUserResponse {
    username: string;
    email: string;
    fullName: string;
    token: string;
    message: string;
}

export interface UserResponse {
    userId: number;
    username: string;
    email: string;
    fullName: string;
    roleName: string;
    storeId?: number;
    storeName?: string;
    kitchenId?: number;
    kitchenName?: string;
    isActive: boolean;
    status: string;
    createdAt?: string;
}

export interface GetUsersParams {
    page?: number;
    size?: number;
    role?: string;
    status?: string;
    search?: string;
    storeId?: number;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    token: string | null;
}
