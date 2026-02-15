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
          
          const envelope = response.data as { data?: { accessToken?: string }; accessToken?: string };
          const accessToken = envelope?.data?.accessToken || envelope?.accessToken;

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

// Unwrap the backend response envelope {success, data, ...} → data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap<T>(body: any): T {
  // If body has a `data` field and `success` field, it's our standard envelope
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return body.data as T;
  }
  // For message-only responses or non-envelope responses, return as-is
  return body as T;
}

// Export convenience methods (auto-unwrap backend envelope)
export const api = {
  get: <T>(url: string, config?: object) =>
    apiClient.get(url, config).then(res => unwrap<T>(res.data)),

  post: <T>(url: string, data?: unknown, config?: object) =>
    apiClient.post(url, data, config).then(res => unwrap<T>(res.data)),

  put: <T>(url: string, data?: unknown, config?: object) =>
    apiClient.put(url, data, config).then(res => unwrap<T>(res.data)),

  patch: <T>(url: string, data?: unknown, config?: object) =>
    apiClient.patch(url, data, config).then(res => unwrap<T>(res.data)),

  delete: <T>(url: string, config?: object) =>
    apiClient.delete(url, config).then(res => unwrap<T>(res.data)),
};

// Raw API methods that return the full envelope (for paginated responses)
export const apiRaw = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: <T = any>(url: string, config?: object) =>
    apiClient.get<T>(url, config).then(res => res.data),
};

// Helper for paginated API calls - extracts {items, pagination} from backend envelope
export async function apiPaginated<T>(url: string, config?: object): Promise<{items: T[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean }}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envelope = await apiRaw.get<any>(url, config);
  return { items: envelope.data || [], pagination: envelope.pagination };
}

// Helper to build query params from filters and pagination
export function buildParams(
  filters?: Record<string, unknown>,
  pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string; search?: string }
): string {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, String(value));
        }
      }
    });
  }
  if (pagination) {
    if (pagination.page) params.append('page', String(pagination.page));
    if (pagination.limit) params.append('limit', String(pagination.limit));
    if (pagination.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder);
    if (pagination.search) params.append('search', pagination.search);
  }
  return params.toString();
}

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
