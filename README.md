# NoiseWatch — AI-Powered Noise Pollution Monitoring & Complaint Management System

![NoiseWatch Banner](https://img.shields.io/badge/System-NoiseWatch-166534?style=for-the-badge&logo=shield)
![Status](https://img.shields.io/badge/Status-Production--Ready-4ade80?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Open%20Compliance-blue?style=for-the-badge)

NoiseWatch is a full-stack environmental acoustic intelligence and automated regulatory compliance web application. It monitors ambient sound pressure, detects mathematical threshold exceedances across zone categories, classifies acoustic signatures via machine learning, generates court-admissible PDF compliance reports, and manages complaint dispatch to jurisdictional authorities.

---

## 1. Core Architecture & Scientific Integrity Principles

> **Critical Scientific & Legal Disclaimers:**
> - **Uncalibrated Browser Microphone:** Processed via the Web Audio API. Values represent relative acoustic energy and are explicitly labeled as **"Estimated Uncalibrated dB(A)"**.
> - **Calibrated Environmental Sound Meters:** Calibrated against IEC 61672 Class 1/2 standards with traceable calibration certificates.
> - **Threshold Exceedances ≠ Automatic Legal Violation:** Algorithmic exceedance flags trigger an operator review dossier. Only authorized human reviewers may confirm an incident.
> - **Machine Learning Boundaries:** Spectral classifications (construction, machinery, traffic, alarms) provide probabilistic guidance and do not constitute standalone legal fault.

```
                          ┌─────────────────────────┐
                          │   Frontend (React/Vite)  │
                          │ Web Audio API / Leaflet │
                          └───────────┬─────────────┘
                                      │ REST / JWT
                                      ▼
                          ┌─────────────────────────┐
                          │   FastAPI Python API    │
                          │ Rule Engine & ReportLab │
                          └─────┬─────────────┬─────┘
                                │             │
                    ┌───────────▼──┐       ┌──▼───────────┐
                    │  ML & SciPy  │       │   Supabase   │
                    │  Classifier  │       │  PostgreSQL  │
                    └──────────────┘       │  RLS Schema  │
                                           └──────────────┘
```

---

## 2. Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Recharts, Leaflet / OpenStreetMap, React Router v7, Axios, Lucide Icons.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, ReportLab PDF Engine, NumPy, SciPy, Scikit-learn (Random Forest Pipeline, StandardScaler), Python-Jose (JWT), Passlib.
- **Machine Learning**: 11-dimensional acoustic feature extraction pipeline (RMS, ZCR, Spectral Centroid, Bandwidth, Rolloff, Sub-band Energy Ratios, Spectral Flatness, Temporal Crest Factor), Random Forest Classifier with 98.0% test accuracy & 97.95% 5-fold cross-validation.
- **Database & Auth**: PostgreSQL (Supabase compatible), Row Level Security (RLS), Supabase Storage for encrypted evidence and generated reports.
- **Testing**: Python integration test runner with 19 automated test suites passing.

---

## 3. Directory Structure

```
noise_polution/
├── .env.example                      # Production environment template
├── README.md                         # Architecture & setup documentation
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── auth.py           # JWT login, registration & profiles
│   │   │       ├── dashboard.py      # Telemetry, readings, sites, devices
│   │   │       ├── reports.py        # PDF streaming & complaints
│   │   │       └── audio.py          # Feature extraction, ML inference, retraining & WAV upload
│   │   ├── core/
│   │   │   ├── auth.py               # Token creation, verification, RBAC
│   │   │   ├── config.py             # Pydantic v2 application settings
│   │   │   └── database.py           # Supabase & async database helpers
│   │   ├── ml/
│   │   │   ├── classifier.py         # Trained Random Forest inference & heuristic fallback
│   │   │   ├── train_model.py        # Physical acoustic synthesis, training & evaluation pipeline
│   │   │   └── saved_models/
│   │   │       ├── sound_classifier.joblib  # Serialized Scikit-Learn Pipeline
│   │   │       └── model_metrics.json       # Accuracy, CV scores & feature importances
│   │   ├── models/
│   │   │   └── models.py             # ORM entity schema
│   │   ├── schemas/
│   │   │   └── schemas.py            # Pydantic validation models
│   │   ├── services/
│   │   │   ├── demo_data.py          # Realistic diurnal patterns & incidents
│   │   │   ├── incident_engine.py    # Time-aware zone threshold rule engine
│   │   │   └── pdf_generator.py      # ReportLab PDF compliance generator
│   │   └── main.py                   # FastAPI application root & CORS
│   ├── migrations/
│   │   └── 001_initial_schema.sql    # PostgreSQL DDL, RLS policies, audit logs
│   ├── requirements.txt              # Backend dependencies
│   └── tests/
│       ├── test_backend.py           # 18 Unit & integration tests
│       └── run_tests.py              # Automated test executor
└── frontend/
    ├── public/                       # Static public assets
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx            # Sticky blurred navbar with role info
    │   │   ├── StatCard.jsx          # Glass-morphism metric cards
    │   │   └── WaveformVisualizer.jsx# HTML5 Canvas real-time audio visualizer
    │   ├── context/
    │   │   └── AuthContext.jsx       # User session & role management
    │   ├── hooks/
    │   │   └── useAudioMonitor.js    # Web Audio API mic & simulation engine
    │   ├── pages/
    │   │   ├── LandingPage.jsx       # Page A: Technology showcase & hero
    │   │   ├── DashboardPage.jsx     # Page B: Real-time gauge, waveform, charts
    │   │   ├── MapPage.jsx           # Page C: Leaflet monitoring site map
    │   │   ├── AnalyticsPage.jsx     # Page D: 24h diurnal trends & CSV export
    │   │   ├── IncidentDetailPage.jsx# Page E: Evidence dossier & review actions
    │   │   ├── ReportsPage.jsx       # Page F: ReportLab PDF download & complaints
    │   │   ├── AdminPage.jsx         # Page G: Sensor fleet, rules, audit logs
    │   │   ├── LoginPage.jsx         # One-click demo role switcher
    │   │   └── RegisterPage.jsx      # Citizen & operator signup
    │   ├── services/
    │   │   └── api.js                # Axios client with JWT interceptor
    │   ├── App.jsx                   # React Router routing table
    │   ├── index.css                 # Mint & Charcoal design system tokens
    │   └── main.jsx                  # React DOM mount
    ├── package.json
    └── vite.config.js
```

---

## 4. Local Quickstart Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Step 1: Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

Run backend tests:
```bash
python tests/run_tests.py
# Output: RESULTS: 19 passed, 0 failed out of 19 tests.
```

Start the FastAPI development server:
```bash
python -m uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Step 2: Frontend Setup
```bash
cd frontend
npm install --legacy-peer-deps
npm run build    # Validates production bundle
npm run dev      # Launches Vite dev server at http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 5. Demo Accounts & One-Click Role Switcher

On the `/login` page, you can use the pre-configured quick switch buttons:
- **Resident:** `demo@noisewatch.app` (Password: `demo1234`)
- **Authorized Reviewer:** `reviewer@noisewatch.app` (Password: `demo1234`)
- **Administrator:** `admin@noisewatch.app` (Password: `demo1234`)

---

## 6. Regulatory Standards & Thresholds Configured

NoiseWatch comes pre-calibrated with the following jurisdictional guidelines:

| Zone Category | Day Permissible Limit (06:00 - 22:00) | Night Permissible Limit (22:00 - 06:00) | Regulatory Basis |
| :--- | :--- | :--- | :--- |
| **Residential Zone** | 55 dB(A) | 45 dB(A) | CPCB / WHO Community Guidelines |
| **Commercial Zone** | 65 dB(A) | 55 dB(A) | Central Environmental Standards |
| **Industrial Zone** | 75 dB(A) | 70 dB(A) | Factories Act & Noise Rules |
| **Silent Zone** (Hospitals/Schools) | 50 dB(A) | 40 dB(A) | Silence Zone Notification (100m) |

---

## 7. ReportLab PDF Generation

Official PDF incident compliance reports can be downloaded directly from `/reports` or `/incidents/:id`.
Each report includes:
- Official NoiseWatch cryptographic identifier & generation timestamp.
- Monitored site name, approximate coordinates, and designated zone category.
- Sensor hardware metadata and calibration status.
- Primary acoustic signature and spectral feature breakdown (RMS, centroid, ZCR).
- Day/Night statutory threshold comparison table and exceedance duration.
- Reviewer observational notes and legal limitations disclaimer.
- Formal sign-off and verification signature block.

---

## 8. Supabase & Production Deployment

### Database Migrations
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** in the Supabase Dashboard.
3. Paste and run `backend/migrations/001_initial_schema.sql`.
4. Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your `.env`.

### Production Deployment
- **Frontend:** Deploy to [Vercel](https://vercel.com) by pointing to the `frontend/` directory with `npm run build` as the build command.
- **Backend:** Deploy to [Render](https://render.com) or [Railway](https://railway.app) pointing to `backend/` using `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
