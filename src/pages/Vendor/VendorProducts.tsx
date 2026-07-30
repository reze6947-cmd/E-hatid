import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonButton, IonIcon, IonToggle, IonLabel, IonSpinner, IonAlert } from '@ionic/react';
import { addOutline, createOutline, trashOutline, star, starOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { getStallByVendorId, updateStallMenu, createStall } from '../../services/stallService';
import { MenuItem } from '../../types';
import ProductEditorModal from './components/ProductEditorModal';
import PageHeader from '../../components/ui/PageHeader';

const VendorProducts: React.FC = () => {
  const history = useHistory();
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stallId, setStallId] = useState<string | null>(null);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadMenu = async () => {
      try {
        const stall = await getStallByVendorId(user.id);
        if (stall) {
          setStallId(stall.id);
          if (stall.menu) {
            setProducts(stall.menu);
            console.log('Fetched menu from stall:', stall.menu.length, 'items');
          }
        } else {
          console.log('No stall found for vendor, products will create one on save');
        }
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, [user]);

  const saveMenu = async (newMenu: MenuItem[]) => {
    setProducts(newMenu);
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
        } as any);
        setStallId(newStallId);
        console.log('Stall auto-created with menu');
      } else if (stallId) {
        await updateStallMenu(stallId, newMenu);
        console.log('Products saved to Firestore:', newMenu.length, 'items');
      }
    } catch (err) {
      console.error('Failed to save menu:', err);
    }
  };

  const toggleAvailable = (id: string) => {
    saveMenu(products.map(p => p.id === id ? { ...p, available: !p.available } : p));
  };

  const togglePopular = (id: string) => {
    saveMenu(products.map(p => p.id === id ? { ...p, popular: !p.popular } : p));
  };

  const handleDeleteProduct = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      saveMenu(products.filter(p => p.id !== deleteTarget));
      setDeleteTarget(null);
    }
  };

  const handleAddProduct = () => {
    const newItem: MenuItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      price: 0,
      category: '',
      available: true,
      stallId: stallId || user?.id || '',
      popular: false,
      description: '',
      options: [],
      addOns: [],
    };
    setEditingItem(newItem);
  };

  const handleSave = (updated: MenuItem) => {
    const exists = products.find(p => p.id === updated.id);
    if (exists) {
      saveMenu(products.map(p => p.id === updated.id ? updated : p));
    } else {
      saveMenu([...products, updated]);
    }
  };

  return (
    <>

        <div className="p-4">
          <PageHeader title="Products" subtitle="Manage your menu items, options, and availability" />

          <div className="flex gap-3 mb-4">
            <IonButton color="primary" onClick={handleAddProduct}>
              <IonIcon icon={addOutline} slot="start" />
              Add Product
            </IonButton>
          </div>

          {loading ? (
            <div className="text-center p-12"><IonSpinner /></div>
          ) : products.length === 0 ? (
            <IonCard className="rounded-xl shadow"><IonCardContent><p className="text-center text-[var(--ion-text-color-secondary)] m-0">No products yet. Add your first menu item.</p></IonCardContent></IonCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(product => (
                <IonCard key={product.id} className={`rounded-xl shadow ${!product.available ? 'opacity-60' : ''}`} style={{ margin: 0 }}>
                  <div style={{ background: 'var(--ion-color-primary)', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {product.popular && <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">🔥 Popular</span>}
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                      <span className="text-4xl text-white/50">{product.name.charAt(0)}</span>
                    )}
                  </div>
                  <IonCardContent>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="m-0 mb-1 font-bold text-[var(--ion-text-color)]">{product.name}</h3>
                        <p className="m-0 text-xs text-[var(--ion-text-color-secondary)]">{product.category}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                        product.available
                          ? 'bg-[var(--ion-color-success)]/10 text-[var(--ion-color-success)]'
                          : 'bg-[var(--ion-border-color)] text-[var(--ion-text-color-secondary)]'
                      }`}>
                        {product.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xl font-bold text-[var(--ion-color-primary)]">₱{product.price.toFixed(2)}</span>
                      <div className="flex items-center gap-1">
                        {product.options && product.options.length > 0 && (
                          <span className="text-xs text-[var(--ion-text-color-secondary)] bg-[var(--ion-card-background)] px-2 py-0.5 rounded border border-[var(--ion-border-color)]">
                            {product.options.length} option groups
                          </span>
                        )}
                        {product.addOns && product.addOns.length > 0 && (
                          <span className="text-xs text-[var(--ion-text-color-secondary)] bg-[var(--ion-card-background)] px-2 py-0.5 rounded border border-[var(--ion-border-color)]">
                            {product.addOns.length} add-ons
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <IonLabel>Available</IonLabel>
                        <IonToggle checked={product.available} onIonChange={() => toggleAvailable(product.id)} style={{ '--background-checked': 'var(--ion-color-primary)' }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <IonLabel>
                          <IonIcon icon={product.popular ? star : starOutline} style={{ color: '#F59E0B', marginRight: '4px', fontSize: '14px' }} />
                          Popular
                        </IonLabel>
                        <IonToggle checked={product.popular} onIonChange={() => togglePopular(product.id)} style={{ '--background-checked': 'var(--ion-color-warning)' }} />
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <IonButton size="small" fill="outline" color="primary" className="flex-1" onClick={() => setEditingItem(product)}>
                        <IonIcon icon={createOutline} slot="start" />
                        Edit
                      </IonButton>
                      <IonButton size="small" fill="outline" color="danger" style={{ minWidth: '44px' }} onClick={() => handleDeleteProduct(product.id)}>
                        <IonIcon icon={trashOutline} />
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
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
          { text: 'Delete', role: 'destructive', handler: confirmDelete },
        ]}
      />

      {editingItem && (
        <ProductEditorModal
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSave}
          onDelete={editingItem.name ? () => handleDeleteProduct(editingItem.id) : undefined}
        />
      )}
    </>
  );
};

export default VendorProducts;
