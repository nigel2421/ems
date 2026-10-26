# 🧪 Quality Assurance (QA) & System Verification Testing Guide

> **Campaign Intelligence & Election Management System (CI-EMS 3.1)**  
> **Target Audience:** QA Engineers, Software Testers, Election Operations Auditors, and Security Lead Reviewers.

---

## 📌 Executive Summary & QA Invariants

This guide defines the Quality Assurance verification protocols for **CI-EMS 3.1**. All release candidates must pass automated test validation (258/258 tests) and satisfy manual verification criteria across all 4 election operating lifecycles.

### 🚫 7 Zero-Tolerance Quality Invariants
Any failure in the following invariants blocks deployment immediately (`NO_GO`):
1. **Data Loss = 0**: Zero loss of statutory vote payloads or evidence hashes.
2. **Silent Overwrites = 0**: Zero unversioned or un-audited overwrites of tally records.
3. **Unauthorized Cross-Tenant Access = 0**: Zero database or API leaks across tenant IDs.
4. **Unauthorized Cross-Jurisdiction Access = 0**: Zero unauthorized access outside assigned geographic scope (e.g. Nairobi Governor viewing Mombasa data).
5. **Duplicate Results = 0**: Duplicate sync attempts return original server ACK without creating duplicate database rows.
6. **Unattributed Actions = 0**: 100% of state mutations write to the SHA-256 audit ledger with user context and timestamp.
7. **Simulation Contamination = 0**: Rehearsal and load simulation data must remain completely isolated from live election records.

---

## ⚡ 1. Automated Test Suite Execution (`npm test`)

CI-EMS includes **258 comprehensive automated unit and integration tests** located in [`src/__tests__/ci-ems.test.js`](file:///c:/Users/user/Documents/Websites/EMS/src/__tests__/ci-ems.test.js).

### Executing Automated Tests

```bash
# Run complete test suite (258 tests)
npm test

# Run tests in watch mode during development
npx vite test --watch

# Execute specific test domain (e.g., PostgreSQL RLS tests)
npx vite test -t "postgres"
```

### Key Automated Test Coverage Domains

| Test Domain | Test Assertion Range | Key Capabilities Verified |
| :--- | :--- | :--- |
| **PostgreSQL RLS & Multi-Tenancy** | Tests 1 - 35, 188 | `FORCE ROW LEVEL SECURITY`, tenant isolation policy, default-deny, application role privilege hygiene (`NOSUPERUSER`, `NOBYPASSRLS`). |
| **S3 Storage & SHA-256 Immutability** | Tests 36 - 60, 184-185 | Binary content hashing, corruption detection (`CRITICAL CORRUPTION: Hash Mismatch`), legal retention policy attachment. |
| **RBAC / ABAC Security & 2FA** | Tests 61 - 90, 176, 186-187 | Role hierarchy enforcement (Admin -> Governor -> MP -> MCA -> Agent), 2FA session verification, OWASP ASVS v5.0 matrix compliance. |
| **Geographic Scope Sieve & Locking** | Tests 221 - 240 | Scoped location sieve cascade, candidate root locking (Governor locked to County, MP locked to Constituency, MCA locked to Ward), server-side tamper rejection. |
| **Strategy & Campaign Organization** | Tests 241 - 260 | Strategy team auto-provisioning, department role mapping, department org tree resolution, strategy task status transitions. |
| **Simulation, DR & Queue Recovery** | Tests 189 - 193, 208 | High-throughput load surge (10,000 requests), worker crash recovery, active-standby database failover (RPO=0, RTO < 5s). |
| **Production Readiness Gate** | Tests 172 - 175, 192-195 | 10 workstreams evaluation, 5-stakeholder sign-off maker-checker requirements, automatic blocker enforcement. |

---

## 📋 2. Manual QA Test Execution Matrix

QA engineers must execute manual end-to-end verification across the primary operational roles:

### Test Suite A: Super Admin Control Center (`AdminDashboard.jsx`)
1. **User Provisioning & Role Assignment**:
   - Action: Navigate to Admin Dashboard -> User Management. Create a new user with role `Regional Coordinator`.
   - Expected Result: User is assigned rank 6; audit log records `USER_PROVISIONED`.
2. **Gazetted Polling Station CSV Importer**:
   - Action: Upload IEBC polling station extract CSV file.
   - Expected Result: Validates station codes, ward IDs, and registered voter counts; populates geography state.
3. **Audit Log Inspection**:
   - Action: Open `AuditLogViewer.jsx`. Filter logs by action `AGENT_ASSIGNMENT`. Export CSV.
   - Expected Result: Returns filtered logs; downloaded CSV contains valid headers and timestamps.

---

### Test Suite B: Candidate Command War Rooms (`GovernorDashboard.jsx`, `MPDashboard.jsx`, `MCADashboard.jsx`)
1. **Governor Scope Locking (Nairobi County)**:
   - Action: Log in as Nairobi Governor. Open `ScopedLocationSieve.jsx`.
   - Expected Result: County dropdown is locked to `County 047 - Nairobi` (cannot select Mombasa or Nakuru). Sieve starting level begins at Constituency.
2. **MP Scope Locking (Westlands Constituency)**:
   - Action: Log in as Westlands MP. Inspect `ScopedLocationSieve.jsx`.
   - Expected Result: County & Constituency dropdowns are locked. Sieve starting level begins at Ward (`Kitisuru`, `Parklands`, `Karura`).
3. **MCA Scope Locking (Kitisuru Ward)**:
   - Action: Log in as Kitisuru MCA.
   - Expected Result: Locked to Kitisuru Ward. Starts at Polling Centre level (`St. Andrew's Church Hall`).

---

### Test Suite C: Field Agent Mobile PWA (`AgentPortal.jsx` & `FieldOperationsPWA.jsx`)
1. **Accreditation & Readiness Checklist**:
   - Action: Select Field Agent persona. Verify accreditation badge indicator. Complete Station Readiness Checklist (Battery, Network, Forms).
   - Expected Result: Status changes to `DEPLOYED_AT_STATION`.
2. **Form 34A Camera Upload & Compression**:
   - Action: Capture sample Form 34A photo (~4 MB).
   - Expected Result: Client-side compressor reduces file size by **~89%** (~400 KB). Displays SHA-256 hash preview and GPS coordinates.
3. **Offline Sync Queue Verification**:
   - Action: Toggle browser offline (DevTools Network -> Offline). Submit vote tallies.
   - Expected Result: Payload saved to local offline draft queue (`ems_agent_draft_{id}`).
   - Action: Toggle browser online.
   - Expected Result: Offline queue automatically flushes; server returns single ACK without duplicating record.

---

### Test Suite D: Aspirant Verification & Mismatch Engine (`AspirantDashboard.jsx` & `MismatchDetector.jsx`)
1. **Side-by-Side Evidence Inspection**:
   - Action: Open Aspirant Verification Queue. Click **Review & Verify** on a pending Form 34A submission.
   - Expected Result: Displays `ApprovalWorkflowModal` showing Form 34A image thumbnail on left and entered tally numbers on right.
2. **Approval Sign-Off**:
   - Action: Click **Approve Form 34A**.
   - Expected Result: Submission status updates to `Approved`; vote tallies index into parallel county totals; audit log records `SUBMISSION_APPROVED`.
3. **Discrepancy Flagging & Legal PDF Generation**:
   - Action: Open `MismatchDetector.jsx`. Select a station where Agent Tally differs from IEBC Broadcast feed. Click **Generate Dispute PDF Report**.
   - Expected Result: Generates downloadable court-admissible PDF petition containing evidence photos, delta calculations, and sign-off blocks.

---

## 🔒 3. Security & Boundary QA Test Scenarios

### Scenario 1: Scope Tampering Interception
- **Procedure**: Using browser Developer Tools or API test client, send a POST request to save polling station tally with `ward_id` set to a ward outside the candidate's authorized constituency.
- **Pass Criteria**: Server rejects request with `403 Forbidden` (`SCOPE_DENIED`); security audit ledger records `OUT_OF_SCOPE_GEOGRAPHY_ACCESS_DENIED`.

### Scenario 2: S3 Evidence Tampering Detection
- **Procedure**: Modify binary payload of an existing evidence image stored in object storage. Trigger evidence re-verification.
- **Pass Criteria**: `objectStorageEngine.js` flags payload as `CRITICAL CORRUPTION: Hash Mismatch` and disables legal approval.

### Scenario 3: Break-Glass Device Recovery
- **Procedure**: In Admin Dashboard, trigger Break-Glass Device Recovery for an agent's lost phone.
- **Pass Criteria**: Revokes old device token (`REVOKED`); binds new replacement hardware fingerprint; preserves existing submission audit trail.

---

## ✅ 4. QA Release Acceptance Checklist

Before declaring a release build ready for Production Sign-Off, complete the following verification checklist:

- [ ] **Automated Tests**: 258/258 tests passing cleanly (`npm test`).
- [ ] **Build Verification**: `npm run build` completes with 0 compilation errors.
- [ ] **RLS Verification**: All 10 PostgreSQL tables enforce `FORCE ROW LEVEL SECURITY`.
- [ ] **ASVS Verification**: OWASP ASVS v5.0 requirement matrix verified.
- [ ] **Scope Sieve**: Candidate jurisdiction locking verified across Governor, MP, MCA, and Ward Coordinators.
- [ ] **Offline PWA**: Idempotent offline submission & auto-flush verified.
- [ ] **Evidence Integrity**: SHA-256 evidence hashing and PDF petition generation verified.
- [ ] **Release Provenance**: Build manifest contains all 12 mandatory provenance attributes.
- [ ] **Go/No-Go Gate**: Overall score $\ge 90\%$ with sign-offs from CTO, CISO, Ops Director, DPO, and Campaign Director.
