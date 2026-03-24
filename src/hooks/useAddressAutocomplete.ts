import { useState, useEffect, useCallback, useRef } from 'react';
import type { GeocodeResult } from '../services/geocode.api';
import { geocodeAddress } from '../services/geocode.api';

const CACHE_PREFIX = 'goong_cache_';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const DEBOUNCE_MS = 300;

interface CacheEntry {
  results: GeocodeResult[];
  timestamp: number;
}

interface UseAddressAutocompleteReturn {
  query: string;
  suggestions: GeocodeResult[];
  loading: boolean;
  error: string | null;
  setQuery: (query: string) => void;
  selectSuggestion: (result: GeocodeResult) => void;
  clearSuggestions: () => void;
}

export function useAddressAutocomplete(
  initialAddress?: string
): UseAddressAutocompleteReturn {
  const [query, setQuery] = useState(initialAddress || '');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simple hash function for cache keys
  const getCacheKey = (address: string): string => {
    return `${CACHE_PREFIX}${btoa(address).substring(0, 20)}`;
  };

  // Get cached results if still valid
  const getCachedResults = (address: string): GeocodeResult[] | null => {
    try {
      const key = getCacheKey(address);
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry = JSON.parse(cached);
      const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;

      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }

      return entry.results;
    } catch {
      return null;
    }
  };

  // Cache results
  const cacheResults = (address: string, results: GeocodeResult[]): void => {
    try {
      const key = getCacheKey(address);
      const entry: CacheEntry = {
        results,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Silently fail if storage is full
    }
  };

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (address: string) => {
    if (!address.trim()) {
      setSuggestions([]);
      setError(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = getCachedResults(address);
    if (cached) {
      setSuggestions(cached);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await geocodeAddress(address);
      if (results && results.length > 0) {
        setSuggestions(results);
        cacheResults(address, results);
      } else {
        setSuggestions([]);
        setError('Không tìm thấy địa chỉ, vui lòng nhập chi tiết hơn');
      }
    } catch (err) {
      setSuggestions([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Lỗi khi tìm kiếm địa chỉ. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search handler
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, fetchSuggestions]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  const selectSuggestion = useCallback((result: GeocodeResult) => {
    setQuery(result.formattedAddress);
    setSuggestions([]);
  }, []);

  return {
    query,
    suggestions,
    loading,
    error,
    setQuery,
    selectSuggestion,
    clearSuggestions
  };
}
