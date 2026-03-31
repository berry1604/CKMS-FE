import axiosClient from './axiosClient';
import type { ApiResponse, GeocodeItem, ReverseGeocodeParams } from '../types/geocode';

export const geocodeApi = {
    reverseGeocode: async (params: ReverseGeocodeParams, signal?: AbortSignal): Promise<GeocodeItem[]> => {
        const response = await axiosClient.get<ApiResponse<GeocodeItem[]>>('/geocode/reverse', {
            params: {
                latitude: params.latitude,
                longitude: params.longitude,
                limit: params.limit ?? 1,
                hasDeprecatedAdministrativeUnit: params.hasDeprecatedAdministrativeUnit,
                hasVnid: params.hasVnid,
            },
            signal,
        });

        return response.data?.data ?? [];
    },
};
