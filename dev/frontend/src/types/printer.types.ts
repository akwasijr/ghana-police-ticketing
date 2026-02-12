// Printer-related Types

export type PrinterConnectionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'printing'
  | 'error'
  | 'scanning'
  | 'ready';

export type PrinterType = 
  | 'bluetooth'
  | 'usb'
  | 'network'
  | 'serial';

export type PaperWidth = '58mm' | '80mm';

export interface PrinterDevice {
  id: string;
  name: string;
  type: PrinterType;
  
  // Bluetooth specific
  bluetoothId?: string;
  bluetoothAddress?: string;
  
  // Network specific
  ipAddress?: string;
  port?: number;
  
  // USB specific
  vendorId?: string;
  productId?: string;
  
  // Status
  isConnected: boolean;
  status?: PrinterConnectionStatus;
  batteryLevel?: number;
  paperStatus?: 'ok' | 'low' | 'empty';
  lastConnected?: string;
}

export interface PrinterConfig {
  device?: PrinterDevice;
  paperWidth: PaperWidth;
  printDensity: 'light' | 'normal' | 'dark';
  autoCut: boolean;
  feedLinesAfterPrint: number;
  printCopies: number;
  showLogo: boolean;
  showQRCode: boolean;
  autoReconnect?: boolean;
  feedLines?: number;
}

export interface PrinterState {
  status: PrinterConnectionStatus;
  device: PrinterDevice | null;
  config: PrinterConfig;
  lastError?: string;
  isPrinting: boolean;
  printQueue: PrintJob[];
}

export interface PrintJob {
  id: string;
  type: 'ticket' | 'receipt' | 'report' | 'test';
  data: unknown;
  content?: any[];
  status: 'queued' | 'printing' | 'completed' | 'failed';
  createdAt: string;
  attempts: number;
  error?: string;
}

// Bluetooth scanning
export interface BluetoothScanResult {
  devices: PrinterDevice[];
  isScanning: boolean;
  error?: string;
}

// Print commands/data
export interface PrintTicketData {
  ticketNumber: string;
  issuedAt: string;
  dueDate: string;
  
  // Vehicle
  vehicleReg: string;
  vehicleType: string;
  vehicleColor?: string;
  
  // Driver
  driverName?: string;
  driverPhone?: string;
  
  // Offences
  offences: Array<{
    name: string;
    fine: number;
  }>;
  totalFine: number;
  
  // Location
  location: string;
  
  // Officer
  officerName: string;
  officerBadge: string;
  stationName: string;
  
  // Payment info
  paymentReference: string;
  paymentInstructions?: string;
  
  // QR code data
  qrCodeData: string;
}

export interface PrintReceiptData {
  receiptNumber: string;
  ticketNumber: string;
  vehicleReg: string;
  payerName: string;
  amount: number;
  method: string;
  transactionId?: string;
  paidAt: string;
  processedBy: string;
  stationName: string;
}

export interface PrintTestData {
  printerName: string;
  timestamp: string;
  message: string;
}

// Print result
export interface PrintResult {
  success: boolean;
  jobId: string;
  error?: string;
  bytesWritten?: number;
}

// ESC/POS command helpers
export interface TextStyle {
  bold?: boolean;
  underline?: boolean;
  doubleHeight?: boolean;
  doubleWidth?: boolean;
  alignment?: 'left' | 'center' | 'right';
}

export interface PrintLine {
  text: string;
  style?: TextStyle;
}

export interface PrintImage {
  data: Uint8Array;
  width: number;
  height: number;
}
