export const FALLBACK_STATS = {
  total_projects: 10,
  completed_projects: 3,
  ongoing_projects: 5,
  high_risk_projects: 2,
  flagged_over_sanction: 3,
  total_sanctioned: 520.0,
  total_spent: 312.5,
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
  ]
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
    created_at: '2024-11-15'
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
    agency_name: 'Executive Engineer, PWD Varanasi Division',
    proposer_contact: 'pwd.varanasi@up.gov.in | +91-9876543210',
    description: 'Construction of heavy-duty asphalt road connecting rural Sarnath hamlets with district arterial highway.',
    is_duplicate_proposal: true,
    duplicate_match_title: 'Multipurpose Community Hall & Skill Center, Sarnath',
    duplicate_similarity_score: 0.88,
    duplicate_distance_km: 0.12,
    duplicate_resolution_note: 'Flagged: High spatial proximity (0.12km) with active project #2',
    sanction_overrun_pct: 46.1,
    sanction_risk_level: 'High Risk (>20%)',
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
    status: 'Under Review',
    created_at: '2025-03-02',
    mla_response: ''
  }
];

export const FALLBACK_AUDIT_LOGS = [
  {
    id: 1,
    actor: 'Hon. MLA Rajesh Sharma',
    role: 'MLA / Admin',
    action_type: 'SANCTION_APPROVED',
    details: 'Sanctioned INR 85.0L for Road Construction project with Over-Sanction validation.',
    timestamp: '2025-01-10 11:30'
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
