export interface CategoryResponse {
    id: number;
    name: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryRequest {
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
