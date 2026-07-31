import { useState } from 'react';

export interface ToastOptions {
  message: string;
  buttons?: { text: string; role?: string; handler?: () => void }[];
  duration?: number;
  color?: string;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastOptions | null>(null);

  const showToast = (opts: ToastOptions) => setToast(opts);
  const dismissToast = () => setToast(null);

  return { toast, showToast, dismissToast };
};
