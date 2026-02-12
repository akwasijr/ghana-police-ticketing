/**
 * VehicleDriverStep Component
 * 
 * Step 1: Collect vehicle and driver information
 */

import React, { useCallback } from 'react';
import { Car, User, Scan } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTicketStore } from '@/store';
import { VEHICLE_TYPES } from './types';

interface VehicleDriverStepProps {
  hasAttemptedNext: boolean;
  onScanId: () => void;
}

export const VehicleDriverStep = React.memo<VehicleDriverStepProps>(({
  hasAttemptedNext,
  onScanId,
}) => {
  const { newTicket, setVehicle, setDriver } = useTicketStore();

  const isVehicleValid = !!newTicket.vehicle.registrationNumber && 
    newTicket.vehicle.registrationNumber.length >= 6;
  const isDriverValid = !!newTicket.driver.firstName && 
    !!newTicket.driver.lastName &&
    (!!newTicket.driver.licenseNumber || !!newTicket.driver.idNumber);

  const handleVehicleChange = useCallback((field: string, value: string) => {
    setVehicle({ [field]: value });
  }, [setVehicle]);

  const handleDriverChange = useCallback((field: string, value: string) => {
    setDriver({ [field]: value });
  }, [setDriver]);

  return (
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
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Registration Number *
          </label>
          <input
            type="text"
            value={newTicket.vehicle.registrationNumber || ''}
            onChange={(e) => handleVehicleChange('registrationNumber', e.target.value.toUpperCase())}
            placeholder="GR-1234-24"
            className={cn(
              'w-full h-14 px-4 text-lg font-mono text-center uppercase tracking-wider transition-colors',
              isVehicleValid
                ? 'bg-green-100'
                : hasAttemptedNext && !newTicket.vehicle.registrationNumber
                  ? 'bg-red-50 border border-red-300'
                  : 'bg-gray-100 focus:bg-gray-50'
            )}
          />
          {hasAttemptedNext && !isVehicleValid && (
            <p className="text-xs text-red-600 mt-1">
              Please enter a valid registration number (min 6 characters)
            </p>
          )}
        </div>

        {/* Vehicle Type & Color */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Type *</label>
            <select
              value={newTicket.vehicle.type || ''}
              onChange={(e) => handleVehicleChange('type', e.target.value)}
              className="w-full h-12 px-3 bg-gray-100 focus:bg-gray-50 text-base"
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
              onChange={(e) => handleVehicleChange('color', e.target.value)}
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
            onChange={(e) => handleVehicleChange('make', e.target.value)}
            placeholder="e.g. Toyota Corolla"
            className="w-full h-12 px-3 bg-gray-100 focus:bg-gray-50 text-base"
          />
        </div>
      </div>

      {/* Driver Section */}
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
            onClick={onScanId}
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
              onChange={(e) => handleDriverChange('firstName', e.target.value)}
              placeholder="First name"
              className={cn(
                'w-full h-12 px-3 text-base',
                hasAttemptedNext && !newTicket.driver.firstName
                  ? 'bg-red-50 border border-red-300'
                  : 'bg-gray-100 focus:bg-gray-50'
              )}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Last Name *</label>
            <input
              type="text"
              value={newTicket.driver.lastName || ''}
              onChange={(e) => handleDriverChange('lastName', e.target.value)}
              placeholder="Last name"
              className={cn(
                'w-full h-12 px-3 text-base',
                hasAttemptedNext && !newTicket.driver.lastName
                  ? 'bg-red-50 border border-red-300'
                  : 'bg-gray-100 focus:bg-gray-50'
              )}
            />
          </div>
        </div>

        {/* License Number */}
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Driver License # *
          </label>
          <input
            type="text"
            value={newTicket.driver.licenseNumber || ''}
            onChange={(e) => handleDriverChange('licenseNumber', e.target.value.toUpperCase())}
            placeholder="e.g. DL-123456"
            className={cn(
              'w-full h-12 px-3 font-mono text-base',
              hasAttemptedNext && !isDriverValid
                ? 'bg-red-50 border border-red-300'
                : 'bg-gray-100 focus:bg-gray-50'
            )}
          />
        </div>

        {/* Ghana Card / ID */}
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Ghana Card / ID (Alternative)
          </label>
          <input
            type="text"
            value={newTicket.driver.idNumber || ''}
            onChange={(e) => handleDriverChange('idNumber', e.target.value.toUpperCase())}
            placeholder="GHA-123456789-0"
            className="w-full h-12 px-3 font-mono bg-gray-100 focus:bg-gray-50 text-base"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Phone Number
          </label>
          <input
            type="tel"
            value={newTicket.driver.phone || ''}
            onChange={(e) => handleDriverChange('phone', e.target.value)}
            placeholder="0XX XXX XXXX"
            className="w-full h-12 px-3 bg-gray-100 focus:bg-gray-50 text-base"
          />
        </div>

        {hasAttemptedNext && !isDriverValid && (
          <p className="text-xs text-red-600 mt-3">
            Please provide driver name and either license number or ID
          </p>
        )}
      </div>
    </div>
  );
});

VehicleDriverStep.displayName = 'VehicleDriverStep';

export default VehicleDriverStep;
