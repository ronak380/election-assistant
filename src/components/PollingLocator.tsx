/**
 * @file src/components/PollingLocator.tsx
 * @description Interactive Google Maps component for locating nearby polling stations.
 *
 *              Features:
 *              - HTML5 Geolocation to detect user's current position
 *              - Google Maps JavaScript SDK for map rendering
 *              - Custom info windows for each polling station pin
 *              - Geofencing alert when user is within 500m of a station
 *              - GA4 tracking for search interactions
 *              - Graceful degradation when geolocation is denied
 *
 * @accessibility
 *   - Status updates announced via aria-live="polite"
 *   - Loading states conveyed with aria-busy and visually
 *   - Map container has meaningful aria-label
 *   - All interactive controls have descriptive aria-labels
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { haversineDistance, isWithinGeofence, type LatLng, type PollingStation } from '@/lib/geofence';
import { trackPollingStationSearch } from '@/lib/analytics';

/**
 * Sample polling station dataset.
 * In production, this would be fetched from a Firestore collection
 * seeded with official government election authority data.
 */
const SAMPLE_STATIONS: PollingStation[] = [
  { id: 'ps-001', name: 'City Hall — Main Polling Center', address: '100 City Hall Plaza', location: { lat: 37.7749, lng: -122.4194 } },
  { id: 'ps-002', name: 'Civic Center Library', address: '555 Larkin Street', location: { lat: 37.7820, lng: -122.4159 } },
  { id: 'ps-003', name: 'Mission Community Center', address: '362 Capp Street', location: { lat: 37.7610, lng: -122.4183 } },
  { id: 'ps-004', name: 'Richmond Branch Library', address: '351 9th Avenue', location: { lat: 37.7835, lng: -122.4650 } },
  { id: 'ps-005', name: 'Sunset Recreation Center', address: '2201 Lawton Street', location: { lat: 37.7580, lng: -122.4882 } },
];

/** Status messages shown to the user. */
type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'found'
  | 'denied'
  | 'unavailable'
  | 'loading-map';

/**
 * PollingLocator component — renders a Google Map with nearby polling station markers.
 *
 * @returns {JSX.Element} The interactive polling station map and controls.
 */
export default function PollingLocator() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  const [status, setStatus] = useState<LocationStatus>('idle');
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [nearbyStations, setNearbyStations] = useState<PollingStation[]>([]);
  const [geofenceAlert, setGeofenceAlert] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<PollingStation | null>(null);

  const markersRef = useRef<google.maps.Marker[]>([]);

  /**
   * Initializes the Google Map and places markers for all polling stations.
   * Called after geolocation succeeds and the Maps SDK is loaded.
   *
   * @param {LatLng} center - The coordinate to center the map on (user's location).
   */
  const initializeMap = useCallback(async (center: LatLng) => {
    if (!mapRef.current) return;
    setStatus('loading-map');

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
    const loader = new Loader({ apiKey, version: 'weekly', libraries: ['marker'] });

    try {
      await loader.load();

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 14,
        mapTypeId: 'roadmap',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
        ],
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
      });
      mapInstanceRef.current = map;

      // User location marker (blue dot)
      new google.maps.Marker({
        position: center,
        map,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });

      // Find and sort nearby stations
      const nearby = SAMPLE_STATIONS
        .map((s) => ({ ...s, distance: haversineDistance(center, s.location) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      setNearbyStations(nearby);

      // Place markers for each station
      nearby.forEach((station) => {
        const marker = new google.maps.Marker({
          position: station.location,
          map,
          title: station.name,
          icon: {
            url:
              'data:image/svg+xml;base64,' +
              btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                <path fill="#2563eb" d="M16 0C7.163 0 0 7.163 0 16c0 10.5 16 24 16 24S32 26.5 32 16C32 7.163 24.837 0 16 0z"/>
                <text x="16" y="22" text-anchor="middle" fill="white" font-size="14">🗳️</text>
              </svg>`),
            scaledSize: new google.maps.Size(32, 40),
            anchor: new google.maps.Point(16, 40),
          },
        });

        markersRef.current.push(marker);

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding:0.5rem;font-family:system-ui;max-width:200px;">
              <strong>${station.name}</strong>
              <p style="margin:4px 0 0;color:#475569;font-size:0.85rem;">${station.address}</p>
              <p style="margin:4px 0 0;color:#3b82f6;font-size:0.85rem;">
                📍 ${haversineDistance(center, station.location).toFixed(2)} km away
              </p>
            </div>`,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          setSelectedStation(station);
        });
      });

      // Geofence check: alert if user is within 500m of any station
      const insideStation = SAMPLE_STATIONS.find((s) =>
        isWithinGeofence(center, s, 0.5)
      );
      if (insideStation) {
        setGeofenceAlert(`You are near ${insideStation.name}! Voting is available here.`);
      }

      setStatus('found');
    } catch (err) {
      console.error('[PollingLocator] Map initialization error:', err);
      setStatus('unavailable');
    }
  }, []);

  /**
   * Requests the browser's geolocation, then initializes the map.
   * Tracks the search interaction in GA4.
   */
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    setStatus('requesting');
    trackPollingStationSearch(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location: LatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(location);
        initializeMap(location);
      },
      () => {
        setStatus('denied');
        // Fall back to a default location (San Francisco for demo purposes)
        const fallback: LatLng = { lat: 37.7749, lng: -122.4194 };
        setUserLocation(fallback);
        initializeMap(fallback);
        trackPollingStationSearch(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [initializeMap]);

  /** Auto-request location on mount for a seamless experience. */
  useEffect(() => {
    handleLocate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Human-readable status messages. */
  const statusMessages: Record<LocationStatus, string> = {
    idle: 'Click "Find My Location" to discover nearby polling stations.',
    requesting: 'Requesting your location...',
    'loading-map': 'Loading the map and finding nearby stations...',
    found: `Found ${nearbyStations.length} polling station(s) near you.`,
    denied: 'Location access was denied. Showing a default location.',
    unavailable: 'Geolocation is not supported by your browser.',
  };

  return (
    <section className="locator-section" aria-labelledby="locator-heading">
      <div className="container">
        <header className="section-header">
          <h2 id="locator-heading">
            <span className="gradient-text">Find Your Polling Station</span>
          </h2>
          <p className="section-subtitle">
            We&apos;ll use your location to find the nearest polling stations and alert you when you&apos;re nearby.
          </p>
        </header>

        {/* Geofence Alert */}
        {geofenceAlert && (
          <div
            className="geofence-alert"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <span aria-hidden="true">📍</span>
            {geofenceAlert}
          </div>
        )}

        {/* Status announcer for screen readers */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {statusMessages[status]}
        </div>

        <div className="locator-layout">
          {/* Map Container */}
          <div className="map-wrapper glass-card">
            <div
              ref={mapRef}
              className="map-container"
              aria-label="Google Map showing nearby polling stations"
              role="application"
              aria-roledescription="Interactive map"
            />
            {(status === 'requesting' || status === 'loading-map') && (
              <div className="map-overlay" aria-hidden="true">
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, borderColor: 'rgba(37, 99, 235, 0.2)', borderTopColor: '#2563eb' }} />
                <p>{statusMessages[status]}</p>
              </div>
            )}
          </div>

          {/* Sidebar: station list */}
          <aside className="stations-sidebar" aria-label="Nearby polling stations list">
            <h3>Nearby Stations</h3>
            {nearbyStations.length === 0 ? (
              <p className="sidebar-empty">
                {status === 'idle' || status === 'requesting' || status === 'loading-map'
                  ? 'Searching for stations...'
                  : 'No nearby stations found.'}
              </p>
            ) : (
              <ul className="stations-list" role="list">
                {nearbyStations.map((station) => (
                  <li
                    key={station.id}
                    className={`station-item glass-card ${selectedStation?.id === station.id ? 'station-item--selected' : ''}`}
                    aria-selected={selectedStation?.id === station.id}
                  >
                    <button
                      className="station-btn"
                      onClick={() => {
                        setSelectedStation(station);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.panTo(station.location);
                          mapInstanceRef.current.setZoom(16);
                        }
                      }}
                      aria-label={`View ${station.name} at ${station.address}`}
                    >
                      <div className="station-icon" aria-hidden="true">🗳️</div>
                      <div className="station-info">
                        <strong>{station.name}</strong>
                        <span>{station.address}</span>
                        {userLocation && (
                          <span className="station-distance">
                            📍 {haversineDistance(userLocation, station.location).toFixed(2)} km
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={handleLocate}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              aria-label="Re-detect my location and refresh the map"
              id="locate-btn"
            >
              <span aria-hidden="true">📍</span> Find My Location
            </button>
          </aside>
        </div>
      </div>

      <style>{`
        .locator-section { padding-block: 4rem; }
        .geofence-alert {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-radius: var(--radius-md);
          color: var(--color-success);
          font-weight: 600;
          margin-bottom: 1.5rem;
          max-width: 800px; margin-inline: auto;
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .locator-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
          max-width: 1000px;
          margin-inline: auto;
        }
        .map-wrapper { position: relative; overflow: hidden; min-height: 450px; }
        .map-container { width: 100%; height: 450px; }
        .map-overlay {
          position: absolute; inset: 0;
          background: var(--glass-bg);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 1rem;
          color: var(--text-secondary);
        }
        .stations-sidebar { display: flex; flex-direction: column; gap: 0; }
        .stations-sidebar h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.875rem; color: var(--text-primary); }
        .sidebar-empty { color: var(--text-muted); font-size: 0.9rem; }
        .stations-list { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
        .station-item { transition: all var(--transition-fast); }
        .station-item--selected { border-color: var(--color-primary-500); box-shadow: 0 0 0 2px var(--color-primary-200); }
        .station-btn {
          display: flex; align-items: flex-start; gap: 0.75rem;
          padding: 0.875rem 1rem;
          background: none; border: none;
          width: 100%; cursor: pointer; text-align: left;
          border-radius: inherit;
        }
        .station-icon { font-size: 1.25rem; flex-shrink: 0; }
        .station-info { display: flex; flex-direction: column; gap: 0.175rem; }
        .station-info strong { font-size: 0.875rem; color: var(--text-primary); }
        .station-info span { font-size: 0.8rem; color: var(--text-muted); }
        .station-distance { color: var(--color-primary-600) !important; font-weight: 500; }
        @media (max-width: 768px) {
          .locator-layout { grid-template-columns: 1fr; }
          .map-container { height: 300px; }
          .stations-sidebar { order: -1; }
        }
      `}</style>
    </section>
  );
}
