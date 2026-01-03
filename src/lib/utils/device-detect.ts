// Device Detection Utilities

import { DEVICE_CONFIG, STORAGE_KEYS } from '@/config/constants';
import type { InterfaceMode } from '@/types';

interface DeviceInfo {
  isHandheld: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  platform: string;
  hasCamera: boolean;
  hasBluetooth: boolean;
  hasGeolocation: boolean;
}

/**
 * Detect if the device is likely a handheld/mobile device
 */
export function detectHandheldDevice(): boolean {
  // Check screen width
  const screenWidth = window.innerWidth || document.documentElement.clientWidth;
  if (screenWidth <= DEVICE_CONFIG.HANDHELD_MAX_WIDTH) {
    return true;
  }

  // Check user agent for mobile/handheld indicators
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'mobile', 'handheld', 'iphone', 'ipod'];
  
  for (const keyword of mobileKeywords) {
    if (userAgent.includes(keyword)) {
      return true;
    }
  }

  // Check for touch capability (might indicate tablet/handheld)
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    // But only if screen is small enough
    if (screenWidth <= 768) {
      return true;
    }
  }

  return false;
}

/**
 * Get comprehensive device information
 */
export function getDeviceInfo(): DeviceInfo {
  const screenWidth = window.innerWidth || document.documentElement.clientWidth;
  const screenHeight = window.innerHeight || document.documentElement.clientHeight;
  const userAgent = navigator.userAgent;
  
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android/i.test(userAgent) && screenWidth >= 600 && screenWidth <= 1024;
  const isHandheld = detectHandheldDevice();
  const isDesktop = !isMobile && !isTablet && screenWidth > 1024;

  return {
    isHandheld,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    screenWidth,
    screenHeight,
    userAgent,
    platform: navigator.platform,
    hasCamera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    hasBluetooth: 'bluetooth' in navigator,
    hasGeolocation: 'geolocation' in navigator,
  };
}

/**
 * Get the stored interface mode preference
 */
export function getStoredInterfaceMode(): InterfaceMode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.INTERFACE_MODE);
    if (stored === 'handheld' || stored === 'dashboard') {
      return stored;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Store interface mode preference
 */
export function setStoredInterfaceMode(mode: InterfaceMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INTERFACE_MODE, mode);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Determine the interface mode to use
 * Priority: stored preference > device detection
 */
export function determineInterfaceMode(): InterfaceMode {
  // Check for stored preference first
  const storedMode = getStoredInterfaceMode();
  if (storedMode) {
    return storedMode;
  }

  // Fall back to device detection
  return detectHandheldDevice() ? 'handheld' : 'dashboard';
}

/**
 * Generate a unique device ID for this browser/device
 */
export function getOrCreateDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    
    if (!deviceId) {
      // Generate a UUID-like device ID
      deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    
    return deviceId;
  } catch {
    // If localStorage fails, generate a temporary ID
    return `temp-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }
}

/**
 * Check if Web Bluetooth API is available
 */
export function isBluetoothAvailable(): boolean {
  return 'bluetooth' in navigator;
}

/**
 * Check if the device likely has a camera
 */
export async function checkCameraAvailability(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return false;
    }
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch {
    return false;
  }
}

/**
 * Check if geolocation is available and permitted
 */
export function isGeolocationAvailable(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Check if service workers are supported (for PWA)
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return 'indexedDB' in window;
}

/**
 * Get device orientation
 */
export function getDeviceOrientation(): 'portrait' | 'landscape' {
  if (window.innerHeight > window.innerWidth) {
    return 'portrait';
  }
  return 'landscape';
}

/**
 * Listen for orientation changes
 */
export function onOrientationChange(callback: (orientation: 'portrait' | 'landscape') => void): () => void {
  const handler = () => {
    callback(getDeviceOrientation());
  };
  
  window.addEventListener('resize', handler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handler);
  };
}

/**
 * Check network connectivity
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onConnectivityChange(callback: (isOnline: boolean) => void): () => void {
  const onlineHandler = () => callback(true);
  const offlineHandler = () => callback(false);
  
  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);
  
  return () => {
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  };
}

/**
 * Detect device type - returns 'mobile', 'tablet', or 'desktop'
 */
export function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const info = getDeviceInfo();
  if (info.isMobile || info.isHandheld) return 'mobile';
  if (info.isTablet) return 'tablet';
  return 'desktop';
}
