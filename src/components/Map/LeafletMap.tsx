import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { Map as LeafletMapInstance } from 'leaflet';

export interface LeafletMapHandle {
  invalidateSize: () => void;
  getMap: () => LeafletMapInstance | null;
}

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  zoomControl?: boolean;
  dragging?: boolean;
  scrollWheelZoom?: boolean;
  touchZoom?: boolean;
  doubleClickZoom?: boolean;
  tileUrl?: string;
  attribution?: string;
  children?: ReactNode;
  fitBounds?: [number, number][];
}

class MapErrorBoundary extends React.Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) return this.props.fallback || null;
    return this.props.children;
  }
}

function InvalidateOnMount({ onReady }: { onReady: (map: LeafletMapInstance) => void }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  useEffect(() => { onReady(map); }, [map, onReady]);
  return null;
}

function FitBounds({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);
  return null;
}

function SetViewOnCenterChange({ center }: { center: [number, number] }) {
  const map = useMap();
  const lastRef = useRef(center);
  useEffect(() => {
    const [lat, lng] = center;
    const [prevLat, prevLng] = lastRef.current;
    lastRef.current = center;
    if (lat !== prevLat || lng !== prevLng) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [map, center]);
  return null;
}

function LeafletMapInner({ ref, ...props }: LeafletMapProps & { ref?: React.Ref<LeafletMapHandle> }) {
  const {
    center,
    zoom = 15,
    className,
    style,
    zoomControl = false,
    dragging = true,
    scrollWheelZoom = true,
    touchZoom = true,
    doubleClickZoom = true,
    tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    children,
    fitBounds,
  } = props;

  const [map, setMap] = useState<LeafletMapInstance | null>(null);
  const [hmrKey, setHmrKey] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHmrKey(k => k + 1);
  }, []);

  const handleMapReady = useCallback((m: LeafletMapInstance) => {
    setMap(m);
  }, []);

  useImperativeHandle(ref, () => ({
    invalidateSize: () => { map?.invalidateSize(); },
    getMap: () => map,
  }), [map]);

  useEffect(() => {
    if (!map || !containerRef.current) return;
    const container = containerRef.current;
    const observer = new ResizeObserver(() => { map.invalidateSize(); });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', isolation: 'isolate', ...style }}>
      <MapContainer
        key={hmrKey}
        center={center}
        zoom={zoom}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
        zoomControl={zoomControl}
        dragging={dragging}
        scrollWheelZoom={scrollWheelZoom}
        touchZoom={touchZoom}
        doubleClickZoom={doubleClickZoom}
      >
        <TileLayer attribution={attribution} url={tileUrl} />
        <InvalidateOnMount onReady={handleMapReady} />
        <SetViewOnCenterChange center={center} />
        {fitBounds && <FitBounds bounds={fitBounds} />}
        {children}
      </MapContainer>
    </div>
  );
}

const LeafletMap = forwardRef<LeafletMapHandle, LeafletMapProps>((props, ref) => {
  return (
    <MapErrorBoundary fallback={null}>
      <LeafletMapInner ref={ref} {...props} />
    </MapErrorBoundary>
  );
});

LeafletMap.displayName = 'LeafletMap';

export default LeafletMap;
