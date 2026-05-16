'use client';

import { clsx } from 'clsx';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
  sublabel?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export default function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max px-4 py-3 gap-0">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isCompleted && onStepClick?.(step.id)}
                className={clsx(
                  'flex flex-col items-center min-w-[60px] min-h-0 gap-1',
                  isCompleted ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <div
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                    isCompleted && 'bg-green-500 text-white',
                    isActive && 'bg-brand-700 text-white ring-4 ring-brand-100',
                    !isCompleted && !isActive && 'bg-gray-200 text-gray-500',
                  )}
                >
                  {isCompleted ? <Check size={14} /> : step.id}
                </div>
                <span
                  className={clsx(
                    'text-[10px] font-medium text-center leading-tight max-w-[64px]',
                    isActive ? 'text-brand-700' : isCompleted ? 'text-green-600' : 'text-gray-400',
                  )}
                >
                  {step.label}
                </span>
              </button>

              {!isLast && (
                <div
                  className={clsx(
                    'h-0.5 w-8 mx-1 mt-[-14px] transition-colors',
                    isCompleted ? 'bg-green-400' : 'bg-gray-200',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
