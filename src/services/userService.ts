import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { User } from '../types';
import { persistImage } from './imageStorage';

interface UserDocData {
  roleStatus?: Record<string, 'none' | 'pending' | 'approved' | 'rejected'>;
  accountStatus?: string;
  role?: string;
  roles?: string[];
  activeRole?: string;
}

export const createUserDocument = async (uid: string, data: Partial<User>) => {
  const role = data.role || 'customer';

  const userData = {
    id: uid,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    age: typeof data.age === 'number' ? data.age : 0,
    address: data.address || '',
    role,
    roles: data.roles || [role],
    activeRole: data.activeRole || data.roles?.[0] || role,
    roleStatus: data.roleStatus || {},
    emailVerified: data.emailVerified === true,
    created_at: serverTimestamp(),
    ...(data.stallName ? { stallName: data.stallName } : {}),
    ...(data.stallAddress ? { stallAddress: data.stallAddress } : {}),
  };

  try {
    await setDoc(doc(db, 'users', uid), userData);
  } catch (error) {
    console.error('Firestore createUserDocument failed:', error);
    throw error;
  }
  return userData;
};

export const getUserDocument = async (uid: string): Promise<User | null> => {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (docSnap.exists()) {
    const data = docSnap.data() as UserDocData;
    if (!data.roleStatus) {
      data.roleStatus = {};
    }
    const legacyStatus = data.accountStatus as string | undefined;
    if (legacyStatus && legacyStatus !== 'active') {
      data.roleStatus[data.role || 'customer'] = legacyStatus === 'pending' ? 'pending' : 'rejected';
    }
    data.roles = data.roles || [data.role || 'customer'];
    data.activeRole = data.activeRole || (data.role === 'admin' ? 'admin' : 'customer');
    return data as User;
  }
  return null;
};

export const updateUserDocument = async (uid: string, data: Partial<User>) => {
  await updateDoc(doc(db, 'users', uid), data);
};

export const setRoleStatus = async (uid: string, role: string, status: 'approved' | 'rejected') => {
  const snap = await getDoc(doc(db, 'users', uid));
  const current = snap.data();
  const currentRoles: string[] = current?.roles || (current?.role ? [current.role] : []);
  const updatedRoles = status === 'approved' && !currentRoles.includes(role)
    ? [...currentRoles, role]
    : currentRoles;
  await updateDoc(doc(db, 'users', uid), {
    [`roleStatus.${role}`]: status,
    roles: updatedRoles,
  });
};

export const removeUserRole = async (uid: string, role: string) => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) throw new Error('User not found');
  const current = snap.data();
  const currentRoles: string[] = current.roles || [current.role || 'customer'];
  const updatedRoles = currentRoles.filter(r => r !== role);
  const fallback = updatedRoles.length > 0 ? updatedRoles : ['customer'];
  const roleStatus = { ...(current.roleStatus || {}) };
  delete roleStatus[role];
  await updateDoc(doc(db, 'users', uid), {
    roles: fallback,
    role: fallback[0],
    activeRole: fallback[0],
    roleStatus,
  });
};

export const updateUserRole = async (uid: string, newRole: User['role']) => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) throw new Error('User not found');
  const current = snap.data();
  const currentRoles: string[] = current.roles || [current.role];
  if (currentRoles.includes(newRole)) return;
  const updatedRoles = [...currentRoles, newRole];
  const roleStatus = { ...(current.roleStatus || {}), [newRole]: newRole === 'admin' ? 'approved' : 'pending' };
  await updateDoc(doc(db, 'users', uid), {
    role: newRole,
    roles: updatedRoles,
    activeRole: newRole,
    roleStatus,
  });
};

export const saveRoleProfile = async (uid: string, role: string, data: Record<string, unknown>) => {
  await setDoc(doc(db, 'users', uid, `${role}Profile`, 'data'), { ...data, status: 'pending', submittedAt: serverTimestamp() });
};

export const getRoleProfile = async (uid: string, role: string): Promise<DocumentData | null> => {
  try {
    const snap = await getDoc(doc(db, 'users', uid, `${role}Profile`, 'data'));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
};

export const updateRoleProfile = async (uid: string, role: string, data: Record<string, unknown>) => {
  await setDoc(doc(db, 'users', uid, `${role}Profile`, 'data'), data, { merge: true });
};

export const fetchAllUsers = async (): Promise<User[]> => {
  const { getDocs, collection } = await import('firebase/firestore');
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => {
    const data = d.data() as UserDocData;
    if (!data.roleStatus) {
      data.roleStatus = {};
    }
    const legacyStatus = data.accountStatus as string | undefined;
    if (legacyStatus && legacyStatus !== 'active') {
      data.roleStatus[data.role || 'customer'] = legacyStatus === 'pending' ? 'pending' : 'rejected';
    }
    data.roles = data.roles || [data.role || 'customer'];
    data.activeRole = data.activeRole || (data.role === 'admin' ? 'admin' : 'customer');
    return data as User;
  });
};

/**
 * Upload a legacy base64 avatar to Firebase Storage and update the user doc.
 * Returns true when an upload happened, false when nothing was needed.
 */
export const migrateUserAvatar = async (user: User): Promise<boolean> => {
  if (!user.avatar || !user.avatar.startsWith('data:image/')) return false;
  const avatar = await persistImage(user.avatar, `avatars/${user.id}/avatar`);
  await updateUserDocument(user.id, { avatar });
  return avatar !== user.avatar;
};

export const submitApplicationDoc = async (userId: string, role: string, data: Record<string, unknown>) => {
  const { collection, addDoc } = await import('firebase/firestore');
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== null)
  );
  return addDoc(collection(db, 'applications'), {
    userId,
    role,
    status: 'pending',
    createdAt: serverTimestamp(),
    ...cleanData,
  });
};

export const fetchPendingApprovals = async (): Promise<User[]> => {
  const all = await fetchAllUsers();
  return all.filter(u =>
    Object.values(u.roleStatus || {}).some(s => s === 'pending')
  );
};
