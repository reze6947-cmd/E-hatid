export function formatOrderCode(orderId: string | undefined): string {
  if (!orderId) return '#------';
  return `#${orderId.slice(-6).toUpperCase()}`;
}

export function toDate(value: unknown): Date | null {
  if (!value) return null;
  try {
    const maybeTs = value as { toDate?: () => Date };
    if (typeof maybeTs.toDate === 'function') {
      const d = maybeTs.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    const d = typeof value === 'string' || value instanceof Date
      ? new Date(value)
      : new Date(Number(value));
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function formatOrderDate(value: unknown): string {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatOrderDateTime(value: unknown): string {
  const d = toDate(value);
  if (!d) return '';
  const date = d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}
