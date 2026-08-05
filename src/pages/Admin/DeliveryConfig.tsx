import React, { useState, useEffect } from 'react';
import { IonButton, IonInput, IonItem, IonLabel, IonSpinner, IonToast } from '@ionic/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import AdminPageShell from '../../components/admin/AdminPageShell';
import PageLoader from '../../components/PageLoader';
import { fetchDeliveryConfig, clearDeliveryConfigCache, DeliveryConfig } from '../../services/deliveryService';

const AdminDeliveryConfig: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DeliveryConfig>({
    perKmRate: 30, gasPrice: 60, kmPerLiter: 40, bonus: 0,
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const c = await fetchDeliveryConfig();
      setConfig(c);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'delivery'), config);
      clearDeliveryConfigCache();
      setToastMessage('Delivery config saved successfully!');
      setShowToast(true);
    } catch {
      setToastMessage('Failed to save config');
      setShowToast(true);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminPageShell title="Delivery Config">
        <PageLoader message="Loading delivery config..." />
      </AdminPageShell>
    );
  }

  const fields: { key: keyof DeliveryConfig; label: string; desc: string; prefix?: string }[] = [
    { key: 'perKmRate', label: 'Per Km Rate (₱)', desc: 'Price per charged km (rounds up)' },
    { key: 'gasPrice', label: 'Gas Price per Liter (₱)', desc: 'Current fuel cost (pro-rated by actual km)' },
    { key: 'kmPerLiter', label: 'Motorcycle km/L', desc: 'Motorcycle fuel efficiency' },
    { key: 'bonus', label: 'Platform Bonus (₱)', desc: 'Fixed incentive (peak hours, promos)' },
  ];

  const formulaPreview = (km: number) => {
    const finalKm = Math.max(1, Math.ceil(km));
    const fuelAdj = (config.gasPrice / config.kmPerLiter) * km;
    const total = finalKm * config.perKmRate + fuelAdj + config.bonus;
    return Math.round(total);
  };

  return (
    <AdminPageShell title="Delivery Config" subtitle="Manage delivery fee formula variables">
      <div style={{ padding: '0 0 24px', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
        <div className="rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] overflow-hidden">
          <div className="px-4 py-3 bg-[var(--ion-background-color)] border-b border-[var(--ion-border-color)]">
            <h4 className="text-sm font-semibold text-[var(--ion-text-color)] m-0">Formula</h4>
            <p className="text-xs text-[var(--ion-text-color-secondary)] mt-1 m-0 leading-relaxed">
              Fare = ceil(km) × perKmRate + (gasPrice ÷ km/L × actual km) + bonus
            </p>
          </div>
          <div className="p-4 space-y-3">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-[var(--ion-text-color-secondary)] mb-1">{f.label}</label>
                <p className="text-[10px] text-[var(--ion-text-color-secondary)] mb-1.5">{f.desc}</p>
                <IonItem className="ion-item-clean">
                  <IonInput
                    type="number"
                    value={String(config[f.key])}
                    onIonInput={e => setConfig(prev => ({ ...prev, [f.key]: Number(e.detail.value) }))}
                    className="text-sm"
                    style={{ '--padding-start': '12px', '--padding-end': '12px', '--min-height': '40px', '--highlight-height': '0' } as any}
                  />
                </IonItem>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 p-3 rounded-xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)]">
          <h4 className="text-sm font-semibold text-[var(--ion-text-color)] m-0 mb-2">Fee Preview</h4>
          <div className="flex gap-1.5 justify-center">
            {[0.5, 1, 3, 5, 10].map(km => (
              <div key={km} className="flex-1 text-center p-1.5 rounded-lg bg-[var(--ion-background-color)]">
                <div className="text-[10px] text-[var(--ion-text-color-secondary)]">{km} km</div>
                <div className="text-[9px] text-[var(--ion-text-color-secondary)]">→ {Math.max(1, Math.ceil(km))} km</div>
                <div className="text-xs font-bold text-[var(--ion-color-primary)]">₱{formulaPreview(km)}</div>
              </div>
            ))}
          </div>
        </div>

        <IonButton
          expand="block"
          shape="round"
          className="mt-3 min-h-[44px] font-semibold"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <IonSpinner /> : 'Save Config'}
        </IonButton>
      </div>

      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={3000}
        onDidDismiss={() => setShowToast(false)}
        position="bottom"
        color={toastMessage.includes('Failed') ? 'danger' : 'success'}
      />
    </AdminPageShell>
  );
};

export default AdminDeliveryConfig;
