// useAuth hook - Authentication management

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { authAPI } from '@/lib/api/auth.api';
import { useToast } from '@/store/ui.store';
import type { LoginRequest } from '@/types/api.types';
import { detectDeviceType } from '@/lib/utils/device-detect';

export function useAuth() {
  const navigate = useNavigate();
  const { 
    user, 
    tokens, 
    isAuthenticated, 
    isLoading,
    interfaceMode,
    setSession, 
    setLoading, 
    logout: clearAuth,
    setInterfaceMode,
  } = useAuthStore();
  const toast = useToast();

  const login = useCallback(async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authAPI.login(credentials);
      
      if (response.user && response.tokens) {
        const user = response.user as any;
        const tokens = response.tokens as any;
        
        // Determine interface mode based on user role and device
        const deviceType = detectDeviceType();
        const isOfficerRole = user.role === 'officer' || user.role === 'supervisor';
        const mode = deviceType === 'mobile' && isOfficerRole ? 'handheld' : 'dashboard';
        
        setSession({
          user,
          tokens,
          isAuthenticated: true,
          interfaceMode: mode,
        });
        
        toast.success('Login successful', `Welcome back, ${user.fullName}`);
        
        // Navigate to appropriate interface
        navigate(mode === 'handheld' ? '/handheld' : '/dashboard');
        
        return { success: true, user };
      } else {
        throw new Error((response as any).error?.message || 'Login failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error('Login failed', message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [navigate, setSession, setLoading, toast]);

  const logout = useCallback(async () => {
    try {
      // Call logout API (best effort)
      if (tokens?.accessToken) {
        await authAPI.logout().catch(() => {});
      }
    } finally {
      clearAuth();
      toast.info('Signed out', 'You have been logged out successfully');
      navigate('/login');
    }
  }, [clearAuth, tokens, navigate, toast]);

  const refreshToken = useCallback(async () => {
    if (!tokens?.refreshToken) {
      logout();
      return false;
    }
    
    try {
      const response = await authAPI.refreshToken(tokens.refreshToken);
      const newTokens = (response as any).tokens;
      
      if (newTokens) {
        useAuthStore.getState().setTokens(newTokens);
        return true;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      logout();
      return false;
    }
  }, [tokens, logout]);

  const checkAuth = useCallback(async () => {
    if (!tokens?.accessToken) {
      setLoading(false);
      return false;
    }
    
    setLoading(true);
    try {
      const user = await authAPI.getProfile();
      
      if (user) {
        useAuthStore.getState().setUser(user);
        return true;
      }
      
      // Try refreshing token
      return await refreshToken();
    } catch (error) {
      return await refreshToken();
    } finally {
      setLoading(false);
    }
  }, [tokens, setLoading, refreshToken]);

  const switchInterface = useCallback((mode: 'handheld' | 'dashboard') => {
    setInterfaceMode(mode);
    navigate(mode === 'handheld' ? '/handheld' : '/dashboard');
    toast.info('Interface switched', `Now using ${mode} interface`);
  }, [setInterfaceMode, navigate, toast]);

  return {
    user,
    isAuthenticated,
    isLoading,
    interfaceMode,
    login,
    logout,
    refreshToken,
    checkAuth,
    switchInterface,
  };
}
