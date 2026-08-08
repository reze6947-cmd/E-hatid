import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roleHomePaths } from '../config/routesByRole';
import { getRoleRedirect } from '../services/roleGuard';
import { isVerifiedOrAdmin } from '../utils/isVerifiedOrAdmin';

interface ProtectedRouteProps {
  path: string;
  exact?: boolean;
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: string | string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  path,
  exact = false,
  children,
  requireAuth = true,
  requiredRole,
}) => {
  const { user, activeRole, roles } = useAuth();

  const homePath = activeRole ? (roleHomePaths[activeRole] || '/') : '/select-role';

  if (requireAuth && !user) {
    return <Route exact={exact} path={path}><Redirect to="/login" /></Route>;
  }

  // Email verification redirect — always send to /verify-otp (skip otp page itself)
  const skipEmailPaths = ['/verify-otp', '/select-role', '/register', '/login', '/apply/vendor', '/apply/rider', '/approval-pending', '/application-rejected'];
  if (requireAuth && user && !isVerifiedOrAdmin(user) && !skipEmailPaths.includes(path)) {
    return <Route exact={exact} path={path}><Redirect to="/verify-otp" /></Route>;
  }

  // Route access blocks
  const skipGuardPaths = ['/approval-pending', '/application-rejected', '/select-role', '/verify-otp', '/apply/vendor', '/apply/rider'];
  if (requireAuth && user && activeRole && !skipGuardPaths.includes(path) && !requiredRole) {
    const redirect = getRoleRedirect(user, activeRole);
    if (redirect) return <Route exact={exact} path={path}><Redirect to={redirect} /></Route>;
  }

  // Role-based route blocking
  if (requireAuth && user) {
    const isVendorRoute = path.startsWith('/vendor/');
    const isRiderRoute = path.startsWith('/rider/');
    const isAdminRoute = path.startsWith('/admin/');

    if (isVendorRoute && user.roleStatus?.vendor !== 'approved') {
      const redirect = getRoleRedirect(user, 'vendor');
      return <Route exact={exact} path={path}><Redirect to={redirect || '/apply/vendor'} /></Route>;
    }
    if (isRiderRoute && user.roleStatus?.rider !== 'approved') {
      const redirect = getRoleRedirect(user, 'rider');
      return <Route exact={exact} path={path}><Redirect to={redirect || '/apply/rider'} /></Route>;
    }
    if (isAdminRoute && !roles.includes('admin')) {
      return <Route exact={exact} path={path}><Redirect to="/" /></Route>;
    }
  }

  return (
    <Route exact={exact} path={path}>
      {requireAuth && !user ? (
        <Redirect to="/login" />
      ) : requiredRole && (
        Array.isArray(requiredRole)
          ? !requiredRole.some(r => roles.includes(r))
          : !roles.includes(requiredRole)
      ) ? (
        <Redirect to={homePath} />
      ) : !requireAuth && user && !(requiredRole && (
        Array.isArray(requiredRole)
          ? requiredRole.some(r => roles.includes(r))
          : roles.includes(requiredRole)
      )) ? (
        <Redirect to={homePath} />
      ) : (
        children
      )}
    </Route>
  );
};

export default ProtectedRoute;
