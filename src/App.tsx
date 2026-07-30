import React, { Suspense, lazy } from 'react';
import { IonApp, IonRouterOutlet, IonPage, IonContent, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { AppLayout, RoleLayout } from './layouts';
import { useAuth } from './context/AuthContext';
import DeliveryLoader from './components/DeliveryLoader';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Lazy-loaded pages */
const Landing = lazy(() => import('./pages/Guest/Landing'));
const CustomerHome = lazy(() => import('./pages/customer/Home'));
const StallDetail = lazy(() => import('./pages/StallDetail'));
const GuestCart = lazy(() => import('./pages/Guest/Cart'));
const GuestLocationPicker = lazy(() => import('./pages/Guest/LocationPicker'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const CustomerProfile = lazy(() => import('./pages/customer/Profile'));
const CustomerCart = lazy(() => import('./pages/customer/Cart'));
const CustomerLocationPicker = lazy(() => import('./pages/customer/LocationPicker'));
const CustomerOrders = lazy(() => import('./pages/customer/Orders'));
const CustomerOrderTracking = lazy(() => import('./pages/customer/OrderTracking'));
const CustomerReview = lazy(() => import('./pages/customer/Review'));
const RiderDashboard = lazy(() => import('./pages/Rider/Dashboard'));
const RiderOrders = lazy(() => import('./pages/Rider/Orders'));
const RiderEarnings = lazy(() => import('./pages/Rider/Earnings'));
const RiderProfile = lazy(() => import('./pages/Rider/Profile'));
const RiderDelivery = lazy(() => import('./pages/Rider/Delivery'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/Admin/Users'));
const AdminOrders = lazy(() => import('./pages/Admin/Orders'));
const AdminReports = lazy(() => import('./pages/Admin/Reports'));
const AdminDeliveryConfig = lazy(() => import('./pages/Admin/DeliveryConfig'));

const VendorApply = lazy(() => import('./pages/apply/ApplyVendor'));
const RiderApply = lazy(() => import('./pages/apply/ApplyRider'));
const VendorDashboard = lazy(() => import('./pages/Vendor/VendorDashboard'));
const VendorProducts = lazy(() => import('./pages/Vendor/VendorProducts'));
const VendorOrders = lazy(() => import('./pages/Vendor/VendorOrders'));
const VendorEarnings = lazy(() => import('./pages/Vendor/VendorEarnings'));
const VendorReviews = lazy(() => import('./pages/Vendor/VendorReviews'));
const VendorProfile = lazy(() => import('./pages/Vendor/VendorProfile'));
const VendorLocationPicker = lazy(() => import('./pages/Vendor/VendorLocationPicker'));
const ActivityLog = lazy(() => import('./pages/Activities/ActivityLog'));
const ReportIncident = lazy(() => import('./pages/Reports/ReportIncident'));
const RoleSelection = lazy(() => import('./pages/Auth/RoleSelection'));
const VerifyOtp = lazy(() => import('./pages/Auth/VerifyOtp'));
const ApprovalPending = lazy(() => import('./pages/Auth/ApprovalPending'));
const ApplicationRejected = lazy(() => import('./pages/Auth/ApplicationRejected'));
import ProtectedRoute from './components/ProtectedRoute';
import StorageConsent from './components/StorageConsent';

setupIonicReact({
  mode: 'ios',
  animated: false,
});

const L: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppLayout><RoleLayout>{children}</RoleLayout></AppLayout>
);

const App: React.FC = () => {
  const { authLoading } = useAuth();
  if (authLoading) return <DeliveryLoader />;

  return (
  <IonApp>
    <IonReactRouter>
      <Suspense fallback={<DeliveryLoader />}>
        <IonRouterOutlet>
          {/* Landing - standalone, no layout wrapper */}
          <Route exact path="/">
            <IonPage>
              <IonContent className="ion-content-center">
                <Landing />
              </IonContent>
            </IonPage>
          </Route>

          {/* Guest Routes */}
          <ProtectedRoute exact path="/guest/home" requireAuth={false}>
            <L><CustomerHome /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/guest/cart" requireAuth={false}>
            <L><GuestCart /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/guest/location" requireAuth={false}>
            <L><GuestLocationPicker /></L>
          </ProtectedRoute>

          {/* Stall Detail (guest + customer only) */}
          <ProtectedRoute exact path="/stall/:id/menu" requireAuth={false} requiredRole="customer">
            <L><StallDetail /></L>
          </ProtectedRoute>

          {/* Customer Routes */}
          <ProtectedRoute exact path="/customer/home" requiredRole="customer">
            <L><CustomerHome /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/customer/profile" requiredRole="customer">
            <L><CustomerProfile /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/customer/cart" requiredRole="customer">
            <L><CustomerCart /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/customer/orders" requiredRole="customer">
            <L><CustomerOrders /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/customer/location" requiredRole="customer">
            <L><CustomerLocationPicker /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/customer/order-tracking" requiredRole="customer">
            <L><CustomerOrderTracking /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/customer/review/:id" requiredRole="customer">
            <L><CustomerReview /></L>
          </ProtectedRoute>

          {/* Auth Routes */}
          <ProtectedRoute exact path="/login" requireAuth={false}>
            <L><Login /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/register" requireAuth={false}>
            <L><Register /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/select-role" requireAuth={true}>
            <L><RoleSelection /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/verify-otp" requireAuth={true}>
            <L><VerifyOtp /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/approval-pending" requireAuth={true}>
            <IonPage><IonContent className="ion-content-center"><ApprovalPending /></IonContent></IonPage>
          </ProtectedRoute>
          <ProtectedRoute exact path="/application-rejected" requireAuth={true}>
            <IonPage><IonContent className="ion-content-center"><ApplicationRejected /></IonContent></IonPage>
          </ProtectedRoute>

          {/* Apply Routes */}
          <ProtectedRoute exact path="/apply/vendor" requireAuth={true}>
            <IonPage><IonContent className="ion-content-center"><VendorApply /></IonContent></IonPage>
          </ProtectedRoute>
          <ProtectedRoute exact path="/apply/rider" requireAuth={true}>
            <IonPage><IonContent className="ion-content-center"><RiderApply /></IonContent></IonPage>
          </ProtectedRoute>

          {/* Rider Routes */}
          <ProtectedRoute exact path="/rider/dashboard" requiredRole="rider">
            <L><RiderDashboard /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/rider/orders" requiredRole="rider">
            <L><RiderOrders /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/rider/earnings" requiredRole="rider">
            <L><RiderEarnings /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/rider/profile" requiredRole="rider">
            <L><RiderProfile /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/rider/delivery/:id" requiredRole="rider">
            <L><RiderDelivery /></L>
          </ProtectedRoute>

          {/* Admin Routes */}
          <ProtectedRoute exact path="/admin/dashboard" requiredRole="admin">
            <L><AdminDashboard /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/admin/users" requiredRole="admin">
            <L><AdminUsers /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/admin/orders" requiredRole="admin">
            <L><AdminOrders /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/admin/reports" requiredRole="admin">
            <L><AdminReports /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/admin/delivery-config" requiredRole="admin">
            <L><AdminDeliveryConfig /></L>
          </ProtectedRoute>
          {/* Vendor Routes */}
          <ProtectedRoute exact path="/vendor/dashboard" requiredRole="vendor">
            <L><VendorDashboard /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/vendor/products" requiredRole="vendor">
            <L><VendorProducts /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/vendor/orders" requiredRole="vendor">
            <L><VendorOrders /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/vendor/earnings" requiredRole="vendor">
            <L><VendorEarnings /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/vendor/reviews" requiredRole="vendor">
            <L><VendorReviews /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/vendor/profile" requiredRole="vendor">
            <L><VendorProfile /></L>
          </ProtectedRoute>
          <ProtectedRoute exact path="/vendor/location" requiredRole="vendor">
            <L><VendorLocationPicker /></L>
          </ProtectedRoute>

          {/* Activity Routes */}
          <ProtectedRoute exact path="/activities" requireAuth={true}>
            <L><ActivityLog /></L>
          </ProtectedRoute>

          {/* Report Routes */}
          <ProtectedRoute exact path="/report" requireAuth={true}>
            <L><ReportIncident /></L>
          </ProtectedRoute>

          {/* Legacy redirects */}
          <Route exact path="/guest/stall/:id" render={({match}) => <Redirect to={`/stall/`+(match.params as any).id+`/menu`} />} />
        </IonRouterOutlet>
      </Suspense>
      <StorageConsent />
    </IonReactRouter>
  </IonApp>
  );
};

export default App;
