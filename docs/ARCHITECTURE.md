# 🏛️ CI-EMS 3.1 System Architecture Document

## Overview

The **Campaign Intelligence & Election Management System (CI-EMS 3.1)** is a production-oriented election operations platform designed for political campaign headquarters, tallying centers, and field agents.

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
  - Registered Device Binding                                     - Universal Operational Cases & Shift Handovers
  - Agent Accreditation & Training                                - Production Readiness Board & Go/No-Go Gate
```

## Operating Lifecycles

1. **PRE-ELECTION**: Voter sentiment aggregation, issue surveys, mobilization network mapping.
2. **READINESS**: Agent accreditation, training, station logistics, supervisory command assignment.
3. **ELECTION DAY**: Field PWA reporting, command center incident resolution, evidence vault verification, parallel vote tallying.
4. **POST-ELECTION**: Three-source result reconciliation, legal petition defense, audit ledger preservation, data lifecycle review.

## Key Architectural Principles

- **Server-Derived Context**: Political positions do NOT grant security roles. Permissions evaluate against server-derived ABAC/RBAC roles.
- **Versioned Electoral Geography**: Supports IEBC gazette updates without code changes.
- **Idempotent At-Most-One Record Creation**: Client synchronization retries return original ACKs without creating duplicate records (`One idempotency_key -> At most one accepted domain mutation`).
- **Degraded-Safe Tier 0 Semantics**: Core evidence transmission survives upstream service disruptions safely.
