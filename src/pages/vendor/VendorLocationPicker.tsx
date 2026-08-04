import React, { useState, useEffect, useRef } from 'react';
import {
  IonButton,
  IonIcon,
  IonFooter,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { locationOutline, navigateOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Marker, useMapEvents } from 'react-leaflet';
import LeafletMap from '../../components/Map/LeafletMap';
import { markerIcon } from '../../components/Map/mapIcons';

interface Suggestion {
  display: string;
  lat: string;
  lon: string;
}

const geocodeCache = new Map<string, Suggestion[]>();
const reverseCache = new Map<string, Suggestion>();
let lastGeocodeCall = 0;

const reverseGeocode = async (lat: number, lng: number): Promise<Suggestion | null> => {
  const key = `${lat},${lng}`;
  const cached = reverseCache.get(key);
  if (cached) return cached;

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
    if (!f) return null;
    const parts = [
      f.properties.name && f.properties.street
        ? `${f.properties.name} ${f.properties.street}`
        : f.properties.street || '',
      f.properties.district || '',
      f.properties.city || '',
      f.properties.state || '',
    ].filter(Boolean);
    const result = {
      display: parts.join(', '),
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
    };
    reverseCache.set(key, result);
    return result;
  } catch (err) {
    console.error('Reverse geocode error:', err);
    return null;
  }
};

const LocationMarker: React.FC<{
  position: [number, number] | null;
  onLocationChange: (loc: { lat: number; lng: number }) => void;
}> = ({ position, onLocationChange }) => {
  useMapEvents({
    click: async (e) => {
      onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position ? <Marker position={position} icon={markerIcon} /> : null;
};

const VendorLocationPicker: React.FC = () => {
  const history = useHistory();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Suggestion | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [fetching, setFetching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const geocodeRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setSuggestions([]); return; }

    const trimmed = query.trim();
    const cached = geocodeCache.get(trimmed.toLowerCase());
    if (cached) {
      setSuggestions(cached);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setFetching(true);
      try {
        const now = Date.now();
        const elapsed = now - lastGeocodeCall;
        if (elapsed < 1000) {
          await new Promise(r => setTimeout(r, 1000 - elapsed));
        }
        lastGeocodeCall = Date.now();

        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en&countrycode=PH`,
          { headers: { 'User-Agent': 'E-Hatid/1.0' } }
        );
        const data = await res.json();
        const results = (data.features || []).map((f: any) => {
            const parts = [
              f.properties.name && f.properties.street
                ? `${f.properties.name} ${f.properties.street}`
                : f.properties.street || '',
              f.properties.district || '',
              f.properties.city || '',
              f.properties.state || '',
            ].filter(Boolean);
            return {
              display: parts.join(', '),
              lat: f.geometry.coordinates[1],
              lon: f.geometry.coordinates[0],
            };
          });
        geocodeCache.set(query.trim().toLowerCase(), results);
        setSuggestions(results);
      } catch (err) {
        console.error('Geocode search error:', err);
        setSuggestions([]);
      } finally {
        setFetching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    if (!selectedLocation) return;
    if (geocodeRef.current) clearTimeout(geocodeRef.current);
    geocodeRef.current = setTimeout(async () => {
      setFetching(true);
      const result = await reverseGeocode(selectedLocation.lat, selectedLocation.lng);
      if (result) {
        setSelectedAddress(result);
        setQuery(result.display);
      }
      setFetching(false);
    }, 200);
    return () => { if (geocodeRef.current) clearTimeout(geocodeRef.current); };
  }, [selectedLocation]);

  const selectSuggestion = (s: Suggestion) => {
    setSelectedAddress(s);
    setQuery(s.display);
    setSuggestions([]);
    setSelectedLocation({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
  };

  const handleMapClick = (loc: { lat: number; lng: number }) => {
    setSelectedLocation(loc);
    setSuggestions([]);
  };

  const handleUseCurrentLocation = async () => {
    if (!('geolocation' in navigator)) {
      setToastMessage('Location is not supported on this device');
      setShowToast(true);
      return;
    }
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setSelectedLocation(loc);
      setSuggestions([]);
      const result = await reverseGeocode(loc.lat, loc.lng);
      if (result) {
        setSelectedAddress(result);
        setQuery(result.display);
      } else {
        setToastMessage("Couldn't find your address");
        setShowToast(true);
      }
    } catch {
      setToastMessage("Couldn't get your location");
      setShowToast(true);
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedAddress || !selectedLocation) return;
    sessionStorage.setItem('vendorSelectedLocation', JSON.stringify(selectedLocation));
    sessionStorage.setItem('vendorLocationName', selectedAddress.display);
    setToastMessage('Location saved');
    setShowToast(true);
    setTimeout(() => history.push('/vendor/profile'), 600);
  };

  return (
    <>
      <div className="w-full flex-1 md:pt-8">
        <div className="flex-1 max-w-2xl mx-auto w-full px-3 sm:px-4 md:px-6 pt-2 sm:pt-3 pb-6 sm:pb-8 flex flex-col space-y-3 sm:space-y-4">
          <div className="w-full h-[35vh] sm:h-[40vh] md:h-[45vh] rounded-2xl overflow-hidden border border-[var(--ion-border-color)]">
            <LeafletMap
              center={[selectedLocation?.lat || 14.5995, selectedLocation?.lng || 120.9842]}
              zoom={15}
              className="w-full h-full"
            >
              <LocationMarker
                position={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null}
                onLocationChange={handleMapClick}
              />
            </LeafletMap>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs sm:text-sm font-semibold text-[var(--ion-text-color)] uppercase opacity-70">
                Stall Address
              </label>
              <IonButton size="small" fill="outline" shape="round" onClick={handleUseCurrentLocation} disabled={locating}>
                {locating ? <IonSpinner name="crescent" slot="start" /> : <IonIcon icon={navigateOutline} slot="start" />}
                Use my location
              </IonButton>
            </div>
            <div className="relative">
              <IonIcon icon={locationOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ion-color-primary)] text-lg z-[1]" />
              <IonInput
                type="text"
                placeholder="Search your stall address..."
                value={query}
                onIonInput={e => { setQuery(e.detail.value || ''); setSelectedAddress(null); }}
                className="[--color:var(--ion-text-color)] [--background:var(--ion-background-color)] border border-[var(--ion-border-color)] rounded-xl text-sm"
                style={{ '--padding-start': '48px', '--border-radius': '12px', '--highlight-height': '0', '--min-height': '44px' } as any}
              />
              {fetching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--ion-text-color-secondary)]">
                  Searching...
                </span>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-[100] bg-[var(--ion-card-background)] border border-[var(--ion-border-color)] rounded-b-xl shadow-lg max-h-[200px] overflow-y-auto">
                {suggestions.map((s, i) => (
                  <IonItem key={i} button onClick={() => selectSuggestion(s)} className="min-h-[44px] text-xs sm:text-sm" style={{ '--background': 'transparent', '--border-color': 'var(--ion-border-color)' } as any}>
                    <IonIcon icon={locationOutline} slot="start" className="text-[var(--ion-color-primary)]" />
                    <IonLabel className="truncate text-[var(--ion-text-color)]">{s.display}</IonLabel>
                  </IonItem>
                ))}
              </div>
            )}
          </div>

          {selectedAddress && (
            <div className="bg-[var(--ion-card-background)] p-4 md:p-6 rounded-2xl border border-[var(--ion-border-color)]">
              <div className="flex gap-3">
                <IonIcon icon={locationOutline} className="text-[var(--ion-color-primary)] text-lg shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="m-0 mb-1 text-xs text-[var(--ion-text-color-secondary)]">
                    Selected Address
                  </p>
                  <p className="m-0 font-semibold text-xs sm:text-sm text-[var(--ion-text-color)] leading-relaxed">
                    {selectedAddress.display}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedAddress && selectedLocation && (
        <IonFooter style={{ '--background': 'var(--ion-card-background)' } as any}>
          <div className="border-t border-[var(--ion-border-color)] px-3 sm:px-4 py-3 sm:py-4">
            <div className="max-w-2xl mx-auto">
              <IonButton expand="block" size="large" shape="round"
                className="min-h-[48px] font-bold"
                onClick={handleConfirm}
              >
                <IonIcon slot="start" icon={locationOutline} />
                Confirm Location
              </IonButton>
            </div>
          </div>
        </IonFooter>
      )}

      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={2000}
        position="bottom"
        color="dark"
        onDidDismiss={() => setShowToast(false)}
      />
    </>
  );
};

export default VendorLocationPicker;
