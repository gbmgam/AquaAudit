import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { BuildingSettings } from '../types.ts';
import {
  Settings,
  Building,
  User as UserIcon,
  Users,
  IndianRupee,
  Bell,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  LogOut,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface SettingsPageProps {
  settings: BuildingSettings;
  onSaveSettings: (settings: BuildingSettings) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSaveSettings }) => {
  const { user, updateProfile, logout } = useAuth();

  const [form, setForm] = useState<BuildingSettings>({ ...settings });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!form.userName.trim()) {
      setErrorMessage('User name cannot be empty.');
      return;
    }
    if (!form.buildingName.trim()) {
      setErrorMessage('Building or property name cannot be empty.');
      return;
    }
    if (form.residents <= 0 || !Number.isInteger(form.residents)) {
      setErrorMessage('Number of residents must be a positive integer.');
      return;
    }
    if (form.waterPrice < 0) {
      setErrorMessage('Water price cannot be negative.');
      return;
    }

    // Save settings
    onSaveSettings(form);
    updateProfile(form.userName, form.buildingName);

    setSuccessMessage('Settings updated successfully and stored on this device.');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleCancel = () => {
    setForm({ ...settings });
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>Configuration & Profile</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Property Settings</h2>
        <p className="text-xs text-slate-500 mt-1">
          Customize building metadata, resident benchmarks, baseline costs, and alert notifications.
        </p>
      </div>

      {/* Distinction Note between Profile vs Simulation */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="block font-bold mb-0.5">Profile Settings vs Simulation Controls:</strong>
          These settings configure your building identity and default cost constants.
          They operate independently from the temporary sliders in the simulation sandbox.
          Settings are stored securely in local browser storage on this device.
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 font-medium">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: User & Property Identity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Property & Account Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Manager / Contact Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={form.userName}
                  onChange={e => setForm({ ...form, userName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Building or Property Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={form.buildingName}
                  onChange={e => setForm({ ...form, buildingName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-400">
            Account email: <strong className="text-slate-600">{user?.email}</strong>
          </div>
        </div>

        {/* Section 2: Water Benchmarks and Cost Constants */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Occupancy & Utility Costs</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Active Residents (Hostel / PG)
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={form.residents}
                onChange={e => setForm({ ...form, residents: Number(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default assumption: 135 L / person</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Water Price (₹ / 1,000 L)
              </label>
              <div className="relative">
                <span className="text-xs font-bold text-slate-400 absolute left-3 top-2.5">₹</span>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="1"
                  value={form.waterPrice}
                  onChange={e => setForm({ ...form, waterPrice: Number(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Used for monthly loss estimates</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Currency
              </label>
              <select
                value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Notification Preferences */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>Alert & Reporting Preferences</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.notifyEmailAlerts}
                onChange={e => setForm({ ...form, notifyEmailAlerts: e.target.checked })}
                className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Email notification on High Confidence alert
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Receive an automated inspection checklist trigger when 5 or more abnormal night flows occur.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.notifyWeeklySummary}
                onChange={e => setForm({ ...form, notifyWeeklySummary: e.target.checked })}
                className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Weekly water consumption audit summary
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Get a digest of missing guard logs, baseline drift, and estimated conservation metrics.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => logout(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Property Account</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
