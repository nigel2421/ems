# 🗳️ Campaign Intelligence & Election Management System (CI-EMS)

> **An enterprise-grade election intelligence, real-time parallel vote counting, Form 34A evidence verification, voter sentiment analytics, and AI-powered campaign strategy platform.**

---

## 📌 Executive Summary

The **Campaign Intelligence & Election Management System (CI-EMS)** is an enterprise-grade platform engineered for political candidates, campaign directors, regional coordinators, strategy teams, and field agents. CI-EMS combines real-time parallel vote tallying with client-side image auto-compression, multi-tiered candidate approval workflows, automated discrepancy detection, survey engine analytics, stakeholder network reach tracking, and **Google Gemini LLM RAG Intelligence**.

---

## 🔥 Key Feature Modules

1. 🛡️ **Role-Based Access Control (RBAC)**: 5 core roles (**Super Admin**, **Strategy Team**, **Regional Coordinator**, **Field Agent**, **Observer / Read Only**) with a live persona switcher.
2. 🏛️ **Polling Station Intelligence**: Tracks Party Advantage Scores, Incumbency Scores, Opposition Strength, Public Perception Ratings, Competitor Activity, and Risk Levels across gazetted polling stations with interactive GIS mapping and CSV bulk import.
3. 👥 **Agent Management**: Station binding, live activity timestamp tracker, submitted report counters, supervisor assignment, and performance rating scores.
4. 📊 **Survey & Polling Engine**: 4 survey types (Anonymous Public, Targeted, Candidate Preference, Issue-Based) and 5 question types with visual survey builder, public share link & SVG QR Code generator, response analytics, and CSV export.
5. 📱 **Field Reporting**: 5 report categories (Mobilization, Campaign, Incident, Opponent Activity, Sentiment) with client-side photo auto-compression (~85% size reduction), thumbnail generator, GPS location tagger, and severity badges.
6. 🌐 **Team Mobilization & Influence Network**: Tracks 7 leader categories (Village Elders, Clergy, Youth, Women, Bodaboda, Business, Community Organizers) with voter reach estimators and activity follow-up logging.
7. 🎯 **Campaign Strategy**: 5-phase roadmap (Announcement, Team Formation, Voter Mobilization, Mass Campaign, GOTV) with phase progress steppers, task action managers, and KPI target cards.
8. 🗳️ **Election Day Operations (Tally Center)**: Candidate vote capture, OCR simulated Form 34A scanner, automatic math discrepancy detection, and supervisor verification workflow.
9. 🤖 **AI Intelligence Assistant (LLM Integration)**: Native Google Gemini 1.5 Flash LLM integration with automatic ground-truth context injection (RAG) for risk ward analysis, voter sentiment summaries, and weekly executive strategy briefings.

---

## 🛠️ Technology Stack & Testing

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) | Modern UI components and high-performance reactive state updates |
| **Build Tooling** | [Vite 8](https://vitejs.dev/) | Lightning-fast HMR and bundle optimization |
| **LLM Engine** | Google Gemini API (`gemini-1.5-flash`) | Generative campaign strategy recommendations & RAG analysis |
| **Test Runner** | Node.js Test Runner (`node --test`) | Native ESM unit & integration test suite |
| **Icons & Design** | [Lucide React](https://lucide.dev/) | Consistent, lightweight vector icons |
| **Data Visualization**| [Chart.js](https://www.chartjs.org/) & `react-chartjs-2` | Interactive voter distribution & turnout analytics |
| **Linting & Quality** | [Oxlint](https://oxc.rs/) | Rust-powered ultra-fast static analysis |
| **Styling** | Vanilla CSS Design System | Custom CSS variables, dark-mode glassmorphism aesthetics |

---

## 🚀 Getting Started & Testing

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

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

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:5173`.

4. **Run Unit & Integration Tests**:
   ```bash
   npm test
   ```
   Runs the test suite in `src/__tests__/ci-ems.test.js` validating LLM API key management, RAG context injection, CSV parser, image compression, OCR simulation, and seed data integrity.

5. **Lint the codebase**:
   ```bash
   npm run lint
   ```

6. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🤖 LLM Setup (Google Gemini API)

1. Get a Gemini API Key from [Google AI Studio](https://aistudio.google.com/).
2. Add your key to `.env`:
   ```env
   VITE_GEMINI_API_KEY=AIzaSy...
   ```
3. Alternatively, click the **API Key** button in the AI Assistant window header to configure your key directly in the UI.

---

## 📖 System Manual & Documentation

- 🗳️ [**Campaign System Manual**](file:///c:/Users/user/Documents/Websites/EMS/docs/CAMPAIGN_SYSTEM_MANUAL.md)
- 🗄️ [**Relational SQL Schema (DDL)**](file:///c:/Users/user/Documents/Websites/EMS/docs/schema.sql)
- 📱 [**Agent Field Operations & Form 34A Upload**](file:///c:/Users/user/Documents/Websites/EMS/docs/AGENT_WORKFLOW.md)
- 🛡️ [**Aspirant & Candidate Approval Workflow**](file:///c:/Users/user/Documents/Websites/EMS/docs/APPROVAL_WORKFLOW.md)
- ⚖️ [**Discrepancy & Mismatch Reconciliation Engine**](file:///c:/Users/user/Documents/Websites/EMS/docs/MISMATCH_RECONCILIATION.md)
- 🗺️ [**Geographic Hierarchy & Agent Deployment**](file:///c:/Users/user/Documents/Websites/EMS/docs/GEOGRAPHIC_MAPPING.md)
- 🔐 [**Security Operations, RBAC & Audit Trails**](file:///c:/Users/user/Documents/Websites/EMS/docs/SECURITY_AND_AUDIT.md)

---

## 🛡️ License & Compliance

Distributed under the MIT License. Built for campaign oversight and public election integrity audit workflows.
