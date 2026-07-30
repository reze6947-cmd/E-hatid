import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { loginUser, registerUser, logoutUser, onAuthChanged, signInUser } from '../services/authService';
import { createUserDocument, getUserDocument, updateUserDocument, updateUserRole, saveRoleProfile } from '../services/userService';
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
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => void;
  continueAsGuest: () => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  isRoleAuthenticated: (role: UserRole) => boolean;
  setActiveRole: (role: string) => Promise<void>;
  applyForRole: (role: string, formData: Record<string, any>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (data: any): User => {
  const mapRole = (r: string) => r === 'user' ? 'customer' : r;
  const rawRole = mapRole(data.role || 'customer');
  const roles = data.roles?.length ? data.roles.map((r: string) => mapRole(r)) : [rawRole];
  const activeRole = data.activeRole
    ? mapRole(data.activeRole)
    : (rawRole === 'admin' ? 'admin' : (roles[0] || rawRole));
  return { ...data, roles, activeRole };
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
        // Master admin auto-promotion
        const MASTER_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
        if (MASTER_EMAIL && email === MASTER_EMAIL) {
          if (!normalized.isMasterAdmin) {
            await updateUserDocument(credential.user.uid, { isMasterAdmin: true } as any);
            normalized.isMasterAdmin = true;
          }
          if (!normalized.roles.includes('admin')) {
            await updateUserRole(credential.user.uid, 'admin' as any);
            normalized.roles = [...(normalized.roles || []), 'admin'];
            normalized.roleStatus = { ...normalized.roleStatus, admin: 'approved' };
          }
        }
        const userRoles = normalized.roles;
        if (!userRoles || userRoles.length === 0) {
          normalized.roles = ['customer'];
          normalized.activeRole = 'customer';
        }
        // Multi-role → role selector on next load
        if (userRoles.length > 1) {
          normalized.activeRole = undefined;
        }
        setUser(normalized);
        setIsGuest(false);
        localStorage.setItem('user', JSON.stringify(normalized));
    } catch (e) {
      isLoggingInRef.current = false;
      throw e;
    }
    isLoggingInRef.current = false;
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
    } catch (e: any) {
      if (e?.code === 'auth/email-already-in-use') {
        const credential = await signInUser(profile.email!, password);
        const uid = credential.user.uid;
        await updateUserRole(uid, 'customer' as any);
        await updateUserDocument(uid, { emailVerified: false } as any);
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
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    const normalized = normalizeUser(updated);
    setUser(normalized);
    localStorage.setItem('user', JSON.stringify(normalized));
    try {
      await updateUserDocument(user.id, data as any);
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
    localStorage.setItem('user', JSON.stringify(updated));
    try {
      await updateUserDocument(user.id, { activeRole: role } as any);
    } catch (err) {
      console.error('Failed to persist activeRole to Firestore:', err);
    }
  };

  const applyForRole = async (role: string, formData: Record<string, any>) => {
    if (!user) throw new Error('Not logged in');
    if (user.roles?.includes(role as any)) throw new Error('ALREADY_EXISTS');
    if (user.roleStatus?.[role] === 'pending') throw new Error('ALREADY_EXISTS');

    await updateUserRole(user.id, role as any);
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
      setActiveRole, applyForRole,
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
