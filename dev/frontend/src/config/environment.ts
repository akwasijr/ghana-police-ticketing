// Environment Configuration

export const ENV = {
  // Mode detection
  MODE: import.meta.env.MODE as 'development' | 'production' | 'test',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  
  // Mock data toggle - set VITE_USE_MOCK=false in .env to disable
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK !== 'false',
  
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT ?? 30000),
  
  // Feature flags
  ENABLE_OFFLINE_MODE: import.meta.env.VITE_ENABLE_OFFLINE !== 'false',
  ENABLE_PRINT: import.meta.env.VITE_ENABLE_PRINT !== 'false',
  ENABLE_CAMERA: import.meta.env.VITE_ENABLE_CAMERA !== 'false',
  ENABLE_GPS: import.meta.env.VITE_ENABLE_GPS !== 'false',
  
  // App info
  APP_NAME: 'Ghana Police Ticketing System',
  APP_VERSION: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
};

// Helper to check if we should use mock data
export const shouldUseMock = () => ENV.USE_MOCK_DATA;

// Log configuration in development
if (ENV.IS_DEV) {
  console.log('🔧 Environment Config:', {
    mode: ENV.MODE,
    useMockData: ENV.USE_MOCK_DATA,
    apiUrl: ENV.API_BASE_URL,
  });
}
