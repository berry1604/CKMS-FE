export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'COORDINATOR' | 'STORE_STAFF' | 'KITCHEN_STAFF' | 'SUPPLY_COORDINATOR' | string;

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
}

export interface CreateUserRequest {
    email: string;
    fullName: string;
    roleId: number;
    storeId?: number;
    kitchenId?: number;
}

export interface CreateUserResponse {
    id: number;
    username: string;
    email: string;
    roleName: string;
    isActive: boolean;
}

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    fullName: string;
    roleName: string;
    storeId?: number;
    storeName?: string;
    kitchenId?: number;
    kitchenName?: string;
    isActive: boolean;
    createdAt?: string;
}

export interface GetUsersParams {
    page?: number;
    size?: number;
    role?: string;
    status?: string;
    search?: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    token: string | null;
}
