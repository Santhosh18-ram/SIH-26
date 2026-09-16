import React, { useState } from 'react';
import { X, Flag, Send, CheckCircle2 } from 'lucide-react';

export default function ComplaintModal({ project, defaultCategory, onClose, onComplaintSubmitted }) {
  const [citizenName, setCitizenName] = useState('');
  const [category, setCategory] = useState(defaultCategory || 'Fake/Wrong Photo');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          citizen_name: citizenName || 'Anonymous Citizen',
          category: category,
          description: description,
          photo_url: photoUrl
        })
      });

      const data = await res.json();
      setResult(data);
      if (onComplaintSubmitted) onComplaintSubmitted();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-xs">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex justify-between items-center">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
            <Flag className="w-4 h-4 text-amber-400" />
            <span>File Citizen Complaint / Fraud Report</span>
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          
          {result ? (
            <div className="p-6 bg-slate-950 rounded-xl border border-emerald-500/30 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">Complaint Submitted Successfully!</h4>
              <p className="text-slate-300">Your complaint tracking code is:</p>
              <div className="text-lg font-extrabold text-amber-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {result.tracking_code}
              </div>
              <p className="text-[11px] text-slate-400">Save this code to look up complaint status on the public portal.</p>
              <button
                onClick={onClose}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
              >
                Close Modal
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Target Project</span>
                <strong className="text-white text-xs">{project.title}</strong>
                <span className="text-slate-400 block text-[10px]">{project.district}, {project.constituency}</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Anonymous Citizen"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Complaint Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Fake/Wrong Photo">Fake/Wrong Photo Uploaded by Worker</option>
                  <option value="No Progress / Abandoned">No Progress / Work Abandoned</option>
                  <option value="Substandard Quality">Substandard Construction Quality</option>
                  <option value="Cost Overrun & Inflation">Inflated Cost / Fund Misuse</option>
                  <option value="Tree Over-Felling">Illegal Tree Over-Felling</option>
                  <option value="Location Mismatch">Wrong Location Claimed</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Complaint Details & Observations</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide ground observations, dates, or specific issues noticed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2 transition"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting Report...' : 'Submit Citizen Complaint'}</span>
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
