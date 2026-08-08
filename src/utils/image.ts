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
