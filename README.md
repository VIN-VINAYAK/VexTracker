# VexTracker AI 💉🛡️

An enterprise-grade, clinical pediatric vaccination management platform equipped with deterministic milestone scheduling, cryptographic QR dose verification passes, cold-chain inventory logistics, and a Groq-powered RAG pediatric health assistant grounded in CDC, WHO, and AAP guidelines.

---

## 🌟 Key Features

### 👨‍👩‍👧 1. Parent Experience & Digital Pass
- **Multi-Child Tracking**: Manage complete pediatric profiles with developmental milestones (Birth, 2 months, 4 months, 6–18 months, 4–6 years).
- **Official Digital Vaccine Pass & QR Code**: Cryptographically signed digital immunization passport with live scannable QR code for clinic verification, school, and travel.
- **Printable Medical Certificate**: 1-click printable immunization certificate with official hospital formatting.
- **Smart Notification Reminders**: Automated reminder engine evaluating 7-day, 48-hour, and due-day alerts with live SMS/email dispatch simulation.

### 🩺 2. Pediatric Clinical Station (Doctor Portal)
- **Instant QR Dose Scanner & Verifier**: Scan or paste the patient's cryptographic pass to instantly verify pediatric identity and check allergies.
- **Live Dose Administration**: Record doses directly into the clinical ledger with lot number verification from live inventory, anatomical injection site, and clinical observations.
- **Doctor Digital Signature**: Every administered dose is sealed with doctor credentials and timestamped.
- **Searchable Patient Directory**: Search patient records, clinical charts, and history.

### 🛡️ 3. Regional Healthcare Administrator
- **Operational Executive Dashboard**: Track total pediatric coverage rate (%), total inventory units, active batches, and real-time alerts.
- **AI Dropout Risk Classifier**: Machine Learning weighted ensemble model identifying high-risk dropout cohorts and proposing automated proactive interventions.
- **Predictive Demand Forecasting**: 6-month projected vaccine consumption curves with recommended safety buffer stocks to prevent clinic stockouts.
- **Cold-Chain Inventory**: Track batch lot numbers, storage units (-20°C to 8°C), and expiration alerts (< 90 days).
- **Vaccine Catalog & Clinics**: Manage national pediatric immunization schedules and network healthcare centers.

### 🤖 4. Pediatric Clinical AI Assistant
- **Evidence-Based RAG Architecture**: Answers questions strictly grounded in verified CDC, WHO, and AAP clinical immunization guidelines.
- **Groq LLaMA/GPT Acceleration**: Sub-second answers with structured markdown tables, reassurance, and pediatric warning signs.
- **Deterministic Safety Filtering**: Out-of-scope diagnosis and prescription requests are automatically redirected to clinical providers.

---

## 🚀 Instant 1-Click Demo Credentials

When opening the app, you can click any of the **Instant Demo Buttons** on the login screen to access each portal without typing:

| Role | Name | Email | Password | Features |
| :--- | :--- | :--- | :--- | :--- |
| **Parent** | Maya Patel | `parent@vextracker.ai` | `password123` | Child timeline, digital QR pass, reminders |
| **Doctor** | Dr. Priya Shah, MD | `doctor@vextracker.ai` | `password123` | QR scanner, dose administration, clinical signing |
| **Admin** | Alicia Grant | `admin@vextracker.ai` | `password123` | ML risk models, demand forecasting, inventory |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Canvas-Confetti, QRCode.js
- **Backend**: FastAPI, Motor, Beanie ODM (MongoDB), Python 3.12, PyJWT, Passlib (Bcrypt)
- **Database**: MongoDB (with automatic demo dataset seeding)
- **AI / LLM Engine**: Groq API (`openai/gpt-oss-20b`, `qwen/qwen3.8-27b`) + Local Verified Knowledge Base
- **Testing**: Pytest with unit test coverage

---

## 💻 Running the Project

### Prerequisites
- Node.js 18+
- Python 3.11+
- Local MongoDB (e.g. `mongodb://localhost:27017/`) or Atlas
- Groq API Key (configured in `.env`)

### 1. Backend Setup
```bash
cd backend
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Runs at `http://127.0.0.1:8000`. Run tests anytime with `pytest`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`.
