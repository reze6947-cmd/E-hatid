import React from 'react';

const ProductSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="rounded-2xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] shadow-sm overflow-hidden">
        <div className="skeleton-loader aspect-square w-full" />
        <div className="p-3 sm:p-3.5">
          <div className="skeleton-loader h-4 w-3/4 rounded" />
          <div className="skeleton-loader h-3 w-1/2 rounded mt-2" />
          <div className="skeleton-loader h-5 w-1/3 rounded mt-3" />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="skeleton-loader h-11 w-full rounded-xl" />
            <div className="skeleton-loader h-11 w-full rounded-xl" />
          </div>
          <div className="skeleton-loader h-10 w-full rounded-xl mt-2.5" />
        </div>
      </div>
    ))}
  </div>
);

export default ProductSkeleton;
