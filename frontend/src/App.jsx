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
import { FALLBACK_STATS, FALLBACK_PROJECTS, FALLBACK_FUND_REQUESTS } from './utils/fallbackData';

export default function App() {
  const [currentRole, setCurrentRole] = useState('mla_admin'); // mla_admin, agency, field_worker, public
  const [activeDistrict, setActiveDistrict] = useState('ALL');
  
  const [projects, setProjects] = useState(FALLBACK_PROJECTS);
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [fundRequests, setFundRequests] = useState(FALLBACK_FUND_REQUESTS);
  const [auditLogs, setAuditLogs] = useState([]);

  // Modals state
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showBudgetCalculator, setShowBudgetCalculator] = useState(false);
  const [complaintTarget, setComplaintTarget] = useState(null);
  const [complaintCategory, setComplaintCategory] = useState('Fake/Wrong Photo');

  // Fetch initial data
  const fetchData = async () => {
    try {
      const pUrl = activeDistrict === 'ALL' ? '/api/projects' : `/api/projects?district=${encodeURIComponent(activeDistrict)}`;
      const [pRes, sRes, fRes, aRes] = await Promise.all([
        fetch(pUrl),
        fetch('/api/dashboard/stats'),
        fetch('/api/fund-requests'),
        fetch('/api/audit-logs')
      ]);

      if (pRes.ok && sRes.ok) {
        const pData = await pRes.json();
        const sData = await sRes.json();
        const fData = await fRes.json();
        const aData = await aRes.json();

        setProjects(pData);
        setStats(sData);
        setFundRequests(fData);
        setAuditLogs(aData);
      }
    } catch (err) {
      console.warn("Backend API not reachable, running in Standalone / Offline mode:", err);
      setProjects(FALLBACK_PROJECTS);
      setStats(FALLBACK_STATS);
      setFundRequests(FALLBACK_FUND_REQUESTS);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeDistrict]);

  const handleReviewFundRequest = async (id, action, justification = '') => {
    try {
      const res = await fetch(`/api/fund-requests/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, override_justification: justification })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || "Error reviewing fund request");
        return;
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileComplaintOpen = (project, category = 'General Issue') => {
    setComplaintTarget(project);
    setComplaintCategory(category);
  };

  const handleRespondComplaint = async (complaintId, responseText) => {
    try {
      await fetch(`/api/complaints/${complaintId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mla_response: responseText, status: 'In Progress' })
      });
      fetchData();
      if (selectedProject) {
        const detailRes = await fetch(`/api/projects/${selectedProject.id}`);
        const detailData = await detailRes.json();
        setSelectedProject({ ...detailData.project, ...detailData.risk_assessment, complaint_count: detailData.complaints.length, update_count: detailData.worker_updates.length });
      }
    } catch (err) {
      console.error(err);
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
