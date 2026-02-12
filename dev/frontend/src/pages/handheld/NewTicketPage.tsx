import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Check, 
  Car, 
  User,
  AlertTriangle,
  Camera,
  MapPin,
  Printer,
  Zap,
  StopCircle,
  ShieldOff,
  Smartphone,
  ParkingCircle,
  ArrowLeftRight,
  Lightbulb,
  AlertOctagon,
  Beer,
  FileX,
  Pencil,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  IdCard,
  FileText,
  RefreshCw,
  Satellite,
  Keyboard,
  Scan,
  type LucideIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import { useTicketStore, useAuthStore, useActiveOffences } from '@/store';
import { formatCurrency } from '@/lib/utils/formatting';
import { printTicket } from '@/lib/utils/print';
import { scanIdCard } from '@/lib/utils/ocr';
import { cn } from '@/lib/utils';
import { useCamera } from '@/hooks/useCamera';
import { useLocation as useGeoLocation } from '@/hooks/useLocation';
import { usePrinter } from '@/hooks/usePrinter';
import { LoadingSpinner, TicketReceipt } from '@/components/shared';
import type { OffenceCategory } from '@/types/offence.types';
const STEPS = [
  { id: 1, name: 'Vehicle & Driver' },
  { id: 2, name: 'Select Violation' },
  { id: 3, name: 'Add Photos' },
  { id: 4, name: 'Review & Print' },
];

// Icon mapping for offence categories - maps store offence IDs to icons
const OFFENCE_ICONS: Record<string, LucideIcon> = {
  'off-001': Zap,           // Exceeding Speed Limit
  'off-002': Zap,           // Reckless Speeding
  'off-003': StopCircle,    // Red Light Violation
  'off-004': StopCircle,    // Failure to Obey Traffic Signs
  'off-005': FileX,         // Driving Without License
  'off-006': FileX,         // Expired Vehicle Registration
  'off-007': FileX,         // No Insurance
  'off-008': ShieldOff,     // No Seatbelt
  'off-009': Smartphone,    // Using Mobile Phone While Driving
  'off-010': Beer,          // Drunk Driving
  'off-011': ParkingCircle, // Illegal Parking
  'off-012': ParkingCircle, // Double Parking
  'off-013': Lightbulb,     // Defective Lights
  'off-014': AlertOctagon,  // Overloading
  'off-015': ArrowLeftRight, // Dangerous Overtaking
};

// Default icon for categories
const CATEGORY_ICONS: Record<OffenceCategory, LucideIcon> = {
  speed: Zap,
  traffic_signal: StopCircle,
  documentation: FileX,
  vehicle_condition: Lightbulb,
  parking: ParkingCircle,
  dangerous_driving: AlertOctagon,
  licensing: FileX,
  other: AlertTriangle,
};

// Vehicle types
const VEHICLE_TYPES = [
  'Saloon Car', 'SUV', 'Pickup', 'Bus', 'Minibus (Trotro)', 
  'Motorcycle', 'Tricycle', 'Truck', 'Taxi', 'Other'
];

export function NewTicketPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const activeOffences = useActiveOffences();
  const { 
    newTicket, 
    setVehicle, 
    setDriver, 
    addOffence, 
    removeOffence, 
    addPhoto,
    removePhoto,
    setLocation,
    setNotes,
    resetNewTicket, 
    getTotalFine,
    setCurrentStep,
    submitTicket
  } = useTicketStore();
  
  // Map offence store data to UI format with icons
  const violations = useMemo(() => {
    return activeOffences.map(offence => ({
      id: offence.id,
      name: offence.name,
      fine: offence.defaultFine,
      icon: OFFENCE_ICONS[offence.id] || CATEGORY_ICONS[offence.category] || AlertTriangle,
      category: offence.category,
      code: offence.code,
    }));
  }, [activeOffences]);
  
  const [step, setStep] = useState(1);
  const [showCustomViolation, setShowCustomViolation] = useState(false);
  const [customViolation, setCustomViolation] = useState({ name: '', fine: 0 });
  const [showCamera, setShowCamera] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [ticketNumber, setTicketNumber] = useState<string>('');
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('gps');
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraMode, setCameraMode] = useState<'evidence' | 'ocr'>('evidence');
  
  const camera = useCamera();
  const geoLocation = useGeoLocation();
  const printer = usePrinter();

  // Generate ticket number on mount
  useEffect(() => {
    const num = `GPS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    setTicketNumber(num);
  }, []);

  // Generate QR code when reaching step 4
  useEffect(() => {
    if (step === 4 && ticketNumber) {
      const qrData = JSON.stringify({
        ticket: ticketNumber,
        vehicle: newTicket.vehicle.registrationNumber,
        fine: getTotalFine(),
        date: new Date().toISOString().split('T')[0],
      });
      QRCode.toDataURL(qrData, { width: 150, margin: 1 })
        .then(url => setQrCodeDataUrl(url))
        .catch(console.error);
    }
  }, [step, ticketNumber, newTicket.vehicle.registrationNumber, getTotalFine]);

  // Get location on mount
  useEffect(() => {
    geoLocation.getCurrentLocation().then((loc) => {
      if (loc) {
        setLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
        });
      }
    });
  }, []);

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    resetNewTicket();
    navigate('/handheld');
  };

  const handleNext = () => {
    if (step === 1 && !isStep1Valid) {
      setHasAttemptedNext(true);
      return;
    }
    if (step < 4) {
      setStep(step + 1);
      setCurrentStep(step);
      setHasAttemptedNext(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setCurrentStep(step - 2);
    } else {
      handleCancel();
    }
  };

  const handleSubmit = () => {
    // Submit ticket to store
    const submittedTicket = submitTicket({
      id: user?.id || 'unknown',
      name: user?.fullName || 'GPS Officer',
      badgeNumber: user?.officer?.badgeNumber,
      stationId: user?.officer?.stationId,
      stationName: user?.officer?.station?.name,
      regionId: user?.officer?.regionId,
      regionName: user?.officer?.station?.regionName,
    });
    
    // Update ticket number to match the generated one
    setTicketNumber(submittedTicket.ticketNumber);
    
    // Show success screen with print preview
    setShowSuccessScreen(true);
  };

  const handlePrint = async () => {
    const locationString = locationMode === 'manual' && newTicket.location.address
      ? newTicket.location.address
      : geoLocation.location 
        ? `${geoLocation.location.latitude.toFixed(4)}°N, ${geoLocation.location.longitude.toFixed(4)}°W`
        : undefined;

    const ticketData = {
      ticketNumber: ticketNumber,
      date: new Date().toLocaleDateString('en-GB'),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      vehicle: newTicket.vehicle.registrationNumber || 'UNKNOWN',
      vehicleType: newTicket.vehicle.make || undefined,
      vehicleColor: newTicket.vehicle.color || undefined,
      driver: getDriverFullName(),
      driverId: newTicket.driver.licenseNumber || newTicket.driver.idNumber || 'N/A',
      offenses: newTicket.offences.map(o => ({ name: o.name, fine: o.fine })),
      totalFine: getTotalFine(),
      location: locationString,
      officerName: user?.fullName || 'GPS Officer',
      officerBadge: user?.officer?.badgeNumber || 'GPS-0000',
      notes: newTicket.notes
    };

    if (printer.isConnected) {
      // Construct Bluetooth print job
      const job = {
        id: `print-${Date.now()}`,
        type: 'ticket' as const,
        data: ticketData,
        createdAt: new Date().toISOString(),
        status: 'queued' as const,
        attempts: 0,
        content: [
          { type: 'text', text: 'GHANA POLICE SERVICE', align: 'center', bold: true },
          { type: 'text', text: 'TRAFFIC VIOLATION TICKET', align: 'center' },
          { type: 'line', style: 'dashed' },
          { type: 'text', text: `TICKET NO: ${ticketData.ticketNumber}`, align: 'center', size: 'large', bold: true },
          { type: 'line', style: 'dashed' },
          { type: 'text', text: `DATE: ${ticketData.date}  TIME: ${ticketData.time}` },
          { type: 'text', text: `VEHICLE: ${ticketData.vehicle}`, bold: true },
          ...(ticketData.vehicleType || ticketData.vehicleColor ? [{ type: 'text', text: [ticketData.vehicleColor, ticketData.vehicleType].filter(Boolean).join(' ') }] : []),
          { type: 'text', text: `DRIVER: ${ticketData.driver}` },
          { type: 'text', text: `ID: ${ticketData.driverId}` },
          { type: 'line', style: 'dashed' },
          { type: 'text', text: 'OFFENCES:', bold: true },
          ...ticketData.offenses.map((o, i) => ({ type: 'text', text: `${i + 1}. ${o.name} (GHc${o.fine})` })),
          { type: 'line', style: 'double' },
          { type: 'text', text: `TOTAL: GHc${ticketData.totalFine.toFixed(2)}`, align: 'right', bold: true, size: 'large' },
          { type: 'line', style: 'double' },
          { type: 'text', text: 'PAY WITHIN 14 DAYS', align: 'center', bold: true },
          { type: 'text', text: 'Mobile Money: *920*44#', align: 'center' },
          { type: 'feed', lines: 2 },
          { type: 'text', text: `Officer: ${ticketData.officerName}`, align: 'center' },
          { type: 'text', text: `Badge: ${ticketData.officerBadge}`, align: 'center' },
          { type: 'feed', lines: 2 }
        ]
      };
      
      await printer.print(job);
    } else {
      printTicket(ticketData);
    }
  };

  const handleFinish = () => {
    resetNewTicket();
    navigate('/handheld');
  };

  const isViolationSelected = (id: string) => newTicket.offences.some(o => o.id === id);

  const toggleViolation = (violation: typeof violations[0]) => {
    if (isViolationSelected(violation.id)) {
      removeOffence(violation.id);
    } else {
      addOffence({
        id: violation.id,
        name: violation.name,
        fine: violation.fine,
        category: violation.category as any,
      });
    }
  };

  const addCustomViolation = () => {
    if (customViolation.name && customViolation.fine > 0) {
      addOffence({
        id: `CUST-${Date.now()}`,
        name: customViolation.name,
        fine: customViolation.fine,
        category: 'other',
      });
      setCustomViolation({ name: '', fine: 0 });
      setShowCustomViolation(false);
    }
  };

  const handleScanId = () => {
    setCameraMode('ocr');
    setShowCamera(true);
    camera.startCamera();
  };

  const capturePhoto = async () => {
    if (cameraMode === 'ocr') {
      setIsScanning(true);
      try {
        const photo = await camera.capturePhoto({ type: 'evidence' });
        if (photo) {
          const response = await fetch(photo.uri);
          const blob = await response.blob();
          const file = new File([blob], "scan.jpg", { type: "image/jpeg" });
          
          const result = await scanIdCard(file);
          
          if (result) {
             setDriver({
               firstName: result.firstName || newTicket.driver.firstName,
               lastName: result.lastName || newTicket.driver.lastName,
               licenseNumber: newTicket.driver.licenseNumber,
               idNumber: result.idNumber || newTicket.driver.idNumber,
               idType: result.idNumber?.startsWith('GHA') ? 'ghana_card' : newTicket.driver.idType,
               phone: newTicket.driver.phone
             });
          }
        }
      } catch (error) {
        console.error("OCR Error:", error);
      } finally {
        setIsScanning(false);
        setShowCamera(false);
        camera.stopCamera();
      }
    } else {
      const photo = await camera.capturePhoto({ type: 'evidence' });
      if (photo) {
        addPhoto({
          id: photo.id,
          uri: photo.uri,
          timestamp: photo.timestamp,
          type: 'evidence',
          uploaded: false,
        });
      }
      setShowCamera(false);
      camera.stopCamera();
    }
  };

  // Validation
  const isVehicleValid = !!newTicket.vehicle.registrationNumber && newTicket.vehicle.registrationNumber.length >= 6;
  const isDriverValid = !!newTicket.driver.firstName && !!newTicket.driver.lastName && 
    (!!newTicket.driver.licenseNumber || !!newTicket.driver.idNumber);
  const isStep1Valid = isVehicleValid && isDriverValid;
  const isStep2Valid = newTicket.offences.length > 0;
  const canSubmit = isStep1Valid && isStep2Valid;

  const getDriverFullName = () => {
    const { firstName, lastName } = newTicket.driver;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return 'Not provided';
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: '#F3F4F6' }}>
      {/* Header */}
      <div className="bg-[#1A1F3A] text-white px-4 pt-2 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button 
            onClick={handleBack}
            aria-label="Go back"
            className="p-1 -ml-1"
          >
            <ChevronLeft className="h-6 w-6" style={{ color: '#F9A825' }} />
          </button>
          <h1 className="text-base font-semibold text-white">New Ticket</h1>
          <button 
            onClick={handleCancel}
            aria-label="Cancel ticket"
            className="p-1 -mr-1"
          >
            <X className="h-5 w-5" style={{ color: '#EF4444' }} />
          </button>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-1">
          {STEPS.map((s, i) => {
            const isCompleted = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className={cn(
                  'flex items-center justify-center transition-all rounded-full',
                  isActive ? 'w-8 h-8 bg-[#F9A825]' : 
                  isCompleted ? 'w-6 h-6 bg-green-500' : 
                  'w-6 h-6 bg-white/20'
                )}>
                  {isCompleted ? (
                    <Check className="h-3 w-3 text-white" />
                  ) : (
                    <span className={cn(
                      'text-xs font-bold',
                      isActive ? 'text-[#1A1F3A]' : 'text-white/60'
                    )}>{s.id}</span>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'w-4 h-0.5 mx-0.5',
                    step > s.id ? 'bg-green-500' : 'bg-white/20'
                  )} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-white/80 text-xs mt-2">
          Step {step}: {STEPS[step - 1].name}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Step 1: Vehicle & Driver */}
        {step === 1 && (
          <div className="p-4 space-y-4">
            {/* Vehicle Section */}
            <div className="bg-white p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5" style={{ backgroundColor: '#1A1F3A' }}>
                  <Car className="h-5 w-5" style={{ color: '#F9A825' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Vehicle Information</h3>
                  <p className="text-xs text-gray-500">All fields required</p>
                </div>
              </div>
              
              {/* Registration Number */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Registration Number *</label>
                <input
                  type="text"
                  value={newTicket.vehicle.registrationNumber || ''}
                  onChange={(e) => setVehicle({ registrationNumber: e.target.value.toUpperCase() })}
                  placeholder="GR-1234-24"
                  className={cn(
                    'w-full h-14 px-4 text-lg font-mono text-center uppercase tracking-wider transition-colors',
                    newTicket.vehicle.registrationNumber && newTicket.vehicle.registrationNumber.length >= 6
                      ? 'bg-green-100'
                      : 'bg-gray-100 focus:bg-gray-50'
                  )}
                />
              </div>

              {/* Vehicle Type & Model */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Type *</label>
                  <select
                    value={newTicket.vehicle.type || ''}
                    onChange={(e) => setVehicle({ type: e.target.value as any })}
                    className="w-full h-12 px-3 bg-gray-100 focus:bg-gray-50 text-base"
                    title="Select vehicle type"
                    aria-label="Select vehicle type"
                  >
                    <option value="">Select...</option>
                    {VEHICLE_TYPES.map(t => (
                      <option key={t} value={t.toLowerCase().replace(/[^a-z]/g, '_')}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Color *</label>
                  <input
                    type="text"
                    value={newTicket.vehicle.color || ''}
                    onChange={(e) => setVehicle({ color: e.target.value })}
                    placeholder="e.g. Silver"
                    className="w-full h-12 px-3 bg-gray-100 focus:bg-gray-50 text-base"
                  />
                </div>
              </div>

              {/* Make & Model */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Make / Model</label>
                <input
                  type="text"
                  value={newTicket.vehicle.make || ''}
                  onChange={(e) => setVehicle({ make: e.target.value })}
                  placeholder="e.g. Toyota Corolla"
                  className="w-full h-12 px-3 bg-gray-100 focus:bg-gray-50 text-base"
                />
              </div>
            </div>

            {/* Driver Section - Mandatory */}
            <div className="bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5" style={{ backgroundColor: '#F9A825' }}>
                    <User className="h-5 w-5" style={{ color: '#1A1F3A' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Driver Information</h3>
                    <p className="text-xs text-red-600 font-medium">* Required fields</p>
                  </div>
                </div>
                <button
                  onClick={handleScanId}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium active:bg-blue-100"
                >
                  <Scan className="h-4 w-4" />
                  Scan ID
                </button>
              </div>
              
              {/* Names */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">First Name *</label>
                  <input
                    type="text"
                    value={newTicket.driver.firstName || ''}
                    onChange={(e) => setDriver({ firstName: e.target.value })}
                    placeholder="Kwame"
                    className="w-full h-12 px-3 bg-gray-100 focus:bg-gray-50 text-base"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Last Name *</label>
                  <input
                    type="text"
                    value={newTicket.driver.lastName || ''}
                    onChange={(e) => setDriver({ lastName: e.target.value })}
                    placeholder="Mensah"
                    className="w-full h-12 px-3 bg-gray-100 focus:bg-gray-50 text-base"
                  />
                </div>
              </div>

              {/* ID Section */}
              <div className="mb-3">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  <IdCard className="h-4 w-4 inline mr-1" />
                  License Number OR Ghana Card *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newTicket.driver.licenseNumber || ''}
                    onChange={(e) => setDriver({ licenseNumber: e.target.value.toUpperCase() })}
                    placeholder="License No."
                    className="w-full h-12 px-3 bg-gray-100 focus:bg-gray-50 text-base font-mono uppercase"
                  />
                  <input
                    type="text"
                    value={newTicket.driver.idNumber || ''}
                    onChange={(e) => setDriver({ idNumber: e.target.value.toUpperCase(), idType: 'ghana_card' })}
                    placeholder="GHA-XXXXXXXXX-X"
                    className="w-full h-12 px-3 bg-gray-100 focus:bg-gray-50 text-base font-mono uppercase"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter at least one identification</p>
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  value={newTicket.driver.phone || ''}
                  onChange={(e) => setDriver({ phone: e.target.value })}
                  placeholder="024 123 4567"
                  className="w-full h-12 px-3 bg-gray-100 focus:bg-gray-50 text-base"
                />
              </div>

            {hasAttemptedNext && !isStep1Valid && (
              <div className="p-4 flex items-center gap-3 bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-700" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Missing required fields:</p>
                  <p className="text-xs text-amber-700">
                    {!isVehicleValid && 'Vehicle registration • '}
                    {!newTicket.driver.firstName && 'First name • '}
                    {!newTicket.driver.lastName && 'Last name • '}
                    {!newTicket.driver.licenseNumber && !newTicket.driver.idNumber && 'ID required'}
                  </p>
                </div>
              </div>
            )}

              {geoLocation.isHighAccuracy && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Violation */}
        {step === 2 && (
          <div className="p-4 space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold text-gray-900">Select Violation Type</h2>
              <p className="text-sm text-gray-500">Tap to select one or more violations</p>
            </div>

            {/* Selected Violations Summary */}
            {newTicket.offences.length > 0 && (
              <div className="bg-[#1A1F3A] rounded-none p-4 text-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/80 text-sm font-medium">{newTicket.offences.length} violation{newTicket.offences.length > 1 ? 's' : ''} selected</span>
                  <span className="text-xl font-bold text-[#F9A825]">{formatCurrency(getTotalFine())}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newTicket.offences.map(o => (
                    <span key={o.id} className="px-3 py-1.5 bg-white/20 text-sm font-medium">
                      {o.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Violations Grid - Common Color Theme */}
            <div className="grid grid-cols-2 gap-3">
              {violations.map((violation) => {
                const Icon = violation.icon;
                const selected = isViolationSelected(violation.id);
                return (
                  <button
                    key={violation.id}
                    onClick={() => toggleViolation(violation)}
                    className="relative p-4 text-left transition-all active:scale-[0.98]"
                    style={{ 
                      backgroundColor: selected ? '#1A1F3A' : 'white'
                    }}
                  >
                    {/* Selection Indicator */}
                    {selected && (
                      <div 
                        className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center"
                        style={{ backgroundColor: '#F9A825' }}
                      >
                        <Check className="h-5 w-5 stroke-[3]" style={{ color: '#1A1F3A' }} />
                      </div>
                    )}
                    
                    {/* Icon + Text Together */}
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-11 h-11 flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: selected ? '#F9A825' : '#1A1F3A' }}
                      >
                        <Icon className="h-5 w-5" style={{ color: selected ? '#1A1F3A' : '#F9A825' }} />
                      </div>
                      <p 
                        className="font-medium text-sm leading-tight"
                        style={{ color: selected ? '#F9A825' : '#111827' }}
                      >
                        {violation.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Violation Button */}
            <button
              onClick={() => setShowCustomViolation(true)}
              className="w-full p-4 flex items-center justify-center gap-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Pencil className="h-5 w-5" />
              <span className="font-semibold">Add Custom Violation</span>
            </button>
          </div>
        )}

        {/* Step 3: Add Photos */}
        {step === 3 && (
          <div className="p-4 space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold text-gray-900">Add Evidence Photos</h2>
              <p className="text-sm text-gray-500">Optional - Skip if not needed</p>
            </div>

            {/* Photo Grid */}
            {newTicket.photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {newTicket.photos.map((photo, i) => (
                  <div key={photo.id} className="relative aspect-square overflow-hidden bg-gray-200">
                    <img src={photo.uri} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(photo.id)}
                      aria-label={`Remove photo ${i + 1}`}
                      className="absolute top-1 right-1 p-1.5 bg-red-600 text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {newTicket.photos.length < 3 && (
                  <button
                    onClick={() => {
                      setShowCamera(true);
                      camera.startCamera();
                    }}
                    className="aspect-square flex flex-col items-center justify-center text-gray-500 bg-gray-100"
                  >
                    <Plus className="h-8 w-8" />
                    <span className="text-xs mt-1 font-medium">Add</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowCamera(true);
                  camera.startCamera();
                }}
                className="w-full aspect-[4/3] flex flex-col items-center justify-center bg-gray-100"
              >
                <div className="w-16 h-16 bg-[#1A1F3A] flex items-center justify-center mb-4">
                  <Camera className="h-8 w-8 text-[#F9A825]" />
                </div>
                <p className="text-lg font-semibold text-gray-800">Take Photo</p>
                <p className="text-sm text-gray-600">Photo 1 of 3 max</p>
              </button>
            )}

            {/* Location & Notes Section */}
            <div className="bg-white p-4 space-y-4">
              {/* Location Selection */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-[#1A1F3A]" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Location Details</h3>
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-xl w-full mb-4">
                  <button
                    onClick={() => setLocationMode('gps')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                      locationMode === 'gps' 
                        ? "bg-white text-[#1A1F3A] shadow-sm ring-1 ring-black/5" 
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                    )}
                  >
                    <Satellite className="w-4 h-4" />
                    GPS Location
                  </button>
                  <button
                    onClick={() => setLocationMode('manual')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                      locationMode === 'manual' 
                        ? "bg-white text-[#1A1F3A] shadow-sm ring-1 ring-black/5" 
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                    )}
                  >
                    <Keyboard className="w-4 h-4" />
                    Manual Entry
                  </button>
                </div>

                {locationMode === 'gps' ? (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">GPS Coordinates</p>
                        <p className="text-xs text-blue-700 mt-1 font-mono">
                          {geoLocation.location 
                            ? `${geoLocation.location.latitude.toFixed(6)}°N, ${geoLocation.location.longitude.toFixed(6)}°W`
                            : 'Waiting for signal...'}
                        </p>
                        <p className="text-[10px] text-blue-600 mt-1">
                          Accuracy: {geoLocation.location?.accuracy?.toFixed(0) || 0}m
                        </p>
                      </div>
                      <button 
                        onClick={() => geoLocation.getCurrentLocation()}
                        className="p-2 bg-white rounded-full shadow-sm active:scale-95 transition-transform"
                      >
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={newTicket.location.address || ''}
                      onChange={(e) => setLocation({ ...newTicket.location, address: e.target.value })}
                      placeholder="Enter location (e.g. Near Kaneshie Market)"
                      className="w-full h-12 px-3 bg-gray-100 focus:bg-gray-50 border-none rounded-md text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-[#1A1F3A]" />
                  <h3 className="font-semibold text-gray-900">Officer Notes</h3>
                </div>
                <textarea
                  value={newTicket.notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional details or comments about the violation..."
                  className="w-full h-24 p-3 bg-gray-100 focus:bg-gray-50 border-none rounded-md text-sm resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Print */}
        {step === 4 && (
          <div className="p-4 space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold text-gray-900">Review Ticket</h2>
              <p className="text-sm text-gray-500">Confirm all details before printing</p>
            </div>

            {/* Toggle View Buttons */}
            <div className="flex overflow-hidden bg-gray-100">
              <button
                onClick={() => setShowPrintPreview(false)}
                className={cn(
                  'flex-1 py-3 text-sm font-semibold transition-colors',
                  !showPrintPreview 
                    ? 'bg-[#1A1F3A] text-white' 
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                Ticket Preview
              </button>
              <button
                onClick={() => setShowPrintPreview(true)}
                className={cn(
                  'flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2',
                  showPrintPreview 
                    ? 'bg-[#1A1F3A] text-white' 
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                <Printer className="h-4 w-4" />
                Thermal Print
              </button>
            </div>

            {!showPrintPreview ? (
              /* Ticket Preview Card */
              <div className="bg-white overflow-hidden">
                {/* Header */}
                <div className="bg-[#1A1F3A] p-4 text-center">
                  <div className="w-12 h-12 bg-[#F9A825] flex items-center justify-center mx-auto mb-2">
                    <Car className="h-6 w-6 text-[#1A1F3A]" />
                  </div>
                  <p className="text-white/60 text-xs">VEHICLE REGISTRATION</p>
                  <p className="text-2xl font-bold text-white font-mono tracking-wider">
                    {newTicket.vehicle.registrationNumber || 'N/A'}
                  </p>
                  {newTicket.vehicle.type && (
                    <p className="text-white/70 text-sm mt-1">
                      {newTicket.vehicle.color} {VEHICLE_TYPES.find(t => t.toLowerCase().replace(/[^a-z]/g, '_') === newTicket.vehicle.type) || newTicket.vehicle.type}
                      {newTicket.vehicle.make && ` • ${newTicket.vehicle.make}`}
                    </p>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  {/* Driver */}
                  <div className="flex justify-between py-2 bg-gray-50 -mx-4 px-4">
                    <span className="text-gray-500">Driver</span>
                    <span className="font-medium text-gray-900">{getDriverFullName()}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">License/ID</span>
                    <span className="font-medium text-gray-900 font-mono">
                      {newTicket.driver.licenseNumber || newTicket.driver.idNumber || 'N/A'}
                    </span>
                  </div>
                  {newTicket.driver.phone && (
                    <div className="flex justify-between py-2 bg-gray-50 -mx-4 px-4">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-medium text-gray-900">{newTicket.driver.phone}</span>
                    </div>
                  )}

                  {/* Violations */}
                  <div className="py-2">
                    <p className="text-gray-500 mb-2">Violations ({newTicket.offences.length})</p>
                    <div className="space-y-2">
                      {newTicket.offences.map(o => (
                        <div key={o.id} className="flex justify-between items-center bg-gray-100 p-3">
                          <span className="text-sm font-medium text-gray-900">{o.name}</span>
                          <span className="font-bold" style={{ color: '#1A1F3A' }}>{formatCurrency(o.fine)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Photos */}
                  {newTicket.photos.length > 0 && (
                    <div className="py-2 bg-gray-50 -mx-4 px-4 mt-2">
                      <p className="text-gray-500 mb-2">Evidence Photos ({newTicket.photos.length})</p>
                      <div className="flex gap-2">
                        {newTicket.photos.map((photo, i) => (
                        <div key={photo.id} className="w-16 h-16 overflow-hidden bg-gray-200">
                            <img src={photo.uri} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="pt-4 bg-gray-100 -mx-4 px-4 -mb-4 pb-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Fine</span>
                      <span className="text-2xl font-bold text-[#1A1F3A]">{formatCurrency(getTotalFine())}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="bg-gray-100 p-4 flex items-center justify-center gap-4">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="Ticket QR Code" className="w-20 h-20" />
                  ) : (
                    <div className="w-20 h-20 bg-white flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs text-gray-500">TICKET NUMBER</p>
                    <p className="font-mono font-bold text-[#1A1F3A] text-lg">{ticketNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">Scan to verify</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Thermal Printer Preview - Compact B&W receipt format */
              <div className="flex justify-center bg-gray-100 py-4">
                <TicketReceipt
                  ticket={{
                    ticketNumber: ticketNumber,
                    createdAt: new Date().toISOString(),
                    vehicle: {
                      registrationNumber: newTicket.vehicle.registrationNumber || 'UNKNOWN',
                      type: newTicket.vehicle.type,
                      color: newTicket.vehicle.color,
                      make: newTicket.vehicle.make,
                    },
                    driver: newTicket.driver,
                    offences: newTicket.offences,
                    officer: {
                      name: user?.fullName || 'GPS Officer',
                      badgeNumber: user?.officer?.badgeNumber || 'GPS-0000',
                    },
                    location: newTicket.location,
                    notes: newTicket.notes,
                  }}
                  qrCodeUrl={qrCodeDataUrl || undefined}
                  className="shadow-md"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex-shrink-0 bg-gray-100 p-2 pb-safe border-t border-gray-200">
        <div className="flex gap-2">
          {step === 3 ? (
            <>
              <button
                onClick={handleBack}
                className="flex-1 h-12 text-gray-900 font-bold bg-white border border-gray-300 rounded-md shadow-sm"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-[2] h-12 bg-[#F9A825] text-[#1A1F3A] font-bold rounded-md"
              >
                Next
              </button>
            </>
          ) : step === 4 ? (
            <>
              <button
                onClick={handleBack}
                className="flex-1 h-12 text-gray-900 font-bold bg-white border border-gray-300 rounded-md shadow-sm"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-[2] h-12 bg-[#F9A825] text-[#1A1F3A] font-bold flex items-center justify-center gap-2 disabled:opacity-50 rounded-md"
              >
                <Printer className="h-5 w-5" />
                Issue & Print
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                className="flex-1 h-12 text-gray-900 font-bold bg-white border border-gray-300 rounded-md shadow-sm"
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              <button
                onClick={handleNext}
                disabled={step === 2 ? !isStep2Valid : false}
                className="flex-[2] h-12 bg-[#F9A825] text-[#1A1F3A] font-bold flex items-center justify-center gap-2 disabled:opacity-50 rounded-md"
              >
                Next
                <Check className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black">
          <video
            ref={camera.videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={camera.canvasRef} className="hidden" />
          
          {/* OCR Overlay */}
          {cameraMode === 'ocr' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[85%] aspect-[1.586] border-2 border-white/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#F9A825]" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#F9A825]" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#F9A825]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#F9A825]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/80 text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                    Align ID Card Here
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isScanning && (
            <div className="absolute inset-0 z-50 bg-black/50 flex flex-col items-center justify-center">
              <LoadingSpinner size="lg" className="[&_svg]:text-[#F9A825]" />
              <p className="text-white mt-4 font-medium">Scanning ID...</p>
            </div>
          )}
          
          {/* Camera Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-safe bg-gradient-to-t from-black/80">
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={() => {
                  setShowCamera(false);
                  camera.stopCamera();
                  setIsScanning(false);
                }}
                disabled={isScanning}
                aria-label="Close camera"
                className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center disabled:opacity-50"
              >
                <X className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={capturePhoto}
                disabled={isScanning}
                aria-label="Take photo"
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-50"
              >
                <div className={cn(
                  "w-16 h-16 rounded-full border-4",
                  cameraMode === 'ocr' ? "border-blue-500" : "border-[#1A1F3A]"
                )} />
              </button>
              <button
                onClick={camera.switchCamera}
                disabled={isScanning}
                aria-label="Switch camera"
                className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center disabled:opacity-50"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Violation Modal */}
      {showCustomViolation && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
          <div className="bg-white w-full p-6 pb-safe animate-slideUp">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Custom Violation</h3>
              <button onClick={() => setShowCustomViolation(false)} aria-label="Close" className="p-2 -mr-2">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <input
                  type="text"
                  value={customViolation.name}
                  onChange={(e) => setCustomViolation(v => ({ ...v, name: e.target.value }))}
                  placeholder="e.g., Overloaded vehicle"
                  className="w-full h-12 px-4 bg-gray-100 focus:bg-gray-50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Fine Amount (GHS)</label>
                <input
                  type="number"
                  value={customViolation.fine || ''}
                  onChange={(e) => setCustomViolation(v => ({ ...v, fine: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full h-12 px-4 bg-gray-100 focus:bg-gray-50"
                />
              </div>
              <button
                onClick={addCustomViolation}
                disabled={!customViolation.name || customViolation.fine <= 0}
                className="w-full h-14 bg-[#F9A825] text-[#1A1F3A] font-bold disabled:opacity-50"
              >
                Add Violation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Cancel Ticket?</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to cancel? All entered data will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 h-12 text-gray-900 font-bold bg-gray-100 border border-gray-200 rounded-md"
              >
                Keep Editing
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 h-12 bg-red-600 text-white font-bold rounded-md shadow-sm"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Screen - After Ticket Generated */}
      {showSuccessScreen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#F9FAFB' }}>
          {/* Success Header */}
          <div 
            className="px-4 py-3 flex-shrink-0 flex items-center justify-between"
            style={{ backgroundColor: '#059669' }}
          >
            <div className="flex items-center gap-3 text-white">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight">Ticket Issued</h2>
                <p className="text-emerald-100 text-xs">Ready to print</p>
              </div>
            </div>
            {/* Ticket Number (Small) */}
            <div className="text-right">
              <p className="text-emerald-100 text-[10px] uppercase tracking-wider">Ticket No.</p>
              <p className="text-white font-mono font-bold text-sm">{ticketNumber}</p>
            </div>
          </div>

          {/* Scrollable Print Preview */}
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-100">
            <div className="flex items-center justify-center mb-2">
              <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-medium">
                Thermal Print Preview
              </span>
            </div>
            
            <TicketReceipt
              ticket={{
                ticketNumber: ticketNumber,
                createdAt: new Date().toISOString(),
                vehicle: {
                  registrationNumber: newTicket.vehicle.registrationNumber || 'UNKNOWN',
                  type: newTicket.vehicle.type,
                  color: newTicket.vehicle.color,
                  make: newTicket.vehicle.make,
                },
                driver: newTicket.driver,
                offences: newTicket.offences,
                officer: {
                  name: user?.fullName || 'GPS Officer',
                  badgeNumber: user?.officer?.badgeNumber || 'GPS-0000',
                },
                location: newTicket.location,
                notes: newTicket.notes,
              }}
              qrCodeUrl={qrCodeDataUrl || undefined}
              className="mx-auto"
            />
          </div>

          {/* Action Buttons */}
          <div 
            className="flex-shrink-0 p-4 space-y-3 bg-white"
          >
            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="w-full h-14 flex items-center justify-center gap-3 font-bold text-lg"
              style={{ 
                backgroundColor: '#1A1F3A',
                color: '#FFFFFF'
              }}
            >
              <Printer className="h-6 w-6" />
              Print Ticket
            </button>

            {/* New Ticket / Done Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccessScreen(false);
                  resetNewTicket();
                  setStep(1);
                  // Generate new ticket number
                  const num = `GPS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
                  setTicketNumber(num);
                }}
                className="flex-1 h-12 font-semibold"
                style={{ 
                  backgroundColor: '#F9A825',
                  color: '#1A1F3A'
                }}
              >
                Issue Another
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 h-12 font-semibold bg-gray-100 text-gray-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewTicketPage;
