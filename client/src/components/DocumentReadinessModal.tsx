import React, { useState } from 'react';
import { Scheme, DocumentVerificationStatus } from '../../../shared/types';
import { X, FileCheck, AlertTriangle, CheckCircle2, Upload, ExternalLink } from 'lucide-react';

interface DocumentReadinessModalProps {
  scheme: Scheme | null;
  onClose: () => void;
}

export const DocumentReadinessModal: React.FC<DocumentReadinessModalProps> = ({ scheme, onClose }) => {
  const [userDocs, setUserDocs] = useState<string[]>(['Aadhaar Card', 'Bank Account Passbook']);
  const [newDocText, setNewDocText] = useState('');

  if (!scheme) return null;

  const requiredDocs = scheme.documentsRequired || [];
  const checklist: DocumentVerificationStatus[] = requiredDocs.map((docName) => {
    const isAvailable = userDocs.some(
      (d) => d.toLowerCase().includes(docName.toLowerCase()) || docName.toLowerCase().includes(d.toLowerCase())
    );
    return {
      documentName: docName,
      isAvailable,
      statusText: isAvailable ? 'Verified & Available' : 'Missing / Required',
      recommendedAction: isAvailable
        ? 'Keep original copy ready for verification'
        : `Obtain copy from official Kendra / portal before applying for ${scheme.name}`
    };
  });

  const missingCount = checklist.filter((c: DocumentVerificationStatus) => !c.isAvailable).length;

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDocText.trim() && !userDocs.includes(newDocText.trim())) {
      setUserDocs([...userDocs, newDocText.trim()]);
      setNewDocText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Document Readiness & Missing Paper Detector
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scheme: <strong>{scheme.name}</strong>
            </p>
          </div>
        </div>

        {/* Missing Alert Banner */}
        <div className={`mt-4 p-4 rounded-2xl border flex items-center gap-3 ${
          missingCount === 0
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
        }`}>
          {missingCount === 0 ? <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-500" /> : <AlertTriangle className="w-6 h-6 shrink-0 text-amber-500" />}
          <div className="text-xs">
            <span className="font-extrabold text-sm block">
              {missingCount === 0 ? '🎉 All Required Documents Ready!' : `⚠️ ${missingCount} Required Document(s) Missing`}
            </span>
            <p className="opacity-90">
              {missingCount === 0
                ? 'Your document readiness is 100%. You can safely proceed to the official application portal.'
                : 'Please obtain the missing papers listed below before submitting your application to avoid rejection.'}
            </p>
          </div>
        </div>

        {/* Checklist */}
        <div className="py-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Requirements Checklist</h3>

          {checklist.map((item: DocumentVerificationStatus, idx: number) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                item.isAvailable
                  ? 'bg-slate-50 dark:bg-slate-900/50 border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50/50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {item.isAvailable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{item.documentName}</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{item.recommendedAction}</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${
                item.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {item.statusText}
              </span>
            </div>
          ))}
        </div>

        {/* Quick Add Available Document */}
        <form onSubmit={handleAddDoc} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex gap-2">
          <input
            type="text"
            value={newDocText}
            onChange={(e) => setNewDocText(e.target.value)}
            placeholder="Add document name you possess (e.g. Income Certificate)..."
            className="flex-1 text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
          />
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" /> Add Document
          </button>
        </form>

        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold border">Close</button>
          <a
            href={scheme.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <span>Proceed to Official Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
