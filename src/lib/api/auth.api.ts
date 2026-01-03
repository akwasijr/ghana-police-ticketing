// Authentication API

import { api } from './client';
import type { LoginRequest, LoginResponse, RefreshTokenResponse } from '@/types/api.types';
import type { User } from '@/types/officer.types';
import { STORAGE_KEYS } from '@/config/constants';

export interface AuthAPI {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<RefreshTokenResponse>;
  getProfile(): Promise<User>;
  updateProfile(data: Partial<User>): Promise<User>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}

export const authAPI: AuthAPI = {
  /**
   * Login with credentials
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    
    // Store tokens and user data
    if (response.tokens) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.tokens.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.tokens.refreshToken);
    }
    
    if (response.user) {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    }
    
    return response;
  },
  
  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  },
  
  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await api.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken,
    });
    
    // Update stored token
    if (response.accessToken) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.accessToken);
    }
    
    return response;
  },
  
  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    return api.get<User>('/auth/profile');
  },
  
  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/auth/profile', data);
    
    // Update stored user data
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response));
    
    return response;
  },
  
  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
  
  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },
  
  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
  },
};

// Helper to get stored user
export function getStoredUser(): User | null {
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

// Helper to check if authenticated
export function isAuthenticated(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}
