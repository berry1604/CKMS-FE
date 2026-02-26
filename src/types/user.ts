export type UserRole = 'ADMIN' | 'MANAGER' | 'SUPPLY_COORDINATOR' | 'KITCHEN_STAFF' | 'STORE_STAFF';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
    phone?: string;
    address?: string;
    bio?: string;
    joinDate?: string;
    isActive?: boolean;
}

export interface CreateUserRequest {
    username: string;
    email: string;
    fullName: string;
    roleId: number;
}

export interface CreateUserResponse {
    id: number;
    username: string;
    email: string;
    roleName: string;
    isActive: boolean;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    token: string | null;
}
