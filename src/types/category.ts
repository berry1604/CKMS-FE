export interface CategoryResponse {
    id: number;
    categoryId?: string; // or number based on backend, using string as safe fallback if it's an input code
    name: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryRequest {
    categoryId?: string;
    name: string;
    description?: string;
    status?: string;
}

export interface CategoryApiResponse<T> {
    status: number;
    message: string;
    data: T;
    timestamp: string;
}
