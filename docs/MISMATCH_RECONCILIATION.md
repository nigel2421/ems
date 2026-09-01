# ⚖️ Discrepancy & Mismatch Reconciliation Engine

This document details the algorithm, audit mechanisms, and legal report generation features of the **Mismatch Detector Engine** within the **Election Management System (EMS)**.

---

## 🎯 Purpose

In high-stakes national and regional elections, official public broadcast feeds (e.g., IEBC public portals) may occasionally display vote numbers that conflict with the physical Form 34A documents collected by agents at polling stations.

The **EMS Mismatch Engine** continuously monitors parallel agent submissions against public broadcast data, automatically identifying vote inflation, vote suppression, or clerical errors.

---

## ⚡ How the Engine Works

```
   +------------------------------+       +------------------------------+
   |   Parallel Field Agent       |       |  Official IEBC Stream /      |
   |   Form 34A Tally Submission  |       |  Public Broadcast Feed       |
   +--------------+---------------+       +--------------+---------------+
                  |                                      |
                  +------------------+-------------------+
                                     |
                                     v
                       +---------------------------+
                       |  EMS Mismatch Engine      |
                       |  analyzeMismatch()        |
                       +-------------+-------------+
                                     |
                                     v
                  +------------------+-------------------+
                  |                                      |
       [No Variance Detected]                 [Variance Flagged!]
                  |                                      |
                  v                                      v
       Status: "Submitted"                    Status: "Mismatch"
       Log: Standard Receipt                  Log: CRITICAL_ALERT
                                              Trigger Modal Banner &
                                              Enable PDF Petition Export
```

---

## 🔍 Variance Analysis Logic

When an agent submits tallies for a polling station, the engine executes `analyzeMismatch(submission)`:

1. **Station Lookup**: Retrieves the corresponding station record from `iebcOfficialBroadcasts`.
2. **Category Comparison**:
   - Compares **Presidential Candidate A** (Agent vs IEBC).
   - Compares **Gubernatorial Candidates** (Sakaja / Igathe).
   - Compares **Parliamentary Candidates** (Wanyonyi / Havi).
3. **Discrepancy Calculation**:
   $$\text{Variance} = \text{Tally}_{\text{Agent}} - \text{Tally}_{\text{IEBC}}$$
4. **Automated Alert Generation**:
   - If $\text{Variance} \neq 0$, the submission status is immediately set to `Mismatch`.
   - An automated audit log entry is generated:
     `MISMATCH_DETECTED: FLAGGED DISCREPANCY on Westlands Primary School: Variance of MP Candidate (Wanyonyi) (+40)`

---

## 🖥️ Using the Mismatch Detector UI

1. Open the **Mismatch Detector** tool from the top navigation bar or executive dashboard banner.
2. The UI lists all polling stations with flagged status:
   - Displays **Agent Count** vs **IEBC Count**.
   - Highlights the exact **Numerical Difference** (+ / - votes).
   - Displays side-by-side links to inspect the uploaded Form 34A carbon copy evidence.
3. **Action Triggers**:
   - **Trigger Legal Escalation**: Marks station for legal team review and affidavit drafting.
   - **Generate Dispute PDF Report**: Invokes `PdfReportGenerator` to produce a court-admissible PDF petition document complete with evidence thumbnails, GPS hashes, and comparative tables.

---

## 📄 PDF Petition Export Specification

The generated PDF report includes:
- **Header**: Official Electoral Audit & Legal Petition Summary.
- **Station Metadata**: Polling Station Name, Code, Ward, Constituency, County.
- **Evidence Verification**: Embedded Form 34A photo, GPS coordinates, timestamp, and device hash.
- **Comparison Grid**: Tabular presentation of Agent Tally vs Official Broadcast with delta highlighting.
- **Sign-off Block**: Legal Counsel signature placeholder.
