import json
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User, Project, ReferenceProject, FundRequest, RiskAssessment, WorkerUpdate, Complaint, StaticStats, AuditLog
from ml_engine import compute_risk_score, estimate_project, check_sanction_overrun

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing tables if any
    db.query(Complaint).delete()
    db.query(WorkerUpdate).delete()
    db.query(RiskAssessment).delete()
    db.query(FundRequest).delete()
    db.query(Project).delete()
    db.query(ReferenceProject).delete()
    db.query(StaticStats).delete()
    db.query(User).delete()
    db.query(AuditLog).delete()
    db.commit()

    print("Seeding Users...")
    users = [
        User(id=1, username="mla_admin", name="Hon. MLA Rajesh Sharma", email="mla.varanasi@gov.in", role="mla_admin", constituency="Varanasi Cantt", district="Varanasi"),
        User(id=2, username="worker_suresh", name="Suresh Kumar (Junior Engineer)", email="suresh.field@gov.in", role="field_worker", constituency="Varanasi Cantt", district="Varanasi"),
        User(id=3, username="worker_ramesh", name="Ramesh Patel (Site Supervisor)", email="ramesh.field@gov.in", role="field_worker", constituency="Jaipur Rural", district="Jaipur"),
        User(id=4, username="worker_anita", name="Anita Singh (District Inspector)", email="anita.field@gov.in", role="field_worker", constituency="Bengaluru South", district="Bengaluru Urban"),
        User(id=5, username="citizen_priya", name="Priya Sharma (Citizen)", email="priya@citizen.org", role="public", constituency="Varanasi Cantt", district="Varanasi"),
        User(id=6, username="agency_pwd", name="Er. Alok Verma (Executive Engineer, PWD)", email="alok.pwd@up.gov.in", role="agency", constituency="Varanasi Cantt", district="Varanasi")
    ]
    db.add_all(users)
    db.commit()

    print("Seeding Public Reference Projects Dataset (mplads.gov.in & Public Works Records)...")
    reference_projects_data = [
        # Roads & Bridges (Rural, Urban, Hilly, Flood-Prone)
        {"title": "PMGSY All-Weather Bituminous Road, Mirzapur", "category": "Roads & Bridges", "scope_unit": "km", "scope_value": 4.0, "terrain": "Rural", "district": "Mirzapur", "state": "Uttar Pradesh", "sanctioned": 98.0, "actual": 96.5, "cost_unit": 24.125, "days": 180, "source": "mplads.gov.in", "year": 2024},
        {"title": "Panchayat Link Road Construction, Chandauli", "category": "Roads & Bridges", "scope_unit": "km", "scope_value": 2.5, "terrain": "Rural", "district": "Chandauli", "state": "Uttar Pradesh", "sanctioned": 62.0, "actual": 61.0, "cost_unit": 24.4, "days": 120, "source": "mplads.gov.in", "year": 2024},
        {"title": "Rural Asphalt Connector, Ghazipur", "category": "Roads & Bridges", "scope_unit": "km", "scope_value": 3.0, "terrain": "Rural", "district": "Ghazipur", "state": "Uttar Pradesh", "sanctioned": 75.0, "actual": 74.0, "cost_unit": 24.67, "days": 140, "source": "mplads.gov.in", "year": 2025},
        {"title": "Urban Arterial Concrete Paving, Varanasi City", "category": "Roads & Bridges", "scope_unit": "km", "scope_value": 2.0, "terrain": "Urban", "district": "Varanasi", "state": "Uttar Pradesh", "sanctioned": 58.0, "actual": 57.5, "cost_unit": 28.75, "days": 100, "source": "State PWD", "year": 2025},
        {"title": "Jaipur Ring Connector Urban Road", "category": "Roads & Bridges", "scope_unit": "km", "scope_value": 5.0, "terrain": "Urban", "district": "Jaipur", "state": "Rajasthan", "sanctioned": 142.0, "actual": 140.0, "cost_unit": 28.0, "days": 210, "source": "mplads.gov.in", "year": 2024},
        {"title": "Hill Slope Paved Road, Almora", "category": "Roads & Bridges", "scope_unit": "km", "scope_value": 2.0, "terrain": "Hilly / Mountainous", "district": "Almora", "state": "Uttarakhand", "sanctioned": 70.0, "actual": 72.0, "cost_unit": 36.0, "days": 160, "source": "PMGSY", "year": 2024},
        {"title": "Flood-Embankment Reinforced Road, Ballia", "category": "Roads & Bridges", "scope_unit": "km", "scope_value": 3.5, "terrain": "Flood-Prone / Coastal", "district": "Ballia", "state": "Uttar Pradesh", "sanctioned": 112.0, "actual": 110.0, "cost_unit": 31.43, "days": 175, "source": "mplads.gov.in", "year": 2025},

        # Community Halls (Rural, Urban, Hilly)
        {"title": "Gram Panchayat Public Hall, Phulpur", "category": "Community Halls", "scope_unit": "sqft", "scope_value": 5000.0, "terrain": "Rural", "district": "Prayagraj", "state": "Uttar Pradesh", "sanctioned": 20.0, "actual": 19.8, "cost_unit": 0.00396, "days": 130, "source": "mplads.gov.in", "year": 2024},
        {"title": "Village Community Centre, Sarnath Rural", "category": "Community Halls", "scope_unit": "sqft", "scope_value": 6000.0, "terrain": "Rural", "district": "Varanasi", "state": "Uttar Pradesh", "sanctioned": 24.0, "actual": 23.5, "cost_unit": 0.00392, "days": 150, "source": "mplads.gov.in", "year": 2025},
        {"title": "Block Samiti Community Hall, Amber", "category": "Community Halls", "scope_unit": "sqft", "scope_value": 8000.0, "terrain": "Rural", "district": "Jaipur", "state": "Rajasthan", "sanctioned": 32.0, "actual": 31.8, "cost_unit": 0.003975, "days": 180, "source": "mplads.gov.in", "year": 2024},
        {"title": "Urban Cultural Hall & Library, Lucknow", "category": "Community Halls", "scope_unit": "sqft", "scope_value": 8000.0, "terrain": "Urban", "district": "Lucknow", "state": "Uttar Pradesh", "sanctioned": 36.8, "actual": 36.0, "cost_unit": 0.0045, "days": 190, "source": "State PWD", "year": 2025},
        {"title": "Mountain Community Centre, Tehri", "category": "Community Halls", "scope_unit": "sqft", "scope_value": 4000.0, "terrain": "Hilly / Mountainous", "district": "Tehri Garhwal", "state": "Uttarakhand", "sanctioned": 22.4, "actual": 22.0, "cost_unit": 0.0055, "days": 160, "source": "mplads.gov.in", "year": 2024},

        # Schools & Education (Rural, Urban, Flood-Prone)
        {"title": "Primary School 6-Classroom Block, Jaunpur", "category": "Schools & Education", "scope_unit": "sqft", "scope_value": 8000.0, "terrain": "Rural", "district": "Jaunpur", "state": "Uttar Pradesh", "sanctioned": 36.0, "actual": 35.5, "cost_unit": 0.00444, "days": 180, "source": "mplads.gov.in", "year": 2024},
        {"title": "Government Higher Secondary Wing, Dausa", "category": "Schools & Education", "scope_unit": "sqft", "scope_value": 12000.0, "terrain": "Rural", "district": "Dausa", "state": "Rajasthan", "sanctioned": 54.0, "actual": 53.2, "cost_unit": 0.00443, "days": 220, "source": "mplads.gov.in", "year": 2025},
        {"title": "Smart City Model School, Bengaluru", "category": "Schools & Education", "scope_unit": "sqft", "scope_value": 15000.0, "terrain": "Urban", "district": "Bengaluru Urban", "state": "Karnataka", "sanctioned": 78.0, "actual": 76.5, "cost_unit": 0.0051, "days": 260, "source": "State PWD", "year": 2024},
        {"title": "Raised Plinth Flood-Resilient School, Buxar", "category": "Schools & Education", "scope_unit": "sqft", "scope_value": 10000.0, "terrain": "Flood-Prone / Coastal", "district": "Buxar", "state": "Bihar", "sanctioned": 58.0, "actual": 57.0, "cost_unit": 0.0057, "days": 210, "source": "mplads.gov.in", "year": 2025},

        # Health & Hospitals
        {"title": "Primary Health Centre OPD Wing, Sanganer", "category": "Health & Hospitals", "scope_unit": "sqft", "scope_value": 6000.0, "terrain": "Rural", "district": "Jaipur", "state": "Rajasthan", "sanctioned": 39.0, "actual": 38.5, "cost_unit": 0.00642, "days": 170, "source": "mplads.gov.in", "year": 2024},
        {"title": "Maternity & Child Care Wing, Azamgarh", "category": "Health & Hospitals", "scope_unit": "sqft", "scope_value": 8000.0, "terrain": "Rural", "district": "Azamgarh", "state": "Uttar Pradesh", "sanctioned": 52.0, "actual": 51.0, "cost_unit": 0.00638, "days": 200, "source": "mplads.gov.in", "year": 2025},
        {"title": "Urban Dialysis & Diagnostic Centre, Thane", "category": "Health & Hospitals", "scope_unit": "sqft", "scope_value": 10000.0, "terrain": "Urban", "district": "Thane", "state": "Maharashtra", "sanctioned": 75.0, "actual": 73.8, "cost_unit": 0.00738, "days": 240, "source": "State PWD", "year": 2024},

        # Water & Sanitation
        {"title": "Solar Dual-Pump Drinking Water Facility, Bikaner", "category": "Water & Sanitation", "scope_unit": "units", "scope_value": 2.0, "terrain": "Rural", "district": "Bikaner", "state": "Rajasthan", "sanctioned": 24.0, "actual": 23.4, "cost_unit": 11.7, "days": 90, "source": "mplads.gov.in", "year": 2025},
        {"title": "Overhead RCC Tank & Distribution, Mau", "category": "Water & Sanitation", "scope_unit": "units", "scope_value": 1.0, "terrain": "Rural", "district": "Mau", "state": "Uttar Pradesh", "sanctioned": 12.0, "actual": 11.8, "cost_unit": 11.8, "days": 80, "source": "mplads.gov.in", "year": 2024},

        # Street Lighting
        {"title": "Village Solar LED Light Grid, Tonk", "category": "Street Lighting", "scope_unit": "units", "scope_value": 100.0, "terrain": "Rural", "district": "Tonk", "state": "Rajasthan", "sanctioned": 40.0, "actual": 39.5, "cost_unit": 0.395, "days": 60, "source": "mplads.gov.in", "year": 2025},
        {"title": "Urban Smart LED Highway Poles, Pune", "category": "Street Lighting", "scope_unit": "units", "scope_value": 250.0, "terrain": "Urban", "district": "Pune", "state": "Maharashtra", "sanctioned": 112.5, "actual": 110.0, "cost_unit": 0.44, "days": 90, "source": "State PWD", "year": 2024}
    ]

    for item in reference_projects_data:
        ref = ReferenceProject(
            project_title=item["title"],
            category=item["category"],
            scope_unit=item["scope_unit"],
            scope_value=item["scope_value"],
            terrain_type=item["terrain"],
            district=item["district"],
            state=item["state"],
            sanctioned_cost=item["sanctioned"],
            actual_completion_cost=item["actual"],
            cost_per_unit=item["cost_unit"],
            duration_days=item["days"],
            source=item["source"],
            completion_year=item["year"]
        )
        db.add(ref)
    db.commit()

    print("Seeding Static Stats...")
    stats = [
        StaticStats(constituency="Varanasi Cantt", district="Varanasi", state="Uttar Pradesh", schools_built=24, roads_built_km=86.5, community_halls_built=12, healthcare_centers=8, total_funds_sanctioned=1850.0, total_funds_utilised=1420.0),
        StaticStats(constituency="Jaipur Rural", district="Jaipur", state="Rajasthan", schools_built=19, roads_built_km=112.0, community_halls_built=9, healthcare_centers=6, total_funds_sanctioned=1620.0, total_funds_utilised=1180.0),
        StaticStats(constituency="Bengaluru South", district="Bengaluru Urban", state="Karnataka", schools_built=31, roads_built_km=45.2, community_halls_built=15, healthcare_centers=14, total_funds_sanctioned=2400.0, total_funds_utilised=2050.0),
        StaticStats(constituency="Thane Central", district="Thane", state="Maharashtra", schools_built=15, roads_built_km=62.8, community_halls_built=8, healthcare_centers=5, total_funds_sanctioned=1450.0, total_funds_utilised=990.0),
    ]
    db.add_all(stats)
    db.commit()

    print("Seeding MPLAD Projects with Over-Sanction Checks & Visuals...")

    BEFORE_PHOTOS = [
        "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80",
        "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80",
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
        "https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=800&q=80",
    ]

    FUTURE_RENDERS = [
        "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
        "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    ]

    CURRENT_FIELD_PHOTOS = [
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
        "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80",
        "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80",
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",
    ]

    projects_raw = [
        {
            "id": 1,
            "title": "Widening & Paving of Village Main Road, Shivpur",
            "description": "Construction of 3.2 km double-lane asphalt road connecting Shivpur Market to National Highway 19, including concrete drainage channels on both sides.",
            "category": "Roads & Bridges",
            "scope_unit": "km",
            "scope_value": 3.2,
            "terrain_type": "Rural",
            "constituency": "Varanasi Cantt",
            "district": "Varanasi",
            "lat": 25.3520,
            "lng": 82.9650,
            "sanctioned_fund": 145.0,  # CRITICAL OVER-SANCTION (1.8x typical peer cost of 80 Lakhs)
            "estimated_fund": 80.0,
            "estimated_days": 144,
            "spent_fund": 115.0,
            "actual_start_date": "2026-01-10",
            "expected_completion_date": "2026-06-15",
            "status": "In Progress",
            "assigned_worker_id": 2,
            "worker_name": "Suresh Kumar",
            "current_progress_pct": 35.0,
            "agency_name": "UP State Bridge Corporation",
            "contractor_name": "M/s Purvanchal Infra Pvt Ltd",
            "trees_to_cut": 18,
            "buildings_to_demolish": 2,
            "demolition_details": "Demolition of 2 encroaching roadside boundary sheds.",
            "is_over_sanction_flag": True,
            "override_justification": "Sanctioned at 1.8x peer rate citing expedited completion and subgrade soil stabilization requirements.",
            "before_photo_url": BEFORE_PHOTOS[0],
            "future_visualization_url": FUTURE_RENDERS[3],
            "photos_json": json.dumps([CURRENT_FIELD_PHOTOS[0], CURRENT_FIELD_PHOTOS[1]])
        },
        {
            "id": 2,
            "title": "Shivpur Village Main Road Paving Work",
            "description": "Asphalt paving and repair of 3.0 km main road near Shivpur Market connecting NH-19.",
            "category": "Roads & Bridges",
            "scope_unit": "km",
            "scope_value": 3.0,
            "terrain_type": "Rural",
            "constituency": "Varanasi Cantt",
            "district": "Varanasi",
            "lat": 25.3535,
            "lng": 82.9670,
            "sanctioned_fund": 75.0,
            "estimated_fund": 75.0,
            "estimated_days": 135,
            "spent_fund": 20.0,
            "actual_start_date": "2026-02-01",
            "expected_completion_date": "2026-07-01",
            "status": "In Progress",
            "assigned_worker_id": 2,
            "worker_name": "Suresh Kumar",
            "current_progress_pct": 25.0,
            "agency_name": "Public Works Dept (PWD) Varanasi",
            "contractor_name": "Kashi Infra Projects",
            "trees_to_cut": 5,
            "buildings_to_demolish": 0,
            "demolition_details": "None required.",
            "is_over_sanction_flag": False,
            "before_photo_url": BEFORE_PHOTOS[0],
            "future_visualization_url": FUTURE_RENDERS[3],
            "photos_json": json.dumps([CURRENT_FIELD_PHOTOS[1]])
        },
        {
            "id": 3,
            "title": "Construction of Smart Primary School Building, Lahartara",
            "description": "2-storey school building with 12 smart classrooms, computer laboratory, solar panel roof, and clean drinking water filtration plant.",
            "category": "Schools & Education",
            "scope_unit": "sqft",
            "scope_value": 12000.0,
            "terrain_type": "Urban",
            "constituency": "Varanasi Cantt",
            "district": "Varanasi",
            "lat": 25.3120,
            "lng": 82.9690,
            "sanctioned_fund": 54.0,
            "estimated_fund": 54.0,
            "estimated_days": 240,
            "spent_fund": 38.0,
            "actual_start_date": "2025-11-01",
            "expected_completion_date": "2026-07-01",
            "status": "In Progress",
            "assigned_worker_id": 2,
            "worker_name": "Suresh Kumar",
            "current_progress_pct": 70.0,
            "agency_name": "UP Rajkiya Nirman Nigam",
            "contractor_name": "Varanasi Builders Corp",
            "trees_to_cut": 4,
            "buildings_to_demolish": 1,
            "demolition_details": "Demolition of old dilapidated single-room brick storehouse.",
            "is_over_sanction_flag": False,
            "before_photo_url": BEFORE_PHOTOS[1],
            "future_visualization_url": FUTURE_RENDERS[0],
            "photos_json": json.dumps([CURRENT_FIELD_PHOTOS[2]])
        },
        {
            "id": 4,
            "title": "Community Cultural Centre & Library, Sigra",
            "description": "Multi-purpose community auditorium with 400 seating capacity, public digital library, and air-conditioned conference hall.",
            "category": "Community Halls",
            "scope_unit": "sqft",
            "scope_value": 8000.0,
            "terrain_type": "Urban",
            "constituency": "Varanasi Cantt",
            "district": "Varanasi",
            "lat": 25.3180,
            "lng": 82.9850,
            "sanctioned_fund": 32.0,
            "estimated_fund": 32.0,
            "estimated_days": 200,
            "spent_fund": 32.0,
            "actual_start_date": "2025-08-01",
            "expected_completion_date": "2026-03-01",
            "status": "Completed",
            "assigned_worker_id": 2,
            "worker_name": "Suresh Kumar",
            "current_progress_pct": 100.0,
            "agency_name": "Varanasi Development Authority",
            "contractor_name": "Apex Constructions",
            "trees_to_cut": 0,
            "buildings_to_demolish": 0,
            "demolition_details": "None.",
            "is_over_sanction_flag": False,
            "before_photo_url": BEFORE_PHOTOS[3],
            "future_visualization_url": FUTURE_RENDERS[1],
            "photos_json": json.dumps([FUTURE_RENDERS[1]])
        },
        {
            "id": 5,
            "title": "Primary Health Centre Upgrade & ICU Wing, Amer",
            "description": "Construction of a 30-bed emergency extension wing, modern pathology lab, and solar power backup at Amer Community Health Centre.",
            "category": "Health & Hospitals",
            "scope_unit": "sqft",
            "scope_value": 6000.0,
            "terrain_type": "Hilly / Mountainous",
            "constituency": "Jaipur Rural",
            "district": "Jaipur",
            "lat": 26.9855,
            "lng": 75.8513,
            "sanctioned_fund": 95.0,  # CRITICAL OVER-SANCTION (2.4x peer baseline of 39 Lakhs)
            "estimated_fund": 39.0,
            "estimated_days": 180,
            "spent_fund": 65.0,
            "actual_start_date": "2025-09-15",
            "expected_completion_date": "2026-04-15",
            "status": "Delayed",
            "assigned_worker_id": 3,
            "worker_name": "Ramesh Patel",
            "current_progress_pct": 40.0,
            "agency_name": "Rajasthan Medical Services Corp",
            "contractor_name": "M/s Marwar Engineering",
            "trees_to_cut": 8,
            "buildings_to_demolish": 1,
            "demolition_details": "Demolition of abandoned old dispensary quarter.",
            "is_over_sanction_flag": True,
            "override_justification": "Over-sanction approved citing specialized medical oxygen piping and terrain gradient work.",
            "before_photo_url": BEFORE_PHOTOS[1],
            "future_visualization_url": FUTURE_RENDERS[2],
            "photos_json": json.dumps([CURRENT_FIELD_PHOTOS[3]])
        },
        {
            "id": 6,
            "title": "Overhead Water Tank & Pipeline Grid, Shahpura",
            "description": "500,000 Litres capacity elevated RCC water reservoir and 8.5 km underground distribution pipeline grid for clean drinking water supply.",
            "category": "Water & Sanitation",
            "scope_unit": "units",
            "scope_value": 1.0,
            "terrain_type": "Rural",
            "constituency": "Jaipur Rural",
            "district": "Jaipur",
            "lat": 27.3870,
            "lng": 75.9620,
            "sanctioned_fund": 14.0,
            "estimated_fund": 12.0,
            "estimated_days": 90,
            "spent_fund": 9.5,
            "actual_start_date": "2026-01-05",
            "expected_completion_date": "2026-05-10",
            "status": "In Progress",
            "assigned_worker_id": 3,
            "worker_name": "Ramesh Patel",
            "current_progress_pct": 65.0,
            "agency_name": "PHED Rajasthan",
            "contractor_name": "PinkCity Infra Solutions",
            "trees_to_cut": 2,
            "buildings_to_demolish": 0,
            "demolition_details": "None.",
            "is_over_sanction_flag": False,
            "before_photo_url": BEFORE_PHOTOS[2],
            "future_visualization_url": FUTURE_RENDERS[0],
            "photos_json": json.dumps([CURRENT_FIELD_PHOTOS[0]])
        },
        {
            "id": 7,
            "title": "Government Higher Secondary School STEM Lab Building, Jayanagar",
            "description": "Constructing a 3-storey dedicated STEM & Innovation Block with 4 laboratories, robotic workshop, and green terrace.",
            "category": "Schools & Education",
            "scope_unit": "sqft",
            "scope_value": 15000.0,
            "terrain_type": "Urban",
            "constituency": "Bengaluru South",
            "district": "Bengaluru Urban",
            "lat": 12.9250,
            "lng": 77.5938,
            "sanctioned_fund": 67.5,
            "estimated_fund": 67.5,
            "estimated_days": 300,
            "spent_fund": 45.0,
            "actual_start_date": "2025-10-01",
            "expected_completion_date": "2026-08-01",
            "status": "In Progress",
            "assigned_worker_id": 4,
            "worker_name": "Anita Singh",
            "current_progress_pct": 60.0,
            "agency_name": "BBMP Education Infra Division",
            "contractor_name": "Deccan Construction Ltd",
            "trees_to_cut": 6,
            "buildings_to_demolish": 0,
            "demolition_details": "None.",
            "is_over_sanction_flag": False,
            "before_photo_url": BEFORE_PHOTOS[3],
            "future_visualization_url": FUTURE_RENDERS[0],
            "photos_json": json.dumps([CURRENT_FIELD_PHOTOS[2]])
        },
        {
            "id": 8,
            "title": "Smart Solar Street Lighting Grid, Banashankari Phase 3",
            "description": "Installation of 350 automated energy-efficient solar LED streetlight poles with smart central monitoring sensor nodes.",
            "category": "Street Lighting",
            "scope_unit": "units",
            "scope_value": 350.0,
            "terrain_type": "Urban",
            "constituency": "Bengaluru South",
            "district": "Bengaluru Urban",
            "lat": 12.9180,
            "lng": 77.5550,
            "sanctioned_fund": 140.0,
            "estimated_fund": 140.0,
            "estimated_days": 525,
            "spent_fund": 135.0,
            "actual_start_date": "2025-06-01",
            "expected_completion_date": "2026-01-15",
            "status": "Delayed",
            "assigned_worker_id": 4,
            "worker_name": "Anita Singh",
            "current_progress_pct": 85.0,
            "agency_name": "BESCOM Renewable Energy Cell",
            "contractor_name": "GreenTech Lighting India",
            "trees_to_cut": 0,
            "buildings_to_demolish": 0,
            "demolition_details": "None.",
            "is_over_sanction_flag": False,
            "before_photo_url": BEFORE_PHOTOS[0],
            "future_visualization_url": FUTURE_RENDERS[3],
            "photos_json": json.dumps([CURRENT_FIELD_PHOTOS[1]])
        },
        {
            "id": 9,
            "title": "Integrated Ayush Wellness Centre & Herbal Garden, Sarnath",
            "description": "Sanctioned project for building a holistic AYUSH health centre with 15 OPD rooms, yoga hall, and public botanical garden.",
            "category": "Health & Hospitals",
            "scope_unit": "sqft",
            "scope_value": 10000.0,
            "terrain_type": "Rural",
            "constituency": "Varanasi Cantt",
            "district": "Varanasi",
            "lat": 25.3760,
            "lng": 83.0220,
            "sanctioned_fund": 65.0,
            "estimated_fund": 65.0,
            "estimated_days": 300,
            "spent_fund": 0.0,
            "actual_start_date": "2026-10-01",
            "expected_completion_date": "2027-08-01",
            "status": "Planned/Upcoming",
            "assigned_worker_id": 2,
            "worker_name": "Suresh Kumar",
            "current_progress_pct": 0.0,
            "agency_name": "UP Public Health Dept",
            "contractor_name": "To Be Tendered",
            "trees_to_cut": 3,
            "buildings_to_demolish": 0,
            "demolition_details": "None.",
            "is_over_sanction_flag": False,
            "before_photo_url": BEFORE_PHOTOS[3],
            "future_visualization_url": FUTURE_RENDERS[2],
            "photos_json": json.dumps([])
        },
        {
            "id": 10,
            "title": "Multi-Purpose Cyclone & Flood Resilient Community Shelter, Rajghat",
            "description": "Proposal for a 3-storey elevated community shelter with reinforced plinth, solar emergency power, 600-person capacity, and water purifiers.",
            "category": "Community Halls",
            "scope_unit": "sqft",
            "scope_value": 7500.0,
            "terrain_type": "Flood-Prone / Coastal",
            "constituency": "Varanasi Cantt",
            "district": "Varanasi",
            "lat": 25.3280,
            "lng": 83.0310,
            "sanctioned_fund": 38.0,
            "estimated_fund": 38.0,
            "estimated_days": 180,
            "spent_fund": 0.0,
            "actual_start_date": "2026-09-20",
            "expected_completion_date": "2027-03-20",
            "status": "Pending Approval",
            "assigned_worker_id": None,
            "worker_name": None,
            "current_progress_pct": 0.0,
            "agency_name": "UP State Disaster Management Authority",
            "contractor_name": "Purvanchal Civil Infra Ltd",
            "proposer_agency": "UP State Disaster Management Authority",
            "proposer_contact": "er.alok.pwd@up.gov.in / +91 94150 88214",
            "trees_to_cut": 2,
            "buildings_to_demolish": 0,
            "demolition_details": "None required.",
            "is_over_sanction_flag": False,
            "before_photo_url": BEFORE_PHOTOS[0],
            "future_visualization_url": FUTURE_RENDERS[1],
            "photos_json": json.dumps([])
        },
        {
            "id": 11,
            "title": "Smart Solar Cold Storage & Farmer Market Hub, Ramnagar",
            "description": "Proposal for a 200 MT solar-powered vegetable & fruit cold storage unit with direct farmer loading bay and digital weighing scales.",
            "category": "Community Halls",
            "scope_unit": "sqft",
            "scope_value": 9000.0,
            "terrain_type": "Rural",
            "constituency": "Varanasi Cantt",
            "district": "Varanasi",
            "lat": 25.2680,
            "lng": 83.0250,
            "sanctioned_fund": 58.0,  # 1.6x peer benchmark -> triggers over-sanction warning for MP demo
            "estimated_fund": 58.0,
            "estimated_days": 210,
            "spent_fund": 0.0,
            "actual_start_date": "2026-09-25",
            "expected_completion_date": "2027-04-25",
            "status": "Pending Approval",
            "assigned_worker_id": None,
            "worker_name": None,
            "current_progress_pct": 0.0,
            "agency_name": "Horticulture Development Board",
            "contractor_name": "AgriTech Infrastructure Pvt Ltd",
            "proposer_agency": "Horticulture Development Board",
            "proposer_contact": "project.director@upagri.gov.in / +91 98390 12345",
            "trees_to_cut": 8,
            "buildings_to_demolish": 1,
            "demolition_details": "Demolition of old dilapidated brick godown.",
            "is_over_sanction_flag": True,
            "override_justification": "Heavy insulated sandwich panel refrigeration unit and 50KW rooftop solar array required.",
            "before_photo_url": BEFORE_PHOTOS[1],
            "future_visualization_url": FUTURE_RENDERS[0],
            "photos_json": json.dumps([])
        }
    ]

    db_projects = []
    for item in projects_raw:
        proj = Project(**item)
        db.add(proj)
        db_projects.append(proj)
    db.commit()

    print("Computing Risk Scores & Explainability Cards for Seed Projects...")
    for proj in db_projects:
        risk_info = compute_risk_score(db_projects, proj, db)
        risk = RiskAssessment(
            project_id=proj.id,
            score=risk_info["score"],
            band=risk_info["band"],
            signals_json=json.dumps(risk_info["signals"]),
            primary_signal=risk_info["primary_signal"],
            explanation_json=json.dumps(risk_info["explanation"]),
            ml_anomaly_score=risk_info["ml_anomaly_score"],
            computed_at=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        db.add(risk)
    db.commit()

    print("Seeding Pending Fund Requests with Sanction-Time Peer Checks...")
    sample_peer_check = check_sanction_overrun(
        db_session=db,
        category="Community Halls",
        scope_unit="sqft",
        scope_value=6000.0,
        terrain_type="Rural",
        requested_amount=58.0,  # 2.4x typical cost (58L vs ~24L)
        district="Varanasi"
    )

    fund_req_1 = FundRequest(
        project_title="Construction of Multi-purpose Community Hall, Babatpur",
        description="Construction of 6,000 sqft community hall with guest rooms in Babatpur Rural Block.",
        category="Community Halls",
        scope_unit="sqft",
        scope_value=6000.0,
        terrain_type="Rural",
        district="Varanasi",
        constituency="Varanasi Cantt",
        requested_amount=58.0,
        requested_by="Babatpur Gram Panchayat",
        trees_to_cut=4,
        buildings_to_demolish=0,
        is_over_sanction_flag=sample_peer_check["is_flagged"],
        peer_comparison_json=json.dumps(sample_peer_check),
        estimation_result_json=json.dumps(estimate_project(db_projects, "Babatpur Hall", "Community Halls", "sqft", 6000.0, "Varanasi", 58.0, db_session=db)),
        duplicate_warnings_json="[]",
        status="pending"
    )
    db.add(fund_req_1)
    db.commit()

    print("Seeding Worker Field Updates...")
    updates = [
        WorkerUpdate(
            project_id=1, worker_id=2, worker_name="Suresh Kumar",
            status="In Progress", progress_pct=35.0, expenditure_so_far=115.0,
            notes="Completed sub-grade leveling for 1.2 km section. Laying stone aggregate base layer. Drainage work delayed due to utility cable obstruction.",
            photo_url=CURRENT_FIELD_PHOTOS[0], geotag_lat=25.3521, geotag_lng=82.9652, timestamp="2026-03-01 10:30:00"
        ),
        WorkerUpdate(
            project_id=1, worker_id=2, worker_name="Suresh Kumar",
            status="In Progress", progress_pct=25.0, expenditure_so_far=70.0,
            notes="Initial ground clearance complete. Felled 12 cleared trees with forest clearance permit #FC-892.",
            photo_url=CURRENT_FIELD_PHOTOS[1], geotag_lat=25.3520, geotag_lng=82.9650, timestamp="2026-02-15 14:15:00"
        ),
        WorkerUpdate(
            project_id=3, worker_id=2, worker_name="Suresh Kumar",
            status="In Progress", progress_pct=70.0, expenditure_so_far=38.0,
            notes="Roof casting complete for 2nd floor classrooms. Plastering and electrical conduit wiring in progress.",
            photo_url=CURRENT_FIELD_PHOTOS[2], geotag_lat=25.3121, geotag_lng=82.9691, timestamp="2026-03-05 11:45:00"
        ),
        WorkerUpdate(
            project_id=5, worker_id=3, worker_name="Ramesh Patel",
            status="Delayed", progress_pct=40.0, expenditure_so_far=65.0,
            notes="Pillar casting completed. Foundation reinforcement delayed due to monsoon waterlogging and cement delivery delays.",
            photo_url=CURRENT_FIELD_PHOTOS[3], geotag_lat=26.9856, geotag_lng=75.8514, timestamp="2026-03-08 09:20:00"
        )
    ]
    db.add_all(updates)
    db.commit()

    print("Seeding Citizen Complaints & Fake Photo Reports...")
    complaints = [
        Complaint(
            project_id=1,
            worker_update_id=1,
            citizen_name="Vikas Dubey",
            category="Fake/Wrong Photo",
            description="The field worker uploaded a photo of a asphalt roller machine, but on actual ground in Shivpur Village near the market, no work has happened for the last 2 weeks and the site is lying abandoned.",
            photo_url=CURRENT_FIELD_PHOTOS[0],
            status="Open",
            mla_response="Investigation initiated. Assigned District Magistrate inspector to verify ground status.",
            tracking_code="CMP-2026-8812",
            created_at="2026-03-02 16:20:00"
        ),
        Complaint(
            project_id=1,
            worker_update_id=None,
            citizen_name="Ritu Srivastava",
            category="Cost Overrun & Trees Felling",
            description="The project sanctioned cost of ₹145 Lakhs for 3.2km road is extremely high compared to normal PWD rates. Also, contractors cut down 22 trees instead of the approved limit of 18 trees!",
            photo_url=BEFORE_PHOTOS[0],
            status="In Progress",
            mla_response="Audit team dispatched to inspect tree felling count against forestry permit.",
            tracking_code="CMP-2026-9041",
            created_at="2026-03-04 11:10:00"
        ),
        Complaint(
            project_id=5,
            worker_update_id=4,
            citizen_name="Mahesh Meena",
            category="Delay",
            description="Amer Hospital ICU extension has been stuck at 40% progress for over 4 months despite ₹65 Lakhs spending. Patients are facing severe inconvenience.",
            photo_url="",
            status="Open",
            mla_response=None,
            tracking_code="CMP-2026-1029",
            created_at="2026-03-09 15:45:00"
        )
    ]
    db.add_all(complaints)
    db.commit()

    print("Seeding Audit Log...")
    audits = [
        AuditLog(actor="Hon. MLA Rajesh Sharma", role="mla_admin", action_type="OVER_SANCTION_CHECK", target_type="FundRequest", target_id=1, details="Sanction-Time Check flagged request #1 (Babatpur Hall): 2.4x typical cost (₹58L vs ₹24L typical). Override justification requested.", timestamp="2026-03-01 09:00:00"),
        AuditLog(actor="Hon. MLA Rajesh Sharma", role="mla_admin", action_type="REVIEW_RISK", target_type="Project", target_id=1, details="Reviewed High Risk Flag (Score 82.5) for Shivpur Road. Directed field worker re-verification.", timestamp="2026-03-02 17:00:00")
    ]
    db.add_all(audits)
    db.commit()

    db.close()
    print("Database seeding completed successfully with Reference Projects and Over-Sanction Checks!")

if __name__ == "__main__":
    seed_database()
