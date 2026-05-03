/**
 * @file src/hooks/usePollingStations.ts
 * @description Custom hook for managing user location and nearby polling stations.
 *              Encapsulates geolocation logic and distance calculations.
 */

import { useState, useCallback, useEffect } from 'react';
import { haversineDistance, isWithinGeofence, type LatLng, type PollingStation } from '@/lib/geofence';
import { trackPollingStationSearch } from '@/lib/analytics';

const SAMPLE_STATIONS: PollingStation[] = [
  { id: 'ps-mumbai-001', name: 'Ghatkopar East Municipal School', address: '9, Pant Nagar, Ghatkopar East, Mumbai 400075', location: { lat: 19.0835, lng: 72.9100 } },
  { id: 'ps-mumbai-002', name: 'Sardar Vallabhbhai Patel Vidyalaya', address: 'Near Inox, Neelyog Square, Mumbai 400077', location: { lat: 19.0810, lng: 72.9125 } },
  { id: 'ps-mumbai-003', name: 'Vikas High School & College', address: 'Vikhroli East, Mumbai 400083', location: { lat: 19.1050, lng: 72.9250 } },
  { id: 'ps-mumbai-004', name: 'Don Bosco High School', address: 'Kurla West, Mumbai 400070', location: { lat: 19.0700, lng: 72.8850 } },
  { id: 'ps-mumbai-005', name: 'Powai English High School', address: 'Tunga Village, Powai, Mumbai 400072', location: { lat: 19.1200, lng: 72.8950 } },
];

export type LocationStatus = 'idle' | 'requesting' | 'found' | 'denied' | 'unavailable' | 'loading-map';

export function usePollingStations() {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [nearbyStations, setNearbyStations] = useState<PollingStation[]>([]);
  const [geofenceAlert, setGeofenceAlert] = useState<string | null>(null);

  const calculateNearby = useCallback((center: LatLng) => {
    const nearby = SAMPLE_STATIONS
      .map((s) => ({ ...s, distance: haversineDistance(center, s.location) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    setNearbyStations(nearby);

    const insideStation = SAMPLE_STATIONS.find((s) => isWithinGeofence(center, s, 0.5));
    if (insideStation) {
      setGeofenceAlert(`You are near ${insideStation.name}! Voting is available here.`);
    } else {
      setGeofenceAlert(null);
    }
  }, []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    setStatus('requesting');
    trackPollingStationSearch(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(location);
        calculateNearby(location);
        setStatus('found');
      },
      () => {
        setStatus('denied');
        const fallback: LatLng = { lat: 19.0835, lng: 72.9100 }; // Mumbai Fallback
        setUserLocation(fallback);
        calculateNearby(fallback);
        trackPollingStationSearch(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [calculateNearby]);

  useEffect(() => {
    handleLocate();
  }, [handleLocate]);

  return { status, userLocation, nearbyStations, geofenceAlert, handleLocate, setStatus };
}
