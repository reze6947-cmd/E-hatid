import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import MasterAdminSync from './components/MasterAdminSync';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { NotificationProvider } from './context/NotificationContext';
import 'leaflet/dist/leaflet.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <MasterAdminSync />
        <NotificationProvider>
          <CartProvider>
            <OrderProvider>
              <App />
            </OrderProvider>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
