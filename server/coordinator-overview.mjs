import { loadUsers } from "./users.store.js";
import {
  campaignRoot,
  isDescendant,
  isTeamAccountActive,
  isLocationInScope,
  isStationAgent,
  teamScope,
} from "../src/utils/teamHierarchy.js";

export function coordinatorOverview(actor, users, geography) {
  const root = campaignRoot(actor, users),
    scope = teamScope(actor, geography);
  if (!root || !isTeamAccountActive(actor, users))
    throw Object.assign(
      new Error("Your account needs an active affiliated aspirant."),
      { status: 403 },
    );
  if (!scope.isConfigured || scope.failClosed)
    throw Object.assign(
      new Error(
        "Your electoral assignment must be configured to view this dashboard.",
      ),
      { status: 403 },
    );
  const index = (key) => new Map((geography[key] || []).map((x) => [x.id, x]));
  const wards = index("wards"),
    constituencies = index("constituencies"),
    counties = index("counties");
  const locations = (geography.pollingStations || [])
    .map((station) => {
      const ward = wards.get(station.wardId),
        constituency = constituencies.get(ward?.constituencyId),
        county = counties.get(constituency?.countyId);
      return { station, ward, constituency, county };
    })
    .filter((x) => isLocationInScope(scope, x));
  const stationIds = new Set(locations.map((x) => x.station.id));
  const team = users
    .filter((u) => isDescendant(actor, u, users))
    .filter((u) => isLocationInScope(scope, teamScope(u, geography)));
  const enabled = (u) => isTeamAccountActive(u, users);
  const agents = team.filter(isStationAgent),
    assigned = new Set(
      agents
        .filter(enabled)
        .map((u) => u.pollingStationId || u.assignedEntity)
        .filter((id) => stationIds.has(id)),
    );
  const groupKey =
    scope.level === "NATIONAL"
      ? "county"
      : scope.level === "COUNTY"
        ? "constituency"
        : scope.level === "CONSTITUENCY"
          ? "ward"
          : "station";
  const groups = new Map();
  for (const location of locations) {
    const entity = location[groupKey];
    if (!entity) continue;
    if (!groups.has(entity.id))
      groups.set(entity.id, {
        id: entity.id,
        name: entity.name,
        stations: 0,
        covered: 0,
      });
    const group = groups.get(entity.id);
    group.stations++;
    if (assigned.has(location.station.id)) group.covered++;
  }
  return {
    aspirant: { id: root.id, name: root.name, role: root.role },
    scope: {
      level: scope.level,
      name:
        scope.station?.name ||
        scope.ward?.name ||
        scope.constituency?.name ||
        scope.county?.name ||
        "National campaign",
    },
    stations: locations.length,
    covered: assigned.size,
    groupLevel: groupKey,
    groups: [...groups.values()],
    team: team.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      area:
        u.entityName ||
        u.pollingStationName ||
        u.ward ||
        u.constituency ||
        u.county ||
        "Assignment configured",
      enabled: enabled(u),
      direct:
        [
          u.parentId,
          u.supervisorId,
          u.creatorId,
          u.candidateId,
          u.aspirantId,
        ].find(Boolean) === actor.id,
    })),
    generatedAt: new Date().toISOString(),
  };
}

export function handleCoordinatorOverview(req, res, ctx) {
  const send = (status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  try {
    if (req.method !== "GET") {
      send(405, { error: "Read only endpoint." });
      return;
    }
    const users = loadUsers(),
      actor = users.find((u) => u.id === ctx.session?.uid);
    if (!actor) {
      send(403, { error: "Sign in to view your coordination dashboard." });
      return;
    }
    send(200, coordinatorOverview(actor, users, ctx.geography));
  } catch (e) {
    send(e.status || 500, {
      error: e.status ? e.message : "Unable to load coordination overview.",
    });
  }
}
