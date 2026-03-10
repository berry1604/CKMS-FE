export interface LoginRequest {
    username?: string;
    password?: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    // user info
    id?: number;
    username?: string;
    email?: string;
    roles?: string[];
    authorities?: string[];
    type?: string;
    expiresIn?: number;
    accessTokenExpiresIn?: number;
    userId?: number;
    storeId?: number;
    storeName?: string;
    kitchenId?: number;
    kitchenName?: string;
}

export interface ActivateAccountRequest {
    token: string;
    password?: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}
