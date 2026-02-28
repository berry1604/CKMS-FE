export interface Privilege {
    id: number;
    name: string;
    description?: string;
}

export interface RoleResponse {
    roleId: number;
    roleName: string;
    privileges: Privilege[];
}

export interface CreateRoleRequest {
    roleName: string;
    privilegeIds: number[];
}

export interface UpdateRoleRequest {
    roleName: string;
    privilegeIds?: number[];
}

export interface RoleApiResponse<T> {
    status: number;
    message: string;
    data: T;
    timestamp: string;
}
