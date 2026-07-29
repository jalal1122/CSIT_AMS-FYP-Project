import React from 'react';
import { useSelector } from 'react-redux';
import Toast from './Toast';

const ToastContainer = () => {
  const toasts = useSelector((state) => state.toast.toasts);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
