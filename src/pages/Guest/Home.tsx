import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IonButton, IonIcon, IonSearchbar } from '@ionic/react';
import { locationOutline, starOutline, chevronForwardOutline, timeOutline, carOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { fetchStalls, getCategories } from '../../services/stallService';
import { Stall } from '../../types/index';
import PageLoader from '../../components/PageLoader';

const GuestHome: React.FC = () => {
  const history = useHistory();
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [initialLoading, setInitialLoading] = useState(true);
  const categories = getCategories();

  const loadStalls = useCallback(async () => {
    try {
      const data = await fetchStalls({
        category: selectedCategory,
        search: searchQuery,
      });
      setStalls(data);
    } catch (error) {
      console.error('Error loading stalls:', error);
    } finally {
      setInitialLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadStalls();
  }, [loadStalls]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleSearch = (e: any) => {
    setSearchQuery(e.detail.value || '');
  };

  if (initialLoading) {
    return <PageLoader message="Loading nearby stalls..." />;
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header Section */}
        <div className="pt-4 sm:pt-6 md:pt-8 pb-2">
          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-(--ion-text-color) m-0">
            {getGreeting()}!
          </h1>
          <p className="text-sm xs:text-base sm:text-lg text-(--ion-text-color-secondary) mt-1 sm:mt-2">
            What would you like to eat today?
          </p>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 py-2 sm:py-3 cursor-pointer hover:opacity-80" onClick={() => history.push('/guest/location')}>
          <IonIcon icon={locationOutline} className="text-(--ion-color-primary) text-lg shrink-0" />
          <span className="text-sm sm:text-base text-(--ion-text-color) font-medium truncate">123 Main Street</span>
          <IonIcon icon={chevronForwardOutline} className="text-(--ion-text-color-secondary) text-sm shrink-0 ml-auto" />
        </div>

        {/* Search Bar */}
        <div className="py-2 sm:py-3">
          <IonSearchbar
            className="[--box-shadow:none] [--border-radius:12px] [--background:var(--ion-card-background)]"
            placeholder="Search for food, stalls..."
            value={searchQuery}
            onIonInput={handleSearch}
          />
        </div>

        {/* Categories */}
        <div className="py-1 sm:py-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-full w-max min-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="relative min-w-[90px] px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors rounded-full"
              >
                {selectedCategory === cat && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-(--ion-color-primary) rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 50, mass: 1.2 }}
                  />
                )}
                <span className={`relative z-10 block truncate ${selectedCategory === cat ? "text-white" : "text-gray-500 dark:text-gray-300"}`}>
                  {cat}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="py-2 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-(--ion-text-color) m-0">
              {selectedCategory === 'All' ? 'All Stalls' : selectedCategory}
            </h2>
            <span className="text-xs sm:text-sm text-(--ion-text-color-secondary)">{stalls.length} results</span>
          </div>

          {/* Stalls Grid */}
          {stalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-full bg-(--ion-card-background) border-2 border-(--ion-border-color) flex items-center justify-center mb-4 sm:mb-6">
                <IonIcon icon={carOutline} className="text-4xl sm:text-5xl text-(--ion-color-primary)" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-(--ion-text-color) m-0 mb-2">No stalls found</h3>
              <p className="text-sm text-(--ion-text-color-secondary) m-0">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {stalls.map((stall) => (
                <div key={stall.id} className="rounded-2xl overflow-hidden bg-(--ion-card-background) border border-(--ion-border-color) shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer" onClick={() => history.push(`/stall/${stall.id}/menu`)}>
                  <div className="relative aspect-4/3 overflow-hidden" data-initial={stall.name.charAt(0)}>
                    <img src={stall.logo || stall.image} alt={stall.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('img-failed'); }} />
                    <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 bg-white/90 dark:bg-dark-card/90 text-gray-800 dark:text-gray-200 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                      <IonIcon icon={starOutline} className="text-amber-500 text-xs" />
                      <span>{stall.rating}</span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-bold text-(--ion-text-color) truncate m-0 mb-1">{stall.name}</h3>
                    <p className="text-xs sm:text-sm text-(--ion-text-color-secondary) m-0 mb-2">{stall.category}</p>
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-(--ion-text-color-secondary)">
                      <span className="flex items-center gap-1">
                        <IonIcon icon={timeOutline} className="text-sm" />
                        {stall.deliveryTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <IonIcon icon={carOutline} className="text-sm" />
                        ₱{stall.deliveryFee}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Authenticated User Section */}
        {isAuthenticated && (
          <div className="p-4">
            <IonButton expand="block" routerLink="/customer/home" className="min-h-11">
              Go to Home ({user?.name})
            </IonButton>
          </div>
        )}
      </div>
    </>
  );
};

export default GuestHome;