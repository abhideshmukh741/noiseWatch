# Project: NoiseWatch (GSD Brownfield Onboarded)

## Executive Summary
**NoiseWatch** is an environmental acoustic monitoring and automated complaint management system. It provides real-time sound pressure level tracking, threshold exceedance detection, AI sound classification, evidence dossier compilation, and jurisdictional complaint workflow automation.

## Core Problem & Constraints
- Distinguish between **uncalibrated browser microphones** (estimates only), **calibrated Class 1/2 sound level meters**, and **IoT nodes**.
- Threshold exceedance does **not** equal a confirmed legal violation; human-in-the-loop review is mandatory before enforcement complaints.
- Privacy preservation: residential coordinates are fuzzied/anonymized to protect citizens.
- Immutable records: Sensor readings are append-only; narrative edits never tamper with raw measurements.

## Technology Stack
- **Frontend:** React 19, Vite, Tailwind CSS v4, Recharts, Leaflet, Axios, Lucide Icons, React Router v7.
- **Backend:** Python 3.13, FastAPI, Pydantic v2, ReportLab PDF Engine, NumPy, SciPy, Scikit-learn, Python-Jose.
- **Database:** PostgreSQL (Supabase compatible schema with RLS and Audit Logs).

## Current Status
- Project is running on `http://localhost:5173` (Frontend) and `http://localhost:8000` (Backend).
- 16/16 backend test suites pass.
- Vite production bundle builds in under 1 second.
