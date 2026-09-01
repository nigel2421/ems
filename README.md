# 🗳️ Election Management System (EMS)

> **A real-time, tamper-evident parallel vote tallying, Form 34A evidence verification, and electoral fraud detection platform.**

---

## 📌 Executive Summary

The **Election Management System (EMS)** is an enterprise-grade web application engineered for candidates, election agents, and campaign teams. EMS facilitates real-time parallel vote counting, digital Form 34A photo evidence ingestion with client-side image auto-compression, multi-tiered candidate approval workflows, automated discrepancy/mismatch detection against official electoral body (e.g., IEBC) broadcasts, and cryptographic audit trail logging.

Designed specifically to handle high-stakes multi-tier elections (Gubernatorial, Senatorial, Parliamentary, Civic/MCA, and Presidential), EMS provides comprehensive geographical visibility down to individual polling stations.

---

## 🔥 Key Features

- 📱 **Agent Mobile Terminal**: Polling station agents capture physical Form 34A camera evidence, trigger client-side auto-compression (~89% size reduction for low-bandwidth cellular uplink), tag verified GPS coordinates, and submit vote tallies.
- 💾 **Offline Draft Persistence**: Auto-saves form progress locally to prevent data loss in remote areas with unstable connectivity.
- ⚖️ **Automated Mismatch & Discrepancy Engine**: Cross-references parallel agent tallies against official public streams in real-time. Immediately flags candidate vote count variances and illegal vote inflation.
- 🛡️ **Multi-Tier Approval Workflow**: Aspirants and campaign managers perform side-by-side visual audits of uploaded Form 34A carbon copies against tally figures before locking submissions.
- 🗺️ **Interactive Geographic Mapper**: Drill down across regional administrative hierarchies (**County → Constituency → Ward → Polling Station**), monitoring agent coverage density and live turnout heatmaps.
- 📜 **Immutable Audit Trail Viewer**: Full log of system actions, IP addresses, timestamped state transitions, 2FA status, and automated engine alerts with CSV export capabilities.
- 📄 **PDF Petition & Audit Report Generator**: Exports presentation-ready, legally format-compliant audit reports and mismatch dispute summaries powered by `jsPDF` and `html2canvas`.
- 🔐 **Simulated 2FA & Role-Based Access Control (RBAC)**: Enforces granular permission boundaries and quick user persona switching for rapid administrative oversight and field testing.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) | Modern UI components and high-performance reactive state updates |
| **Build Tooling** | [Vite 8](https://vitejs.dev/) | Lightning-fast HMR and bundle optimization |
| **Icons & Design** | [Lucide React](https://lucide.dev/) | Consistent, lightweight vector icons |
| **Data Visualization**| [Chart.js](https://www.chartjs.org/) & `react-chartjs-2` | Interactive voter distribution & turnout analytics |
| **PDF Export Engine** | [jsPDF](https://github.com/parallax/jsPDF) & `html2canvas` | High-fidelity client-side PDF document generation |
| **Linting & Quality** | [Oxlint](https://oxc.rs/) | Rust-powered ultra-fast static analysis |
| **Styling** | Vanilla CSS Design System | Custom CSS variables, dark-mode glassmorphism aesthetics |

---

## 👥 Role-Based Access Control (RBAC)

EMS supports 7 hierarchical user personas with tailored dashboards and operational boundaries:

| Role | Rank | Primary Responsibilities & Dashboard View |
| :--- | :---: | :--- |
| **Admin** | 10 | Complete platform control, agent deployment assignments, global system settings, full audit log access. |
| **Governor** | 7 | High-level county-wide tally aggregation, constituency breakdown, total turnout heatmaps, legal team dispute tracking. |
| **Senator** | 7 | County-wide overview, parallel vote count verification, inter-constituency discrepancy monitoring. |
| **MP** | 5 | Constituency-level breakdown across all constituent Wards, agent verification status, candidate tally lead metrics. |
| **MCA** | 4 | Ward-level granular view, local polling station agent monitoring, civic seat vote counts. |
| **Aspirant** | 3 | Direct approval queue for agent Form 34A submissions, verification note entry, rejection/sign-off controls. |
| **Agent** | 2 | Polling station field operator interface: image capture, auto-compression, tally entry, and submission to Aspirant. |

---

## 📂 Project Structure

```
EMS/
├── public/                    # Static assets & favicon
├── src/
│   ├── assets/                # App icons and media assets
│   ├── components/
│   │   ├── dashboards/        # Role-specific dashboard views
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AgentPortal.jsx
│   │   │   ├── AspirantDashboard.jsx
│   │   │   ├── GovernorDashboard.jsx
│   │   │   ├── MCADashboard.jsx
│   │   │   └── MPDashboard.jsx
│   │   ├── modules/           # Reusable feature modals & utilities
│   │   │   ├── ApprovalWorkflowModal.jsx
│   │   │   ├── AuditLogViewer.jsx
│   │   │   ├── GeographicMapper.jsx
│   │   │   ├── MismatchDetector.jsx
│   │   │   └── PdfReportGenerator.jsx
│   │   └── Navbar.jsx         # Global top navigation & persona switcher
│   ├── context/
│   │   ├── AuthContext.jsx    # User session, role hierarchy, 2FA status
│   │   └── DataContext.jsx    # Central data state, audit logging, mismatch analyzer
│   ├── data/
│   │   └── mockData.js        # Initial geography, users, tallies, and broadcast feeds
│   ├── App.css                # Base layout rules & utilities
│   ├── App.jsx                # Main routing and global state container
│   ├── index.css              # Custom design system tokens & glassmorphism theme
│   └── main.jsx               # React DOM root entry point
├── docs/                      # Comprehensive operational documentation
│   ├── AGENT_WORKFLOW.md
│   ├── APPROVAL_WORKFLOW.md
│   ├── MISMATCH_RECONCILIATION.md
│   ├── GEOGRAPHIC_MAPPING.md
│   └── SECURITY_AND_AUDIT.md
├── index.html                 # HTML shell
├── package.json               # NPM scripts and dependencies
├── vite.config.js             # Vite configuration
└── README.md                  # Project overview documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or `pnpm` / `yarn`)

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone git@github.com:nigel2421/ems.git
   cd ems
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

4. **Lint the codebase**:
   ```bash
   npm run lint
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```
   The production-ready assets will be compiled into the `dist/` directory.

---

## 📖 Operational Documentation

For detailed step-by-step guides on operating key modules in EMS, refer to the documentation files in the `docs/` directory:

- 📱 [**Agent Field Operations & Form 34A Upload**](file:///c:/Users/user/Documents/Websites/EMS/docs/AGENT_WORKFLOW.md)
- 🛡️ [**Aspirant & Candidate Approval Workflow**](file:///c:/Users/user/Documents/Websites/EMS/docs/APPROVAL_WORKFLOW.md)
- ⚖️ [**Discrepancy & Mismatch Reconciliation Engine**](file:///c:/Users/user/Documents/Websites/EMS/docs/MISMATCH_RECONCILIATION.md)
- 🗺️ [**Geographic Hierarchy & Agent Deployment**](file:///c:/Users/user/Documents/Websites/EMS/docs/GEOGRAPHIC_MAPPING.md)
- 🔐 [**Security Operations, RBAC & Audit Trails**](file:///c:/Users/user/Documents/Websites/EMS/docs/SECURITY_AND_AUDIT.md)

---

## 🛡️ License & Compliance

Distributed under the MIT License. See `LICENSE` for more information. Built for internal campaign oversight and public election integrity audit workflows.
