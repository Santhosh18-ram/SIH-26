import React, { useState } from 'react';
import { X, AlertOctagon, CheckCircle2, ShieldAlert, FileText, Ban } from 'lucide-react';

const PRESET_REASONS = [
  'Suspect duplicate / Re-application of already existing work in the area',
  'Inflated budget / Proposed cost severely exceeds mplads.gov.in peer baseline',
  'High environmental impact / Tree felling quota exceeds clearance limits',
  'Incomplete structural blueprint & soil reinforcement details',
  'Outside constituency jurisdiction or non-qualifying MPLAD expenditure'
];

export default function RejectProposalModal({ proposal, onClose, onConfirmReject }) {
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!proposal) return null;

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setCustomReason(preset);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason = customReason.trim() || selectedPreset || 'Proposal returned for revision by MP/MLA office.';
    setSubmitting(true);
    try {
      await onConfirmReject(proposal.id, finalReason);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0 text-slate-100">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-950/80 to-slate-900 border-b border-rose-500/30 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reject & Return Project Proposal</h3>
              <p className="text-xs text-rose-300">Official MP/MLA Disapproval Notice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Target Project Card */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {proposal.category}
              </span>
              <span className="font-bold text-cyan-400">₹{proposal.estimated_fund} Lakhs</span>
            </div>
            <h4 className="font-bold text-white text-sm pt-1">{proposal.title}</h4>
            <p className="text-slate-400 text-[11px]">Agency: {proposal.agency_name} • {proposal.district}</p>
          </div>

          {/* Quick Preset Reasons */}
          <div>
            <label className="block font-semibold text-slate-300 mb-2">
              Quick Select Official Rejection Reason:
            </label>
            <div className="space-y-1.5">
              {PRESET_REASONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full text-left p-2.5 rounded-lg border text-[11px] transition-all flex items-start space-x-2 ${
                    customReason === preset
                      ? 'bg-rose-950/40 border-rose-500/60 text-rose-200 font-semibold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>{preset}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Reason Textarea */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Specific Rejection & Revision Instructions for Proposer:
            </label>
            <textarea
              required
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter official technical observations or revision requirements..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !customReason.trim()}
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl font-bold shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
            >
              {submitting ? 'Rejecting...' : 'Confirm Rejection & Send Notice'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
