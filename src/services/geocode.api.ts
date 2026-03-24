import axiosClient from './axiosClient';

export interface GeocodeResult {
  placeId: string;
  formattedAddress: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface GeocodeResponse {
  status: number;
  message: string;
  data: GeocodeResult[];
}

export interface ReverseGeocodeResponse {
  status: number;
  message: string;
  data: GeocodeResult;
}

/**
 * Forward geocode - convert address to coordinates
 * @param address - The address to search for
 * @returns List of geocoding results
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult[]> {
  try {
    const response = await axiosClient.get<GeocodeResponse>(
      '/api/v1/geocode/forward',
      {
        params: { address }
      }
    );
    return response.data?.data ?? [];
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

/**
 * Reverse geocode - convert coordinates to address
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Geocoding result with address
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeResult | null> {
  try {
    const response = await axiosClient.get<ReverseGeocodeResponse>(
      '/api/v1/geocode/reverse',
      {
        params: { lat: latitude, lng: longitude }
      }
    );
    return response.data?.data ?? null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}
