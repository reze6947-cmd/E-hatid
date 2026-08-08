import React from 'react';

export interface OptimizedImageProps {
  src?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain';
  priority?: boolean;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  aspectRatio,
  objectFit = 'cover',
  priority = false,
  onError,
}) => {
  if (!src) return null;
  const style: React.CSSProperties = { objectFit };
  if (aspectRatio) style.aspectRatio = aspectRatio;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      style={style}
      onError={onError}
    />
  );
};

export default OptimizedImage;
