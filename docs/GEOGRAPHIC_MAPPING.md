# 🗺️ Geographic Hierarchy & Agent Deployment Mapping

This document details the administrative boundary structure and agent assignment system within the **Election Management System (EMS)**.

---

## 🎯 Architectural Hierarchy

EMS structures electoral data across four nested administrative levels:

```
County (C047 - Nairobi)
└── Constituency (C-01 Westlands, C-02 Kibra, etc.)
    └── Ward (W-01 Kitisuru, W-02 Parklands, etc.)
        └── Polling Station (PS-001 St. Andrew's, PS-002 Westlands Primary, etc.)
```

---

## 📊 Data Entities & Relationships

| Entity | Attributes | Description |
| :--- | :--- | :--- |
| **County** | `id`, `name`, `code` | Top-level administrative unit (e.g. *County 047 - Nairobi*). |
| **Constituency** | `id`, `countyId`, `name`, `registeredVoters` | Electoral boundary represented by a Member of Parliament (MP). |
| **Ward** | `id`, `constituencyId`, `name` | Civic electoral boundary represented by a Member of County Assembly (MCA). |
| **Polling Station** | `id`, `wardId`, `name`, `code`, `registeredVoters`, `agentAssigned` | Granular location where ballots are cast and Form 34A is generated. |

---

## 🛠️ Operating the Geographic Mapper

### 1. Navigating Administrative Levels
- Launch **Geographic Mapper** from the main navigation header or Admin/Governor dashboards.
- Select a **Constituency** tab (e.g. *Westlands*) to view all component Wards and Polling Stations.
- Visual statistics instantly update:
  - **Total Polling Stations** in boundary.
  - **Agent Coverage Percentage** (% of stations with active agents assigned).
  - **Total Registered Voters**.
  - **Voter Turnout & Submission Rate**.

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
- **Form 34A Transmission Progress**: Radial ring indicator showing percentage of completed uploads.
