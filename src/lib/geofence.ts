/**
 * @file src/lib/geofence.ts
 * @description Geofencing utilities for detecting if the user's location
 *              falls within a defined radius of a polling station.
 *              Uses the Haversine formula for accurate great-circle distance calculation.
 */

/** Radius of the Earth in kilometres, used in the Haversine formula. */
const EARTH_RADIUS_KM = 6371;

/**
 * Converts degrees to radians.
 *
 * @param {number} degrees - The value in degrees to convert.
 * @returns {number} The equivalent value in radians.
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Represents a geographic coordinate pair.
 */
export interface LatLng {
  /** Latitude in decimal degrees. */
  lat: number;
  /** Longitude in decimal degrees. */
  lng: number;
}

/**
 * Calculates the great-circle distance between two geographic coordinates
 * using the Haversine formula.
 *
 * @param {LatLng} point1 - The first coordinate (e.g., user's location).
 * @param {LatLng} point2 - The second coordinate (e.g., polling station location).
 * @returns {number} The distance in kilometres between the two points.
 */
export function haversineDistance(point1: LatLng, point2: LatLng): number {
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
    Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Represents a polling station with geolocation data.
 */
export interface PollingStation {
  /** Unique identifier for the polling station. */
  id: string;
  /** Human-readable name of the polling station. */
  name: string;
  /** Full address of the polling station. */
  address: string;
  /** Geographic coordinates of the polling station. */
  location: LatLng;
}

/**
 * Determines whether a user's location is within a geofence radius of a polling station.
 *
 * @param {LatLng} userLocation - The user's current geographic coordinates.
 * @param {PollingStation} station - The polling station to check proximity to.
 * @param {number} radiusKm - The geofence radius in kilometres. Defaults to 0.5 km (500 m).
 * @returns {boolean} True if the user is within the geofence, false otherwise.
 */
export function isWithinGeofence(
  userLocation: LatLng,
  station: PollingStation,
  radiusKm = 0.5
): boolean {
  const distance = haversineDistance(userLocation, station.location);
  return distance <= radiusKm;
}

/**
 * Finds all polling stations within a given radius of the user's location.
 *
 * @param {LatLng} userLocation - The user's current geographic coordinates.
 * @param {PollingStation[]} stations - Array of all known polling stations to search.
 * @param {number} radiusKm - The search radius in kilometres. Defaults to 5 km.
 * @returns {PollingStation[]} Array of polling stations within the specified radius,
 *                             sorted by distance (nearest first).
 */
export function findNearbyStations(
  userLocation: LatLng,
  stations: PollingStation[],
  radiusKm = 5
): PollingStation[] {
  return stations
    .filter((station) => haversineDistance(userLocation, station.location) <= radiusKm)
    .sort(
      (a, b) =>
        haversineDistance(userLocation, a.location) -
        haversineDistance(userLocation, b.location)
    );
}
