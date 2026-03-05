import axios from 'axios';
 
let navigateRef = null;
 
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE_URL,
  withCredentials: true,
  timeout: 150000, // ⏱️ Set to 2.5 minutes (in milliseconds)
});
 
// ✅ Set navigate for use in interceptors
export const setNavigate = (navigate) => {
  navigateRef = navigate;
};
 
// ✅ Interceptor for auto-refresh on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
 
    const isRefreshEndpoint = originalRequest.url?.includes('/refresh');
 
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
      originalRequest._retry = true;
 
      try {
        await axiosInstance.post('/refresh'); // 🔁 Get new access token
        return axiosInstance(originalRequest); // 🔁 Retry original request
      } catch (refreshError) {
        console.warn("Refresh failed during 401:", refreshError);
 
        localStorage.clear();
        sessionStorage.clear();
 
        if (navigateRef) {
          navigateRef('/login');
        } else {
          window.location.href = '/login';
        }
      }
    }
 
    return Promise.reject(error);
  }
);

// ✅ Attach JWT token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
 
export default axiosInstance;