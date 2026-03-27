import axiosClient from './axiosClient';
import type {
    CreateShipmentRequest,
    ConfirmDeliveryRequest,
    ShipmentResponse,
    ShipmentQueryParams
} from '../types/shipment';

interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    timestamp: string;
}

interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export const shipmentApi = {
    /** POST /shipments — Coordinator tạo shipment */
    createShipment: async (data: CreateShipmentRequest): Promise<ShipmentResponse> => {
        const response = await axiosClient.post<ApiResponse<ShipmentResponse>>('/shipments', data);
        return response.data.data;
    },

    /** PATCH /shipments/:id/prepare — Kitchen staff chuẩn bị hàng xong */
    prepareShipment: async (id: number): Promise<ShipmentResponse> => {
        const response = await axiosClient.patch<ApiResponse<ShipmentResponse>>(`/shipments/${id}/prepare`);
        return response.data.data;
    },

    /** PATCH /shipments/:id/transit — Coordinator xuất kho → đang giao */
    startTransit: async (id: number): Promise<ShipmentResponse> => {
        const response = await axiosClient.patch<ApiResponse<ShipmentResponse>>(`/shipments/${id}/transit`);
        return response.data.data;
    },

    /** PATCH /shipments/:id/confirm — Store staff xác nhận nhận hàng */
    confirmDelivery: async (id: number, data?: ConfirmDeliveryRequest): Promise<ShipmentResponse> => {
        const response = await axiosClient.patch<ApiResponse<ShipmentResponse>>(`/shipments/${id}/confirm`, data || {});
        return response.data.data;
    },

    /** PATCH /shipments/:id/cancel — Coordinator hủy shipment */
    cancelShipment: async (id: number, reason?: string): Promise<ShipmentResponse> => {
        const response = await axiosClient.patch<ApiResponse<ShipmentResponse>>(
            `/shipments/${id}/cancel`,
            null,
            { params: { reason: reason || 'No reason provided' } }
        );
        return response.data.data;
    },

    /** GET /shipments/:id — Xem chi tiết shipment */
    getShipmentById: async (id: number): Promise<ShipmentResponse> => {
        const response = await axiosClient.get<ApiResponse<ShipmentResponse>>(`/shipments/${id}`);
        return response.data.data;
    },

    /** GET /shipments — Danh sách shipments (paginated, filterable) */
    getShipments: async (params?: ShipmentQueryParams): Promise<PageResponse<ShipmentResponse>> => {
        const response = await axiosClient.get<ApiResponse<PageResponse<ShipmentResponse>>>('/shipments', { params });
        return response.data.data;
    },

    /** PATCH /shipments/:shipmentId/stops/:stopId/confirm — Store staff xác nhận nhận hàng cho một điểm dừng */
    confirmStopDelivery: async (shipmentId: number, stopId: number, data: ConfirmDeliveryRequest): Promise<ShipmentResponse> => {
        const response = await axiosClient.patch<ApiResponse<ShipmentResponse>>(`/shipments/${shipmentId}/stops/${stopId}/confirm`, data);
        return response.data.data;
    }
};
