// PWA Service Worker Registration & Management

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

// Track if we've prompted for install
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installPromptShown = false;

// Custom event type for install prompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Service worker registration
export async function registerServiceWorker(config: ServiceWorkerConfig = {}): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker registered with scope:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New content available
            console.log('[PWA] New content available, refresh required');
            config.onUpdate?.(registration);
          } else {
            // Content cached for offline
            console.log('[PWA] Content cached for offline use');
            config.onSuccess?.(registration);
          }
        }
      });
    });

    // Listen for controlling service worker changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Service worker controller changed');
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

// Check for service worker updates
export async function checkForUpdates(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Update check failed:', error);
    return false;
  }
}

// Force update to new service worker
export async function skipWaiting(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

// Get service worker version
export async function getServiceWorkerVersion(): Promise<string | null> {
  if (!navigator.serviceWorker.controller) return null;

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      resolve(event.data?.version || null);
    };
    navigator.serviceWorker.controller?.postMessage(
      { type: 'GET_VERSION' },
      [channel.port2]
    );
    // Timeout after 3 seconds
    setTimeout(() => resolve(null), 3000);
  });
}

// Clear service worker caches
export async function clearCaches(): Promise<void> {
  if (!navigator.serviceWorker.controller) return;

  navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
}

// Setup network status listeners
export function setupNetworkListeners(config: ServiceWorkerConfig): () => void {
  const handleOnline = () => {
    console.log('[PWA] Network online');
    config.onOnline?.();
  };

  const handleOffline = () => {
    console.log('[PWA] Network offline');
    config.onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Initial check
  if (!navigator.onLine) {
    config.onOffline?.();
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// PWA Install Prompt Management
export function setupInstallPrompt(onInstallAvailable?: () => void): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] Install prompt available');
    onInstallAvailable?.();
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
    installPromptShown = false;
  });
}

// Check if install prompt is available
export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null && !installPromptShown;
}

// Show install prompt
export async function showInstallPrompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) {
    return 'unavailable';
  }

  installPromptShown = true;

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    deferredPrompt = null;
    return outcome;
  } catch (error) {
    console.error('[PWA] Install prompt failed:', error);
    return 'unavailable';
  }
}

// Check if app is installed (standalone mode)
export function isAppInstalled(): boolean {
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  // Check iOS standalone mode
  if ((navigator as any).standalone === true) {
    return true;
  }
  return false;
}

// Check if should show install prompt (after 2nd visit)
export function shouldShowInstallPrompt(): boolean {
  if (isAppInstalled()) return false;
  if (!isInstallPromptAvailable()) return false;

  const visitCount = parseInt(localStorage.getItem('pwa_visit_count') || '0', 10);
  return visitCount >= 2;
}

// Increment visit count
export function incrementVisitCount(): void {
  const count = parseInt(localStorage.getItem('pwa_visit_count') || '0', 10);
  localStorage.setItem('pwa_visit_count', String(count + 1));
}

// Background Sync Registration
export async function registerBackgroundSync(tag: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.warn('[PWA] Background sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-ignore - sync is not in the type definitions yet
    await registration.sync.register(tag);
    console.log(`[PWA] Background sync registered: ${tag}`);
    return true;
  } catch (error) {
    console.error('[PWA] Background sync registration failed:', error);
    return false;
  }
}

// Register for periodic background sync (if supported)
export async function registerPeriodicSync(tag: string, minInterval: number): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('periodicSync' in ServiceWorkerRegistration.prototype)) {
    console.warn('[PWA] Periodic sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-ignore
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
    
    if (status.state === 'granted') {
      // @ts-ignore
      await registration.periodicSync.register(tag, { minInterval });
      console.log(`[PWA] Periodic sync registered: ${tag}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Periodic sync registration failed:', error);
    return false;
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('[PWA] Notification permission:', permission);
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPush(applicationServerKey: string): Promise<PushSubscription | null> {
  if (!('PushManager' in window)) {
    console.warn('[PWA] Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(applicationServerKey) as any,
    });
    console.log('[PWA] Push subscription successful');
    return subscription;
  } catch (error) {
    console.error('[PWA] Push subscription failed:', error);
    return null;
  }
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Full PWA initialization
export async function initializePWA(config: ServiceWorkerConfig = {}): Promise<void> {
  console.log('[PWA] Initializing...');
  
  // Increment visit count
  incrementVisitCount();
  
  // Register service worker
  await registerServiceWorker(config);
  
  // Setup network listeners
  setupNetworkListeners(config);
  
  // Setup install prompt
  setupInstallPrompt();
  
  // Check if we should show install prompt after delay
  setTimeout(() => {
    if (shouldShowInstallPrompt()) {
      console.log('[PWA] Install prompt available after 2nd visit');
    }
  }, 5000);
  
  console.log('[PWA] Initialization complete');
}
