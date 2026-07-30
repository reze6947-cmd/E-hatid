import {
  personOutline, shieldCheckmarkOutline,
  carOutline, storefrontOutline, checkmarkCircle, logOutOutline,
} from 'ionicons/icons';

export interface RoleEntry {
  label: string;
  icon: string;
  description: string;
  accentColor: string;
}

export interface SelectRolePageConfig {
  containerClass: string;
  wrapperClass: string;

  header: {
    icon: string;
    iconContainerClass: string;
    iconClass: string;
    title: string;
    titleClass: string;
    subtitle: string;
    subtitleClass: string;
    headerGap: string;
  };

  card: {
    baseClass: string;
    selectedClass: string;
    unselectedClass: string;
    disabledClass: string;
    iconContainerClass: string;
    iconClass: string;
    labelClass: string;
    descriptionClass: string;
    radioClass: string;
    radioSelectedClass: string;
    radioUnselectedClass: string;
    radioIconClass: string;
    cardsGap: string;
  };

  signOut: {
    marginTop: string;
    buttonClass: string;
    iconClass: string;
    textClass: string;
    icon: string;
    text: string;
  };

  roles: Record<string, RoleEntry>;

  roleHomePaths: Record<string, string>;
}

export const selectRoleConfig: SelectRolePageConfig = {
  containerClass: 'min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6 bg-[var(--ion-background-color)]',
  wrapperClass: 'w-full max-w-sm sm:max-w-md',

  header: {
    icon: carOutline,
    iconContainerClass: 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[var(--ion-color-primary)] to-[var(--ion-color-primary-tint)]/80 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[var(--ion-color-primary)]/20',
    iconClass: 'text-2xl sm:text-3xl text-white',
    title: 'Choose Your Role',
    titleClass: 'text-2xl sm:text-3xl font-extrabold text-[var(--ion-text-color)] m-0',
    subtitle: 'You have access to multiple roles. Pick one to continue.',
    subtitleClass: 'text-sm sm:text-base text-[var(--ion-text-color-secondary)] mt-2 m-0 max-w-xs mx-auto',
    headerGap: 'mb-10',
  },

  card: {
    baseClass: 'w-full flex items-center gap-4 p-4 sm:p-5 rounded-[20px] border-2 transition-all duration-200 text-left',
    selectedClass: 'border-[var(--ion-color-primary)] bg-[var(--ion-color-primary)]/5 shadow-md shadow-[var(--ion-color-primary)]/10',
    unselectedClass: 'border-[var(--ion-border-color)] bg-[var(--ion-card-background)] shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
    disabledClass: 'opacity-60 cursor-not-allowed',
    iconContainerClass: 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm',
    iconClass: 'text-xl sm:text-2xl',
    labelClass: 'text-sm sm:text-lg font-bold text-[var(--ion-text-color)]',
    descriptionClass: 'text-xs sm:text-sm text-[var(--ion-text-color-secondary)] mt-0.5',
    radioClass: 'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200',
    radioSelectedClass: 'border-[var(--ion-color-primary)] bg-[var(--ion-color-primary)] scale-110',
    radioUnselectedClass: 'border-[var(--ion-border-color)]',
    radioIconClass: 'text-white text-sm',
    cardsGap: 'space-y-4',
  },

  signOut: {
    marginTop: 'mt-8',
    buttonClass: 'w-full flex items-center justify-center gap-3 p-4 sm:p-5 rounded-[20px] border-2 border-[var(--ion-border-color)] bg-[var(--ion-card-background)] shadow-sm hover:shadow-md hover:border-[#EF4444]/30 transition-all duration-200 text-[var(--ion-text-color-secondary)] hover:text-[#EF4444] font-semibold cursor-pointer',
    iconClass: 'text-xl sm:text-2xl',
    textClass: 'text-sm sm:text-lg',
    icon: logOutOutline,
    text: 'Sign Out',
  },

  roles: {
    customer: { label: 'Customer', icon: personOutline, description: 'Browse stalls and order food', accentColor: '#6D28D9' },
    rider: { label: 'Rider', icon: carOutline, description: 'Deliver orders and earn', accentColor: '#6366F1' },
    vendor: { label: 'Vendor', icon: storefrontOutline, description: 'Manage your store', accentColor: '#06B6D4' },
    admin: { label: 'Admin', icon: shieldCheckmarkOutline, description: 'Manage the platform', accentColor: '#DC2626' },
  },

  roleHomePaths: {
    customer: '/customer/home',
    rider: '/rider/dashboard',
    vendor: '/vendor/dashboard',
    admin: '/admin/dashboard',
  },
};
