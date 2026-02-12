// API Client with Axios

import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '@/config/constants';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get auth token from storage
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add device ID for tracking
    const deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (deviceId && config.headers) {
      config.headers['X-Device-ID'] = deviceId;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (refreshToken) {
          // Attempt to refresh the token
          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          
          // Store new token
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
          
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        
        // Dispatch event for auth state to handle
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'session_expired' } }));
        
        return Promise.reject(refreshError);
      }
    }
    
    // Transform error for consistent handling
    const apiError = {
      status: error.response?.status,
      code: (error.response?.data as { error?: { code?: string } })?.error?.code || 'UNKNOWN_ERROR',
      message: (error.response?.data as { error?: { message?: string } })?.error?.message || error.message || 'An unexpected error occurred',
      details: (error.response?.data as { error?: { details?: unknown } })?.error?.details,
      originalError: error,
    };
    
    return Promise.reject(apiError);
  }
);

// Helper types
export interface ApiError {
  status?: number;
  code: string;
  message: string;
  details?: unknown;
  originalError?: AxiosError;
}

// Export the client
export { apiClient };

// Export convenience methods
export const api = {
  get: <T>(url: string, config?: object) => 
    apiClient.get<T>(url, config).then(res => res.data),
    
  post: <T>(url: string, data?: unknown, config?: object) => 
    apiClient.post<T>(url, data, config).then(res => res.data),
    
  put: <T>(url: string, data?: unknown, config?: object) => 
    apiClient.put<T>(url, data, config).then(res => res.data),
    
  patch: <T>(url: string, data?: unknown, config?: object) => 
    apiClient.patch<T>(url, data, config).then(res => res.data),
    
  delete: <T>(url: string, config?: object) => 
    apiClient.delete<T>(url, config).then(res => res.data),
};

// Check if error is an API error
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

// Get error message from any error type
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}
