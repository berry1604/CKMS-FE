import axiosClient from './axiosClient';
import type {
    RoleResponse,
    CreateRoleRequest,
    UpdateRoleRequest,
    RoleApiResponse
} from '../types/role';

export const roleApi = {
    getAllRoles: async (): Promise<RoleResponse[]> => {
        const response = await axiosClient.get<RoleApiResponse<RoleResponse[]>>('/roles');
        return response.data.data;
    },

    getRoleById: async (id: number): Promise<RoleResponse> => {
        const response = await axiosClient.get<RoleApiResponse<RoleResponse>>(`/roles/${id}`);
        return response.data.data;
    },

    createRole: async (request: CreateRoleRequest): Promise<RoleResponse> => {
        const response = await axiosClient.post<RoleApiResponse<RoleResponse>>('/roles', request);
        return response.data.data;
    },

    updateRole: async (id: number, request: UpdateRoleRequest): Promise<RoleResponse> => {
        const response = await axiosClient.put<RoleApiResponse<RoleResponse>>(`/roles/${id}`, request);
        return response.data.data;
    },

    deleteRole: async (id: number): Promise<void> => {
        await axiosClient.delete(`/roles/${id}`);
    },

    assignPrivilegesToRole: async (roleId: number, privilegeIds: number[]): Promise<RoleResponse> => {
        const response = await axiosClient.post<RoleApiResponse<RoleResponse>>(
            `/roles/${roleId}/privileges`,
            privilegeIds
        );
        return response.data.data;
    },

    removePrivilegesFromRole: async (roleId: number, privilegeIds: number[]): Promise<RoleResponse> => {
        const response = await axiosClient.delete<RoleApiResponse<RoleResponse>>(
            `/roles/${roleId}/privileges`,
            { data: privilegeIds }
        );
        return response.data.data;
    }
};
