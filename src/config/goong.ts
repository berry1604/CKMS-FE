export const goongConfig = {
    apiKey: import.meta.env.VITE_GOONG_API_KEY ?? '',
    mapKey: import.meta.env.VITE_GOONG_MAP_KEY ?? '',
};

export const isGoongConfigured = Boolean(goongConfig.apiKey && goongConfig.mapKey);

export const GOONG_DEFAULT_CENTER: [number, number] = [105.85242472181584, 21.029579719995272];
export const GOONG_DEFAULT_ZOOM = 13;
