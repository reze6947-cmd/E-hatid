import { useState, useMemo } from 'react';
import { MenuItem } from '../../../../types';
import { AvailabilityFilter, SortKey } from '../types';

export interface ProductCounts {
  total: number;
  available: number;
  unavailable: number;
  popular: number;
}

export const useProductFilters = (products: MenuItem[]) => {
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  const counts = useMemo<ProductCounts>(() => ({
    total: products.length,
    available: products.filter(p => p.available).length,
    unavailable: products.filter(p => !p.available).length,
    popular: products.filter(p => p.popular).length,
  }), [products]);

  const visibleProducts = useMemo(() => {
    let list = products;
    if (availabilityFilter !== 'all') {
      const target = availabilityFilter === 'available';
      list = list.filter(p => p.available === target);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      default:
        sorted.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    }
    return sorted;
  }, [products, availabilityFilter, search, sortBy]);

  const hasActiveFilters = search.trim() !== '' || availabilityFilter !== 'all' || sortBy !== 'newest';

  const resetFilters = () => {
    setSearch('');
    setAvailabilityFilter('all');
    setSortBy('newest');
  };

  return {
    search,
    setSearch,
    availabilityFilter,
    setAvailabilityFilter,
    sortBy,
    setSortBy,
    visibleProducts,
    resetFilters,
    counts,
    hasActiveFilters,
  };
};
