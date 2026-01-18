/**
 * StepIndicator Component
 * 
 * Displays the progress through ticket creation steps
 */

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TICKET_STEPS } from './types';

interface StepIndicatorProps {
  currentStep: number;
}

export const StepIndicator = React.memo<StepIndicatorProps>(({ currentStep }) => {
  return (
    <>
      <div className="flex items-center justify-center gap-1">
        {TICKET_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          
          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center transition-all rounded-full',
                  isActive ? 'w-8 h-8 bg-[#F9A825]' :
                  isCompleted ? 'w-6 h-6 bg-green-500' :
                  'w-6 h-6 bg-white/20'
                )}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3 text-white" />
                ) : (
                  <span
                    className={cn(
                      'text-xs font-bold',
                      isActive ? 'text-[#1A1F3A]' : 'text-white/60'
                    )}
                  >
                    {step.id}
                  </span>
                )}
              </div>
              {index < TICKET_STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-4 h-0.5 mx-0.5',
                    currentStep > step.id ? 'bg-green-500' : 'bg-white/20'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-white/80 text-xs mt-2">
        Step {currentStep}: {TICKET_STEPS[currentStep - 1].name}
      </p>
    </>
  );
});

StepIndicator.displayName = 'StepIndicator';

export default StepIndicator;
