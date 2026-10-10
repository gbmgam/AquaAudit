import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AlertTriangle, LogOut, X } from 'lucide-react';

export const LogoutConfirmModal: React.FC = () => {
  const { isLogoutModalOpen, confirmLogout, cancelLogout } = useAuth();

  if (!isLogoutModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={cancelLogout}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">Confirm Sign Out</h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          You may have unsaved simulation adjustments or inspection checklist items.
          Signing out will end your session and return you to the login screen.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={cancelLogout}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel & Stay
          </button>
          <button
            type="button"
            onClick={confirmLogout}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
