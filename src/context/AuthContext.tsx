import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { loginUser, registerUser, logoutUser, onAuthChanged, signInUser } from '../services/authService';
import { createUserDocument, getUserDocument, updateUserDocument, updateUserRole, saveRoleProfile } from '../services/userService';
import { getRoleRedirect } from '../services/roleGuard';
import { roleHomePaths } from '../config/routesByRole';
import { User } from '../types';
import { UserRole } from '../types/auth';

interface PendingRegistration {
  profile: Partial<User>;
  password: string;
}

let pendingRegistration: PendingRegistration | null = null;

export const setPendingRegistration = (data: PendingRegistration | null) => {
  pendingRegistration = data;
};

export const getPendingRegistration = (): PendingRegistration | null => pendingRegistration;

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  authLoading: boolean;
  activeRole: string | null;
  roles: string[];
  login: (email: string, password: string) => Promise<User | null>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => void;
  continueAsGuest: () => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  isRoleAuthenticated: (role: UserRole) => boolean;
  setActiveRole: (role: string) => Promise<void>;
  switchRole: (role: string) => Promise<void>;
  applyForRole: (role: string, formData: Record<string, unknown>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (data: User): User => {
  const mapRole = (r: string): User['role'] => (r === 'user' ? 'customer' : (r as User['role']));
  const rawRole = mapRole(data.role || 'customer');
  const roles = data.roles?.length ? data.roles.map((r: string) => mapRole(r)) : [rawRole];
  const activeRole = data.activeRole
    ? mapRole(data.activeRole)
    : (rawRole === 'admin' ? 'admin' : (roles[0] || rawRole));
  return { ...data, roles, activeRole };
};

// Pick a concrete default role so the navbar always has nav links.
// Prefers the stored activeRole, then customer (consumers first), then the first available role.
const resolveDefaultActiveRole = (roles: string[], docActiveRole?: string): string | null => {
  const available = roles || [];
  if (docActiveRole && available.includes(docActiveRole)) return docActiveRole;
  if (available.includes('customer')) return 'customer';
  return available[0] || null;
};

// The master admin owns every role with approved status and a verified customer doc.
// Passes Firestore rules via the master final-state clause
// (role == 'admin' && roles.hasAny(['admin']) && roleStatus.admin == 'approved').
const MASTER_ROLES: ('customer' | 'rider' | 'admin' | 'vendor')[] = ['customer', 'vendor', 'rider', 'admin'];
const MASTER_ROLE_STATUS: Record<string, 'none' | 'pending' | 'approved' | 'rejected'> = {
  customer: 'approved',
  rider: 'approved',
  vendor: 'approved',
  admin: 'approved',
};

const masterAdminBootstrap = (uid: string, email: string | undefined, current: User): Partial<User> | null => {
  const MASTER_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
  if (!MASTER_EMAIL || email !== MASTER_EMAIL) return null;
  const roles = current.roles || [];
  const roleStatus = current.roleStatus || {};
  const rolesMissing = !MASTER_ROLES.every(r => roles.includes(r));
  const statusMissing = !Object.entries(MASTER_ROLE_STATUS).every(([r, s]) => roleStatus[r] === s);
  if (!rolesMissing && !statusMissing && current.isMasterAdmin === true && current.emailVerified === true) {
    return null;
  }
  return {
    isMasterAdmin: true,
    emailVerified: true,
    role: 'admin',
    roles: MASTER_ROLES,
    roleStatus: MASTER_ROLE_STATUS,
    activeRole: 'customer',
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const isLoggingInRef = useRef(false);

  const activeRole = user?.activeRole || null;
  const roles = user?.roles || [];

  useEffect(() => {
    let initialCheck = true;
    const unsubscribe = onAuthChanged(async (firebaseUser) => {
      if (isLoggingInRef.current) return;
      if (firebaseUser) {
        let userData = await getUserDocument(firebaseUser.uid);
        if (!userData) {
          const email = firebaseUser.email || '';
          try {
            userData = await createUserDocument(firebaseUser.uid, {
              name: firebaseUser.displayName || email.split('@')[0],
              email,
              role: 'customer',
              roles: ['customer'],
              activeRole: 'customer',
            }) as unknown as User;
          } catch {
            userData = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email,
              role: 'customer',
              roles: ['customer'],
              activeRole: 'customer',
              roleStatus: {},
            } as User;
          }
        }
        const normalized = normalizeUser(userData);

        // Master admin bootstrap (idempotent; no write when already fully approved)
        const bootstrap = masterAdminBootstrap(firebaseUser.uid, firebaseUser.email || undefined, normalized);
        if (bootstrap) {
          await updateUserDocument(firebaseUser.uid, bootstrap).catch(() => {});
          Object.assign(normalized, bootstrap);
        }

        // Restore activeRole from localStorage as fallback
        try {
          const cachedRole = localStorage.getItem('activeRole');
          const userRoles: string[] = normalized.roles || [];
          if (cachedRole && userRoles.includes(cachedRole) && cachedRole !== normalized.activeRole) {
            normalized.activeRole = cachedRole;
            await updateUserDocument(firebaseUser.uid, { activeRole: cachedRole }).catch(() => {});
          }
        } catch { /* cached role restore is best-effort */ }

        // Ensure a concrete default role so the navbar is never empty
        if (!normalized.roles || normalized.roles.length === 0) {
          normalized.roles = ['customer'];
        }
        if (!normalized.activeRole || !normalized.roles.includes(normalized.activeRole as User['role'])) {
          normalized.activeRole = resolveDefaultActiveRole(normalized.roles, normalized.activeRole) ?? undefined;
        }

        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
      } else {
        setUser(null);
        setIsGuest(false);
        localStorage.removeItem('user');
      }
      if (initialCheck) {
        initialCheck = false;
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    isLoggingInRef.current = true;
    try {
      const credential = await loginUser(email, password);
      let userData = await getUserDocument(credential.user.uid);
      if (!userData) {
        try {
          userData = await createUserDocument(credential.user.uid, {
            name: credential.user.displayName || email.split('@')[0],
            email,
            role: 'customer',
            roles: ['customer'],
            activeRole: 'customer',
          }) as unknown as User;
        } catch {
          userData = {
            id: credential.user.uid,
            name: credential.user.displayName || email.split('@')[0],
            email,
            role: 'customer',
            roles: ['customer'],
            activeRole: 'customer',
            roleStatus: {},
          } as User;
        }
      }
      const normalized = normalizeUser(userData);
      // Master admin auto-promotion (idempotent; no write when already fully approved)
      const isMaster = !!import.meta.env.VITE_ADMIN_EMAIL && email === import.meta.env.VITE_ADMIN_EMAIL;
      const bootstrap = masterAdminBootstrap(credential.user.uid, email, normalized);
      if (bootstrap) {
        await updateUserDocument(credential.user.uid, bootstrap).catch(() => {});
        Object.assign(normalized, bootstrap);
      }
      if (!normalized.roles || normalized.roles.length === 0) {
        normalized.roles = ['customer'];
      }
      // Always land on a concrete role so the navbar is never empty.
      // The master admin always starts in the customer (consumer) experience.
      normalized.activeRole = isMaster
        ? 'customer'
        : (resolveDefaultActiveRole(normalized.roles, normalized.activeRole) ?? undefined);
      setUser(normalized);
      setIsGuest(false);
      localStorage.setItem('activeRole', normalized.activeRole || '');
      localStorage.setItem('user', JSON.stringify(normalized));
      return normalized;
    } finally {
      isLoggingInRef.current = false;
    }
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    const { password, ...profile } = userData;

    isLoggingInRef.current = true;
    try {
      const credential = await registerUser(profile.email!, password);
      const uid = credential.user.uid;
      await createUserDocument(uid, { ...profile, role: 'customer', roles: ['customer'], activeRole: 'customer', emailVerified: false });
      const userData = await getUserDocument(uid);
      if (userData) {
        setUser(normalizeUser(userData));
        setIsGuest(false);
        localStorage.setItem('user', JSON.stringify(normalizeUser(userData)));
      }
    } catch (e) {
      const authError = e as { code?: string };
      if (authError.code === 'auth/email-already-in-use') {
        const credential = await signInUser(profile.email!, password);
        const uid = credential.user.uid;
        try {
          await updateUserRole(uid, 'customer');
          await updateUserDocument(uid, { emailVerified: false });
        } catch {
          // Role/profile writes may be blocked by rules; sign-in itself already succeeded.
        }
        const userData = await getUserDocument(uid);
        if (userData) {
          setUser(normalizeUser(userData));
          setIsGuest(false);
          localStorage.setItem('user', JSON.stringify(normalizeUser(userData)));
        }
      } else {
        isLoggingInRef.current = false;
        throw e;
      }
    }
    isLoggingInRef.current = false;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('user');
    localStorage.removeItem('activeRole');
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    const normalized = normalizeUser(updated);
    setUser(normalized);
    localStorage.setItem('user', JSON.stringify(normalized));
    try {
      await updateUserDocument(user.id, data);
    } catch {
      // silently fail
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    const fresh = await getUserDocument(user.id);
    if (fresh) {
      const normalized = normalizeUser(fresh);
      setUser(normalized);
      localStorage.setItem('user', JSON.stringify(normalized));
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setUser(null);
  };

  const isRoleAuthenticated = (role: UserRole): boolean => {
    if (role === 'guest') return isGuest;
    const userRoles: string[] = user?.roles || (user?.role ? [user.role] : []);
    return userRoles.includes(role);
  };

  const setActiveRole = async (role: string) => {
    if (!user) return;
    const userRoles: string[] = user.roles || [];
    if (!userRoles.includes(role)) return;

    const updated = { ...user, activeRole: role };
    setUser(updated);
    localStorage.setItem('activeRole', role);
    localStorage.setItem('user', JSON.stringify(updated));
    try {
      await updateUserDocument(user.id, { activeRole: role });
    } catch (err) {
      console.error('Failed to persist activeRole to Firestore:', err);
    }
  };

  const switchRole = async (role: string) => {
    if (!user) return;
    const userRoles: string[] = user.roles || [];
    if (!userRoles.includes(role)) return;

    await setActiveRole(role);
    const target = getRoleRedirect(user, role) || roleHomePaths[role] || `/${role}/home`;
    window.location.assign(target);
  };

  const applyForRole = async (role: string, formData: Record<string, unknown>) => {
    if (!user) throw new Error('Not logged in');
    if (user.roles?.includes(role as User['role'])) throw new Error('ALREADY_EXISTS');
    if (user.roleStatus?.[role] === 'pending') throw new Error('ALREADY_EXISTS');

    try {
      await updateUserRole(user.id, role as User['role']);
    } catch {
      // Role assignment is granted by an admin after review; the application is still recorded below.
    }
    await saveRoleProfile(user.id, role, formData);

    const fresh = await getUserDocument(user.id);
    if (fresh) {
      const normalized = normalizeUser(fresh);
      setUser(normalized);
      localStorage.setItem('user', JSON.stringify(normalized));
    }
  };

  const isAuthenticated = !!user && !isGuest;

  return (
    <AuthContext.Provider value={{
      user, isGuest, isAuthenticated, authLoading,
      activeRole, roles,
      login, register, logout,
      continueAsGuest, updateUserProfile, refreshUser, isRoleAuthenticated,
      setActiveRole, switchRole, applyForRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
