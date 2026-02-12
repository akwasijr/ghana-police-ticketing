// Ghana Police Service Traffic Ticketing System - Design System

export const colors = {
  // Primary Colors - Ghana Police Brand
  primary: {
    blue: '#1A1F3A',
    yellow: '#F9A825',
    blueDark: '#0F1225',
    blueLight: '#2A3050',
  },

  // Background Colors
  background: {
    gray: '#F5F5F5',
    white: '#FFFFFF',
    dark: '#0A0D1F',
  },

  // Status Colors
  status: {
    success: '#4CAF50',
    successLight: '#E8F5E9',
    warning: '#FF9800',
    warningLight: '#FFF3E0',
    error: '#F44336',
    errorLight: '#FFEBEE',
    info: '#2196F3',
    infoLight: '#E3F2FD',
  },

  // Text Colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    muted: '#BDBDBD',
    white: '#FFFFFF',
    inverse: '#FFFFFF',
  },

  // Surface Colors
  surface: {
    default: '#FFFFFF',
    elevated: '#FAFAFA',
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    divider: '#EEEEEE',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
    mono: "'IBM Plex Mono', monospace",
  },

  // Desktop/Dashboard font sizes
  desktop: {
    display: { size: '32px', weight: 700, lineHeight: 1.2 },
    h1: { size: '24px', weight: 600, lineHeight: 1.3 },
    h2: { size: '20px', weight: 600, lineHeight: 1.4 },
    h3: { size: '18px', weight: 600, lineHeight: 1.4 },
    bodyLg: { size: '16px', weight: 400, lineHeight: 1.5 },
    body: { size: '14px', weight: 400, lineHeight: 1.5 },
    small: { size: '12px', weight: 400, lineHeight: 1.5 },
    button: { size: '16px', weight: 500, lineHeight: 1 },
  },

  // Handheld font sizes (larger for outdoor readability)
  handheld: {
    display: { size: '34px', weight: 700, lineHeight: 1.2 },
    h1: { size: '26px', weight: 600, lineHeight: 1.3 },
    h2: { size: '22px', weight: 600, lineHeight: 1.4 },
    h3: { size: '20px', weight: 600, lineHeight: 1.4 },
    bodyLg: { size: '18px', weight: 400, lineHeight: 1.5 },
    body: { size: '16px', weight: 400, lineHeight: 1.5 },
    small: { size: '14px', weight: 400, lineHeight: 1.5 },
    button: { size: '18px', weight: 600, lineHeight: 1 },
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  pill: '9999px',
  card: '8px',
  cardLg: '12px',
  button: '8px',
  input: '8px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  card: '0 2px 8px rgba(0, 0, 0, 0.08)',
  cardHover: '0 4px 16px rgba(0, 0, 0, 0.12)',
  inputFocus: '0 0 0 3px rgba(26, 31, 58, 0.1)',
  button: '0 2px 4px rgba(0, 0, 0, 0.1)',
  modal: '0 8px 32px rgba(0, 0, 0, 0.2)',
} as const;

export const dimensions = {
  // Input heights
  inputHandheld: '56px',
  inputDesktop: '40px',

  // Button heights
  buttonHandheld: '56px',
  buttonDesktop: '40px',

  // Icon sizes
  iconSm: '16px',
  iconMd: '24px',
  iconLg: '32px',
  iconXl: '48px',

  // Sidebar
  sidebarWidth: '280px',
  sidebarCollapsed: '72px',

  // Header
  headerHeight: '64px',
  mobileHeaderHeight: '56px',

  // Card padding
  cardPadding: '20px',

  // Page padding
  pagePaddingHandheld: '16px',
  pagePaddingDesktop: '24px',
} as const;

export const transitions = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const zIndex = {
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  toast: 500,
  tooltip: 600,
} as const;

// Ticket Status Configuration
export const ticketStatusConfig = {
  unpaid: {
    label: 'Unpaid',
    color: colors.status.warning,
    bgColor: colors.status.warningLight,
    icon: 'Clock',
  },
  paid: {
    label: 'Paid',
    color: colors.status.success,
    bgColor: colors.status.successLight,
    icon: 'Check',
  },
  overdue: {
    label: 'Overdue',
    color: colors.status.error,
    bgColor: colors.status.errorLight,
    icon: 'AlertCircle',
  },
  objection: {
    label: 'Objection',
    color: colors.status.info,
    bgColor: colors.status.infoLight,
    icon: 'Info',
  },
  cancelled: {
    label: 'Cancelled',
    color: colors.text.secondary,
    bgColor: colors.surface.elevated,
    icon: 'X',
  },
} as const;

export type TicketStatusKey = keyof typeof ticketStatusConfig;
