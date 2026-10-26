# 🗳️ Campaign Intelligence & Election Management System (CI-EMS) System Manual

This document provides a comprehensive operational guide for the extended **Campaign Intelligence & Election Management System (CI-EMS 3.1)**.

---

## 🏛️ System Overview

The CI-EMS platform is built to deliver real-time election monitoring, voter intelligence, agent management, survey analytics, stakeholder mobilization, campaign strategy tracking, department organization, and election day tally verification with AI-assisted strategic insights.

---

## 👥 Roles & Role-Based Access Control (RBAC)

The system enforces server-derived security roles and specialized candidate dashboards:

1. **Super Admin (Rank 10)**
   - System configuration, user provisioning, gazetted polling station CSV imports, bulk updates, full audit trail access (`AdminDashboard.jsx`).
2. **Strategy Team & Department Leads (Rank 8)**
   - Executive war room dashboard, AI strategy assistant access, voter sentiment & survey analytics, 5-phase campaign plan management, org hierarchy builder (`StrategyDashboard.jsx`, `StrategyTeamModule.jsx`).
3. **Gubernatorial / County Lead (Rank 7)**
   - County-wide election command center, sub-county constituency performance tracking, parallel tally oversight (`GovernorDashboard.jsx`).
4. **Regional Coordinator (Rank 6)**
   - Regional agent assignment, activity monitoring, regional polling station intelligence map, Form 34A tally sign-off queue (`RegionalDashboard.jsx`).
5. **Parliamentary MP Candidate (Rank 5)**
   - Constituency-wide war room, ward-level agent tracking, Form 35A tally monitoring (`MPDashboard.jsx`).
6. **Civic MCA Candidate (Rank 4)**
   - Ward-level operational dashboard, polling station agent coordination, Form 39A tally monitoring (`MCADashboard.jsx`).
7. **Field Agent (Rank 4)**
   - Mobile terminal access to submit field reports with auto-photo compression (~89% reduced payload), complete targeted surveys, log stakeholder meetings, execute assigned missions, and transmit election day statutory form tallies (`AgentPortal.jsx`, `FieldOperationsPWA.jsx`).
8. **Candidate / Aspirant Auditor (Rank 3)**
   - Side-by-side Form 34A evidence verification queue, approval sign-off, mismatch flagging (`AspirantDashboard.jsx`).
9. **Observer (Rank 2)**
   - Read-only access to public analytics dashboards, live tally totals, survey summaries, and election monitoring streams (`ObserverDashboard.jsx`).

---

## 🚀 Key Modules & Capabilities

### 1. Strategy Team & Campaign Organization (`StrategyTeamModule.jsx` & `campaignOrganization.js`)
- **9 Core Campaign Departments**:
  1. Executive Office & Strategy
  2. Ground Operations & Mobilization
  3. Communications, Media & PR
  4. Legal & Electoral Compliance
  5. Security & Intelligence
  6. Finance & Resource Logistics
  7. Data Analytics & Voter Research
  8. Polling Station Agent Operations
  9. Women & Youth League Affairs
- **Department Roles Map**: Maps position titles (e.g. *Head of Legal*, *Chief Operations Officer*, *Media Director*) to departments.
- **Candidate Seat Jurisdiction Locking**:
  - **Governor**: Root jurisdiction locked to **County** level.
  - **MP**: Root jurisdiction locked to **Constituency** level.
  - **MCA**: Root jurisdiction locked to **Ward** level.
- **Org Hierarchy Tree**: Visual tree view of strategy team members, root nodes, sub-nodes, system access toggles, and position assignments.
- **Task & Roadmap Engine**: 5-phase campaign plan tracking with task priorities, overdue warnings, and target completion metrics.

### 2. Scoped Location Sieve (`ScopedLocationSieve.jsx` & `scopeResolver.js`)
- **Hierarchical Boundary Filter**: Allows users to filter polling stations and metrics seamlessly down the administrative tree: `County → Constituency → Ward → Polling Centre → Polling Station / Stream`.
- **Dynamic Scope Locks**:
  - Automatically disables out-of-jurisdiction dropdowns based on user security role or candidate scope.
  - Changing a higher administrative level (e.g. Constituency) automatically resets lower selections (Ward, Polling Centre).
- **Server-Side Security Enforcement**: Validates request parameters server-side to prevent client-side scope manipulation (`evaluates user tenant & jurisdiction scope; fails closed on tampering`).

### 3. Agent Accreditation, Training & Mission Center (`agentMissions.js` & `agentCertification.js`)
- **Agent Accreditation Lifecycle**: `UNASSIGNED` → `TRAINING_COMPLETED` → `EXAM_PASSED` → `ACCREDITED` → `DEPLOYED_AT_STATION`.
- **Station Readiness Checklist**: Verifies agent presence, statutory form possession, battery power level, network signal, and presider contact.
- **Mission Vectors**: Defines pre-election, election-day, and post-election task missions with target deadlines and completion logging.
- **Break-Glass Device Recovery**: Handles lost or damaged mobile terminals by revoking old hardware tokens and re-binding replacement units without breaking audit continuity.

### 4. Polling Station Intelligence Module (`PollingStationIntelligence.jsx`)
- **Fields**: Name, Code, County, Constituency, Ward, Village, GPS Coordinates, Registered Voters, Active Voters, Historical Turnout %.
- **Intelligence Fields**: Party Advantage Score, Incumbency Score, Opposition Strength, Public Perception Rating, Competitor Activity Level, Strategic Importance, Risk Level.
- **Features**: Multi-criteria search, risk level filters, interactive GIS mapping canvas, CSV bulk importer, and mass update tools.

### 5. Survey & Polling Engine (`SurveyEngine.jsx`)
- **Survey Types**: Anonymous Public Survey, Targeted Survey, Candidate Preference Poll, Issue-Based Survey.
- **Question Types**: Single Choice, Multi Choice, Text, Rating, Number.
- **Features**: Visual survey builder, public share link & SVG QR Code generator, response collector, response analytics, and CSV export.

### 6. Field Reporting Module (`FieldReporting.jsx`)
- **Report Types**: Mobilization Reports, Campaign Reports, Incident Reports, Opponent Activity Reports, Community Sentiment Reports.
- **Features**: Client-side photo auto-compression engine (reduces camera images from ~4MB down to ~400KB), thumbnail generator, GPS location tagger, severity badges (Low, Medium, High, Critical), and centralized feed.

### 7. Team Mobilization & Stakeholder Network (`TeamMobilization.jsx`)
- **Categories**: Village Elders, Clergy, Youth Mobilizers, Women Leaders, Bodaboda Leaders, Business Leaders, Community Organizers.
- **Tracking**: Influence rating (1-10), voter reach estimator, assigned coordinator, and activity follow-up logger.

### 8. Election Day Operations & Parallel Tally (`TallyCenter.jsx` & `ParallelTally.jsx`)
- **Statutory Form Capture**: Form 34A (Presidential), 35A (MP), 36A (Senator), 37A (Woman Rep), 38A (Governor), 39A (MCA).
- **Validation**: Automatic math sum check and registered voters ceiling check.
- **Evidence Vault**: SHA-256 binary content hash, client-side auto-compression, simulated OCR extraction reader, discrepancy mismatch flagging, and supervisor verification workflow.

### 9. AI Intelligence Assistant (`AIAssistantModal.jsx`)
- **Capabilities**: Summarizes field reports, flags high-risk wards, tracks top voter concerns, identifies underperforming agents, and generates executive weekly strategy briefings using Gemini RAG.

---

## 🗄️ Database Architecture & Service Layer

- **Database DDL**: Defined in [`docs/schema.sql`](file:///c:/Users/user/Documents/Websites/EMS/docs/schema.sql).
- **PostgreSQL RLS Engine**: Defined in [`src/services/postgresRlsEngine.js`](file:///c:/Users/user/Documents/Websites/EMS/src/services/postgresRlsEngine.js) & [`docs/POSTGRES_RLS.md`](file:///c:/Users/user/Documents/Websites/EMS/docs/POSTGRES_RLS.md).
- **API Service Layer**: Implemented in [`src/services/api.js`](file:///c:/Users/user/Documents/Websites/EMS/src/services/api.js).
- **LLM Service Engine**: Implemented in [`src/services/llmService.js`](file:///c:/Users/user/Documents/Websites/EMS/src/services/llmService.js) supporting Google Gemini API & local RAG context injection.
- **Data Context Store**: Centralized in [`src/context/DataContext.jsx`](file:///c:/Users/user/Documents/Websites/EMS/src/context/DataContext.jsx) with `localStorage` persistence.

---

## 🧪 Automated Verification & Test Suite

CI-EMS features an extensive automated test suite (`src/__tests__/ci-ems.test.js`):
- **258 Passing Automated Tests** covering security RLS policies, object storage immutability, RAG LLM engine, scope resolvers, ASVS v5.0 verification, DR drills, and strategy team metrics.
- Execute via terminal:
  ```bash
  npm test
  ```
