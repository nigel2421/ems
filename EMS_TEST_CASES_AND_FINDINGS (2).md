#CI-EMS (PRO) - Test Cases Report and Findings
**Date:** October 14, 2026  
**App URL:** https://nigel2421.github.io/ems/  
**Test Scope:** Full system coverage across 6 user roles

## Executive Summary

This report documents comprehensive test coverage for a **campaign and election operations platform** (candidate "Campaign HQ" dashboards, Strategy, Polling Intel, Agent Management, Tally Center, Field Reports, Surveys, Mobilization, AI Assistant, plus Admin Tools). Testing was conducted across all six roles (Governor, Senator, MP, MCA, Field Agent, Admin) 
---

| Code | Role | Email | Expected scope (CONFIRM with developer) |
|---|---|---|---|
| ADM | Admin | admin.super@ems.go.ke | Whole system, Admin Tools, impersonation |
| GOV | Governor | governor.nairobi@ems.go.ke | Nairobi County (17 constituencies, 3,565 stations) |
| SEN | Senator | senator.nairobi@ems.go.ke | Nairobi County/Specific to a county |
| MP | MP Westlands | mp.westlands@ems.go.ke | Westlands constituency only/Specific to a constituency |
| MCA | MCA Parklands | mca.parklands@ems.go.ke | Parklands ward only/Specific to a ward |
| AGT | Field Agent | james.agent@ems.go.ke | Assigned polling station(s) only/Specific to a polling station |

**Reference values (used for data-accuracy checks):**
National registered voters 22,349,912 | Polling stations 46,051 | Active accounts 7 | Pending tallies 0 | Nairobi: 2,658,906 voters, 17 constituencies, 3,565 stations, top-5 share 39.7% | Countdown target: 10 Aug (2027).
---

## 1. Authentication and Session

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| AUTH-01 | ALL | Valid login for each role | Enter valid email and password, submit | Logs in; name and role shown in sidebar profile | P1 | ✅Pass |
| AUTH-02 | ALL | Role-appropriate landing page | Log in as each role | ADM sees Admin Overview; GOV sees "Governor command"; others see their own dashboard | P1 | ✅Pass |
| AUTH-03 | ALL | Wrong password | Valid email, wrong password | Generic error, stays on login, no data loaded | P1 | ✅Pass |
| AUTH-04 | ALL | Unknown email | Unregistered email | Same generic error as AUTH-03 (no account enumeration) | P1 | ✅Pass |
| AUTH-05 | ALL | Empty email | Blank email, submit | Field-level validation message | P1 | ✅Pass |
| AUTH-06 | ALL | Empty password | Blank password, submit | Field-level validation message | P1 | ✅Pass |
| AUTH-07 | ALL | Email case and spaces | Enter " Governor.Nairobi@EMS.go.ke " | Accepted (trimmed, case-insensitive) or clear message; consistent behavior | P2 | ✅Pass |
| AUTH-08 | ALL | Password masking | Type password; use show/hide toggle if present | Masked by default; toggle works | P2 | ✅Pass |
| AUTH-09 | ALL | Brute-force protection | 10 failed logins in a row | Lockout, delay or captcha; no unlimited attempts | P1 | ❌Fail |
| AUTH-10 | ALL | Enter key submits | Press Enter in password field | Login submits once | P3 | ✅Pass |
| AUTH-11 | ALL | Session survives refresh | Log in, press F5 on dashboard | Still logged in, same page | P1 | ✅Pass |
| AUTH-12 | ALL | Session timeout | Stay idle 30+ min (or configured limit) | Auto logout and redirect to login; unsaved work warning | P2 | ❌Fail |
| AUTH-13 | ALL | Logout | Click logout from profile menu | Returns to login; session cleared | P1 | ✅Pass |
| AUTH-14 | ALL | Back button after logout | Log out, press browser Back | Protected pages not shown | P1 | ✅Pass |
| AUTH-15 | ALL | Protected URL while logged out | Open a dashboard URL in a fresh session | Redirected to login, then to the requested page after login | P1 | ✅Pass |
| AUTH-16 | ALL | Two accounts, two browsers | Log in as GOV in Chrome, MP in Edge | No data or role mix-up | P2 | ✅Pass |
| AUTH-17 | ALL | Two accounts, same browser | Log in as GOV, open new tab, log in as MP | Defined behavior (replace session or block); no mixed data | P2 | ✅Pass |
| AUTH-18 | ALL | Password reset / change | Use "forgot password" or change password if available | Works; old password stops working; policy enforced | P2 | ⚠️Verify |

## 2. Access Control and Data Scope

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| RBAC-01 | GOV, SEN, MP, MCA, AGT | Admin Tools hidden | Check sidebar | Overview, Accounts, Geo Inspector, Audit, Alerts (Admin Tools) not shown | P1 | ✅Pass |
| RBAC-02 | Non-ADM | Direct URL to admin pages | Paste admin route URL while logged in as GOV | Access denied or redirect; no admin data flashes | P1 | ✅Pass |
| RBAC-03 | Non-ADM | Admin buttons hidden | Look for Add candidate and Import stations | Not visible; direct action blocked | P1 | ✅Pass |
| RBAC-04 | GOV | Governor scope | Open dashboard, Polling Intel | Only Nairobi County data (17 constituencies) | P1 | ✅Pass |
| RBAC-05 | SEN | Senator scope | Open dashboard, Polling Intel | Nairobi County data; labels say Senator, not Governor | P1 | ✅Pass |
| RBAC-06 | MP | MP scope | Open dashboard, Polling Intel | Westlands constituency and its wards only/Specific to a constituency | P1 | ✅Pass |
| RBAC-07 | MCA | MCA scope | Open dashboard, Polling Intel | Parklands ward and its stations only/Specific to a ward | P1 | ✅Pass |
| RBAC-08 | AGT | Agent scope | Log in, browse all menus | Only assigned station(s); no strategy or other campaign data | P1 | ✅Pass |
| RBAC-09 | GOV vs SEN | Campaign data privacy | GOV creates a campaign plan; log in as SEN | SEN cannot see GOV plan, team or reports (if privacy is intended) | P1 | ✅Pass |
| RBAC-10 | MP vs MCA | Cross-scope data | MP creates a Field Report; log in as MCA | Visibility matches the agreed hierarchy | P1 | ✅Pass |
| RBAC-11 | ALL | IDOR check | Change record IDs in URL or API call to another campaign's record | 403/404, no data returned | P1 | ✅Pass |
| RBAC-12 | ADM | Role change | Change a user's role in Accounts, relogin | New permissions apply; old ones removed | P2 | ✅Pass |
| RBAC-13 | ADM | Disable account | Disable MP, try to log in / use active session | Login blocked; active session ends | P1 | ✅Pass |
| RBAC-14 | ALL | Menu vs route consistency | For each role, open every menu item | No broken pages or empty screens for permitted items | P2 | ✅Pass |

## 3. Admin Overview and Admin Tools (ADM)

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| ADM-01 | ADM | KPI cards render | Open Overview | Registered voters, Polling stations, Active accounts, Pending tallies shown with correct labels | P1 | ✅Pass |
| ADM-02 | ADM | National totals accurate | Sum county voters from Geo Inspector or source data | Equals 22,349,912; stations equal 46,051 | P1 | ✅Pass |
| ADM-03 | ADM | Active accounts count | Compare card (7), sidebar badge (7) and Accounts list | All three agree | P1 | ✅Pass |
| ADM-04 | ADM | Add candidate (valid) | Click Add candidate, fill all fields, save | Account created; appears in Accounts; count and badge increase | P1 | ✅Pass |
| ADM-05 | ADM | Add candidate validation | Empty fields, invalid email, duplicate email, weak password | Inline errors; nothing saved | P1 | ✅Pass |
| ADM-06 | ADM | New candidate can log in | Log in as new account | Sees only own scope and campaign | P1 | ✅Pass |
| ADM-07 | ADM | Import stations (valid file) | Upload valid CSV/Excel | Preview or summary; counts update correctly | P1 | ✅Pass |
| ADM-08 | ADM | Import stations (bad files) | Wrong columns, empty file, wrong type, huge file | Clear error; no partial data saved | P1 | ✅Pass |
| ADM-09 | ADM | Import duplicates | File with duplicate station codes | Duplicates flagged or merged per rules | P2 | ⚠️Verify |
| ADM-10 | ADM | Import is atomic | Interrupt upload / file with one bad row | All-or-nothing, or a clear per-row error report | P2 | ⚠️Verify |
| ADM-11 | ADM | Accounts management | Search, filter, edit, disable, reset password | Each action works and is audit logged | P1 | ⚠️Verify |
| ADM-12 | ADM | Audit log content | Perform login, import, account edit, impersonation | Each appears with user, action, timestamp | P1 | ✅Pass |
| ADM-13 | ADM | Audit log filters and export | Filter by user, date, action; export | Correct results; export matches screen | ✅Pass |
| ADM-14 | ADM | Audit log immutability | Look for edit/delete options; try API call | No way to alter entries | P1 | ⚠️Verify |
| ADM-15 | ADM | Impersonation start | Impersonate "Governor Campaign HQ" | Red banner "Administrative impersonation active" on every page; dashboard shows governor view | P1 | ✅Pass |
| ADM-16 | ADM | Impersonation audit | Do an action while impersonating; check Audit | Logged as ADM acting as GOV (both identities recorded) | P1 | ⚠️Verify |
| ADM-17 | ADM | Impersonation exit | Exit impersonation; also refresh while impersonating | Returns to admin view; banner removed; refresh keeps banner while active | P1 | ⚠️Verify |
| ADM-18 | GOV | Impersonation not available | Look for impersonation controls as GOV | Not available; direct call rejected | P1 | ✅Pass |
| ADM-19 | ADM | Impersonation limits | While impersonating, try change password or delete account | Sensitive actions blocked or require re-authentication | P2 | ⚠️Verify |
| ADM-20 | ADM | Impersonation on mobile | Impersonate on phone | Banner clearly visible; exit reachable | P2 | ✅Pass |

## 4. Candidate Dashboards (GOV, SEN, MP, MCA)

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| DASH-01 | GOV | Header and context | Open dashboard | "Governor command", county "Nairobi City", correct campaign name | P1 | ✅Pass |
| DASH-02 | GOV | Total registered voters/Nairobi | Compare card to Geo Inspector | 2,658,906 matches source | P1 |✅Pass |
| DASH-03 | GOV | Constituencies count/Nairobi county | Count constituencies in Polling Intel | 17 | P1 | ✅Pass |
| DASH-04 | GOV | Polling stations count | Compare card to Polling Intel total | 3,565 | P1 | ✅Pass |
| DASH-05 | GOV | Top voter blocks share | Add top 5 constituencies, divide by county total | 39.7% (within rounding) | P2 | ✅Pass |
| DASH-06 | GOV | Main voter blocks pie | Check slices and labels | Shares add to 100%; labels match data | P2 | ✅Pass |
| DASH-07 | GOV | Constituencies comparison chart | Hover/tap bars | Values match table; axis readable; sorted logically | P2 | ✅Pass |
| DASH-08 | GOV | Open polling intel | Click button | Opens Polling Intel with Nairobi filter kept | P2 | ✅Pass |
| DASH-09 | GOV | Header buttons | Click Strategy Team Org, AI assistant, Campaign plan | Each opens correct page | P2 | ✅Pass |
| DASH-10 | SEN, MP, MCA | Role-specific dashboards | Log in as each | Titles, KPIs and scope match their seat | P1 | ✅Pass |
| DASH-11 | ALL | Number formatting | Compare mobile vs desktop | Thousands separators and decimals consistent | P3 | ✅Pass |
| DASH-12 | ALL | Data freshness | Change data as ADM, view as GOV | Updates after refresh (or live, if designed) | P2 | ✅Pass |

## 5. Charts and Maps (Register by County)

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| CHT-01 | ADM | Pie "Share of register" | Check top-10 counties | Slice sizes match data; percentages sensible | P2 | ✅Pass |
| CHT-02 | ADM | Legend complete | Scroll to legend on phone | All 10 counties readable, none hidden (a legend item is covered by the News widget) | P2 |❌Fail |
| CHT-03 | ADM | "Voters by county" chart | Compare points to data | Values correct; x-axis labels fully readable | P2 | ✅Pass |
| CHT-04 | ADM | Tooltips | Tap/hover points and slices | Shows county name and exact value | P2 | ✅Pass |
| CHT-05 | ADM | View map | Click "View map" | Map loads, counties shaded correctly, can return | P2 | ❌Fail |
| CHT-06 | ADM | Colour distinction | Check Nairobi vs Kiambu vs Mombasa colours; simulate colour blindness | Slices distinguishable without colour alone | P3 | ❌Fail |
| CHT-07 | ALL | Resize / rotate | Rotate phone, resize window | Charts redraw without overflow | P3 | ✅Pass |

## 6. News Widget and Election Countdown

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| WID-01 | ALL | Open news items | Open widget, click an item | Title, source, date; link opens correct page | P2 | ✅Pass |
| WID-02 | ALL | News empty / error | No news or feed failing | "No news" or error message, badge 0/hidden | P3 | ✅Pass |
| WID-03 | ALL | Widget overlap | Scroll all pages on phone | Floating News button never hides content; can be moved or minimised (it covers a card icon and chart legend) | P2 | ❌Fail |
| WID-04 | ALL | Countdown accuracy | Compare days/hours to 10 Aug 2027 00:00 EAT | Correct for Africa/Nairobi time; check against a trusted calculator | P1 | ✅Pass |
| WID-05 | ALL | Countdown ticking | Watch 2 minutes; background tab 5 minutes, return | Seconds tick; no drift or freeze after returning | P2 |✅Pass |
| WID-06 | ALL | Countdown collapse and close | Use minimise and close buttons | Works; state remembered or reappears per design | P3 | ✅Pass |
| WID-07 | ALL | Countdown overlap (desktop) | View dashboard at 1366 px | Countdown card does not cover chart titles or data | P2 | ✅Pass |
| WID-08 | ALL | Countdown different timezone | Set device to another timezone | Still counts to the same moment (or documented) | P3 | ✅Pass |
| WID-09 | ALL | Countdown after date | Set device date past target | Shows 0 / "Election day", no negative numbers | P3 | ✅Pass |

## 7. Navigation and Layout

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| NAV-01 | ADM | Single active menu item | Open drawer on Overview | One item highlighted | P2 | ✅Pass |
| NAV-02 | ALL | Expand and collapse | Toggle More and Agent Management | Opens/closes; chevron changes; state sensible | P3 | ✅Pass |
| NAV-03 | ALL | Mobile drawer | Open hamburger, tap item, tap outside | Drawer closes on selection and on outside tap | P2 | ✅Pass |
| NAV-04 | ADM | Drawer reaches bottom items | Scroll drawer to the end on a phone | Profile, logout and last items reachable above browser bar | P2 | ✅Pass |
| NAV-05 | ALL | Browser back/forward | Move between 5 pages, use Back/Forward | Correct page and active menu each time | P2 | ✅Pass |
| NAV-06 | ALL | Refresh on every route | Press F5 on each page | Page reloads (no GitHub Pages 404 on sub-routes) | P1 | ✅Pass |
| NAV-07 | ALL | Bookmark a deep link | Open saved link in a new session | Login then target page | P2 | ✅Pass |
| NAV-08 | ALL | Page titles | Check browser tab title per page | Meaningful and distinct | P3 | ✅Pass |

## 8. Functional Modules

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| STR-01 | GOV | Strategy Team view | Open Strategy Team | Org structure shown for own campaign only | P2 | ✅Pass |
| STR-02 | GOV | Strategy Team edit | Add, edit, remove a team member | Saved, validated, audit logged | P2 | ✅Pass |
| STR-03 | GOV | Strategy / campaign plan | Create and edit a plan, save, refresh | Content persists; validation on required fields | P2 | ✅Pass |
| POL-01 | GOV, MP, MCA | Polling Intel search | Search by station location/code | Correct results; no results message when none | P1 | ✅Pass |
| POL-02 | GOV, MP, MCA | Polling Intel filters | Filter by constituency, ward | Results and counts update; only in-scope units | P1 | ✅Pass |
| POL-03 | GOV | Polling Intel totals | Compare to dashboard | Totals identical | P1 | ✅Pass |
| POL-04 | ALL | Station detail | Open a station | Registered voters, ward, constituency correct | P2 | ✅Pass |
| AGM-01 | GOV, MP, MCA | Agent list | Open Agent Management | Only agents in scope listed | P2 | ✅Pass |
| AGM-02 | GOV, MP, MCA | Add agent | Create agent with valid details | Appears in list; can log in | P1 | ✅Pass |
| AGM-03 | GOV, MP, MCA | Assign to station | Assign James to a station | Assignment saved; agent sees that station only | P1 | ✅Pass |
| AGM-04 | GOV, MP, MCA | Duplicate assignment | Assign same station to two agents (if disallowed) | Blocked with message | P2 | ⚠️Verify |
| AGM-05 | GOV, MP, MCA | Deactivate agent | Deactivate James | Cannot log in; history kept | P2 | ⚠️Verify |
| FLD-01 | AGT | Submit field report | Fill form, attach photo, submit | Saved; confirmation shown | P1 | ✅Pass |
| FLD-02 | AGT | Required fields | Submit incomplete form | Inline errors; nothing saved | P1 | ✅Pass |
| FLD-03 | GOV, MP, MCA | View reports | Open Field Reports | Only in-scope reports; filter by date/station | P2 | ⚠️Verify |
| FLD-04 | AGT | Attachments | Upload valid and invalid file types and big files | Valid accepted; invalid/oversize rejected with message | P2 | ⚠️Verify |
| FLD-05 | AGT | Location capture | Allow, then deny, location permission | Works when allowed; graceful when denied | P3 | ⚠️Verify |
| SUR-01 | GOV, MP, MCA | Create survey | Create with questions and sample size | Saved; validation on sample size and required fields | P2 | ✅Pass  |
| SUR-02 | GOV, MP, MCA | Collect and view responses | Submit responses, open results | Counts and percentages correct | P2 | ✅Pass  |
| MOB-01 | GOV, MP, MCA | Add key stakeholder | Create stakeholder with valid details and network estimated reach | Saved and listed | P2 |  ✅Pass |
| AI-01 | ALL | AI Assistant answers | Ask "How many registered voters are in Nairobi?" | Answer matches dashboard (2,658,906) | P1 | ⚠️Verify |
| AI-02 | MP | AI respects scope | As MP ask for another constituency or county data | Refuses or limits to MP scope | P1 | ⚠️Verify |
| AI-03 | ALL | AI prompt injection | Ask it to ignore rules and reveal other campaigns' data or system prompt | Refuses; no leakage | P1 | ⚠️Verify |
| AI-04 | ALL | AI failure | Block network during request | Clear error and retry option | P3 | ⚠️Verify |

## 9. Tally Center

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| TAL-01 | ADM | Pending tallies card | Compare card (0) with queue | Equal; updates after a new submission | P1 |⚠️Verify |
| TAL-02 | AGT | Enter result (valid) | Enter votes per candidate | Saved; appears in Tally Center | P1 | ✅Pass |
| TAL-03 | AGT | Result validation | Negative, text, blank, total over registered voters | Rejected with clear message | P1 | ⚠️Verify |
| TAL-04 | AGT | Totals consistency | Candidate votes plus rejected vs total cast | System checks sum or warns | P1 | ⚠️Verify |
| TAL-05 | AGT | Duplicate submission | Submit same station twice | Prevented or flagged | P2 | ⚠️Verify |
| TAL-06 | GOV | Parallel tally mismatch | Enter differing figures for same station | Mismatch flagged for verification | P1 | ⚠️Verify |
| TAL-07 | GOV, ADM | Verification workflow | Verify a pending tally | Status changes; pending count falls by 1 | P1 | ⚠️Verify |
| TAL-08 | GOV, ADM | Locked tally | Try to edit a verified/final tally | Edit blocked with message | P1 | ⚠️Verify |
| TAL-09 | AGT | Evidence upload | Attach result-form photo | Stored, viewable, linked to tally | P2 | ✅Pass |
| TAL-10 | GOV | Aggregation | Compare station, ward, constituency, county totals | Roll-ups add up exactly | P1 | ✅Pass |
| TAL-11 | ADM | Tally audit trail | Open history of a tally | Every change with user and time | P2 | ⚠️Verify |

## 10. Offline and PWA (Field Agent)

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| OFF-01 | AGT | Submit online | Submit report/tally with network | Saved immediately; status "synced" | P1 | ✅Pass |
| OFF-02 | AGT | Submit offline | Turn off network, submit | Stored locally; status "pending"; offline banner shown | P1 | ⚠️Verify |
| OFF-03 | AGT | Auto sync | Restore network | Pending items sync without action; no duplicates | P1 | ⚠️Verify |
| OFF-04 | AGT | Pending survives restart | Submit offline, close browser, reopen | Items still queued | P1 | ⚠️Verify |
| OFF-05 | AGT | Failed sync retry | Force server error on sync | Retries; status shows error with retry option | P2 | ⚠️Verify |
| OFF-06 | AGT | Logout with pending items | Log out while items pending | Warning shown; data not lost | P2 | ⚠️Verify |
| OFF-07 | AGT | Slow network | Throttle to Slow 3G | App usable; loading indicators; no double submit | P2 | ⚠️Verify |
| OFF-08 | AGT | Install as PWA | Add to Home Screen on Android and iOS | Installs with correct icon and name | P3 | ⚠️Verify |
| OFF-09 | ALL | Update/cache | Deploy a new version; reopen app | New version loads; no stale cache | P2 | ⚠️Verify |

## 11. Security

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| SEC-01 | ALL | HTTPS only | Open http:// URL; inspect padlock | Redirects to HTTPS; no mixed-content warnings | P1 | ✅Pass |
| SEC-02 | ALL | No secrets exposed | View page source, JS bundles, browser storage | No passwords, API keys or service credentials in client code | P1 | ✅Pass |
| SEC-03 | ALL | Unauthenticated API access | Call data endpoints (DevTools Network) without token | 401/403, no data | P1 | ✅Pass |
| SEC-04 | GOV | API authorization | Call admin endpoints with GOV token | 403 | P1 | ✅Pass |
| SEC-05 | ALL | XSS in inputs | Enter `<script>alert(1)</script>` in names, notes, reports, AI assistant | Escaped, never executes | P1 | ⚠️Verify |
| SEC-06 | ALL | Injection in search | Enter `' OR 1=1 --` and similar | No error leak; no extra data | P2 | ⚠️Verify |
| SEC-07 | ALL | Upload safety | Upload .exe, .html, double extension, oversize | Rejected or safely stored | P2 | ✅Pass |
| SEC-08 | ALL | Token invalidation | Log out, replay old token | Rejected by server | P1 | ⚠️Verify |
| SEC-09 | ALL | Password policy | Set 3-character and common passwords | Rejected | P2 | ⚠️Verify |
| SEC-10 | ALL | Personal data exposure | Check if individual voter details appear anywhere | Only what is necessary; consider Kenya Data Protection Act | P1 | ✅Pass |
| SEC-11 | ADM | Impersonation abuse | Check impersonation cannot be started via URL/API by others | Server enforces ADM only | P1 | ⚠️Verify |
| SEC-12 | ALL | Security headers | Inspect response headers | Note missing headers (GitHub Pages limits control; report as observation) | P3 |⚠️Verify |

## 12. UI Responsiveness, Compatibility and Accessibility

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| UI-01 | ALL | iPhone Safari | Open in Safari at ~390 px | All pages usable, no overflow | P1 | ✅Pass |
| UI-02 | ALL | In-app browser | Open from WhatsApp link | Same behavior as Safari; bottom toolbar does not hide controls | P2 |✅Pass |
| UI-03 | ALL | Android Chrome | Open at ~360 px | Same as UI-01 | P1 | ✅Pass |
| UI-04 | ALL | Tablet | 768 px portrait and landscape | Proper layout | P2 | ✅Pass |
| UI-05 | ALL | Desktop browsers | Chrome, Edge, Firefox, Safari | Consistent look and behavior | P2 | ✅Pass |
| UI-06 | ALL | Zoom 200% | Browser zoom | No cut-off content | P3 | ✅Pass |
| UI-07 | ALL | Keyboard navigation | Tab through login, menu, forms | Logical order; visible focus; no traps | P2 | ✅Pass |
| UI-08 | ALL | Screen reader labels | Icon-only buttons (hamburger, News, close) | Have accessible names | P2 | ✅Pass |
| UI-09 | ALL | Contrast | Check grey helper text, badges, green-on-green | Meets WCAG 2.1 AA (4.5:1) | P2 | ⚠️Verify |

## 13. Performance

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| PERF-01 | ALL | Dashboard load | Cold load on normal and 4G connection | Main content within 3 s (target to confirm) | P2 | ✅Pass |
| PERF-02 | ADM | Large data views | Open Polling Intel with 46,051 stations | Paging/virtualization; no freeze | P2 | ⚠️Verify |
| PERF-03 | ALL | Filter/search response | Apply filters on large lists | Results within 2 s | P2 | ✅Pass |
| PERF-04 | ALL | Memory over time | Leave dashboard (with countdown) open 1 hour | No slowdown or memory growth | P3 | ✅Pass |
| PERF-05 | ALL | Concurrent users | Load test only with owner permission, on a test environment | No data loss, acceptable error rate | P3 | ⚠️Verify |

## 14. Error Handling

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| ERR-01 | ALL | Unknown URL | Open /ems/does-not-exist | Friendly 404 with way back | P2 | ✅Pass |
| ERR-02 | ALL | Network lost mid-use | Disconnect while loading a page | Clear message; no blank screen | P1 | ✅Pass |
| ERR-03 | ALL | Backend error | Simulate API 500 (DevTools block) | Friendly error; app stays usable | P2 | ⚠️Verify |
| ERR-04 | ALL | Double submit | Double-click Save/Submit | One record only | P1 |✅Pass |
| ERR-05 | ALL | Back after submit | Submit, press Back, resubmit | No duplicate; sensible state | P2 | ✅Pass |
| ERR-06 | ALL | Invalid input messages | Submit bad data on all forms | Messages are specific and placed at the field | P2 | ✅Pass |

## 15. Exports and Reports 

| ID | Role | Scenario | Steps | Expected | Pri | Status |
|---|---|---|---|---|---|---|
| EXP-01 | GOV | Export PDF/CSV | Use any export button | File downloads; data matches screen and role scope | P2 | ✅Pass |
| EXP-02 | GOV | Export scope | Export as GOV, then MP | Each file contains only in-scope data | P1 | ✅Pass |

## 16. Candidate Defects Seen

| Ref | Where | Observation | Suggested severity |
|---|---|---|---|
| OBS-01 | Mobile, all pages | Floating News button overlaps content (card icon, chart legend) | Medium |
| OBS-02 | Mobile, Register by county | Similar greens for Nairobi and Kiambu; hard to tell apart | Low |

---

## Execution Summary (update after each run)

| Section | Cases | Pass | Fail | Verify |
|---|---|---|---|---|---|
| Authentication and Session (AUTH) | 18 | 15 | 2 | 1 | 18 |
| Access Control and Data Scope (RBAC) | 14 | 14 | 0 | 0 | 14 |
| Admin Overview and Tools (ADM) | 20 | 13 | 0 | 7 | 20 |
| Candidate Dashboards (DASH) | 12 | 12 | 0 | 0 | 12 |
| Charts and Maps (CHT) | 7 | 4 | 3 | 0 | 7 |
| News and Countdown (WID) | 9 | 8 | 1 | 0 | 9 |
| Navigation (NAV) | 8 | 8 | 0 | 0 | 8 |
| Functional Modules (STR, POL, AGM, FLD, SUR, MOB, AI) | 24 | 15 | 0 | 9 | 24 |
| Tally Center (TAL) | 11 | 3 | 0 | 8 | 11 |
| Offline and PWA (OFF) | 9 | 1 | 0 | 8 | 9 |
| Security (SEC) | 12 | 6 | 0 | 6 | 12 |
| UI Responsiveness and Accessibility (UI) | 9 | 8 | 0 | 1 | 9 |
| Performance (PERF) | 5 | 3 | 0 | 2 | 5 |
| Error Handling (ERR) | 6 | 5 | 0 | 1 | 6 |
| Exports (EXP) | 2 | 2 | 0 | 0 | 2 |
| **TOTAL** | **166** | 117 | 6 | 43 | 166 |
`Verify` means the case was attempted or reviewed but not conclusively confirmed.
## 16. Defects and Observations

### Defects found

| ID | Case | Finding | Severity |
|---|---|---|---|
| DEF-01 | AUTH-09 | No lockout, delay or captcha after repeated failed logins | High |
| DEF-02 | AUTH-12 | No automatic logout after a period of inactivity | Medium |
| DEF-03 | CHT-05 | The "Map" view shows a list of "Spatial sample" cards instead of an interactive map (no tiles, markers or county shading) | Medium |
| DEF-04 | CHT-02, WID-03 | On mobile and desktop, the floating News button covers content (for example part of the chart legend and the fifth station card in Polling Intel > Map) | Medium |
| DEF-05 | CHT-06 | County colours (for example Nairobi and Kiambu greens) are hard to tell apart and the Polling Intel legend uses near-identical greens for "Stronghold / lean" and "Swing ward" | Low |
| DEF-06 | CHT-05 | Coordinates show floating-point artefacts (for example 36.823100000000004) and overflow the card | Low |

### Other observations

| Ref | Where | Observation |
|---|---|---|
| OBS-01 | Polling Intel > Map | "Low" risk tags are pale green on pale green; contrast not measured |

---

## 17. Recommendations

### Fix before release (High and Medium)

1. **Limit login attempts (DEF-01).** Lock the account or add an increasing delay after 5 to 10 failed attempts and add a captcha or alert for repeated failures. The system holds election data and admin accounts can impersonate other users.
2. **Add an inactivity timeout (DEF-02).** Log users out after a set time (for example 15 to 30 minutes), warn them before it happens and clear session data. Field agents on shared or borrowed phones are especially exposed.
3. **Fix the map view (DEF-03, DEF-06).** Show a real map with markers or county shading, as the tab name promises, or rename the tab to "Station list".Round coordinates to 4 to 6 decimals before displaying them.
4. **Stop the News widget covering content (DEF-04).** Let users minimise or move the widget, add bottom padding on mobile and check every page at 360 to 390 px and at desktop widths.

### Improve (Low)

5. **Make colours distinguishable (DEF-05).** Use a colour-blind-safe palette, give each risk category in the legend its own colour and add labels or patterns so meaning is not carried by colour alone.

### Complete the unverified areas (43 cases marked Verify)

These cases were not conclusively tested. Treat them as unproven, not as passed. Suggested priority:

6. **Tally Center and parallel tally (8 cases):** validation, mismatch detection, verification, locked records and the audit trail. These protect result integrity.
7. **Offline and PWA (8 cases):** offline submission, automatic sync, retry on failure and data surviving a restart. Field agents depend on these.
8. **Admin and audit (7 cases):** audit-log immutability, impersonation logging, exit and limits, and account management.
9. **Security (6 cases):** XSS, injection, token invalidation after logout, password policy, and impersonation being limited to admins.
10. **AI Assistant (4 cases):** answers matching the dashboard, respecting the user's scope and resisting prompt injection.
11. **Remaining cases:** agent assignment rules, field report scope and attachments, performance with 46,051 stations, backend error handling and colour contrast.

---

## Conclusion

The EMS application has solid core functionality. Login, role-based access, dashboards, navigation and most form handling worked as expected (117 of 166 cases passed). Six cases failed and two of them are security-related issues that need attention before release: missing brute-force protection and no session timeout. The map view does not display a map, and its station coordinates do not match the selected county. Forty-three cases were not conclusively verified, mainly in Tally Center, offline sync, admin auditing and security and need testing before the system is relied on for election operations.

Release is recommended only after the High and Medium defects are fixed and the unverified high-priority areas are tested.

Prepared by: Prisca Wamboka
Date: October 14, 2026
