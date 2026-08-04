import { useState, useEffect } from 'react';
import { subscribeRiderOrders } from '../services/orderService';
import type { Order } from '../types';

export interface EarningsData {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  todayTrips: number;
  weekTrips: number;
  monthTrips: number;
  averagePerTrip: number;
  weeklyBreakdown: { day: string; amount: number; trips: number }[];
}

const getDayLabel = (date: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

const isSameDay = (a: Date, b: Date): boolean => a.toDateString() === b.toDateString();

const isSameWeek = (a: Date, b: Date): boolean => {
  const startOfWeek = (d: Date) => {
    const s = new Date(d);
    s.setDate(s.getDate() - s.getDay());
    s.setHours(0, 0, 0, 0);
    return s;
  };
  return startOfWeek(a).getTime() === startOfWeek(b).getTime();
};

const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const useRiderEarnings = (userId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData>({
    todayTotal: 0,
    weekTotal: 0,
    monthTotal: 0,
    todayTrips: 0,
    weekTrips: 0,
    monthTrips: 0,
    averagePerTrip: 0,
    weeklyBreakdown: [],
  });

  useEffect(() => {
    if (!userId) return;

    const unsub = subscribeRiderOrders(userId, (orders: Order[]) => {
      setLoading(false);
      const now = new Date();
      const delivered = orders.filter(o => o.status === 'delivered');

      const todayOrders = delivered.filter(o => isSameDay(new Date(o.completedAt || o.createdAt), now));
      const weekOrders = delivered.filter(o => isSameWeek(new Date(o.completedAt || o.createdAt), now));
      const monthOrders = delivered.filter(o => isSameMonth(new Date(o.completedAt || o.createdAt), now));

      const todayTotal = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const weekTotal = weekOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const monthTotal = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      const todayTrips = todayOrders.length;
      const weekTrips = weekOrders.length;
      const monthTrips = monthOrders.length;
      const averagePerTrip = monthTrips > 0 ? monthTotal / monthTrips : 0;

      // Weekly breakdown for current week
      const weeklyBreakdown: { day: string; amount: number; trips: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - (now.getDay() - i));
        const dayOrders = weekOrders.filter(o =>
          isSameDay(new Date(o.completedAt || o.createdAt), d)
        );
        weeklyBreakdown.push({
          day: getDayLabel(d),
          amount: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
          trips: dayOrders.length,
        });
      }

      setEarnings({ todayTotal, weekTotal, monthTotal, todayTrips, weekTrips, monthTrips, averagePerTrip, weeklyBreakdown });
    }, () => {
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  return { ...earnings, loading };
};
