import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, addDoc, limit } from 'firebase/firestore';
import { Review } from '../types';

export const createReview = async (data: {
  stallId: string;
  userId: string;
  orderId?: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<void> => {
  try {
    await addDoc(collection(db, 'reviews'), {
      ...data,
      date: new Date().toISOString(),
      likes: 0,
    });
    console.log('Review created');
  } catch (err) {
    console.error('Error creating review:', err);
    throw err;
  }
};

export const createRiderReview = async (data: {
  riderId: string;
  userId: string;
  orderId?: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<void> => {
  try {
    await addDoc(collection(db, 'riderReviews'), {
      ...data,
      date: new Date().toISOString(),
    });
    console.log('Rider review created');
  } catch (err) {
    console.error('Error creating rider review:', err);
    throw err;
  }
};

export const fetchReviewsByStall = async (stallId: string): Promise<Review[]> => {
  try {
    const q = query(collection(db, 'reviews'), where('stallId', '==', stallId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review));
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return [];
  }
};

export const hasReviewedOrder = async (orderId: string): Promise<boolean> => {
  if (!orderId) return false;
  try {
    const q = query(collection(db, 'reviews'), where('orderId', '==', orderId), limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (err) {
    console.error('Error checking review:', err);
    return false;
  }
};

export const getReviewStats = async (stallId: string) => {
  try {
    const reviews = await fetchReviewsByStall(stallId);
    const total = reviews.length;
    if (total === 0) return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[5 - r.rating]++; });
    return { average: Math.round((sum / total) * 10) / 10, total, distribution: dist };
  } catch (err) {
    console.error('Error computing review stats:', err);
    return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
  }
};
