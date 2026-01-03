import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string | number;
  title: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  variant?: 'dots' | 'numbered' | 'full';
  isHandheld?: boolean;
  className?: string;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  currentStep,
  variant = 'dots',
  isHandheld = false,
  className,
}) => {
  // Dots variant - compact, for handheld
  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          
          return (
            <div
              key={step.id}
              className={cn(
                'transition-all duration-300',
                isActive
                  ? 'w-6 h-2 rounded-sm'
                  : 'w-2 h-2 rounded-full',
                isCompleted
                  ? isHandheld ? 'bg-status-success' : 'bg-status-success'
                  : isActive
                    ? isHandheld ? 'bg-primary-yellow' : 'bg-primary-blue'
                    : isHandheld ? 'bg-[#3A4060]' : 'bg-surface-border'
              )}
            />
          );
        })}
      </div>
    );
  }

  // Numbered variant - shows step numbers
  if (variant === 'numbered') {
    return (
      <div className={cn('flex items-center justify-between', className)}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isLast = index === steps.length - 1;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                    isCompleted
                      ? 'bg-status-success text-white'
                      : isActive
                        ? isHandheld
                          ? 'bg-primary-yellow text-primary-blue'
                          : 'bg-primary-blue text-white'
                        : isHandheld
                          ? 'bg-[#1E2340] text-white/50 border border-[#3A4060]'
                          : 'bg-surface-elevated text-text-muted border border-surface-border'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium text-center max-w-[80px]',
                    isActive
                      ? isHandheld ? 'text-white' : 'text-text-primary'
                      : isHandheld ? 'text-white/50' : 'text-text-secondary'
                  )}
                >
                  {step.title}
                </span>
              </div>
              
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2',
                    isCompleted
                      ? 'bg-status-success'
                      : isHandheld ? 'bg-[#3A4060]' : 'bg-surface-border'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Full variant - shows title and description
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        
        return (
          <div
            key={step.id}
            className={cn(
              'flex items-start gap-4 p-4 rounded-lg transition-colors',
              isActive
                ? isHandheld
                  ? 'bg-[#1E2340] border border-primary-yellow'
                  : 'bg-primary-blue/5 border border-primary-blue'
                : 'bg-transparent'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
                isCompleted
                  ? 'bg-status-success text-white'
                  : isActive
                    ? isHandheld
                      ? 'bg-primary-yellow text-primary-blue'
                      : 'bg-primary-blue text-white'
                    : isHandheld
                      ? 'bg-[#1E2340] text-white/50 border border-[#3A4060]'
                      : 'bg-surface-elevated text-text-muted border border-surface-border'
              )}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={cn(
                  'font-semibold',
                  isActive
                    ? isHandheld ? 'text-white' : 'text-text-primary'
                    : isCompleted
                      ? isHandheld ? 'text-white/70' : 'text-text-secondary'
                      : isHandheld ? 'text-white/50' : 'text-text-muted'
                )}
              >
                {step.title}
              </h4>
              {step.description && (
                <p
                  className={cn(
                    'text-sm mt-1',
                    isHandheld ? 'text-white/50' : 'text-text-secondary'
                  )}
                >
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressSteps;
