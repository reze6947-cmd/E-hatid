import React, { useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { imageOutline, checkmarkCircle } from 'ionicons/icons';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

interface ImageCropperProps {
  source: string;
  onCancel: () => void;
  onApply: (dataUrl: string) => void;
  aspect?: number;
  outputWidth?: number;
  outputHeight?: number;
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const ImageCropper: React.FC<ImageCropperProps> = ({
  source,
  onCancel,
  onApply,
  aspect = 1,
  outputWidth = 300,
  outputHeight = 300,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const applyCrop = async () => {
    if (!croppedAreaPixels) return;
    try {
      const img = await loadImage(source);
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, outputWidth, outputHeight);
      onApply(canvas.toDataURL('image/jpeg', 0.85));
    } catch (err) {
      console.error('Failed to crop image:', err);
    }
  };

  return (
    <div>
      <div className="relative h-64 sm:h-80 md:h-96 lg:h-[420px] bg-black">
        <Cropper
          image={source}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixelCrop) => setCroppedAreaPixels(pixelCrop)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 px-3 sm:px-5 py-2.5 border-b border-[var(--ion-border-color)] bg-[var(--ion-card-background)]">
        <IonIcon icon={imageOutline} className="text-[var(--ion-color-primary)] shrink-0" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          className="flex-1 min-w-[120px] accent-[var(--ion-color-primary)]"
          aria-label="Zoom"
        />
        <IonButton size="small" fill="outline" color="medium" onClick={onCancel} className="shrink-0 min-h-[36px] text-xs m-0">
          Cancel
        </IonButton>
        <button
          onClick={applyCrop}
          className="shrink-0 min-h-[36px] px-4 rounded-full bg-[var(--ion-color-primary)] text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ion-color-primary)] focus-visible:ring-offset-2"
        >
          <IonIcon icon={checkmarkCircle} className="text-sm" />
          Apply
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;
