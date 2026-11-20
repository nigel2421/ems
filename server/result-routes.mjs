import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadUsers, getUsersFilePath } from "./users.store.js";
import {
  campaignRoot,
  isTeamAccountActive,
  teamScope,
  isLocationInScope,
  isStationAgent,
} from "../src/utils/teamHierarchy.js";
import { validateResult, normalizeName } from "../src/utils/resultMath.js";
const fail = (status, message) => Object.assign(new Error(message), { status });
export async function handleResults(req, res, ctx) {
  const send = (status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  try {
    const users = loadUsers(),
      actor = users.find((u) => u.id === ctx.session?.uid),
      root = campaignRoot(actor, users);
    if (!root || !isTeamAccountActive(actor, users))
      throw fail(403, "An active affiliated campaign account is required.");
    const scope = teamScope(actor, ctx.geography),
      g = ctx.geography;
    const index = (key) => new Map(g[key].map((x) => [x.id, x]));
    const stations = index("pollingStations"),
      wards = index("wards"),
      constituencies = index("constituencies"),
      counties = index("counties");
    const location = (id) => {
      const station = stations.get(id),
        ward = wards.get(station?.wardId),
        constituency = constituencies.get(ward?.constituencyId),
        county = counties.get(constituency?.countyId);
      return { station, ward, constituency, county };
    };
    const visible = (r) =>
      r.campaignId === root.id &&
      isLocationInScope(scope, location(r.stationId));
    const file = path.join(path.dirname(getUsersFilePath()), "results.json");
    let rows = [];
    try {
      rows = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    const present = (r) => ({
      ...r,
      evidence: undefined,
      canReview: r.submittedBy !== actor.id && !isStationAgent(actor),
    });
    if (req.method === "GET" && ctx.url.searchParams.has("evidence")) {
      const r = rows.find(
        (r) => r.id === ctx.url.searchParams.get("evidence") && visible(r),
      );
      if (!r) throw fail(404, "Document unavailable.");
      send(200, { evidence: r.evidence });
      return;
    }
    if (req.method === "GET") {
      send(200, {
        aspirant: { id: root.id, name: root.name, role: root.role },
        results: rows.filter(visible).map(present),
        stations: g.pollingStations.filter((s) =>
          isLocationInScope(scope, location(s.id)),
        ),
      });
      return;
    }
    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 7500000)
        throw fail(413, "Upload a file smaller than 5 MB.");
    }
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      throw fail(400, "Invalid request.");
    }
    const save = () => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file + ".tmp", JSON.stringify(rows));
      fs.renameSync(file + ".tmp", file);
    };
    if (req.method === "PATCH") {
      const r = rows.find((r) => r.id === body.id && visible(r));
      if (!r) throw fail(404, "Result unavailable.");
      if (r.submittedBy === actor.id || isStationAgent(actor))
        throw fail(
          403,
          "A different campaign supervisor must review this result.",
        );
      if (
        !["Approved", "Rejected"].includes(body.status) ||
        r.status !== "Submitted" ||
        !body.comment?.trim()
      )
        throw fail(400, "Review a pending result and provide a comment.");
      r.status = body.status;
      r.review = {
        by: actor.id,
        at: new Date().toISOString(),
        comment: body.comment.slice(0, 1000),
      };
      save();
      send(200, { success: true });
      return;
    }
    if (req.method !== "POST") throw fail(405, "Unavailable operation.");
    if (!isLocationInScope(scope, location(body.stationId)))
      throw fail(403, "Choose a station within your assigned area.");
    if (
      !Array.isArray(body.candidates) ||
      body.candidates.length > 30 ||
      normalizeName(body.candidates[0]?.name) !== normalizeName(root.name)
    )
      throw fail(400, "Candidate A must be your affiliated aspirant.");
    const problem = validateResult(body);
    if (problem) throw fail(400, problem);
    if (!body.confirmed)
      throw fail(400, "Confirm the figures against the source document.");
    const evidence = String(body.evidence || "");
    const match = evidence.match(
      /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/,
    );
    if (!match) throw fail(400, "Attach a JPEG, PNG, WebP or PDF.");
    const bytes = Buffer.from(match[2], "base64");
    if (!bytes.length || bytes.length > 5 * 1024 * 1024)
      throw fail(413, "File must be smaller than 5 MB.");
    const hash = crypto.createHash("sha256").update(bytes).digest("hex");
    if (
      rows.some(
        (r) =>
          r.campaignId === root.id &&
          r.status !== "Rejected" &&
          (r.stationId === body.stationId || r.hash === hash),
      )
    )
      throw fail(409, "A result for this station or document already exists.");
    rows.unshift({
      id: crypto.randomUUID(),
      campaignId: root.id,
      stationId: body.stationId,
      stationName: location(body.stationId).station.name,
      candidates: body.candidates.map((c, i) => ({
        name: i === 0 ? root.name : String(c.name).trim().slice(0, 150),
        votes: Number(c.votes),
      })),
      registered: Number(body.registered),
      rejected: Number(body.rejected),
      total: Number(body.total),
      evidence,
      hash,
      filename: String(body.filename || "Document").slice(0, 150),
      status: "Submitted",
      submittedBy: actor.id,
      submittedAt: new Date().toISOString(),
    });
    save();
    send(201, { success: true });
  } catch (e) {
    send(e.status || 500, {
      error: e.status ? e.message : "Unable to process results.",
    });
  }
}
