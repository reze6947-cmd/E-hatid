import React from 'react';

interface SectionCardProps {
  id?: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ id, title, right, children, className, bodyClassName }) => (
  <div
    id={id}
    className={`mb-3 sm:mb-4 rounded-2xl border border-[var(--ion-border-color)] bg-[var(--ion-card-background)] overflow-hidden shadow-sm scroll-mt-14 ${className || ''}`}
  >
    <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-3 border-b border-[var(--ion-border-color)] bg-[var(--ion-background-color)]/50">
      <span className="font-semibold text-sm text-[var(--ion-text-color)]">{title}</span>
      {right}
    </div>
    <div className={`p-3 sm:p-5 ${bodyClassName || ''}`}>
      {children}
    </div>
  </div>
);

export default SectionCard;
