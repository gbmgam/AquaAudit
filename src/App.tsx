import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from './context/AuthContext.tsx';
import {
  MeterReading,
  SimulationConfig,
  NavigationTab,
  BuildingSettings,
  SavedReport,
} from './types.ts';
import { simulateMeterReadings } from './lib/simulator.ts';
import { validateMeterReadings } from './lib/validation.ts';
import { detectNightFlowLoss } from './lib/detector.ts';
import { ReportService } from './lib/reports.ts';

// Pages
import { LoginPage } from './pages/LoginPage.tsx';
import { SignupPage } from './pages/SignupPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { DashboardOverview } from './pages/DashboardOverview.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { HelpPage } from './pages/HelpPage.tsx';

// Components
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DataPanel } from './components/DataPanel.tsx';
import { ResultPanel } from './components/ResultPanel.tsx';
import { NightFlowChart } from './components/NightFlowChart.tsx';
import { InspectionTicket } from './components/InspectionTicket.tsx';
import { DetectionTest } from './components/DetectionTest.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { LogoutConfirmModal } from './components/LogoutConfirmModal.tsx';

import { ShieldAlert } from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'aquaaudit_building_settings';
const ONBOARDING_SEEN_KEY = 'aquaaudit_onboarding_dismissed';

export default function App() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Auth routing state
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot_password'>('login');

  // Navigation tab
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Building & User Settings
  const [settings, setSettings] = useState<BuildingSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore
    }
    return {
      userName: 'Rohan Sharma',
      buildingName: 'Greenwood PG & Hostel (Block A)',
      residents: 100,
      waterPrice: 30,
      currency: 'INR',
      defaultDataSource: 'demo',
      notifyEmailAlerts: true,
      notifyWeeklySummary: false,
    };
  });

  // Data source & simulation configuration
  const [dataSource, setDataSource] = useState<'demo' | 'csv'>(settings.defaultDataSource);
  const [simConfig, setSimConfig] = useState<SimulationConfig>({
    residents: settings.residents,
    leakSize: 60,
    missedReadingsPct: 5,
    waterPrice: settings.waterPrice,
    seed: 42,
    totalDays: 60,
    leakStartDay: 30,
    initialMeterLitres: 100000,
  });

  // CSV upload state
  const [uploadedReadings, setUploadedReadings] = useState<MeterReading[] | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);

  // Reports state for active user
  const [reports, setReports] = useState<SavedReport[]>([]);

  // Check onboarding on initial authenticated load
  useEffect(() => {
    if (isAuthenticated && user) {
      try {
        const seen = localStorage.getItem(ONBOARDING_SEEN_KEY);
        if (!seen) {
          setOnboardingOpen(true);
        }
      } catch {
        // Ignore
      }

      // Seed initial report if empty for demo onboarding
      ReportService.seedInitialReportIfEmpty(user.id, user.buildingName || settings.buildingName);
      setReports(ReportService.getReportsForUser(user.id));
    }
  }, [isAuthenticated, user, settings.buildingName]);

  const refreshReports = () => {
    if (user) {
      setReports(ReportService.getReportsForUser(user.id));
    }
  };

  const handleDismissOnboarding = () => {
    setOnboardingOpen(false);
    try {
      localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  const handleSaveSettings = (newSettings: BuildingSettings) => {
    setSettings(newSettings);
    setSimConfig(prev => ({
      ...prev,
      residents: newSettings.residents,
      waterPrice: newSettings.waterPrice,
    }));
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch {
      // Ignore
    }
  };

  // Active raw readings
  const activeReadings = useMemo(() => {
    if (dataSource === 'csv' && uploadedReadings && uploadedReadings.length > 0) {
      return uploadedReadings;
    }
    return simulateMeterReadings(simConfig);
  }, [dataSource, uploadedReadings, simConfig]);

  // Chronological validation
  const validationResult = useMemo(() => {
    return validateMeterReadings(activeReadings);
  }, [activeReadings]);

  // Statistical detector evaluation
  const detectionSummary = useMemo(() => {
    return detectNightFlowLoss(validationResult.validatedReadings, simConfig.waterPrice);
  }, [validationResult, simConfig.waterPrice]);

  const handleCsvUploaded = (readings: MeterReading[], filename: string) => {
    setUploadedReadings(readings);
    setCsvFileName(filename);
    setDataSource('csv');
  };

  // If loading session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading AquaAudit...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated: Render Login / Signup / Recovery
  if (!isAuthenticated) {
    if (authView === 'signup') {
      return <SignupPage onNavigateToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot_password') {
      return <ForgotPasswordPage onNavigateToLogin={() => setAuthView('login')} />;
    }
    return (
      <LoginPage
        onNavigateToSignup={() => setAuthView('signup')}
        onNavigateToForgotPassword={() => setAuthView('forgot_password')}
      />
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Prominent Yellow Banner for Demo Mode (Mandatory) */}
      {dataSource === 'demo' && (
        <div className="bg-amber-400 text-amber-950 font-black text-xs md:text-sm tracking-wider uppercase py-2 px-4 text-center sticky top-0 z-50 shadow-sm border-b border-amber-500/80 flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-950 shrink-0" />
          <span>SIMULATED DATA</span>
          <span className="hidden sm:inline font-semibold text-amber-900 text-xs normal-case tracking-normal">
            — Demonstration mode with synthetic consumption timeline
          </span>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Application Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            dataSource={dataSource}
            onSelectTab={setActiveTab}
          />

          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {/* View Tab 1: Dashboard Overview */}
            {activeTab === 'dashboard' && (
              <DashboardOverview
                summary={detectionSummary}
                validationResult={validationResult}
                dataSource={dataSource}
                waterPrice={simConfig.waterPrice}
                onNavigateTab={setActiveTab}
                savedReportsCount={reports.length}
              />
            )}

            {/* View Tab 2: Water Data Panel */}
            {activeTab === 'data' && (
              <section aria-labelledby="step-1-heading" className="space-y-6">
                <DataPanel
                  dataSource={dataSource}
                  onDataSourceChange={setDataSource}
                  simConfig={simConfig}
                  onSimConfigChange={setSimConfig}
                  validationResult={validationResult}
                  csvFileName={csvFileName}
                  onCsvUploaded={handleCsvUploaded}
                  rawReadings={activeReadings}
                />
              </section>
            )}

            {/* View Tab 3: Results & Night Flow Charts */}
            {activeTab === 'results' && (
              <section aria-labelledby="step-2-heading" className="space-y-6">
                <ResultPanel
                  summary={detectionSummary}
                  waterPrice={simConfig.waterPrice}
                  onWaterPriceChange={price =>
                    setSimConfig(prev => ({ ...prev, waterPrice: price }))
                  }
                />
                <NightFlowChart days={detectionSummary.days} />
                <DetectionTest />
              </section>
            )}

            {/* View Tab 4: Inspection Tickets */}
            {activeTab === 'tickets' && (
              <section aria-labelledby="step-3-heading" className="space-y-6">
                <InspectionTicket
                  summary={detectionSummary}
                  waterPrice={simConfig.waterPrice}
                  buildingName={user?.buildingName || settings.buildingName}
                  dataSource={dataSource === 'demo' ? 'simulated' : 'uploaded'}
                  onReportSaved={refreshReports}
                />
              </section>
            )}

            {/* View Tab 5: Reports Archive */}
            {activeTab === 'reports' && (
              <section aria-labelledby="reports-heading">
                <ReportsPage
                  reports={reports}
                  onRefreshReports={refreshReports}
                  onNavigateToTickets={() => setActiveTab('tickets')}
                />
              </section>
            )}

            {/* View Tab 6: Settings & Property Profile */}
            {activeTab === 'settings' && (
              <section aria-labelledby="settings-heading">
                <SettingsPage
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                />
              </section>
            )}

            {/* View Tab 7: Help & Guide */}
            {activeTab === 'help' && (
              <section aria-labelledby="help-heading">
                <HelpPage onOpenOnboarding={() => setOnboardingOpen(true)} />
              </section>
            )}
          </main>

          {/* Mandatory Honesty Rules in Footer */}
          <footer className="bg-white border-t border-slate-200/80 py-8 px-4 sm:px-6 mt-12 text-center text-xs text-slate-500">
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 text-slate-700 font-semibold max-w-2xl mx-auto text-left sm:text-center">
                <p className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  This tool flags likely water loss; it does not locate the leak or prove one exists.
                </p>
                <p className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  Numbers from the simulator are not real-world performance.
                </p>
              </div>

              <p className="text-[11px] text-slate-400">
                AquaAudit • Deterministic client-side analysis • 100% private, zero telemetry, no remote transmission of meter logs.
              </p>
            </div>
          </footer>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={handleDismissOnboarding}
        onNavigateTab={tab => {
          setActiveTab(tab);
          handleDismissOnboarding();
        }}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal />
    </div>
  );
}
