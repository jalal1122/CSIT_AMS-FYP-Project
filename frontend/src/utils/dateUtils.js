export const formatPKTDate = (dateStr, options = {}) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', ...options });
};

export const formatPKTTime = (dateStr, options = {}) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', ...options });
};

export const formatPKTDateTime = (dateStr, options = {}) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString('en-US', { timeZone: 'Asia/Karachi', ...options });
};
