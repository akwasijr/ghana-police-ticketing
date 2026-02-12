// Printer Configuration for Thermal Receipt Printers
// Enhanced ESC/POS Command Set for Ghana Police Ticketing

// ESC/POS Commands as number arrays for proper Uint8Array conversion
export const ESC_POS_COMMANDS = {
  // Initialize printer
  INIT: [0x1B, 0x40],
  
  // Text formatting
  BOLD_ON: [0x1B, 0x45, 0x01],
  BOLD_OFF: [0x1B, 0x45, 0x00],
  UNDERLINE_ON: [0x1B, 0x2D, 0x01],
  UNDERLINE_OFF: [0x1B, 0x2D, 0x00],
  DOUBLE_HEIGHT_ON: [0x1B, 0x21, 0x10],
  DOUBLE_HEIGHT_OFF: [0x1B, 0x21, 0x00],
  DOUBLE_WIDTH_ON: [0x1B, 0x21, 0x20],
  DOUBLE_SIZE_ON: [0x1B, 0x21, 0x30],
  NORMAL_SIZE: [0x1B, 0x21, 0x00],
  INVERSE_ON: [0x1D, 0x42, 0x01],
  INVERSE_OFF: [0x1D, 0x42, 0x00],
  
  // Alignment
  ALIGN_LEFT: [0x1B, 0x61, 0x00],
  ALIGN_CENTER: [0x1B, 0x61, 0x01],
  ALIGN_RIGHT: [0x1B, 0x61, 0x02],
  
  // Line spacing
  LINE_FEED: [0x0A],
  CARRIAGE_RETURN: [0x0D],
  LINE_SPACING_DEFAULT: [0x1B, 0x32],
  
  // Paper handling
  CUT_PAPER: [0x1D, 0x56, 0x00],
  CUT_PAPER_PARTIAL: [0x1D, 0x56, 0x01],
  
  // Character set
  CODE_PAGE_PC437: [0x1B, 0x74, 0x00],
  CODE_PAGE_LATIN1: [0x1B, 0x74, 0x01],
  
  // Status
  STATUS_QUERY: [0x10, 0x04, 0x01],
} as const;

// ESC/POS command builders
export const ESC_POS_BUILDERS = {
  // Set line spacing (n = number of dots, typically 0-255)
  lineSpacing: (n: number): number[] => [0x1B, 0x33, n],
  
  // Feed n lines
  feedLines: (n: number): number[] => [0x1B, 0x64, n],
  
  // Set character size (width: 0-7, height: 0-7)
  characterSize: (width: number, height: number): number[] => {
    const size = ((width & 0x07) << 4) | (height & 0x07);
    return [0x1D, 0x21, size];
  },
  
  // Set print density (0-15)
  printDensity: (density: number): number[] => [0x1B, 0x7C, Math.min(15, Math.max(0, density))],
  
  // Barcode height (default is usually 162 dots)
  barcodeHeight: (h: number): number[] => [0x1D, 0x68, h],
  
  // Barcode width (2-6, default 3)
  barcodeWidth: (w: number): number[] => [0x1D, 0x77, Math.min(6, Math.max(2, w))],
  
  // Print barcode text position (0=no, 1=above, 2=below, 3=both)
  barcodeTextPosition: (pos: number): number[] => [0x1D, 0x48, pos],
  
  // Print CODE128 barcode
  barcodeCode128: (data: string): number[] => {
    const bytes = new TextEncoder().encode(data);
    return [0x1D, 0x6B, 0x49, bytes.length, ...Array.from(bytes)];
  },
  
  // QR Code commands (for compatible printers)
  qrCodeModel: (model: 1 | 2 = 2): number[] => [0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, model === 1 ? 0x31 : 0x32, 0x00],
  qrCodeSize: (size: number): number[] => [0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, Math.min(16, Math.max(1, size))],
  qrCodeErrorCorrection: (level: 'L' | 'M' | 'Q' | 'H' = 'M'): number[] => {
    const levels = { L: 0x30, M: 0x31, Q: 0x32, H: 0x33 };
    return [0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, levels[level]];
  },
  qrCodeStore: (data: string): number[] => {
    const bytes = new TextEncoder().encode(data);
    const len = bytes.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);
    return [0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...Array.from(bytes)];
  },
  qrCodePrint: (): number[] => [0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30],
  
  // Print full QR code sequence
  printQRCode: (data: string, size: number = 6): number[] => [
    ...ESC_POS_BUILDERS.qrCodeModel(2),
    ...ESC_POS_BUILDERS.qrCodeSize(size),
    ...ESC_POS_BUILDERS.qrCodeErrorCorrection('M'),
    ...ESC_POS_BUILDERS.qrCodeStore(data),
    ...ESC_POS_BUILDERS.qrCodePrint(),
  ],
};

// Bluetooth service and characteristic UUIDs for thermal printers
export const BLUETOOTH_UUIDS = {
  // Common printer service UUIDs
  SERVICE_UUIDS: [
    '000018f0-0000-1000-8000-00805f9b34fb', // Generic printer
    '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile (SPP)
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Common thermal printer service
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Zjiang/Goojprt printers
    '0000ff00-0000-1000-8000-00805f9b34fb', // Alternative generic
  ],
  
  // Write characteristic UUIDs
  CHARACTERISTIC_UUIDS: [
    '00002af1-0000-1000-8000-00805f9b34fb', // Generic write
    'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f', // Common thermal printer write
    '49535343-8841-43f4-a8d4-ecbe34729bb3', // Zjiang/Goojprt write
    '0000ff02-0000-1000-8000-00805f9b34fb', // Alternative write
  ],
} as const;

// Paper width configurations
export const PAPER_WIDTHS: Record<number, { width: number; characters: number; pixels: number }> = {
  58: { width: 58, characters: 32, pixels: 384 },
  80: { width: 80, characters: 48, pixels: 576 },
} as const;

export type PaperWidthMM = 58 | 80;

// Default printer settings
export const DEFAULT_PRINTER_CONFIG = {
  paperWidth: 58 as PaperWidthMM,
  printDensity: 'medium' as 'light' | 'medium' | 'dark',
  autoCut: true,
  feedLinesAfterPrint: 4,
  bluetoothTimeout: 30000,
  autoReconnect: true,
  maxRetries: 3,
} as const;

// Ticket print template configuration
export const TICKET_TEMPLATE_CONFIG = {
  headerSpacing: 2,
  sectionSpacing: 1,
  footerSpacing: 3,
  qrCodeSize: 8,
  logoHeight: 80,
  showLogo: true,
  showQRCode: true,
  showBarcode: false,
} as const;

// Print template sections
export const TICKET_SECTIONS = {
  HEADER: 'header',
  TICKET_INFO: 'ticket_info',
  VEHICLE_INFO: 'vehicle_info',
  OFFENCE_INFO: 'offence_info',
  OFFICER_INFO: 'officer_info',
  PAYMENT_INFO: 'payment_info',
  QR_CODE: 'qr_code',
  FOOTER: 'footer',
} as const;

// Character line generators
export const generateLine = (char: string, width: number): string => char.repeat(width);
export const generateDashedLine = (width: number): string => generateLine('-', width);
export const generateDoubleLine = (width: number): string => generateLine('=', width);

// Text alignment helpers
export const centerText = (text: string, width: number): string => {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
};

export const rightAlignText = (text: string, width: number): string => {
  const padding = Math.max(0, width - text.length);
  return ' '.repeat(padding) + text;
};

export const formatLabelValue = (label: string, value: string, width: number): string => {
  const separator = ': ';
  const maxValueLength = width - label.length - separator.length;
  const truncatedValue = value.length > maxValueLength 
    ? value.substring(0, maxValueLength - 3) + '...'
    : value;
  return label + separator + truncatedValue;
};

export const formatTwoColumns = (left: string, right: string, width: number): string => {
  const spacing = Math.max(1, width - left.length - right.length);
  return left + ' '.repeat(spacing) + right;
};
