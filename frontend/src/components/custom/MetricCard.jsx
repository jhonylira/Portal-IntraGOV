import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MetricCard = ({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
  className
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-slate-500';
  };

  const variantClasses = {
    default: 'bg-white border-slate-200',
    primary: 'bg-teal-50 border-teal-200',
    warning: 'bg-amber-50 border-amber-200',
    success: 'bg-green-50 border-green-200',
    danger: 'bg-red-50 border-red-200'
  };

  return (
    <div 
      className={cn(
        "metric-card rounded-lg border p-6 transition-all duration-200 hover:shadow-md",
        variantClasses[variant],
        className
      )}
      data-testid="metric-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2 bg-slate-100 rounded-lg">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </div>
      
      {(trend || trendValue) && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
          {getTrendIcon()}
          {trendValue && (
            <span className={cn("text-sm font-medium", getTrendColor())}>
              {trendValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
