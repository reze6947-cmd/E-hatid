import { useEffect, useRef, useState } from 'react';
import { subscribeRiderOrders } from '../services/orderService';
import { updateRiderLocation } from '../services/riderLocationService';
import type { Order } from '../types';

interface UseRiderTrackingResult {
  isTracking: boolean;
  activeOrderId: string | null;
  error: string | null;
  requestPermission: () => void;
}

export const useRiderTracking = (userId: string | undefined): UseRiderTrackingResult => {
  const [isTracking, setIsTracking] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const stopTracking = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setActiveOrderId(null);
    setError(null);
  };

  const requestPermission = () => {
    const uid = userIdRef.current;
    if (!uid) return;

    navigator.geolocation.getCurrentPosition(
      () => {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const now = Date.now();
            if (now - lastUpdateRef.current < 3000) return;
            lastUpdateRef.current = now;
            const oid = activeOrderIdRef.current;
            if (oid && uid) {
              updateRiderLocation(oid, uid, pos.coords.latitude, pos.coords.longitude);
            }
          },
          (err) => {
            console.error('Geolocation watch error:', err);
            if (err.code === err.PERMISSION_DENIED) {
              setError('Location permission denied. Enable GPS in settings.');
            } else if (err.code === err.TIMEOUT) {
              setError('GPS signal timeout. Try moving to an open area.');
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );
        setIsTracking(true);
        setError(null);
      },
      (err) => {
        console.error('Geolocation permission error:', err);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied. Enable GPS in settings.');
        } else {
          setError('GPS unavailable. Check your device location settings.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const activeOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      stopTracking();
      return;
    }

    const unsub = subscribeRiderOrders(userId, (orders: Order[]) => {
      const delivering = orders.find(o => o.status === 'delivering');
      const deliveringId = delivering?.id || null;

      if (!deliveringId) {
        stopTracking();
        return;
      }

      if (deliveringId !== activeOrderIdRef.current) {
        stopTracking();
        activeOrderIdRef.current = deliveringId;
        setActiveOrderId(deliveringId);
        setTimeout(() => requestPermission(), 500);
      }
    });

    return () => {
      unsub();
      stopTracking();
    };
     
  }, [userId]);

  return { isTracking, activeOrderId, error, requestPermission };
};
