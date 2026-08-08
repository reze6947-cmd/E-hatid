export type FirestoreTimestamp = string | number | Date | { toDate: () => Date };

export interface User {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  email: string;
  phone?: string;
  age?: number;
  birthDate?: string;
  avatar?: string;
  address?: string;
  addressStreet?: string;
  addressBarangay?: string;
  addressCity?: string;
  addressProvince?: string;
  addressRegion?: string;
  addressZip?: string;
  role: 'customer' | 'rider' | 'admin' | 'vendor';
  roles: ('customer' | 'rider' | 'admin' | 'vendor')[];
  activeRole?: string;
  password?: string;
  token?: string;
  isMasterAdmin?: boolean;
  roleStatus: Record<string, 'none' | 'pending' | 'approved' | 'rejected'>;
  emailVerified?: boolean;
  created_at?: FirestoreTimestamp;
  accountStatus?: 'pending' | 'active' | 'rejected';
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  stallName?: string;
  stallAddress?: string;
  vehicle?: string;
  licensePlate?: string;
  licenseNumber?: string;
  bankAccount?: string;
  bankName?: string;
  otpCode?: string;
  otpExpiresAt?: FirestoreTimestamp;
  latitude?: number;
  longitude?: number;
}

export interface Rider extends User {
  role: 'rider';
  vehicle: string;
  licensePlate: string;
  licenseNumber: string;
  bankAccount: string;
  bankName: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'vendor';
  stallName: string;
  stallAddress: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

export type ApplicationType = 'individual' | 'business';

export interface VendorApplication {
  applicationType: ApplicationType;
  displayName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  description: string;
  category: string;
  governmentIdType?: string;
  governmentIdNumber?: string;
  governmentIdImageUrl?: string;
  businessName?: string;
  businessRegistrationNumber?: string;
  businessDocumentType?: string;
  businessDocumentImageUrl?: string;
  representativeName?: string;
  representativeIdType?: string;
  representativeIdNumber?: string;
  representativeIdImageUrl?: string;
  taxIdNumber?: string;
}

export interface RiderApplication {
  applicationType: ApplicationType;
  fullName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  vehicleType: 'bike' | 'motorcycle' | 'car';
  governmentIdType?: string;
  governmentIdNumber?: string;
  governmentIdImageUrl?: string;
  driverLicenseNumber?: string;
  driverLicenseImageUrl?: string;
  companyName?: string;
  companyRegistrationNumber?: string;
  businessDocumentImageUrl?: string;
  assignedRiderName?: string;
  assignedRiderLicenseNumber?: string;
  assignedRiderLicenseImageUrl?: string;
}

export interface Stall {
  id: string;
  name: string;
  description?: string;
  image: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder?: number;
  vendorId: string;
  category?: string;
  cuisine?: string;
  logo?: string;
  accentColor?: string;
  menu?: MenuItem[];
  active?: boolean;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface MenuItemOption {
  id: string;
  name: string;
  required: boolean;
  maxSelections: number;
  choices: OptionChoice[];
}

export interface OptionChoice {
  id: string;
  name: string;
  price: number;
}

export interface MenuItemAddOn {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  available: boolean;
  stallId: string;
  popular?: boolean;
  options?: MenuItemOption[];
  addOns?: MenuItemAddOn[];
}

export interface SelectedOption {
  optionId: string;
  optionName: string;
  choiceId: string;
  choiceName: string;
  choicePrice: number;
}

export interface SelectedAddOn {
  addOnId: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  stallId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  selectedOptions?: SelectedOption[];
  selectedAddOns?: SelectedAddOn[];
  specialInstructions?: string;
}

export interface Order {
  id: string;
  userId: string;
  stallId: string;
  stallName?: string;
  customerName?: string;
  customerPhone?: string;
  vendorId?: string;
  items: OrderItem[];
  total: number;
  deliveryFee?: number;
  distance?: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled' | 'rejected' | 'completed' | 'ready_for_pickup';
  createdAt: string | Date;
  deliveryAddress?: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderPlate?: string;
  riderAvatar?: string;
  estimatedDeliveryTime?: string;
  customerLatitude?: number;
  customerLongitude?: number;
  stallLatitude?: number;
  stallLongitude?: number;
  cancelledReason?: string;
  acceptedAt?: string | Date;
  readyAt?: string | Date;
  pickedUpAt?: string | Date;
  completedAt?: string | Date;
}

export interface RiderLocation {
  lat: number;
  lng: number;
  updatedAt?: FirestoreTimestamp;
  riderId: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  selectedOptions?: SelectedOption[];
  selectedAddOns?: SelectedAddOn[];
  specialInstructions?: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: 'order' | 'delivery' | 'payment' | 'review' | 'order_delivered' | 'order_placed' | 'payment_made' | 'order_cancelled' | 'report_filed' | 'rider_online' | 'rider_offline' | 'user_login' | 'report_resolved';
  title?: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'info' | 'warning' | 'critical';
  timestamp: string;
  createdAt?: string | Date;
  metadata?: unknown;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId?: string;
  receiverId?: string;
  senderRole?: string;
  content: string;
  timestamp?: string;
  read?: boolean;
  isRead?: boolean;
  orderId?: string;
  messageType?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Report {
  id: string;
  userId: string;
  reporterId?: string;
  reporterRole?: string;
  reportType?: string;
  orderId?: string;
  riderId?: string;
  title?: string;
  type: 'delivery' | 'quality' | 'behavior' | 'other';
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'resolved' | 'rejected' | 'open' | 'under_review' | 'closed';
  createdAt: string | Date;
  updatedAt?: string | Date;
  resolvedAt?: string | Date;
  resolvedBy?: string;
  resolution?: string;
  adminNotes?: string;
}

export interface Notification {
  id: string;
  userId?: string;
  vendorId?: string;
  riderId?: string;
  orderId?: string;
  type: 'order' | 'delivery' | 'payment' | 'message' | 'order_placed' | 'order_accepted' | 'order_rejected' | 'order_preparing' | 'order_ready' | 'rider_accepted' | 'rider_on_way' | 'order_delivered' | 'order_cancelled';
  title: string;
  message: string;
  read?: boolean;
  isRead?: boolean;
  data?: unknown;
  createdAt: string | Date;
}

export interface Review {
  id: string;
  userId: string;
  stallId: string;
  orderId?: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
}
