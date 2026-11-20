import { InsightBars, InsightRing } from "../common/InsightCharts";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { AddAgentModal } from "./AddAgentModal";
import { CoordinatorAssignment } from "./CoordinatorAssignment";
import { resolveCoordinatorStationAssignment } from "../../utils/coordinatorAssignment";

import {
  Users,
  Search,
  UserPlus,
  MapPin,
  ArrowUpRight,
  ArrowLeft,
  Download,
  SlidersHorizontal,
  Building2,
  AlertCircle,
  Activity,
  Phone,
  X,
  FileText,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Key,
} from "lucide-react";
import "../dashboards/DashboardShared.css";
import "./AgentManagement.css";

const PAGE_SIZE = 20;
const formatCount = (value) => Number(value || 0).toLocaleString("en-KE");

export const AgentManagement = ({ onClose }) => {
  const {
    currentUser,
    users = [],
    getAccountLockState,
    unlockAccount,
  } = useAuth();
  const {
    agents,
    geography,
    assignAgentToPollingStation,
    updateAgentStatus,
    getScopedAgents,
  } = useData();

  const [teamType, setTeamType] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [coordinatorAccounts, setCoordinatorAccounts] = useState([]);
  const [directoryError, setDirectoryError] = useState("");
  const dialogRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedAgentForAssign, setSelectedAgentForAssign] = useState(null);
  const [targetPsId, setTargetPsId] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");
  const [viewingActivityAgent, setViewingActivityAgent] = useState(null);
  const handleOpenAssignModal = (agent) => {
    setSelectedAgentForAssign(agent);
    setTargetPsId("");
    setAssignSuccess("");
  };

  useEffect(() => {
    let active = true;
    setCoordinatorAccounts([]);
    setDirectoryError("");
    if (["Admin", "Super Admin"].includes(currentUser?.role)) return;
    fetch("/api/coordinator-overview", { credentials: "include" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        return data;
      })
      .then((data) => {
        if (active)
          setCoordinatorAccounts(
            data.team
              .filter((u) => /coordinator/i.test(u.role))
              .map((u) => ({
                ...u,
                fullName: u.name,
                region: u.area,
                status: u.enabled ? "Active" : "Inactive",
                overviewOnly: true,
              })),
          );
      })
      .catch((e) => {
        if (active)
          setDirectoryError(e.message || "Coordinator overview unavailable.");
      });
    return () => {
      active = false;
    };
  }, [currentUser?.id, currentUser?.role]);
  const scopedAgents = useMemo(() => {
    const list = getScopedAgents
      ? getScopedAgents(currentUser, agents)
      : agents;
    const map = new Map(list.map((a) => [a.id, a]));
    if (["Admin", "Super Admin"].includes(currentUser?.role))
      for (const u of users.filter((u) => /coordinator/i.test(u.role)))
        if (!map.has(u.id))
          map.set(u.id, {
            ...u,
            fullName: u.name,
            region: u.entityName || u.region,
            status: u.isSuspended ? "Suspended" : u.status || "Active",
            overviewOnly: true,
          });
    for (const coordinator of coordinatorAccounts)
      if (!map.has(coordinator.id)) map.set(coordinator.id, coordinator);
    return [...map.values()];
  }, [currentUser, agents, getScopedAgents, coordinatorAccounts, users]);
  const stationIndex = useMemo(
    () => new Map((geography?.pollingStations || []).map((s) => [s.id, s])),
    [geography],
  );
  const stationIds = (a) => [
    ...new Set(
      [
        ...(Array.isArray(a.assignedStations) ? a.assignedStations : []),
        a.pollingStationId,
      ].filter((id) => stationIndex.has(id)),
    ),
  ];
  const isCoordinator = (a) => /coordinator/i.test(a.role || "");
  const roleLabel = (a) => a.role || "Field team";
  const areaLabel = (a) =>
    a.region ||
    a.entityName ||
    [a.ward, a.constituency, a.county].filter(Boolean).join(", ") ||
    "Area not recorded";
  const isActive = (a) => ["Active", "On Duty"].includes(a.status);
  const needsAssignment = (a) => !a.overviewOnly && !stationIds(a).length;
  const reportCount = (a) => Number(a.reportsSubmittedCount) || 0;
  const surveyCount = (a) => Number(a.surveysCompletedCount) || 0;
  const dateLabel = (value) => {
    const date = new Date(value);
    return value && !Number.isNaN(date.getTime())
      ? date.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })
      : "Not recorded";
  };
  useEffect(() => {
    if (!selectedAgentForAssign && !viewingActivityAgent) return;
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector("button")?.focus();
    const key = (e) => {
      if (e.key === "Escape") {
        setSelectedAgentForAssign(null);
        setViewingActivityAgent(null);
      }
      if (e.key === "Tab" && dialog) {
        const items = [
          ...dialog.querySelectorAll(
            'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
          ),
        ].filter((x) => x.getClientRects().length);
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [selectedAgentForAssign, viewingActivityAgent]);

  const filteredAgents = scopedAgents
    .filter((a) => {
      const term = searchTerm.trim().toLowerCase();
      return (
        (!term ||
          `${a.fullName || a.name} ${a.phone || ""} ${areaLabel(a)} ${roleLabel(a)}`
            .toLowerCase()
            .includes(term)) &&
        (!statusFilter || a.status === statusFilter) &&
        (teamType === "all" ||
          (teamType === "coordinators"
            ? isCoordinator(a)
            : !isCoordinator(a))) &&
        (!assignmentFilter ||
          (assignmentFilter === "assigned"
            ? stationIds(a).length > 0
            : needsAssignment(a)))
      );
    })
    .sort((a, b) =>
      sortBy === "activity"
        ? reportCount(b) + surveyCount(b) - (reportCount(a) + surveyCount(a))
        : sortBy === "assignment"
          ? Number(needsAssignment(b)) - Number(needsAssignment(a))
          : String(a.fullName || a.name || "").localeCompare(
              String(b.fullName || b.name || ""),
            ),
    );
  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, teamType, assignmentFilter, sortBy]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageAgents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAgents.slice(start, start + PAGE_SIZE);
  }, [filteredAgents, page]);

  const rangeStart =
    filteredAgents.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredAgents.length);

  const activeCount = scopedAgents.filter(isActive).length;
  const boundCount = scopedAgents.filter((a) => stationIds(a).length).length;
  const unassignedCount = scopedAgents.filter(needsAssignment).length;
  const coordinators = scopedAgents.filter(isCoordinator).length;
  const stationCount = new Set(scopedAgents.flatMap(stationIds)).size;
  const totalReports = scopedAgents.reduce((n, a) => n + reportCount(a), 0);
  const totalSurveys = scopedAgents.reduce((n, a) => n + surveyCount(a), 0);
  const exportRoster = () => {
    const cell = (v) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@-]/, "'$&")
        .replace(/"/g, '""') +
      '"';
    const csv = [
      [
        "Name",
        "Role",
        "Assigned area",
        "Status",
        "Stations",
        "Reports",
        "Surveys",
      ],
      ...filteredAgents.map((a) => [
        a.fullName || a.name,
        roleLabel(a),
        areaLabel(a),
        a.status || "Not recorded",
        stationIds(a)
          .map((id) => stationIndex.get(id)?.name)
          .join("; "),
        reportCount(a),
        surveyCount(a),
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "team-directory.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setTeamType("all");
    setAssignmentFilter("");
  };
  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!selectedAgentForAssign || !targetPsId) return;
    if (
      !resolveCoordinatorStationAssignment(currentUser, geography, targetPsId)
        .complete
    )
      return;
    assignAgentToPollingStation(
      selectedAgentForAssign.id,
      targetPsId,
      currentUser,
    );
    setAssignSuccess(
      `Bound station to ${selectedAgentForAssign.fullName || selectedAgentForAssign.name}.`,
    );
    setTimeout(() => {
      setAssignSuccess("");
      setSelectedAgentForAssign(null);
    }, 2000);
  };

  const statusClass = (status) => {
    const key = String(status || "")
      .toLowerCase()
      .replace(/\s+/g, "-");
    if (key === "active" || key === "on-duty")
      return "agm-status agm-status-active";
    if (key === "inactive") return "agm-status agm-status-inactive";
    return "agm-status agm-status-offline";
  };

  return (
    <div className="role-dash agm-shell">
      <header className="agm-overview-head">
        <div>
          <span className="agm-eyebrow">
            <i />
            FIELD OPERATIONS / PEOPLE
          </span>
          <h1>Agents & coordinators</h1>
          <p>
            Your field network, assignments, and recorded activity in one place.
          </p>
        </div>
        <div className="agm-head-actions">
          {onClose && (
            <button type="button" className="agm-button" onClick={onClose}>
              <ArrowLeft size={15} />
              Dashboard
            </button>
          )}
          <button
            type="button"
            className="agm-button agm-button-primary"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus size={16} />
            Add coordinator
          </button>
        </div>
      </header>
      <div className="agm-context">
        <span>
          <MapPin size={15} />
          <strong>
            {currentUser?.entityName ||
              currentUser?.ward ||
              currentUser?.constituency ||
              currentUser?.county ||
              "Your permitted team"}
          </strong>
        </span>
        <span>
          {currentUser?.role} <span className="agm-context-dot">·</span> Team
          overview
        </span>
      </div>
      {directoryError && (
        <div className="agm-inline-alert" role="status">
          <AlertCircle size={15} />
          Coordinator accounts could not be loaded. Showing available field
          records.{" "}
          <button
            type="button"
            title={directoryError}
            onClick={() => setDirectoryError("")}
          >
            Dismiss
          </button>
        </div>
      )}
      <section className="agm-overview-metrics">
        <article>
          <div>
            <span>Team members</span>
            <Users size={17} />
          </div>
          <strong>{formatCount(scopedAgents.length)}</strong>
          <small>
            {formatCount(coordinators)} coordinators ·{" "}
            {formatCount(scopedAgents.length - coordinators)} field members
          </small>
        </article>
        <article>
          <div>
            <span>Active / on duty</span>
            <ShieldCheck size={17} />
          </div>
          <strong>{formatCount(activeCount)}</strong>
          <small>
            Recorded status · {formatCount(scopedAgents.length - activeCount)}{" "}
            other statuses
          </small>
        </article>
        <article>
          <div>
            <span>Station assignments</span>
            <MapPin size={17} />
          </div>
          <strong>{formatCount(boundCount)}</strong>
          <small>
            Members assigned across {formatCount(stationCount)} distinct
            stations
          </small>
        </article>
        <article>
          <div>
            <span>Recorded field reports</span>
            <FileText size={17} />
          </div>
          <strong>{formatCount(totalReports)}</strong>
          <small>{formatCount(totalSurveys)} survey completions recorded</small>
        </article>
      </section>
      <section className="agm-overview-insights">
        <article className="agm-panel">
          <div className="agm-panel-heading">
            <div>
              <span className="agm-eyebrow">TEAM AVAILABILITY</span>
              <h2>A clear view of team status</h2>
            </div>
            <span className="agm-soft-tag">Recorded accounts</span>
          </div>
          <InsightRing
            label="members"
            items={[
              { label: "Active / on duty", value: activeCount },
              {
                label: "Inactive / suspended",
                value: scopedAgents.filter((a) =>
                  ["Inactive", "Suspended"].includes(a.status),
                ).length,
              },
              {
                label: "Offline / other",
                value: scopedAgents.filter(
                  (a) =>
                    !isActive(a) &&
                    !["Inactive", "Suspended"].includes(a.status),
                ).length,
              },
            ]}
          />
        </article>
        <article className="agm-panel">
          <div className="agm-panel-heading">
            <div>
              <span className="agm-eyebrow">ASSIGNMENT READINESS</span>
              <h2>Give every field member a station</h2>
            </div>
            <Building2 size={20} />
          </div>
          <InsightBars
            items={[
              { label: "With station assignments", value: boundCount },
              { label: "Needs a station assignment", value: unassignedCount },
            ]}
          />
          <div className="agm-insight-footer">
            <p>
              Assignments are matched to the electoral geography. They do not
              indicate a live check-in.
            </p>
            <button
              type="button"
              className="agm-link"
              onClick={() => {
                setAssignmentFilter("unassigned");
                setTeamType("all");
                document
                  .getElementById("agm-directory")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Review unassigned <ArrowUpRight size={15} />
            </button>
          </div>
        </article>
      </section>
      <article className="agm-panel agm-directory" id="agm-directory">
        <div className="agm-directory-heading">
          <div>
            <span className="agm-eyebrow">PEOPLE & RESPONSIBILITIES</span>
            <h2>
              Team directory{" "}
              <span className="agm-count">{scopedAgents.length}</span>
            </h2>
            <p>
              Find a team member, review their activity, or update their
              assignment.
            </p>
          </div>
          <button
            type="button"
            className="agm-button"
            onClick={exportRoster}
            disabled={!filteredAgents.length}
          >
            <Download size={15} />
            Export directory
          </button>
        </div>
        <div
          className="agm-directory-tabs"
          role="group"
          aria-label="Team member type"
        >
          {[
            ["all", "All members", scopedAgents.length],
            ["coordinators", "Coordinators", coordinators],
            ["agents", "Field agents", scopedAgents.length - coordinators],
          ].map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              aria-pressed={teamType === value}
              onClick={() => setTeamType(value)}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <div className="agm-toolbar">
          <label className="agm-directory-search">
            <Search size={17} />
            <input
              type="search"
              aria-label="Search team directory"
              placeholder="Search name, phone, role or assigned area"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          <div className="agm-filter-controls">
            <SlidersHorizontal size={15} />
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {["Active", "On Duty", "Inactive", "Offline", "Suspended"].map(
                (status) => (
                  <option key={status}>{status}</option>
                ),
              )}
            </select>
            <select
              aria-label="Filter by assignment"
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
            >
              <option value="">All assignments</option>
              <option value="assigned">Station assigned</option>
              <option value="unassigned">Needs assignment</option>
            </select>
            <select
              aria-label="Sort team directory"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Name A–Z</option>
              <option value="activity">Most recorded activity</option>
              <option value="assignment">Unassigned first</option>
            </select>
          </div>
        </div>
        <div className="agm-result-summary">
          <span>{formatCount(filteredAgents.length)} matching members</span>
          {(searchTerm ||
            statusFilter ||
            assignmentFilter ||
            teamType !== "all") && (
            <button type="button" className="agm-link" onClick={resetFilters}>
              Clear filters
            </button>
          )}
        </div>
        <div className="agm-directory-table">
          <table>
            <thead>
              <tr>
                <th>Team member</th>
                <th>Assigned area & stations</th>
                <th>Account status</th>
                <th>Recorded activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageAgents.map((ag) => (
                <tr key={ag.id}>
                  <td data-label="Team member">
                    <div className="agm-person">
                      <span className="agm-avatar">
                        {(ag.fullName || ag.name || "?")
                          .split(" ")
                          .filter(Boolean)
                          .map((v) => v[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <div>
                        <strong>
                          {ag.fullName || ag.name || "Unnamed member"}
                        </strong>
                        <span className="agm-role-label">{roleLabel(ag)}</span>
                        {ag.phone && (
                          <a
                            className="agm-person-phone"
                            href={"tel:" + ag.phone}
                          >
                            <Phone size={11} />
                            {ag.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td data-label="Assignment">
                    <strong className="agm-area-label">{areaLabel(ag)}</strong>
                    {stationIds(ag).length ? (
                      <span
                        className="agm-station-info"
                        title={stationIds(ag)
                          .map((id) => stationIndex.get(id)?.name)
                          .join(", ")}
                      >
                        <MapPin size={12} />
                        {stationIds(ag).length === 1
                          ? stationIndex.get(stationIds(ag)[0])?.name
                          : `${stationIds(ag).length} assigned stations`}
                      </span>
                    ) : (
                      <span
                        className={
                          "agm-assignment-label " +
                          (ag.overviewOnly ? "" : "is-missing")
                        }
                      >
                        {ag.overviewOnly
                          ? "Geographic coordination role"
                          : "No station assigned"}
                      </span>
                    )}
                    <span className="agm-supervisor">
                      {ag.supervisor ? "Reports to " + ag.supervisor : ""}
                    </span>
                  </td>
                  <td data-label="Status">
                    {ag.overviewOnly ? (
                      <span className={statusClass(ag.status)}>
                        {ag.status === "Active" ? "Enabled" : "Inactive"}
                      </span>
                    ) : (
                      <select
                        className={
                          "agm-state-select " +
                          (isActive(ag) ? "is-active" : "")
                        }
                        aria-label={`Status for ${ag.fullName || ag.name}`}
                        value={ag.status || ""}
                        onChange={(e) =>
                          updateAgentStatus(ag.id, e.target.value, currentUser)
                        }
                      >
                        {!ag.status && <option value="">Not recorded</option>}
                        {[
                          "Active",
                          "On Duty",
                          "Inactive",
                          "Offline",
                          "Suspended",
                        ].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td data-label="Activity">
                    {ag.overviewOnly ? (
                      <span className="agm-not-recorded">
                        View account details
                      </span>
                    ) : (
                      <div className="agm-recorded-activity">
                        <span>
                          <FileText size={13} />
                          <strong>{reportCount(ag)}</strong> reports
                        </span>
                        <span>
                          <ClipboardList size={13} />
                          <strong>{surveyCount(ag)}</strong> surveys
                        </span>
                      </div>
                    )}
                  </td>
                  <td data-label="Actions">
                    <div className="agm-member-actions">
                      {!ag.overviewOnly &&
                        ag.email &&
                        getAccountLockState?.(ag.email)?.locked && (
                          <button
                            type="button"
                            className="agm-button agm-unlock"
                            onClick={() => unlockAccount(ag.email)}
                          >
                            <Key size={13} />
                            Unlock
                          </button>
                        )}
                      {!ag.overviewOnly && (
                        <button
                          type="button"
                          className="agm-button agm-assign"
                          onClick={() => handleOpenAssignModal(ag)}
                        >
                          <MapPin size={13} />
                          {stationIds(ag).length ? "Assignments" : "Assign"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="agm-button"
                        aria-label={`View details for ${ag.fullName || ag.name}`}
                        onClick={() => setViewingActivityAgent(ag)}
                      >
                        <ArrowUpRight size={15} />
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pageAgents.length && (
            <div className="agm-directory-empty">
              <span>
                <Users size={28} />
              </span>
              <h3>
                {scopedAgents.length
                  ? "No members match your filters"
                  : "Build your field network"}
              </h3>
              <p>
                {scopedAgents.length
                  ? "Try a different search, status, or assignment filter."
                  : "Add your first coordinator to organize fieldwork and station reporting."}
              </p>
              <button
                type="button"
                className="agm-button"
                onClick={
                  scopedAgents.length
                    ? resetFilters
                    : () => setShowAddModal(true)
                }
              >
                {scopedAgents.length ? "Clear filters" : "Add coordinator"}
                <ArrowUpRight size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="agm-directory-pagination">
          <span>
            Showing {rangeStart}–{rangeEnd} of{" "}
            {formatCount(filteredAgents.length)} members
          </span>
          <div>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="agm-button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="agm-button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </article>

      {selectedAgentForAssign && (
        <div
          className="agm-modal-overlay"
          onClick={() => setSelectedAgentForAssign(null)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="agm-assignment-title"
            className="agm-modal coordinator-bind-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="agm-modal-head">
              <div>
                <h3 id="agm-assignment-title">Assign polling station</h3>
                <p>
                  {selectedAgentForAssign.fullName ||
                    selectedAgentForAssign.name}
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-ghost agm-icon-btn"
                onClick={() => setSelectedAgentForAssign(null)}
                aria-label="Close"
              >
                <X strokeWidth={1.75} />
              </button>
            </div>

            {assignSuccess && <div className="agm-notice">{assignSuccess}</div>}

            <form onSubmit={handleAssignSubmit} className="agm-form">
              <CoordinatorAssignment
                user={currentUser}
                geography={geography}
                onSelectionChange={(sel) =>
                  setTargetPsId(sel.complete ? sel.pollingStationId : "")
                }
              />

              <button
                type="submit"
                disabled={!targetPsId}
                className="admin-btn admin-btn-primary"
                style={{ width: "100%", height: 46 }}
              >
                <UserCheck strokeWidth={1.75} />
                Confirm assignment
              </button>
            </form>
          </div>
        </div>
      )}

      {viewingActivityAgent && (
        <div
          className="agm-modal-overlay"
          onClick={() => setViewingActivityAgent(null)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="agm-details-title"
            className="agm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="agm-modal-head">
              <div>
                <h3 id="agm-details-title">Team member details</h3>
                <p>
                  {viewingActivityAgent.fullName || viewingActivityAgent.name}
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-ghost agm-icon-btn"
                onClick={() => setViewingActivityAgent(null)}
                aria-label="Close"
              >
                <X strokeWidth={1.75} />
              </button>
            </div>

            <div className="admin-list">
              <div className="admin-list-item">
                <div className="admin-metric-icon">
                  <ShieldCheck strokeWidth={1.75} />
                </div>
                <div>
                  <strong>Status</strong>
                  <span className={statusClass(viewingActivityAgent.status)}>
                    {viewingActivityAgent.status}
                  </span>
                </div>
              </div>
              <div className="admin-list-item">
                <div className="admin-metric-icon">
                  <UserCheck strokeWidth={1.75} />
                </div>
                <div>
                  <strong>Supervisor</strong>
                  <span>
                    {viewingActivityAgent.supervisor || "Not recorded"}
                  </span>
                </div>
              </div>
              <div className="admin-list-item">
                <div className="admin-metric-icon">
                  <Activity strokeWidth={1.75} />
                </div>
                <div>
                  <strong>Last active</strong>
                  <span>
                    {dateLabel(viewingActivityAgent.lastActivityTimestamp)}
                  </span>
                </div>
              </div>
              <div className="admin-list-item">
                <div className="admin-metric-icon">
                  <FileText strokeWidth={1.75} />
                </div>
                <div>
                  <strong>Reports submitted</strong>
                  <span>
                    {viewingActivityAgent.overviewOnly
                      ? "Not recorded"
                      : viewingActivityAgent.reportsSubmittedCount || 0}
                  </span>
                </div>
              </div>
              <div className="admin-list-item">
                <div className="admin-metric-icon">
                  <ClipboardList strokeWidth={1.75} />
                </div>
                <div>
                  <strong>Surveys completed</strong>
                  <span>
                    {viewingActivityAgent.overviewOnly
                      ? "Not recorded"
                      : viewingActivityAgent.surveysCompletedCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddAgentModal
          defaultAspirantId={currentUser?.id}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};
