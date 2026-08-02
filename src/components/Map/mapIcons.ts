import L from 'leaflet';

export const markerIcon = L.divIcon({
  className: '',
  html: '<div style="background:var(--ion-color-primary);width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const stallMarkerIcon = L.divIcon({
  className: '',
  html: '<div style="background:#8B5CF6;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">🏪</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export const riderMarkerIcon = L.divIcon({
  className: '',
  html: '<div style="background:#6D28D9;width:30px;height:30px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">🛵</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export const profileMarkerIcon = L.divIcon({
  className: '',
  html: '<div style="background:var(--ion-color-primary);width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});
