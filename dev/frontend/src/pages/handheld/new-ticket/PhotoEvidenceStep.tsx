/**
 * PhotoEvidenceStep Component
 * 
 * Step 3: Capture evidence photos and add location/notes
 */

import React, { useCallback } from 'react';
import { Camera, MapPin, Trash2, Plus, Satellite, Keyboard, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTicketStore } from '@/store';
import { useLocation as useGeoLocation } from '@/hooks/useLocation';

interface PhotoEvidenceStepProps {
  locationMode: 'gps' | 'manual';
  onLocationModeChange: (mode: 'gps' | 'manual') => void;
  onOpenCamera: () => void;
}

export const PhotoEvidenceStep = React.memo<PhotoEvidenceStepProps>(({
  locationMode,
  onLocationModeChange,
  onOpenCamera,
}) => {
  const { newTicket, removePhoto, setLocation, setNotes } = useTicketStore();
  const geoLocation = useGeoLocation();

  const handleRefreshLocation = useCallback(async () => {
    const loc = await geoLocation.getCurrentLocation();
    if (loc) {
      setLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
      });
    }
  }, [geoLocation, setLocation]);

  return (
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
              onClick={onOpenCamera}
              className="aspect-square flex flex-col items-center justify-center text-gray-500 bg-gray-100"
            >
              <Plus className="h-8 w-8" />
              <span className="text-xs mt-1 font-medium">Add</span>
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={onOpenCamera}
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
              onClick={() => onLocationModeChange('gps')}
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
              onClick={() => onLocationModeChange('manual')}
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
                  {geoLocation.location ? (
                    <p className="text-xs text-blue-700 mt-1 font-mono">
                      {geoLocation.location.latitude.toFixed(6)}°N, {geoLocation.location.longitude.toFixed(6)}°W
                    </p>
                  ) : geoLocation.isLoading ? (
                    <p className="text-xs text-blue-600 mt-1">Acquiring location...</p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1">Location unavailable</p>
                  )}
                  {geoLocation.location?.accuracy && (
                    <p className="text-xs text-blue-600 mt-0.5">
                      Accuracy: ±{Math.round(geoLocation.location.accuracy)}m
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {geoLocation.isHighAccuracy && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  <button
                    onClick={handleRefreshLocation}
                    disabled={geoLocation.isLoading}
                    className="p-2 text-blue-700 hover:bg-blue-100 rounded-lg disabled:opacity-50"
                  >
                    <Satellite className={cn("h-4 w-4", geoLocation.isLoading && "animate-spin")} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Location Description
              </label>
              <input
                type="text"
                value={newTicket.location.address || ''}
                onChange={(e) => setLocation({ address: e.target.value })}
                placeholder="e.g., Ring Road Central, near Total Filling Station"
                className="w-full h-12 px-3 bg-gray-100 focus:bg-gray-50 text-base"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Additional Notes (Optional)
          </label>
          <textarea
            value={newTicket.notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details about the incident..."
            rows={3}
            className="w-full px-3 py-2 bg-gray-100 focus:bg-gray-50 text-base resize-none"
          />
        </div>
      </div>
    </div>
  );
});

PhotoEvidenceStep.displayName = 'PhotoEvidenceStep';

export default PhotoEvidenceStep;
