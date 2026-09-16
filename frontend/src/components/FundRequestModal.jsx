import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, CheckCircle2, TreePine, Building, ShieldAlert, BarChart3, HelpCircle } from 'lucide-react';

export default function FundRequestModal({ onClose, onRequestSubmitted }) {
  const [formData, setFormData] = useState({
    project_title: '',
    description: '',
    category: 'Roads & Bridges',
    scope_unit: 'km',
    scope_value: 2.5,
    terrain_type: 'Rural',
    district: 'Varanasi',
    constituency: 'Varanasi Cantt',
    requested_amount: 65.0,
    requested_by: 'Shivpur Village Panchayat',
    trees_to_cut: 5,
    buildings_to_demolish: 0,
    demolition_details: '',
    future_visualization_url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80',
    override_justification: ''
  });

  const [loading, setLoading] = useState(false);
  const [estimation, setEstimation] = useState(null);
  const [livePeerCheck, setLivePeerCheck] = useState(null);

  // Live peer estimation check as user adjusts category, size, terrain, or budget
  useEffect(() => {
    const fetchLivePeerBenchmark = async () => {
      if (!formData.category || !formData.scope_value || !formData.requested_amount) return;
      try {
        const res = await fetch('/api/sanction-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: formData.category,
            scope_unit: formData.scope_unit,
            scope_value: parseFloat(formData.scope_value) || 1.0,
            terrain_type: formData.terrain_type,
            requested_amount: parseFloat(formData.requested_amount) || 10.0,
            district: formData.district
          })
        });
        if (res.ok) {
          const data = await res.json();
          setLivePeerCheck(data);
        }
      } catch (err) {
        console.error("Live peer check error:", err);
      }
    };

    const timeout = setTimeout(fetchLivePeerBenchmark, 300);
    return () => clearTimeout(timeout);
  }, [formData.category, formData.scope_value, formData.terrain_type, formData.requested_amount]);

  const handleRunEstimation = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.project_title,
          category: formData.category,
          scope_unit: formData.scope_unit,
          scope_value: parseFloat(formData.scope_value),
          terrain_type: formData.terrain_type,
          district: formData.district,
          constituency: formData.constituency,
          sanctioned_fund: parseFloat(formData.requested_amount),
          trees_to_cut: parseInt(formData.trees_to_cut || 0),
          buildings_to_demolish: parseInt(formData.buildings_to_demolish || 0)
        })
      });

      const data = await res.json();
      setEstimation(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (livePeerCheck?.is_flagged && !formData.override_justification.trim()) {
      alert("This project is flagged with High/Moderate Sanction Risk. Please provide a mandatory justification note explaining the cost variance before submitting.");
      return;
    }

    try {
      const res = await fetch('/api/fund-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (onRequestSubmitted) onRequestSubmitted(data);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Sanction-Time Over-Sanction Detection & Auto-Estimator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live peer comparison against public project data (mplads.gov.in) before funds are sanctioned.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          <form onSubmit={handleRunEstimation} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="md:col-span-3">
              <label className="text-slate-400 block mb-1 font-semibold">Project Title / Name</label>
              <input
                type="text"
                required
                value={formData.project_title}
                onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
                placeholder="e.g. Construction of Multi-purpose Community Hall, Babatpur"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-slate-400 block mb-1 font-semibold">Detailed Description & Scope</label>
              <textarea
                rows={2}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe scope, village location, and target beneficiaries..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Project Category</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  const unit = cat === 'Roads & Bridges' ? 'km' : (cat === 'Water & Sanitation' || cat === 'Street Lighting' ? 'units' : 'sqft');
                  setFormData({ ...formData, category: cat, scope_unit: unit });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Roads & Bridges">Roads & Bridges</option>
                <option value="Schools & Education">Schools & Education</option>
                <option value="Community Halls">Community Halls</option>
                <option value="Health & Hospitals">Health & Hospitals</option>
                <option value="Water & Sanitation">Water & Sanitation</option>
                <option value="Street Lighting">Street Lighting</option>
              </select>
            </div>

            {/* Terrain / Location Type Selector */}
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Terrain / Location Type</label>
              <select
                value={formData.terrain_type}
                onChange={(e) => setFormData({ ...formData, terrain_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 font-semibold"
              >
                <option value="Rural">Rural</option>
                <option value="Urban">Urban</option>
                <option value="Hilly / Mountainous">Hilly / Mountainous</option>
                <option value="Flood-Prone / Coastal">Flood-Prone / Coastal</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Scope Dimension ({formData.scope_unit})</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.scope_value}
                onChange={(e) => setFormData({ ...formData, scope_value: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Requested Sanction (₹ Lakhs)</label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.requested_amount}
                onChange={(e) => setFormData({ ...formData, requested_amount: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Requested By</label>
              <input
                type="text"
                value={formData.requested_by}
                onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold flex items-center space-x-1">
                <TreePine className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trees to Cut</span>
              </label>
              <input
                type="number"
                value={formData.trees_to_cut}
                onChange={(e) => setFormData({ ...formData, trees_to_cut: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-orange-400" />
                <span>Buildings to Demolish</span>
              </label>
              <input
                type="number"
                value={formData.buildings_to_demolish}
                onChange={(e) => setFormData({ ...formData, buildings_to_demolish: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 flex items-center justify-center space-x-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Running AI Sanction Engine...' : 'Run Sanction Overrun & Duplicate Check'}</span>
              </button>
            </div>

          </form>

          {/* LIVE PEER BENCHMARK CARD (Sanction-Time Detection) */}
          {livePeerCheck && (
            <div className={`p-4 rounded-xl border transition-all ${
              livePeerCheck.is_flagged 
                ? 'bg-red-500/10 border-red-500/30 text-red-300' 
                : 'bg-slate-950 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold flex items-center space-x-2 text-xs">
                  {livePeerCheck.is_flagged ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">Sanction-Time Over-Sanction Alert ({livePeerCheck.risk_level})</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Live Peer Cost Benchmark (mplads.gov.in Reference Pool)</span>
                    </>
                  )}
                </span>
                
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  livePeerCheck.is_flagged ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {livePeerCheck.multiplier_ratio}x Peer Baseline
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-slate-300 text-xs my-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">Typical Peer Range</span>
                  <strong>₹{livePeerCheck.peer_metrics.typical_total_cost_min}L – ₹{livePeerCheck.peer_metrics.typical_total_cost_max}L</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Peer Median Cost</span>
                  <strong>₹{livePeerCheck.peer_metrics.typical_total_cost_median}L</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Requested Sanction</span>
                  <strong className={livePeerCheck.is_flagged ? "text-red-400" : "text-white"}>₹{formData.requested_amount}L</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Peer Sample Size</span>
                  <strong className="text-cyan-400">{livePeerCheck.peer_metrics.peer_count} Public Projects</strong>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                {livePeerCheck.explanation_text}
              </p>

              {/* Required Justification Input if Flagged */}
              {livePeerCheck.is_flagged && (
                <div className="mt-4 pt-3 border-t border-red-500/20 space-y-2">
                  <label className="text-red-400 font-bold block flex items-center space-x-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Mandatory Human Override Justification (AI flags, Humans decide):</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.override_justification}
                    onChange={(e) => setFormData({ ...formData, override_justification: e.target.value })}
                    placeholder="Provide specific technical reasons (e.g. soil stabilization, specialized medical equipment, expedited monsoon deadline, remote terrain logistics)..."
                    className="w-full bg-slate-950 border border-red-500/40 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-red-400"
                  />
                  <p className="text-[10px] text-slate-400">This justification note will be permanently logged into the public audit trail upon approval.</p>
                </div>
              )}
            </div>
          )}

          {/* AI Estimation & Duplicate Results Card */}
          {estimation && (
            <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/30 space-y-4">
              
              <h4 className="font-bold text-sm text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>AI Estimation & Duplicate Check Results</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">Fair Estimated Cost</span>
                  <strong className="text-white text-sm">₹{estimation.estimated_fund} Lakhs</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Requested Cost</span>
                  <strong className={formData.requested_amount > estimation.estimated_fund * 1.2 ? 'text-red-400 text-sm' : 'text-emerald-400 text-sm'}>
                    ₹{formData.requested_amount} Lakhs
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Estimated Timeline</span>
                  <strong className="text-white text-sm">{estimation.estimated_days} Days</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Confidence Range</span>
                  <span className="text-slate-300 font-medium">₹{estimation.confidence_min_fund}L - ₹{estimation.confidence_max_fund}L</span>
                </div>
              </div>

              {/* Duplicate Suspects Alert */}
              {estimation.duplicate_suspects && estimation.duplicate_suspects.length > 0 ? (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl space-y-2">
                  <span className="font-bold text-red-400 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Potential Duplicate / Re-application Detected! ({estimation.duplicate_suspects.length})</span>
                  </span>
                  {estimation.duplicate_suspects.map((dup, i) => (
                    <div key={i} className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded border border-red-500/20">
                      <strong>{dup.title}</strong> (ID #{dup.project_id}, {dup.district}) — Text Similarity: <span className="text-red-400 font-bold">{dup.text_similarity}%</span> | Distance: <span className="text-amber-400 font-bold">{dup.distance_km} km</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-emerald-300 font-medium">
                  ✓ No duplicate or fake re-application matches found in existing district database.
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSubmitRequest}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition"
                >
                  Submit Fund Request for MLA Approval
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
