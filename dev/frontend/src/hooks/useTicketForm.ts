/**
 * useTicketForm Hook
 * 
 * Encapsulates ticket creation form logic including:
 * - Step navigation
 * - Form validation
 * - Photo capture
 * - Location management
 * - QR code generation
 * - Ticket submission
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useTicketStore, useAuthStore, useActiveOffences } from '@/store';
import { useCamera } from '@/hooks/useCamera';
import { useLocation as useGeoLocation } from '@/hooks/useLocation';
import { usePrinter } from '@/hooks/usePrinter';
import { printTicket } from '@/lib/utils/print';
import { scanIdCard } from '@/lib/utils/ocr';
import type { OffenceCategory } from '@/types/offence.types';

export interface UseTicketFormOptions {
  /** Number of steps in the wizard */
  totalSteps?: number;
  /** Callback when ticket is successfully submitted */
  onSubmitSuccess?: (ticketNumber: string) => void;
}

export interface ViolationItem {
  id: string;
  name: string;
  fine: number;
  icon: React.ComponentType<{ className?: string }>;
  category: OffenceCategory;
  code?: string;
}

export function useTicketForm(options: UseTicketFormOptions = {}) {
  const { totalSteps = 4 } = options;
  const navigate = useNavigate();
  
  // Stores
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
    submitTicket,
  } = useTicketStore();
  
  // Hooks
  const camera = useCamera();
  const geoLocation = useGeoLocation();
  const printer = usePrinter();
  
  // Local state
  const [step, setStep] = useState(1);
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('gps');
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'evidence' | 'ocr'>('evidence');
  const [isScanning, setIsScanning] = useState(false);
  
  // Dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCustomViolation, setShowCustomViolation] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  
  // Custom violation form
  const [customViolation, setCustomViolation] = useState({ name: '', fine: 0 });

  // Generate ticket number on mount
  useEffect(() => {
    const num = `GPS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    setTicketNumber(num);
  }, []);

  // Generate QR code when reaching final step
  useEffect(() => {
    if (step === totalSteps && ticketNumber) {
      const qrData = JSON.stringify({
        ticket: ticketNumber,
        vehicle: newTicket.vehicle.registrationNumber,
        fine: getTotalFine(),
        date: new Date().toISOString().split('T')[0],
      });
      QRCode.toDataURL(qrData, { width: 150, margin: 1 })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [step, ticketNumber, newTicket.vehicle.registrationNumber, getTotalFine, totalSteps]);

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
  }, [geoLocation, setLocation]);

  // Validation
  const isVehicleValid = useMemo(() => 
    !!newTicket.vehicle.registrationNumber && 
    newTicket.vehicle.registrationNumber.length >= 6,
    [newTicket.vehicle.registrationNumber]
  );

  const isDriverValid = useMemo(() => 
    !!newTicket.driver.firstName && 
    !!newTicket.driver.lastName && 
    (!!newTicket.driver.licenseNumber || !!newTicket.driver.idNumber),
    [newTicket.driver]
  );

  const isStep1Valid = isVehicleValid && isDriverValid;
  const isStep2Valid = newTicket.offences.length > 0;
  const canSubmit = isStep1Valid && isStep2Valid;

  const getStepValidation = useCallback((stepNumber: number) => {
    switch (stepNumber) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return true; // Photos are optional
      case 4: return canSubmit;
      default: return true;
    }
  }, [isStep1Valid, isStep2Valid, canSubmit]);

  // Navigation
  const handleNext = useCallback(() => {
    if (!getStepValidation(step)) {
      setHasAttemptedNext(true);
      return;
    }
    if (step < totalSteps) {
      setStep(s => s + 1);
      setCurrentStep(step);
      setHasAttemptedNext(false);
    }
  }, [step, totalSteps, getStepValidation, setCurrentStep]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(s => s - 1);
      setCurrentStep(step - 2);
    } else {
      setShowCancelDialog(true);
    }
  }, [step, setCurrentStep]);

  const handleCancel = useCallback(() => {
    setShowCancelDialog(true);
  }, []);

  const confirmCancel = useCallback(() => {
    resetNewTicket();
    navigate('/handheld');
  }, [resetNewTicket, navigate]);

  // Violation management
  const isViolationSelected = useCallback(
    (id: string) => newTicket.offences.some(o => o.id === id),
    [newTicket.offences]
  );

  const toggleViolation = useCallback((violation: ViolationItem) => {
    if (isViolationSelected(violation.id)) {
      removeOffence(violation.id);
    } else {
      addOffence({
        id: violation.id,
        name: violation.name,
        fine: violation.fine,
        category: violation.category,
      });
    }
  }, [isViolationSelected, addOffence, removeOffence]);

  const addCustomViolationHandler = useCallback(() => {
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
  }, [customViolation, addOffence]);

  // Camera and OCR
  const handleScanId = useCallback(() => {
    setCameraMode('ocr');
    setShowCamera(true);
    camera.startCamera();
  }, [camera]);

  const handleOpenCamera = useCallback(() => {
    setCameraMode('evidence');
    setShowCamera(true);
    camera.startCamera();
  }, [camera]);

  const capturePhoto = useCallback(async () => {
    if (cameraMode === 'ocr') {
      setIsScanning(true);
      try {
        const photo = await camera.capturePhoto({ type: 'evidence' });
        if (photo) {
          const response = await fetch(photo.uri);
          const blob = await response.blob();
          const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
          
          const result = await scanIdCard(file);
          
          if (result) {
            setDriver({
              firstName: result.firstName || newTicket.driver.firstName,
              lastName: result.lastName || newTicket.driver.lastName,
              idNumber: result.idNumber || newTicket.driver.idNumber,
              idType: result.idNumber?.startsWith('GHA') ? 'ghana_card' : newTicket.driver.idType,
            });
          }
        }
      } catch (error) {
        console.error('OCR Error:', error);
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
  }, [cameraMode, camera, addPhoto, setDriver, newTicket.driver]);

  const closeCamera = useCallback(() => {
    setShowCamera(false);
    camera.stopCamera();
  }, [camera]);

  // Helper functions
  const getDriverFullName = useCallback(() => {
    const { firstName, lastName } = newTicket.driver;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return 'Not provided';
  }, [newTicket.driver]);

  // Submit ticket
  const handleSubmit = useCallback(() => {
    const submittedTicket = submitTicket({
      id: user?.id || 'unknown',
      name: user?.fullName || 'GPS Officer',
      badgeNumber: user?.officer?.badgeNumber,
      stationId: user?.officer?.stationId,
      stationName: user?.officer?.station?.name,
      regionId: user?.officer?.regionId,
      regionName: user?.officer?.station?.regionName,
    });
    
    setTicketNumber(submittedTicket.ticketNumber);
    setShowSuccessScreen(true);
  }, [submitTicket, user]);

  // Print ticket
  const handlePrint = useCallback(async () => {
    const locationString = locationMode === 'manual' && newTicket.location.address
      ? newTicket.location.address
      : geoLocation.location 
        ? `${geoLocation.location.latitude.toFixed(4)}°N, ${geoLocation.location.longitude.toFixed(4)}°W`
        : undefined;

    const ticketData = {
      ticketNumber,
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
      notes: newTicket.notes,
    };

    if (printer.isConnected) {
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
          { type: 'text', text: `DRIVER: ${ticketData.driver}` },
          { type: 'line', style: 'double' },
          { type: 'text', text: `TOTAL: GHc${ticketData.totalFine.toFixed(2)}`, align: 'right', bold: true, size: 'large' },
          { type: 'line', style: 'double' },
          { type: 'feed', lines: 2 },
        ],
      };
      await printer.print(job);
    } else {
      printTicket(ticketData);
    }
  }, [
    ticketNumber, newTicket, geoLocation.location, locationMode,
    getDriverFullName, getTotalFine, printer, user,
  ]);

  // Finish and reset
  const handleFinish = useCallback(() => {
    resetNewTicket();
    navigate('/handheld');
  }, [resetNewTicket, navigate]);

  return {
    // Step management
    step,
    totalSteps,
    handleNext,
    handleBack,
    hasAttemptedNext,
    
    // Form data
    newTicket,
    ticketNumber,
    qrCodeDataUrl,
    
    // Setters
    setVehicle,
    setDriver,
    setNotes,
    setLocation,
    
    // Location
    locationMode,
    setLocationMode,
    geoLocation,
    
    // Violations
    activeOffences,
    isViolationSelected,
    toggleViolation,
    addOffence,
    removeOffence,
    getTotalFine,
    
    // Custom violation
    showCustomViolation,
    setShowCustomViolation,
    customViolation,
    setCustomViolation,
    addCustomViolation: addCustomViolationHandler,
    
    // Photos
    photos: newTicket.photos,
    addPhoto,
    removePhoto,
    
    // Camera
    camera,
    showCamera,
    setShowCamera,
    cameraMode,
    isScanning,
    handleScanId,
    handleOpenCamera,
    capturePhoto,
    closeCamera,
    
    // Dialogs
    showCancelDialog,
    setShowCancelDialog,
    showPrintPreview,
    setShowPrintPreview,
    showSuccessScreen,
    setShowSuccessScreen,
    
    // Actions
    handleCancel,
    confirmCancel,
    handleSubmit,
    handlePrint,
    handleFinish,
    
    // Validation
    isVehicleValid,
    isDriverValid,
    isStep1Valid,
    isStep2Valid,
    canSubmit,
    getStepValidation,
    
    // Helpers
    getDriverFullName,
    
    // User and printer
    user,
    printer,
  };
}

export type UseTicketFormReturn = ReturnType<typeof useTicketForm>;
