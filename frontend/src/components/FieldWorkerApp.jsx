import React, { useState } from 'react';
import { 
  UserCheck, Camera, MapPin, Upload, CheckCircle2, 
  AlertCircle, DollarSign, Activity, FileText, Send 
} from 'lucide-react';

export default function FieldWorkerApp({ projects, onUpdateSubmitted }) {
  // Mock worker profile: Suresh Kumar (Junior Engineer)
  const workerProjects = projects.filter(p => p.assigned_worker_id === 2 || p.worker_name === 'Suresh Kumar' || projects.length > 0);
  
  const [selectedProjectId, setSelectedProjectId] = useState(workerProjects[0]?.id || (projects[0]?.id || 1));
  const selectedProject = projects.find(p => p.id === parseInt(selectedProjectId)) || projects[0];

  const [status, setStatus] = useState(selectedProject?.status || 'In Progress');
  const [progressPct, setProgressPct] = useState(selectedProject?.current_progress_pct || 35.0);
  const [expenditure, setExpenditure] = useState(selectedProject?.spent_fund || 115.0);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState(selectedProject?.before_photo_url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80');
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Real File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/uploads/photo', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setPhotoUrl(data.url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/worker-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          worker_id: 2,
          worker_name: 'Suresh Kumar (Junior Engineer)',
          status: status,
          progress_pct: parseFloat(progressPct),
          expenditure_so_far: parseFloat(expenditure),
          notes: notes,
          photo_url: photoUrl,
          geotag_lat: selectedProject.lat,
          geotag_lng: selectedProject.lng
        })
      });

      const data = await res.json();
      setSuccessMsg(`Field update synced successfully! AI Risk score re-evaluated to ${data.risk_score} (${data.risk_band} Risk).`);
      if (onUpdateSubmitted) onUpdateSubmitted();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!selectedProject) return <div className="p-8 text-center text-slate-400">No assigned projects found.</div>;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      
      {/* Field Worker Header Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base">Field Officer Portal</h2>
            <p className="text-xs text-slate-400">Suresh Kumar (Junior Engineer, PWD)</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
          Mobile Mode
        </span>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Ground Update Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 text-xs shadow-xl">
        
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Post Real Ground Status Update</span>
        </h3>

        {/* Project Selector */}
        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Select Assigned Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              const p = projects.find(item => item.id === parseInt(e.target.value));
              if (p) {
                setStatus(p.status);
                setProgressPct(p.current_progress_pct);
                setExpenditure(p.spent_fund);
              }
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-bold"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                #{p.id}: {p.title} ({p.district})
              </option>
            ))}
          </select>
        </div>

        {/* Project Context Box */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="flex justify-between text-slate-300 font-medium">
            <span>Sanctioned Budget: <strong>₹{selectedProject.sanctioned_fund}L</strong></span>
            <span>Category: <strong>{selectedProject.category}</strong></span>
          </div>
          <p className="text-slate-500 text-[11px]">Location: {selectedProject.district}, {selectedProject.constituency}</p>
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Current Physical Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Physical Completion Slider */}
        <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center">
            <label className="text-slate-300 font-bold">Physical Completion Progress</label>
            <span className="text-lg font-extrabold text-amber-400">{progressPct}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progressPct}
            onChange={(e) => setProgressPct(e.target.value)}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Actual Expenditure Logger */}
        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Actual Expenditure Spent So Far (₹ Lakhs)</label>
          <input
            type="number"
            step="0.5"
            required
            value={expenditure}
            onChange={(e) => setExpenditure(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Geotagged Photo Upload */}
        <div className="space-y-2">
          <label className="text-slate-400 block font-semibold flex items-center space-x-1">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Upload Real Site Photo (Geotagged Proof)</span>
          </label>
          
          <div className="flex items-center space-x-3">
            <label className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer text-slate-300 flex items-center space-x-2">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>{uploading ? 'Uploading Photo...' : 'Choose Image File'}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            
            <span className="text-slate-500 text-[11px]">or use default site preview</span>
          </div>

          <div className="h-40 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 mt-2">
            <img src={photoUrl} alt="Site upload" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Supervisor Notes */}
        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Field Remarks & Ground Notes</label>
          <textarea
            rows={3}
            placeholder="Log current ground activities, material delivery, or obstacle reports..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center space-x-2 text-sm transition"
        >
          <Send className="w-4 h-4" />
          <span>Submit Ground Update & Sync MLA/Public Views</span>
        </button>

      </form>

    </div>
  );
}
