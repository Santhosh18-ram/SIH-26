import React, { useState, useEffect } from 'react';
import { 
  Eye, Search, MapPin, TreePine, Building, Sparkles, 
  ShieldCheck, AlertTriangle, CheckCircle2, MessageSquare, 
  ArrowUpDown, Filter, Clock, Calendar, Flag, Send, FileText,
  Calculator, CheckCircle, Info
} from 'lucide-react';
import InteractiveMap from './InteractiveMap';

export default function PublicPortal({ 
  stats, projects, onSelectProject, onFileComplaint, onOpenBudgetCalculator 
}) {
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('location');
  const [sortOrder, setSortOrder] = useState('asc');

  // Tracking Complaint Lookup State
  const [trackingCode, setTrackingCode] = useState('');
  const [trackedComplaint, setTrackedComplaint] = useState(null);
  const [trackError, setTrackError] = useState('');

  // Public complaints feed
  const [publicComplaints, setPublicComplaints] = useState([]);

  useEffect(() => {
    const fetchPublicComplaints = async () => {
      try {
        const res = await fetch('/api/complaints');
        if (res.ok) {
          const data = await res.json();
          setPublicComplaints(data);
        }
      } catch (err) {
        console.error("Public complaints error:", err);
      }
    };
    fetchPublicComplaints();
  }, []);

  if (!stats) return <div className="p-8 text-center text-slate-400">Loading Public Portal...</div>;

  const filteredProjects = projects.filter((p) => {
    if (districtFilter !== 'ALL' && p.district !== districtFilter) return false;
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (riskFilter !== 'ALL' && (p.risk_band || 'Low').toLowerCase() !== riskFilter.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'location') {
      comp = (a.district + a.constituency).localeCompare(b.district + b.constituency);
    } else if (sortBy === 'risk') {
      comp = (a.risk_score || 0) - (b.risk_score || 0);
    } else if (sortBy === 'budget') {
      comp = (a.sanctioned_fund || 0) - (b.sanctioned_fund || 0);
    } else if (sortBy === 'progress') {
      comp = (a.current_progress_pct || 0) - (b.current_progress_pct || 0);
    } else {
      comp = a.id - b.id;
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  const activeProjects = sortedProjects.filter(p => p.status !== 'Planned/Upcoming');
  const upcomingProjects = sortedProjects.filter(p => p.status === 'Planned/Upcoming');

  const handleTrackComplaint = async (e) => {
    e.preventDefault();
    setTrackError('');
    setTrackedComplaint(null);

    try {
      const res = await fetch(`/api/complaints/track/${trackingCode.trim()}`);
      if (!res.ok) {
        setTrackError('Complaint tracking code not found. Please verify code.');
        return;
      }
      const data = await res.json();
      setTrackedComplaint(data);
    } catch (err) {
      setTrackError('Error looking up complaint code.');
    }
  };

  const getPublicRiskBadge = (band) => {
    switch (band) {
      case 'Critical': return { text: 'Critical Review Priority', class: 'bg-red-500/20 text-red-400 border-red-500/40' };
      case 'High': return { text: 'High Review Priority', class: 'bg-orange-500/20 text-orange-400 border-orange-500/40' };
      case 'Medium': return { text: 'Medium Review Flag', class: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      default: return { text: 'Standard Compliance', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 border border-slate-800 p-8 rounded-3xl overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
              Government Transparency Portal
            </span>
            <span className="text-slate-400 text-xs font-medium">SIH 2026 Official Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Public Visibility into <span className="text-cyan-400">MPLAD Infrastructure</span> Projects
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Browse local development works sanctioned by your Member of Parliament. Track physical completion progress, inspect 3D completion renders vs live site photos, verify tree cutting limits, and check if budgets are fair using our public AI cost estimator.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenBudgetCalculator}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 text-xs flex items-center space-x-2 transition"
            >
              <Calculator className="w-4 h-4" />
              <span>Check Project Budget Accuracy (AI Cost Calculator)</span>
            </button>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Risk badges indicate algorithmic oversight flags, not proof of fraud.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Static Constituency Development Statistics */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Building className="w-4 h-4 text-cyan-400" />
          <span>Constituency Development Summary</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Schools Constructed</span>
            <div className="text-2xl font-extrabold text-white">89</div>
            <span className="text-[11px] text-emerald-400 font-semibold">100% Functional</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Roads Paved (km)</span>
            <div className="text-2xl font-extrabold text-white">306.5 km</div>
            <span className="text-[11px] text-cyan-400 font-semibold">Connected Villages</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Community Halls</span>
            <div className="text-2xl font-extrabold text-white">44</div>
            <span className="text-[11px] text-slate-400">Public Auditorium</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Healthcare Wings</span>
            <div className="text-2xl font-extrabold text-white">33</div>
            <span className="text-[11px] text-amber-400 font-semibold">ICU Extensions</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 col-span-2 sm:col-span-1 space-y-1">
            <span className="text-slate-400 text-xs font-medium block">Total Funds Utilised</span>
            <div className="text-2xl font-extrabold text-emerald-400">₹7,320 Lakhs</div>
            <span className="text-[11px] text-slate-400">Across 4 Districts</span>
          </div>
        </div>
      </div>

      {/* Interactive Public Map */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span>Interactive Public Project Map</span>
        </h3>
        <InteractiveMap projects={projects} onSelectProject={onSelectProject} />
      </div>

      {/* Controls Bar: Search, Category, Location Sorting, Complaint Tracker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
        
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search projects or locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Roads & Bridges">Roads & Bridges</option>
            <option value="Schools & Education">Schools & Education</option>
            <option value="Community Halls">Community Halls</option>
            <option value="Health & Hospitals">Health & Hospitals</option>
            <option value="Water & Sanitation">Water & Sanitation</option>
            <option value="Street Lighting">Street Lighting</option>
          </select>
        </div>

        <div className="flex items-center space-x-1">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none cursor-pointer font-semibold"
          >
            <option value="location">Sort by Location (District)</option>
            <option value="budget">Sort by Sanctioned Budget</option>
            <option value="progress">Sort by Completion %</option>
            <option value="risk">Sort by Review Priority</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-white"
            title="Toggle Sort Order"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Complaint Status Lookup Box */}
        <form onSubmit={handleTrackComplaint} className="flex items-center space-x-1">
          <input
            type="text"
            placeholder="Track Complaint (e.g. CMP-2026-8812)"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-[11px] focus:outline-none focus:border-amber-500"
          />
          <button type="submit" className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold">
            Track
          </button>
        </form>

      </div>

      {/* Complaint Status Result Banner */}
      {trackedComplaint && (
        <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-2xl space-y-2 text-xs shadow-xl">
          <div className="flex justify-between items-center">
            <span className="font-bold text-amber-400 text-sm">Tracking Code: {trackedComplaint.tracking_code}</span>
            <span className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase ${
              trackedComplaint.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {trackedComplaint.status}
            </span>
          </div>
          <h4 className="text-white font-bold text-sm">{trackedComplaint.project_title}</h4>
          <p className="text-slate-300">Category: <strong>{trackedComplaint.category}</strong> — "{trackedComplaint.description}"</p>
          
          {trackedComplaint.mla_response ? (
            <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 text-emerald-300 space-y-1">
              <strong className="block text-[11px] text-emerald-400">Official MLA Investigation Response:</strong>
              <p className="text-slate-200">{trackedComplaint.mla_response}</p>
            </div>
          ) : (
            <div className="text-slate-400 italic">Official MLA investigation is currently in progress. Updates will appear here.</div>
          )}
        </div>
      )}

      {trackError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-300 rounded-lg">
          {trackError}
        </div>
      )}

      {/* Active Projects Explorer Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Active Infrastructure Projects ({activeProjects.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeProjects.map((p) => {
            const badge = getPublicRiskBadge(p.risk_band);
            const explanations = p.explanation || [];

            return (
              <div 
                key={p.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition group"
              >
                
                <div>
                  <div className="h-48 overflow-hidden bg-slate-950 relative">
                    <img 
                      src={p.photos && p.photos.length > 0 ? p.photos[p.photos.length - 1] : p.before_photo_url} 
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                    />
                    
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur text-white text-[11px] font-bold border border-slate-700">
                      {p.category}
                    </span>

                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded text-[11px] font-bold border backdrop-blur ${badge.class}`}>
                      {badge.text}
                    </span>

                    <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-slate-950/80 text-cyan-400 text-[10px] font-bold">
                      {p.district}, {p.constituency} ({p.terrain_type})
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <h4 className="font-bold text-base text-white group-hover:text-cyan-400 transition leading-snug">
                      {p.title}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Completion Progress</span>
                        <span className="text-cyan-400">{p.current_progress_pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${p.current_progress_pct}%` }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Sanctioned Fund</span>
                        <strong className="text-white">₹{p.sanctioned_fund} Lakhs</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Spent So Far</span>
                        <strong className="text-emerald-400">₹{p.spent_fund} Lakhs</strong>
                      </div>
                    </div>

                    {p.trees_to_cut > 0 && (
                      <div className="flex items-center space-x-1 text-[11px] text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                        <TreePine className="w-3.5 h-3.5 shrink-0" />
                        <span>Max Tree Felling Limit: <strong>{p.trees_to_cut} Trees</strong></span>
                      </div>
                    )}

                    {explanations.length > 0 && (
                      <p className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800 line-clamp-2">
                        💡 <strong>Public Summary:</strong> {explanations[0]}
                      </p>
                    )}

                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center gap-2">
                  <button
                    onClick={() => onFileComplaint(p, 'General Issue')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Flag className="w-3.5 h-3.5 text-amber-400" />
                    <span>File Complaint</span>
                  </button>

                  <button
                    onClick={() => onSelectProject(p)}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow transition flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View 3D Render & Photos</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* PUBLIC CITIZEN COMPLAINTS TRANSPARENCY FEED */}
      <div className="space-y-4 pt-6 border-t border-slate-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Citizen Grievances & Action Transparency Feed ({publicComplaints.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Public oversight and official action tracking</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publicComplaints.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 text-xs shadow-lg">
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-white text-sm block">{c.project_title}</span>
                  <span className="text-[11px] text-slate-500">{c.district}, {c.constituency} — Filed by {c.citizen_name}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] uppercase ${
                  c.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  c.status === 'In Progress' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {c.status}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold block text-[11px]">Report: {c.category}</span>
                <p className="text-slate-300">"{c.description}"</p>
                <span className="text-[10px] text-slate-500 block pt-1">Code: {c.tracking_code}</span>
              </div>

              {c.mla_response && (
                <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl text-emerald-300 space-y-1">
                  <strong className="block text-[11px] text-emerald-400">Official MLA Action Response:</strong>
                  <p className="text-slate-200">{c.mla_response}</p>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
