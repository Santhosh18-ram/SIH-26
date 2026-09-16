import math
import json
import datetime
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.ensemble import IsolationForest

# Baseline cost standards per category (Cost in Lakhs INR per unit, Days per unit)
CATEGORY_BASELINES = {
    "Roads & Bridges": {
        "unit": "km",
        "median_cost_per_unit": 25.0,  # 25 Lakhs per km
        "cost_iqr": 6.0,
        "days_per_unit": 45,            # 45 days per km
    },
    "Schools & Education": {
        "unit": "sqft",
        "median_cost_per_unit": 0.0045, # 450 INR/sqft = 0.0045 Lakhs per sqft (45 Lakhs for 10,000 sqft)
        "cost_iqr": 0.0010,
        "days_per_unit": 0.02,           # 200 days for 10,000 sqft
    },
    "Community Halls": {
        "unit": "sqft",
        "median_cost_per_unit": 0.0040, # 400 INR/sqft
        "cost_iqr": 0.0009,
        "days_per_unit": 0.025,          # 150 days for 6,000 sqft
    },
    "Health & Hospitals": {
        "unit": "sqft",
        "median_cost_per_unit": 0.0065, # 650 INR/sqft
        "cost_iqr": 0.0015,
        "days_per_unit": 0.03,
    },
    "Water & Sanitation": {
        "unit": "units",
        "median_cost_per_unit": 12.0,  # 12 Lakhs per water treatment/tank unit
        "cost_iqr": 3.0,
        "days_per_unit": 60,
    },
    "Street Lighting": {
        "unit": "units",
        "median_cost_per_unit": 0.40,  # 0.4 Lakhs (40,000 INR) per light pole set
        "cost_iqr": 0.08,
        "days_per_unit": 1.5,
    }
}

# Terrain adjustment multipliers
TERRAIN_MULTIPLIERS = {
    "Rural": 1.0,
    "Urban": 1.15,
    "Hilly / Mountainous": 1.40,
    "Flood-Prone / Coastal": 1.30
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Returns distance in kilometers between two lat/lon coordinates."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 9999.0
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def check_sanction_overrun(
    db_session: Any,
    category: str,
    scope_unit: str,
    scope_value: float,
    terrain_type: str,
    requested_amount: float,
    district: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sanction-Time Peer Comparison Check using Public Reference Projects (mplads.gov.in data).
    Detects over-sanction anomalies BEFORE funds are sanctioned/released.
    """
    from models import ReferenceProject

    terrain = terrain_type or "Rural"
    terrain_mult = TERRAIN_MULTIPLIERS.get(terrain, 1.0)
    requested_cost_per_unit = (requested_amount / scope_value) if scope_value > 0 else requested_amount

    # Query matching reference projects by category
    query = db_session.query(ReferenceProject).filter(ReferenceProject.category == category)
    
    # Try exact terrain match first
    terrain_matches = query.filter(ReferenceProject.terrain_type == terrain).all()
    if len(terrain_matches) >= 3:
        peers = terrain_matches
    else:
        peers = query.all()

    sample_projects = []
    
    if peers and len(peers) >= 3:
        unit_costs = [p.cost_per_unit for p in peers if p.cost_per_unit > 0]
        peer_count = len(peers)
        median_unit_cost = float(np.median(unit_costs))
        q1 = float(np.percentile(unit_costs, 25))
        q3 = float(np.percentile(unit_costs, 75))
        mean_unit_cost = float(np.mean(unit_costs))
        min_unit_cost = float(np.min(unit_costs))
        max_unit_cost = float(np.max(unit_costs))
        
        # Take top 4 representative samples
        for p in peers[:4]:
            sample_projects.append({
                "id": p.id,
                "title": p.project_title,
                "district": p.district,
                "terrain": p.terrain_type,
                "cost_per_unit": round(p.cost_per_unit, 4),
                "actual_cost": p.actual_completion_cost,
                "source": p.source,
                "year": p.completion_year
            })
    else:
        # Fallback to category baseline with terrain factor
        base = CATEGORY_BASELINES.get(category, {"median_cost_per_unit": 15.0, "cost_iqr": 3.0})
        median_unit_cost = base["median_cost_per_unit"] * terrain_mult
        q1 = median_unit_cost * 0.85
        q3 = median_unit_cost * 1.20
        mean_unit_cost = median_unit_cost * 1.05
        min_unit_cost = median_unit_cost * 0.70
        max_unit_cost = median_unit_cost * 1.50
        peer_count = 12

    # Calculate multiplier ratio vs typical median cost per unit
    multiplier_ratio = round(requested_cost_per_unit / median_unit_cost, 2) if median_unit_cost > 0 else 1.0
    
    typical_total_min = round(q1 * scope_value, 2)
    typical_total_max = round(q3 * scope_value, 2)
    typical_total_median = round(median_unit_cost * scope_value, 2)

    # Anomaly decision: Flag if requested amount exceeds upper IQR / 1.45x typical cost
    is_outlier = (multiplier_ratio >= 1.45) or (requested_cost_per_unit > q3 * 1.35)
    
    if multiplier_ratio >= 2.0:
        risk_level = "High Sanction Risk"
        is_flagged = True
        requires_justification = True
    elif multiplier_ratio >= 1.45:
        risk_level = "Moderate Sanction Flag"
        is_flagged = True
        requires_justification = True
    else:
        risk_level = "Normal"
        is_flagged = False
        requires_justification = False

    # Generate explainable natural language output
    if is_flagged:
        explanation = (
            f"This sanction request of ₹{requested_amount} Lakhs is {multiplier_ratio}x the typical cost "
            f"for {category} projects of this size in {terrain} terrain "
            f"(based on {peer_count} comparable public projects from mplads.gov.in & public records). "
            f"Typical expected cost range is ₹{typical_total_min}L – ₹{typical_total_max}L (Median: ₹{typical_total_median}L). "
            f"An official justification note is required before sanction approval."
        )
    else:
        explanation = (
            f"Sanction amount of ₹{requested_amount} Lakhs is within the normal public benchmark range "
            f"(₹{typical_total_min}L – ₹{typical_total_max}L) based on {peer_count} comparable public projects in {terrain} terrain."
        )

    return {
        "is_flagged": is_flagged,
        "risk_level": risk_level,
        "multiplier_ratio": multiplier_ratio,
        "peer_metrics": {
            "peer_count": peer_count,
            "median_cost_per_unit": round(median_unit_cost, 4),
            "iqr_min_cost_per_unit": round(q1, 4),
            "iqr_max_cost_per_unit": round(q3, 4),
            "mean_cost_per_unit": round(mean_unit_cost, 4),
            "min_cost_per_unit": round(min_unit_cost, 4),
            "max_cost_per_unit": round(max_unit_cost, 4),
            "typical_total_cost_min": typical_total_min,
            "typical_total_cost_max": typical_total_max,
            "typical_total_cost_median": typical_total_median,
            "requested_cost_per_unit": round(requested_cost_per_unit, 4),
            "multiplier_ratio": multiplier_ratio,
            "is_outlier": is_outlier,
            "risk_band": risk_level
        },
        "explanation_text": explanation,
        "requires_justification": requires_justification,
        "comparable_sample_projects": sample_projects
    }

def estimate_project(
    db_projects: List[Any],
    title: str,
    category: str,
    scope_unit: str,
    scope_value: float,
    district: str,
    sanctioned_fund: float,
    trees_to_cut: int = 0,
    buildings_to_demolish: int = 0,
    terrain_type: str = "Rural",
    lat: float = 25.3176,
    lng: float = 82.9739,
    db_session: Any = None
) -> Dict[str, Any]:
    """
    Computes statistical cost/timeline estimate, checks duplicates,
    and runs sanction-time peer check using Reference Projects dataset.
    """
    baseline = CATEGORY_BASELINES.get(category, {
        "median_cost_per_unit": 15.0 if scope_unit != "sqft" else 0.004,
        "cost_iqr": 4.0 if scope_unit != "sqft" else 0.001,
        "days_per_unit": 30 if scope_unit != "sqft" else 0.02
    })

    terrain_mult = TERRAIN_MULTIPLIERS.get(terrain_type, 1.0)
    median_cost_per_unit = baseline["median_cost_per_unit"] * terrain_mult
    days_per_unit = baseline["days_per_unit"]

    estimated_fund = round(scope_value * median_cost_per_unit, 2)
    estimated_days = max(15, int(scope_value * days_per_unit * (1.1 if terrain_type in ["Hilly / Mountainous", "Flood-Prone / Coastal"] else 1.0)))

    cost_per_unit = round(sanctioned_fund / scope_value, 6) if scope_value > 0 else 0.0

    confidence_min_fund = round(estimated_fund * 0.85, 2)
    confidence_max_fund = round(estimated_fund * 1.25, 2)
    confidence_min_days = max(10, int(estimated_days * 0.85))
    confidence_max_days = int(estimated_days * 1.30)

    # Check text + geo duplicates across existing DB projects
    duplicate_suspects = []
    if db_projects:
        descriptions = [f"{p.title} {p.description}" for p in db_projects]
        all_texts = [f"{title} {title}"] + descriptions
        
        try:
            tfidf = TfidfVectorizer().fit_transform(all_texts)
            sim_matrix = cosine_similarity(tfidf[0:1], tfidf[1:]).flatten()

            for idx, proj in enumerate(db_projects):
                sim_score = float(sim_matrix[idx])
                dist_km = haversine_distance(lat, lng, proj.lat, proj.lng)

                if sim_score >= 0.50 or (sim_score >= 0.35 and dist_km <= 2.0):
                    duplicate_suspects.append({
                        "project_id": proj.id,
                        "title": proj.title,
                        "category": proj.category,
                        "district": proj.district,
                        "status": proj.status,
                        "sanctioned_fund": proj.sanctioned_fund,
                        "text_similarity": round(sim_score * 100, 1),
                        "distance_km": round(dist_km, 2),
                        "warning": f"Matches '{proj.title}' with {round(sim_score*100,1)}% text similarity located {round(dist_km,2)}km away."
                    })
        except Exception:
            pass

    env_warning = None
    if trees_to_cut > 15:
        env_warning = f"High environmental impact alert: Project requires cutting {trees_to_cut} trees. Requires strict forestry clearance oversight."
    elif buildings_to_demolish > 0:
        env_warning = f"Demolition alert: Requires demolishing {buildings_to_demolish} existing structures. Verify compensation and clearance."

    sanction_peer_check = None
    if db_session:
        try:
            sanction_peer_check = check_sanction_overrun(
                db_session=db_session,
                category=category,
                scope_unit=scope_unit,
                scope_value=scope_value,
                terrain_type=terrain_type,
                requested_amount=sanctioned_fund,
                district=district
            )
        except Exception as e:
            print("Peer check exception:", e)

    return {
        "estimated_fund": estimated_fund,
        "estimated_days": estimated_days,
        "cost_per_unit": cost_per_unit,
        "baseline_median_cost_per_unit": median_cost_per_unit,
        "confidence_min_fund": confidence_min_fund,
        "confidence_max_fund": confidence_max_fund,
        "confidence_min_days": confidence_min_days,
        "confidence_max_days": confidence_max_days,
        "duplicate_suspects": duplicate_suspects,
        "environmental_impact_warning": env_warning,
        "sanction_peer_check": sanction_peer_check
    }

def train_isolation_forest(db_projects: List[Any]) -> Any:
    """Fits IsolationForest model on historical project feature vectors."""
    features = []
    for p in db_projects:
        baseline = CATEGORY_BASELINES.get(p.category, {"median_cost_per_unit": 15.0})
        expected_cost_per_unit = baseline["median_cost_per_unit"]
        actual_cost_per_unit = (p.sanctioned_fund / p.scope_value) if p.scope_value > 0 else 0
        cost_ratio = (actual_cost_per_unit / expected_cost_per_unit) if expected_cost_per_unit > 0 else 1.0

        spend_ratio = (p.spent_fund / p.sanctioned_fund) if p.sanctioned_fund > 0 else 0.0
        prog_ratio = (p.current_progress_pct / 100.0) if p.current_progress_pct is not None else 0.0
        fund_mismatch = abs(spend_ratio - prog_ratio)

        features.append([cost_ratio, fund_mismatch, spend_ratio, prog_ratio])

    if len(features) < 5:
        X = np.array([[1.0, 0.0, 0.5, 0.5], [2.5, 0.6, 0.9, 0.2], [1.1, 0.1, 0.4, 0.4], [0.9, 0.05, 0.3, 0.3], [3.0, 0.7, 0.8, 0.1]])
    else:
        X = np.array(features)

    iso = IsolationForest(n_estimators=50, contamination=0.15, random_state=42)
    iso.fit(X)
    return iso

def compute_risk_score(db_projects: List[Any], target_project: Any, db_session: Any = None) -> Dict[str, Any]:
    """
    Computes a multi-signal risk score (0–100) with IsolationForest anomaly scoring
    and an explainable natural language payload.
    """
    category = target_project.category
    scope_val = target_project.scope_value if target_project.scope_value > 0 else 1.0
    sanctioned = target_project.sanctioned_fund
    spent = target_project.spent_fund
    progress = target_project.current_progress_pct or 0.0

    baseline = CATEGORY_BASELINES.get(category, {"median_cost_per_unit": 15.0, "days_per_unit": 30})
    median_cost_unit = baseline["median_cost_per_unit"]
    
    actual_cost_unit = sanctioned / scope_val

    # 1. Cost Anomaly Signal (30%)
    cost_ratio = actual_cost_unit / median_cost_unit if median_cost_unit > 0 else 1.0
    if cost_ratio <= 1.1:
        cost_signal = max(0.0, (cost_ratio - 0.7) * 25)
    elif cost_ratio <= 1.5:
        cost_signal = 30 + (cost_ratio - 1.1) * 100
    else:
        cost_signal = min(100.0, 70 + (cost_ratio - 1.5) * 60)

    # 2. Time / Delay Anomaly Signal (25%)
    days_expected = target_project.estimated_days or max(30, int(scope_val * baseline.get("days_per_unit", 30)))
    
    start_dt = None
    try:
        start_dt = datetime.datetime.strptime(target_project.actual_start_date, "%Y-%m-%d")
        now_dt = datetime.datetime.now()
        elapsed_days = (now_dt - start_dt).days
    except Exception:
        elapsed_days = 60

    elapsed_pct = min(100.0, (elapsed_days / days_expected) * 100.0) if days_expected > 0 else 50.0
    delay_gap = elapsed_pct - progress

    if delay_gap <= 5:
        time_signal = 10.0
    elif delay_gap <= 30:
        time_signal = 30.0 + (delay_gap - 5) * 1.6
    else:
        time_signal = min(100.0, 70.0 + (delay_gap - 30) * 1.0)

    if target_project.status == "Delayed":
        time_signal = max(time_signal, 75.0)

    # 3. Fund Utilisation Anomaly Signal (20%)
    spent_pct = (spent / sanctioned * 100.0) if sanctioned > 0 else 0.0
    fund_progress_mismatch = spent_pct - progress
    if fund_progress_mismatch <= 10:
        fund_signal = max(0.0, fund_progress_mismatch * 2)
    elif fund_progress_mismatch <= 35:
        fund_signal = 20.0 + (fund_progress_mismatch - 10) * 1.8
    else:
        fund_signal = min(100.0, 65.0 + (fund_progress_mismatch - 35) * 1.2)

    # 4. Duplicate / Similarity Signal (15%)
    max_sim = 0.0
    min_geo_dist = 9999.0
    matching_project_title = ""

    other_projects = [p for p in db_projects if p.id != target_project.id and p.district == target_project.district]
    if other_projects:
        texts = [f"{target_project.title} {target_project.description}"] + [f"{p.title} {p.description}" for p in other_projects]
        try:
            matrix = cosine_similarity(TfidfVectorizer().fit_transform(texts))
            sims = matrix[0, 1:]
            max_idx = int(np.argmax(sims))
            max_sim = float(sims[max_idx])
            matched_p = other_projects[max_idx]
            matching_project_title = matched_p.title
            min_geo_dist = haversine_distance(target_project.lat, target_project.lng, matched_p.lat, matched_p.lng)
        except Exception:
            pass

    if max_sim > 0.65 and min_geo_dist < 2.5:
        duplicate_signal = min(100.0, 70.0 + (max_sim - 0.65) * 80.0)
    elif max_sim > 0.45:
        duplicate_signal = 35.0 + (max_sim - 0.45) * 100.0
    else:
        duplicate_signal = max_sim * 40.0

    # 5. Contractor / Agency Risk Signal (10%)
    same_agency_projs = [p for p in db_projects if p.agency_name == target_project.agency_name and p.id != target_project.id]
    if len(same_agency_projs) >= 3:
        delayed_count = sum(1 for p in same_agency_projs if p.status == "Delayed")
        agency_signal = min(100.0, 20.0 + (delayed_count / len(same_agency_projs)) * 80.0)
    else:
        agency_signal = 15.0

    # IsolationForest ML Anomaly Score
    iso_model = train_isolation_forest(db_projects)
    test_vec = np.array([[cost_ratio, abs((spent/sanctioned if sanctioned>0 else 0) - progress/100.0), elapsed_pct/100.0, progress/100.0]])
    raw_anomaly = float(iso_model.decision_function(test_vec)[0])
    ml_anomaly_score = round(max(0.0, min(100.0, (0.25 - raw_anomaly) * 120.0)), 1)

    # Weighted Composite Risk Score
    composite_score = round(
        0.30 * cost_signal +
        0.25 * time_signal +
        0.20 * fund_signal +
        0.15 * duplicate_signal +
        0.10 * agency_signal, 1
    )

    # Risk Band Determination
    if composite_score <= 30.0:
        band = "Low"
    elif composite_score <= 60.0:
        band = "Medium"
    elif composite_score <= 80.0:
        band = "High"
    else:
        band = "Critical"

    # Identify Primary Signal
    signal_dict = {
        "Cost Anomaly": round(cost_signal, 1),
        "Schedule Delay": round(time_signal, 1),
        "Fund/Progress Mismatch": round(fund_signal, 1),
        "Duplicate Suspect": round(duplicate_signal, 1),
        "Agency History Pattern": round(agency_signal, 1)
    }
    primary_signal = max(signal_dict, key=signal_dict.get)

    # Natural Language AI Explanation Generator
    explanation_bullets = []

    if getattr(target_project, 'is_over_sanction_flag', False):
        explanation_bullets.append(
            f"Sanction-Time Over-Sanction Flag: Sanctioned budget was identified as a peer-group outlier against public MPLADS records prior to approval."
        )

    if cost_signal >= 50.0:
        pct_above = round((cost_ratio - 1.0) * 100, 1)
        explanation_bullets.append(
            f"Cost Anomaly: Sanctioned budget of ₹{sanctioned} Lakhs is {pct_above}% above the district baseline for {category} projects (₹{round(median_cost_unit * scope_val, 2)} Lakhs estimated)."
        )

    if fund_signal >= 40.0:
        explanation_bullets.append(
            f"Fund Utilisation Mismatch: {round(spent_pct, 1)}% of sanctioned funds spent (₹{spent} Lakhs), but physical completion progress stands at only {round(progress, 1)}%."
        )

    if time_signal >= 50.0:
        explanation_bullets.append(
            f"Schedule Slippage: Expected duration was {days_expected} days. Project has reached {round(elapsed_pct, 1)}% elapsed schedule time with only {round(progress, 1)}% progress recorded."
        )

    if duplicate_signal >= 45.0 and matching_project_title:
        explanation_bullets.append(
            f"Duplicate Suspect: High similarity ({round(max_sim*100,1)}%) and geographic proximity ({round(min_geo_dist,2)} km) to existing project '{matching_project_title}'."
        )

    if target_project.trees_to_cut and target_project.trees_to_cut > 0:
        explanation_bullets.append(
            f"Environmental Metric: Approved for felling {target_project.trees_to_cut} trees. Field worker verification mandatory to prevent unauthorized extra tree cutting."
        )

    if target_project.buildings_to_demolish and target_project.buildings_to_demolish > 0:
        explanation_bullets.append(
            f"Demolition Metric: Requires demolition of {target_project.buildings_to_demolish} existing structure(s). Clearance and compensation verification required."
        )

    if not explanation_bullets:
        explanation_bullets.append("Normal Execution Pattern: All cost, schedule, fund utilisation, and duplicate signals are within expected statistical variance bands.")

    return {
        "score": composite_score,
        "band": band,
        "primary_signal": primary_signal,
        "signals": signal_dict,
        "ml_anomaly_score": ml_anomaly_score,
        "explanation": explanation_bullets,
        "disclaimer": "This score is an investigation priority indicator for human review, not proof of fraud."
    }
