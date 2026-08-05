import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useHistory } from 'react-router-dom';
import { IonIcon, IonButton, IonSearchbar } from '@ionic/react';
import { locationOutline, star, timeOutline, carOutline, cartOutline, documentTextOutline, cloudOfflineOutline, starOutline, searchOutline } from 'ionicons/icons';
import { fetchStallById } from '../services/stallService';
import { fetchReviewsByStall, getReviewStats } from '../services/reviewService';
import { Stall, MenuItem, SelectedOption, SelectedAddOn, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import MenuItemModal from '../components/Stall/MenuItemModal';
import AuthRequiredModal from '../components/Auth/AuthRequiredModal';
import PageLoader from '../components/PageLoader';
import ProductCard from '../components/Stall/ProductCard';
import { registerRefreshHandler } from '../utils/refreshBus';
import { haversineKm, minutesFromKm, getStoredCoords } from '../utils/geocode';

const StallDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [stall, setStall] = useState<Stall | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0, distribution: [0, 0, 0, 0, 0] as number[] });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const history = useHistory();
  const { user } = useAuth();
  const { addToCart, items } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const sectionRefMap = useRef<Map<string, HTMLDivElement>>(new Map());

  const setSectionRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) { sectionRefMap.current.set(id, el); }
    else { sectionRefMap.current.delete(id); }
  }, []);

  const headerRefMap = useRef<Map<string, HTMLDivElement>>(new Map());

  const setHeaderRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) { headerRefMap.current.set(id, el); }
    else { headerRefMap.current.delete(id); }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadStall = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      if (id) {
        const data = await fetchStallById(id);
        setStall(data || null);
      }
    } catch (error) {
      console.error('Error loading stall:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadStall();
  }, [loadStall]);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    setReviewsLoading(true);
    (async () => {
      try {
        const [allReviews, stats] = await Promise.all([
          fetchReviewsByStall(id),
          getReviewStats(id),
        ]);
        if (cancelled) return;
        setReviews(allReviews);
        setReviewStats(stats);
      } catch (err) {
        console.error('Error loading reviews:', err);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    registerRefreshHandler(loadStall);
    return () => registerRefreshHandler(null);
  }, [loadStall]);

  const availableItems = stall?.menu?.filter(item => item.available) || [];
  const popularItems = availableItems.filter(item => item.popular);
  const categories = [...new Set(availableItems.map(item => item.category))];

  const cartItemsForStall = items.filter(i => i.stallId === id);
  const cartCount = cartItemsForStall.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItemsForStall.reduce((s, i) => s + i.price * i.quantity, 0);
  const isSearching = searchQuery.trim().length > 0;
  const searchResults = isSearching
    ? availableItems.filter(item => {
        const q = searchQuery.trim().toLowerCase();
        return item.name.toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q);
      })
    : [];

  const goToCart = useCallback(() => {
    if (user) {
      history.push('/customer/cart');
    } else {
      setShowAuthModal(true);
    }
  }, [history, user]);
  const navItems = [
    ...(popularItems.length > 0 ? [{ id: 'popular', label: '🔥 Popular' }] : []),
    ...categories.map(c => ({ id: c, label: c }))
  ];

  const handleItemClick = useCallback((item: MenuItem) => {
    setSelectedItem(item);
  }, []);

  const handleAddToCart = useCallback((input: {
    item: MenuItem;
    selectedOptions: SelectedOption[];
    selectedAddOns: SelectedAddOn[];
    specialInstructions: string;
  }) => {
    addToCart({ ...input, item: { ...input.item, stallId: id } });
  }, [addToCart, id]);

  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
  }, []);

  useEffect(() => {
    if (loading || !stall || navItems.length === 0) return;
    setActiveSection(prev => prev || navItems[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        let bestEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting && (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio)) {
            bestEntry = entry;
          }
        }
        if (bestEntry) {
          const sectionId = bestEntry.target.getAttribute('data-header');
          if (sectionId) setActiveSection(sectionId);
        }
      },
      { threshold: 0, rootMargin: '-112px 0px -90% 0px' }
    );

    const refs = headerRefMap.current;
    refs.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, stall, navItems.length]);

  if (loading || reviewsLoading) {
    return <PageLoader message="Loading this stall's menu..." />;
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <div className="w-20 h-20 rounded-full bg-[var(--ion-card-background)] border-2 border-[var(--ion-border-color)] flex items-center justify-center">
          <IonIcon icon={cloudOfflineOutline} className="text-3xl text-[var(--ion-color-primary)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--ion-text-color)]">Couldn't load this stall</h2>
        <p className="text-sm text-[var(--ion-text-color-secondary)]">Check your connection and try again</p>
        <IonButton shape="round" onClick={loadStall}>Retry</IonButton>
      </div>
    );
  }

  if (!stall) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
        <div className="w-20 h-20 rounded-full bg-[var(--ion-card-background)] border-2 border-[var(--ion-border-color)] flex items-center justify-center">
          <IonIcon icon={documentTextOutline} className="text-3xl text-[var(--ion-color-primary)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--ion-text-color)]">Stall not found</h2>
        <p className="text-sm text-[var(--ion-text-color-secondary)]">This stall may have been removed or is unavailable</p>
        <IonButton shape="round" routerLink={user ? '/customer/home' : '/guest/home'}>
          Go back home
        </IonButton>
      </div>
    );
  }

  const menuItemsByCategory = (category: string) =>
    availableItems.filter(item => item.category === category && !item.popular);

  const userCoords = getStoredCoords()
    ?? (user?.latitude != null && user?.longitude != null ? { lat: user.latitude, lng: user.longitude } : null);
  const etaMinutes = userCoords && stall.latitude != null && stall.longitude != null
    ? minutesFromKm(haversineKm(userCoords.lat, userCoords.lng, stall.latitude, stall.longitude))
    : null;

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Banner */}
        <div className="relative w-full h-[180px] sm:h-[220px] md:h-[280px] lg:h-[350px] overflow-hidden bg-[var(--ion-background-color)]">
          <img
            src={stall.image}
            alt={stall.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Logo + Info section */}
        <div className="px-4 md:px-6 lg:px-8">
          <div className="flex items-start gap-4 pt-4 md:pt-5">
            {stall.logo && (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] shrink-0">
                <img
                  src={stall.logo}
                  alt={`${stall.name} logo`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[var(--ion-text-color)] m-0 line-clamp-2">{stall.name}</h1>
                  <p className="text-sm text-[var(--ion-color-primary)] font-medium mt-0.5">{stall.category}</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full text-sm font-semibold shrink-0 mt-1">
                  <IonIcon icon={star} className="text-amber-500 text-sm" />
                  <span>{stall.rating}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm text-[var(--ion-text-color-secondary)]">
                <span className="flex items-center gap-1">
                  <IonIcon icon={timeOutline} className="text-sm shrink-0" />
                  {stall.deliveryTime}
                </span>
                <span className="flex items-center gap-1">
                  <IonIcon icon={carOutline} className="text-sm shrink-0" />
                  Delivery varies based on distance
                </span>
                <span className="flex items-center gap-1">
                  <IonIcon icon={locationOutline} className="text-sm shrink-0" />
                  {etaMinutes != null ? `${etaMinutes} min away` : 'Near you'}
                </span>
              </div>

              {stall.description && (
                <p className="text-sm text-[var(--ion-text-color-secondary)] mt-3 leading-relaxed">{stall.description}</p>
              )}
            </div>
          </div>
        </div>

        {stall.active === false && (
          <div className="px-4 md:px-6 lg:px-8">
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-center">
              This stall is temporarily closed and not accepting orders right now.
            </div>
          </div>
        )}

        {/* Sticky Category Navigation */}
        {navItems.length > 1 && (
          <div className="sticky top-0 z-20 bg-[var(--ion-card-background)] border-b border-[var(--ion-border-color)] mt-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 p-1 rounded-full w-max min-w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
              {navItems.map(nav => (
                <button
                  key={nav.id}
                  onClick={() => {
                    setActiveSection(nav.id);
                    const el = sectionRefMap.current.get(nav.id);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="relative min-w-[88px] sm:min-w-[100px] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-95 rounded-full"
                >
                  {activeSection === nav.id && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-[var(--ion-color-primary)] rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 50, mass: 1.2 }}
                    />
                  )}
                  <span className={`relative z-10 block truncate ${activeSection === nav.id ? "text-white" : "text-gray-500 dark:text-gray-300"}`}>
                    {nav.label}
                  </span>
                </button>
              ))}
              {cartCount > 0 && (
                <button
                  type="button"
                  aria-label="Go to cart"
                  onClick={goToCart}
                  className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[var(--ion-color-primary)]/10 text-[var(--ion-color-primary)] cursor-pointer"
                >
                  <IonIcon icon={cartOutline} className="text-lg" />
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--ion-color-primary)] text-white text-[10px] font-bold flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search within menu */}
        <div className="px-4 md:px-6 lg:px-8 pt-4">
          <IonSearchbar
            className="[--box-shadow:none] [--border-radius:12px] [--background:var(--ion-card-background)]"
            placeholder={`Search ${stall.name} menu...`}
            value={searchQuery}
            onIonInput={e => setSearchQuery(e.detail.value || '')}
          />
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          {isSearching ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--ion-text-color)] m-0">Search results</h2>
                <span className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)]">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <IonIcon icon={searchOutline} className="text-4xl text-[var(--ion-text-color-secondary)] mb-2" />
                  <p className="m-0 text-sm text-[var(--ion-text-color-secondary)]">No items match "{searchQuery.trim()}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                  {searchResults.map(item => (
                    <ProductCard key={item.id} item={item} stallImage={stall.image} onItemClick={handleItemClick} showPopularBadge={!!item.popular} />
                  ))}
                </div>
              )}
            </div>
          ) : (
          <>
          {popularItems.length > 0 && (
            <div ref={setSectionRef('popular')} data-section="popular" className="mb-6 sm:mb-8">
              <div ref={setHeaderRef('popular')} data-header="popular" className="mb-3 sm:mb-4 mt-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🔥</span>
                  <h2 className="text-lg font-semibold text-[var(--ion-text-color)] m-0">Popular Orders</h2>
                </div>
                <p className="text-sm text-[var(--ion-text-color-secondary)] m-0">Most ordered items</p>
                <div className="mt-3 border-b border-[var(--ion-border-color)]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 mt-4">
                {popularItems.map(item => (
                  <ProductCard key={item.id} item={item} stallImage={stall.image} onItemClick={handleItemClick} />
                ))}
              </div>
            </div>
          )}

          {categories.map(category => {
            const items = menuItemsByCategory(category);
            if (items.length === 0) return null;
            const sectionId = category;
            return (
              <div key={category} ref={setSectionRef(sectionId)} data-section={sectionId} className="mb-6 sm:mb-8">
                <div ref={setHeaderRef(sectionId)} data-header={sectionId} className="mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--ion-text-color)] m-0">{category}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                  {items.map(item => (
                    <ProductCard key={item.id} item={item} stallImage={stall.image} onItemClick={handleItemClick} showPopularBadge={!!item.popular} />
                  ))}
                </div>
              </div>
            );
          })}
          </>
          )}

          {/* Reviews */}
          <div className="mt-8 sm:mt-10 border-t border-[var(--ion-border-color)] pt-6 sm:pt-8" id="reviews">
            <div className="flex items-center gap-2 mb-4">
              <IonIcon icon={starOutline} className="text-[var(--ion-color-primary)] text-lg" />
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--ion-text-color)] m-0">Reviews</h2>
            </div>

            {reviewStats.total === 0 ? (
              <div className="text-center py-10 rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)]">
                <IonIcon icon={starOutline} className="text-3xl text-[var(--ion-text-color-secondary)] mb-2" />
                <p className="m-0 text-sm text-[var(--ion-text-color-secondary)]">No reviews yet — be the first to review this stall</p>
              </div>
            ) : (
              <>
                {/* Rating Summary */}
                <div className="rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-4 mb-4">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="flex flex-col items-center sm:items-start sm:min-w-[120px]">
                      <div className="text-4xl font-extrabold text-[var(--ion-color-primary)]">
                        {reviewStats.average > 0 ? reviewStats.average.toFixed(1) : '—'}
                      </div>
                      <div className="flex gap-0.5 my-1.5">
                        {[1, 2, 3, 4, 5].map(s => {
                          const filled = s <= Math.round(reviewStats.average);
                          return <IonIcon key={s} icon={filled ? star : starOutline} className="text-base" style={{ color: '#F59E0B' }} />;
                        })}
                      </div>
                      <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">{reviewStats.total} review{reviewStats.total !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map((stars, i) => (
                        <div key={i} className="flex items-center gap-3 mb-2">
                          <span className="text-sm min-w-[40px] text-[var(--ion-text-color)]">{stars} ★</span>
                          <div className="flex-1 h-2 bg-[var(--ion-border-color)] rounded-full overflow-hidden">
                            <div style={{ width: `${(reviewStats.distribution[5 - stars] / reviewStats.total) * 100}%`, height: '100%', background: '#F59E0B', borderRadius: '4px' }} />
                          </div>
                          <span className="text-xs min-w-[30px] text-[var(--ion-text-color-secondary)]">{reviewStats.distribution[5 - stars]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review List */}
                <div className="space-y-3">
                  {reviews.map((review, i) => (
                    <div key={review.id || i} className="rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[var(--ion-color-primary)]/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-[var(--ion-color-primary)]">{review.userName ? review.userName.charAt(0).toUpperCase() : '?'}</span>
                          </div>
                          <span className="text-sm font-semibold text-[var(--ion-text-color)] truncate">{review.userName}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <IonIcon key={s} icon={s <= review.rating ? star : starOutline} className="text-xs" style={{ color: '#F59E0B' }} />
                            ))}
                          </div>
                          <span className="text-xs text-[var(--ion-text-color-secondary)]">
                            {review.date ? new Date(review.date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="m-0 mt-1 text-sm text-[var(--ion-text-color)] leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] xl:bottom-6 w-[calc(100%-2rem)] max-w-7xl z-30 px-4"
          >
            <div className="rounded-2xl bg-[var(--ion-color-primary)] shadow-lg shadow-[var(--ion-color-primary)]/25 text-white p-3 flex items-center gap-3">
              <div className="flex flex-col min-w-0">
                <span className="text-xs opacity-90">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
                <span className="font-bold text-lg leading-tight">₱{cartTotal.toFixed(2)}</span>
              </div>
              <IonButton
                className="ml-auto shrink-0 h-12"
                style={{ '--color': 'var(--ion-color-primary)', '--background': '#fff', '--border-radius': '14px' }}
                onClick={goToCart}
              >
                <IonIcon icon={cartOutline} className="mr-2" />
                View Cart
              </IonButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          isOpen={!!selectedItem}
          isMobile={isMobile}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
        />
      )}

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default StallDetail;
