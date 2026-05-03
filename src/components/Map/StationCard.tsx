/**
 * @file src/components/Map/StationCard.tsx
 * @description Atomic component for a single polling station entry in the sidebar.
 */

import { type PollingStation, haversineDistance, type LatLng } from '@/lib/geofence';

interface StationCardProps {
  station: PollingStation;
  selected: boolean;
  userLocation: LatLng | null;
  onSelect: (station: PollingStation) => void;
}

export default function StationCard({ station, selected, userLocation, onSelect }: StationCardProps) {
  return (
    <li
      className={`station-item glass-card ${selected ? 'station-item--selected' : ''}`}
      aria-selected={selected}
    >
      <button
        className="station-btn"
        onClick={() => onSelect(station)}
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
  );
}
