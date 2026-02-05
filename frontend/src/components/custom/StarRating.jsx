import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StarRating = ({ 
  value = 0, 
  onChange, 
  max = 5, 
  size = 'md',
  readonly = false,
  showLabel = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const priorityLabels = {
    5: 'Máxima',
    4: 'Alta',
    3: 'Normal',
    2: 'Baixa',
    1: 'Muito Baixa'
  };

  const handleClick = (starValue) => {
    if (!readonly && onChange) {
      onChange(starValue);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[...Array(max)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= value;
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(starValue)}
              disabled={readonly}
              className={cn(
                'transition-all duration-200',
                !readonly && 'hover:scale-110 cursor-pointer',
                readonly && 'cursor-default'
              )}
              data-testid={`star-${starValue}`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-colors duration-200',
                  isFilled 
                    ? 'fill-amber-500 text-amber-500' 
                    : 'fill-transparent text-slate-300 hover:text-amber-300'
                )}
              />
            </button>
          );
        })}
      </div>
      {showLabel && value > 0 && (
        <span className="text-sm font-medium text-slate-600">
          {priorityLabels[value] || value}
        </span>
      )}
    </div>
  );
};

export default StarRating;
