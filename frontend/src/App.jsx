import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MlaDashboard from './components/MlaDashboard';
import AgencyDashboard from './components/AgencyDashboard';
import FieldWorkerApp from './components/FieldWorkerApp';
import PublicPortal from './components/PublicPortal';
import ProjectDetailModal from './components/ProjectDetailModal';
import FundRequestModal from './components/FundRequestModal';
import ComplaintModal from './components/ComplaintModal';
import BudgetCalculatorModal from './components/BudgetCalculatorModal';
import { 
  FALLBACK_STATS, 
  FALLBACK_PROJECTS, 
  FALLBACK_FUND_REQUESTS, 
  FALLBACK_AUDIT_LOGS,
  getStoredProjects,
  getStoredFundRequests,
  updateStoredFundRequest,
  getStoredAuditLogs,
  storeAuditLog,
  getStoredComplaints,
  updateStoredComplaint
} from './utils/fallbackData';

export default function App() {
  const [currentRole, setCurrentRole] = useState('mla_admin'); // mla_admin, agency, field_worker, public
  const [activeDistrict, setActiveDistrict] = useState('ALL');
  
  const [projects, setProjects] = useState(getStoredProjects());
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [fundRequests, setFundRequests] = useState(getStoredFundRequests());
  const [auditLogs, setAuditLogs] = useState(getStoredAuditLogs());

  // Modals state
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showBudgetCalculator, setShowBudgetCalculator] = useState(false);
  const [complaintTarget, setComplaintTarget] = useState(null);
  const [complaintCategory, setComplaintCategory] = useState('Fake/Wrong Photo');

  // Fetch data with dynamic district filtering
  const fetchData = async () => {
    try {
      const pUrl = activeDistrict === 'ALL' ? '/api/projects' : `/api/projects?district=${encodeURIComponent(activeDistrict)}`;
      const sUrl = activeDistrict === 'ALL' ? '/api/dashboard/stats' : `/api/dashboard/stats?district=${encodeURIComponent(activeDistrict)}`;
      const [pRes, sRes, fRes, aRes] = await Promise.all([
        fetch(pUrl),
        fetch(sUrl),
        fetch('/api/fund-requests'),
        fetch('/api/audit-logs')
      ]);

      const pType = pRes.headers.get('content-type');
      const sType = sRes.headers.get('content-type');
      if (pRes.ok && sRes.ok && pType && pType.includes('application/json') && sType && sType.includes('application/json')) {
        const pData = await pRes.json();
        const sData = await sRes.json();
        const fData = await fRes.json().catch(() => getStoredFundRequests());
        const aData = await aRes.json().catch(() => getStoredAuditLogs());

        setProjects(pData);
        setStats(sData);
        setFundRequests(fData);
        setAuditLogs(aData);
      } else {
        applyFallbackData(activeDistrict);
      }
    } catch (err) {
      applyFallbackData(activeDistrict);
    }
  };

  const applyFallbackData = (dist) => {
    const stored = getStoredProjects();
    const filtered = dist === 'ALL'
      ? stored
      : stored.filter(p => (p.district || '').toLowerCase() === dist.toLowerCase());
    
    const totalSanctioned = filtered.reduce((acc, p) => acc + (p.sanctioned_amount || p.sanctioned_fund || 0), 0);
    const totalSpent = filtered.reduce((acc, p) => acc + (p.spent_amount || p.spent_fund || 0), 0);
    const completedCount = filtered.filter(p => p.status === 'Completed').length;
    const lowRisk = filtered.filter(p => !p.risk_level?.includes('High') && !p.risk_level?.includes('Medium')).length;
    const medRisk = filtered.filter(p => p.risk_level?.includes('Medium')).length;
    const highRisk = filtered.filter(p => p.risk_level?.includes('High')).length;

    setProjects(filtered);
    setStats({
      ...FALLBACK_STATS,
      total_projects: filtered.length,
      completed_count: completedCount,
      completed_projects: completedCount,
      total_sanctioned_fund_lakhs: parseFloat(totalSanctioned.toFixed(2)),
      total_sanctioned: parseFloat(totalSanctioned.toFixed(2)),
      total_spent_fund_lakhs: parseFloat(totalSpent.toFixed(2)),
      total_spent: parseFloat(totalSpent.toFixed(2)),
      risk_counts: { low: lowRisk, medium: medRisk, high: highRisk, critical: 0 },
      risk_distribution: [
        { name: 'Low Risk', count: lowRisk, color: '#10b981' },
        { name: 'Medium Risk', count: medRisk, color: '#f59e0b' },
        { name: 'High Risk', count: highRisk, color: '#ef4444' }
      ]
    });
    setFundRequests(getStoredFundRequests());
    setAuditLogs(getStoredAuditLogs());
  };

  useEffect(() => {
    fetchData();
  }, [activeDistrict]);

  const handleReviewFundRequest = async (id, action, justification = '') => {
    let backendSuccess = false;
    try {
      const res = await fetch(`/api/fund-requests/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, override_justification: justification })
      });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        backendSuccess = true;
      }
    } catch (err) {
      backendSuccess = false;
    }

    if (!backendSuccess) {
      updateStoredFundRequest(id, {
        status: action === 'approve' ? 'approved' : 'rejected',
        status_label: action === 'approve' ? 'Approved' : 'Rejected',
        status_color: action === 'approve' 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      });
      storeAuditLog({
        id: Date.now(),
        actor: 'Hon. MLA Rajesh Sharma',
        role: 'mla_admin',
        action_type: action === 'approve' ? 'FUND_RELEASE_APPROVED' : 'FUND_RELEASE_REJECTED',
        details: `${action === 'approve' ? 'Approved' : 'Rejected'} fund release request #${id}. Note: ${justification || 'Standard approval'}`,
        timestamp: new Date().toLocaleString()
      });
    }

    fetchData();
  };

  const handleFileComplaintOpen = (project, category = 'General Issue') => {
    setComplaintTarget(project);
    setComplaintCategory(category);
  };

  const handleRespondComplaint = async (complaintId, responseText) => {
    let backendSuccess = false;
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mla_response: responseText, status: 'In Progress' })
      });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        backendSuccess = true;
      }
    } catch (err) {
      backendSuccess = false;
    }

    if (!backendSuccess) {
      updateStoredComplaint(complaintId, { mla_response: responseText, status: 'In Progress' });
      storeAuditLog({
        id: Date.now(),
        actor: 'Hon. MLA Rajesh Sharma',
        role: 'mla_admin',
        action_type: 'GRIEVANCE_RESOLVED',
        details: `Responded to grievance #${complaintId}: "${responseText}"`,
        timestamp: new Date().toLocaleString()
      });
    }

    fetchData();
    if (selectedProject) {
      setSelectedProject(prev => prev ? ({
        ...prev,
        complaints: (prev.complaints || []).map(c => c.id === complaintId ? { ...c, mla_response: responseText } : c)
      }) : null);
    }
  };

  const districtsList = ['Varanasi', 'Jaipur', 'Bengaluru Urban', 'Thane'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Header Bar */}
      <Header
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        activeDistrict={activeDistrict}
        setActiveDistrict={setActiveDistrict}
        districts={districtsList}
      />

      {/* Main Role-Based Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {currentRole === 'mla_admin' && (
          <MlaDashboard
            stats={stats}
            projects={projects}
            fundRequests={fundRequests}
            auditLogs={auditLogs}
            activeDistrict={activeDistrict}
            setActiveDistrict={setActiveDistrict}
            onSelectProject={(p) => setSelectedProject(p)}
            onOpenNewRequest={() => setShowNewRequestModal(true)}
            onOpenBudgetCalculator={() => setShowBudgetCalculator(true)}
            onReviewFundRequest={handleReviewFundRequest}
            onRespondComplaint={handleRespondComplaint}
          />
        )}

        {currentRole === 'agency' && (
          <AgencyDashboard
            onProjectCreated={fetchData}
          />
        )}

        {currentRole === 'field_worker' && (
          <FieldWorkerApp
            projects={projects}
            onUpdateSubmitted={fetchData}
          />
        )}

        {currentRole === 'public' && (
          <PublicPortal
            stats={stats}
            projects={projects}
            activeDistrict={activeDistrict}
            setActiveDistrict={setActiveDistrict}
            onSelectProject={(p) => setSelectedProject(p)}
            onFileComplaint={handleFileComplaintOpen}
            onOpenBudgetCalculator={() => setShowBudgetCalculator(true)}
          />
        )}

      </main>

      {/* Modals */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          role={currentRole}
          onFileComplaint={handleFileComplaintOpen}
          onRespondComplaint={handleRespondComplaint}
        />
      )}

      {showNewRequestModal && (
        <FundRequestModal
          onClose={() => setShowNewRequestModal(false)}
          onRequestSubmitted={fetchData}
        />
      )}

      {showBudgetCalculator && (
        <BudgetCalculatorModal
          onClose={() => setShowBudgetCalculator(false)}
        />
      )}

      {complaintTarget && (
        <ComplaintModal
          project={complaintTarget}
          defaultCategory={complaintCategory}
          onClose={() => setComplaintTarget(null)}
          onComplaintSubmitted={fetchData}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>MPLAD AI Monitor — Smart India Hackathon 2026 (SIH26102 Prototype with Citizen Grievance & Budget Estimator)</p>
      </footer>

    </div>
  );
}
