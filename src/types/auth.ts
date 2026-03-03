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
}

export interface ActivateAccountRequest {
    // fields based on backend
    token: string;
    // other fields if necessary
    [key: string]: any;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}
