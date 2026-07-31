import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { getStallByVendorId, updateStallMenu, createStall } from '../../../../services/stallService';
import { MenuItem } from '../../../../types';

export interface RestoreItem {
  item: MenuItem;
  index: number;
}

export const useMenu = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stallId, setStallId] = useState<string | null>(null);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const productsRef = useRef<MenuItem[]>([]);

  const commit = useCallback((next: MenuItem[]) => {
    productsRef.current = next;
    setProducts(next);
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadMenu = async () => {
      try {
        const stall = await getStallByVendorId(user.id);
        if (stall) {
          setStallId(stall.id);
          if (stall.menu) {
            commit(stall.menu);
          }
        }
      } catch (err) {
        console.error('Error loading products:', err);
        setLastError('Could not load your menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, [user, commit]);

  const saveMenu = useCallback(async (newMenu: MenuItem[]): Promise<boolean> => {
    const prev = productsRef.current;
    setSaving(true);
    setLastError(null);
    commit(newMenu);
    try {
      if (!stallId && user) {
        const newStallId = user.id;
        await createStall({
          id: newStallId,
          name: user.stallName || `${user.name}'s Stall`,
          description: '',
          image: '/default-stall.jpg',
          rating: 0,
          deliveryTime: '08:00 - 22:00',
          deliveryFee: 30,
          vendorId: user.id,
          category: 'Fast Food',
          logo: '',
          accentColor: '#6366F1',
          active: true,
          address: user.stallAddress || '',
          menu: newMenu,
        });
        setStallId(newStallId);
      } else if (stallId) {
        await updateStallMenu(stallId, newMenu);
      }
      return true;
    } catch (err) {
      console.error('Failed to save menu:', err);
      commit(prev);
      setLastError('Could not save your changes. Please check your connection and try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [stallId, user, commit]);

  const toggleAvailable = useCallback((productId: string) => {
    saveMenu(productsRef.current.map(p => p.id === productId ? { ...p, available: !p.available } : p));
  }, [saveMenu]);

  const togglePopular = useCallback((productId: string) => {
    saveMenu(productsRef.current.map(p => p.id === productId ? { ...p, popular: !p.popular } : p));
  }, [saveMenu]);

  const deleteProduct = useCallback((productId: string) => {
    saveMenu(productsRef.current.filter(p => p.id !== productId));
  }, [saveMenu]);

  const deleteProducts = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    saveMenu(productsRef.current.filter(p => !idSet.has(p.id)));
  }, [saveMenu]);

  const setAvailabilityFor = useCallback((ids: string[], available: boolean) => {
    const idSet = new Set(ids);
    saveMenu(productsRef.current.map(p => idSet.has(p.id) ? { ...p, available } : p));
  }, [saveMenu]);

  const upsertProduct = useCallback((updated: MenuItem) => {
    const current = productsRef.current;
    const exists = current.find(p => p.id === updated.id);
    if (exists) {
      saveMenu(current.map(p => p.id === updated.id ? updated : p));
    } else {
      saveMenu([...current, updated]);
    }
  }, [saveMenu]);

  const restoreProducts = useCallback((items: RestoreItem[]) => {
    const existing = new Set(productsRef.current.map(p => p.id));
    const next = [...productsRef.current];
    [...items]
      .filter(({ item }) => !existing.has(item.id))
      .sort((a, b) => a.index - b.index)
      .forEach(({ item, index }) => {
        next.splice(Math.min(index, next.length), 0, item);
      });
    saveMenu(next);
  }, [saveMenu]);

  const clearError = useCallback(() => setLastError(null), []);

  return {
    user,
    loading,
    stallId,
    products,
    saving,
    lastError,
    saveMenu,
    toggleAvailable,
    togglePopular,
    deleteProduct,
    deleteProducts,
    setAvailabilityFor,
    upsertProduct,
    restoreProducts,
    clearError,
  };
};
