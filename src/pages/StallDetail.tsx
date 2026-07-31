import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useHistory } from 'react-router-dom';
import { IonIcon, IonButton } from '@ionic/react';
import { locationOutline, star, timeOutline, carOutline, cartOutline, documentTextOutline } from 'ionicons/icons';
import { fetchStallById } from '../services/stallService';
import { Stall, MenuItem, SelectedOption, SelectedAddOn } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import MenuItemModal from '../components/Stall/MenuItemModal';
import ProductCard from '../components/Stall/ProductCard';
import { StallCardSkeleton } from '../components/ui/Skeleton';

const StallDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [stall, setStall] = useState<Stall | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const history = useHistory();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [activeSection, setActiveSection] = useState<string>('');
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

  useEffect(() => {
    const loadStall = async () => {
      setLoading(true);
      try {
        if (id) {
          const data = await fetchStallById(id);
          setStall(data || null);
        }
      } catch (error) {
        console.error('Error loading stall:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStall();
  }, [id]);

  const availableItems = stall?.menu?.filter(item => item.available) || [];
  const popularItems = availableItems.filter(item => item.popular);
  const categories = [...new Set(availableItems.map(item => item.category))];
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <StallCardSkeleton key={i} />
        ))}
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
        <div className="relative px-4 md:px-6 lg:px-8">
          {stall.logo && (
            <div className="absolute -top-12 md:-top-16 left-4 md:left-6 lg:left-8 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[var(--ion-card-background)] z-10">
              <img
                src={stall.logo}
                alt={`${stall.name} logo`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          <div className={`pt-4 md:pt-5 ${stall.logo ? 'ml-28 md:ml-32' : ''}`}>
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
                Near you
              </span>
            </div>

            {stall.description && (
              <p className="text-sm text-[var(--ion-text-color-secondary)] mt-3 leading-relaxed">{stall.description}</p>
            )}
          </div>
        </div>

        {/* Sticky Category Navigation */}
        {navItems.length > 1 && (
          <div className="sticky top-0 md:top-16 z-20 bg-[var(--ion-card-background)] border-b border-[var(--ion-border-color)] mt-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 p-1 rounded-full w-max min-w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
              {navItems.map(nav => (
                <button
                  key={nav.id}
                  onClick={() => {
                    setActiveSection(nav.id);
                    const el = sectionRefMap.current.get(nav.id);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="relative min-w-[88px] sm:min-w-[100px] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors rounded-full"
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
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-4 md:px-6 lg:px-8 py-4 sm:py-6">
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
        </div>
      </div>

      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          isOpen={!!selectedItem}
          isMobile={isMobile}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
};

export default StallDetail;
