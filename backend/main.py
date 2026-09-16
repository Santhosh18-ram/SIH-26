import os
import json
import random
import datetime
import shutil
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import User, Project, ReferenceProject, FundRequest, RiskAssessment, WorkerUpdate, Complaint, StaticStats, AuditLog
from schemas import (
    UserResponse, ReferenceProjectResponse, SanctionCheckRequest, SanctionCheckResponse,
    ProjectEstimateRequest, ProjectEstimateResponse, RiskScoreRequest, RiskScoreResponse,
    ProjectCreate, WorkerUpdateCreate, ComplaintCreate, FundRequestCreate,
    ProjectProposalCreate, ProjectApprovalAction
)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from ml_engine import estimate_project, compute_risk_score, check_sanction_overrun, haversine_distance
from seed_data import seed_database

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MPLAD AI Monitor API",
    description="Backend AI Estimation, Sanction-Time Over-Sanction Detection & Multi-Signal Risk Engine",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    if db.query(Project).count() == 0 or db.query(ReferenceProject).count() == 0:
        print("Empty database or missing reference projects. Running initial seed...")
        seed_database()

@app.get("/api/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@app.get("/api/reference-projects")
def get_reference_projects(
    category: Optional[str] = None,
    terrain_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ReferenceProject)
    if category and category != "ALL":
        query = query.filter(ReferenceProject.category == category)
    if terrain_type and terrain_type != "ALL":
        query = query.filter(ReferenceProject.terrain_type == terrain_type)

    projects = query.order_by(ReferenceProject.id.desc()).all()
    total_count = len(projects)
    avg_cost_unit = round(sum(p.cost_per_unit for p in projects) / total_count, 4) if total_count > 0 else 0.0

    return {
        "total_records": total_count,
        "average_cost_per_unit": avg_cost_unit,
        "source_summary": "Sourced from mplads.gov.in public expenditure reports and verified completed projects",
        "projects": [
            {
                "id": p.id,
                "project_title": p.project_title,
                "category": p.category,
                "scope_unit": p.scope_unit,
                "scope_value": p.scope_value,
                "terrain_type": p.terrain_type,
                "district": p.district,
                "state": p.state,
                "sanctioned_cost": p.sanctioned_cost,
                "actual_completion_cost": p.actual_completion_cost,
                "cost_per_unit": p.cost_per_unit,
                "duration_days": p.duration_days,
                "source": p.source,
                "completion_year": p.completion_year
            } for p in projects
        ]
    }

@app.post("/api/sanction-check", response_model=SanctionCheckResponse)
def check_sanction_request(req: SanctionCheckRequest, db: Session = Depends(get_db)):
    result = check_sanction_overrun(
        db_session=db,
        category=req.category,
        scope_unit=req.scope_unit,
        scope_value=req.scope_value,
        terrain_type=req.terrain_type,
        requested_amount=req.requested_amount,
        district=req.district
    )
    return result

@app.get("/api/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(50).all()
    return logs

@app.post("/api/estimate", response_model=ProjectEstimateResponse)
def estimate_cost_and_timeline(req: ProjectEstimateRequest, db: Session = Depends(get_db)):
    db_projects = db.query(Project).all()
    est = estimate_project(
        db_projects=db_projects,
        title=req.title,
        category=req.category,
        scope_unit=req.scope_unit,
        scope_value=req.scope_value,
        district=req.district,
        sanctioned_fund=req.sanctioned_fund,
        trees_to_cut=req.trees_to_cut or 0,
        buildings_to_demolish=req.buildings_to_demolish or 0,
        terrain_type=req.terrain_type or "Rural",
        lat=req.lat or 25.3176,
        lng=req.lng or 82.9739,
        db_session=db
    )
    return est

@app.post("/api/risk-score", response_model=RiskScoreResponse)
def get_live_risk_score(req: RiskScoreRequest, db: Session = Depends(get_db)):
    db_projects = db.query(Project).all()

    if req.project_id:
        proj = db.query(Project).filter(Project.id == req.project_id).first()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")
    else:
        proj = Project(
            id=9999,
            title=req.title or "New Fund Request",
            description="",
            category=req.category or "Roads & Bridges",
            scope_unit=req.scope_unit or "km",
            scope_value=req.scope_value or 1.0,
            terrain_type=req.terrain_type or "Rural",
            constituency="General",
            district=req.district or "Varanasi",
            sanctioned_fund=req.sanctioned_fund or 50.0,
            spent_fund=req.spent_fund or 0.0,
            estimated_fund=req.sanctioned_fund or 50.0,
            estimated_days=90,
            actual_start_date=req.actual_start_date or datetime.datetime.now().strftime("%Y-%m-%d"),
            expected_completion_date=req.expected_completion_date or (datetime.datetime.now() + datetime.timedelta(days=90)).strftime("%Y-%m-%d"),
            status="In Progress",
            current_progress_pct=req.current_progress_pct or 0.0,
            agency_name=req.agency_name or "General Agency",
            contractor_name="General Contractor",
            lat=req.lat or 25.3176,
            lng=req.lng or 82.9739
        )

    score_result = compute_risk_score(db_projects, proj, db)
    return score_result

@app.get("/api/projects")
def get_projects(
    role: Optional[str] = "public",
    worker_id: Optional[int] = None,
    district: Optional[str] = None,
    constituency: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    risk_band: Optional[str] = None,
    terrain_type: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = Query("id", description="id, location, risk, budget, progress, title"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
    db: Session = Depends(get_db)
):
    query = db.query(Project)

    if role == "field_worker" and worker_id:
        query = query.filter(Project.assigned_worker_id == worker_id)
    elif role == "public":
        # Public users see approved and active/completed projects, not unapproved internal proposals
        query = query.filter(~Project.status.in_(["Pending Approval", "Rejected"]))

    if district:
        query = query.filter(Project.district == district)
    if constituency:
        query = query.filter(Project.constituency == constituency)
    if category:
        query = query.filter(Project.category == category)
    if status:
        query = query.filter(Project.status == status)
    if terrain_type:
        query = query.filter(Project.terrain_type == terrain_type)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter((Project.title.ilike(search_fmt)) | (Project.description.ilike(search_fmt)) | (Project.agency_name.ilike(search_fmt)))

    projects = query.all()
    results = []

    for p in projects:
        risk_rec = db.query(RiskAssessment).filter(RiskAssessment.project_id == p.id).order_by(RiskAssessment.id.desc()).first()
        complaint_count = db.query(Complaint).filter(Complaint.project_id == p.id).count()
        update_count = db.query(WorkerUpdate).filter(WorkerUpdate.project_id == p.id).count()

        risk_score = risk_rec.score if risk_rec else 15.0
        band = risk_rec.band if risk_rec else "Low"
        primary_signal = risk_rec.primary_signal if risk_rec else "None"
        explanation = json.loads(risk_rec.explanation_json) if risk_rec and risk_rec.explanation_json else []
        signals = json.loads(risk_rec.signals_json) if risk_rec and risk_rec.signals_json else {}

        if risk_band and band.lower() != risk_band.lower():
            continue

        item = {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "category": p.category,
            "scope_unit": p.scope_unit,
            "scope_value": p.scope_value,
            "terrain_type": p.terrain_type or "Rural",
            "constituency": p.constituency,
            "district": p.district,
            "state": p.state,
            "lat": p.lat,
            "lng": p.lng,
            "sanctioned_fund": p.sanctioned_fund,
            "estimated_fund": p.estimated_fund,
            "spent_fund": p.spent_fund,
            "estimated_days": p.estimated_days,
            "actual_start_date": p.actual_start_date,
            "expected_completion_date": p.expected_completion_date,
            "status": p.status,
            "assigned_worker_id": p.assigned_worker_id,
            "worker_name": p.worker_name,
            "current_progress_pct": p.current_progress_pct,
            "agency_name": p.agency_name,
            "contractor_name": p.contractor_name,
            "proposer_agency": p.proposer_agency or p.agency_name,
            "proposer_contact": p.proposer_contact or "",
            "approved_by": p.approved_by or "",
            "approval_notes": p.approval_notes or "",
            "rejection_reason": p.rejection_reason or "",
            "trees_to_cut": p.trees_to_cut or 0,
            "buildings_to_demolish": p.buildings_to_demolish or 0,
            "demolition_details": p.demolition_details or "",
            "is_over_sanction_flag": bool(p.is_over_sanction_flag),
            "override_justification": p.override_justification or "",
            "future_visualization_url": p.future_visualization_url or "",
            "before_photo_url": p.before_photo_url or "",
            "photos": json.loads(p.photos_json) if p.photos_json else [],
            "risk_score": risk_score,
            "risk_band": band,
            "primary_signal": primary_signal,
            "explanation": explanation,
            "signals": signals,
            "complaint_count": complaint_count,
            "update_count": update_count,
            "created_at": p.created_at
        }
        results.append(item)

    reverse = (sort_order == "desc")
    if sort_by == "location":
        results.sort(key=lambda x: (x["district"], x["constituency"]), reverse=reverse)
    elif sort_by == "risk":
        results.sort(key=lambda x: x["risk_score"], reverse=reverse)
    elif sort_by == "budget":
        results.sort(key=lambda x: x["sanctioned_fund"], reverse=reverse)
    elif sort_by == "progress":
        results.sort(key=lambda x: x["current_progress_pct"], reverse=reverse)
    elif sort_by == "title":
        results.sort(key=lambda x: x["title"], reverse=reverse)
    else:
        results.sort(key=lambda x: x["id"], reverse=reverse)

    return results

# --- EXECUTING AGENCY / PROPOSER ENDPOINTS ---
@app.post("/api/projects/propose")
def propose_project(data: ProjectProposalCreate, db: Session = Depends(get_db)):
    # Run sanction check
    peer_check = check_sanction_overrun(
        db_session=db,
        category=data.category,
        scope_unit=data.scope_unit,
        scope_value=data.scope_value,
        terrain_type=data.terrain_type or "Rural",
        requested_amount=data.estimated_fund,
        district=data.district
    )

    proj = Project(
        title=data.title,
        description=data.description,
        category=data.category,
        scope_unit=data.scope_unit,
        scope_value=data.scope_value,
        terrain_type=data.terrain_type or "Rural",
        constituency=data.constituency,
        district=data.district,
        state="Uttar Pradesh",
        lat=data.lat,
        lng=data.lng,
        sanctioned_fund=data.estimated_fund,  # Initial proposed value
        estimated_fund=data.estimated_fund,
        estimated_days=data.estimated_days,
        spent_fund=0.0,
        actual_start_date=datetime.datetime.now().strftime("%Y-%m-%d"),
        expected_completion_date=(datetime.datetime.now() + datetime.timedelta(days=data.estimated_days)).strftime("%Y-%m-%d"),
        status="Pending Approval",
        current_progress_pct=0.0,
        agency_name=data.agency_name,
        contractor_name=data.contractor_name,
        proposer_agency=data.agency_name,
        proposer_contact=data.proposer_contact or "",
        trees_to_cut=data.trees_to_cut or 0,
        buildings_to_demolish=data.buildings_to_demolish or 0,
        demolition_details=data.demolition_details or "",
        is_over_sanction_flag=peer_check["is_flagged"],
        peer_comparison_json=json.dumps(peer_check),
        future_visualization_url=data.future_visualization_url or "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80",
        before_photo_url=data.before_photo_url or "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80",
        photos_json="[]"
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)

    all_projects = db.query(Project).all()
    risk_info = compute_risk_score(all_projects, proj, db)

    risk = RiskAssessment(
        project_id=proj.id,
        score=risk_info["score"],
        band=risk_info["band"],
        signals_json=json.dumps(risk_info["signals"]),
        primary_signal=risk_info["primary_signal"],
        explanation_json=json.dumps(risk_info["explanation"]),
        ml_anomaly_score=risk_info["ml_anomaly_score"]
    )
    db.add(risk)

    audit = AuditLog(
        actor=data.agency_name,
        role="agency",
        action_type="PROPOSE_PROJECT",
        target_type="Project",
        target_id=proj.id,
        details=f"Agency '{data.agency_name}' submitted new project proposal '{proj.title}' (Estimated: ₹{proj.estimated_fund}L). Status: Pending MP/MLA Approval.",
        timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Project proposed successfully and queued for MP/MLA sanction review.",
        "id": proj.id,
        "status": proj.status,
        "peer_check": peer_check
    }

@app.get("/api/projects/proposals")
def get_project_proposals(db: Session = Depends(get_db)):
    proposals = db.query(Project).filter(Project.status.in_(["Pending Approval", "Rejected"])).order_by(Project.id.desc()).all()
    all_projects = db.query(Project).all()
    results = []

    for p in proposals:
        peer_data = json.loads(p.peer_comparison_json) if p.peer_comparison_json else None
        risk_rec = db.query(RiskAssessment).filter(RiskAssessment.project_id == p.id).order_by(RiskAssessment.id.desc()).first()

        # Check for duplicate suspects against all other projects in DB
        duplicate_suspects = []
        other_projects = [op for op in all_projects if op.id != p.id]
        if other_projects:
            descriptions = [f"{op.title} {op.description}" for op in other_projects]
            all_texts = [f"{p.title} {p.description}"] + descriptions
            try:
                tfidf = TfidfVectorizer().fit_transform(all_texts)
                sim_matrix = cosine_similarity(tfidf[0:1], tfidf[1:]).flatten()
                for idx, op in enumerate(other_projects):
                    sim_score = float(sim_matrix[idx])
                    dist_km = haversine_distance(p.lat, p.lng, op.lat, op.lng)
                    if sim_score >= 0.40 or (sim_score >= 0.25 and dist_km <= 3.0):
                        duplicate_suspects.append({
                            "project_id": op.id,
                            "title": op.title,
                            "category": op.category,
                            "district": op.district,
                            "status": op.status,
                            "sanctioned_fund": op.sanctioned_fund,
                            "text_similarity": round(sim_score * 100, 1),
                            "distance_km": round(dist_km, 2),
                            "warning": f"Suspect duplicate of '{op.title}' (#{op.id}, Status: {op.status}) with {round(sim_score*100,1)}% text similarity ({round(dist_km,2)} km away)."
                        })
            except Exception:
                pass

        results.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "category": p.category,
            "scope_unit": p.scope_unit,
            "scope_value": p.scope_value,
            "terrain_type": p.terrain_type or "Rural",
            "constituency": p.constituency,
            "district": p.district,
            "state": p.state,
            "lat": p.lat,
            "lng": p.lng,
            "estimated_fund": p.estimated_fund,
            "sanctioned_fund": p.sanctioned_fund,
            "estimated_days": p.estimated_days,
            "status": p.status,
            "agency_name": p.agency_name,
            "contractor_name": p.contractor_name,
            "proposer_agency": p.proposer_agency or p.agency_name,
            "proposer_contact": p.proposer_contact or "",
            "trees_to_cut": p.trees_to_cut or 0,
            "buildings_to_demolish": p.buildings_to_demolish or 0,
            "demolition_details": p.demolition_details or "",
            "is_over_sanction_flag": bool(p.is_over_sanction_flag),
            "override_justification": p.override_justification or "",
            "approved_by": p.approved_by or "",
            "approval_notes": p.approval_notes or "",
            "rejection_reason": p.rejection_reason or "",
            "future_visualization_url": p.future_visualization_url or "",
            "before_photo_url": p.before_photo_url or "",
            "peer_comparison": peer_data,
            "duplicate_suspects": duplicate_suspects,
            "risk_score": risk_rec.score if risk_rec else 15.0,
            "risk_band": risk_rec.band if risk_rec else "Low",
            "created_at": p.created_at
        })

    return results

@app.post("/api/projects/{project_id}/approve")
def approve_project_proposal(project_id: int, action_data: ProjectApprovalAction, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project proposal not found")

    if action_data.action == "reject":
        proj.status = "Rejected"
        proj.rejection_reason = action_data.rejection_reason or action_data.approval_notes or "Rejected by MP/MLA office."
        
        audit = AuditLog(
            actor=action_data.approved_by or "Hon. MP / MLA Office",
            role="mla_admin",
            action_type="REJECT_PROJECT_PROPOSAL",
            target_type="Project",
            target_id=proj.id,
            details=f"Rejected proposal for '{proj.title}'. Reason: {proj.rejection_reason}",
            timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        db.add(audit)
        db.commit()
        return {"message": "Project proposal rejected", "status": proj.status}

    # Approving project
    if proj.is_over_sanction_flag and not action_data.override_justification and not proj.override_justification:
        raise HTTPException(status_code=400, detail="This project proposal is flagged with an Over-Sanction warning. A formal justification note is required to approve.")

    sanctioned_amount = action_data.sanctioned_fund if action_data.sanctioned_fund is not None else proj.estimated_fund
    proj.sanctioned_fund = sanctioned_amount
    proj.status = "In Progress"
    proj.approved_by = action_data.approved_by or "Hon. MP / MLA Office"
    proj.approval_notes = action_data.approval_notes or "Sanction approved after review of AI peer benchmarks."
    if action_data.override_justification:
        proj.override_justification = action_data.override_justification
    if action_data.assigned_worker_id:
        proj.assigned_worker_id = action_data.assigned_worker_id
        proj.worker_name = action_data.worker_name

    # Recalculate risk with approved budget
    all_projects = db.query(Project).all()
    risk_info = compute_risk_score(all_projects, proj, db)
    risk_rec = db.query(RiskAssessment).filter(RiskAssessment.project_id == proj.id).first()
    if risk_rec:
        risk_rec.score = risk_info["score"]
        risk_rec.band = risk_info["band"]
        risk_rec.signals_json = json.dumps(risk_info["signals"])
        risk_rec.primary_signal = risk_info["primary_signal"]
        risk_rec.explanation_json = json.dumps(risk_info["explanation"])
        risk_rec.ml_anomaly_score = risk_info["ml_anomaly_score"]

    audit = AuditLog(
        actor=action_data.approved_by or "Hon. MP / MLA Office",
        role="mla_admin",
        action_type="APPROVE_PROJECT_PROPOSAL",
        target_type="Project",
        target_id=proj.id,
        details=f"Sanctioned & Approved project '{proj.title}' with budget ₹{proj.sanctioned_fund} Lakhs. Status changed to 'In Progress'.",
        timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(audit)
    db.commit()

    return {"message": "Project proposal approved and activated successfully!", "id": proj.id, "status": proj.status}

@app.get("/api/projects/{project_id}")
def get_project_detail(project_id: int, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    risk_rec = db.query(RiskAssessment).filter(RiskAssessment.project_id == p.id).order_by(RiskAssessment.id.desc()).first()
    updates = db.query(WorkerUpdate).filter(WorkerUpdate.project_id == p.id).order_by(WorkerUpdate.id.desc()).all()
    complaints = db.query(Complaint).filter(Complaint.project_id == p.id).order_by(Complaint.id.desc()).all()

    peer_check = check_sanction_overrun(
        db_session=db,
        category=p.category,
        scope_unit=p.scope_unit,
        scope_value=p.scope_value,
        terrain_type=p.terrain_type or "Rural",
        requested_amount=p.sanctioned_fund,
        district=p.district
    )

    return {
        "project": {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "category": p.category,
            "scope_unit": p.scope_unit,
            "scope_value": p.scope_value,
            "terrain_type": p.terrain_type or "Rural",
            "constituency": p.constituency,
            "district": p.district,
            "state": p.state,
            "lat": p.lat,
            "lng": p.lng,
            "sanctioned_fund": p.sanctioned_fund,
            "estimated_fund": p.estimated_fund,
            "spent_fund": p.spent_fund,
            "estimated_days": p.estimated_days,
            "actual_start_date": p.actual_start_date,
            "expected_completion_date": p.expected_completion_date,
            "status": p.status,
            "assigned_worker_id": p.assigned_worker_id,
            "worker_name": p.worker_name,
            "current_progress_pct": p.current_progress_pct,
            "agency_name": p.agency_name,
            "contractor_name": p.contractor_name,
            "trees_to_cut": p.trees_to_cut or 0,
            "buildings_to_demolish": p.buildings_to_demolish or 0,
            "demolition_details": p.demolition_details or "",
            "is_over_sanction_flag": bool(p.is_over_sanction_flag),
            "override_justification": p.override_justification or "",
            "future_visualization_url": p.future_visualization_url or "",
            "before_photo_url": p.before_photo_url or "",
            "photos": json.loads(p.photos_json) if p.photos_json else []
        },
        "risk_assessment": {
            "score": risk_rec.score if risk_rec else 15.0,
            "band": risk_rec.band if risk_rec else "Low",
            "primary_signal": risk_rec.primary_signal if risk_rec else "None",
            "signals": json.loads(risk_rec.signals_json) if risk_rec and risk_rec.signals_json else {},
            "explanation": json.loads(risk_rec.explanation_json) if risk_rec and risk_rec.explanation_json else [],
            "ml_anomaly_score": risk_rec.ml_anomaly_score if risk_rec else 10.0,
            "disclaimer": "This score is an investigation priority indicator, not proof of fraud."
        },
        "peer_benchmark": peer_check,
        "worker_updates": [
            {
                "id": u.id,
                "worker_name": u.worker_name,
                "status": u.status,
                "progress_pct": u.progress_pct,
                "expenditure_so_far": u.expenditure_so_far,
                "notes": u.notes,
                "photo_url": u.photo_url,
                "geotag_lat": u.geotag_lat,
                "geotag_lng": u.geotag_lng,
                "timestamp": u.timestamp
            } for u in updates
        ],
        "complaints": [
            {
                "id": c.id,
                "worker_update_id": c.worker_update_id,
                "citizen_name": c.citizen_name,
                "category": c.category,
                "description": c.description,
                "photo_url": c.photo_url,
                "status": c.status,
                "mla_response": c.mla_response,
                "tracking_code": c.tracking_code,
                "created_at": c.created_at
            } for c in complaints
        ]
    }

@app.post("/api/projects")
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    proj = Project(
        title=data.title,
        description=data.description,
        category=data.category,
        scope_unit=data.scope_unit,
        scope_value=data.scope_value,
        terrain_type=data.terrain_type or "Rural",
        constituency=data.constituency,
        district=data.district,
        state=data.state or "Uttar Pradesh",
        lat=data.lat,
        lng=data.lng,
        sanctioned_fund=data.sanctioned_fund,
        estimated_fund=data.estimated_fund,
        estimated_days=data.estimated_days,
        actual_start_date=data.actual_start_date,
        expected_completion_date=data.expected_completion_date,
        agency_name=data.agency_name,
        contractor_name=data.contractor_name,
        assigned_worker_id=data.assigned_worker_id,
        worker_name=data.worker_name,
        trees_to_cut=data.trees_to_cut or 0,
        buildings_to_demolish=data.buildings_to_demolish or 0,
        demolition_details=data.demolition_details or "",
        is_over_sanction_flag=data.is_over_sanction_flag or False,
        override_justification=data.override_justification or "",
        future_visualization_url=data.future_visualization_url or "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80",
        before_photo_url=data.before_photo_url or "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80",
        photos_json="[]"
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)

    all_projects = db.query(Project).all()
    risk_info = compute_risk_score(all_projects, proj, db)

    risk = RiskAssessment(
        project_id=proj.id,
        score=risk_info["score"],
        band=risk_info["band"],
        signals_json=json.dumps(risk_info["signals"]),
        primary_signal=risk_info["primary_signal"],
        explanation_json=json.dumps(risk_info["explanation"]),
        ml_anomaly_score=risk_info["ml_anomaly_score"]
    )
    db.add(risk)

    audit = AuditLog(
        actor="MLA / Admin",
        role="mla_admin",
        action_type="CREATE_PROJECT",
        target_type="Project",
        target_id=proj.id,
        details=f"Created new project '{proj.title}' with budget ₹{proj.sanctioned_fund}L in {proj.terrain_type} terrain." + (f" Justification: {proj.override_justification}" if proj.override_justification else ""),
        timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(audit)
    db.commit()

    return {"message": "Project created successfully", "id": proj.id}

@app.post("/api/worker-updates")
def submit_worker_update(data: WorkerUpdateCreate, db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == data.project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    update = WorkerUpdate(
        project_id=data.project_id,
        worker_id=data.worker_id,
        worker_name=data.worker_name,
        status=data.status,
        progress_pct=data.progress_pct,
        expenditure_so_far=data.expenditure_so_far,
        notes=data.notes,
        photo_url=data.photo_url,
        geotag_lat=data.geotag_lat or proj.lat,
        geotag_lng=data.geotag_lng or proj.lng
    )
    db.add(update)

    proj.status = data.status
    proj.current_progress_pct = data.progress_pct
    proj.spent_fund = data.expenditure_so_far

    if data.status == "Completed" or data.progress_pct >= 100.0:
        cost_unit = (data.expenditure_so_far / proj.scope_value) if proj.scope_value > 0 else data.expenditure_so_far
        ref = ReferenceProject(
            project_title=f"{proj.title} (System Verified)",
            category=proj.category,
            scope_unit=proj.scope_unit,
            scope_value=proj.scope_value,
            terrain_type=proj.terrain_type or "Rural",
            district=proj.district,
            state=proj.state or "Uttar Pradesh",
            sanctioned_cost=proj.sanctioned_fund,
            actual_completion_cost=data.expenditure_so_far,
            cost_per_unit=round(cost_unit, 4),
            duration_days=proj.estimated_days,
            source="System Verified Completion",
            completion_year=datetime.datetime.now().year
        )
        db.add(ref)

        audit = AuditLog(
            actor="System",
            role="system",
            action_type="GROW_REFERENCE_DATASET",
            target_type="ReferenceProject",
            target_id=proj.id,
            details=f"Project #{proj.id} completed. Added to public reference dataset pool with final cost ₹{data.expenditure_so_far}L.",
            timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        db.add(audit)

    photos = json.loads(proj.photos_json) if proj.photos_json else []
    if data.photo_url and data.photo_url not in photos:
        photos.append(data.photo_url)
        proj.photos_json = json.dumps(photos)

    db.commit()

    all_projects = db.query(Project).all()
    risk_info = compute_risk_score(all_projects, proj, db)

    risk = RiskAssessment(
        project_id=proj.id,
        score=risk_info["score"],
        band=risk_info["band"],
        signals_json=json.dumps(risk_info["signals"]),
        primary_signal=risk_info["primary_signal"],
        explanation_json=json.dumps(risk_info["explanation"]),
        ml_anomaly_score=risk_info["ml_anomaly_score"]
    )
    db.add(risk)
    db.commit()

    return {"message": "Field update posted successfully", "risk_score": risk_info["score"], "risk_band": risk_info["band"]}

@app.post("/api/uploads/photo")
async def upload_photo(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"field_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_{random.randint(1000,9999)}{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    url = f"/uploads/{filename}"
    return {"url": url, "filename": filename}

# --- CITIZEN COMPLAINTS ENDPOINTS (FULL CRUD & ALL LISTING) ---
@app.get("/api/complaints")
def get_all_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    if status and status != "ALL":
        query = query.filter(Complaint.status == status)
    if category and category != "ALL":
        query = query.filter(Complaint.category == category)

    complaints = query.order_by(Complaint.id.desc()).all()
    results = []

    for c in complaints:
        proj = db.query(Project).filter(Project.id == c.project_id).first()
        results.append({
            "id": c.id,
            "project_id": c.project_id,
            "project_title": proj.title if proj else "N/A",
            "district": proj.district if proj else "N/A",
            "constituency": proj.constituency if proj else "N/A",
            "citizen_name": c.citizen_name,
            "category": c.category,
            "description": c.description,
            "photo_url": c.photo_url,
            "status": c.status,
            "mla_response": c.mla_response,
            "tracking_code": c.tracking_code,
            "created_at": c.created_at
        })

    return results

@app.post("/api/complaints")
def create_complaint(data: ComplaintCreate, db: Session = Depends(get_db)):
    code = f"CMP-2026-{random.randint(1000, 9999)}"
    complaint = Complaint(
        project_id=data.project_id,
        worker_update_id=data.worker_update_id,
        citizen_name=data.citizen_name or "Anonymous Citizen",
        category=data.category,
        description=data.description,
        photo_url=data.photo_url or "",
        status="Open",
        tracking_code=code
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    proj = db.query(Project).filter(Project.id == data.project_id).first()
    proj_title = proj.title if proj else f"Project #{data.project_id}"

    audit = AuditLog(
        actor=data.citizen_name or "Anonymous Citizen",
        role="public",
        action_type="CITIZEN_COMPLAINT_FILED",
        target_type="Complaint",
        target_id=complaint.id,
        details=f"Filed {data.category} complaint on '{proj_title}'. Tracking Code: {code}.",
        timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(audit)
    db.commit()

    return {"message": "Complaint submitted successfully", "tracking_code": code, "id": complaint.id}

@app.get("/api/complaints/track/{tracking_code}")
def track_complaint(tracking_code: str, db: Session = Depends(get_db)):
    c = db.query(Complaint).filter(Complaint.tracking_code == tracking_code).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    proj = db.query(Project).filter(Project.id == c.project_id).first()
    return {
        "tracking_code": c.tracking_code,
        "project_title": proj.title if proj else "N/A",
        "category": c.category,
        "description": c.description,
        "status": c.status,
        "mla_response": c.mla_response,
        "created_at": c.created_at
    }

@app.put("/api/complaints/{complaint_id}")
def update_complaint_status(complaint_id: int, payload: dict, db: Session = Depends(get_db)):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if "status" in payload:
        c.status = payload["status"]
    if "mla_response" in payload:
        c.mla_response = payload["mla_response"]

    proj = db.query(Project).filter(Project.id == c.project_id).first()
    proj_title = proj.title if proj else f"Project #{c.project_id}"

    audit = AuditLog(
        actor="Hon. MLA / Admin",
        role="mla_admin",
        action_type="RESPOND_COMPLAINT",
        target_type="Complaint",
        target_id=c.id,
        details=f"MLA responded to {c.tracking_code} on '{proj_title}': {payload.get('mla_response', '')} (Status: {c.status})",
        timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(audit)
    db.commit()

    return {"message": "Complaint updated successfully"}

# --- FUND REQUEST ENDPOINTS (WITH PEER OVER-SANCTION CHECK) ---
@app.get("/api/fund-requests")
def get_fund_requests(db: Session = Depends(get_db)):
    return db.query(FundRequest).order_by(FundRequest.id.desc()).all()

@app.post("/api/fund-requests")
def submit_fund_request(data: FundRequestCreate, db: Session = Depends(get_db)):
    all_projects = db.query(Project).all()
    est = estimate_project(
        db_projects=all_projects,
        title=data.project_title,
        category=data.category,
        scope_unit=data.scope_unit,
        scope_value=data.scope_value,
        district=data.district,
        sanctioned_fund=data.requested_amount,
        trees_to_cut=data.trees_to_cut or 0,
        buildings_to_demolish=data.buildings_to_demolish or 0,
        terrain_type=data.terrain_type or "Rural",
        db_session=db
    )

    peer_check = check_sanction_overrun(
        db_session=db,
        category=data.category,
        scope_unit=data.scope_unit,
        scope_value=data.scope_value,
        terrain_type=data.terrain_type or "Rural",
        requested_amount=data.requested_amount,
        district=data.district
    )

    freq = FundRequest(
        project_title=data.project_title,
        description=data.description,
        category=data.category,
        scope_unit=data.scope_unit,
        scope_value=data.scope_value,
        terrain_type=data.terrain_type or "Rural",
        district=data.district,
        constituency=data.constituency,
        requested_amount=data.requested_amount,
        requested_by=data.requested_by,
        trees_to_cut=data.trees_to_cut or 0,
        buildings_to_demolish=data.buildings_to_demolish or 0,
        demolition_details=data.demolition_details or "",
        future_visualization_url=data.future_visualization_url or "",
        is_over_sanction_flag=peer_check["is_flagged"],
        peer_comparison_json=json.dumps(peer_check),
        override_justification=data.override_justification or "",
        estimation_result_json=json.dumps(est),
        duplicate_warnings_json=json.dumps(est["duplicate_suspects"]),
        status="pending"
    )
    db.add(freq)
    db.commit()
    db.refresh(freq)

    if peer_check["is_flagged"]:
        audit = AuditLog(
            actor="Sanction-Time AI Engine",
            role="system",
            action_type="OVER_SANCTION_FLAGGED",
            target_type="FundRequest",
            target_id=freq.id,
            details=f"Flagged {peer_check['risk_level']}: {peer_check['explanation_text']}",
            timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        db.add(audit)
        db.commit()

    return {"message": "Fund request submitted with sanction-time peer check", "id": freq.id, "estimation": est, "peer_check": peer_check}

@app.put("/api/fund-requests/{request_id}/review")
def review_fund_request(request_id: int, payload: dict, db: Session = Depends(get_db)):
    freq = db.query(FundRequest).filter(FundRequest.id == request_id).first()
    if not freq:
        raise HTTPException(status_code=404, detail="Fund request not found")

    action = payload.get("action")
    justification = payload.get("override_justification", "").strip()

    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    if action == "approve" and freq.is_over_sanction_flag and not justification:
        raise HTTPException(status_code=400, detail="This fund request has an Over-Sanction flag. A human justification note is required to approve.")

    freq.status = "approved" if action == "approve" else "rejected"
    if justification:
        freq.override_justification = justification
    db.commit()

    if action == "approve":
        est_result = json.loads(freq.estimation_result_json) if freq.estimation_result_json else {}
        est_days = est_result.get("estimated_days", 120)
        est_fund = est_result.get("estimated_fund", freq.requested_amount)

        proj = Project(
            title=freq.project_title,
            description=freq.description,
            category=freq.category,
            scope_unit=freq.scope_unit,
            scope_value=freq.scope_value,
            terrain_type=freq.terrain_type or "Rural",
            constituency=freq.constituency,
            district=freq.district,
            sanctioned_fund=freq.requested_amount,
            estimated_fund=est_fund,
            estimated_days=est_days,
            actual_start_date=datetime.datetime.now().strftime("%Y-%m-%d"),
            expected_completion_date=(datetime.datetime.now() + datetime.timedelta(days=est_days)).strftime("%Y-%m-%d"),
            status="Not Started",
            agency_name="State PWD",
            contractor_name="Sanctioned Contractor",
            trees_to_cut=freq.trees_to_cut or 0,
            buildings_to_demolish=freq.buildings_to_demolish or 0,
            demolition_details=freq.demolition_details or "",
            is_over_sanction_flag=freq.is_over_sanction_flag or False,
            override_justification=justification or freq.override_justification or "",
            future_visualization_url=freq.future_visualization_url or "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80",
            before_photo_url="https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80",
            photos_json="[]",
            lat=25.3176,
            lng=82.9739
        )
        db.add(proj)
        db.commit()
        db.refresh(proj)

        all_projects = db.query(Project).all()
        risk_info = compute_risk_score(all_projects, proj, db)
        risk = RiskAssessment(
            project_id=proj.id,
            score=risk_info["score"],
            band=risk_info["band"],
            signals_json=json.dumps(risk_info["signals"]),
            primary_signal=risk_info["primary_signal"],
            explanation_json=json.dumps(risk_info["explanation"]),
            ml_anomaly_score=risk_info["ml_anomaly_score"]
        )
        db.add(risk)

        audit = AuditLog(
            actor="Hon. MLA / Admin",
            role="mla_admin",
            action_type="APPROVE_SANCTION",
            target_type="Project",
            target_id=proj.id,
            details=f"Approved fund sanction for '{proj.title}' (₹{proj.sanctioned_fund}L)." + (f" Over-Sanction Justification: {justification}" if justification else ""),
            timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        db.add(audit)
        db.commit()

    return {"message": f"Fund request {action}d successfully"}

@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    total_projects = len(projects)
    total_sanctioned = sum(p.sanctioned_fund for p in projects)
    total_spent = sum(p.spent_fund for p in projects)

    completed_count = sum(1 for p in projects if p.status == "Completed")
    in_progress_count = sum(1 for p in projects if p.status == "In Progress")
    delayed_count = sum(1 for p in projects if p.status == "Delayed")
    planned_count = sum(1 for p in projects if p.status == "Planned/Upcoming")
    over_sanction_count = sum(1 for p in projects if p.is_over_sanction_flag)

    low_risk = 0
    medium_risk = 0
    high_risk = 0
    critical_risk = 0
    cost_anomalies = 0
    duplicate_suspects = 0

    for p in projects:
        risk_rec = db.query(RiskAssessment).filter(RiskAssessment.project_id == p.id).order_by(RiskAssessment.id.desc()).first()
        if risk_rec:
            if risk_rec.band == "Low":
                low_risk += 1
            elif risk_rec.band == "Medium":
                medium_risk += 1
            elif risk_rec.band == "High":
                high_risk += 1
            elif risk_rec.band == "Critical":
                critical_risk += 1

            if risk_rec.primary_signal == "Cost Anomaly" or risk_rec.score > 60:
                cost_anomalies += 1
            if risk_rec.primary_signal == "Duplicate Suspect":
                duplicate_suspects += 1

    total_complaints = db.query(Complaint).count()
    open_complaints = db.query(Complaint).filter(Complaint.status == "Open").count()
    static_stats = db.query(StaticStats).all()
    ref_projects_count = db.query(ReferenceProject).count()

    return {
        "total_projects": total_projects,
        "total_sanctioned_fund_lakhs": round(total_sanctioned, 2),
        "total_spent_fund_lakhs": round(total_spent, 2),
        "completed_count": completed_count,
        "in_progress_count": in_progress_count,
        "delayed_count": delayed_count,
        "planned_count": planned_count,
        "over_sanction_count": over_sanction_count,
        "reference_projects_pool_size": ref_projects_count,
        "risk_counts": {
            "low": low_risk,
            "medium": medium_risk,
            "high": high_risk,
            "critical": critical_risk
        },
        "cost_anomalies_count": cost_anomalies,
        "duplicate_suspects_count": duplicate_suspects,
        "total_complaints": total_complaints,
        "open_complaints": open_complaints,
        "static_constituency_stats": [
            {
                "constituency": s.constituency,
                "district": s.district,
                "schools_built": s.schools_built,
                "roads_built_km": s.roads_built_km,
                "community_halls_built": s.community_halls_built,
                "healthcare_centers": s.healthcare_centers,
                "total_funds_sanctioned": s.total_funds_sanctioned,
                "total_funds_utilised": s.total_funds_utilised
            } for s in static_stats
        ]
    }

@app.post("/api/seed")
def trigger_reseed():
    seed_database()
    return {"message": "Database successfully re-seeded with synthetic demo data and reference projects."}
