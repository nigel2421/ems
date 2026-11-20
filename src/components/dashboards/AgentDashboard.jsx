import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { surveyRequest } from "../../services/surveys";
import { InsightRing, ResponseTrend } from "../common/InsightCharts";
import {
  MapPin,
  FileText,
  ClipboardList,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
  Building2,
  Phone,
  UserRound,
} from "lucide-react";
import "./CoordinatorDashboard.css";
import "./AgentDashboard.css";
const getResults = async () => {
  const response = await fetch("/api/results", { credentials: "include" });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Unable to load station returns.");
  return data;
};
const dateLabel = (value) => {
  const d = new Date(value);
  return value && !Number.isNaN(d.getTime())
    ? d.toLocaleString("en-KE", {
        timeZone: "Africa/Nairobi",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Date not recorded";
};
export const AgentDashboard = ({ onOpenModule }) => {
  const { currentUser } = useAuth();
  const { fieldReports, geography } = useData();
  const [research, setResearch] = useState(null),
    [resultData, setResultData] = useState(null),
    [errors, setErrors] = useState([]),
    [loading, setLoading] = useState(true),
    [online, setOnline] = useState(navigator.onLine);
  const refresh = async () => {
    setLoading(true);
    const outcomes = await Promise.allSettled([surveyRequest(), getResults()]);
    const issues = [];
    for (const [i, result] of outcomes.entries()) {
      if (result.status === "fulfilled") {
        if (i === 0) setResearch(result.value.surveys);
        else setResultData(result.value);
      } else {
        if (i === 0) setResearch(null);
        else setResultData(null);
        issues.push(
          (i === 0 ? "Research: " : "Station returns: ") +
            result.reason.message,
        );
      }
    }
    setErrors(issues);
    setLoading(false);
  };
  useEffect(() => {
    refresh();
  }, [currentUser?.id]);
  useEffect(() => {
    const connected = () => setOnline(true),
      disconnected = () => setOnline(false);
    window.addEventListener("online", connected);
    window.addEventListener("offline", disconnected);
    return () => {
      window.removeEventListener("online", connected);
      window.removeEventListener("offline", disconnected);
    };
  }, []);
  const stationId =
    currentUser?.pollingStationId ||
    currentUser?.assignedStations?.[0] ||
    currentUser?.assignedEntity;
  const station = (geography?.pollingStations || []).find(
    (s) => s.id === stationId,
  );
  const ward = geography?.wards?.find((w) => w.id === station?.wardId),
    constituency = geography?.constituencies?.find(
      (c) => c.id === ward?.constituencyId,
    ),
    county = geography?.counties?.find((c) => c.id === constituency?.countyId);
  const stationName =
    station?.name ||
    currentUser?.pollingStationName ||
    currentUser?.entityName ||
    "Station assignment not configured";
  const myReports = (fieldReports || [])
    .filter((r) => r.agentId === currentUser?.id)
    .sort(
      (a, b) =>
        (Date.parse(b.createdAt || b.timestamp) || 0) -
        (Date.parse(a.createdAt || a.timestamp) || 0),
    );
  const myReturns = (resultData?.results || []).filter(
    (r) => r.submittedBy === currentUser?.id,
  );
  const openStudies = research?.filter((s) => s.status === "Open") || [];
  const responses =
    research
      ?.flatMap((s) => s.responses)
      .filter((r) => r.collectorId === currentUser?.id) || [];
  const open = (module) => onOpenModule?.(module);
  return (
    <div className="coord agent-overview">
      <header className="coord-head">
        <div>
          <span className="coord-eyebrow">
            <i /> FIELD OPERATIONS / OVERVIEW
          </span>
          <h1>Your station. Your work. Clearly.</h1>
          <p>
            {currentUser?.name} <span>/</span>{" "}
            {currentUser?.role === "Agent"
              ? "Polling station agent"
              : currentUser?.role}
          </p>
        </div>
        <div className="coord-actions">
          <span className={"ao-connection " + (!online ? "is-offline" : "")}>
            {online ? <Wifi size={13} /> : <WifiOff size={13} />}{" "}
            {online ? "Connected" : "Offline"}
          </span>
          <button type="button" disabled={loading} onClick={refresh}>
            <RefreshCw size={14} className={loading ? "coord-spinning" : ""} />
            Refresh
          </button>
          <button
            type="button"
            className="coord-primary"
            onClick={() => open("field_reports")}
          >
            <FileText size={15} />
            Create report <ArrowUpRight size={15} />
          </button>
        </div>
      </header>
      <div className="coord-scope">
        <span>
          <MapPin size={15} />
          <strong>{stationName}</strong>
          <span className="coord-badge">Assigned station</span>
        </span>
        <span>
          {resultData?.aspirant ? (
            <>
              <span>Affiliated aspirant</span>
              <strong>{resultData.aspirant.name}</strong>
            </>
          ) : (
            <span>
              {county?.name ||
                currentUser?.county ||
                "From your account profile"}
            </span>
          )}
        </span>
      </div>
      {errors.map((error) => (
        <div className="coord-alert" role="alert" key={error}>
          <AlertCircle size={16} />
          {error}
        </div>
      ))}
      {!online && (
        <div className="coord-alert" role="status">
          You are offline. Displayed records may be out of date. Reconnect to
          send reports and refresh results.
        </div>
      )}
      <section className="coord-metrics">
        <article>
          <div>
            <span>My field reports</span>
            <FileText size={17} />
          </div>
          <strong>{myReports.length}</strong>
          <small>Reports recorded under your account</small>
        </article>
        <article>
          <div>
            <span>Open studies</span>
            <ClipboardList size={17} />
          </div>
          <strong>{research === null ? "—" : openStudies.length}</strong>
          <small>Available surveys and opinion polls</small>
        </article>
        <article>
          <div>
            <span>My collected responses</span>
            <UserRound size={17} />
          </div>
          <strong>{research === null ? "—" : responses.length}</strong>
          <small>Responses collected under your account</small>
        </article>
        <article>
          <div>
            <span>My station returns</span>
            <ShieldCheck size={17} />
          </div>
          <strong>{resultData === null ? "—" : myReturns.length}</strong>
          <small>
            {resultData === null
              ? "Result data unavailable"
              : `${myReturns.filter((r) => r.status === "Submitted").length} awaiting independent review`}
          </small>
        </article>
      </section>
      <section className="ao-work-grid">
        <article className="coord-card ao-assignment">
          <div className="coord-card-head">
            <div>
              <span className="coord-eyebrow">YOUR DUTY LOCATION</span>
              <h2>Station assignment</h2>
              <p>Location details linked to your account.</p>
            </div>
            <span className="ao-station-icon">
              <Building2 size={22} />
            </span>
          </div>
          <h3>{stationName}</h3>
          <span className="ao-station-code">
            Station code{" "}
            {station?.code ||
              currentUser?.pollingStationCode ||
              stationId ||
              "not recorded"}
          </span>
          <div className="ao-location-grid">
            {[
              ["County", county?.name || currentUser?.county],
              ["Constituency", constituency?.name || currentUser?.constituency],
              ["Ward", ward?.name || currentUser?.ward],
              [
                "Supervisor",
                currentUser?.supervisor || currentUser?.supervisorName,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value || "Not recorded"}</strong>
              </div>
            ))}
          </div>
          <div className="ao-assignment-actions">
            <button onClick={() => open("interactive_map")}>
              <MapPin size={14} />
              View electoral map <ArrowUpRight size={14} />
            </button>
            {currentUser?.supervisorPhone && (
              <a href={"tel:" + currentUser.supervisorPhone}>
                <Phone size={14} />
                Contact supervisor
              </a>
            )}
          </div>
          <p className="coord-footnote">
            If this assignment is incorrect, contact your coordinator to update
            your profile.
          </p>
        </article>
        <article className="coord-card">
          <div className="coord-card-head">
            <div>
              <span className="coord-eyebrow">FIELDWORK SHORTCUTS</span>
              <h2>What would you like to do?</h2>
              <p>Go straight to the next task.</p>
            </div>
          </div>
          <div className="ao-actions">
            {[
              {
                label: "Report an incident or update",
                text: "Record a station issue or field observation.",
                module: "field_reports",
                Icon: FileText,
              },
              {
                label: "Submit a station return",
                text: "Upload a photo or PDF and review the figures.",
                module: "tally_center",
                Icon: ShieldCheck,
              },
              {
                label: "Collect survey responses",
                text: "Open available surveys and opinion polls.",
                module: "surveys",
                Icon: ClipboardList,
              },
              {
                label: "Team mobilization",
                text: "Record your community outreach activities.",
                module: "mobilization",
                Icon: UserRound,
              },
            ].map(({ label, text, module, Icon }) => (
              <button type="button" key={module} onClick={() => open(module)}>
                <span className="ao-action-icon">
                  <Icon size={19} />
                </span>
                <div>
                  <strong>{label}</strong>
                  <span>{text}</span>
                </div>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </article>
      </section>
      <section className="coord-bottom-grid">
        <article className="coord-card">
          <div className="coord-card-head">
            <div>
              <span className="coord-eyebrow">MY RESEARCH ACTIVITY</span>
              <h2>Responses collected this week</h2>
            </div>
            <button onClick={() => open("surveys")}>
              Open research <ArrowUpRight size={14} />
            </button>
          </div>
          {research === null ? (
            <p className="coord-empty">
              Research data is unavailable. Refresh to try again.
            </p>
          ) : (
            <>
              <ResponseTrend responses={responses} />
              <p className="coord-footnote">
                Last seven days in EAT · recorded collection activity only.
              </p>
            </>
          )}
        </article>
        <article className="coord-card">
          <div className="coord-card-head">
            <div>
              <span className="coord-eyebrow">SUBMISSION PROGRESS</span>
              <h2>My station returns</h2>
            </div>
            <button onClick={() => open("tally_center")}>
              View returns <ArrowUpRight size={14} />
            </button>
          </div>
          {resultData === null ? (
            <p className="coord-empty">
              Station returns are unavailable. Refresh to try again.
            </p>
          ) : (
            <InsightRing
              label="returns"
              items={["Approved", "Submitted", "Rejected"].map((status) => ({
                label: status === "Submitted" ? "Awaiting review" : status,
                value: myReturns.filter((r) => r.status === status).length,
              }))}
            />
          )}
          <p className="coord-footnote">
            Approval is recorded only after independent review.
          </p>
        </article>
      </section>
      <section className="coord-bottom-grid">
        <article className="coord-card">
          <div className="coord-card-head">
            <div>
              <span className="coord-eyebrow">RECENT FIELDWORK</span>
              <h2>My latest reports</h2>
            </div>
            <button onClick={() => open("field_reports")}>
              All reports <ArrowUpRight size={14} />
            </button>
          </div>
          {myReports.length ? (
            <div className="ao-report-list">
              {myReports.slice(0, 5).map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => open("field_reports")}
                >
                  <span className="ao-action-icon">
                    <FileText size={17} />
                  </span>
                  <div>
                    <strong>{r.title || r.category || "Field report"}</strong>
                    <span>{dateLabel(r.createdAt || r.timestamp)}</span>
                  </div>
                  <span className="coord-badge">
                    {r.severityLevel || "Recorded"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="ao-empty">
              <FileText size={25} />
              <h3>Your fieldwork starts here</h3>
              <p>Your submitted reports will appear here.</p>
              <button onClick={() => open("field_reports")}>
                Create first report <ArrowRight size={14} />
              </button>
            </div>
          )}
        </article>
        <article className="coord-card">
          <div className="coord-card-head">
            <div>
              <span className="coord-eyebrow">AVAILABLE RESEARCH</span>
              <h2>Ready for collection</h2>
            </div>
          </div>
          {research === null ? (
            <p className="coord-empty">Research data is unavailable.</p>
          ) : openStudies.length ? (
            <div className="ao-study-list">
              {openStudies.slice(0, 4).map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => open("surveys")}
                >
                  <span className="ao-action-icon">
                    <ClipboardList size={17} />
                  </span>
                  <div>
                    <strong>{s.title}</strong>
                    <span>
                      {s.kind === "poll" ? "Opinion poll" : "Survey"} ·{" "}
                      {s.questions.length} questions
                    </span>
                  </div>
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
          ) : (
            <div className="ao-empty">
              <ClipboardList size={25} />
              <h3>No open studies yet</h3>
              <p>
                Studies will appear here when your campaign opens collection.
              </p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
};
