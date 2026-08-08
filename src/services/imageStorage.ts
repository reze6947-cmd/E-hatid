import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const DATA_URL_PREFIX = 'data:image/';

export const isDataUrlImage = (value: string): boolean =>
  value.startsWith(DATA_URL_PREFIX);

export const isHttpUrl = (value: string): boolean =>
  /^https?:\/\//i.test(value);

const mimeToExt: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  const meta = comma > -1 ? dataUrl.slice(0, comma) : '';
  const base64 = comma > -1 ? dataUrl.slice(comma + 1) : dataUrl;
  const mime = meta.match(/data:([^;]+);/)?.[1] || 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Upload a base64 data-URL image to Firebase Storage and return the public
 * download URL. `storagePath` may include a file name; if not, the extension
 * is derived from the image MIME type.
 */
export async function uploadImageDataUrl(dataUrl: string, storagePath: string): Promise<string> {
  const blob = dataUrlToBlob(dataUrl);
  const mime = blob.type || 'image/png';
  const extension = mimeToExt[mime] || 'jpg';
  const finalPath = storagePath.includes('.') ? storagePath : `${storagePath}.${extension}`;
  const storageRef = ref(storage, finalPath);
  await uploadBytes(storageRef, blob, { contentType: mime });
  return getDownloadURL(storageRef);
}

/**
 * Normalize an image value for persistence: if it is still a base64 data URL,
 * upload it to Storage at `storagePath` and return the URL; otherwise return it
 * unchanged (already a download URL, gs:// path, or empty).
 */
export async function persistImage(value: string, storagePath: string): Promise<string> {
  if (!value) return value;
  if (isHttpUrl(value) || value.startsWith('gs://')) return value;
  if (isDataUrlImage(value)) return uploadImageDataUrl(value, storagePath);
  return value;
}
