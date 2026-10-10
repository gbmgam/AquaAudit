import React, { useState } from 'react';
import {
  Sparkles,
  Database,
  BarChart2,
  ClipboardCheck,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { NavigationTab } from '../types.ts';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [step, setStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: '1. Add your meter readings',
      desc: 'Log the 11 PM reading before night sleep and the 5 AM reading before morning showers. AquaAudit calculates the 6-hour overnight flow difference.',
      icon: <Database className="w-8 h-8 text-blue-600" />,
      actionTab: 'data' as NavigationTab,
      actionText: 'Go to Water Data',
    },
    {
      num: 2,
      title: '2. Review possible water loss',
      desc: 'Our statistical detector compares recent overnight flow against your median baseline and MAD threshold, filtering out normal variance.',
      icon: <BarChart2 className="w-8 h-8 text-cyan-600" />,
      actionTab: 'results' as NavigationTab,
      actionText: 'View Detection Charts',
    },
    {
      num: 3,
      title: '3. Create an inspection ticket if an alert appears',
      desc: 'If an alert triggers, generate an ordered maintenance ticket to inspect rooftop overhead tank overflow, toilet cistern dye seepage, and wing valves.',
      icon: <ClipboardCheck className="w-8 h-8 text-emerald-600" />,
      actionTab: 'tickets' as NavigationTab,
      actionText: 'Open Inspection Tickets',
    },
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Quick Onboarding Guide</span>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-8 bg-blue-600' : s < step ? 'w-4 bg-blue-300' : 'w-4 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
            {currentStep.icon}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{currentStep.title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            {currentStep.desc}
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            Dismiss Guide
          </button>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab('dashboard');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
