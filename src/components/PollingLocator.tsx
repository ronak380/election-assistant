/**
 * @file src/components/PollingLocator.tsx
 * @description Interactive Google Maps component for locating nearby polling stations.
 *              Refactored for Atomic Design and Modular Logic.
 */

'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { usePollingStations, type LocationStatus } from '@/hooks/usePollingStations';
import StationCard from './Map/StationCard';
import type { LatLng, PollingStation } from '@/lib/geofence';

/** Status messages shown to the user. */
const STATUS_MESSAGES: Record<LocationStatus, string> = {
  idle: 'Click "Find My Location" to discover nearby polling stations.',
  requesting: 'Requesting your location...',
  'loading-map': 'Loading the map and finding nearby stations...',
  found: 'Nearby polling stations found.',
  denied: 'Location access was denied. Showing a default location.',
  unavailable: 'Geolocation is not supported by your browser.',
};

/**
 * PollingLocator component — renders a Google Map with nearby polling station markers.
 *
 * @returns {JSX.Element} The interactive polling station map and controls.
 */
export default function PollingLocator() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  
  const { status, userLocation, nearbyStations, geofenceAlert, handleLocate, setStatus } = usePollingStations();
  const [selectedStation, setSelectedStation] = useState<PollingStation | null>(null);

  /**
   * Initializes the Google Map and places markers for all polling stations.
   */
  const initializeMap = useCallback(async (center: LatLng) => {
    if (!mapRef.current) return;
    setStatus('loading-map');

    try {
      setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '', v: 'weekly' });
      const { Map: GoogleMap, InfoWindow } = await importLibrary('maps') as google.maps.MapsLibrary;
      const { AdvancedMarkerElement, PinElement } = await importLibrary('marker') as google.maps.MarkerLibrary;

      const map = new GoogleMap(mapRef.current, {
        center, zoom: 14, mapTypeId: 'roadmap', mapId: 'DEMO_MAP_ID',
        styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
        fullscreenControl: false, streetViewControl: false, mapTypeControl: false,
      });
      mapInstanceRef.current = map;

      nearbyStations.forEach((station) => {
        const pin = new PinElement({ background: '#2563eb', borderColor: 'white', glyphColor: 'white', scale: 1.2 });
        const marker = new AdvancedMarkerElement({ position: station.location, map, title: station.name, content: pin.element });
        markersRef.current.push(marker);

        const infoWindow = new InfoWindow({
          content: `<div class="map-info-window"><strong>${station.name}</strong><p>${station.address}</p></div>`,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          setSelectedStation(station);
        });
      });

      setStatus('found');
    } catch (err) {
      setStatus('unavailable');
    }
  }, [nearbyStations, setStatus]);

  useEffect(() => {
    if (userLocation && status === 'found') {
      initializeMap(userLocation);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  return (
    <section className="locator-section" aria-labelledby="locator-heading">
      <div className="container">
        <header className="section-header">
          <h2 id="locator-heading"><span className="gradient-text">Find Your Polling Station</span></h2>
          <p className="section-subtitle">Find nearby polling stations powered by Google Maps.</p>
        </header>

        {geofenceAlert && (
          <div className="geofence-alert" role="alert" aria-live="assertive">
            <span aria-hidden="true">📍</span> {geofenceAlert}
          </div>
        )}

        <div role="status" aria-live="polite" className="sr-only">
          {STATUS_MESSAGES[status]}
        </div>

        <div className="locator-layout">
          <div className="map-wrapper glass-card">
            <div ref={mapRef} className="map-container" aria-label="Google Map" role="application" />
            {(status === 'requesting' || status === 'loading-map') && (
              <div className="map-overlay" aria-hidden="true">
                <div className="spinner" />
                <p>{STATUS_MESSAGES[status]}</p>
              </div>
            )}
          </div>

          <aside className="stations-sidebar" aria-label="Nearby stations list">
            <h3>Nearby Stations</h3>
            {nearbyStations.length === 0 ? (
              <p className="sidebar-empty">No nearby stations found.</p>
            ) : (
              <ul className="stations-list" role="list">
                {nearbyStations.map((station) => (
                  <StationCard
                    key={station.id}
                    station={station}
                    selected={selectedStation?.id === station.id}
                    userLocation={userLocation}
                    onSelect={(s) => {
                      setSelectedStation(s);
                      mapInstanceRef.current?.panTo(s.location);
                      mapInstanceRef.current?.setZoom(16);
                    }}
                  />
                ))}
              </ul>
            )}
            <button onClick={handleLocate} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              📍 Find My Location
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}
