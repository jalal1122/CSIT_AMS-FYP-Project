import React from 'react';

const Badge = ({ variant = 'neutral', children, className = '' }) => {
  const variants = {
    success: 'bg-emerald-100 text-emerald-700',
    danger: 'bg-rose-100 text-rose-700',
    warning: 'bg-amber-100 text-amber-700',
    info: 'bg-sky-100 text-sky-700',
    neutral: 'bg-slate-100 text-slate-600',
  };

  const selectedVariant = variants[variant] || variants.neutral;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedVariant} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
