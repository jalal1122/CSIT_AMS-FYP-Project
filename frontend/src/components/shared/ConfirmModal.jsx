import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, body, variant = 'danger', confirmText = 'Confirm' }) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const iconColor = isDanger ? 'text-rose-500' : 'text-amber-500';
  const iconBg = isDanger ? 'bg-rose-100' : 'bg-amber-100';
  const btnClass = isDanger ? 'btn-danger' : 'btn-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${iconBg} ${iconColor}`}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isDanger ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6">{body}</p>
        
        {isDanger && (
          <p className="text-xs text-rose-600 italic mb-6">This action is irreversible.</p>
        )}
        
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="flex-1 btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className={`flex-1 ${btnClass}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
