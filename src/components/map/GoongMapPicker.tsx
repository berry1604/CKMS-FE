import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type LngLatBoundsLike, type Map as MapLibreMap, type Marker, type Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Navigation, Route, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { GOONG_DEFAULT_CENTER, GOONG_DEFAULT_ZOOM, goongConfig, isGoongConfigured } from '../../config/goong';
import { geocodeApi } from '../../services/geocode.api';

type GoongVehicle = 'car' | 'taxi' | 'bike' | 'trunk' | 'hd';

interface GoongPrediction {
    description: string;
    place_id: string;
}

type LocationChangeSource = 'search-select' | 'map-click' | 'marker-drag' | 'reverse';

interface GoongMapPickerProps {
    initialLngLat?: [number, number];
    initialAddress?: string;
    radiusInMeters?: number;
    zoom?: number;
    enableDirections?: boolean;
    className?: string;
    mapHeightClassName?: string;
    onLocationSelected?: (payload: {
        address: string;
        lngLat: [number, number];
        source?: LocationChangeSource;
    }) => void;
}

const MAP_STYLES = [
    { id: 'normal', name: 'Normal', url: 'https://tiles.goong.io/assets/goong_map_web.json' },
    { id: 'satellite', name: 'Satellite', url: 'https://tiles.goong.io/assets/goong_satellite.json' },
    { id: 'dark', name: 'Dark', url: 'https://tiles.goong.io/assets/goong_map_dark.json' },
    { id: 'light', name: 'Light', url: 'https://tiles.goong.io/assets/navigation_day.json' },
    { id: 'night', name: 'Night', url: 'https://tiles.goong.io/assets/navigation_night.json' },
] as const;

function drawCircle(center: [number, number], radiusInMeters: number) {
    const points = 64;
    const coords = {
        latitude: center[1],
        longitude: center[0],
    };

    const km = radiusInMeters / 1000;
    const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
    const distanceY = km / 110.574;
    const ring: [number, number][] = [];

    for (let i = 0; i < points; i += 1) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        ring.push([coords.longitude + x, coords.latitude + y]);
    }

    ring.push(ring[0]);
    return ring;
}

function decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let result = 0;
        let shift = 0;
        let b: number;

        do {
            b = encoded.charCodeAt(index) - 63;
            index += 1;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lat += dlat;

        result = 0;
        shift = 0;

        do {
            b = encoded.charCodeAt(index) - 63;
            index += 1;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lng += dlng;

        points.push([lng * 1e-5, lat * 1e-5]);
    }

    return points;
}

function getStyleUrl(path: string) {
    return `${path}?api_key=${goongConfig.mapKey}`;
}

function toLatLngString(input: string) {
    const [latRaw, lngRaw] = input.split(',').map((x) => x.trim());
    const lat = Number(latRaw);
    const lng = Number(lngRaw);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
    }

    return { lat, lng };
}

export function GoongMapPicker({
    initialLngLat,
    initialAddress,
    radiusInMeters = 500,
    zoom = GOONG_DEFAULT_ZOOM,
    enableDirections = true,
    className,
    mapHeightClassName = 'h-[360px]',
    onLocationSelected,
}: GoongMapPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const markerRef = useRef<Marker | null>(null);
    const popupRef = useRef<Popup | null>(null);
    const startMarkerRef = useRef<Marker | null>(null);
    const endMarkerRef = useRef<Marker | null>(null);

    const [search, setSearch] = useState(initialAddress ?? '');
    const [predictions, setPredictions] = useState<GoongPrediction[]>([]);
    const [selectedStyle, setSelectedStyle] = useState<(typeof MAP_STYLES)[number]['id']>('normal');
    const [selectedLngLat, setSelectedLngLat] = useState<[number, number]>(initialLngLat ?? GOONG_DEFAULT_CENTER);
    const [startInput, setStartInput] = useState('21.029579719995272,105.85242472181584');
    const [endInput, setEndInput] = useState('10.762622,106.660172');
    const [vehicle, setVehicle] = useState<GoongVehicle>('car');
    const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

    const suppressAutocompleteRef = useRef(false);
    const autocompleteAbortControllerRef = useRef<AbortController | null>(null);
    const reverseAbortControllerRef = useRef<AbortController | null>(null);
    const reverseRequestSeqRef = useRef(0);
    const reverseDebounceTimerRef = useRef<number | null>(null);

    const emitLocationSelected = (lngLat: [number, number], address: string | undefined, source: LocationChangeSource) => {
        setSelectedLngLat(lngLat);
        onLocationSelected?.({
            address: address ?? `${lngLat[1].toFixed(6)}, ${lngLat[0].toFixed(6)}`,
            lngLat,
            source,
        });
    };

    const reverseGeocodeAt = (lngLat: [number, number], source: LocationChangeSource) => {
        const requestSeq = reverseRequestSeqRef.current + 1;
        reverseRequestSeqRef.current = requestSeq;

        reverseAbortControllerRef.current?.abort();
        const controller = new AbortController();
        reverseAbortControllerRef.current = controller;

        geocodeApi
            .reverseGeocode(
                {
                    latitude: lngLat[1],
                    longitude: lngLat[0],
                    limit: 1,
                },
                controller.signal,
            )
            .then((items) => {
                if (requestSeq !== reverseRequestSeqRef.current) {
                    return;
                }

                const formattedAddress = items[0]?.formattedAddress?.trim();
                if (!formattedAddress) {
                    return;
                }

                suppressAutocompleteRef.current = true;
                setSearch(formattedAddress);
                emitLocationSelected(lngLat, formattedAddress, source);
            })
            .catch(() => {
                // Keep existing coordinates if reverse geocode fails.
            });
    };

    const pinLocation = (lngLat: [number, number], source: LocationChangeSource, shouldReverseGeocode: boolean) => {
        updateMarkerAndCircle(lngLat);
        emitLocationSelected(lngLat, undefined, source);

        if (!shouldReverseGeocode) {
            return;
        }

        if (reverseDebounceTimerRef.current) {
            window.clearTimeout(reverseDebounceTimerRef.current);
        }

        const delay = source === 'marker-drag' ? 250 : 0;
        reverseDebounceTimerRef.current = window.setTimeout(() => {
            reverseGeocodeAt(lngLat, 'reverse');
        }, delay);
    };

    const runWhenStyleReady = (fn: (map: MapLibreMap) => void) => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        if (map.isStyleLoaded()) {
            fn(map);
            return;
        }

        const onStyleData = () => {
            if (!map.isStyleLoaded()) {
                return;
            }
            map.off('styledata', onStyleData);
            fn(map);
        };

        map.on('styledata', onStyleData);
    };

    const styleUrl = useMemo(() => {
        const match = MAP_STYLES.find((x) => x.id === selectedStyle) ?? MAP_STYLES[0];
        return getStyleUrl(match.url);
    }, [selectedStyle]);

    useEffect(() => {
        if (!isGoongConfigured || !mapContainerRef.current || mapRef.current) {
            return;
        }

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: styleUrl,
            center: selectedLngLat,
            zoom,
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        mapRef.current = map;

        map.on('click', (event) => {
            const lngLat: [number, number] = [event.lngLat.lng, event.lngLat.lat];
            pinLocation(lngLat, 'map-click', true);
        });

        map.on('load', () => {
            updateMarkerAndCircle(selectedLngLat);
        });

        return () => {
            autocompleteAbortControllerRef.current?.abort();
            reverseAbortControllerRef.current?.abort();
            if (reverseDebounceTimerRef.current) {
                window.clearTimeout(reverseDebounceTimerRef.current);
            }
            markerRef.current?.remove();
            popupRef.current?.remove();
            startMarkerRef.current?.remove();
            endMarkerRef.current?.remove();
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoom]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }
        map.setStyle(styleUrl);
        runWhenStyleReady(() => {
            updateMarkerAndCircle(selectedLngLat);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [styleUrl]);

    useEffect(() => {
        setSearch(initialAddress ?? '');
    }, [initialAddress]);

    useEffect(() => {
        if (initialLngLat) {
            setSelectedLngLat(initialLngLat);
            updateMarkerAndCircle(initialLngLat);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialLngLat?.[0], initialLngLat?.[1]]);

    useEffect(() => {
        if (suppressAutocompleteRef.current) {
            suppressAutocompleteRef.current = false;
            return;
        }

        if (!search || search.trim().length < 2) {
            autocompleteAbortControllerRef.current?.abort();
            setPredictions([]);
            return;
        }

        const timer = window.setTimeout(async () => {
            const query = encodeURIComponent(search.trim());
            const apiLink = `https://rsapi.goong.io/place/autocomplete?api_key=${goongConfig.apiKey}&input=${query}`;
            const controller = new AbortController();
            autocompleteAbortControllerRef.current?.abort();
            autocompleteAbortControllerRef.current = controller;

            try {
                const response = await fetch(apiLink, { signal: controller.signal });
                const data = await response.json();
                setPredictions(Array.isArray(data?.predictions) ? data.predictions : []);
            } catch {
                setPredictions([]);
            }
        }, 500);

        return () => {
            window.clearTimeout(timer);
        };
    }, [search]);

    const updateMarkerAndCircle = (lngLat: [number, number]) => {
        runWhenStyleReady((map) => {
            markerRef.current?.remove();
            markerRef.current = new maplibregl.Marker({ draggable: true }).setLngLat(lngLat).addTo(map);
            markerRef.current.on('dragend', () => {
                const current = markerRef.current?.getLngLat();
                if (!current) {
                    return;
                }
                const draggedLngLat: [number, number] = [current.lng, current.lat];
                pinLocation(draggedLngLat, 'marker-drag', true);
            });

            const circleData = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Polygon',
                            coordinates: [drawCircle(lngLat, radiusInMeters)],
                        },
                    },
                ],
            };

            if (map.getLayer('location-circle')) {
                map.removeLayer('location-circle');
            }
            if (map.getSource('location-circle')) {
                map.removeSource('location-circle');
            }

            map.addSource('location-circle', {
                type: 'geojson',
                data: circleData as any,
            });

            map.addLayer({
                id: 'location-circle',
                type: 'fill',
                source: 'location-circle',
                paint: {
                    'fill-color': '#f59e0b',
                    'fill-opacity': 0.2,
                },
            });
        });
    };

    const handleSelectPrediction = async (prediction: GoongPrediction) => {
        const detailUrl = `https://rsapi.goong.io/place/detail?api_key=${goongConfig.apiKey}&place_id=${prediction.place_id}`;

        try {
            const response = await fetch(detailUrl);
            const data = await response.json();
            const location = data?.result?.geometry?.location;

            if (typeof location?.lng !== 'number' || typeof location?.lat !== 'number') {
                return;
            }

            const lngLat: [number, number] = [location.lng, location.lat];
            suppressAutocompleteRef.current = true;
            setSearch(prediction.description);
            setPredictions([]);

            updateMarkerAndCircle(lngLat);
            mapRef.current?.flyTo({ center: lngLat, zoom });
            emitLocationSelected(lngLat, prediction.description, 'search-select');
        } catch {
            setPredictions([]);
        }
    };

    const fetchDirections = async () => {
        const start = toLatLngString(startInput);
        const end = toLatLngString(endInput);

        if (!start || !end) {
            return;
        }

        const origin = `${start.lat},${start.lng}`;
        const destination = `${end.lat},${end.lng}`;
        const apiLink = `https://rsapi.goong.io/direction?origin=${origin}&destination=${destination}&vehicle=${vehicle}&api_key=${goongConfig.apiKey}`;

        try {
            const response = await fetch(apiLink);
            const data = await response.json();
            const route = data?.routes?.[0];
            if (!route) {
                return;
            }

            const encoded = route?.overview_polyline?.points;
            if (!encoded) {
                return;
            }

            const decodedRoute = decodePolyline(encoded);
            const distance = route?.legs?.[0]?.distance?.text ?? 'N/A';
            const duration = route?.legs?.[0]?.duration?.text ?? 'N/A';
            setRouteInfo({ distance, duration });

            renderRoute(decodedRoute, [start.lng, start.lat], [end.lng, end.lat], distance, duration);
        } catch {
            setRouteInfo(null);
        }
    };

    const renderRoute = (
        route: [number, number][],
        startLngLat: [number, number],
        endLngLat: [number, number],
        distance: string,
        duration: string,
    ) => {
        if (route.length === 0) {
            return;
        }

        runWhenStyleReady((map) => {
            if (map.getLayer('direction-route')) {
                map.removeLayer('direction-route');
            }
            if (map.getSource('direction-route')) {
                map.removeSource('direction-route');
            }

            map.addSource('direction-route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: route,
                    },
                    properties: {},
                } as GeoJSON.Feature,
            });

            map.addLayer({
                id: 'direction-route',
                type: 'line',
                source: 'direction-route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': '#0ea5e9',
                    'line-width': 5,
                    'line-opacity': 0.95,
                },
            });

            startMarkerRef.current?.remove();
            endMarkerRef.current?.remove();
            startMarkerRef.current = new maplibregl.Marker({ color: '#22c55e' }).setLngLat(startLngLat).addTo(map);
            endMarkerRef.current = new maplibregl.Marker({ color: '#ef4444' }).setLngLat(endLngLat).addTo(map);

            popupRef.current?.remove();
            const midPoint = route[Math.floor(route.length / 2)];
            popupRef.current = new maplibregl.Popup({ closeButton: true })
                .setLngLat(midPoint)
                .setHTML(`<div><strong>Khoảng cách:</strong> ${distance}<br/><strong>Thời gian:</strong> ${duration}</div>`)
                .addTo(map);

            const bounds = route.reduce((acc, coord) => acc.extend(coord), new maplibregl.LngLatBounds(route[0], route[0]));
            map.fitBounds(bounds as LngLatBoundsLike, { padding: 40 });
        });
    };

    if (!isGoongConfigured) {
        return (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                Thiếu cấu hình Goong. Hãy thêm VITE_GOONG_API_KEY và VITE_GOONG_MAP_KEY vào file .env.
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
                <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-3 text-zinc-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Tìm kiếm địa điểm (Autocomplete)"
                        className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-9 pr-3 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                    />
                    {predictions.length > 0 && (
                        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-2xl">
                            {predictions.map((item) => (
                                <button
                                    type="button"
                                    key={item.place_id}
                                    onClick={() => handleSelectPrediction(item)}
                                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-800"
                                >
                                    {item.description}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <select
                    value={selectedStyle}
                    onChange={(event) => setSelectedStyle(event.target.value as (typeof MAP_STYLES)[number]['id'])}
                    className="h-11 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                >
                    {MAP_STYLES.map((style) => (
                        <option key={style.id} value={style.id}>
                            {style.name}
                        </option>
                    ))}
                </select>
            </div>

            <div ref={mapContainerRef} className={`mt-3 w-full overflow-hidden rounded-2xl border border-zinc-800 ${mapHeightClassName}`} />

            <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-xs text-zinc-300">
                <span className="font-semibold text-zinc-100">Tọa độ đang chọn:</span>{' '}
                {selectedLngLat[1].toFixed(6)}, {selectedLngLat[0].toFixed(6)} (lat, lng)
            </div>

            <p className="mt-2 text-xs text-zinc-400">Ghim vị trí bằng cách click lên bản đồ hoặc kéo marker.</p>

            {enableDirections && (
                <div className="mt-4 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Route size={16} /> Dẫn đường (Directions)
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <input
                            value={startInput}
                            onChange={(event) => setStartInput(event.target.value)}
                            className="h-10 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                            placeholder="Điểm đầu: lat,lng"
                        />
                        <input
                            value={endInput}
                            onChange={(event) => setEndInput(event.target.value)}
                            className="h-10 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                            placeholder="Điểm cuối: lat,lng"
                        />
                        <select
                            value={vehicle}
                            onChange={(event) => setVehicle(event.target.value as GoongVehicle)}
                            className="h-10 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                        >
                            <option value="car">Car</option>
                            <option value="taxi">Taxi</option>
                            <option value="bike">Bike</option>
                            <option value="trunk">Trunk</option>
                            <option value="hd">HD</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="button" onClick={fetchDirections} className="bg-sky-600 hover:bg-sky-700 text-white">
                            <Navigation size={14} className="mr-2" /> Xem đường đi
                        </Button>
                        {routeInfo && (
                            <p className="text-xs text-zinc-300">
                                Khoảng cách: <span className="font-semibold text-zinc-100">{routeInfo.distance}</span> | Thời gian:{' '}
                                <span className="font-semibold text-zinc-100">{routeInfo.duration}</span>
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
