// API Configuration utility
// Centralized API URL management for all API calls

export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3030';
};

export const apiCall = (path, options = {}) => {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}${path}`;
  return fetch(url, options);
};
