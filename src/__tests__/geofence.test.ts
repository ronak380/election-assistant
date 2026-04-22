/**
 * @file src/__tests__/geofence.test.ts
 * @description Unit tests for the geofencing utility functions.
 *              Tests cover the Haversine distance formula, geofence detection,
 *              and nearby station search — including edge cases.
 */

import {
  haversineDistance,
  isWithinGeofence,
  findNearbyStations,
  type LatLng,
  type PollingStation,
} from '@/lib/geofence';

/** Test coordinates — San Francisco City Hall */
const SF_CITY_HALL: LatLng = { lat: 37.7793, lng: -122.4193 };

/** Test coordinates — approximately 0.5 km from City Hall */
const NEAR_CITY_HALL: LatLng = { lat: 37.7835, lng: -122.4193 };

/** Test coordinates — far away (Los Angeles) */
const LOS_ANGELES: LatLng = { lat: 34.0522, lng: -118.2437 };

/** Sample polling stations for tests. */
const STATIONS: PollingStation[] = [
  { id: 's1', name: 'City Hall Station', address: '1 Main St', location: SF_CITY_HALL },
  { id: 's2', name: 'North Station', address: '100 North Ave', location: NEAR_CITY_HALL },
  { id: 's3', name: 'LA Station', address: '500 Sunset Blvd', location: LOS_ANGELES },
];

// ============================================================================
// haversineDistance
// ============================================================================
describe('haversineDistance', () => {
  it('returns 0 distance for identical coordinates', () => {
    const distance = haversineDistance(SF_CITY_HALL, SF_CITY_HALL);
    expect(distance).toBe(0);
  });

  it('calculates a reasonable distance between two nearby SF points', () => {
    const distance = haversineDistance(SF_CITY_HALL, NEAR_CITY_HALL);
    // ~0.47 km — should be less than 1 km
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(1);
  });

  it('calculates approximately 559 km between SF and LA', () => {
    const distance = haversineDistance(SF_CITY_HALL, LOS_ANGELES);
    // Allow ±5 km tolerance
    expect(distance).toBeGreaterThan(554);
    expect(distance).toBeLessThan(565);
  });

  it('is symmetric — distance A→B equals B→A', () => {
    const forward = haversineDistance(SF_CITY_HALL, LOS_ANGELES);
    const backward = haversineDistance(LOS_ANGELES, SF_CITY_HALL);
    expect(forward).toBeCloseTo(backward, 5);
  });

  it('handles negative coordinates correctly (southern hemisphere)', () => {
    const sydney: LatLng = { lat: -33.8688, lng: 151.2093 };
    const melbourne: LatLng = { lat: -37.8136, lng: 144.9631 };
    const distance = haversineDistance(sydney, melbourne);
    expect(distance).toBeGreaterThan(700);
    expect(distance).toBeLessThan(750);
  });
});

// ============================================================================
// isWithinGeofence
// ============================================================================
describe('isWithinGeofence', () => {
  it('returns true when user is at exactly the station location', () => {
    const result = isWithinGeofence(SF_CITY_HALL, STATIONS[0], 0.5);
    expect(result).toBe(true);
  });

  it('returns true when user is within the default 0.5 km radius', () => {
    // NEAR_CITY_HALL is ~0.47 km from SF_CITY_HALL
    const result = isWithinGeofence(NEAR_CITY_HALL, STATIONS[0]);
    expect(result).toBe(true);
  });

  it('returns false when user is far outside the geofence', () => {
    const result = isWithinGeofence(LOS_ANGELES, STATIONS[0], 0.5);
    expect(result).toBe(false);
  });

  it('returns false when user is just outside the specified radius', () => {
    // 0.1 km radius — NEAR_CITY_HALL is ~0.47km away, so outside 0.1km
    const result = isWithinGeofence(NEAR_CITY_HALL, STATIONS[0], 0.1);
    expect(result).toBe(false);
  });

  it('respects a custom large radius (50 km)', () => {
    // City Hall to a nearby spot — well within 50 km
    const result = isWithinGeofence(NEAR_CITY_HALL, STATIONS[0], 50);
    expect(result).toBe(true);
  });
});

// ============================================================================
// findNearbyStations
// ============================================================================
describe('findNearbyStations', () => {
  it('returns only stations within the specified radius', () => {
    // From SF, with 1 km radius, should include City Hall and North Station but not LA
    const nearby = findNearbyStations(SF_CITY_HALL, STATIONS, 1);
    expect(nearby.some((s) => s.id === 's1')).toBe(true);
    expect(nearby.some((s) => s.id === 's3')).toBe(false);
  });

  it('returns stations sorted by distance (nearest first)', () => {
    const nearby = findNearbyStations(SF_CITY_HALL, STATIONS, 1000);
    expect(nearby[0].id).toBe('s1'); // SF City Hall is the closest (0 distance)
    expect(nearby[nearby.length - 1].id).toBe('s3'); // LA is furthest
  });

  it('returns an empty array when no stations are within radius', () => {
    // Los Angeles is ~560 km from SF — no SF stations within 0.001 km
    const nearby = findNearbyStations(LOS_ANGELES, STATIONS.slice(0, 2), 0.001);
    expect(nearby).toHaveLength(0);
  });

  it('returns all stations when radius is very large', () => {
    const nearby = findNearbyStations(SF_CITY_HALL, STATIONS, 10000);
    expect(nearby).toHaveLength(STATIONS.length);
  });

  it('returns an empty array for an empty stations list', () => {
    const nearby = findNearbyStations(SF_CITY_HALL, [], 10);
    expect(nearby).toEqual([]);
  });
});
