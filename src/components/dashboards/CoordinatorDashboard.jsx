import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Users,
  MapPin,
  ClipboardList,
  ShieldCheck,
  RefreshCw,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { surveyRequest } from "../../services/surveys";
import {
  InsightBars,
  InsightRing,
  ResponseTrend,
} from "../common/InsightCharts";
import "./CoordinatorDashboard.css";

const get = async (url) => {
  const r = await fetch(url, { credentials: "include" });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Unable to load data.");
  return d;
};
export function CoordinatorDashboard({ onOpenModule }) {
  const { currentUser } = useAuth();
  const [data, setData] = useState(null),
    [surveys, setSurveys] = useState(null),
    [results, setResults] = useState(null),
    [errors, setErrors] = useState([]),
    [loading, setLoading] = useState(true),
    [query, setQuery] = useState(""),
    [teamFilter, setTeamFilter] = useState("all"),
    [groupPage, setGroupPage] = useState(0);
  const refresh = async () => {
    setLoading(true);
    const outcomes = await Promise.allSettled([
      get("/api/coordinator-overview"),
      surveyRequest(),
      get("/api/results"),
    ]);
    const issues = [];
    outcomes.forEach((r, i) => {
      if (r.status === "fulfilled") {
        if (i === 0) setData(r.value);
        if (i === 1) setSurveys(r.value.surveys);
        if (i === 2) setResults(r.value.results);
      } else {
        issues.push(
          ["Team overview", "Research", "Results"][i] + ": " + r.reason.message,
        );
        if (i === 0) setData(null);
        if (i === 1) setSurveys(null);
        if (i === 2) setResults(null);
      }
    });
    setErrors(issues);
    setLoading(false);
  };
  useEffect(() => {
    refresh();
  }, [currentUser?.id]);
  const responses = surveys?.flatMap((s) => s.responses) || [],
    included = responses.filter((r) => !r.excluded).length;
  const enabled = data?.team.filter((u) => u.enabled).length || 0,
    coverage = data?.stations ? (data.covered / data.stations) * 100 : 0,
    pending = results?.filter((r) => r.status === "Submitted") || [];
  const groups = [...(data?.groups || [])].sort(
    (a, b) =>
      a.covered / a.stations - b.covered / b.stations ||
      b.stations - a.stations,
  );
  const roster =
    data?.team.filter(
      (u) =>
        (teamFilter === "all" ||
          (teamFilter === "direct" ? u.direct : !u.enabled)) &&
        `${u.name} ${u.role} ${u.area}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    ) || [];
  const exportCoverage = () => {
    const cell = (v) =>
      '"' +
      String(v)
        .replace(/^[=+@-]/, "'$&")
        .replace(/"/g, '""') +
      '"';
    const text = [
      ["Area", "Stations", "Staffed stations", "Unstaffed stations"],
      ...groups.map((g) => [
        g.name,
        g.stations,
        g.covered,
        g.stations - g.covered,
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "coordination-coverage.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const open = (module) => onOpenModule?.(module);
  return (
    <div className="coord">
      <header className="coord-head">
        <div>
          <span className="coord-eyebrow">
            <i /> COORDINATION WORKSPACE
          </span>
          <h1>Your area. One clear picture.</h1>
          <p>
            {currentUser?.name} <span> / </span> {currentUser?.role}
          </p>
        </div>
        <div className="coord-actions">
          <button
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={15} className={loading ? "coord-spinning" : ""} />
            Refresh
          </button>
          <button className="coord-primary" onClick={() => open("agents")}>
            <Users size={16} />
            Manage team <ArrowUpRight size={16} />
          </button>
        </div>
      </header>
      {errors.map((e) => (
        <div role="alert" className="coord-alert" key={e}>
          <AlertCircle size={16} />
          {e}
        </div>
      ))}
      {loading && !data ? (
        <div className="coord-empty" role="status">
          Loading your assigned area…
        </div>
      ) : (
        data && (
          <>
            <div className="coord-scope">
              <span>
                <MapPin size={16} />
                <strong>{data.scope.name}</strong>
                <span className="coord-badge">
                  {data.scope.level.toLowerCase()}
                </span>
              </span>
              <span>
                Affiliated aspirant <strong>{data.aspirant.name}</strong>
              </span>
            </div>
            <section className="coord-metrics">
              <article>
                <div>
                  <span>Team accounts</span>
                  <Users size={17} />
                </div>
                <strong>{data.team.length}</strong>
                <small>
                  {enabled} enabled · {data.team.length - enabled} inactive
                </small>
              </article>
              <article>
                <div>
                  <span>Station coverage</span>
                  <MapPin size={17} />
                </div>
                <strong>
                  {coverage.toFixed(0)}
                  <em>%</em>
                </strong>
                <small>
                  {data.covered} of {data.stations.toLocaleString()} stations
                  staffed
                </small>
              </article>
              <article>
                <div>
                  <span>Research responses</span>
                  <ClipboardList size={17} />
                </div>
                <strong>
                  {surveys === null ? "—" : included.toLocaleString()}
                </strong>
                <small>
                  {surveys === null
                    ? "Research data unavailable"
                    : `${surveys.filter((s) => s.status === "Open").length} studies open · included responses`}
                </small>
              </article>
              <article>
                <div>
                  <span>Returns to review</span>
                  <ShieldCheck size={17} />
                </div>
                <strong>{results === null ? "—" : pending.length}</strong>
                <small>
                  {results === null
                    ? "Result data unavailable"
                    : `${results.filter((r) => r.status === "Approved").length} approved station returns`}
                </small>
              </article>
            </section>
            <section className="coord-main-grid">
              <article className="coord-card coord-coverage">
                <div className="coord-card-head">
                  <div>
                    <span className="coord-eyebrow">DEPLOYMENT OVERVIEW</span>
                    <h2>Where your team is needed</h2>
                    <p>
                      Station assignments by {data.groupLevel}. Lowest coverage
                      first.
                    </p>
                  </div>
                  <button
                    onClick={exportCoverage}
                    aria-label="Export coverage CSV"
                  >
                    <Download size={16} />
                  </button>
                </div>
                <InsightBars
                  percent
                  items={groups
                    .slice(groupPage * 6, groupPage * 6 + 6)
                    .map((g) => ({
                      id: g.id,
                      label: g.name,
                      value: Math.round((g.covered / g.stations) * 100),
                      detail: `${g.covered} / ${g.stations} staffed · ${g.stations - g.covered} unstaffed`,
                    }))}
                  empty="No polling stations found in your assigned area."
                />
                {groups.length > 6 && (
                  <div className="coord-pagination">
                    <button
                      disabled={!groupPage}
                      onClick={() => setGroupPage(groupPage - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      {groupPage + 1} / {Math.ceil(groups.length / 6)}
                    </span>
                    <button
                      disabled={(groupPage + 1) * 6 >= groups.length}
                      onClick={() => setGroupPage(groupPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
                <p className="coord-footnote">
                  Coverage means a station has an enabled agent account
                  assigned. It does not indicate a live check-in.
                </p>
              </article>
              <div className="coord-side">
                <article className="coord-card">
                  <span className="coord-eyebrow">TEAM READINESS</span>
                  <h2>Account availability</h2>
                  <InsightRing
                    label="accounts"
                    items={[
                      { label: "Enabled", value: enabled },
                      { label: "Inactive", value: data.team.length - enabled },
                    ]}
                  />
                  <button className="coord-link" onClick={() => open("agents")}>
                    Open team directory <ArrowRight size={16} />
                  </button>
                </article>
                <article className="coord-priority">
                  <div className="coord-priority-icon">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="coord-eyebrow">NEXT ACTION</span>
                  <h2>
                    {data.stations > data.covered
                      ? "Close the coverage gap"
                      : pending.length
                        ? "Review station returns"
                        : "Keep fieldwork moving"}
                  </h2>
                  <p>
                    {data.stations > data.covered
                      ? `${(data.stations - data.covered).toLocaleString()} stations have no enabled agent assigned. Start with the areas showing the lowest coverage.`
                      : pending.length
                        ? `${pending.length} station returns are waiting for independent review.`
                        : "Check ongoing studies and collect the next set of responses."}
                  </p>
                  <button
                    onClick={() =>
                      open(
                        data.stations > data.covered
                          ? "agents"
                          : pending.length
                            ? "tally_center"
                            : "surveys",
                      )
                    }
                  >
                    Take action <ArrowUpRight size={16} />
                  </button>
                </article>
              </div>
            </section>
            <section className="coord-bottom-grid">
              <article className="coord-card">
                <div className="coord-card-head">
                  <div>
                    <span className="coord-eyebrow">RESEARCH PULSE</span>
                    <h2>Response collection</h2>
                  </div>
                  <button onClick={() => open("surveys")}>
                    Research desk <ArrowUpRight size={14} />
                  </button>
                </div>
                {surveys === null ? (
                  <p className="coord-empty">Research data is unavailable.</p>
                ) : (
                  <>
                    <ResponseTrend responses={responses} />
                    <p className="coord-footnote">
                      Last seven days in EAT · includes excluded responses. Your
                      visible studies only.
                    </p>
                  </>
                )}
              </article>
              <article className="coord-card">
                <div className="coord-card-head">
                  <div>
                    <span className="coord-eyebrow">ELECTION RETURNS</span>
                    <h2>Submission pipeline</h2>
                  </div>
                  <button onClick={() => open("tally_center")}>
                    Review <ArrowUpRight size={14} />
                  </button>
                </div>
                {results === null ? (
                  <p className="coord-empty">Result data is unavailable.</p>
                ) : (
                  <InsightRing
                    label="returns"
                    items={["Approved", "Submitted", "Rejected"].map(
                      (label) => ({
                        label: label === "Submitted" ? "Pending review" : label,
                        value: results.filter((r) => r.status === label).length,
                      }),
                    )}
                  />
                )}
              </article>
            </section>
            <article className="coord-card">
              <div className="coord-card-head">
                <div>
                  <span className="coord-eyebrow">
                    PEOPLE & RESPONSIBILITIES
                  </span>
                  <h2>
                    Your coordination team{" "}
                    <span className="coord-count">{data.team.length}</span>
                  </h2>
                  <p>
                    Campaign descendants within your assigned electoral area.
                  </p>
                </div>
                <button onClick={() => open("agents")}>
                  Manage team <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="coord-roster-tools">
                <label>
                  <Search size={16} />
                  <input
                    aria-label="Search coordination team"
                    placeholder="Search name, role or area"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Team filter"
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                >
                  <option value="all">All team members</option>
                  <option value="direct">Direct reports</option>
                  <option value="inactive">Inactive accounts</option>
                </select>
              </div>
              <div className="coord-table">
                <table>
                  <thead>
                    <tr>
                      <th>Team member</th>
                      <th>Responsibility</th>
                      <th>Assigned area</th>
                      <th>Account status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.slice(0, 50).map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="coord-person">
                            <span>
                              {(u.name || "?")
                                .split(" ")
                                .map((v) => v[0])
                                .slice(0, 2)
                                .join("")}
                            </span>
                            <div>
                              <strong>{u.name}</strong>
                              <small>
                                {u.direct ? "Direct report" : "Team member"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{u.role}</td>
                        <td>{u.area}</td>
                        <td>
                          <span
                            className={
                              "coord-status " +
                              (!u.enabled ? "is-inactive" : "")
                            }
                          >
                            {u.enabled ? "Enabled" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!roster.length && (
                  <div className="coord-empty">
                    {data.team.length
                      ? "No team members match your filters."
                      : "No subordinate accounts yet. Open Manage team to build your coordination network."}
                  </div>
                )}
                {roster.length > 50 && (
                  <p className="coord-footnote">
                    Showing the first 50 matches. Search to narrow this list or
                    open the team directory.
                  </p>
                )}
              </div>
            </article>
            <p className="coord-footnote">
              Updated{" "}
              {new Date(data.generatedAt).toLocaleString("en-KE", {
                timeZone: "Africa/Nairobi",
              })}{" "}
              EAT · Only your campaign and assigned area.
            </p>
          </>
        )
      )}
    </div>
  );
}
