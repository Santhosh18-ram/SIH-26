import React, { useState, useEffect } from 'react';
import { X, Calculator, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, TreePine, Building, TrendingUp } from 'lucide-react';

export default function BudgetCalculatorModal({ onClose }) {
  const [category, setCategory] = useState('Roads & Bridges');
  const [terrain, setTerrain] = useState('Rural');
  const [scopeUnit, setScopeUnit] = useState('km');
  const [scopeValue, setScopeValue] = useState(3.0);
  const [budget, setBudget] = useState(75.0);
  const [district, setDistrict] = useState('Varanasi');
  
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-calculate live whenever category, terrain, scopeValue, or budget changes
  useEffect(() => {
    const runLiveCalc = async () => {
      setLoading(true);
      try {
        const [sanctionRes, estRes] = await Promise.all([
          fetch('/api/sanction-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category: category,
              scope_unit: scopeUnit,
              scope_value: parseFloat(scopeValue) || 1.0,
              terrain_type: terrain,
              requested_amount: parseFloat(budget) || 10.0,
              district: district
            })
          }),
          fetch('/api/estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: "Public Cost Verification",
              category: category,
              scope_unit: scopeUnit,
              scope_value: parseFloat(scopeValue) || 1.0,
              terrain_type: terrain,
              district: district,
              constituency: "General",
              sanctioned_fund: parseFloat(budget) || 10.0
            })
          })
        ]);

        const sanctionData = await sanctionRes.json();
        const estData = await estRes.json();

        setCalculation({
          sanction: sanctionData,
          estimate: estData
        });
      } catch (err) {
        console.error("Budget calc error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(runLiveCalc, 200);
    return () => clearTimeout(timeout);
  }, [category, terrain, scopeUnit, scopeValue, budget, district]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    const unit = cat === 'Roads & Bridges' ? 'km' : (cat === 'Water & Sanitation' || cat === 'Street Lighting' ? 'units' : 'sqft');
    setScopeUnit(unit);
    if (unit === 'km') { setScopeValue(3.0); setBudget(75.0); }
    else if (unit === 'sqft') { setScopeValue(8000.0); setBudget(36.0); }
    else if (cat === 'Street Lighting') { setScopeValue(100.0); setBudget(40.0); }
    else { setScopeValue(2.0); setBudget(24.0); }
  };

  const multiplier = calculation?.sanction?.multiplier_ratio || 1.0;
  const isOutlier = calculation?.sanction?.is_flagged;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-xs">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>AI Fair Budget & Public Cost Estimator</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 text-[10px]">
                  Real-Time Engine
                </span>
              </h3>
              <p className="text-slate-400 text-[11px]">
                Verify whether a proposed or sanctioned project budget is accurate, fair, or inflated based on mplads.gov.in public data.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Interactive Input Form Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            
            {/* Category */}
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">1. Project Category</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="Roads & Bridges">Roads & Bridges</option>
                <option value="Schools & Education">Schools & Education</option>
                <option value="Community Halls">Community Halls</option>
                <option value="Health & Hospitals">Health & Hospitals</option>
                <option value="Water & Sanitation">Water & Sanitation</option>
                <option value="Street Lighting">Street Lighting</option>
              </select>
            </div>

            {/* Terrain */}
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">2. Terrain / Location</label>
              <select
                value={terrain}
                onChange={(e) => setTerrain(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="Rural">Rural</option>
                <option value="Urban">Urban</option>
                <option value="Hilly / Mountainous">Hilly / Mountainous</option>
                <option value="Flood-Prone / Coastal">Flood-Prone / Coastal</option>
              </select>
            </div>

            {/* Scope Size */}
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">3. Scope Size ({scopeUnit})</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={scopeValue}
                onChange={(e) => setScopeValue(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Proposed Budget */}
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">4. Proposed Budget (₹ Lakhs)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={budget}
                onChange={(e) => setBudget(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-extrabold text-cyan-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

          </div>

          {/* REAL-TIME CALCULATION RESULTS PANEL */}
          {calculation ? (
            <div className="space-y-4">
              
              {/* Verdict Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                isOutlier
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <div className="flex items-center space-x-3">
                  {isOutlier ? (
                    <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-extrabold text-sm block">
                      {isOutlier ? `INFLATED / OVER-SANCTION DETECTED (${multiplier}x Typical Cost)` : `FAIR & REASONABLE BUDGET ALLOCATION`}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      Based on statistical peer baseline from {calculation.sanction.peer_metrics.peer_count} public works records in {terrain} terrain.
                    </span>
                  </div>
                </div>

                <div className={`text-center px-3 py-1.5 rounded-lg font-extrabold text-xs ${
                  isOutlier ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {isOutlier ? 'High Cost Risk' : 'Standard Rate'}
                </div>
              </div>

              {/* Stat Cards Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                
                <div className="space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Fair Estimated Cost</span>
                  <div className="text-lg font-extrabold text-white">₹{calculation.estimate.estimated_fund} Lakhs</div>
                  <span className="text-[10px] text-slate-400">Baseline ₹{calculation.estimate.baseline_median_cost_per_unit}L / {scopeUnit}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Peer Typical Range</span>
                  <div className="text-lg font-extrabold text-emerald-400">
                    ₹{calculation.sanction.peer_metrics.typical_total_cost_min}L – ₹{calculation.sanction.peer_metrics.typical_total_cost_max}L
                  </div>
                  <span className="text-[10px] text-slate-400">Median: ₹{calculation.sanction.peer_metrics.typical_total_cost_median}L</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Your Entered Budget</span>
                  <div className={`text-lg font-extrabold ${isOutlier ? 'text-red-400' : 'text-cyan-400'}`}>
                    ₹{budget} Lakhs
                  </div>
                  <span className="text-[10px] text-slate-400">Rate: ₹{(budget/scopeValue).toFixed(4)}L / {scopeUnit}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Expected Timeline</span>
                  <div className="text-lg font-extrabold text-white">{calculation.estimate.estimated_days} Days</div>
                  <span className="text-[10px] text-slate-400">Confidence: {calculation.estimate.confidence_min_days} - {calculation.estimate.confidence_max_days}d</span>
                </div>

              </div>

              {/* Natural Language Explanation Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Cost Analysis Explanation:</span>
                </span>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {calculation.sanction.explanation_text}
                </p>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">Calculating cost benchmark...</div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center">
          <span className="text-slate-500 text-[11px]">
            Data Sources: Public Work Expenditure Database (mplads.gov.in) & PWD Standards
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
          >
            Close Calculator
          </button>
        </div>

      </div>
    </div>
  );
}
