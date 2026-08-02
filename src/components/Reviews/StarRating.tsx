import React from 'react';
import { IonIcon } from '@ionic/react';
import { star, starOutline } from 'ionicons/icons';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ value, onChange, size = 'text-2xl' }) => (
  <div className="flex justify-center gap-1 mb-3">
    {[1, 2, 3, 4, 5].map(starVal => (
      <button
        key={starVal}
        onClick={() => onChange(starVal)}
        type="button"
        aria-label={`Rate ${starVal} star${starVal > 1 ? 's' : ''}`}
        className="bg-transparent border-none cursor-pointer p-1 transition-transform hover:scale-110"
      >
        <IonIcon
          icon={starVal <= value ? star : starOutline}
          className={size}
          style={{ color: starVal <= value ? '#F59E0B' : 'var(--ion-text-color-secondary)' }}
        />
      </button>
    ))}
  </div>
);

export default StarRating;
