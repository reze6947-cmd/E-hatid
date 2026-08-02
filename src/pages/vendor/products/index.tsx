import React, { useCallback, useMemo, useState } from 'react';
import { IonAlert, IonButton, IonIcon, IonToast } from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MenuItem } from '../../../types';
import { useMenu, RestoreItem } from './hooks/useMenu';
import { useProductFilters } from './hooks/useProductFilters';
import { useToast } from './hooks/useToast';
import { createProduct, createCopy } from './utils';
import ProductCard from './components/ProductCard';
import ProductStats from './components/ProductStats';
import ProductToolbar from './components/ProductToolbar';
import SelectionBar from './components/SelectionBar';
import ProductSkeleton from './components/ProductSkeleton';
import EmptyState from './components/EmptyState';
import NoMatchState from './components/NoMatchState';
import ProductEditorModal from './components/ProductEditorModal';

const VendorProducts: React.FC = () => {
  const {
    user,
    loading,
    stallId,
    products,
    saving,
    toggleAvailable,
    togglePopular,
    deleteProduct,
    deleteProducts,
    setAvailabilityFor,
    upsertProduct,
    restoreProducts,
  } = useMenu();
  const { search, setSearch, availabilityFilter, setAvailabilityFilter, sortBy, setSortBy, visibleProducts, resetFilters, counts, hasActiveFilters } = useProductFilters(products);
  const { toast, showToast, dismissToast } = useToast();
  const reduceMotion = useReducedMotion() || false;

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [bulkIds, setBulkIds] = useState<string[]>([]);

  const handleAddProduct = () => {
    setEditingItem(createProduct({ stallId: stallId || user?.id || '' }));
  };

  const handleDuplicate = useCallback(() => {
    if (!editingItem) return;
    setEditingItem(createCopy(editingItem));
  }, [editingItem]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const index = products.findIndex(p => p.id === deleteTarget);
    const item = index >= 0 ? products[index] : undefined;
    deleteProduct(deleteTarget);
    setDeleteTarget(null);
    if (item) {
      showToast({
        message: 'Product deleted',
        duration: 6000,
        buttons: [
          { text: 'Undo', handler: () => restoreProducts([{ item, index }]) },
          { text: 'Dismiss', role: 'cancel' },
        ],
      });
    }
  }, [deleteTarget, products, deleteProduct, restoreProducts, showToast]);

  const handleBulkDeleteConfirm = useCallback(() => {
    if (!bulkDeleteIds || bulkDeleteIds.length === 0) return;
    const items: RestoreItem[] = bulkDeleteIds
      .map(id => {
        const index = products.findIndex(p => p.id === id);
        return index >= 0 ? { item: products[index], index } : null;
      })
      .filter((x): x is RestoreItem => x !== null);
    deleteProducts(bulkDeleteIds);
    showToast({
      message: `${bulkDeleteIds.length} product${bulkDeleteIds.length > 1 ? 's' : ''} deleted`,
      duration: 6000,
      buttons: [
        { text: 'Undo', handler: () => restoreProducts(items) },
        { text: 'Dismiss', role: 'cancel' },
      ],
    });
    setBulkDeleteIds(null);
    setSelecting(false);
    setBulkIds([]);
  }, [bulkDeleteIds, products, deleteProducts, restoreProducts, showToast]);

  const handleBulkSetAvailability = useCallback((available: boolean) => {
    if (bulkIds.length === 0) return;
    setAvailabilityFor(bulkIds, available);
    showToast({
      message: `${bulkIds.length} product${bulkIds.length > 1 ? 's' : ''} marked ${available ? 'available' : 'unavailable'}`,
      duration: 3500,
    });
    setSelecting(false);
    setBulkIds([]);
  }, [bulkIds, setAvailabilityFor, showToast]);

  const toggleSelect = useCallback((productId: string) => {
    setBulkIds(prev => (prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]));
  }, []);

  const startSelecting = useCallback(() => {
    setSelecting(true);
    setBulkIds([]);
  }, []);

  const cancelSelecting = useCallback(() => {
    setSelecting(false);
    setBulkIds([]);
  }, []);

  const selectAllVisible = useCallback(() => {
    setBulkIds(visibleProducts.map(p => p.id));
  }, [visibleProducts]);

  const onEdit = useCallback((product: MenuItem) => setEditingItem(product), []);
  const onDeleteCard = useCallback((id: string) => setDeleteTarget(id), []);

  const categorySuggestions = useMemo(
    () => Array.from(new Set(products.map(p => p.category).filter(Boolean))),
    [products],
  );

  const renderCard = useCallback((product: MenuItem) => (
    <ProductCard
      product={product}
      selected={bulkIds.includes(product.id)}
      selecting={selecting}
      onToggleSelect={toggleSelect}
      onEdit={onEdit}
      onDelete={onDeleteCard}
      onToggleAvailable={toggleAvailable}
      onTogglePopular={togglePopular}
    />
  ), [bulkIds, selecting, toggleSelect, onEdit, onDeleteCard, toggleAvailable, togglePopular]);

  return (
    <>
      <div className="w-full flex-1 md:pt-8 pb-10 flex flex-col space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-xl xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--ion-text-color)] truncate">Products</h2>
            <p className="m-0 mt-1 sm:mt-2 text-sm xs:text-base sm:text-lg text-[var(--ion-text-color-secondary)]">Manage your menu items, options, and availability</p>
          </div>
          <IonButton
            color="primary"
            shape="round"
            className="hidden sm:inline-flex min-h-[44px] font-semibold shrink-0"
            onClick={handleAddProduct}
          >
            <IonIcon icon={addOutline} slot="start" />
            Add Product
          </IonButton>
        </div>

        <ProductStats counts={counts} activeFilter={availabilityFilter} onFilterChange={setAvailabilityFilter} />

        {selecting ? (
          <SelectionBar
            selectedCount={bulkIds.length}
            onSelectAllVisible={selectAllVisible}
            onSetAvailable={() => handleBulkSetAvailability(true)}
            onSetUnavailable={() => handleBulkSetAvailability(false)}
            onDelete={() => setBulkDeleteIds(bulkIds)}
            onCancel={cancelSelecting}
          />
        ) : (
          <ProductToolbar
            search={search}
            onSearchChange={setSearch}
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalCount={counts.total}
            visibleCount={visibleProducts.length}
            hasActiveFilters={hasActiveFilters}
            saving={saving}
            onClearFilters={resetFilters}
            onAdd={handleAddProduct}
            onSelectMode={startSelecting}
          />
        )}

        {loading ? (
          <ProductSkeleton />
        ) : products.length === 0 ? (
          <EmptyState onAdd={handleAddProduct} />
        ) : visibleProducts.length === 0 ? (
          <NoMatchState onReset={resetFilters} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
            {reduceMotion ? (
              visibleProducts.map(product => <div key={product.id}>{renderCard(product)}</div>)
            ) : (
              <AnimatePresence mode="popLayout">
                {visibleProducts.map(product => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                  >
                    {renderCard(product)}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>

      <IonAlert
        isOpen={!!deleteTarget}
        onDidDismiss={() => setDeleteTarget(null)}
        header="Delete Product"
        message="Delete this product? This cannot be undone."
        buttons={[
          { text: 'Cancel', role: 'cancel', handler: () => setDeleteTarget(null) },
          { text: 'Delete', role: 'destructive', handler: () => handleDeleteConfirm() },
        ]}
      />

      <IonAlert
        isOpen={!!bulkDeleteIds}
        onDidDismiss={() => setBulkDeleteIds(null)}
        header={bulkDeleteIds && bulkDeleteIds.length > 1 ? `Delete ${bulkDeleteIds.length} products?` : 'Delete product?'}
        message="This cannot be undone."
        buttons={[
          { text: 'Cancel', role: 'cancel', handler: () => setBulkDeleteIds(null) },
          { text: 'Delete', role: 'destructive', handler: () => handleBulkDeleteConfirm() },
        ]}
      />

      <IonToast
        isOpen={!!toast}
        message={toast?.message}
        duration={toast?.duration ?? 3500}
        position="top"
        color={toast?.color || 'dark'}
        buttons={(toast?.buttons || []).map(b => ({ text: b.text, role: b.role, handler: b.handler }))}
        onDidDismiss={dismissToast}
      />

      {editingItem && (
        <ProductEditorModal
          key={editingItem.id}
          item={editingItem}
          isOpen={!!editingItem}
          isNew={!products.some(p => p.id === editingItem.id)}
          onClose={() => setEditingItem(null)}
          onSave={upsertProduct}
          onDelete={products.some(p => p.id === editingItem.id) ? () => deleteProduct(editingItem.id) : undefined}
          onDuplicate={handleDuplicate}
          categorySuggestions={categorySuggestions}
        />
      )}
    </>
  );
};

export default VendorProducts;
