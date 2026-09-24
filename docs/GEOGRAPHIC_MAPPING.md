# 🗺️ Geographic Hierarchy, Scope Sieve & Agent Deployment Mapping

This document details the administrative boundary structure, candidate scope locking, and agent assignment system within the **Election Management System (CI-EMS 3.1)**.

---

## 🎯 Architectural Hierarchy

EMS structures electoral data across five nested administrative levels:

```
County (e.g. C047 - Nairobi)
└── Constituency (e.g. C-01 Westlands, C-02 Kibra)
    └── Ward (e.g. W-01 Kitisuru, W-02 Parklands)
        └── Polling Centre (e.g. PC-0101 St. Andrew's Church)
            └── Polling Station / Stream (e.g. Stream 01, Stream 02)
```

---

## 📊 Data Entities & Relationships

| Entity | Attributes | Description |
| :--- | :--- | :--- |
| **County** | `id`, `name`, `code` | Top-level administrative unit (e.g. *County 047 - Nairobi*). |
| **Constituency** | `id`, `countyId`, `name`, `registeredVoters` | Electoral boundary represented by a Member of Parliament (MP). |
| **Ward** | `id`, `constituencyId`, `name` | Civic electoral boundary represented by a Member of County Assembly (MCA). |
| **Polling Centre** | `id`, `wardId`, `name`, `code` | Physical facility containing one or more polling station streams. |
| **Polling Station / Stream** | `id`, `centreId`, `wardId`, `name`, `code`, `registeredVoters`, `agentAssigned` | Granular stream where ballots are cast and Form 34A/35A/39A is generated. |

---

## 🔍 Scoped Location Sieve (`ScopedLocationSieve.jsx`)

The **Scoped Location Sieve** provides an interactive, role-restricted location selector across all dashboards and analytical modules:

```
                               SCOPED LOCATION SIEVE
 ┌────────────────┐      ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
 │     COUNTY     │ ───► │  CONSTITUENCY  │ ───► │      WARD      │ ───► │ POLLING CENTRE │
 └────────────────┘      └────────────────┘      └────────────────┘      └────────────────┘
```

### Key UI Invariants:
1. **Cascade State Clearing**: Changing a parent selection (e.g., switching Constituency) automatically clears lower selections (Ward, Polling Centre, Stream) to maintain strict data hierarchy validity.
2. **Disabled Selector Locking**: Selectors above a user's authorized root level are disabled or hidden to prevent out-of-scope selection.

---

## 🔒 Jurisdiction Scope Resolver & Root Locking (`scopeResolver.js`)

CI-EMS enforces strict root scope locking based on candidate position or coordinator assignment:

| User Persona / Role | Authorized Scope Root | Sieve Starting Level | Restricted Scope Boundaries |
| :--- | :--- | :--- | :--- |
| **Presidential Admin** | `NATIONAL` | County | Unrestricted across all 47 counties. |
| **Governor Candidate** | `COUNTY` | Constituency | Locked to assigned County (e.g. Nairobi). Cannot select other counties. |
| **MP Candidate** | `CONSTITUENCY` | Ward | Locked to assigned Constituency (e.g. Westlands). Cannot select County or other constituencies. |
| **MCA Candidate** | `WARD` | Polling Centre | Locked to assigned Ward (e.g. Kitisuru). Cannot select County, Constituency, or other wards. |
| **Ward Coordinator** | `WARD` | Polling Station | Locked to assigned Ward. Effective scope overrides broader candidate roles. |

---

## 🛡️ Server-Side Scope Tamper Defense & Audit Enforcement

In addition to client-side UI locking, the server layer independently validates all incoming transaction parameters:

1. **Tamper Interception**: Manipulated `county_id`, `constituency_id`, or `ward_id` parameters sent via API requests are caught and rejected server-side.
2. **Fail-Closed Default**: Any request lacking explicit jurisdiction authorization or attempting cross-jurisdiction data access returns `403 Forbidden` / `SCOPE_DENIED`.
3. **Audit Ledger Logging**: Every out-of-scope request automatically logs a security audit event (`OUT_OF_SCOPE_GEOGRAPHY_ACCESS_DENIED`) containing user ID, attempted scope, and client IP.

---

## 🛠️ Operating the Geographic Mapper

### 1. Navigating Administrative Levels
- Launch **Geographic Mapper** from the main navigation header or Admin/Governor dashboards.
- Select a **Constituency** tab (e.g. *Westlands*) to view all component Wards and Polling Stations.
- Visual statistics update in real-time:
  - **Total Polling Stations** in boundary.
  - **Agent Coverage Percentage** (% of stations with active agents assigned).
  - **Total Registered Voters**.
  - **Voter Turnout & Statutory Form Submission Rate**.

### 2. Admin Agent Assignment Matrix
Administrators can re-assign polling station agents in real time:
1. In the **Geographic Mapper** table, select an unassigned or active polling station.
2. Select an agent from the dropdown roster.
3. Click **Assign Agent**.
4. The system executes `assignAgentToPollingStation(agentId, stationId, user)`:
   - Updates `geography.pollingStations` state.
   - Saves assignment state to `localStorage`.
   - Writes event `AGENT_ASSIGNMENT` to the immutable audit log.

---

## 📈 Visual Heatmaps & Analytics

Dashboards render dynamic charts (powered by `Chart.js` / `react-chartjs-2`):
- **Candidate Lead Distribution**: Doughnut/Bar breakdown of votes by candidate.
- **Turnout Percentage by Constituency**: Comparative bar chart of voter turnout across regions.
- **Statutory Form Transmission Progress**: Radial ring indicator showing percentage of completed uploads.
