from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class UserBase(BaseModel):
    username: str
    name: str
    email: str
    role: str
    constituency: Optional[str] = None
    district: Optional[str] = None

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class ReferenceProjectResponse(BaseModel):
    id: int
    project_title: str
    category: str
    scope_unit: str
    scope_value: float
    terrain_type: str
    district: str
    state: str
    sanctioned_cost: float
    actual_completion_cost: float
    cost_per_unit: float
    duration_days: int
    source: str
    completion_year: int

    class Config:
        from_attributes = True

class SanctionCheckRequest(BaseModel):
    category: str
    scope_unit: str
    scope_value: float
    terrain_type: str = "Rural"  # Urban, Rural, Hilly, Flood-Prone
    requested_amount: float  # In Lakhs INR
    district: Optional[str] = "Varanasi"

class PeerGroupMetrics(BaseModel):
    peer_count: int
    median_cost_per_unit: float
    iqr_min_cost_per_unit: float
    iqr_max_cost_per_unit: float
    mean_cost_per_unit: float
    min_cost_per_unit: float
    max_cost_per_unit: float
    typical_total_cost_min: float
    typical_total_cost_max: float
    typical_total_cost_median: float
    requested_cost_per_unit: float
    multiplier_ratio: float
    is_outlier: bool
    risk_band: str  # Normal, Moderate Flag, High Sanction Risk

class SanctionCheckResponse(BaseModel):
    is_flagged: bool
    risk_level: str  # Normal, Moderate, High Sanction Risk
    multiplier_ratio: float
    peer_metrics: PeerGroupMetrics
    explanation_text: str
    requires_justification: bool
    comparable_sample_projects: List[Dict[str, Any]]

class ProjectEstimateRequest(BaseModel):
    title: str
    category: str
    scope_unit: str  # sqft, km, units
    scope_value: float
    terrain_type: Optional[str] = "Rural"
    district: str
    constituency: str
    sanctioned_fund: float
    trees_to_cut: Optional[int] = 0
    buildings_to_demolish: Optional[int] = 0
    lat: Optional[float] = 25.3176
    lng: Optional[float] = 82.9739

class ProjectEstimateResponse(BaseModel):
    estimated_fund: float
    estimated_days: int
    cost_per_unit: float
    baseline_median_cost_per_unit: float
    confidence_min_fund: float
    confidence_max_fund: float
    confidence_min_days: int
    confidence_max_days: int
    duplicate_suspects: List[Dict[str, Any]]
    environmental_impact_warning: Optional[str] = None
    sanction_peer_check: Optional[SanctionCheckResponse] = None

class RiskScoreRequest(BaseModel):
    project_id: Optional[int] = None
    title: Optional[str] = None
    category: Optional[str] = None
    scope_unit: Optional[str] = None
    scope_value: Optional[float] = None
    terrain_type: Optional[str] = "Rural"
    district: Optional[str] = None
    sanctioned_fund: Optional[float] = None
    spent_fund: Optional[float] = None
    current_progress_pct: Optional[float] = None
    actual_start_date: Optional[str] = None
    expected_completion_date: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    agency_name: Optional[str] = None

class RiskScoreResponse(BaseModel):
    score: float
    band: str  # Low, Medium, High, Critical
    primary_signal: str
    signals: Dict[str, float]
    ml_anomaly_score: float
    explanation: List[str]
    disclaimer: str = "This score is an investigation priority indicator, not proof of fraud."

class ProjectCreate(BaseModel):
    title: str
    description: str
    category: str
    scope_unit: str
    scope_value: float
    terrain_type: Optional[str] = "Rural"
    constituency: str
    district: str
    state: Optional[str] = "Uttar Pradesh"
    lat: float
    lng: float
    sanctioned_fund: float
    estimated_fund: float
    estimated_days: int
    actual_start_date: str
    expected_completion_date: str
    agency_name: str
    contractor_name: str
    assigned_worker_id: Optional[int] = None
    worker_name: Optional[str] = None
    trees_to_cut: Optional[int] = 0
    buildings_to_demolish: Optional[int] = 0
    demolition_details: Optional[str] = ""
    future_visualization_url: Optional[str] = ""
    before_photo_url: Optional[str] = ""
    is_over_sanction_flag: Optional[bool] = False
    override_justification: Optional[str] = ""

class WorkerUpdateCreate(BaseModel):
    project_id: int
    worker_id: int
    worker_name: str
    status: str
    progress_pct: float
    expenditure_so_far: float
    notes: Optional[str] = ""
    photo_url: str
    geotag_lat: Optional[float] = None
    geotag_lng: Optional[float] = None

class ComplaintCreate(BaseModel):
    project_id: int
    worker_update_id: Optional[int] = None
    citizen_name: Optional[str] = "Anonymous Citizen"
    category: str
    description: str
    photo_url: Optional[str] = ""

class FundRequestCreate(BaseModel):
    project_title: str
    description: str
    category: str
    scope_unit: str
    scope_value: float
    terrain_type: Optional[str] = "Rural"
    district: str
    constituency: str
    requested_amount: float
    requested_by: str
    trees_to_cut: Optional[int] = 0
    buildings_to_demolish: Optional[int] = 0
    demolition_details: Optional[str] = ""
    future_visualization_url: Optional[str] = ""
    is_over_sanction_flag: Optional[bool] = False
    override_justification: Optional[str] = ""

class ProjectProposalCreate(BaseModel):
    title: str
    description: str
    category: str
    scope_unit: str
    scope_value: float
    terrain_type: Optional[str] = "Rural"
    district: str
    constituency: str
    lat: float
    lng: float
    estimated_fund: float  # Proposed budget in Lakhs INR
    estimated_days: int
    agency_name: str
    contractor_name: str
    proposer_contact: Optional[str] = ""
    trees_to_cut: Optional[int] = 0
    buildings_to_demolish: Optional[int] = 0
    demolition_details: Optional[str] = ""
    future_visualization_url: Optional[str] = ""
    before_photo_url: Optional[str] = ""

class ProjectApprovalAction(BaseModel):
    action: str  # "approve" or "reject"
    sanctioned_fund: Optional[float] = None
    approval_notes: Optional[str] = ""
    override_justification: Optional[str] = ""
    approved_by: Optional[str] = "Hon. MP / MLA Office"
    assigned_worker_id: Optional[int] = None
    worker_name: Optional[str] = None
    rejection_reason: Optional[str] = ""

