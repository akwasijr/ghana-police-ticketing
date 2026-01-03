// Application Constants

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Application Settings
export const APP_CONFIG = {
  APP_NAME: 'Ghana Police Traffic Ticketing',
  APP_SHORT_NAME: 'GPS Ticketing',
  VERSION: '1.0.0',
  ORGANIZATION: 'Ghana Police Service',
} as const;

// Ticket Configuration
export const TICKET_CONFIG = {
  PREFIX: 'GPS',
  ID_LENGTH: 12,
  PAYMENT_GRACE_DAYS: 14,
  OBJECTION_DEADLINE_DAYS: 7,
  PHOTO_MAX_COUNT: 4,
  PHOTO_MAX_SIZE_MB: 5,
} as const;

// Vehicle Registration Patterns (Ghana)
export const VEHICLE_PATTERNS = {
  // Standard Ghana format: GR-1234-20 or AS 5678 21
  STANDARD: /^[A-Z]{2}[-\s]?\d{4}[-\s]?\d{2}$/,
  // Government vehicles: GV-1234-20
  GOVERNMENT: /^GV[-\s]?\d{4}[-\s]?\d{2}$/,
  // Diplomatic: CD-123-00
  DIPLOMATIC: /^CD[-\s]?\d{3}[-\s]?\d{2}$/,
  // Commercial: GT-1234-20
  COMMERCIAL: /^G[TNRC][-\s]?\d{4}[-\s]?\d{2}$/,
} as const;

// Ghana Phone Number Pattern
export const PHONE_PATTERNS = {
  // Ghana mobile: +233 XX XXX XXXX or 0XX XXX XXXX
  GHANA_MOBILE: /^(\+233|0)[235]\d{8}$/,
  // Formats for display
  DISPLAY_FORMAT: '+233 XX XXX XXXX',
} as const;

// Currency Configuration
export const CURRENCY_CONFIG = {
  CODE: 'GHS',
  SYMBOL: 'GH₵',
  LOCALE: 'en-GH',
  DECIMAL_PLACES: 2,
} as const;

// Date/Time Configuration
export const DATE_CONFIG = {
  TIMEZONE: 'Africa/Accra',
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
  API_DATE_FORMAT: 'YYYY-MM-DD',
  API_DATETIME_FORMAT: 'YYYY-MM-DDTHH:mm:ss',
} as const;

// Traffic Offence Categories
export const OFFENCE_CATEGORIES = {
  SPEEDING: {
    id: 'speeding',
    name: 'Speeding',
    description: 'Exceeding speed limits',
    icon: 'Gauge',
  },
  PARKING: {
    id: 'parking',
    name: 'Illegal Parking',
    description: 'Parking in restricted areas',
    icon: 'ParkingCircleOff',
  },
  SIGNAL: {
    id: 'signal',
    name: 'Traffic Signal Violation',
    description: 'Running red lights or ignoring signals',
    icon: 'AlertTriangle',
  },
  DOCUMENTATION: {
    id: 'documentation',
    name: 'Documentation',
    description: 'Missing or invalid documents',
    icon: 'FileX',
  },
  SAFETY: {
    id: 'safety',
    name: 'Safety Violation',
    description: 'Seatbelt, helmet, or safety violations',
    icon: 'Shield',
  },
  RECKLESS: {
    id: 'reckless',
    name: 'Reckless Driving',
    description: 'Dangerous or careless driving',
    icon: 'Car',
  },
  OBSTRUCTION: {
    id: 'obstruction',
    name: 'Traffic Obstruction',
    description: 'Blocking traffic or roads',
    icon: 'OctagonX',
  },
  OTHER: {
    id: 'other',
    name: 'Other Violations',
    description: 'Other traffic violations',
    icon: 'FileText',
  },
} as const;

// Specific Offences with Fines (Ghana Traffic Regulations)
export const OFFENCES = [
  // Speeding
  { id: 'SPD001', category: 'speeding', name: 'Exceeding speed limit by 1-10 km/h', fine: 150 },
  { id: 'SPD002', category: 'speeding', name: 'Exceeding speed limit by 11-20 km/h', fine: 300 },
  { id: 'SPD003', category: 'speeding', name: 'Exceeding speed limit by 21-30 km/h', fine: 500 },
  { id: 'SPD004', category: 'speeding', name: 'Exceeding speed limit by over 30 km/h', fine: 1000 },
  
  // Parking
  { id: 'PRK001', category: 'parking', name: 'Parking in no-parking zone', fine: 200 },
  { id: 'PRK002', category: 'parking', name: 'Double parking', fine: 150 },
  { id: 'PRK003', category: 'parking', name: 'Parking on pedestrian crossing', fine: 300 },
  { id: 'PRK004', category: 'parking', name: 'Parking blocking driveway', fine: 200 },
  
  // Traffic Signals
  { id: 'SIG001', category: 'signal', name: 'Running red light', fine: 500 },
  { id: 'SIG002', category: 'signal', name: 'Ignoring stop sign', fine: 400 },
  { id: 'SIG003', category: 'signal', name: 'Disobeying traffic officer', fine: 600 },
  { id: 'SIG004', category: 'signal', name: 'Wrong lane usage', fine: 250 },
  
  // Documentation
  { id: 'DOC001', category: 'documentation', name: 'Driving without license', fine: 500 },
  { id: 'DOC002', category: 'documentation', name: 'Expired vehicle registration', fine: 400 },
  { id: 'DOC003', category: 'documentation', name: 'No insurance certificate', fine: 500 },
  { id: 'DOC004', category: 'documentation', name: 'No roadworthy certificate', fine: 400 },
  
  // Safety
  { id: 'SAF001', category: 'safety', name: 'Not wearing seatbelt', fine: 200 },
  { id: 'SAF002', category: 'safety', name: 'Motorcycle without helmet', fine: 300 },
  { id: 'SAF003', category: 'safety', name: 'Using phone while driving', fine: 400 },
  { id: 'SAF004', category: 'safety', name: 'Overloading vehicle', fine: 500 },
  
  // Reckless Driving
  { id: 'RKL001', category: 'reckless', name: 'Reckless driving', fine: 800 },
  { id: 'RKL002', category: 'reckless', name: 'Drunk driving', fine: 1500 },
  { id: 'RKL003', category: 'reckless', name: 'Dangerous overtaking', fine: 500 },
  { id: 'RKL004', category: 'reckless', name: 'Racing on public roads', fine: 1000 },
  
  // Obstruction
  { id: 'OBS001', category: 'obstruction', name: 'Blocking traffic', fine: 300 },
  { id: 'OBS002', category: 'obstruction', name: 'Unauthorized road closure', fine: 500 },
  
  // Other
  { id: 'OTH001', category: 'other', name: 'Tinted windows (excessive)', fine: 300 },
  { id: 'OTH002', category: 'other', name: 'Modified exhaust (excessive noise)', fine: 250 },
  { id: 'OTH003', category: 'other', name: 'Defective lights', fine: 200 },
  { id: 'OTH004', category: 'other', name: 'Other traffic violation', fine: 200 },
] as const;

// Vehicle Types
export const VEHICLE_TYPES = [
  'Saloon Car',
  'SUV/4x4',
  'Pickup Truck',
  'Bus',
  'Minibus (Trotro)',
  'Motorcycle',
  'Tricycle (Aboboyaa)',
  'Commercial Truck',
  'Taxi',
  'Other',
] as const;

// Ghana Regions
export const GHANA_REGIONS = [
  { id: 'GAR', name: 'Greater Accra Region', capital: 'Accra' },
  { id: 'ASH', name: 'Ashanti Region', capital: 'Kumasi' },
  { id: 'WES', name: 'Western Region', capital: 'Sekondi-Takoradi' },
  { id: 'EAS', name: 'Eastern Region', capital: 'Koforidua' },
  { id: 'CEN', name: 'Central Region', capital: 'Cape Coast' },
  { id: 'NOR', name: 'Northern Region', capital: 'Tamale' },
  { id: 'VOL', name: 'Volta Region', capital: 'Ho' },
  { id: 'BAR', name: 'Brong Ahafo Region', capital: 'Sunyani' },
  { id: 'UPE', name: 'Upper East Region', capital: 'Bolgatanga' },
  { id: 'UPW', name: 'Upper West Region', capital: 'Wa' },
  { id: 'WNO', name: 'Western North Region', capital: 'Sefwi Wiawso' },
  { id: 'AHA', name: 'Ahafo Region', capital: 'Goaso' },
  { id: 'BON', name: 'Bono Region', capital: 'Sunyani' },
  { id: 'BOE', name: 'Bono East Region', capital: 'Techiman' },
  { id: 'OTI', name: 'Oti Region', capital: 'Dambai' },
  { id: 'SAV', name: 'Savannah Region', capital: 'Damongo' },
  { id: 'NEA', name: 'North East Region', capital: 'Nalerigu' },
] as const;

// Payment Methods
export const PAYMENT_METHODS = [
  { id: 'momo', name: 'Mobile Money (MTN)', icon: 'Smartphone' },
  { id: 'vodacash', name: 'Vodafone Cash', icon: 'Smartphone' },
  { id: 'airteltigo', name: 'AirtelTigo Money', icon: 'Smartphone' },
  { id: 'bank', name: 'Bank Transfer', icon: 'Building' },
  { id: 'card', name: 'Debit/Credit Card', icon: 'CreditCard' },
  { id: 'cash', name: 'Cash (At Station)', icon: 'Banknote' },
] as const;

// Sync Configuration
export const SYNC_CONFIG = {
  AUTO_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  BATCH_SIZE: 50,
  MAX_RETRY_ATTEMPTS: 5,
  CONFLICT_RESOLUTION: 'server-wins' as const,
} as const;

// IndexedDB Configuration
export const DB_CONFIG = {
  NAME: 'ghana_police_ticketing',
  VERSION: 1,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'gps_auth_token',
  REFRESH_TOKEN: 'gps_refresh_token',
  USER_DATA: 'gps_user_data',
  DEVICE_ID: 'gps_device_id',
  INTERFACE_MODE: 'gps_interface_mode',
  PRINTER_CONFIG: 'gps_printer_config',
  SYNC_TIMESTAMP: 'gps_last_sync',
  THEME_PREFERENCE: 'gps_theme',
} as const;

// Device Detection Thresholds
export const DEVICE_CONFIG = {
  HANDHELD_MAX_WIDTH: 600,
  HANDHELD_USER_AGENTS: ['Android', 'Mobile', 'Handheld'],
} as const;
