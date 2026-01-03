// usePrinter hook - Bluetooth thermal printer management

import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/store/ui.store';
import type { 
  PrinterDevice, 
  PrinterConnectionStatus as PrinterStatus, 
  PrintJob, 
  PrinterConfig 
} from '@/types/printer.types';
import { 
  BLUETOOTH_UUIDS, 
  ESC_POS_COMMANDS,
  PAPER_WIDTHS,
} from '@/config/printer-config';

const STORAGE_KEY = 'printer_device';

interface UsePrinterReturn {
  // State
  device: PrinterDevice | null;
  status: PrinterStatus;
  isConnected: boolean;
  isConnecting: boolean;
  isPrinting: boolean;
  error: string | null;
  
  // Actions
  scan: () => Promise<PrinterDevice[]>;
  connect: (device: PrinterDevice) => Promise<boolean>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<boolean>;
  print: (job: PrintJob) => Promise<boolean>;
  testPrint: () => Promise<boolean>;
  
  // Configuration
  config: PrinterConfig;
  setConfig: (config: Partial<PrinterConfig>) => void;
}

const defaultConfig: PrinterConfig = {
  paperWidth: '58mm',
  printDensity: 'normal',
  autoCut: true,
  autoReconnect: true,
  feedLines: 3,
  feedLinesAfterPrint: 3,
  printCopies: 1,
  showLogo: true,
  showQRCode: true,
};

export function usePrinter(): UsePrinterReturn {
  const toast = useToast();
  const [device, setDevice] = useState<PrinterDevice | null>(null);
  const [status, setStatus] = useState<PrinterStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfigState] = useState<PrinterConfig>(defaultConfig);
  
  const bluetoothDeviceRef = useRef<any | null>(null);
  const characteristicRef = useRef<any | null>(null);

  // Load saved device on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedDevice = JSON.parse(saved) as PrinterDevice;
        setDevice(savedDevice);
        
        // Attempt auto-reconnect
        if (config.autoReconnect) {
          reconnect();
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Check for Web Bluetooth support
  const checkBluetoothSupport = useCallback((): boolean => {
    if (!(navigator as any).bluetooth) {
      setError('Bluetooth is not supported on this device');
      toast.error('Bluetooth not supported', 'Your device does not support Web Bluetooth');
      return false;
    }
    return true;
  }, [toast]);

  // Scan for available printers
  const scan = useCallback(async (): Promise<PrinterDevice[]> => {
    if (!checkBluetoothSupport()) return [];

    setStatus('scanning');
    setError(null);

    try {
      const btDevice = await (navigator as any).bluetooth.requestDevice({
        filters: BLUETOOTH_UUIDS.SERVICE_UUIDS.map((uuid) => ({
          services: [uuid],
        })),
        optionalServices: BLUETOOTH_UUIDS.SERVICE_UUIDS,
      });

      // Convert to our device type
      const printerDevice: PrinterDevice = {
        id: btDevice.id,
        name: btDevice.name || 'Unknown Printer',
        type: 'bluetooth',
        status: 'disconnected',
        batteryLevel: undefined,
        isConnected: false,
      };

      bluetoothDeviceRef.current = btDevice;
      
      return [printerDevice];
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Scan failed';
      setError(errorMessage);
      setStatus('disconnected');
      
      if (!errorMessage.includes('cancelled')) {
        toast.error('Scan failed', errorMessage);
      }
      
      return [];
    }
  }, [checkBluetoothSupport, config.paperWidth, toast]);

  // Connect to a printer
  const connect = useCallback(async (printerDevice: PrinterDevice): Promise<boolean> => {
    if (!checkBluetoothSupport()) return false;

    setStatus('connecting');
    setError(null);

    try {
      let btDevice = bluetoothDeviceRef.current;
      
      // If no device ref or different device, need to scan again
      if (!btDevice || btDevice.id !== printerDevice.id) {
        const devices = await scan();
        if (devices.length === 0) {
          throw new Error('No device found');
        }
        btDevice = bluetoothDeviceRef.current;
      }

      if (!btDevice) {
        throw new Error('Bluetooth device not available');
      }

      // Connect to GATT server
      const server = await btDevice.gatt?.connect();
      if (!server) {
        throw new Error('Could not connect to GATT server');
      }

      // Get the printer service
      let service: any | null = null;
      for (const uuid of BLUETOOTH_UUIDS.SERVICE_UUIDS) {
        try {
          service = await server.getPrimaryService(uuid);
          break;
        } catch {
          continue;
        }
      }

      if (!service) {
        throw new Error('Printer service not found');
      }

      // Get write characteristic
      let characteristic: any | null = null;
      for (const uuid of BLUETOOTH_UUIDS.CHARACTERISTIC_UUIDS) {
        try {
          characteristic = await service.getCharacteristic(uuid);
          break;
        } catch {
          continue;
        }
      }

      if (!characteristic) {
        throw new Error('Print characteristic not found');
      }

      characteristicRef.current = characteristic;

      // Update state
      const connectedDevice: PrinterDevice = {
        ...printerDevice,
        status: 'ready',
        lastConnected: new Date().toISOString(),
      };

      setDevice(connectedDevice);
      setStatus('ready');
      
      // Save for auto-reconnect
      localStorage.setItem(STORAGE_KEY, JSON.stringify(connectedDevice));

      // Listen for disconnection
      btDevice.addEventListener('gattserverdisconnected', handleDisconnection);

      toast.success('Printer connected', `Connected to ${printerDevice.name}`);
      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Connection failed';
      setError(errorMessage);
      setStatus('error');
      toast.error('Connection failed', errorMessage);
      return false;
    }
  }, [checkBluetoothSupport, scan, toast]);

  // Handle disconnection event
  const handleDisconnection = useCallback(() => {
    setStatus('disconnected');
    characteristicRef.current = null;
    
    if (device) {
      setDevice({ ...device, status: 'disconnected' });
    }

    toast.warning('Printer disconnected', 'Bluetooth connection lost');

    // Auto-reconnect if enabled
    if (config.autoReconnect) {
      setTimeout(() => reconnect(), 2000);
    }
  }, [device, config.autoReconnect, toast]);

  // Disconnect from printer
  const disconnect = useCallback(async (): Promise<void> => {
    if (bluetoothDeviceRef.current?.gatt?.connected) {
      bluetoothDeviceRef.current.gatt.disconnect();
    }

    bluetoothDeviceRef.current = null;
    characteristicRef.current = null;
    
    setStatus('disconnected');
    if (device) {
      setDevice({ ...device, status: 'disconnected' });
    }
    
    localStorage.removeItem(STORAGE_KEY);
    toast.info('Disconnected', 'Printer has been disconnected');
  }, [device, toast]);

  // Reconnect to saved device
  const reconnect = useCallback(async (): Promise<boolean> => {
    if (!device) return false;
    return connect(device);
  }, [device, connect]);

  // Send data to printer
  const sendToPrinter = useCallback(async (data: Uint8Array): Promise<void> => {
    if (!characteristicRef.current) {
      throw new Error('Printer not connected');
    }

    // Split into chunks (some printers have MTU limits)
    const chunkSize = 100;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await characteristicRef.current.writeValue(chunk);
      // Small delay between chunks
      await new Promise((r) => setTimeout(r, 20));
    }
  }, []);

  // Build print data from job
  const buildPrintData = useCallback((job: PrintJob): Uint8Array => {
    const encoder = new TextEncoder();
    const commands: number[] = [];

    // Initialize printer
    commands.push(...ESC_POS_COMMANDS.INIT);

    // Process each content item
    if (job.content) {
      for (const item of job.content) {
        switch (item.type) {
          case 'text':
          // Apply alignment
          if (item.align === 'center') {
            commands.push(...ESC_POS_COMMANDS.ALIGN_CENTER);
          } else if (item.align === 'right') {
            commands.push(...ESC_POS_COMMANDS.ALIGN_RIGHT);
          } else {
            commands.push(...ESC_POS_COMMANDS.ALIGN_LEFT);
          }

          // Apply bold
          if (item.bold) {
            commands.push(...ESC_POS_COMMANDS.BOLD_ON);
          }

          // Apply size
          if (item.size === 'large') {
            commands.push(...ESC_POS_COMMANDS.DOUBLE_HEIGHT_ON);
          }

          // Add text
          commands.push(...encoder.encode(item.text));
          commands.push(...ESC_POS_COMMANDS.LINE_FEED);

          // Reset styles
          commands.push(...ESC_POS_COMMANDS.BOLD_OFF);
          commands.push(...ESC_POS_COMMANDS.DOUBLE_HEIGHT_OFF);
          break;

        case 'line':
          const lineChar = item.style === 'double' ? '=' : '-';
          const width = parseInt(config.paperWidth.replace('mm', ''), 10);
          const lineLength = PAPER_WIDTHS[width as 58 | 80]?.characters || 32;
          commands.push(...encoder.encode(lineChar.repeat(lineLength)));
          commands.push(...ESC_POS_COMMANDS.LINE_FEED);
          break;

        case 'barcode':
          // TODO: Implement barcode printing
          break;

        case 'qrcode':
          // TODO: Implement QR code printing
          break;

        case 'feed':
          for (let i = 0; i < (item.lines || 1); i++) {
            commands.push(...ESC_POS_COMMANDS.LINE_FEED);
          }
          break;
      }
    }
    }

    // Feed lines and cut
    for (let i = 0; i < (config.feedLines || 3); i++) {
      commands.push(...ESC_POS_COMMANDS.LINE_FEED);
    }

    if (config.autoCut) {
      commands.push(...ESC_POS_COMMANDS.CUT_PAPER);
    }

    return new Uint8Array(commands);
  }, [config]);

  // Print a job
  const print = useCallback(async (job: PrintJob): Promise<boolean> => {
    if (status !== 'ready') {
      toast.error('Printer not ready', 'Please connect to a printer first');
      return false;
    }

    setStatus('printing');

    try {
      const printData = buildPrintData(job);
      await sendToPrinter(printData);
      setStatus('ready');
      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Print failed';
      setError(errorMessage);
      setStatus('error');
      toast.error('Print failed', errorMessage);
      return false;
    }
  }, [status, buildPrintData, sendToPrinter, toast]);

  // Test print
  const testPrint = useCallback(async (): Promise<boolean> => {
    const testJob: PrintJob = {
      id: 'test',
      type: 'test',
      data: null,
      status: 'queued',
      createdAt: new Date().toISOString(),
      attempts: 0,
      content: [
        { type: 'text', text: 'GHANA POLICE SERVICE', align: 'center', bold: true, size: 'large' },
        { type: 'text', text: 'Traffic Ticketing System', align: 'center' },
        { type: 'line' },
        { type: 'text', text: 'Test Print', align: 'center' },
        { type: 'text', text: new Date().toLocaleString(), align: 'center' },
        { type: 'line' },
        { type: 'text', text: 'Printer is working!', align: 'center', bold: true },
        { type: 'feed', lines: 2 },
      ],
    };

    return print(testJob);
  }, [print]);

  // Update config
  const setConfig = useCallback((newConfig: Partial<PrinterConfig>) => {
    setConfigState((prev) => ({ ...prev, ...newConfig }));
  }, []);

  return {
    device,
    status,
    isConnected: status === 'ready' || status === 'printing',
    isConnecting: status === 'connecting' || status === 'scanning',
    isPrinting: status === 'printing',
    error,
    scan,
    connect,
    disconnect,
    reconnect,
    print,
    testPrint,
    config,
    setConfig,
  };
}
