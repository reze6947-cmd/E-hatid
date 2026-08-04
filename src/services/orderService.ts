import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Order } from '../types';

function convertTimestamps<T>(data: any): T {
  for (const key of Object.keys(data)) {
    if (data[key] && typeof data[key]?.toDate === 'function') {
      data[key] = data[key].toDate();
    }
  }
  return data as T;
}

export const createOrder = async (orderData: Omit<Order, 'id'>): Promise<Order | null> => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), orderData);
    return { id: docRef.id, ...orderData };
  } catch (err) {
    console.error('Error creating order:', err);
    return null;
  }
};

export const updateOrderStatus = async (orderId: string, data: Partial<Order>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'orders', orderId), data);
  } catch (err) {
    console.error('Error updating order:', err);
  }
};

export const fetchOrdersByVendor = async (vendorId: string): Promise<Order[]> => {
  try {
    const snapshot = await getDocs(query(
      collection(db, 'orders'),
      where('vendorId', '==', vendorId)
    ));
    const orders = snapshot.docs.map(d => {
      const data = convertTimestamps<Order>(d.data());
      return { ...data, id: d.id };
    });
    return orders.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    return [];
  }
};

export const subscribeVendorOrders = (vendorId: string, callback: (orders: Order[]) => void, onError?: (err: Error) => void): Unsubscribe => {
  const q = query(collection(db, 'orders'), where('vendorId', '==', vendorId));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => {
      const data = convertTimestamps<Order>(d.data());
      return { ...data, id: d.id };
    });
    orders.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    callback(orders);
  }, (err) => {
    console.error('subscribeVendorOrders error:', err);
    if (onError) onError(err);
    else callback([]);
  });
};

export const fetchOrdersToday = async (vendorId: string): Promise<Order[]> => {
  try {
    const orders = await fetchOrdersByVendor(vendorId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= today;
    });
  } catch (err) {
    console.error('Error fetching today orders:', err);
    return [];
  }
};

export const subscribeAvailableOrders = (callback: (orders: Order[]) => void, onError?: (err: Error) => void): Unsubscribe => {
  const q = query(collection(db, 'orders'), where('status', '==', 'ready'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => {
      const data = convertTimestamps<Order>(d.data());
      return { ...data, id: d.id };
    });
    callback(orders.filter(o => !o.riderId));
  }, (err) => {
    console.error('subscribeAvailableOrders error:', err);
    if (onError) onError(err);
    else callback([]);
  });
};

export const subscribeRiderOrders = (riderId: string, callback: (orders: Order[]) => void, onError?: (err: Error) => void): Unsubscribe => {
  const q = query(collection(db, 'orders'), where('riderId', '==', riderId));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => {
      const data = convertTimestamps<Order>(d.data());
      return { ...data, id: d.id };
    });
    orders.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    callback(orders);
  }, (err) => {
    console.error('subscribeRiderOrders error:', err);
    if (onError) onError(err);
    else callback([]);
  });
};

export const subscribeCustomerOrders = (userId: string, callback: (orders: Order[]) => void, onError?: (err: Error) => void): Unsubscribe => {
  const q = query(collection(db, 'orders'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(d => {
      const data = convertTimestamps<Order>(d.data());
      return { ...data, id: d.id };
    });
    orders.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    callback(orders);
  }, (err) => {
    console.error('subscribeCustomerOrders error:', err);
    if (onError) onError(err);
    else callback([]);
  });
};

export const getEarningsStats = async (vendorId: string) => {
  try {
    const orders = await fetchOrdersByVendor(vendorId);
    const delivered = orders.filter(o => o.status === 'delivered');
    const totalRevenue = delivered.reduce((sum, o) => sum + o.total, 0);
    const thisMonth = delivered.filter(o => {
      const d = new Date(o.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const thisMonthRevenue = thisMonth.reduce((sum, o) => sum + o.total, 0);
    const pendingPayout = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0);
    const uniqueCustomers = new Set(delivered.map(o => o.userId)).size;
    const ordersToday = delivered.filter(o => {
      const d = new Date(o.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;
    return { totalRevenue, thisMonthRevenue, pendingPayout, totalCustomers: uniqueCustomers, ordersToday };
  } catch (err) {
    console.error('Error computing earnings:', err);
    return { totalRevenue: 0, thisMonthRevenue: 0, pendingPayout: 0, totalCustomers: 0, ordersToday: 0 };
  }
};
