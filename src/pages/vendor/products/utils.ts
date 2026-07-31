import { MenuItem } from '../../../types';

export const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const sanitizeMoney = (raw: string): number => {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const dot = cleaned.indexOf('.');
  const valid = dot === -1 ? cleaned : cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
  return isNaN(parseFloat(valid)) ? 0 : parseFloat(valid);
};

export const formatPrice = (value: number) => `₱${(value || 0).toFixed(2)}`;

export const MAX_IMAGE_SIZE_MB = 8;

export const isImageFile = (file: File): boolean =>
  file.type.startsWith('image/');

export const isImageTooLarge = (file: File): boolean =>
  file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024;

export const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });

export const createProduct = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  id: id('item'),
  name: '',
  price: 0,
  category: '',
  available: true,
  stallId: '',
  popular: false,
  description: '',
  options: [],
  addOns: [],
  ...overrides,
});

export const createCopy = (item: MenuItem): MenuItem => ({
  ...item,
  id: id('item'),
  name: item.name ? `Copy of ${item.name}` : 'Untitled copy',
});
