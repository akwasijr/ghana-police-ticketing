/**
 * ReviewSubmitStep Component
 * 
 * Step 4: Review ticket details and submit/print
 */

import React from 'react';
import { Car, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTicketStore, useAuthStore } from '@/store';
import { formatCurrency } from '@/lib/utils/formatting';
import { LoadingSpinner, TicketReceipt } from '@/components/shared';
import { VEHICLE_TYPES } from './types';

interface ReviewSubmitStepProps {
  ticketNumber: string;
  qrCodeDataUrl: string;
  showPrintPreview: boolean;
  onTogglePreview: (show: boolean) => void;
}

export const ReviewSubmitStep = React.memo<ReviewSubmitStepProps>(({
  ticketNumber,
  qrCodeDataUrl,
  showPrintPreview,
  onTogglePreview,
}) => {
  const { user } = useAuthStore();
  const { newTicket, getTotalFine } = useTicketStore();

  const getDriverFullName = () => {
    const { firstName, lastName } = newTicket.driver;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return 'Not provided';
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-gray-900">Review Ticket</h2>
        <p className="text-sm text-gray-500">Confirm all details before printing</p>
      </div>

      {/* Toggle View Buttons */}
      <div className="flex overflow-hidden bg-gray-100">
        <button
          onClick={() => onTogglePreview(false)}
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
          onClick={() => onTogglePreview(true)}
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
                {newTicket.vehicle.color}{' '}
                {VEHICLE_TYPES.find(t => t.toLowerCase().replace(/[^a-z]/g, '_') === newTicket.vehicle.type) || newTicket.vehicle.type}
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
                    <span className="font-bold" style={{ color: '#1A1F3A' }}>
                      {formatCurrency(o.fine)}
                    </span>
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
        /* Thermal Printer Preview */
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
  );
});

ReviewSubmitStep.displayName = 'ReviewSubmitStep';

export default ReviewSubmitStep;
