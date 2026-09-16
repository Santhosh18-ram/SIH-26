import datetime
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)  # mla_admin, field_worker, public
    constituency = Column(String, nullable=True)
    district = Column(String, nullable=True)

class ReferenceProject(Base):
    """
    Public reference dataset sourced from mplads.gov.in, state PWDs, 
    and verified completed system projects for sanction-time peer comparison.
    """
    __tablename__ = "reference_projects"

    id = Column(Integer, primary_key=True, index=True)
    project_title = Column(String, nullable=False)
    category = Column(String, index=True, nullable=False)  # Roads & Bridges, Community Halls, Schools, etc.
    scope_unit = Column(String, nullable=False)  # km, sqft, units
    scope_value = Column(Float, nullable=False)
    terrain_type = Column(String, index=True, nullable=False, default="Rural")  # Urban, Rural, Hilly, Flood-Prone
    district = Column(String, index=True, nullable=False)
    state = Column(String, nullable=False, default="Uttar Pradesh")
    
    sanctioned_cost = Column(Float, nullable=False)  # in Lakhs INR
    actual_completion_cost = Column(Float, nullable=False)
    cost_per_unit = Column(Float, nullable=False)  # Cost per km or per sqft
    duration_days = Column(Integer, nullable=False)
    source = Column(String, nullable=False, default="mplads.gov.in")  # mplads.gov.in, PMGSY, State PWD, Verified Completion
    completion_year = Column(Integer, default=2025)
    created_at = Column(String, default=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, index=True, nullable=False)  # Roads, Schools, Community Halls, Health, Water, Lighting
    scope_unit = Column(String, nullable=False)  # km, sqft, units
    scope_value = Column(Float, nullable=False)
    terrain_type = Column(String, default="Rural")  # Urban, Rural, Hilly, Flood-Prone
    constituency = Column(String, index=True, nullable=False)
    district = Column(String, index=True, nullable=False)
    state = Column(String, nullable=False, default="Uttar Pradesh")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    sanctioned_fund = Column(Float, nullable=False)  # in Lakhs INR
    estimated_fund = Column(Float, nullable=False)
    estimated_days = Column(Integer, nullable=False)
    spent_fund = Column(Float, nullable=False, default=0.0)

    actual_start_date = Column(String, nullable=False)
    expected_completion_date = Column(String, nullable=False)
    actual_completion_date = Column(String, nullable=True)
    status = Column(String, index=True, nullable=False, default="In Progress")  # Planned/Upcoming, Not Started, In Progress, Delayed, Completed

    assigned_worker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    worker_name = Column(String, nullable=True)
    current_progress_pct = Column(Float, default=0.0)

    agency_name = Column(String, nullable=False)
    contractor_name = Column(String, nullable=False)

    # Environmental & Demolition Specs
    trees_to_cut = Column(Integer, default=0)
    buildings_to_demolish = Column(Integer, default=0)
    demolition_details = Column(Text, nullable=True)

    # Sanction-Time Over-Sanction Check
    is_over_sanction_flag = Column(Boolean, default=False)
    peer_comparison_json = Column(Text, nullable=True)
    override_justification = Column(Text, nullable=True)

    # Proposing Agency & Approvals
    proposer_agency = Column(String, nullable=True)
    proposer_contact = Column(String, nullable=True)
    approved_by = Column(String, nullable=True)
    approval_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Visualizations & Photos
    future_visualization_url = Column(String, nullable=True)
    before_photo_url = Column(String, nullable=True)
    photos_json = Column(Text, nullable=True, default="[]")

    created_at = Column(String, default=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    updates = relationship("WorkerUpdate", back_populates="project", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="project", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="project", cascade="all, delete-orphan")

class FundRequest(Base):
    __tablename__ = "fund_requests"

    id = Column(Integer, primary_key=True, index=True)
    project_title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    scope_unit = Column(String, nullable=False)
    scope_value = Column(Float, nullable=False)
    terrain_type = Column(String, default="Rural")  # Urban, Rural, Hilly, Flood-Prone
    district = Column(String, nullable=False)
    constituency = Column(String, nullable=False)
    requested_amount = Column(Float, nullable=False)
    requested_by = Column(String, nullable=False)
    
    trees_to_cut = Column(Integer, default=0)
    buildings_to_demolish = Column(Integer, default=0)
    demolition_details = Column(Text, nullable=True)
    future_visualization_url = Column(String, nullable=True)
    
    # Sanction-Time Peer Check Metrics
    is_over_sanction_flag = Column(Boolean, default=False)
    peer_comparison_json = Column(Text, nullable=True)
    override_justification = Column(Text, nullable=True)

    estimation_result_json = Column(Text, nullable=True)
    duplicate_warnings_json = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, approved, rejected
    created_at = Column(String, default=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    score = Column(Float, nullable=False)  # 0 to 100
    band = Column(String, nullable=False)  # Low, Medium, High, Critical
    signals_json = Column(Text, nullable=False)  # JSON dict of cost, time, fund, duplicate, geo
    primary_signal = Column(String, nullable=False)
    explanation_json = Column(Text, nullable=False)  # JSON list of plain language bullet explanations
    ml_anomaly_score = Column(Float, nullable=True)
    computed_at = Column(String, default=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    project = relationship("Project", back_populates="risk_assessments")

class WorkerUpdate(Base):
    __tablename__ = "worker_updates"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    worker_name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    progress_pct = Column(Float, nullable=False)
    expenditure_so_far = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    photo_url = Column(String, nullable=False)
    geotag_lat = Column(Float, nullable=True)
    geotag_lng = Column(Float, nullable=True)
    timestamp = Column(String, default=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    project = relationship("Project", back_populates="updates")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    worker_update_id = Column(Integer, ForeignKey("worker_updates.id"), nullable=True)
    citizen_name = Column(String, default="Anonymous Citizen")
    category = Column(String, nullable=False)  # Fake/Wrong Photo, Delay, Quality, Overrun, Location
    description = Column(Text, nullable=False)
    photo_url = Column(String, nullable=True)
    status = Column(String, default="Open")  # Open, In Progress, Resolved
    mla_response = Column(Text, nullable=True)
    tracking_code = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(String, default=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    project = relationship("Project", back_populates="complaints")

class StaticStats(Base):
    __tablename__ = "static_stats"

    id = Column(Integer, primary_key=True, index=True)
    constituency = Column(String, unique=True, index=True, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False, default="Uttar Pradesh")
    schools_built = Column(Integer, default=0)
    roads_built_km = Column(Float, default=0.0)
    community_halls_built = Column(Integer, default=0)
    healthcare_centers = Column(Integer, default=0)
    total_funds_sanctioned = Column(Float, default=0.0)
    total_funds_utilised = Column(Float, default=0.0)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String, nullable=False)
    role = Column(String, nullable=False)
    action_type = Column(String, nullable=False)
    target_type = Column(String, nullable=False)
    target_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=False)
    timestamp = Column(String, default=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
