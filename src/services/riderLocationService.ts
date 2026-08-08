import { db } from '../firebaseConfig';
import { doc, setDoc, onSnapshot, serverTimestamp, Unsubscribe } from 'firebase/firestore';
import type { RiderLocation, FirestoreTimestamp } from '../types';

interface RiderLocationSnapshot {
  lat: number;
  lng: number;
  riderId: string;
  updatedAt?: { toDate?: () => Date };
}

export const updateRiderLocation = async (
  orderId: string,
  riderId: string,
  lat: number,
  lng: number
): Promise<void> => {
  try {
    await setDoc(doc(db, 'riderLocation', orderId), {
      lat,
      lng,
      riderId,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to update rider location:', err);
  }
};

export const subscribeRiderLocation = (
  orderId: string,
  callback: (location: RiderLocation | null) => void
): Unsubscribe => {
  const ref = doc(db, 'riderLocation', orderId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as RiderLocationSnapshot;
      callback({
        lat: data.lat,
        lng: data.lng,
        riderId: data.riderId,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt as FirestoreTimestamp | undefined,
      });
    } else {
      callback(null);
    }
  }, () => {
    callback(null);
  });
};

export const deleteRiderLocation = async (orderId: string): Promise<void> => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'riderLocation', orderId));
  } catch (err) {
    console.error('Failed to delete rider location:', err);
  }
};
