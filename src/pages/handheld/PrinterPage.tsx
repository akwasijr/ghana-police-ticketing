import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Bluetooth,
  BluetoothConnected,
  RefreshCw,
  Printer,
  AlertCircle,
  TestTube,
  Loader2,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrinter } from '@/hooks/usePrinter';
import type { PrinterDevice } from '@/types/printer.types';

export function PrinterPage() {
  const navigate = useNavigate();
  const { 
    device: connectedDevice, 
    status, 
    isConnecting, 
    error, 
    scan, 
    connect, 
    disconnect, 
    testPrint 
  } = usePrinter();

  const [availableDevices, setAvailableDevices] = useState<PrinterDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const devices = await scan();
      setAvailableDevices(devices);
    } catch (e) {
      console.error('Scan failed', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnect = async (device: PrinterDevice) => {
    await connect(device);
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleTestPrint = async () => {
    await testPrint();
  };

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: '#F3F4F6' }}>
      {/* Header */}
      <div className="bg-[#1A1F3A] pt-4 pb-6 px-4">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate('/handheld')}
            className="p-2 -ml-2"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" style={{ color: '#F9A825' }} />
          </button>
          <h1 className="text-xl font-bold text-white">Printer Settings</h1>
        </div>

        {/* Status Banner */}
        <div className={cn(
            'flex items-center justify-between p-4',
            status === 'connected' ? 'bg-green-500/20' : 'bg-gray-500/20'
          )}
        >
          <div className="flex items-center gap-3">
            {status === 'connected' ? (
              <BluetoothConnected className="h-6 w-6 text-green-400" />
            ) : (
              <Bluetooth className="h-6 w-6 text-gray-400" />
            )}
            <div>
              <p className="text-white font-medium">
                {status === 'connected' ? 'Printer Connected' : 'No Printer Connected'}
              </p>
              <p className="text-white/60 text-sm">
                {status === 'connected' ? 'Ready to print tickets' : 'Connect a device to start printing'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 flex items-center gap-3 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-700" />
          <p className="text-red-800 font-medium text-sm">{error}</p>
        </div>
      )}

      {/* Connected Printer */}
      {connectedDevice && (
        <div className="bg-white mx-4 mt-4 p-4 shadow-sm rounded-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Connected Device</h3>
            <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">
              {status}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 mb-4 rounded border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white border border-gray-200 flex items-center justify-center rounded">
                  <Printer className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{connectedDevice.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{connectedDevice.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleTestPrint}
              disabled={status !== 'connected'}
              className="flex-1 h-12 bg-[#1A1F3A] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 rounded"
            >
              {status === 'printing' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Printing...
                </>
              ) : (
                <>
                  <TestTube className="h-5 w-5" />
                  Test Print
                </>
              )}
            </button>
            <button
              onClick={handleDisconnect}
              className="h-12 px-4 bg-red-50 text-red-700 font-semibold rounded border border-red-100"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* Available Printers */}
      <div className="flex-1 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">
            Available Devices
          </h3>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1A1F3A] disabled:opacity-50 bg-white border border-gray-200 rounded shadow-sm"
          >
            <RefreshCw className={cn('h-4 w-4', isScanning && 'animate-spin')} />
            {isScanning ? 'Scanning...' : 'Scan for Printers'}
          </button>
        </div>

        {isScanning ? (
          <div className="bg-white p-8 text-center rounded-md shadow-sm">
            <div className="w-12 h-12 border-4 border-[#1A1F3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Searching for Bluetooth printers...</p>
            <p className="text-xs text-gray-400 mt-2">Make sure your printer is on and in pairing mode</p>
          </div>
        ) : (
          <div className="bg-white divide-y divide-gray-100 rounded-md shadow-sm overflow-hidden">
            {availableDevices.length > 0 ? (
              availableDevices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleConnect(device)}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
                      <Printer className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{device.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{device.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[#1A1F3A]">
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              !connectedDevice && (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No devices found</p>
                  <p className="text-sm text-gray-400 mt-1">Tap "Scan for Printers" to start searching</p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Printer Driver Info */}
      <div className="px-4 pb-8">
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full shrink-0">
              <Download className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-sm">Printer Driver Required</h3>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                For this device, you need to install the <strong>RawBT Print Service</strong> app to print tickets.
              </p>
              <a 
                href="https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors"
              >
                <Download className="h-3 w-3" />
                Download RawBT App
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

