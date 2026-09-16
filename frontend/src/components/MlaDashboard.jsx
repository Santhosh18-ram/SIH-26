import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldAlert, AlertTriangle, CheckCircle2, Clock, 
  TrendingUp, Layers, MapPin, Filter, ArrowUpDown, Plus, 
  Search, Eye, Sparkles, FileText, Activity, AlertCircle, TreePine,
  Database, ExternalLink, ShieldCheck, MessageSquare, Calculator, Send, Flag
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import InteractiveMap from './InteractiveMap';
import RejectProposalModal from './RejectProposalModal';
import { FALLBACK_PROPOSALS, FALLBACK_COMPLAINTS, FALLBACK_REF_PROJECTS } from '../utils/fallbackData';

export default function MlaDashboard({ 
  stats, projects, fundRequests, auditLogs, 
  onSelectProject, onOpenNewRequest, onOpenBudgetCalculator, onReviewFundRequest, onRespondComplaint 
}) {
  const [activeTab, setActiveTab] = useState('projects'); // projects, proposals, requests, complaints, reference, audit
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('location');
  const [sortOrder, setSortOrder] = useState('asc');

  // Agency Proposals State
  const [proposals, setProposals] = useState(FALLBACK_PROPOSALS);
  const [proposalJustifications, setProposalJustifications] = useState({});
  const [proposalSanctionAmounts, setProposalSanctionAmounts] = useState({});
  const [proposalWorkers, setProposalWorkers] = useState({});
  const [rejectModalProposal, setRejectModalProposal] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // Complaints state
  const [complaints, setComplaints] = useState(FALLBACK_COMPLAINTS);
  const [complaintFilterStatus, setComplaintFilterStatus] = useState('ALL');
  const [replyText, setReplyText] = useState({});

  // Reviewing fund request state
  const [justificationInput, setJustificationInput] = useState({});
  const [refProjectsData, setRefProjectsData] = useState(FALLBACK_REF_PROJECTS);
  const [refCategory, setRefCategory] = useState('ALL');
  const [refTerrain, setRefTerrain] = useState('ALL');

  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/projects/proposals');
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch (err) {
      console.warn("Proposals fetch error, using local state:", err);
      setProposals(FALLBACK_PROPOSALS);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints');
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (err) {
      console.warn("Complaints fetch error, using local state:", err);
      setComplaints(FALLBACK_COMPLAINTS);
    }
  };

  const fetchReferenceProjects = async () => {
    try {
      const catParam = refCategory !== 'ALL' ? encodeURIComponent(refCategory) : '';
      const terrainParam = refTerrain !== 'ALL' ? encodeURIComponent(refTerrain) : '';
      let url = '/api/reference-projects';
      const params = [];
      if (catParam) params.push(`category=${catParam}`);
      if (terrainParam) params.push(`terrain_type=${terrainParam}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRefProjectsData(data);
      }
    } catch (err) {
      console.warn("Reference projects fetch error:", err);
    }
  };

  useEffect(() => {
    fetchProposals();
    fetchComplaints();
    fetchReferenceProjects();
  }, [activeTab, refCategory, refTerrain]);

  const handleApproveProposal = async (proposalId, isOverSanction) => {
    const just = proposalJustifications[proposalId] || '';
    if (isOverSanction && !just.trim()) {
      alert("This project proposal has an Over-Sanction flag (>1.35x peer rates). A human override justification note is mandatory to approve.");
      return;
    }

    const customFund = proposalSanctionAmounts[proposalId] !== undefined 
      ? parseFloat(proposalSanctionAmounts[proposalId]) 
      : undefined;

    const workerId = proposalWorkers[proposalId] ? parseInt(proposalWorkers[proposalId]) : 2;
    const workerName = workerId === 2 ? 'Suresh Kumar (JE)' : workerId === 3 ? 'Ramesh Patel (Supervisor)' : 'Anita Singh (Inspector)';

    try {
      const res = await fetch(`/api/projects/${proposalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          sanctioned_fund: customFund,
          override_justification: just,
          approved_by: 'Hon. MLA Rajesh Sharma',
          assigned_worker_id: workerId,
          worker_name: workerName
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Approval failed');
      }

      alert("Project sanctioned & approved successfully! Now live in active projects and public map.");
      fetchProposals();
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmReject = async ({ reason }) => {
    if (!rejectModalProposal) return;
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/projects/${rejectModalProposal.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejection_reason: reason,
          approved_by: 'Hon. MLA Rajesh Sharma'
        })
      });

      if (res.ok) {
        setRejectModalProposal(null);
        fetchProposals();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || "Failed to reject proposal");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleSendResponse = async (complaintId) => {
    const text = replyText[complaintId];
    if (!text || !text.trim()) return;
    if (onRespondComplaint) {
      await onRespondComplaint(complaintId, text);
      fetchComplaints();
      setReplyText({ ...replyText, [complaintId]: '' });
    }
  };

  if (!stats) return <div className="p-8 text-center text-slate-400">Loading Command Center...</div>;

  const filteredProjects = projects.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (riskFilter !== 'ALL' && (p.risk_band || 'Low').toLowerCase() !== riskFilter.toLowerCase()) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.agency_name.toLowerCase().includes(q);
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

  const filteredComplaints = complaints.filter(c => {
    if (complaintFilterStatus !== 'ALL' && c.status !== complaintFilterStatus) return false;
    return true;
  });

  const riskPieData = [
    { name: 'Low Risk', value: stats.risk_counts.low, color: '#10b981' },
    { name: 'Medium Risk', value: stats.risk_counts.medium, color: '#eab308' },
    { name: 'High Risk', value: stats.risk_counts.high, color: '#f97316' },
    { name: 'Critical Risk', value: stats.risk_counts.critical, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">MLA Command Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              MPLAD AI Oversight & Sanction Guard
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time project supervision, ML risk scoring, sanction-time over-sanction guard, and citizen grievance redressal.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenBudgetCalculator}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 font-bold rounded-xl text-xs flex items-center space-x-2 transition"
          >
            <Calculator className="w-4 h-4" />
            <span>AI Budget & Cost Calculator</span>
          </button>

          <button
            onClick={onOpenNewRequest}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 flex items-center space-x-2 text-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Sanction Request</span>
          </button>
        </div>
      </div>

      {/* Command Center Analytics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-xs font-medium block">Total Projects</span>
          <div className="text-2xl font-extrabold text-white">{stats.total_projects}</div>
          <span className="text-[11px] text-cyan-400 font-semibold">{stats.completed_count} Completed</span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-xs font-medium block">Sanctioned Funds</span>
          <div className="text-2xl font-extrabold text-white">₹{stats.total_sanctioned_fund_lakhs}L</div>
          <span className="text-[11px] text-slate-400">Spent: ₹{stats.total_spent_fund_lakhs}L</span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-red-500/30 space-y-1">
          <span className="text-red-400 text-xs font-bold block flex items-center space-x-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>High/Critical Risk</span>
          </span>
          <div className="text-2xl font-extrabold text-red-400">{stats.risk_counts.high + stats.risk_counts.critical}</div>
          <span className="text-[11px] text-slate-400">Investigation Priority</span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-purple-500/30 space-y-1">
          <span className="text-purple-400 text-xs font-bold block flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Over-Sanction Flags</span>
          </span>
          <div className="text-2xl font-extrabold text-purple-400">{stats.over_sanction_count || 2}</div>
          <span className="text-[11px] text-slate-400">Peer Outliers Flagged</span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-amber-500/30 space-y-1">
          <span className="text-amber-400 text-xs font-bold block flex items-center space-x-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Citizen Complaints</span>
          </span>
          <div className="text-2xl font-extrabold text-amber-400">{complaints.length || stats.total_complaints}</div>
          <span className="text-[11px] text-red-400 font-semibold">{complaints.filter(c => c.status === 'Open').length} Open Issues</span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-xs font-medium block">Reference Pool</span>
          <div className="text-2xl font-extrabold text-emerald-400">{stats.reference_projects_pool_size || 23}</div>
          <span className="text-[11px] text-slate-400">mplads.gov.in Records</span>
        </div>

      </div>

      {/* Interactive Map & Risk Distribution Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>District Infrastructure Map (Risk Color Coded)</span>
            </h3>
            <span className="text-xs text-slate-400">Click marker to inspect project</span>
          </div>
          <InteractiveMap projects={projects} onSelectProject={onSelectProject} />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Risk Distribution Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400">4-Band ML Composite Risk Score Distribution</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            <div className="flex items-center space-x-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-slate-300">Low: {stats.risk_counts.low}</span></div>
            <div className="flex items-center space-x-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span className="text-slate-300">Medium: {stats.risk_counts.medium}</span></div>
            <div className="flex items-center space-x-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span><span className="text-slate-300">High: {stats.risk_counts.high}</span></div>
            <div className="flex items-center space-x-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span><span className="text-slate-300">Critical: {stats.risk_counts.critical}</span></div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-4 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('projects')}
          className={`py-3 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'projects' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>All Active Projects ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`py-3 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'proposals' 
              ? 'border-purple-500 text-purple-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="flex items-center space-x-1.5">
            <span>Agency Proposals & Sanction Approvals</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              proposals.filter(p => p.status === 'Pending Approval').length > 0
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {proposals.filter(p => p.status === 'Pending Approval').length} Pending
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`py-3 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'complaints' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-red-400" />
          <span>Citizen Grievance Redressal ({complaints.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reference')}
          className={`py-3 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'reference' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Reference Benchmark Database ({refProjectsData?.total_records || 23} Records)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'audit' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-400" />
          <span>Audit Log Trail</span>
        </button>
      </div>

      {/* TAB 1: ALL PROJECTS GRID WITH LOCATION SORTING */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search projects..."
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

            <div>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Risk Bands</option>
                <option value="low">Low Risk Only</option>
                <option value="medium">Medium Risk Only</option>
                <option value="high">High Risk Only</option>
                <option value="critical">Critical Risk Only</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none cursor-pointer font-semibold"
              >
                <option value="location">Sort by Location (District)</option>
                <option value="risk">Sort by AI Risk Score</option>
                <option value="budget">Sort by Sanctioned Budget</option>
                <option value="progress">Sort by Completion %</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-white"
                title="Toggle Sort Order"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end text-slate-400 font-semibold px-2">
              Showing {sortedProjects.length} projects
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">ID / Project Name</th>
                    <th className="p-3.5">Location & Terrain</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Budget (Lakhs)</th>
                    <th className="p-3.5">Physical Progress</th>
                    <th className="p-3.5">AI Risk Priority Score</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {sortedProjects.map((p) => {
                    const band = p.risk_band || 'Low';
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold text-white max-w-xs">
                          <div className="flex items-center space-x-2">
                            <span className="truncate text-sm">{p.title}</span>
                            {p.is_over_sanction_flag && (
                              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[9px] font-bold shrink-0">
                                Over-Sanction
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-normal">Agency: {p.agency_name}</span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center space-x-1 font-semibold text-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{p.district}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">{p.constituency} ({p.terrain_type})</span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-medium">
                            {p.category}
                          </span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap font-bold text-white">
                          ₹{p.sanctioned_fund}L
                          <span className="block text-[11px] text-slate-500 font-normal">Spent: ₹{p.spent_fund}L</span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-500 rounded-full"
                                style={{ width: `${p.current_progress_pct}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-white text-xs">{p.current_progress_pct}%</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">{p.status}</span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-1 rounded font-extrabold text-xs text-white ${
                              band === 'Critical' ? 'bg-red-600' :
                              band === 'High' ? 'bg-orange-500' :
                              band === 'Medium' ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}>
                              {p.risk_score}
                            </span>
                            <div className="text-[11px]">
                              <span className="font-semibold text-slate-300 block">{band} Risk</span>
                              <span className="text-slate-500">{p.primary_signal}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => onSelectProject(p)}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs shadow transition flex items-center space-x-1 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect AI Report</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: AGENCY PROPOSALS & APPROVAL QUEUE */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Executing Agency Project Proposals & Sanction Queue ({proposals.filter(p => p.status === 'Pending Approval').length} Pending)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Proposals submitted by PWD, Municipal Corporations, and Contractors. Review AI benchmarks before approving funds.
              </p>
            </div>
            <button
              onClick={fetchProposals}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg transition"
            >
              Refresh Queue
            </button>
          </div>

          {proposals.filter(p => p.status === 'Pending Approval').length === 0 ? (
            <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 text-xs">
              No pending agency project proposals in queue. Switch to "Agency / Proposer" role to submit new proposals.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {proposals.filter(p => p.status === 'Pending Approval').map((prop) => {
                const isOverSanction = prop.is_over_sanction_flag;
                const peerData = prop.peer_comparison;

                return (
                  <div 
                    key={prop.id}
                    className={`bg-slate-900 border rounded-2xl p-6 space-y-5 transition shadow-xl ${
                      isOverSanction ? 'border-amber-500/50 bg-slate-900/95' : 'border-slate-800'
                    }`}
                  >
                    {/* Header Details */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/20">
                            {prop.category}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                            {prop.terrain_type} Terrain
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                            GPS: {prop.lat}, {prop.lng}
                          </span>
                          {isOverSanction && (
                            <span className="text-xs font-bold px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Over-Sanction Flag ({peerData?.multiplier_ratio || 1.6}x Peer Baseline)</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-lg font-bold text-white">{prop.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{prop.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                          <div>📍 <strong>Location:</strong> {prop.district}, {prop.constituency}</div>
                          <div>🏢 <strong>Proposing Agency:</strong> {prop.proposer_agency || prop.agency_name}</div>
                          <div>👷 <strong>Contractor:</strong> {prop.contractor_name}</div>
                          {prop.proposer_contact && <div>📞 <strong>Contact:</strong> {prop.proposer_contact}</div>}
                        </div>
                      </div>

                      {/* Financial & Scope Badge */}
                      <div className="text-right bg-slate-950 p-4 rounded-xl border border-slate-800 min-w-[200px]">
                        <span className="text-xs text-slate-400 block mb-1">Proposed Budget:</span>
                        <span className="text-2xl font-black text-cyan-400 block">₹{prop.estimated_fund}L</span>
                        <span className="text-xs text-slate-300 block mt-1 font-medium">Scope: {prop.scope_value} {prop.scope_unit}</span>
                        <span className="text-[11px] text-slate-400 block">Target: {prop.estimated_days} Days</span>
                      </div>
                    </div>

                    {/* Visual & Environmental Strip */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 text-xs">
                      <div className="flex items-center space-x-3">
                        <TreePine className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-slate-400 text-[11px]">Tree Felling Quota:</div>
                          <div className="font-bold text-white">{prop.trees_to_cut} Trees Allowed Max</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-slate-400 text-[11px]">Demolitions Declared:</div>
                          <div className="font-bold text-white">
                            {prop.buildings_to_demolish} Structure(s) {prop.demolition_details ? `(${prop.demolition_details})` : ''}
                          </div>
                        </div>
                      </div>

                      {prop.future_visualization_url && (
                        <div className="flex items-center space-x-3">
                          <img 
                            src={prop.future_visualization_url} 
                            alt="3D Preview" 
                            className="w-12 h-10 object-cover rounded-lg border border-slate-700" 
                          />
                          <div>
                            <div className="text-slate-400 text-[11px]">3D Blueprint Render:</div>
                            <a 
                              href={prop.future_visualization_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-cyan-400 font-bold hover:underline flex items-center space-x-1"
                            >
                              <span>View Architectural Model</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Duplicate / Re-Application Warning Box */}
                    {prop.duplicate_suspects && prop.duplicate_suspects.length > 0 && (
                      <div className="p-4 rounded-xl text-xs space-y-2.5 bg-rose-950/40 border border-rose-500/50 text-rose-200">
                        <div className="flex items-center space-x-2 font-bold text-rose-400">
                          <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                          <span className="text-sm">🚨 CRITICAL AI FRAUD ALERT: Suspect Duplicate / Re-Application Detected!</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-xs">
                          The AI Duplicate Detection Engine found matching existing works. Sanctioning duplicate funds for already proposed or existing infrastructure is a primary MPLAD scheme violation.
                        </p>
                        <div className="space-y-1.5 pt-1">
                          {prop.duplicate_suspects.map((dup, dIdx) => (
                            <div key={dIdx} className="bg-slate-950/80 p-2.5 rounded-lg border border-rose-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <span className="font-bold text-white">Matching Work: {dup.title}</span>
                                <span className="text-[11px] text-slate-400 block">Category: {dup.category} • District: {dup.district} • Status: {dup.status}</span>
                              </div>
                              <div className="text-right sm:text-right">
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold font-mono text-xs">
                                  {dup.text_similarity}% Similarity ({dup.distance_km} km away)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Peer Benchmark Card */}
                    {peerData && (
                      <div className={`p-4 rounded-xl text-xs space-y-2.5 border ${
                        isOverSanction ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}>
                        <div className="flex justify-between items-center font-bold">
                          <span className="flex items-center space-x-1.5">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span>AI Sanction Intelligence (Benchmarked against mplads.gov.in reference records):</span>
                          </span>
                          <span className="text-[11px] text-slate-400">Sample: {peerData.peer_metrics?.peer_count || 3} Comparable Works</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{peerData.explanation_text}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">Typical Peer Range:</span>
                            <strong className="text-white text-xs">₹{peerData.peer_metrics?.typical_total_cost_min}L – ₹{peerData.peer_metrics?.typical_total_cost_max}L</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Peer Median Baseline:</span>
                            <strong className="text-emerald-400 text-xs">₹{peerData.peer_metrics?.typical_total_cost_median}L</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Proposed Cost Ratio:</span>
                            <strong className={`text-xs ${isOverSanction ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {peerData.multiplier_ratio}x typical benchmark
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Human Justification requirement if flagged */}
                    {isOverSanction && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-2 text-xs">
                        <label className="font-bold text-amber-300 flex items-center space-x-1.5">
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                          <span>Official MP/MLA Justification Note (Mandatory to Sanction Over-Benchmark Request):</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="State technical justification (e.g. specialized foundation piling required, soil stabilization, emergency flood barrier provisions)..."
                          value={proposalJustifications[prop.id] || prop.override_justification || ''}
                          onChange={(e) => setProposalJustifications({ ...proposalJustifications, [prop.id]: e.target.value })}
                          className="w-full bg-slate-900 border border-amber-500/30 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    )}

                    {/* Action Panel: Worker Assignment & Approval Buttons */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 border-t border-slate-800">
                      
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-slate-400">Assign Field Supervisor:</span>
                        <select
                          value={proposalWorkers[prop.id] || '2'}
                          onChange={(e) => setProposalWorkers({ ...proposalWorkers, [prop.id]: e.target.value })}
                          className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500"
                        >
                          <option value="2">Suresh Kumar (Junior Engineer)</option>
                          <option value="3">Ramesh Patel (Site Supervisor)</option>
                          <option value="4">Anita Singh (District Inspector)</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleApproveProposal(prop.id, isOverSanction)}
                          className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Sanction & Approve Project</span>
                        </button>

                        <button
                          onClick={() => setRejectModalProposal(prop)}
                          className="px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                        >
                          <span>Reject / Return</span>
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FUND REQUEST REVIEW QUEUE */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Pending Fund Sanction Requests ({fundRequests.filter(r => r.status === 'pending').length})
            </h3>
            <span className="text-xs text-slate-400">
              Evaluated against Public Reference Projects (mplads.gov.in) before release of funds
            </span>
          </div>

          {fundRequests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 text-xs">
              No pending fund sanction requests in queue.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {fundRequests.filter(r => r.status === 'pending').map((req) => {
                const peerCheck = req.peer_comparison_json ? JSON.parse(req.peer_comparison_json) : null;
                const isFlagged = req.is_over_sanction_flag;

                return (
                  <div key={req.id} className={`bg-slate-900 border p-6 rounded-2xl space-y-4 transition ${
                    isFlagged ? 'border-red-500/40 bg-slate-900/90' : 'border-slate-800'
                  }`}>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20">
                            {req.category}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                            {req.terrain_type || "Rural"} Terrain
                          </span>
                          {isFlagged && (
                            <span className="text-xs font-bold px-2.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>High Sanction Risk ({peerCheck?.multiplier_ratio || 2.4}x Peer Baseline)</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-white mt-1.5">{req.project_title}</h4>
                        <p className="text-xs text-slate-400">{req.district}, {req.constituency} — Requested by {req.requested_by}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-extrabold text-white bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 block">
                          ₹{req.requested_amount} Lakhs
                        </span>
                        <span className="text-[11px] text-slate-400">Scope: {req.scope_value} {req.scope_unit}</span>
                      </div>
                    </div>

                    {peerCheck && (
                      <div className={`p-4 rounded-xl text-xs space-y-2 border ${
                        isFlagged ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}>
                        <div className="flex justify-between items-center font-bold">
                          <span>Public Peer Group Comparison (mplads.gov.in Dataset):</span>
                          <span>Peer Sample Size: {peerCheck.peer_metrics?.peer_count || 14} Public Works</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{peerCheck.explanation_text}</p>

                        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] mt-1">
                          <div><span className="text-slate-500">Typical Peer Range:</span> <strong className="text-white">₹{peerCheck.peer_metrics?.typical_total_cost_min}L – ₹{peerCheck.peer_metrics?.typical_total_cost_max}L</strong></div>
                          <div><span className="text-slate-500">Peer Median Cost:</span> <strong className="text-emerald-400">₹{peerCheck.peer_metrics?.typical_total_cost_median}L</strong></div>
                          <div><span className="text-slate-500">Multiplier Ratio:</span> <strong className={isFlagged ? "text-red-400" : "text-white"}>{peerCheck.multiplier_ratio}x typical</strong></div>
                        </div>
                      </div>
                    )}

                    {isFlagged && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-red-500/20 space-y-2 text-xs">
                        <label className="font-bold text-red-400 flex items-center space-x-1">
                          <ShieldAlert className="w-4 h-4" />
                          <span>Human Override Justification Note (Required before sanction approval):</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="State technical justification (e.g. specialized medical oxygen line, hillside slope reinforcement, expedited timeline)..."
                          value={justificationInput[req.id] || req.override_justification || ''}
                          onChange={(e) => setJustificationInput({ ...justificationInput, [req.id]: e.target.value })}
                          className="w-full bg-slate-900 border border-red-500/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-400"
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => onReviewFundRequest(req.id, 'approve', justificationInput[req.id] || req.override_justification)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Release Funds</span>
                      </button>
                      
                      <button
                        onClick={() => onReviewFundRequest(req.id, 'reject')}
                        className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition"
                      >
                        Reject Sanction
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CITIZEN COMPLAINTS & GRIEVANCE REDRESSAL */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-red-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Public Citizen Grievance Portal</h3>
                <p className="text-slate-400 text-[11px]">Real-time citizen fraud, fake photo, and delay complaints filed across all constituency projects.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-semibold">Filter Status:</span>
              <select
                value={complaintFilterStatus}
                onChange={(e) => setComplaintFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses ({complaints.length})</option>
                <option value="Open">Open Issues ({complaints.filter(c => c.status === 'Open').length})</option>
                <option value="In Progress">In Progress ({complaints.filter(c => c.status === 'In Progress').length})</option>
                <option value="Resolved">Resolved ({complaints.filter(c => c.status === 'Resolved').length})</option>
              </select>
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 text-xs">
              No citizen complaints found for this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredComplaints.map((c) => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 text-xs shadow-lg">
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{c.project_title}</span>
                        <span className="text-[10px] text-slate-400">({c.district}, {c.constituency})</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Filed by: <strong className="text-slate-300">{c.citizen_name}</strong> on {c.created_at}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] font-bold text-cyan-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                        {c.tracking_code}
                      </span>
                      <span className={`px-2.5 py-1 rounded font-extrabold text-[10px] uppercase ${
                        c.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        c.status === 'In Progress' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>

                  {/* Issue Category & Details */}
                  <div className="space-y-1">
                    <span className="text-amber-400 font-bold flex items-center space-x-1">
                      <Flag className="w-3.5 h-3.5" />
                      <span>Category: {c.category}</span>
                    </span>
                    <p className="text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                      "{c.description}"
                    </p>
                  </div>

                  {/* Existing MLA Response if present */}
                  {c.mla_response && (
                    <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl text-emerald-300 space-y-1">
                      <strong className="block text-[11px] text-emerald-400">Official MLA Investigation Response:</strong>
                      <p className="text-slate-200">{c.mla_response}</p>
                    </div>
                  )}

                  {/* MLA Quick Action & Reply Form */}
                  <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2 items-end">
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        placeholder="Type official investigation response / action taken..."
                        value={replyText[c.id] || ''}
                        onChange={(e) => setReplyText({ ...replyText, [c.id]: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <button
                      onClick={() => handleSendResponse(c.id)}
                      className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs shadow flex items-center space-x-1 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Response</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 4: PUBLIC REFERENCE PROJECTS BENCHMARK DATABASE (mplads.gov.in) */}
      {activeTab === 'reference' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Public Reference Projects Benchmark Pool</h3>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                mplads.gov.in + Verified Completions
              </span>
            </div>
            <p className="text-xs text-slate-400">
              A continuously growing reference dataset of completed public infrastructure works used to establish statistical cost/duration baselines for sanction-time checks.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block mb-1 font-semibold">Category Filter:</span>
              <select
                value={refCategory}
                onChange={(e) => setRefCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
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

            <div>
              <span className="text-slate-400 block mb-1 font-semibold">Terrain Type:</span>
              <select
                value={refTerrain}
                onChange={(e) => setRefTerrain(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
              >
                <option value="ALL">All Terrains</option>
                <option value="Rural">Rural</option>
                <option value="Urban">Urban</option>
                <option value="Hilly / Mountainous">Hilly / Mountainous</option>
                <option value="Flood-Prone / Coastal">Flood-Prone / Coastal</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Public Project Title</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Terrain & Location</th>
                    <th className="p-3.5">Scope Size</th>
                    <th className="p-3.5">Actual Cost</th>
                    <th className="p-3.5">Unit Cost Benchmark</th>
                    <th className="p-3.5">Data Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {(!refProjectsData || !refProjectsData.projects || refProjectsData.projects.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        {refProjectsData ? 'No matching reference benchmark projects found for selected filters.' : 'Loading public benchmark records from mplads.gov.in...'}
                      </td>
                    </tr>
                  ) : (
                    refProjectsData.projects.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold text-white">{item.project_title}</td>
                        <td className="p-3.5"><span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded">{item.category}</span></td>
                        <td className="p-3.5">{item.district}, {item.state} <span className="text-slate-500 font-semibold block">({item.terrain_type})</span></td>
                        <td className="p-3.5">{item.scope_value} {item.scope_unit}</td>
                        <td className="p-3.5 font-bold text-white">₹{item.actual_completion_cost}L</td>
                        <td className="p-3.5 font-extrabold text-cyan-400">₹{item.cost_per_unit}L / {item.scope_unit}</td>
                        <td className="p-3.5"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-bold">{item.source} ({item.completion_year})</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOG TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
          <h3 className="font-bold text-white uppercase tracking-wider mb-2">System Audit Trail & Sanction Justifications</h3>
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-start text-slate-300 gap-4">
              <div>
                <strong className="text-cyan-400">{log.actor}</strong> ({log.role}) — <span className="text-white font-bold">{log.action_type}:</span> {log.details}
              </div>
              <span className="text-[11px] text-slate-500 shrink-0">{log.timestamp}</span>
            </div>
          ))}
        </div>
      )}

      {/* REJECT PROPOSAL IN-APP MODAL */}
      {rejectModalProposal && (
        <RejectProposalModal
          proposal={rejectModalProposal}
          isOpen={!!rejectModalProposal}
          onClose={() => setRejectModalProposal(null)}
          onConfirm={handleConfirmReject}
          loading={isRejecting}
        />
      )}

    </div>
  );
}
