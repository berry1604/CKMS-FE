export interface GeocodeItem {
    formattedAddress: string;
    placeId?: string;
    latitude: number;
    longitude: number;
    deprecatedDescription?: string;
}

export interface ReverseGeocodeParams {
    latitude: number;
    longitude: number;
    limit?: number;
    hasDeprecatedAdministrativeUnit?: boolean;
    hasVnid?: boolean;
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    timestamp?: string;
}
