import {
  homeOutline, home,
  cartOutline, cart,
  documentTextOutline, documentText,
  personOutline, person,
  cashOutline, cash,
  appsOutline, apps,
  fastFoodOutline, fastFood,
  starOutline, star,

  peopleOutline, people,
  barChartOutline, barChart,
  bicycleOutline,
} from 'ionicons/icons';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  activeIcon: string;
  badge?: 'cart';
}

export const navItemsByRole: Record<string, NavItem[]> = {
  customer: [
    { label: 'Home', path: '/customer/home', icon: homeOutline, activeIcon: home },
    { label: 'Cart', path: '/customer/cart', icon: cartOutline, activeIcon: cart, badge: 'cart' },
    { label: 'Orders', path: '/customer/orders', icon: documentTextOutline, activeIcon: documentText },
    { label: 'Profile', path: '/customer/profile', icon: personOutline, activeIcon: person },
  ],
  rider: [
    { label: 'Home', path: '/rider/dashboard', icon: homeOutline, activeIcon: home },
    { label: 'Orders', path: '/rider/orders', icon: documentTextOutline, activeIcon: documentText },
    { label: 'Earnings', path: '/rider/earnings', icon: cashOutline, activeIcon: cash },
    { label: 'Reviews', path: '/rider/reviews', icon: starOutline, activeIcon: star },
    { label: 'Profile', path: '/rider/profile', icon: personOutline, activeIcon: person },
  ],
  vendor: [
    { label: 'Home', path: '/vendor/dashboard', icon: appsOutline, activeIcon: apps },
    { label: 'Products', path: '/vendor/products', icon: fastFoodOutline, activeIcon: fastFood },
    { label: 'Orders', path: '/vendor/orders', icon: documentTextOutline, activeIcon: documentText },
    { label: 'Earnings', path: '/vendor/earnings', icon: cashOutline, activeIcon: cash },
    { label: 'Reviews', path: '/vendor/reviews', icon: starOutline, activeIcon: star },
    { label: 'Profile', path: '/vendor/profile', icon: personOutline, activeIcon: person },
  ],
  admin: [
    { label: 'Home', path: '/admin/dashboard', icon: appsOutline, activeIcon: apps },
    { label: 'Users', path: '/admin/users', icon: peopleOutline, activeIcon: people },
    { label: 'Orders', path: '/admin/orders', icon: documentTextOutline, activeIcon: documentText },
    { label: 'Reports', path: '/admin/reports', icon: barChartOutline, activeIcon: barChart },
    { label: 'Delivery', path: '/admin/delivery-config', icon: bicycleOutline, activeIcon: bicycleOutline },
  ],
  guest: [
    { label: 'Home', path: '/guest/home', icon: homeOutline, activeIcon: home },
  ],
};

export const roleLabels: Record<string, string> = {
  customer: 'Customer',
  rider: 'Rider',
  vendor: 'Vendor',
  admin: 'Admin',
};

export const roleHomePaths: Record<string, string> = {
  customer: '/customer/home',
  rider: '/rider/dashboard',
  vendor: '/vendor/dashboard',
  admin: '/admin/dashboard',
};
