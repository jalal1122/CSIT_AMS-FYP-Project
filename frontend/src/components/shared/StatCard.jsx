import React from 'react';

const StatCard = ({ title, value, gradient, className = '' }) => {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg hover:-translate-y-0.5 transition-transform duration-300 relative overflow-hidden group ${className}`}>
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500" />
      <h3 className="text-white/80 text-xs uppercase tracking-wider font-semibold relative z-10">
        {title}
      </h3>
      <p className="text-3xl sm:text-4xl font-extrabold mt-2 tracking-tight relative z-10">
        {value}
      </p>
    </div>
  );
};

export default StatCard;
