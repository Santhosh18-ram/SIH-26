import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("Testing MPLAD AI Monitor + Sanction-Time Engine")
    print("==================================================")

    # 1. Test Dashboard Stats
    print("\n1. Testing /api/dashboard/stats...")
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200, f"Failed stats: {res.text}"
    stats = res.json()
    print(f"   Stats OK: {stats['total_projects']} projects, INR {stats['total_sanctioned_fund_lakhs']}L sanctioned")
    print(f"   Reference Projects Pool Size: {stats['reference_projects_pool_size']}")

    # 2. Test Public Reference Projects Dataset
    print("\n2. Testing /api/reference-projects (mplads.gov.in data)...")
    res = client.get("/api/reference-projects?category=Roads%20%26%20Bridges&terrain_type=Rural")
    assert res.status_code == 200, f"Failed reference projects: {res.text}"
    ref_data = res.json()
    print(f"   Reference Projects OK: Found {ref_data['total_records']} rural road reference records")
    print(f"   Average Cost Benchmark: INR {ref_data['average_cost_per_unit']}L per km")

    # 3. Test Sanction-Time Over-Sanction Check (Normal vs Outlier)
    print("\n3. Testing /api/sanction-check (Normal Request)...")
    normal_req = {
        "category": "Community Halls",
        "scope_unit": "sqft",
        "scope_value": 6000.0,
        "terrain_type": "Rural",
        "requested_amount": 24.0, # Normal peer cost
        "district": "Varanasi"
    }
    res = client.post("/api/sanction-check", json=normal_req)
    assert res.status_code == 200, f"Failed sanction check: {res.text}"
    normal_check = res.json()
    print(f"   Normal Check: Flagged={normal_check['is_flagged']}, Risk Level={normal_check['risk_level']}, Ratio={normal_check['multiplier_ratio']}x")

    print("\n4. Testing /api/sanction-check (Over-Sanction Outlier)...")
    outlier_req = {
        "category": "Community Halls",
        "scope_unit": "sqft",
        "scope_value": 6000.0,
        "terrain_type": "Rural",
        "requested_amount": 58.0, # 2.4x typical cost
        "district": "Varanasi"
    }
    res = client.post("/api/sanction-check", json=outlier_req)
    assert res.status_code == 200, f"Failed sanction check: {res.text}"
    outlier_check = res.json()
    print(f"   Outlier Check: Flagged={outlier_check['is_flagged']}, Risk Level={outlier_check['risk_level']}, Ratio={outlier_check['multiplier_ratio']}x")
    clean_exp = outlier_check['explanation_text'].replace('\u20b9', 'INR ')
    print(f"   Explanation: {clean_exp}")

    # 5. Test AI Estimation with Sanction Peer Check integrated
    print("\n5. Testing /api/estimate with integrated Peer Check...")
    est_payload = {
        "title": "New Rural Health Sub-Centre",
        "category": "Health & Hospitals",
        "scope_unit": "sqft",
        "scope_value": 5000.0,
        "terrain_type": "Hilly / Mountainous",
        "district": "Jaipur",
        "constituency": "Jaipur Rural",
        "sanctioned_fund": 75.0,
        "trees_to_cut": 4,
        "buildings_to_demolish": 0
    }
    res = client.post("/api/estimate", json=est_payload)
    assert res.status_code == 200, f"Failed estimate: {res.text}"
    est = res.json()
    print(f"   Estimate OK: Fair Cost INR {est['estimated_fund']}L, Estimated Days: {est['estimated_days']}")
    print(f"   Peer Check Included: {est['sanction_peer_check']['risk_level']} ({est['sanction_peer_check']['multiplier_ratio']}x)")

    # 6. Test Agency Project Proposal and MP Approval Workflow
    print("\n6. Testing /api/projects/propose (Agency Proposal)...")
    prop_payload = {
        "title": "Primary Rural Drainage Network Construction, Varanasi",
        "description": "2.5 km concrete lined stormwater drainage line to prevent monsoon waterlogging.",
        "category": "Water & Sanitation",
        "scope_unit": "units",
        "scope_value": 1.0,
        "terrain_type": "Rural",
        "district": "Varanasi",
        "constituency": "Varanasi Cantt",
        "lat": 25.3340,
        "lng": 82.9810,
        "estimated_fund": 14.5,
        "estimated_days": 90,
        "agency_name": "UP Jal Nigam",
        "contractor_name": "Ganga Infrastructure",
        "proposer_contact": "er.sharma@jalnigam.up.gov.in",
        "trees_to_cut": 0,
        "buildings_to_demolish": 0
    }
    res = client.post("/api/projects/propose", json=prop_payload)
    assert res.status_code == 200, f"Failed proposal: {res.text}"
    prop_res = res.json()
    new_proj_id = prop_res["id"]
    print(f"   Proposal Submitted OK: Project ID {new_proj_id}, Status: {prop_res['status']}")

    print("\n7. Testing /api/projects/proposals (Fetching Proposals)...")
    res = client.get("/api/projects/proposals")
    assert res.status_code == 200, f"Failed fetching proposals: {res.text}"
    proposals = res.json()
    assert len(proposals) >= 1, "Expected at least 1 proposal"
    print(f"   Fetched {len(proposals)} pending proposals successfully.")

    print(f"\n8. Testing /api/projects/{new_proj_id}/approve (MP Sanction Approval)...")
    appr_payload = {
        "action": "approve",
        "sanctioned_fund": 14.5,
        "approval_notes": "Sanction approved after verifying AI peer benchmarks and local drainage requirements.",
        "approved_by": "Hon. MLA Rajesh Sharma"
    }
    res = client.post(f"/api/projects/{new_proj_id}/approve", json=appr_payload)
    assert res.status_code == 200, f"Failed approval: {res.text}"
    appr_res = res.json()
    print(f"   Approved OK: {appr_res['message']} (Status: {appr_res['status']})")

    print("\n==================================================")
    print("All Sanction-Time, Proposal & MP Approval Tests Passed Successfully!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()

