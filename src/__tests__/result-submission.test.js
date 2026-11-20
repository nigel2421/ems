import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import {
  parseResultText,
  validateResult,
  summarizeResults,
} from "../utils/resultMath.js";
import { handleResults } from "../../server/result-routes.mjs";
test("OCR parser reads candidate rows and totals without inventing votes", () => {
  const p = parseResultText(
    "JULIUS UMOJA 123\nOTHER PERSON 95\nRegistered voters 300\nRejected ballots 2\nTotal votes 220",
    "Julius Umoja",
  );
  assert.equal(p.matched, true);
  assert.equal(p.candidates.length, 2);
  assert.equal(p.registered, "300");
  assert.equal(parseResultText("Unreadable", "Julius").candidates.length, 0);
});
test("validation rejects blanks, duplicate names and inconsistent totals", () => {
  const d = {
    candidates: [{ name: "Aspirant", votes: "100" }],
    registered: "200",
    rejected: "2",
    total: "102",
  };
  assert.equal(validateResult(d), "");
  assert.ok(validateResult({ ...d, total: "103" }));
  assert.ok(validateResult({ ...d, registered: "99" }));
  assert.ok(
    validateResult({ ...d, candidates: [{ name: "Aspirant", votes: "" }] }),
  );
  assert.equal(summarizeResults([{ ...d, status: "Submitted" }]).approved, 0);
});
test("API binds aspirant, isolates campaigns, preserves evidence and requires independent review", async () => {
  const dir = path.resolve(".data", `result-test-${Date.now()}`);
  fs.mkdirSync(dir, { recursive: true });
  const old = process.env.USERS_FILE;
  process.env.USERS_FILE = path.join(dir, "users.json");
  fs.writeFileSync(
    process.env.USERS_FILE,
    JSON.stringify([
      { id: "a", role: "MP", name: "Julius Umoja", assignedEntity: "K" },
      { id: "b", role: "MP", name: "Other", assignedEntity: "K" },
      {
        id: "agent",
        role: "Agent",
        creatorId: "a",
        assignedEntity: "S",
        pollingStationId: "S",
      },
    ]),
  );
  const geography = {
    counties: [{ id: "C", name: "County" }],
    constituencies: [{ id: "K", name: "Const", countyId: "C" }],
    wards: [{ id: "W", name: "Ward", constituencyId: "K" }],
    pollingStations: [{ id: "S", name: "Station", wardId: "W" }],
  };
  const call = async (uid, method, body, suffix = "") => {
    const req = Readable.from(body ? [JSON.stringify(body)] : []);
    req.method = method;
    let status, data;
    await handleResults(
      req,
      {
        writeHead(v) {
          status = v;
        },
        end(v) {
          data = JSON.parse(v);
        },
      },
      {
        session: { uid },
        url: new URL("http://x/api/results" + suffix),
        geography,
      },
    );
    return { status, data };
  };
  try {
    const d = {
      stationId: "S",
      candidates: [
        { name: "Julius Umoja", votes: "100" },
        { name: "Other", votes: "50" },
      ],
      registered: "200",
      rejected: "2",
      total: "152",
      confirmed: true,
      evidence: "data:application/pdf;base64,JVBERi0xLjQ=",
      filename: "return.pdf",
    };
    assert.equal(
      (
        await call("agent", "POST", {
          ...d,
          candidates: [{ name: "Wrong", votes: 150 }],
        })
      ).status,
      400,
    );
    assert.equal(
      (await call("agent", "POST", { ...d, stationId: "outside" })).status,
      403,
    );
    assert.equal((await call("agent", "POST", d)).status, 201);
    assert.equal((await call("agent", "POST", d)).status, 409);
    const list = (await call("a", "GET")).data.results;
    assert.equal(list.length, 1);
    assert.equal(list[0].evidence, undefined);
    assert.equal((await call("b", "GET")).data.results.length, 0);
    assert.equal(
      (
        await call("agent", "PATCH", {
          id: list[0].id,
          status: "Approved",
          comment: "Checked",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await call("a", "PATCH", {
          id: list[0].id,
          status: "Approved",
          comment: "Checked source",
        })
      ).status,
      200,
    );
    assert.equal(
      (await call("a", "GET", null, "?evidence=" + list[0].id)).data.evidence,
      d.evidence,
    );
  } finally {
    if (old === undefined) delete process.env.USERS_FILE;
    else process.env.USERS_FILE = old;
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    fs.rmdirSync(dir);
  }
});
