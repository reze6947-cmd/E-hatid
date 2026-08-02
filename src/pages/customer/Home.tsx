import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  IonSearchbar,
  IonIcon,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { fetchStalls, getCategories } from '../../services/stallService';

import { StallCardSkeleton } from '../../components/ui/Skeleton';
import { Stall } from '../../types/index';
import {
  locationOutline,
  starOutline,
  chevronForwardOutline,
  timeOutline,
  carOutline,
} from 'ionicons/icons';

const CustomerHome: React.FC = () => {
  const history = useHistory();
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const [allStalls, setAllStalls] = useState<Stall[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [initialLoading, setInitialLoading] = useState(true);
  const categories = getCategories();

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
    return result;
  }, [allStalls, selectedCategory, searchQuery]);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const data = await fetchStalls({});
        if (mounted) setAllStalls(data);
      } catch (error) {
        console.error('Error loading stalls:', error);
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleSearch = (e: any) => {
    setSearchQuery(e.detail.value || '');
  };

  return (
    <>

      <div className="w-full flex-1 md:pt-8 pb-10 flex flex-col space-y-3 sm:space-y-4">
        {/* Header Section */}
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--ion-text-color)] m-0 truncate">
            {getGreeting()}{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-sm xs:text-base sm:text-lg text-[var(--ion-text-color-secondary)] mt-1 sm:mt-2">
            What would you like to eat today?
          </p>
        </div>

        {/* Location */}
        {isAuthenticated && (
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => history.push('/customer/profile')}>
            <IonIcon icon={locationOutline} className="text-[var(--ion-color-primary)] text-lg shrink-0" />
            <span className="text-sm sm:text-base text-[var(--ion-text-color)] font-medium truncate">{user?.address || 'Set your delivery address'}</span>
            <IonIcon icon={chevronForwardOutline} className="text-[var(--ion-text-color-secondary)] text-sm shrink-0 ml-auto" />
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
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-3 bg-[var(--ion-card-background)] p-1 rounded-full w-max min-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="relative min-w-[100px] px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors rounded-full"
              >
                {selectedCategory === cat && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-[var(--ion-color-primary)] rounded-full"
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
        <div className="min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--ion-text-color)] m-0">
              {selectedCategory === 'All' ? 'All Stalls' : selectedCategory}
            </h2>
            <span className="text-xs sm:text-sm text-[var(--ion-text-color-secondary)]">{filteredStalls.length} results</span>
          </div>

          {initialLoading ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <StallCardSkeleton key={i} />
              ))}
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
                <div key={stall.id} className="rounded-2xl overflow-hidden bg-[var(--ion-card-background)] border border-[var(--ion-border-color)] shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer" onClick={() => history.push(`/stall/${stall.id}/menu`)}>
                  <div className="relative aspect-square overflow-hidden" data-initial={stall.name.charAt(0)}>
                    <img src={stall.logo || stall.image} alt={stall.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('img-failed'); }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 bg-white/90 dark:bg-[#1E293B]/90 text-gray-800 dark:text-gray-200 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                      <IonIcon icon={starOutline} className="text-amber-500 text-xs" />
                      <span>{stall.rating}</span>
                    </div>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomerHome;
