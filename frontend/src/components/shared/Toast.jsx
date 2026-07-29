import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { removeToast } from '../../store/slices/toastSlice';

const Toast = ({ toast }) => {
  const dispatch = useDispatch();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - (100 / (toast.duration / 100))));
    }, 100);

    const closeTimer = setTimeout(() => {
      dispatch(removeToast(toast.id));
    }, toast.duration);

    return () => {
      clearInterval(timer);
      clearTimeout(closeTimer);
    };
  }, [dispatch, toast]);

  const variants = {
    success: 'border-l-4 border-emerald-500',
    error: 'border-l-4 border-rose-500',
    warning: 'border-l-4 border-amber-500',
    info: 'border-l-4 border-sky-500',
  };

  const progressColors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
  };

  return (
    <div className={`relative bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden mb-3 animate-in slide-in-from-right-full fade-in duration-300 ${variants[toast.type] || variants.info}`}>
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1">
          {toast.title && <h4 className="text-sm font-bold text-slate-900">{toast.title}</h4>}
          <p className="text-sm text-slate-500 mt-1">{toast.message}</p>
        </div>
        <button onClick={() => dispatch(removeToast(toast.id))} className="text-slate-400 hover:text-slate-600">
          ✕
        </button>
      </div>
      <div className="h-1 bg-slate-100 w-full absolute bottom-0 left-0">
        <div 
          className={`h-full ${progressColors[toast.type] || progressColors.info} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Toast;
