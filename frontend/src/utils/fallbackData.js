export const FALLBACK_STATS = {
  total_projects: 10,
  completed_projects: 3,
  completed_count: 3,
  ongoing_projects: 5,
  high_risk_projects: 2,
  flagged_over_sanction: 3,
  total_sanctioned: 520.0,
  total_sanctioned_fund_lakhs: 520.0,
  total_spent: 312.5,
  total_spent_fund_lakhs: 312.5,
  total_complaints: 7,
  resolved_complaints: 3,
  total_reference_records: 23,
  by_category: [
    { name: 'Roads & Bridges', count: 4 },
    { name: 'Community Halls', count: 2 },
    { name: 'Schools & Education', count: 2 },
    { name: 'Health & Hospitals', count: 1 },
    { name: 'Water & Sanitation', count: 1 }
  ],
  risk_distribution: [
    { name: 'Low Risk', count: 5, color: '#10b981' },
    { name: 'Medium Risk', count: 3, color: '#f59e0b' },
    { name: 'High Risk', count: 2, color: '#ef4444' }
  ],
  risk_counts: { low: 5, medium: 3, high: 2, critical: 0 }
};

export const FALLBACK_PROJECTS = [
  {
    id: 1,
    title: 'Construction of All-Weather Bituminous Road, Shivpur Ward 14',
    category: 'Roads & Bridges',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    constituency: 'Varanasi Cantt',
    latitude: 25.3522,
    longitude: 82.9739,
    lat: 25.3522,
    lng: 82.9739,
    sanctioned_amount: 85.0,
    sanctioned_fund: 85.0,
    released_amount: 55.0,
    spent_amount: 52.3,
    spent_fund: 52.3,
    physical_progress: 65.0,
    current_progress_pct: 65.0,
    financial_progress: 61.5,
    status: 'In Progress',
    terrain_type: 'Urban',
    scope_unit: 'km',
    scope_value: 2.5,
    sanction_cost_per_unit: 34.0,
    benchmark_median_unit_cost: 28.0,
    sanction_overrun_pct: 21.4,
    sanction_risk_level: 'High Risk (>20%)',
    composite_risk_score: 35.0,
    risk_score: 35.0,
    risk_level: 'Low Risk',
    risk_band: 'Low',
    anomaly_flags: [],
    before_photo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80',
    future_render: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80',
    current_photo: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80',
    assigned_worker_id: 2,
    agency_name: 'Public Works Department (PWD)',
    created_at: '2025-01-10'
  },
  {
    id: 2,
    title: 'Multipurpose Community Hall & Skill Center, Sarnath',
    category: 'Community Halls',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    constituency: 'Varanasi Cantt',
    latitude: 25.3715,
    longitude: 83.0252,
    lat: 25.3715,
    lng: 83.0252,
    sanctioned_amount: 38.0,
    sanctioned_fund: 38.0,
    released_amount: 30.0,
    spent_amount: 28.5,
    spent_fund: 28.5,
    physical_progress: 75.0,
    current_progress_pct: 75.0,
    financial_progress: 75.0,
    status: 'In Progress',
    terrain_type: 'Rural',
    scope_unit: 'sqft',
    scope_value: 6000.0,
    sanction_cost_per_unit: 0.00633,
    benchmark_median_unit_cost: 0.00396,
    sanction_overrun_pct: 59.8,
    sanction_risk_level: 'High Risk (>20%)',
    composite_risk_score: 68.5,
    risk_score: 68.5,
    risk_level: 'High Risk',
    risk_band: 'High',
    anomaly_flags: ['High Budget Anomaly', 'Physical vs Financial Divergence'],
    before_photo: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80',
    future_render: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    current_photo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    assigned_worker_id: 2,
    agency_name: 'Gram Vikas Sansthan',
    created_at: '2025-02-01'
  },
  {
    id: 3,
    title: 'Solar Dual-Pump Drinking Water Facility, Bikaner Road',
    category: 'Water & Sanitation',
    district: 'Jaipur',
    state: 'Rajasthan',
    constituency: 'Jaipur Rural',
    latitude: 26.9124,
    longitude: 75.7873,
    lat: 26.9124,
    lng: 75.7873,
    sanctioned_amount: 24.0,
    sanctioned_fund: 24.0,
    released_amount: 24.0,
    spent_amount: 23.4,
    spent_fund: 23.4,
    physical_progress: 100.0,
    current_progress_pct: 100.0,
    financial_progress: 97.5,
    status: 'Completed',
    terrain_type: 'Rural',
    scope_unit: 'units',
    scope_value: 2.0,
    sanction_cost_per_unit: 12.0,
    benchmark_median_unit_cost: 11.75,
    sanction_overrun_pct: 2.1,
    sanction_risk_level: 'Fair Benchmark (0-10%)',
    composite_risk_score: 12.0,
    risk_score: 12.0,
    risk_level: 'Low Risk',
    risk_band: 'Low',
    anomaly_flags: [],
    before_photo: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
    future_render: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&q=80',
    current_photo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80',
    assigned_worker_id: 3,
    agency_name: 'Jal Nigam Division',
    created_at: '2024-11-15'
  },
  {
    id: 4,
    title: 'Smart Government Primary School Building, Bengaluru South',
    category: 'Schools & Education',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    constituency: 'Bengaluru South',
    latitude: 12.9250,
    longitude: 77.5938,
    lat: 12.9250,
    lng: 77.5938,
    sanctioned_amount: 78.0,
    sanctioned_fund: 78.0,
    released_amount: 60.0,
    spent_amount: 58.0,
    spent_fund: 58.0,
    physical_progress: 80.0,
    current_progress_pct: 80.0,
    financial_progress: 74.3,
    status: 'In Progress',
    terrain_type: 'Urban',
    scope_unit: 'sqft',
    scope_value: 15000.0,
    sanction_cost_per_unit: 0.0052,
    benchmark_median_unit_cost: 0.0051,
    sanction_overrun_pct: 1.9,
    sanction_risk_level: 'Fair Benchmark (0-10%)',
    composite_risk_score: 18.0,
    risk_score: 18.0,
    risk_level: 'Low Risk',
    risk_band: 'Low',
    anomaly_flags: [],
    before_photo: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80',
    future_render: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80',
    current_photo: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
    assigned_worker_id: 4,
    agency_name: 'Karnataka PWD',
    created_at: '2025-01-20'
  }
];

export const FALLBACK_PROPOSALS = [
  {
    id: 101,
    title: 'Panchayat Connecting Asphalt Road, Sarnath Phase 2',
    category: 'Roads & Bridges',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    constituency: 'Varanasi Cantt',
    latitude: 25.3720,
    longitude: 83.0260,
    lat: 25.3720,
    lng: 83.0260,
    proposed_cost: 95.0,
    estimated_cost: 65.0,
    estimated_fund: 95.0,
    terrain_type: 'Rural',
    scope_unit: 'km',
    scope_value: 2.5,
    proposal_status: 'pending_approval',
    status: 'Pending Approval',
    agency_name: 'Executive Engineer, PWD Varanasi Division',
    proposer_contact: 'pwd.varanasi@up.gov.in | +91-9876543210',
    description: 'Construction of heavy-duty asphalt road connecting rural Sarnath hamlets with district arterial highway.',
    is_duplicate_proposal: true,
    duplicate_match_title: 'Multipurpose Community Hall & Skill Center, Sarnath',
    duplicate_similarity_score: 0.88,
    duplicate_distance_km: 0.12,
    duplicate_resolution_note: 'Flagged: High spatial proximity (0.12km) with active project #2',
    is_over_sanction_flag: true,
    sanction_overrun_pct: 46.1,
    sanction_risk_level: 'High Sanction Risk',
    cost_per_unit: 38.0,
    benchmark_median_unit_cost: 26.0,
    created_at: '2025-03-01'
  }
];

export const FALLBACK_FUND_REQUESTS = [
  {
    id: 1,
    project_id: 2,
    project_title: 'Multipurpose Community Hall & Skill Center, Sarnath',
    requested_amount: 8.0,
    current_physical_progress: 75.0,
    current_financial_progress: 75.0,
    status: 'pending',
    status_label: 'Pending Review',
    status_color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    requested_by: 'Suresh Kumar (Junior Engineer)',
    request_notes: 'Plastering and electrical wiring completed. Requesting final milestone release.',
    created_at: '2025-03-05'
  }
];

export const FALLBACK_COMPLAINTS = [
  {
    id: 1,
    project_id: 1,
    citizen_name: 'Priya Sharma (Citizen)',
    citizen_phone: '+91-9876501234',
    category: 'Stalled Construction',
    description: 'Road excavation was done 3 weeks ago but no asphalt laying has started.',
    photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80',
    status: 'Open',
    tracking_code: 'CMP-2026-1045',
    created_at: '2025-03-02',
    mla_response: ''
  }
];

export const FALLBACK_AUDIT_LOGS = [
  {
    id: 1,
    actor: 'Hon. MLA Rajesh Sharma',
    role: 'mla_admin',
    action_type: 'SANCTION_APPROVED',
    details: 'Sanctioned INR 85.0L for Road Construction project with Over-Sanction validation.',
    timestamp: '2025-01-10 11:30:00'
  }
];

export const FALLBACK_REF_PROJECTS = {
  total_records: 23,
  average_cost_per_unit: 14.85,
  source_summary: 'Sourced from mplads.gov.in public expenditure reports and verified completed projects',
  projects: [
    { id: 1, project_title: 'PMGSY All-Weather Bituminous Road, Mirzapur', category: 'Roads & Bridges', scope_unit: 'km', scope_value: 4.0, terrain_type: 'Rural', district: 'Mirzapur', state: 'Uttar Pradesh', sanctioned_cost: 98.0, actual_completion_cost: 96.5, cost_per_unit: 24.125, duration_days: 180, source: 'mplads.gov.in', completion_year: 2024 },
    { id: 2, project_title: 'Gram Panchayat Public Hall, Phulpur', category: 'Community Halls', scope_unit: 'sqft', scope_value: 5000.0, terrain_type: 'Rural', district: 'Prayagraj', state: 'Uttar Pradesh', sanctioned_cost: 20.0, actual_completion_cost: 19.8, cost_per_unit: 0.00396, duration_days: 130, source: 'mplads.gov.in', completion_year: 2024 },
    { id: 3, project_title: 'Primary School 6-Classroom Block, Jaunpur', category: 'Schools & Education', scope_unit: 'sqft', scope_value: 8000.0, terrain_type: 'Rural', district: 'Jaunpur', state: 'Uttar Pradesh', sanctioned_cost: 36.0, actual_completion_cost: 35.5, cost_per_unit: 0.00444, duration_days: 180, source: 'mplads.gov.in', completion_year: 2024 }
  ]
};

// Client-side AI Peer Benchmark Engine (Offline / GitHub Pages fallback)
export function computePeerBenchmark(category, scopeUnit, scopeValue, terrainType, requestedAmount) {
  const val = parseFloat(scopeValue) || 1;
  const req = parseFloat(requestedAmount) || 0;
  
  const BASE_RATES = {
    'Roads & Bridges': { Rural: 24.5, Urban: 28.5, 'Hilly / Mountainous': 36.0, 'Flood-Prone / Coastal': 31.5 },
    'Community Halls': { Rural: 0.00396, Urban: 0.0045, 'Hilly / Mountainous': 0.0055, 'Flood-Prone / Coastal': 0.0048 },
    'Schools & Education': { Rural: 0.0044, Urban: 0.0051, 'Hilly / Mountainous': 0.0060, 'Flood-Prone / Coastal': 0.0057 },
    'Health & Hospitals': { Rural: 0.0064, Urban: 0.0074, 'Hilly / Mountainous': 0.0085, 'Flood-Prone / Coastal': 0.0078 },
    'Water & Sanitation': { Rural: 11.8, Urban: 13.5, 'Hilly / Mountainous': 15.0, 'Flood-Prone / Coastal': 14.2 },
    'Street Lighting': { Rural: 0.395, Urban: 0.44, 'Hilly / Mountainous': 0.50, 'Flood-Prone / Coastal': 0.46 }
  };

  const catRates = BASE_RATES[category] || { Rural: 20.0, Urban: 25.0, 'Hilly / Mountainous': 30.0, 'Flood-Prone / Coastal': 28.0 };
  const unitRate = catRates[terrainType] || catRates['Rural'] || 20.0;
  
  const expectedCost = parseFloat((unitRate * val).toFixed(2));
  const minCost = parseFloat((expectedCost * 0.90).toFixed(2));
  const maxCost = parseFloat((expectedCost * 1.15).toFixed(2));
  
  const userUnitCost = val > 0 ? parseFloat((req / val).toFixed(4)) : 0;
  const ratio = expectedCost > 0 ? parseFloat((req / expectedCost).toFixed(2)) : 1.0;
  const isFlagged = ratio >= 1.35;
  const riskLevel = isFlagged ? 'High Sanction Risk' : ratio >= 1.15 ? 'Moderate Risk' : 'Normal';
  const overrunPct = Math.max(0, parseFloat(((ratio - 1.0) * 100).toFixed(1)));

  const explanation = isFlagged 
    ? `This sanction request of ₹${req}L is ${ratio}x the typical cost for ${category} in ${terrainType} terrain (based on public records from mplads.gov.in). Expected range: ₹${minCost}L – ₹${maxCost}L. An official justification note is required to approve.`
    : `Sanction request of ₹${req}L aligns with peer government benchmarks (Expected: ₹${expectedCost}L).`;

  return {
    is_flagged: isFlagged,
    risk_level: riskLevel,
    ratio: ratio,
    multiplier_ratio: ratio,
    sanction_overrun_pct: overrunPct,
    user_unit_cost: userUnitCost,
    median_unit_cost: unitRate,
    expected_fair_cost: expectedCost,
    min_cost: minCost,
    max_cost: maxCost,
    explanation: explanation,
    explanation_text: explanation,
    comparable_count: 4,
    peer_metrics: {
      typical_total_cost_min: minCost,
      typical_total_cost_max: maxCost,
      typical_total_cost_median: expectedCost,
      peer_count: 4
    }
  };
}

// LocalStorage helpers for seamless demo flow (Localhost & GitHub Pages)
export function getStoredProjects() {
  try {
    const data = localStorage.getItem('mplad_projects');
    if (data) return JSON.parse(data);
  } catch (e) {}
  return FALLBACK_PROJECTS;
}

export function storeProject(project) {
  const existing = getStoredProjects();
  const updated = [project, ...existing.filter(p => p.id !== project.id)];
  try {
    localStorage.setItem('mplad_projects', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function updateStoredProject(id, updates) {
  const existing = getStoredProjects();
  const updated = existing.map(p => p.id === id ? { ...p, ...updates } : p);
  try {
    localStorage.setItem('mplad_projects', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function getStoredProposals() {
  try {
    const data = localStorage.getItem('mplad_proposals');
    if (data) return JSON.parse(data);
  } catch (e) {}
  return FALLBACK_PROPOSALS;
}

export function storeProposal(prop) {
  const existing = getStoredProposals();
  const updated = [prop, ...existing.filter(p => p.id !== prop.id)];
  try {
    localStorage.setItem('mplad_proposals', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function updateStoredProposal(id, updates) {
  const existing = getStoredProposals();
  const updated = existing.map(p => p.id === id ? { ...p, ...updates } : p);
  try {
    localStorage.setItem('mplad_proposals', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function getStoredComplaints() {
  try {
    const data = localStorage.getItem('mplad_complaints');
    if (data) return JSON.parse(data);
  } catch (e) {}
  return FALLBACK_COMPLAINTS;
}

export function storeComplaint(comp) {
  const existing = getStoredComplaints();
  const updated = [comp, ...existing.filter(c => c.id !== comp.id)];
  try {
    localStorage.setItem('mplad_complaints', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function updateStoredComplaint(id, updates) {
  const existing = getStoredComplaints();
  const updated = existing.map(c => c.id === id ? { ...c, ...updates } : c);
  try {
    localStorage.setItem('mplad_complaints', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function getStoredFundRequests() {
  try {
    const data = localStorage.getItem('mplad_fund_requests');
    if (data) return JSON.parse(data);
  } catch (e) {}
  return FALLBACK_FUND_REQUESTS;
}

export function storeFundRequest(req) {
  const existing = getStoredFundRequests();
  const updated = [req, ...existing.filter(r => r.id !== req.id)];
  try {
    localStorage.setItem('mplad_fund_requests', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function updateStoredFundRequest(id, updates) {
  const existing = getStoredFundRequests();
  const updated = existing.map(r => r.id === id ? { ...r, ...updates } : r);
  try {
    localStorage.setItem('mplad_fund_requests', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function getStoredAuditLogs() {
  try {
    const data = localStorage.getItem('mplad_audit_logs');
    if (data) return JSON.parse(data);
  } catch (e) {}
  return FALLBACK_AUDIT_LOGS;
}

export function storeAuditLog(log) {
  const existing = getStoredAuditLogs();
  const updated = [log, ...existing.filter(l => l.id !== log.id)];
  try {
    localStorage.setItem('mplad_audit_logs', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}
