import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IonSearchbar,
  IonIcon,
  IonButton,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { fetchStalls, getCategories } from '../../services/stallService';
import { registerRefreshHandler } from '../../utils/refreshBus';
import { reverseGeocode, haversineKm, minutesFromKm, getStoredCoords } from '../../utils/geocode';

import PageLoader from '../../components/PageLoader';
import FilterPills from '../../components/FilterPills';
import OptimizedImage from '../../components/OptimizedImage';
import Seo from '../../components/Seo';
import { SITE_KEYWORDS } from '../../config/seo';
import { Stall } from '../../types/index';
import {
  locationOutline,
  starOutline,
  chevronForwardOutline,
  timeOutline,
  carOutline,
  navigateOutline,
  storefrontOutline,
  closeOutline,
  flameOutline,
} from 'ionicons/icons';

const NEAREST_LIMIT = 12;

const CustomerHome: React.FC = () => {
  const history = useHistory();
  const { user, isAuthenticated, updateUserProfile } = useAuth();
  useCart();
  const [allStalls, setAllStalls] = useState<Stall[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [nearestLocating, setNearestLocating] = useState(false);
  const [nearestStall, setNearestStall] = useState<Stall | null>(null);
  const [nearestDistanceKm, setNearestDistanceKm] = useState<number | null>(null);
  const [nearestShow, setNearestShow] = useState(true);
  const [manualCoords, setManualCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const categories = getCategories();

  const userCoords = manualCoords
    ?? getStoredCoords()
    ?? (user?.latitude != null && user?.longitude != null ? { lat: user.latitude, lng: user.longitude } : null);

  const distanceMap = useMemo(() => {
    if (!userCoords) return {} as Record<string, number>;
    const map: Record<string, number> = {};
    for (const s of allStalls) {
      if (s.latitude != null && s.longitude != null) {
        map[s.id] = haversineKm(userCoords.lat, userCoords.lng, s.latitude, s.longitude);
      }
    }
    return map;
  }, [allStalls, userCoords]);

  const loadStalls = useCallback(async () => {
    try {
      const data = await fetchStalls({});
      setAllStalls(data);
      setLoadError(false);
    } catch (error) {
      console.error('Error loading stalls:', error);
      setLoadError(true);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStalls();
  }, [loadStalls]);

  useEffect(() => {
    registerRefreshHandler(loadStalls);
    return () => registerRefreshHandler(null);
  }, [loadStalls]);

  const filteredStalls = useMemo(() => {
    let result = allStalls;
    if (selectedCategory !== 'All') {
      result = result.filter(s => s.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q)
      );
    }
    if (userCoords && Object.keys(distanceMap).length > 0) {
      const sorted = [...result].sort((a, b) => {
        const da = distanceMap[a.id] ?? Infinity;
        const db = distanceMap[b.id] ?? Infinity;
        if (da === db) return 0;
        if (da === Infinity) return 1;
        if (db === Infinity) return -1;
        return da - db;
      });
      return sorted.slice(0, NEAREST_LIMIT);
    }
    return result;
  }, [allStalls, selectedCategory, searchQuery, userCoords, distanceMap]);

  const popularStalls = useMemo(() => {
    return [...allStalls]
      .filter(s => s.active !== false && (s.rating || 0) > 0 && (s.logo || s.image))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8);
  }, [allStalls]);

  const totalFiltered = useMemo(() => {
    let result = allStalls;
    if (selectedCategory !== 'All') result = result.filter(s => s.category === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q)
      );
    }
    return result.length;
  }, [allStalls, selectedCategory, searchQuery]);

  const isNearestLimited = userCoords != null && Object.keys(distanceMap).length > 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleSearch = (e: CustomEvent) => {
    setSearchQuery(e.detail.value || '');
  };

  const handleFindNearest = async () => {
    if (!('geolocation' in navigator)) {
      setToastMessage('Location is not supported on this device');
      setShowToast(true);
      return;
    }
    setNearestLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const address = (await reverseGeocode(lat, lng)) || 'Current Location';

      setManualCoords({ lat, lng });
      sessionStorage.setItem('selectedLocation', JSON.stringify({ lat, lng }));
      sessionStorage.setItem('locationName', address);
      await updateUserProfile({ address, latitude: lat, longitude: lng }).catch(() => {});

      const candidates = allStalls.filter(
        s => s.active !== false && s.latitude != null && s.longitude != null
      );
      if (candidates.length === 0) {
        setToastMessage('No nearby stall has a location set yet');
        setShowToast(true);
        return;
      }
      let best = candidates[0];
      let bestDist = Infinity;
      for (const s of candidates) {
        const d = haversineKm(lat, lng, s.latitude!, s.longitude!);
        if (d < bestDist) { bestDist = d; best = s; }
      }
      setNearestStall(best);
      setNearestDistanceKm(bestDist);
      setNearestShow(true);
      setToastMessage('Delivery address updated');
      setShowToast(true);

      requestAnimationFrame(() => {
        const el = document.getElementById(`stall-${best.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } catch {
      setToastMessage("Couldn't get your location");
      setShowToast(true);
    } finally {
      setNearestLocating(false);
    }
  };

  if (initialLoading) {
    return <PageLoader message="Loading nearby stalls..." />;
  }

  return (
    <>
      {user ? (
        <Seo title="Home" description="Order food delivery near you on E-Hatid." noindex />
      ) : (
        <Seo
          title="Food Stalls &amp; Delivery Near You"
          description="Browse food stalls near you, compare delivery fees, and order food delivery online with E-Hatid."
          keywords={SITE_KEYWORDS}
          canonicalPath="/guest/home"
        />
      )}

      <div className="w-full flex-1 md:pt-8 pb-10 flex flex-col space-y-3 sm:space-y-4">
        {/* Header Section */}
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--ion-text-color)] m-0 truncate">
            {user ? `${getGreeting()}${user.name ? `, ${user.name}` : ''}!` : 'Food Stalls & Delivery Near You'}
          </h1>
          <p className="text-sm xs:text-base sm:text-lg text-[var(--ion-text-color-secondary)] mt-1 sm:mt-2">
            {user ? 'What would you like to eat today?' : 'Browse local food stalls and order food delivery online.'}
          </p>
        </div>

        {/* Location */}
        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 min-w-0 flex-1" onClick={() => history.push('/customer/location')}>
              <IonIcon icon={locationOutline} className="text-[var(--ion-color-primary)] text-lg shrink-0" />
              <span className="text-sm sm:text-base text-[var(--ion-text-color)] font-medium truncate">{sessionStorage.getItem('locationName') || user?.address || 'Set your delivery address'}</span>
              <IonIcon icon={chevronForwardOutline} className="text-[var(--ion-text-color-secondary)] text-sm shrink-0 ml-auto" />
            </div>
            <IonButton
              size="small"
              fill="outline"
              shape="round"
              className="shrink-0 min-h-[32px] font-semibold"
              onClick={handleFindNearest}
              disabled={nearestLocating}
            >
              {nearestLocating ? (
                <IonSpinner name="crescent" style={{ width: 14, height: 14 }} />
              ) : (
                <IonIcon icon={navigateOutline} slot="start" />
              )}
              {nearestLocating ? 'Finding...' : 'Nearest to me'}
            </IonButton>
          </div>
        )}

        {/* Search Bar */}
        <div>
          <IonSearchbar
            className="[--box-shadow:none] [--border-radius:12px] [--background:var(--ion-card-background)]"
            placeholder="Search for food, stalls..."
            value={searchQuery}
            onIonInput={handleSearch}
          />
        </div>

        {/* Categories */}
        <FilterPills
          layoutId="customer-home-pill"
          value={selectedCategory}
          onChange={setSelectedCategory}
          items={categories.map(cat => ({ id: cat, label: cat }))}
        />

        {/* Main Content */}
        <div className="min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--ion-text-color)] m-0">
              {selectedCategory === 'All' ? 'All Stalls' : selectedCategory}
            </h2>
            <span className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)]">
              {isNearestLimited && filteredStalls.length < totalFiltered
                ? `Showing ${filteredStalls.length} of ${totalFiltered} nearest`
                : `${totalFiltered} results`}
            </span>
          </div>

          {popularStalls.length > 0 && !searchQuery && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-3">
                <IonIcon icon={flameOutline} className="text-lg text-[var(--ion-color-primary)]" />
                <h2 className="m-0 text-base sm:text-lg font-bold text-[var(--ion-text-color)]">Popular Stalls</h2>
              </div>
              <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
                <div className="flex gap-4 w-max">
                  {popularStalls.map(stall => (
                    <button
                      key={stall.id}
                      type="button"
                      aria-label={stall.name}
                      title={stall.name}
                      onClick={() => history.push(`/stall/${stall.id}/menu`)}
                      className="flex flex-col items-center gap-2 cursor-pointer group"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-[var(--ion-card-background)] border border-[var(--ion-border-color)] shadow-sm transition-all duration-200 group-hover:scale-105 group-active:scale-95">
                        {stall.logo || stall.image ? (
                          <OptimizedImage src={stall.logo || stall.image} alt={stall.name} width={80} height={80} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[var(--ion-color-primary)] text-white text-2xl font-bold">
                            {stall.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {userCoords && distanceMap[stall.id] != null && (
                        <span className="text-[11px] font-semibold text-[var(--ion-color-primary)]">
                          {minutesFromKm(distanceMap[stall.id])} min away
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {nearestStall && nearestShow && (
            <div className="flex items-center gap-3 mb-4 p-3 sm:p-4 rounded-2xl border border-[var(--ion-color-primary)]/40 bg-[var(--ion-card-background)] shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--ion-color-primary)]/10 flex items-center justify-center shrink-0">
                <IonIcon icon={storefrontOutline} className="text-xl text-[var(--ion-color-primary)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="m-0 mb-0.5 text-[11px] sm:text-xs font-bold uppercase tracking-wide text-[var(--ion-color-primary)]">Nearest to you</p>
                <p className="m-0 text-sm sm:text-base font-semibold text-[var(--ion-text-color)] truncate">
                  {nearestStall.name}
                  {nearestDistanceKm != null && (
                    <span className="ml-2 text-xs font-medium text-[var(--ion-text-color-secondary)]">{minutesFromKm(nearestDistanceKm)} min away</span>
                  )}
                </p>
              </div>
              <IonButton shape="round" size="small" className="shrink-0 font-semibold" onClick={() => history.push(`/stall/${nearestStall.id}/menu`)}>
                View Menu
              </IonButton>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setNearestShow(false)}
                className="shrink-0 p-1.5 rounded-full text-[var(--ion-text-color-secondary)] hover:bg-[var(--ion-border-color)]/40 cursor-pointer"
              >
                <IonIcon icon={closeOutline} className="text-base" />
              </button>
            </div>
          )}

          {loadError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-full bg-[var(--ion-card-background)] border-2 border-[var(--ion-border-color)] flex items-center justify-center mb-4 sm:mb-6">
                <IonIcon icon={carOutline} className="text-4xl sm:text-5xl text-[var(--ion-color-primary)]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--ion-text-color)] m-0 mb-2">Couldn't load stalls</h3>
              <p className="text-sm text-[var(--ion-text-color-secondary)] m-0 mb-4">Check your connection and try again</p>
              <IonButton shape="round" onClick={loadStalls}>Retry</IonButton>
            </div>
          ) : filteredStalls.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-full bg-[var(--ion-card-background)] border-2 border-[var(--ion-border-color)] flex items-center justify-center mb-4 sm:mb-6">
                <IonIcon icon={carOutline} className="text-4xl sm:text-5xl text-[var(--ion-color-primary)]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--ion-text-color)] m-0 mb-2">No stalls found</h3>
              <p className="text-sm text-[var(--ion-text-color-secondary)] m-0">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {filteredStalls.map((stall) => (
                <div key={stall.id} id={`stall-${stall.id}`} className={`rounded-2xl overflow-hidden bg-[var(--ion-card-background)] border border-[var(--ion-border-color)] shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${nearestStall?.id === stall.id && nearestShow ? 'ring-2 ring-[var(--ion-color-primary)]' : ''}`} onClick={() => history.push(`/stall/${stall.id}/menu`)}>
                  <div className="relative aspect-square overflow-hidden" data-initial={stall.name.charAt(0)}>
                    <OptimizedImage src={stall.logo || stall.image} alt={stall.name} width={400} height={400} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('img-failed'); }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    {nearestStall?.id === stall.id && nearestShow && (
                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 bg-[var(--ion-color-primary)] text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                        <IonIcon icon={navigateOutline} className="text-xs" />
                        <span>Nearest{nearestDistanceKm != null ? ` · ${minutesFromKm(nearestDistanceKm)} min` : ''}</span>
                      </div>
                    )}
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 bg-white/90 dark:bg-[#1E293B]/90 text-gray-800 dark:text-gray-200 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                      {stall.rating ? (
                        <>
                          <IonIcon icon={starOutline} className="text-amber-500 text-xs" />
                          <span>{stall.rating}</span>
                        </>
                      ) : (
                        <span>New</span>
                      )}
                    </div>
                    {stall.active === false && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full bg-black/70 text-white text-xs sm:text-sm font-semibold">Closed</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-bold text-[var(--ion-text-color)] truncate m-0 mb-1">{stall.name}</h3>
                    <p className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)] m-0 mb-2">{stall.category}</p>
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-[var(--ion-text-color-secondary)]">
                      <span className="flex items-center gap-1">
                        <IonIcon icon={timeOutline} className="text-sm" />
                        {stall.deliveryTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <IonIcon icon={carOutline} className="text-sm" />
                        &#x20B1;{stall.deliveryFee}
                      </span>
                      {distanceMap[stall.id] != null && (
                        <span className="flex items-center gap-1 font-medium text-[var(--ion-color-primary)]">
                          <IonIcon icon={navigateOutline} className="text-sm" />
                          {minutesFromKm(distanceMap[stall.id])} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={2500}
        position="bottom"
        color="dark"
        onDidDismiss={() => setShowToast(false)}
      />
    </>
  );
};

export default CustomerHome;
