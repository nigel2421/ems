import { test } from "node:test";
import assert from "node:assert/strict";
import { coordinatorOverview } from "../../server/coordinator-overview.mjs";

const geography = {
  counties: [{ id: "C", name: "County" }],
  constituencies: [
    { id: "K", name: "Constituency", countyId: "C" },
    { id: "OTHER", name: "Other constituency", countyId: "C" },
  ],
  wards: [
    { id: "W", name: "Ward", constituencyId: "K" },
    { id: "W2", name: "Other ward", constituencyId: "OTHER" },
  ],
  pollingStations: [
    { id: "S1", name: "Station 1", wardId: "W" },
    { id: "S2", name: "Station 2", wardId: "W" },
    { id: "S3", name: "Station 3", wardId: "W2" },
  ],
};
const root = {
  id: "root",
  name: "Aspirant",
  role: "Governor",
  assignedEntity: "C",
};
const actor = {
  id: "actor",
  name: "Constituency lead",
  role: "Constituency Coordinator",
  assignedEntity: "K",
  creatorId: "root",
};
const ward = {
  id: "ward",
  name: "Ward lead",
  role: "Ward Coordinator",
  assignedEntity: "W",
  creatorId: "actor",
};
const agent = {
  id: "agent",
  name: "Agent",
  role: "Agent",
  assignedEntity: "S1",
  creatorId: "ward",
};
test("overview counts distinct staffed stations and excludes outsiders and out-of-area descendants", () => {
  const users = [
    root,
    actor,
    ward,
    agent,
    { ...agent, id: "second", creatorId: "ward" },
    { ...agent, id: "outside", assignedEntity: "S3" },
    { ...root, id: "otherRoot" },
    { ...actor, id: "otherActor", creatorId: "otherRoot" },
    { ...agent, id: "otherAgent", creatorId: "otherActor" },
  ];
  const result = coordinatorOverview(actor, users, geography);
  assert.equal(result.stations, 2);
  assert.equal(result.covered, 1);
  assert.equal(result.team.length, 3);
  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].covered, 1);
  assert.equal(result.groups[0].stations, 2);
  assert.equal(result.team.find((u) => u.id === "ward").direct, true);
  assert.equal(result.team.find((u) => u.id === "agent").direct, false);
  assert.ok(
    result.team.every((u) => !("email" in u) && !("passwordHash" in u)),
  );
});
test("inactive supervisors disable subordinate coverage", () => {
  const result = coordinatorOverview(
    actor,
    [root, actor, { ...ward, status: "Inactive" }, agent],
    geography,
  );
  assert.equal(result.covered, 0);
  assert.ok(result.team.every((u) => !u.enabled));
});
test("missing affiliation, inactive actor and unconfigured geography fail closed", () => {
  assert.throws(
    () =>
      coordinatorOverview(
        { ...actor, creatorId: "missing" },
        [root, ward, agent],
        geography,
      ),
    /affiliated/,
  );
  assert.throws(
    () =>
      coordinatorOverview(
        { ...actor, status: "Inactive" },
        [root, actor, ward, agent],
        geography,
      ),
    /active/,
  );
  assert.throws(
    () =>
      coordinatorOverview(
        { ...actor, assignedEntity: "missing" },
        [root, actor, ward, agent],
        geography,
      ),
    /assignment/,
  );
});
test("national and county views group coverage at the next geographic level", () => {
  const countyView = coordinatorOverview(
    root,
    [root, actor, ward, agent],
    geography,
  );
  assert.equal(countyView.groupLevel, "constituency");
  assert.equal(countyView.groups.length, 2);
  const president = { id: "pres", name: "President", role: "Presidential" },
    national = {
      id: "national",
      role: "National Coordinator",
      creatorId: "pres",
    };
  const nationalView = coordinatorOverview(
    national,
    [
      president,
      national,
      { ...root, role: "County Coordinator", creatorId: "national" },
      actor,
      ward,
      agent,
    ],
    geography,
  );
  assert.equal(nationalView.groupLevel, "county");
  assert.equal(nationalView.stations, 3);
  assert.equal(nationalView.covered, 1);
});
