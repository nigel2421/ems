# 🗳️ Campaign Intelligence & Election Management System (CI-EMS) System Manual

This document provides a comprehensive operational guide for the extended **Campaign Intelligence & Election Management System (CI-EMS)**.

---

## 🏛️ System Overview

The CI-EMS platform is built to deliver real-time election monitoring, voter intelligence, agent management, survey analytics, stakeholder mobilization, campaign strategy tracking, and election day tally verification with AI-assisted strategic insights.

---

## 👥 Roles & Role-Based Access Control (RBAC)

The system enforces 5 primary roles:

1. **Super Admin (Rank 10)**
   - System configuration, user provisioning, gazetted polling station CSV imports, bulk updates, full audit trail access.
2. **Strategy Team (Rank 8)**
   - Executive war room dashboard, AI strategy assistant access, voter sentiment & survey analytics, 5-phase campaign plan management.
3. **Regional Coordinator (Rank 6)**
   - Regional agent assignment, activity monitoring, regional polling station intelligence map, Form 34A tally sign-off queue.
4. **Field Agent (Rank 4)**
   - Mobile terminal access to submit field reports with auto-photo compression (~85% reduced payload), complete targeted surveys, log stakeholder meetings, and transmit election day Form 34A tallies.
5. **Observer (Rank 2)**
   - Read-only access to public analytics dashboards, live tally totals, survey summaries, and election monitoring streams.

---

## 🚀 Key Modules & Capabilities

### 1. Polling Station Intelligence Module
- **Fields**: Name, Code, County, Constituency, Ward, Village, GPS Coordinates, Registered Voters, Active Voters, Historical Turnout %.
- **Intelligence Fields**: Party Advantage Score, Incumbency Score, Opposition Strength, Public Perception Rating, Competitor Activity Level, Strategic Importance, Risk Level.
- **Features**: Multi-criteria search, risk level filters, interactive GIS mapping canvas, CSV bulk importer, and mass update tools.

### 2. Agent Management Module
- **Model**: Full Name, Phone Number, Region, Assigned Polling Stations, Supervisor, Status, Performance Rating (1-5 Stars).
- **Features**: Polling station binding, live activity timestamp tracker, submitted report counters, and supervisor assignment.

### 3. Survey & Polling Engine
- **Survey Types**: Anonymous Public Survey, Targeted Survey, Candidate Preference Poll, Issue-Based Survey.
- **Question Types**: Single Choice, Multi Choice, Text, Rating, Number.
- **Features**: Visual survey builder, public share link & SVG QR Code generator, response collector, response analytics, and CSV export.

### 4. Field Reporting Module
- **Report Types**: Mobilization Reports, Campaign Reports, Incident Reports, Opponent Activity Reports, Community Sentiment Reports.
- **Features**: Client-side photo auto-compression engine (reduces camera images from ~4MB down to ~300KB), thumbnail generator, GPS location tagger, severity badges (Low, Medium, High, Critical), and centralized feed.

### 5. Team Mobilization & Stakeholder Network
- **Categories**: Village Elders, Clergy, Youth Mobilizers, Women Leaders, Bodaboda Leaders, Business Leaders, Community Organizers.
- **Tracking**: Influence rating (1-10), voter reach estimator, assigned coordinator, and activity follow-up logger.

### 6. Campaign Strategy Module
- **5 Phases**:
  1. Announcement & Groundwork
  2. Team Formation & Agent Binding
  3. Voter Mobilization & Stakeholder Network
  4. Mass Campaign & Media Blitz
  5. GOTV (Get Out The Vote) & Tally Operations
- **Features**: Phase progress stepper, task action manager, KPI target tracking cards.

### 7. Election Day Operations (Tally Center)
- **Vote Capture**: Candidate A, Candidate B, Candidate C, Rejected Ballots, Total Cast.
- **Validation**: Automatic math sum check and registered voters ceiling check.
- **Evidence**: Form 34A photo upload, simulated OCR extraction reader, discrepancy mismatch flagging, and supervisor verification workflow.

### 8. AI Intelligence Assistant
- **Capabilities**: Summarizes field reports, flags high-risk wards, tracks top voter concerns, identifies underperforming agents, and generates executive weekly strategy briefings.

---

## 🗄️ Database Architecture & APIs

- **Database DDL**: Defined in [`docs/schema.sql`](file:///c:/Users/user/Documents/Websites/EMS/docs/schema.sql).
- **API Service Layer**: Implemented in [`src/services/api.js`](file:///c:/Users/user/Documents/Websites/EMS/src/services/api.js).
- **LLM Service Engine**: Implemented in [`src/services/llmService.js`](file:///c:/Users/user/Documents/Websites/EMS/src/services/llmService.js) supporting Google Gemini API & local RAG context injection.
- **Data Context Store**: Centralized in [`src/context/DataContext.jsx`](file:///c:/Users/user/Documents/Websites/EMS/src/context/DataContext.jsx) with `localStorage` persistence.

---

## 🤖 LLM (Large Language Model) Integration Guide

The CI-EMS application features native support for Large Language Models (LLM) through Google Gemini 1.5 Flash API or compatible REST endpoints.

### How it Works (RAG Architecture):
1. **Context Injection**: Whenever a query is sent to the AI Assistant, live ground-truth metrics (polling station risk scores, severe incident reports, voter survey totals, stakeholder network reach, and live tally returns) are automatically extracted from `DataContext` and formatted into a system prompt.
2. **Generative Intelligence**: The system prompt + user query is transmitted to the Google Gemini API (`gemini-1.5-flash`), producing real-time strategic recommendations.
3. **API Key Setup Options**:
   - **Environment Variable**: Add `VITE_GEMINI_API_KEY=your_key_here` to the `.env` file.
   - **UI Key Configurator**: Click the **API Key** button in the AI Assistant header modal to paste or update your key at runtime (persisted in browser `localStorage`).
   - **Fallback Engine**: If no API key is provided, the AI Assistant seamlessly switches to an internal campaign intelligence rule engine.

