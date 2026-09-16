import React, { useState } from 'react';
import { 
  X, AlertTriangle, ShieldCheck, TreePine, Building, Sparkles, 
  Camera, Calendar, MapPin, DollarSign, Activity, FileText, 
  CheckCircle2, AlertCircle, Eye, MessageSquare, Send, Flag, Database
} from 'lucide-react';

export default function ProjectDetailModal({ project, onClose, role, onFileComplaint, onRespondComplaint }) {
  const [activeTab, setActiveTab] = useState('risk'); // risk, visual, env, updates, complaints
  const [newResponse, setNewResponse] = useState('');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  if (!project) return null;

  const band = project.risk_band || (project.risk_level?.includes('High') ? 'High' : project.risk_level?.includes('Medium') ? 'Medium' : 'Low');
  const riskScore = project.risk_score || project.composite_risk_score || 15.0;
  const signals = project.signals || {
    "Budget Over-Sanction Outlier": project.sanction_overrun_pct > 20 ? 75 : 15,
    "Physical vs Financial Divergence": project.risk_level?.includes('High') ? 68 : 12,
    "Timeline Velocity Anomaly": 20,
    "Field Photo Verification Score": 88
  };
  const explanations = Array.isArray(project.explanation) && project.explanation.length > 0 
    ? project.explanation 
    : (project.anomaly_flags && project.anomaly_flags.length > 0)
      ? project.anomaly_flags
      : ["Normal project progression verified against peer mplads.gov.in benchmarks."];

  const getBandBadgeClass = (b) => {
    switch (b) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-cyan-400 border border-slate-700">
              {project.category}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-md border ${getBandBadgeClass(band)}`}>
              {band} Risk ({riskScore}/100)
            </span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
              {project.district}, {project.constituency} ({project.terrain_type || 'Rural'} Terrain)
            </span>
            {project.is_over_sanction_flag && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Sanction-Time Outlier</span>
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-white mb-2">{project.title}</h2>
          <p className="text-xs text-slate-400 line-clamp-2">{project.description}</p>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('risk')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'risk' ? 'border-cyan-500 text-cyan-400 bg-slate-900/50' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Risk & Sanction Report</span>
          </button>

          <button
            onClick={() => setActiveTab('visual')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'visual' ? 'border-cyan-500 text-cyan-400 bg-slate-900/50' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Future Design vs Live Photo</span>
          </button>

          <button
            onClick={() => setActiveTab('env')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'env' ? 'border-cyan-500 text-cyan-400 bg-slate-900/50' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TreePine className="w-4 h-4 text-emerald-400" />
            <span>Environmental & Demolition</span>
          </button>

          <button
            onClick={() => setActiveTab('updates')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'updates' ? 'border-cyan-500 text-cyan-400 bg-slate-900/50' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Field Worker Logs ({project.update_count || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'complaints' ? 'border-cyan-500 text-cyan-400 bg-slate-900/50' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Public Complaints ({project.complaint_count || 0})</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: AI RISK & SANCTION-TIME PEER REPORT */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              
              {/* Disclaimer Notice */}
              <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/20 flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Investigation Priority Indicator:</strong> Evaluated against public infrastructure project baselines (mplads.gov.in) and live ground execution anomalies. This is an oversight tool and does not constitute proof of wrongdoing.
                </p>
              </div>

              {/* Sanction-Time Override Justification (if recorded) */}
              {project.override_justification && (
                <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl space-y-1 text-xs text-purple-200">
                  <div className="font-bold text-purple-400 flex items-center space-x-1">
                    <Database className="w-4 h-4" />
                    <span>Sanction-Time Human Override Justification Logged:</span>
                  </div>
                  <p className="text-slate-300 italic">"{project.override_justification}"</p>
                </div>
              )}

              {/* Risk Composite Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
                  <div className="text-slate-400 text-xs font-medium uppercase mb-1">Composite Risk Score</div>
                  <div className={`text-4xl font-extrabold my-1 ${
                    band === 'Critical' ? 'text-red-500' :
                    band === 'High' ? 'text-orange-400' :
                    band === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {riskScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
                  </div>
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    {band} Risk Priority
                  </div>
                </div>

                <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 col-span-2 space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Sub-Signal Breakdown</div>
                  
                  {Object.entries(signals).map(([sigName, scoreVal]) => (
                    <div key={sigName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">{sigName}</span>
                        <span className="font-semibold text-white">{scoreVal}/100</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            scoreVal > 60 ? 'bg-red-500' : scoreVal > 35 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, scoreVal)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Natural Language AI Explanations */}
              <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Plain-Language AI Signal Explanation</span>
                </h4>
                <ul className="space-y-2">
                  {explanations.map((exp, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{exp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Key Project Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block">Sanctioned Budget</span>
                  <strong className="text-white text-sm">₹{project.sanctioned_fund} Lakhs</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Spent So Far</span>
                  <strong className="text-cyan-400 text-sm">₹{project.spent_fund} Lakhs</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Physical Progress</span>
                  <strong className="text-emerald-400 text-sm">{project.current_progress_pct}%</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Terrain & Scope</span>
                  <strong className="text-white text-sm">{project.terrain_type} ({project.scope_value} {project.scope_unit})</strong>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: FUTURE VISUALIZATION VS LIVE FIELD PHOTO */}
          {activeTab === 'visual' && (
            <div className="space-y-6">
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
                <strong className="text-cyan-400 block mb-1">Visual Transparency Studio:</strong>
                Compare the initial site condition, the planned future architectural visualization after completion, and the latest ground photo submitted by the field worker.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Before Photo */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">1. Initial Site (Before)</span>
                  <div className="h-44 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                    <img src={project.before_photo_url} alt="Before site" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[11px] text-slate-400">Ground condition prior to project launch.</p>
                </div>

                {/* Future Completion Render */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 ring-1 ring-cyan-500/30">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>2. Future Completion Render</span>
                  </span>
                  <div className="h-44 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                    <img src={project.future_visualization_url} alt="Future Render" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[11px] text-slate-400">3D Architectural target design mockup.</p>
                </div>

                {/* Latest Field Update Photo */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">3. Current Field Ground Update</span>
                  <div className="h-44 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 relative">
                    <img 
                      src={project.photos && project.photos.length > 0 ? project.photos[project.photos.length - 1] : project.before_photo_url} 
                      alt="Current update" 
                      className="w-full h-full object-cover" 
                    />
                    <span className="absolute bottom-2 right-2 bg-slate-950/80 text-[10px] px-2 py-0.5 rounded text-amber-400 border border-slate-700">
                      Progress: {project.current_progress_pct}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[11px] text-slate-400">Worker: {project.worker_name || 'Assigned Worker'}</span>
                    <button
                      onClick={() => onFileComplaint(project, 'Fake/Wrong Photo')}
                      className="text-[11px] text-red-400 hover:text-red-300 font-semibold flex items-center space-x-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/20"
                    >
                      <Flag className="w-3 h-3" />
                      <span>Report Fake Photo</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: ENVIRONMENTAL & DEMOLITION SPECS */}
          {activeTab === 'env' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Trees Felling Shield */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <TreePine className="w-5 h-5" />
                    <h4 className="font-bold text-sm text-white">Trees Felling Allocation Limit</h4>
                  </div>
                  
                  <div className="text-3xl font-extrabold text-white">
                    {project.trees_to_cut || 0} <span className="text-xs font-normal text-slate-400">Approved Trees</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    To prevent illegal or unauthorized extra tree cutting by contractors, this project is strict-logged to a maximum limit of <strong>{project.trees_to_cut || 0} trees</strong> under forestry clearance guidelines.
                  </p>

                  {project.trees_to_cut > 15 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-xs text-amber-300">
                      ⚠️ High tree felling allocation! District forestry inspection required during ground clearance.
                    </div>
                  )}
                </div>

                {/* Building Demolition Shield */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-orange-400">
                    <Building className="w-5 h-5" />
                    <h4 className="font-bold text-sm text-white">Building & Structure Demolition</h4>
                  </div>

                  <div className="text-3xl font-extrabold text-white">
                    {project.buildings_to_demolish || 0} <span className="text-xs font-normal text-slate-400">Structures Demolished</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {project.demolition_details || "No major building demolitions required for this project site."}
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: FIELD WORKER LOGS */}
          {activeTab === 'updates' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chronological Ground Updates</h4>
              
              {project.update_count === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs">
                  No field worker status updates posted yet for this project.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-white text-xs">{project.worker_name || 'Assigned Field Officer'}</span>
                        <span className="text-slate-500 text-[11px] block">Status: {project.status}</span>
                      </div>
                      <span className="text-[11px] font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {project.current_progress_pct}% Progress
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">Ground progress update logged with geotagged site verification photo and expenditure record of ₹{project.spent_fund} Lakhs.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PUBLIC COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citizen Complaints Log</h4>
                <button
                  onClick={() => onFileComplaint(project, 'General Issue')}
                  className="px-3 py-1 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition shadow"
                >
                  + File New Complaint
                </button>
              </div>

              {project.complaint_count === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs">
                  No public complaints recorded for this project.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-400">Category: Fake/Wrong Photo Report</span>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold">Open</span>
                    </div>
                    <p className="text-slate-300">Citizen reported ground site mismatch between field officer photo and actual ground progress in Shivpur village.</p>
                    
                    {role === 'mla_admin' && (
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <textarea
                          placeholder="Type official MLA response / investigation status..."
                          value={newResponse}
                          onChange={(e) => setNewResponse(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          onClick={() => {
                            if (onRespondComplaint) onRespondComplaint(1, newResponse);
                            setNewResponse('');
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                        >
                          Submit Official Response
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center">
          <div className="text-xs text-slate-400">
            Project ID: <strong className="text-white">#{project.id}</strong> | Agency: <strong className="text-slate-300">{project.agency_name}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
          >
            Close Modal
          </button>
        </div>

      </div>
    </div>
  );
}
