import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { NavigationTab } from '../types.ts';
import {
  Menu,
  Building,
  User as UserIcon,
  Settings,
  HelpCircle,
  LogOut,
  Sliders,
  Upload,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  dataSource: 'demo' | 'csv';
  onSelectTab: (tab: NavigationTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  dataSource,
  onSelectTab,
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Hamburger & Building Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600 hidden sm:inline" />
            <span className="font-bold text-sm text-slate-800">
              {user?.buildingName || 'Hostel Water Audit'}
            </span>
          </div>
        </div>

        {/* Right: Source Indicator & User Dropdown */}
        <div className="flex items-center gap-3">
          {/* Active Data Source Pill */}
          <div
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              dataSource === 'demo'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            {dataSource === 'demo' ? (
              <>
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Simulated Demo Data</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Uploaded CSV Logs</span>
              </>
            )}
          </div>

          {/* User Profile Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 pl-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden md:inline max-w-[120px] truncate">
                {user?.name || 'Account'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs text-slate-700 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  {user?.isDemoMode && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Local Demo Session
                    </span>
                  )}
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('settings');
                      setDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Profile & Building</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('settings');
                      setDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('help');
                      setDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Help & Knowledge Base</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout(false);
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2 text-red-600 hover:bg-red-50 font-bold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
