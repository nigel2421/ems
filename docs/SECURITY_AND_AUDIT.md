# 🔐 Security Operations, RBAC & Audit Log Architecture

This document describes the security model, role-based access controls (RBAC), two-factor authentication (2FA) simulation, and audit logging system in the **Election Management System (EMS)**.

---

## 🛡️ Security Architecture Overview

```
[ User Request / Persona Switch ]
              │
              ▼
    ┌──────────────────┐
    │  AuthContext     │
    │  - Role Hierarchy│
    │  - 2FA Check     │
    └─────────┬────────┘
              │
    Is Permission Granted?
       ├── NO  ──► [ Access Denied / 2FA Prompt ]
       └── YES ──► [ Render Authorized View ]
                        │
                        ▼
            ┌──────────────────────┐
            │  DataContext         │
            │  - logAuditAction()  │
            └──────────┬───────────┘
                       │
                       ▼
            [ Write to Audit Log & LocalStorage ]
```

---

## 👥 Role Hierarchy & Permission Matrix

EMS implements a strict numeric role rank system:

```javascript
export const ROLE_HIERARCHY = {
  Admin: 10,
  Governor: 7,
  Senator: 7,
  MP: 5,
  MCA: 4,
  Aspirant: 3,
  Agent: 2
};
```

### Permission Helper
The helper function `hasPermission(requiredRole)` compares the logged-in user's rank against the required rank. System **Admin** (rank 10) implicitly satisfies all permission queries.

---

## 🔑 Two-Factor Authentication (2FA) Verification

- Certain sensitive actions (e.g. approving Form 34A evidence, assigning agents, exporting full legal audit reports) require an active 2FA session.
- System users have `twoFactorEnabled: true` in mock profiles.
- When switching users or performing privileged actions, EMS prompts for 2FA verification.
- System administrators can toggle 2FA verification status via the top navigation bar menu.

---

## 📜 Audit Log Viewer (`AuditLogViewer.jsx`)

Every critical system event is logged automatically by `logAuditAction(user, action, details)`.

### Logged Attributes
- **Log ID**: Unique identifier (`LOG-XXXXXX`).
- **Timestamp**: ISO 8601 UTC timestamp.
- **User Info**: User ID, Name, and Role.
- **IP Address**: Client network address (`192.168.x.x`).
- **Action Type**: Event classification token (e.g., `EVIDENCE_SUBMISSION`, `SUBMISSION_APPROVED`, `MISMATCH_DETECTED`, `AGENT_ASSIGNMENT`).
- **Details**: Full human-readable context text.

### Key Audited Events
| Action Event Token | Trigger Condition | Severity |
| :--- | :--- | :--- |
| `EVIDENCE_SUBMISSION` | Agent submits Form 34A evidence and tallies | Normal |
| `SUBMISSION_MISMATCH_FLAGGED` | Agent upload differs from official IEBC stream | **High / Warning** |
| `MISMATCH_DETECTED` | Automated validator flags vote discrepancy | **Critical** |
| `SUBMISSION_APPROVED` | Aspirant approves agent Form 34A upload | Normal |
| `SUBMISSION_REJECTED` | Aspirant rejects agent upload with comment | **Warning** |
| `AGENT_ASSIGNMENT` | Admin re-assigns agent to polling station | Sensitive |

### Search & Export Features
- **Search Filter**: Live text filtering across Action names, User Names, or Detail text.
- **Role Filter**: Filter logs by role (*Admin*, *Governor*, *Agent*, *System*).
- **CSV Export**: Downloads a formatted `.csv` audit file for compliance archives.

---

## 💾 State Persistence & Storage Security

All application state is automatically saved to client-side `localStorage`:
- `ems_geography`: Polling station & agent map state.
- `ems_submissions`: Form 34A submissions & approval statuses.
- `ems_broadcasts`: Official IEBC stream records.
- `ems_audit_logs`: Audit log trail history.
- `ems_agent_draft_{id}`: Agent offline draft state.

> **Production Recommendation**: When deploying to production, replace `localStorage` with an encrypted backend database (e.g., PostgreSQL with PostGIS, AWS Aurora, or GCP Cloud Spanner) backed by REST/GraphQL APIs with TLS 1.3 encryption.
