import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { swapHorizontalOutline, checkmarkCircle, time, closeCircle } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';

const statusIcon: Record<string, string> = {
  approved: checkmarkCircle,
  pending: time,
  rejected: closeCircle,
};

const statusColor: Record<string, string> = {
  approved: '#10B981',
  pending: '#F59E0B',
  rejected: '#EF4444',
};

const RoleSwitcher: React.FC = () => {
  const { user, roles, switchRole, activeRole } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user || roles.length <= 1) return null;

  const handleSwitch = async (role: string) => {
    try {
      await switchRole(role);
      setOpen(false);
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] text-[var(--ion-text-color-secondary)] hover:bg-[var(--ion-border-color)]/30"
      >
        <IonIcon icon={swapHorizontalOutline} className="text-sm shrink-0" />
        <span className="hidden sm:inline capitalize">{activeRole}</span>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: '4px',
            background: 'var(--ion-card-background)', borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid var(--ion-border-color)',
            minWidth: '200px', zIndex: 100, padding: '4px',
          }}>
            {roles.map(role => {
              const st = role === 'customer' ? (user.emailVerified ? 'approved' : 'pending') : (user.roleStatus?.[role] || 'pending');
              const disabled = st === 'pending' || st === 'rejected';
              const active = role === activeRole;
              return (
                <button
                  key={role}
                  disabled={disabled}
                  onClick={() => handleSwitch(role)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 12px', borderRadius: '8px', border: 'none',
                    background: active ? 'var(--ion-color-primary)/10' : 'transparent',
                    color: disabled ? 'var(--ion-text-color-secondary)' : 'var(--ion-text-color)',
                    fontSize: '13px', fontWeight: active ? 600 : 400, cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  <span style={{ flex: 1, textAlign: 'left', textTransform: 'capitalize' }}>{role}</span>
                  <IonIcon icon={statusIcon[st] || time} style={{ fontSize: '14px', color: statusColor[st] || '#999' }} />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default RoleSwitcher;
