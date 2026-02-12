// useLocation hook - Enhanced Geolocation with Fallback & Caching

import { useState, useCallback, useEffect, useRef } from 'react';
import type { GeoLocation } from '@/types/ticket.types';

// Ghana bounds for validation
const GHANA_BOUNDS = {
  north: 11.5,
  south: 4.5,
  east: 1.5,
  west: -3.5,
};

// Location configuration
const LOCATION_CONFIG = {
  TIMEOUT: 10000,           // 10 seconds
  FALLBACK_TIMEOUT: 15000,  // 15 seconds for fallback
  MAX_AGE: 60000,           // 1 minute cache
  HIGH_ACCURACY_THRESHOLD: 50, // meters
};

interface EnhancedGeoLocation extends GeoLocation {
  timestamp?: string;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  source: 'gps' | 'network' | 'cached' | 'fallback';
  isWithinGhana: boolean;
}

interface UseLocationReturn {
  location: EnhancedGeoLocation | null;
  isLoading: boolean;
  error: string | null;
  accuracy: number | null;
  isHighAccuracy: boolean;
  isSupported: boolean;
  getCurrentLocation: (options?: LocationRequestOptions) => Promise<EnhancedGeoLocation | null>;
  watchLocation: () => void;
  stopWatching: () => void;
  formatCoordinates: () => string;
  formatAddress: () => string;
  retryWithFallback: () => Promise<EnhancedGeoLocation | null>;
}

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface LocationRequestOptions extends LocationOptions {
  forceFresh?: boolean;
  fallbackOnFail?: boolean;
}

const defaultOptions: LocationOptions = {
  enableHighAccuracy: true,
  timeout: LOCATION_CONFIG.TIMEOUT,
  maximumAge: LOCATION_CONFIG.MAX_AGE,
};

// Simple in-memory cache
let cachedLocation: EnhancedGeoLocation | null = null;
let cacheTimestamp: number = 0;

export function useLocation(options: LocationOptions = {}): UseLocationReturn {
  const [location, setLocation] = useState<EnhancedGeoLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const mergedOptions = { ...defaultOptions, ...options };

  const isSupported = 'geolocation' in navigator;
  const isHighAccuracy = accuracy !== null && accuracy <= LOCATION_CONFIG.HIGH_ACCURACY_THRESHOLD;

  // Check if coordinates are within Ghana
  const isWithinGhana = useCallback((lat: number, lng: number): boolean => {
    return (
      lat >= GHANA_BOUNDS.south &&
      lat <= GHANA_BOUNDS.north &&
      lng >= GHANA_BOUNDS.west &&
      lng <= GHANA_BOUNDS.east
    );
  }, []);

  // Process position into enhanced location
  const processPosition = useCallback((
    position: GeolocationPosition,
    source: 'gps' | 'network' | 'cached' = 'gps'
  ): EnhancedGeoLocation => {
    const coords = position.coords;
    
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      timestamp: new Date(position.timestamp).toISOString(),
      altitude: coords.altitude ?? undefined,
      altitudeAccuracy: coords.altitudeAccuracy ?? undefined,
      heading: coords.heading ?? undefined,
      speed: coords.speed ?? undefined,
      source,
      isWithinGhana: isWithinGhana(coords.latitude, coords.longitude),
    };
  }, [isWithinGhana]);

  // Handle position success
  const handleSuccess = useCallback((
    position: GeolocationPosition,
    source: 'gps' | 'network' = 'gps'
  ) => {
    const enhancedLocation = processPosition(position, source);
    
    // Update cache
    cachedLocation = enhancedLocation;
    cacheTimestamp = Date.now();

    setLocation(enhancedLocation);
    setAccuracy(position.coords.accuracy);
    setError(null);
    setIsLoading(false);
  }, [processPosition]);

  // Handle position error
  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access in your device settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location unavailable. Please ensure GPS is enabled.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Move to an open area for better signal.';
        break;
      default:
        errorMessage = 'Unable to determine your location.';
    }
    
    setError(errorMessage);
    setIsLoading(false);
  }, []);

  // Get cached location if fresh enough
  const getCachedLocation = useCallback((): EnhancedGeoLocation | null => {
    if (cachedLocation && Date.now() - cacheTimestamp < LOCATION_CONFIG.MAX_AGE) {
      return { ...cachedLocation, source: 'cached' };
    }
    return null;
  }, []);

  // Get current location with enhanced options
  const getCurrentLocation = useCallback(async (
    requestOptions: LocationRequestOptions = {}
  ): Promise<EnhancedGeoLocation | null> => {
    if (!isSupported) {
      setError('Geolocation is not supported by this browser');
      return null;
    }

    // Check cache first unless forceFresh
    if (!requestOptions.forceFresh) {
      const cached = getCachedLocation();
      if (cached) {
        setLocation(cached);
        setAccuracy(cached.accuracy || null);
        return cached;
      }
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      const timeout = requestOptions.timeout || mergedOptions.timeout;
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const source = requestOptions.enableHighAccuracy === false ? 'network' : 'gps';
          handleSuccess(position, source);
          resolve(processPosition(position, source));
        },
        async (error) => {
          // Try fallback if enabled
          if (requestOptions.fallbackOnFail !== false) {
            const fallback = await retryWithFallback();
            if (fallback) {
              resolve(fallback);
              return;
            }
          }
          
          handleError(error);
          resolve(null);
        },
        {
          enableHighAccuracy: requestOptions.enableHighAccuracy ?? mergedOptions.enableHighAccuracy,
          timeout,
          maximumAge: requestOptions.forceFresh ? 0 : mergedOptions.maximumAge,
        }
      );
    });
  }, [isSupported, getCachedLocation, handleSuccess, handleError, processPosition, mergedOptions]);

  // Retry with lower accuracy settings (fallback)
  const retryWithFallback = useCallback(async (): Promise<EnhancedGeoLocation | null> => {
    if (!isSupported) return null;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const enhancedLocation = processPosition(position, 'network');
          enhancedLocation.source = 'fallback';
          
          cachedLocation = enhancedLocation;
          cacheTimestamp = Date.now();
          
          setLocation(enhancedLocation);
          setAccuracy(position.coords.accuracy);
          setError(null);
          setIsLoading(false);
          
          resolve(enhancedLocation);
        },
        () => {
          resolve(null);
        },
        {
          enableHighAccuracy: false,  // Use network/cell tower
          timeout: LOCATION_CONFIG.FALLBACK_TIMEOUT,
          maximumAge: LOCATION_CONFIG.MAX_AGE * 2,  // Allow older cache
        }
      );
    });
  }, [isSupported, processPosition]);

  // Start watching location
  const watchLocation = useCallback(() => {
    if (!isSupported) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsLoading(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => handleSuccess(position, 'gps'),
      handleError,
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: 0,
      }
    );
  }, [isSupported, handleSuccess, handleError, mergedOptions]);

  // Stop watching location
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsLoading(false);
    }
  }, []);

  // Format coordinates for display
  const formatCoordinates = useCallback((): string => {
    if (!location) return 'Unknown';
    
    const lat = location.latitude.toFixed(6);
    const lng = location.longitude.toFixed(6);
    const latDir = location.latitude >= 0 ? 'N' : 'S';
    const lngDir = location.longitude >= 0 ? 'E' : 'W';
    
    return `${Math.abs(parseFloat(lat))}°${latDir}, ${Math.abs(parseFloat(lng))}°${lngDir}`;
  }, [location]);

  // Format location as address string
  const formatAddress = useCallback((): string => {
    if (!location) return 'Location unknown';
    
    if (location.address) {
      return location.address;
    }
    
    return formatCoordinates();
  }, [location, formatCoordinates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    location,
    isLoading,
    error,
    accuracy,
    isHighAccuracy,
    isSupported,
    getCurrentLocation,
    watchLocation,
    stopWatching,
    formatCoordinates,
    formatAddress,
    retryWithFallback,
  };
}

// Utility to calculate distance between two points (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in kilometers
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format accuracy for display
export function formatAccuracy(meters: number | null): string {
  if (meters === null) return 'Unknown';
  if (meters < 10) return 'High (< 10m)';
  if (meters < 50) return 'Good (< 50m)';
  if (meters < 100) return 'Fair (< 100m)';
  return 'Low (> 100m)';
}

// Get location for ticket (with fallback)
export async function getLocationForTicket(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
} | null> {
  if (!('geolocation' in navigator)) {
    return null;
  }

  return new Promise((resolve) => {
    // First try high accuracy
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString(),
        });
      },
      () => {
        // Fallback to low accuracy
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(position.timestamp).toISOString(),
            });
          },
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}
