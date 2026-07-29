import React from 'react';

const EmptyState = ({ icon: Icon, title, subtitle, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
          <Icon size={32} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-500 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-slate-400 mb-6">{subtitle}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
