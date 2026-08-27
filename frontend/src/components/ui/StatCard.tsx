import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  description,
  icon,
  variant,
  color,
}) => {
  const resolvedVariant = variant || (color === 'brand' ? 'primary' : color === 'emerald' ? 'success' : color === 'amber' ? 'warning' : color === 'rose' ? 'danger' : 'default');

  const variantStyles = {
    primary: 'border-l-4 border-l-brand-600',
    success: 'border-l-4 border-l-emerald-600',
    warning: 'border-l-4 border-l-amber-500',
    danger: 'border-l-4 border-l-rose-600',
    default: 'border-l-4 border-l-slate-400',
  };

  const iconBgStyles = {
    primary: 'bg-brand-50 text-brand-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
    default: 'bg-slate-50 text-slate-600',
  };

  return (
    <div className={`bg-white rounded-xl p-5 border border-slate-200 shadow-sm ${variantStyles[resolvedVariant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
          {(subtitle || description) && (
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle || description}</p>
          )}
        </div>
        {icon && <div className={`p-3 rounded-xl ${iconBgStyles[resolvedVariant]}`}>{icon}</div>}
      </div>
    </div>
  );
};
