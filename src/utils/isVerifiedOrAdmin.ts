import { User } from '../types';

const getMasterAdminEmail = (): string | undefined =>
  import.meta.env.VITE_ADMIN_EMAIL as string | undefined;

export const isMasterAdmin = (user: User | null): boolean => {
  if (!user) return false;
  if (user.isMasterAdmin === true) return true;
  const masterEmail = getMasterAdminEmail();
  if (!masterEmail || !user.email) return false;
  return user.email === masterEmail;
};

export const isVerifiedOrAdmin = (user: User | null): boolean => {
  if (isMasterAdmin(user)) return true;
  return user?.emailVerified === true;
};
