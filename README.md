# 🗳️ Campaign Intelligence & Election Management System (CI-EMS 3.1)

> **An enterprise-grade, infrastructure-validated election operations platform featuring versioned electoral geography, configurable statutory result evidence (Parallel Tally), PostgreSQL Row-Level Security (RLS) tenant isolation, S3 immutable evidence storage, offline PWA synchronization, end-to-end transaction correlation, OWASP ASVS v5.0 verification, dynamic legally-approved data retention, and a 5-stakeholder Go/No-Go Production Readiness Gate.**

---

## 📌 Executive Summary & Architecture Overview

The **Campaign Intelligence & Election Management System (CI-EMS 3.1)** is engineered for political parties, campaign headquarters, regional coordinators, tallying officers, and field agents. It bridges high-throughput field operation data collection with centralized command center evidence verification and strategy execution.

CI-EMS operates across **4 Core Operating Lifecycles**:

```
                       CI-EMS ELECTION OPERATING LIFECYCLE

     ┌─────────────────────┐
     │ 1. PRE-ELECTION     │  Voter Sentiment Aggregation · Surveys · Mobilization Network
     └─────────┬───────────┘
               ↓
     ┌─────────────────────┐
     │ 2. READINESS        │  Agent Accreditation · Training & Exam · Logistics · Station Readiness
     └─────────┬───────────┘
               ↓
     ┌─────────────────────┐
     │ 3. ELECTION DAY     │  Field PWA · Command Center · Universal Cases · Evidence Vault · Parallel Tally
     └─────────┬───────────┘
               ↓
     ┌─────────────────────┐
     │ 4. POST-ELECTION    │  Reconciliation · Disaster Recovery · Tamper-Evident Ledger · Legal Defense
     └─────────────────────┘
```

---

## 🖥️ System Architecture & Dual Interfaces

CI-EMS provides two distinct operational interfaces powered by a unified, server-derived security backend:

```
                                  CI-EMS 3.1 ARCHITECTURE
                                             │
             ┌───────────────────────────────┴───────────────────────────────┐
             │                                                               │
    FIELD OPERATIONS PORTAL                                       COMMAND CENTER PORTAL
             │                                                               │
  - Field Agent Mobile PWA                                        - Executive Briefings & Strategic Dashboard
  - Low-bandwidth & Offline Queue                                 - Security Operations & SOC Alert Correlation
  - Station Event & Incident Logging                              - Evidence Verification & OCR Discrepancy Engine
  - Form Evidence Photo Capture                                   - Parallel Tally & Statutory Reconciliation
  - GPS & Hardware Fingerprint Binding                            - Universal Operational Cases & Shift Handovers
  - Agent Accreditation & Training                                - Production Readiness Board & Go/No-Go Gate
```

---

## 🛠️ Core Architectural Invariants & Infrastructure Safeguards

### 1. Separation of Political Authority vs. System Security Roles
Political or campaign job titles do **NOT** grant administrative system authorization. Authority is determined strictly by server-derived security roles:
- `Ward Campaign Lead` → Security Role: `WARD_COORDINATOR`
- `Campaign Treasurer / Resource Mobilizer` → Security Role: `AGENT` (Read-only financial data access)
- System permissions are checked using `hasPermission(user, 'evidence.verify', scope)` via server-derived context, ignoring self-reported political titles.

---

### 2. Versioned Electoral Geography (No Hardcoded Station Counts)
Geography is managed as a **Versioned Election Dataset**, supporting gazette changes (e.g. IEBC 2022 gazetted 46,229 polling stations across 24,559 registration centres):

```
Election → Dataset Version → County → Constituency → Ward → Polling Centre → Polling Station / Stream
```

**Dataset Metadata Attributes:**
`dataset_version`, `source`, `gazette_reference`, `effective_date`, `imported_at`, `checksum`, `active`.

---

### 3. Configurable Statutory Result Forms (Kenyan Elections Framework)
Statutory form definitions are versioned by contest type rather than assumed static across elections:

| Elective Contest | Statutory Form Type | Scope / Jurisdiction |
| :--- | :--- | :--- |
| **Presidential** | **Form 34A** | Polling Station / National |
| **National Assembly (MP)** | **Form 35A** | Polling Station / Constituency |
| **Senator** | **Form 36A** | Polling Station / County |
| **County Woman Representative** | **Form 37A** | Polling Station / County |
| **Governor** | **Form 38A** | Polling Station / County |
| **Member of County Assembly (MCA)** | **Form 39A** | Polling Station / Ward |

> *Notice: Internal parallel tallies are marked `CAMPAIGN PARALLEL TALLY - NOT OFFICIAL DECLARATION` to prevent premature public declaration claims.*

---

### 4. PostgreSQL Row-Level Security (RLS) & Multi-Tenant Data Isolation
CI-EMS enforces strict PostgreSQL Row-Level Security (`FORCE ROW LEVEL SECURITY`) across 10 sensitive database tables (`evidence`, `submissions`, `agents`, `operational_cases`, `incidents`, `communications`, `surveys`, `devices`, `audit_metadata`, `reconciliation_cases`).

- **Default-Deny Policy**: Policies execute against `USING (tenant_id = current_setting('app.current_tenant_id', true))`.
- **Privilege Separation**: Superuser or `BYPASSRLS` database roles are explicitly blocked for application database connections.

---

### 5. S3 Object Storage Contract & SHA-256 Immutability Vault
Uploaded statutory form evidence images undergo deterministic SHA-256 binary content hashing:
```
Capture → Payload Hash → S3 Vault → Hash Verification → OCR Audit → Human Maker-Checker Review → Lock
```
- **Integrity Check**: Re-hashes payload on access and flags any data corruption (`CRITICAL CORRUPTION: Hash Mismatch`).
- **Tenant Isolation**: Signed URL issuance validates requestor tenant ID against object metadata.

---

### 6. Versioned Legally-Approved Data Retention Policy Engine
Replaces static retention numbers with a jurisdiction-aware, contest-specific retention engine:
- **Presidential Election Records**: 7 Years (2,555 Days) minimum statutory lock.
- **Gubernatorial / Senatorial / MP / MCA Records**: 7 Years (2,555 Days) statutory lock.
- **Destruction Rule**: Requires formal High Court order (`destruction_requires_court_order = true`).
- **Statutory References**: Kenya Elections Act Sec 87, ODPC Regulations 2021.

---

### 7. Offline PWA Resiliency & Exactly-Once Idempotent Synchronization
Field agents transmit data via IndexedDB offline queues during network disruptions:
- **Idempotency Deduplication**: Requests include a unique `idempotency_key` (`UUIDv4`).
- **Retries**: Retried sync payloads return original server ACK IDs without duplicating records.
- **Recovered Queue Normalization**: Re-established network connections automatically deduplicate and flush stored transactions.

---

### 8. Device Trust Lifecycle & Hardware Binding
Mobile field devices undergo registration and cryptographic fingerprint binding:
- **Trust States**: `REGISTERED` → `TRUSTED` → `REVOKED`.
- **Lost Phone Protocol**: Station coordinator triggers break-glass device recovery, revoking the lost device token and binding a replacement unit while maintaining audit ledger continuity.

---

### 9. Transaction Correlation & End-to-End Tracing
Every transaction propagates a complete execution context:
```json
{
  "correlation_id": "corr-uuid-v4",
  "request_id": "req-uuid-v4",
  "user_id": "USR-102",
  "tenant_id": "TENANT-KENYA-2027",
  "campaign_id": "CAMP-NAT-2027",
  "device_id": "DEV-5540",
  "timestamp": "2026-09-19T21:28:47.000Z"
}
```

---

### 10. OWASP ASVS v5.0 Requirement-Level Verification Status
Security verification is audited on a per-requirement basis across 8 core domains:
- `FULLY_VERIFIED`: Verified by automated unit/integration tests and active system controls.
- `PARTIALLY_VERIFIED`: Software controls verified; pending staging environment integration.
- `ENVIRONMENT_DEPENDENT_UNVERIFIED`: Depends on live cloud infrastructure configuration (e.g., AWS KMS HSM, Cloudflare WAF).
- `FAILED_OR_BLOCKED`: Failed or missing security control.

---

## 🚦 Production Readiness Board & Go/No-Go Decision Gate

CI-EMS evaluates 10 operational workstreams against a 4-tier verification ladder (`IMPLEMENTED` → `TESTED` → `SIMULATION_VERIFIED` → `PRODUCTION_VALIDATED`):

1. **Real PostgreSQL RLS Tenant Isolation**
2. **S3 Storage & SHA-256 Immutability**
3. **Redis Queue & Crash Worker Recovery**
4. **Server Identity & Device Binding**
5. **Observability & Correlation Tracing**
6. **Real Load & Reconnect Storm Testing**
7. **Disaster Recovery & Restore Drills**
8. **OWASP ASVS 5.0 Security Matrix**
9. **ODPC Kenya Privacy & Aggregation**
10. **Election Rehearsal & AAR Governance**

### Stakeholder Maker-Checker Sign-off Requirements
A **`GO`** decision requires a overall readiness score $\ge 90\%$ AND explicit sign-off from all 5 required roles:
- 🛡️ **Chief Technology Officer (CTO)**
- 🔒 **Chief Information Security Officer (CISO)**
- 📡 **Director of Election Operations**
- ⚖️ **Data Protection Officer (DPO)**
- 🗳️ **Campaign General Director**

---

## ⚡ Tiered Service Resilience & Disaster Recovery

### System Tiering & Circuit Breakers
- **Tier 0 (Core Election Integrity)**: Result submission, evidence hashing, audit logging. *Must remain operational during any outage.*
- **Tier 1 (Command & Monitoring)**: Dashboard metrics, incident cases, telemetry.
- **Tier 2 (Integrations & Messaging)**: SMS notifications, external webhooks. *Falls back to in-app messaging on failure.*
- **Tier 3 (AI & Analytics)**: AI executive briefings, sentiment predictions. *Gracefully degrades without blocking operational tallying.*

### Disaster Recovery Targets
- **Recovery Point Objective (RPO)**: $0$ seconds (Zero data loss).
- **Recovery Time Objective (RTO)**: $< 5$ seconds (Active-standby database failover).

---

## 🧪 Election Dress Rehearsal Certification (7 Zero-Tolerance Outcomes)

During pre-election dress rehearsals, the system evaluates 7 non-negotiable outcomes:

1. **Data Loss = 0**
2. **Silent Overwrites = 0**
3. **Unauthorized Cross-Tenant Access = 0**
4. **Unauthorized Cross-Jurisdiction Access = 0**
5. **Duplicate Results = 0**
6. **Unattributed Actions = 0**
7. **Simulation Contamination = 0**

---

## 🚀 Developer Setup & Test Execution

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Environment Configuration (`.env`)
```env
# Server & Environment Settings
NODE_ENV=development
DEV_MODE=true

# Database Settings (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ci_ems_db
DB_USER=ci_ems_app_user

# Security Settings
SESSION_SECRET=your-secure-random-secret
```

### Installation & Commands

```bash
# Install dependencies
npm install

# Run Vite local development server
npm run dev

# Execute complete test suite (258 passing tests)
npm test

# Build production bundle
npm run build
```

---

## 📂 Key Source Code Map

```
EMS/
├── src/
│   ├── __tests__/
│   │   └── ci-ems.test.js              # 258 Comprehensive Unit & Integration Tests
│   ├── components/
│   │   ├── dashboards/
│   │   │   ├── AdminDashboard.jsx       # Super Admin Control Center & System Settings
│   │   │   ├── GovernorDashboard.jsx    # Gubernatorial Command & Tally Insights
│   │   │   ├── MPDashboard.jsx          # Parliamentary Constituency War Room
│   │   │   ├── MCADashboard.jsx         # Civic Ward Operational Dashboard
│   │   │   └── StrategyDashboard.jsx    # Campaign Strategy & Department Performance
│   │   ├── modules/
│   │   │   ├── ExecutiveBriefing.jsx    # AI Executive Briefings & Provenance Panel
│   │   │   ├── ScopedLocationSieve.jsx  # Hierarchical Geographic Scope Selector & Sieve
│   │   │   ├── StrategyTeamModule.jsx   # Campaign Department & Org Hierarchy Manager
│   │   │   ├── ParallelTally.jsx        # Configurable Form Results & Discrepancy Engine
│   │   │   ├── ProductionReadinessBoard.jsx # 10 Workstreams & Go/No-Go Decision Gate
│   │   │   ├── SecurityOperations.jsx  # SOC Alerts, Incident Correlation & Audit Ledger
│   │   │   └── FieldOperationsPWA.jsx   # Offline Agent PWA & Mission Center
│   │   └── Navbar.jsx                   # Navigation Header & Mode Selector
│   ├── services/
│   │   ├── authServerEngine.js          # Server Identity & Session Verification
│   │   ├── legallyApprovedRetentionPolicyEngine.js # Legal Evidence Retention Policy Engine
│   │   ├── objectStorageEngine.js       # S3 Storage Adaptor & SHA-256 Immutability
│   │   └── postgresRlsEngine.js         # PostgreSQL Row-Level Security & DDL Generator
│   └── utils/
│       ├── agentCertification.js        # Agent Training & Station Accreditation Status
│       ├── agentMissions.js             # Field Agent Mission Definitions & Task Vectors
│       ├── asvsVerificationMatrix.js    # OWASP ASVS v5.0 Requirement-Level Matrix
│       ├── campaignOrganization.js      # Campaign Hierarchy, Department Maps & Org Trees
│       ├── correlationContext.js        # Transaction Header & Correlation Tracing
│       ├── productionReadinessGate.js   # Readiness Score & Stakeholder Sign-Offs
│       ├── rbac.js                      # RBAC/ABAC Permission Evaluator
│       ├── scopeResolver.js             # Jurisdiction Scope Resolver & Fail-Closed Guard
│       ├── simulationEngine.js          # Load Surge, DR Drill & Dress Rehearsal Engine
│       └── tamperEvidentLedger.js       # SHA-256 Audit Trail Ledger
├── docs/                               # 12 Operational Manuals, Specs & QA Test Guide
│   ├── AGENT_WORKFLOW.md                # Field Agent Operational Protocol
│   ├── APPROVAL_WORKFLOW.md             # Aspirant & Candidate Verification Queue
│   ├── ARCHITECTURE.md                  # System Architecture Specification
│   ├── CAMPAIGN_SYSTEM_MANUAL.md        # Comprehensive System Operations Manual
│   ├── GEOGRAPHIC_MAPPING.md            # Electoral Geography & Scope Sieve Guide
│   ├── MISMATCH_RECONCILIATION.md       # Discrepancy Engine & Legal Affidavits
│   ├── POSTGRES_RLS.md                  # Database Multi-Tenant Isolation (RLS)
│   ├── PRODUCTION_READINESS.md          # 10-Workstream Go/No-Go Decision Gate
│   ├── QA_TESTING_GUIDE.md              # Comprehensive Manual & Automated QA Guide
│   ├── RELEASE_PROVENANCE.md            # Forensic Build Manifest & Release Traceability
│   └── SECURITY_AND_AUDIT.md            # RBAC, 2FA & Tamper-Evident Audit Ledger
├── README.md                           # Technical Architecture & Operations Guide
└── package.json                        # Scripts & Project Dependencies
```

---

## 🛡️ License

Distributed under the MIT License. Built for political campaign strategy, election monitoring, parallel vote tallying, and statutory result evidence verification.
