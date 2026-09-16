# MPLAD AI Monitor — AI-Assisted Infrastructure Oversight, Sanction Guard & Fraud Detection

**Smart India Hackathon 2026 — Problem Statement SIH26102**

An AI-assisted platform to monitor MPLAD (Members of Parliament Local Area Development Scheme) infrastructure projects, detect cost/schedule/duplicate fraud risks, **prevent over-sanctioning at the moment of fund request using a public reference dataset from mplads.gov.in**, enforce environmental tree-cutting & building demolition limits, provide 3D future completion visualizations, and empower citizens with transparent complaint channels.

---

## Key Features & User Roles

### 1. MLA / Admin Command Center & Sanction Guard
- **Sanction-Time Over-Sanction Detection (New Add-On Feature)**:
  - Compares incoming fund requests against a reference dataset of public works records (`mplads.gov.in`, state PWDs, PMGSY).
  - Normalizes unit costs (cost per sq ft / per km) filtered by category, size, and **terrain type** (`Rural`, `Urban`, `Hilly / Mountainous`, `Flood-Prone / Coastal`).
  - Flags outlier requests (e.g. `2.4x typical peer cost`) as **"High Sanction Risk"** *BEFORE* funds are approved and released.
  - **"AI Flags, Humans Decide"**: Does not hard-block; requires a mandatory human confirmation / technical justification note logged to the permanent audit trail upon approval.
- **Reference Benchmark Database Tab (`/api/reference-projects`)**:
  - Live explorer for public reference projects with category & terrain filters and average unit cost benchmarks.
  - Growing dataset pool: every project completed through our system is indexed back into the reference dataset to improve peer comparisons over time.
- **AI Auto-Estimator on New Fund Requests (`/api/estimate`)**: Automatically calculates fair cost & duration using IQR and median baselines, flagging duplicate text & geo candidates (< 2 km).
- **Executive Risk Command Center**: 4-Band ML Composite Risk Score (Low, Medium, High, Critical) with explainability cards.
- **Interactive Leaflet Drill-Down Map & Location Sorting**: Sort and filter projects by District, Constituency, AI Risk Score, Sanctioned Budget, Completion %, or Category.
- **Environmental Shield & Demolition Limits**: Enforces approved tree felling limits (`trees_to_cut`) to prevent unauthorized over-cutting and tracks building demolition specs.
- **Citizen Complaint Management**: Review and officially respond to citizen grievances.

### 2. Field Worker App (Mobile-First)
- Displays assigned infrastructure projects.
- One-tap status updates (`Not Started`, `In Progress`, `Delayed`, `Completed`).
- Touch slider for physical completion percentage (`0% – 100%`).
- Actual expenditure logging and site supervisor notes.
- Real site photo upload with geotagging proof, instantly updating both MLA and Public views and triggering live AI risk re-computation.
- When marked **Completed**, automatically feeds the verified completion data into the Public Reference Project dataset pool!

### 3. Public Citizen Portal (Government Transparency)
- High-transparency civic portal with constituency-level static development stats (schools, roads, community halls built, total funds utilized).
- **Card-Based Project Explorer**: Browse projects with search, category filters, and location sorting.
- **3D Future Completion Render vs Ground Photo Studio**: Side-by-side visual comparison of initial site (before), 3D architectural future design render (after completion), and current field photo.
- **Simplified Public Risk Badges**: Color-coded badges with top plain-language reasons (*"Investigation priority flag, not proof of fraud"*).
- **Citizen Complaint System**: File complaints against projects (including reporting fake photos uploaded by workers) with automated tracking codes (`CMP-2026-XXXX`) and real-time status lookup.

---

## AI Estimation & Multi-Signal Risk Engine

1. **Sanction-Time Peer Check (`/api/sanction-check`)**: Outlier detection against `mplads.gov.in` reference projects filtered by category, scale, and terrain type (Rural, Urban, Hilly, Flood-Prone).
2. **Cost Anomaly Signal (30%)**: Statistical deviation (IQR / Z-score) of project cost per unit vs district category baselines.
3. **Time / Delay Anomaly Signal (25%)**: Compares actual elapsed duration against expected category completion days.
4. **Fund Utilisation Anomaly Signal (20%)**: Flags discrepancies between spent fund % and physical completion %.
5. **Duplicate / Re-application Signal (15%)**: Scikit-Learn `TfidfVectorizer` text similarity combined with Haversine spherical distance (< 2.0 km).
6. **Contractor / Agency Risk Signal (10%)**: Measures historical risk patterns and location clustering for implementing agencies.
7. **Unsupervised ML Layer**: `IsolationForest` fitted on project metric vectors for anomaly pattern detection.

---

## Quick Start Guide

### 1. One-Click Launch (Windows)
Double-click `run_app.bat` or run:
```bash
.\run_app.bat
```

### 2. Manual Launch
**Terminal 1 — Backend API:**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```
- Backend API Docs: `http://localhost:8000/docs`

**Terminal 2 — Frontend UI:**
```bash
cd frontend
npm run dev
```
- Frontend Web App: `http://localhost:5173`
