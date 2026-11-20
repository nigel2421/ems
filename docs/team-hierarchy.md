# Campaign team hierarchy

The campaign workspace is available to aspirants, coordinators and polling-station agents. Existing admin tools remain on the operations console.

| Account | Can create |
| --- | --- |
| Presidential aspirant | National coordinator |
| Governor / senator / woman representative | County coordinator |
| MP | Constituency coordinator |
| MCA | Ward coordinator |
| National coordinator | County coordinator |
| County coordinator | Constituency coordinator |
| Constituency coordinator | Ward coordinator |
| Ward coordinator | Polling-station agent |
| Agent | Nobody |

Every new account retains the aspirant, parent and canonical IEBC assignment. A member cannot skip a level, leave the parent area, or move into another campaign. Existing flat accounts remain attached through their supervisor where possible; missing profiles fail closed rather than gaining national access.

The dashboard shows live counts. Daily updates, incidents, readiness, check-ins, turnout and results are reports, with optional image evidence. Results reports are not certified results. Supervisors review descendant reports; authors cannot approve themselves. Exports contain the visible branch only.

Suspension cascades through the reporting line. Restoring a supervisor does not restore a separately suspended account. Users retain their password on suspension.

Data is stored alongside users in `campaign-reports.json`. Back up this file with the users store. The file uses an atomic rename and must not be served by Nginx. `GET /api/team` reads the workspace, `/members` creates, `/members/:id` changes status, `/reports` submits, and `/reports/:id` reviews. No offline account creation is allowed.

Tests: `npm test` includes hierarchy, scope and onboarding tests. The five pre-existing map/manifest failures are separate from this work.
