const reverseCache = new Map<string, string | null>();
let lastGeocodeCall = 0;

export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  const key = `${lat},${lng}`;
  const cached = reverseCache.get(key);
  if (cached !== undefined) return cached;

  try {
    const now = Date.now();
    const elapsed = now - lastGeocodeCall;
    if (elapsed < 1000) {
      await new Promise(r => setTimeout(r, 1000 - elapsed));
    }
    lastGeocodeCall = Date.now();

    const res = await fetch(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`,
      { headers: { 'User-Agent': 'E-Hatid/1.0' } }
    );
    const data = await res.json();
    const f = data.features?.[0];
    if (!f) {
      reverseCache.set(key, null);
      return null;
    }
    const parts = [
      f.properties.name && f.properties.street
        ? `${f.properties.name} ${f.properties.street}`
        : f.properties.street || '',
      f.properties.district || '',
      f.properties.city || '',
      f.properties.state || '',
    ].filter(Boolean);
    const display = parts.join(', ') || null;
    reverseCache.set(key, display);
    return display;
  } catch (err) {
    console.error('Reverse geocode error:', err);
    reverseCache.set(key, null);
    return null;
  }
};

export const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const openGoogleMapsDirections = (
  toLat: number,
  toLng: number,
  destinationLabel?: string,
  fromLat?: number,
  fromLng?: number,
  travelMode: string = 'driving'
): void => {
  const nearOrNoOrigin =
    fromLat == null || fromLng == null ||
    getDistanceInMeters(fromLat, fromLng, toLat, toLng) < 50;
  if (nearOrNoOrigin) {
    openGoogleMapsLocation(toLat, toLng, destinationLabel);
    return;
  }
  let url = `https://www.google.com/maps/dir/?api=1&destination=${toLat},${toLng}`;
  if (destinationLabel) {
    url += `&destination_name=${encodeURIComponent(destinationLabel)}`;
  }
  if (fromLat != null && fromLng != null) {
    url += `&origin=${fromLat},${fromLng}`;
  }
  url += `&travelmode=${encodeURIComponent(travelMode)}`;
  window.open(url, '_blank');
};

export const openGoogleMapsLocation = (
  lat?: number,
  lng?: number,
  label?: string
): void => {
  let query = '';
  if (lat != null && lng != null) {
    query = `${lat},${lng}`;
  } else if (label && label.trim()) {
    query = label.trim();
  } else {
    return;
  }
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
};

export const minutesFromKm = (km: number): number => {
  if (km <= 0) return 1;
  return Math.max(1, Math.ceil(km * 2.4));
};

export const getStoredCoords = (): { lat: number; lng: number } | null => {
  try {
    const raw = sessionStorage.getItem('selectedLocation');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      return { lat: parsed.lat, lng: parsed.lng };
    }
    return null;
  } catch {
    return null;
  }
};

export const PIN_ADDRESS_MAX_DISTANCE_M = 500;
export const PIN_ADDRESS_MAX_DISTANCE_STREET_M = 1000;

export interface GeocodeResult {
  lat: number;
  lng: number;
  type?: string;
  hasHouseNumber?: boolean;
}

const COARSE_TYPES = new Set([
  'village', 'town', 'city', 'state', 'county', 'municipality', 'province',
  'region', 'country', 'suburb', 'neighbourhood', 'quarter', 'district',
  'city_district', 'island', 'islet',
]);

const STREET_TYPES = new Set(['road', 'street', 'highway', 'pedestrian', 'footway', 'cycleway']);

export const isCoarseAddress = (type?: string): boolean => !!type && COARSE_TYPES.has(type);

export const isStreetLevelAddress = (type?: string): boolean => !!type && STREET_TYPES.has(type);

const geocodeCache = new Map<string, GeocodeResult | null>();
let lastNominatimCall = 0;

export const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
  if (!address || !address.trim()) return null;
  const key = address.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key) || null;

  try {
    const now = Date.now();
    const elapsed = now - lastNominatimCall;
    if (elapsed < 1100) {
      await new Promise(r => setTimeout(r, 1100 - elapsed));
    }
    lastNominatimCall = Date.now();

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address.trim())}`,
      { headers: { 'User-Agent': 'E-Hatid/1.0' } }
    );
    if (!res.ok) {
      geocodeCache.set(key, null);
      return null;
    }
    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (!first || first.lat == null || first.lon == null) {
      geocodeCache.set(key, null);
      return null;
    }
    const result: GeocodeResult = {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      type: first.addresstype || first.class || undefined,
      hasHouseNumber: /(^|\s)\d{1,6}((\s|-)[a-zA-Z])?($|\s)/.test(first.display_name || ''),
    };
    geocodeCache.set(key, result);
    return result;
  } catch (err) {
    console.error('Geocode address error:', err);
    geocodeCache.set(key, null);
    return null;
  }
};

export const getDistanceInMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const validatePinAgainstAddress = async (
  pinLat: number,
  pinLng: number,
  address: string
): Promise<{ valid: boolean; distance?: number; geocodeFailed?: boolean; unverifiable?: boolean }> => {
  try {
    const geo = await geocodeAddress(address);
    if (!geo) {
      return { valid: true, geocodeFailed: true };
    }
    if (isCoarseAddress(geo.type)) {
      return { valid: true, unverifiable: true };
    }
    const tolerance = isStreetLevelAddress(geo.type) ? PIN_ADDRESS_MAX_DISTANCE_STREET_M : PIN_ADDRESS_MAX_DISTANCE_M;
    const distance = getDistanceInMeters(pinLat, pinLng, geo.lat, geo.lng);
    if (distance > tolerance) {
      console.warn('Suspicious order: pin/address mismatch', { pinLat, pinLng, address, distance, type: geo.type });
      return { valid: false, distance };
    }
    return { valid: true, distance };
  } catch {
    return { valid: true, geocodeFailed: true };
  }
};


