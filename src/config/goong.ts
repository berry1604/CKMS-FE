export const goongConfig = {
    apiKey: import.meta.env.VITE_GOONG_API_KEY ?? '',
    mapKey: import.meta.env.VITE_GOONG_MAP_KEY ?? '',
};

export const isGoongConfigured = Boolean(goongConfig.apiKey && goongConfig.mapKey);

export const GOONG_DEFAULT_CENTER: [number, number] = [106.80988826285073, 10.841074421690422];
export const GOONG_DEFAULT_ZOOM = 13;
