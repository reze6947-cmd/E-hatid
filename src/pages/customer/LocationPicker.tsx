// src/pages/User/LocationPicker.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  IonButton,
  IonIcon,
  IonFooter,
  IonInput,
  IonToast,
  IonSpinner,
} from '@ionic/react';
import { locationOutline, documentTextOutline, personOutline, locateOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Marker, useMapEvents } from 'react-leaflet';
import LeafletMap from '../../components/Map/LeafletMap';
import { markerIcon } from '../../components/Map/mapIcons';


interface Suggestion {
  display: string;
  lat: string;
  lon: string;
}

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
    click: (e) => {
      onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position ? (
    <Marker
      position={position}
      icon={markerIcon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target as any;
          const ll = marker.getLatLng();
          onLocationChange({ lat: ll.lat, lng: ll.lng });
        },
      }}
    />
  ) : null;
};

const LocationPicker: React.FC = () => {
  const history = useHistory();
  const { user, updateUserProfile } = useAuth();
  const [query, setQuery] = useState(user?.address || '');
  const [houseDetail, setHouseDetail] = useState('');
  const [streetDetail, setStreetDetail] = useState('');
  const [landmarkDetail, setLandmarkDetail] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<Suggestion | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    user?.latitude != null && user?.longitude != null
      ? { lat: user.latitude, lng: user.longitude }
      : null
  );
  const [locating, setLocating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [focusZoom, setFocusZoom] = useState<number | undefined>(undefined);
  const geocodeRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Reverse geocode when map is clicked
  useEffect(() => {
    if (!selectedLocation) return;
    if (geocodeRef.current) clearTimeout(geocodeRef.current);
    geocodeRef.current = setTimeout(async () => {
      const result = await reverseGeocode(selectedLocation.lat, selectedLocation.lng);
      if (result) {
        setSelectedAddress(result);
        setQuery(result.display);
      }
    }, 200);
    return () => { if (geocodeRef.current) clearTimeout(geocodeRef.current); };
  }, [selectedLocation]);

  const handleLocationChange = (loc: { lat: number; lng: number }) => {
    setSelectedLocation(loc);
    setFocusZoom(undefined);
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
      setFocusZoom(undefined);
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

  const buildFinalLabel = (base: string) => {
    const manualParts = [houseDetail.trim(), streetDetail.trim(), landmarkDetail.trim()].filter(Boolean);
    return manualParts.length ? `${manualParts.join(', ')}, ${base}` : base;
  };

  const handleConfirm = async () => {
    if (!selectedLocation) return;
    const fresh = await reverseGeocode(selectedLocation.lat, selectedLocation.lng);
    const address = fresh || selectedAddress;
    if (!address) {
      setToastMessage("Couldn't determine your address. Please tap your exact spot on the map.");
      setShowToast(true);
      return;
    }
    const finalLabel = buildFinalLabel(address.display);
    setSelectedAddress(address);
    setQuery(finalLabel);
    sessionStorage.setItem('selectedLocation', JSON.stringify(selectedLocation));
    sessionStorage.setItem('locationName', finalLabel);
    if (user) {
      await updateUserProfile({
        address: finalLabel,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      }).catch(() => {});
    }
    setToastMessage('Location saved');
    setShowToast(true);
    setTimeout(() => history.goBack(), 600);
  };

  return (
    <>


        <div className="w-full flex-1 md:pt-8">
        <div className="flex-1 max-w-2xl mx-auto w-full px-3 sm:px-4 md:px-6 pt-2 sm:pt-3 pb-6 sm:pb-8 flex flex-col space-y-3 sm:space-y-4">
          {/* Map */}
          <div className="w-full h-[35vh] sm:h-[40vh] md:h-[45vh] rounded-2xl overflow-hidden border border-[var(--ion-border-color)]">
            <LeafletMap
              center={[selectedLocation?.lat || 14.5995, selectedLocation?.lng || 120.9842]}
              zoom={15}
              focusZoom={focusZoom}
              className="w-full h-full"
            >
              <LocationMarker
                position={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null}
                onLocationChange={handleLocationChange}
              />
            </LeafletMap>
          </div>
          <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">
            Tap the map or drag the pin to your exact spot.
          </p>

          {/* Address Search with Autocomplete */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs sm:text-sm font-semibold text-[var(--ion-text-color)] uppercase opacity-70">
                Delivery Address
              </label>
              <IonButton
                size="small"
                fill="outline"
                shape="round"
                className="min-h-[32px] font-semibold"
                onClick={handleUseCurrentLocation}
                disabled={locating}
              >
                {locating ? (
                  <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
                ) : (
                  <IonIcon icon={locateOutline} slot="start" />
                )}
                {locating ? 'Locating...' : 'Use my location'}
              </IonButton>
            </div>
            <div className="relative">
              <IonIcon icon={locationOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ion-color-primary)] text-lg z-[1]" />
              <IonInput
                type="text"
                placeholder="Your delivery address"
                value={query}
                onIonInput={e => setQuery(e.detail.value || '')}
                className="[--color:var(--ion-text-color)] [--background:var(--ion-background-color)] border border-[var(--ion-border-color)] rounded-xl text-sm"
                style={{ '--padding-start': '48px', '--border-radius': '12px', '--highlight-height': '0', '--min-height': '44px' } as any}
              />
            </div>
          </div>

          {/* House number / Street / Landmark details */}
          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-semibold text-[var(--ion-text-color)] uppercase opacity-70">
              Address Details (optional)
            </label>
            <div className="relative">
              <IonIcon icon={documentTextOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ion-color-primary)] text-lg z-[1]" />
              <IonInput
                type="text"
                placeholder="House / Unit # — e.g. House 12, Unit 3B"
                value={houseDetail}
                onIonInput={e => setHouseDetail(e.detail.value || '')}
                className="[--color:var(--ion-text-color)] [--background:var(--ion-background-color)] border border-[var(--ion-border-color)] rounded-xl text-sm"
                style={{ '--padding-start': '48px', '--border-radius': '12px', '--highlight-height': '0', '--min-height': '44px' } as any}
              />
            </div>
            <div className="relative">
              <IonIcon icon={locationOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ion-color-primary)] text-lg z-[1]" />
              <IonInput
                type="text"
                placeholder="Street / Subdivision — e.g. Alltop Compound, Merville"
                value={streetDetail}
                onIonInput={e => setStreetDetail(e.detail.value || '')}
                className="[--color:var(--ion-text-color)] [--background:var(--ion-background-color)] border border-[var(--ion-border-color)] rounded-xl text-sm"
                style={{ '--padding-start': '48px', '--border-radius': '12px', '--highlight-height': '0', '--min-height': '44px' } as any}
              />
            </div>
            <div className="relative">
              <IonIcon icon={personOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ion-color-primary)] text-lg z-[1]" />
              <IonInput
                type="text"
                placeholder="Landmark — e.g. near Merville Gate 2, beside 7-Eleven"
                value={landmarkDetail}
                onIonInput={e => setLandmarkDetail(e.detail.value || '')}
                className="[--color:var(--ion-text-color)] [--background:var(--ion-background-color)] border border-[var(--ion-border-color)] rounded-xl text-sm"
                style={{ '--padding-start': '48px', '--border-radius': '12px', '--highlight-height': '0', '--min-height': '44px' } as any}
              />
            </div>
            <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">
              Your exact spot comes from the map pin. Add these details so the rider can easily recognize your house.
            </p>
          </div>

          {/* Selected Address Display */}
          {selectedAddress && (
            <div className="bg-[var(--ion-card-background)] p-4 md:p-6 rounded-2xl border border-[var(--ion-border-color)]">
              <div className="flex gap-3">
                <IonIcon icon={locationOutline} className="text-[var(--ion-color-primary)] text-lg shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="m-0 mb-1 text-xs text-[var(--ion-text-color-secondary)]">
                    Selected Address
                  </p>
                  <p className="m-0 font-semibold text-xs sm:text-sm text-[var(--ion-text-color)] leading-relaxed">
                    {buildFinalLabel(selectedAddress.display)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>

      {/* Footer */}
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
        onDidDismiss={() => setShowToast(false)}
      />
    </>
  );
};

export default LocationPicker;
