/**
 * ViolationSelectStep Component
 * 
 * Step 2: Select one or more traffic violations
 */

import React, { useMemo, useCallback } from 'react';
import { Check, Pencil } from 'lucide-react';
import { useTicketStore, useActiveOffences } from '@/store';
import { formatCurrency } from '@/lib/utils/formatting';
import { OFFENCE_ICONS, CATEGORY_ICONS, type ViolationItem } from './types';
import { AlertTriangle } from 'lucide-react';

interface ViolationSelectStepProps {
  onShowCustomViolation: () => void;
}

export const ViolationSelectStep = React.memo<ViolationSelectStepProps>(({
  onShowCustomViolation,
}) => {
  const activeOffences = useActiveOffences();
  const { newTicket, addOffence, removeOffence, getTotalFine } = useTicketStore();

  // Map offence store data to UI format with icons
  const violations: ViolationItem[] = useMemo(() => {
    return activeOffences.map(offence => ({
      id: offence.id,
      name: offence.name,
      fine: offence.defaultFine,
      icon: OFFENCE_ICONS[offence.id] || CATEGORY_ICONS[offence.category] || AlertTriangle,
      category: offence.category,
      code: offence.code,
    }));
  }, [activeOffences]);

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

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-gray-900">Select Violation Type</h2>
        <p className="text-sm text-gray-500">Tap to select one or more violations</p>
      </div>

      {/* Selected Violations Summary */}
      {newTicket.offences.length > 0 && (
        <div className="bg-[#1A1F3A] rounded-none p-4 text-white">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-sm font-medium">
              {newTicket.offences.length} violation{newTicket.offences.length > 1 ? 's' : ''} selected
            </span>
            <span className="text-xl font-bold text-[#F9A825]">
              {formatCurrency(getTotalFine())}
            </span>
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

      {/* Violations Grid */}
      <div className="grid grid-cols-2 gap-3">
        {violations.map((violation) => {
          const Icon = violation.icon;
          const selected = isViolationSelected(violation.id);
          return (
            <button
              key={violation.id}
              onClick={() => toggleViolation(violation)}
              className={`relative p-4 text-left transition-all active:scale-[0.98] ${
                selected ? 'bg-primary-blue' : 'bg-white'
              }`}
            >
              {/* Selection Indicator */}
              {selected && (
                <div className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center bg-primary-yellow">
                  <Check className="h-5 w-5 stroke-[3] text-primary-blue" />
                </div>
              )}

              {/* Icon + Text */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 flex items-center justify-center flex-shrink-0 ${
                    selected ? 'bg-primary-yellow' : 'bg-primary-blue'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      selected ? 'text-primary-blue' : 'text-primary-yellow'
                    }`}
                  />
                </div>
                <p
                  className={`font-medium text-sm leading-tight ${
                    selected ? 'text-primary-yellow' : 'text-gray-900'
                  }`}
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
        onClick={onShowCustomViolation}
        className="w-full p-4 flex items-center justify-center gap-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <Pencil className="h-5 w-5" />
        <span className="font-semibold">Add Custom Violation</span>
      </button>
    </div>
  );
});

ViolationSelectStep.displayName = 'ViolationSelectStep';

export default ViolationSelectStep;
