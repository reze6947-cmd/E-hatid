import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { personOutline, checkmarkCircle } from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext';
import { getRoleRedirect } from '../../services/roleGuard';
import { selectRoleConfig } from './selectRoleConfig';

const RoleSelection: React.FC = () => {
  const history = useHistory();
  const { user, roles, setActiveRole, logout } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cfg = selectRoleConfig;

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  useEffect(() => {
    if (roles.length === 1) {
      const single = roles[0];
      history.replace(cfg.roleHomePaths[single] || `/${single}/home`);
    }
  }, [roles, history]);

  const handleSelect = async (role: string) => {
    setSelected(role);
    setLoading(true);
    await setActiveRole(role);
    const redirect = getRoleRedirect(user!, role);
    history.replace(redirect || cfg.roleHomePaths[role] || `/${role}/home`);
  };

  return (
    <div className={cfg.containerClass}>
      <div className={cfg.wrapperClass}>
        <div className={`text-center ${cfg.header.headerGap}`}>
          <div className={cfg.header.iconContainerClass}>
            <IonIcon icon={cfg.header.icon} className={cfg.header.iconClass} />
          </div>
          <h1 className={cfg.header.titleClass}>{cfg.header.title}</h1>
          <p className={cfg.header.subtitleClass}>{cfg.header.subtitle}</p>
        </div>

        <div className={cfg.card.cardsGap}>
          {roles.map(role => {
            const info = cfg.roles[role] || {
              label: role, icon: personOutline, description: '', accentColor: 'var(--ion-text-color)',
            };
            const isSelected = selected === role;
            const cardStateClass = isSelected ? cfg.card.selectedClass : cfg.card.unselectedClass;
            const disabledClass = loading ? cfg.card.disabledClass : 'cursor-pointer';

            return (
              <button
                key={role}
                onClick={() => handleSelect(role)}
                disabled={loading}
                className={`${cfg.card.baseClass} ${cardStateClass} ${disabledClass}`}
              >
                <div
                  className={cfg.card.iconContainerClass}
                  style={{ backgroundColor: `${info.accentColor}18` }}
                >
                  <IonIcon icon={info.icon} className={cfg.card.iconClass} style={{ color: info.accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cfg.card.labelClass}>{info.label}</div>
                  {info.description && (
                    <div className={cfg.card.descriptionClass}>{info.description}</div>
                  )}
                </div>
                <div className={`${cfg.card.radioClass} ${isSelected ? cfg.card.radioSelectedClass : cfg.card.radioUnselectedClass}`}>
                  {isSelected && (
                    <IonIcon icon={checkmarkCircle} className={cfg.card.radioIconClass} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className={cfg.signOut.marginTop}>
          <button onClick={handleLogout} className={cfg.signOut.buttonClass}>
            <IonIcon icon={cfg.signOut.icon} className={cfg.signOut.iconClass} />
            <span className={cfg.signOut.textClass}>{cfg.signOut.text}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
