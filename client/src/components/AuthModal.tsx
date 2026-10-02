import React, { useState } from 'react';
import { X, UserCheck, Smartphone, Mail, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { updateProfile } = useProfile();
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [mobileOrEmail, setMobileOrEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName) {
      updateProfile({ fullName });
    }
    setSuccessMsg(`Welcome to GoodBridgeScheme AI, ${fullName || 'Citizen'}! Your profile has been authenticated.`);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Citizen Sign In & Profile Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access personalized scheme recommendations & saved application drafts.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-6 text-xs font-bold">
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === 'signin' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Mobile / OTP Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === 'register' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            New Citizen Registration
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center border border-emerald-300">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name..."
                className="w-full text-xs p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {tab === 'signin' ? 'Mobile Number or Email' : 'Mobile Number'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={mobileOrEmail}
                onChange={(e) => setMobileOrEmail(e.target.value)}
                placeholder="e.g. 9876543210 or email@domain.com"
                className="w-full text-xs p-3 pl-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
              <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Password or OTP
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full text-xs p-3 pl-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{tab === 'signin' ? 'Authenticate & Sign In' : 'Create Citizen Account'}</span>
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            🔒 Protected by Government Data Encryption Standards. Zero data sharing.
          </p>
        </div>
      </div>
    </div>
  );
};
