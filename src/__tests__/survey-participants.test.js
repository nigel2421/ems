import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { handleSurveys } from "../../server/survey-routes.mjs";

test("participant links support public collection without exposing campaign data or bypassing study state", async () => {
  const dir = path.resolve(".data", `participants-test-${Date.now()}`),
    old = process.env.USERS_FILE;
  fs.mkdirSync(dir, { recursive: true });
  process.env.USERS_FILE = path.join(dir, "users.json");
  fs.writeFileSync(
    process.env.USERS_FILE,
    JSON.stringify([
      { id: "owner", name: "Organizer", role: "MP", assignedEntity: "K" },
      { id: "other", name: "Other campaign", role: "MP", assignedEntity: "K" },
      { id: "agent", name: "Collector", role: "Agent", creatorId: "owner" },
    ]),
  );
  const geography = {
    counties: [{ id: "C", name: "County" }],
    constituencies: [{ id: "K", name: "Constituency", countyId: "C" }],
    wards: [],
  };
  const call = async (uid, method, suffix = "", body) => {
    const req = Readable.from(body ? [JSON.stringify(body)] : []);
    req.method = method;
    let status, data;
    await handleSurveys(
      req,
      {
        writeHead(s) {
          status = s;
        },
        end(s) {
          data = JSON.parse(s);
        },
      },
      {
        session: uid ? { uid } : null,
        url: new URL("http://x/api/surveys" + suffix),
        geography,
      },
    );
    return { status, data };
  };
  const questions = [
    {
      id: "q",
      text: "Priorities?",
      type: "multi",
      required: true,
      options: ["Water", "Roads", "Schools"],
    },
  ];
  try {
    const made = await call("owner", "POST", "", {
      title: "Community priorities",
      population: "Adults",
      method: "Online",
      sampling: "feedback",
      questions,
    });
    assert.equal(made.status, 201);
    assert.match(
      made.data.survey.participantPath,
      /^\/\?participate=[a-f0-9]{64}$/,
    );
    assert.equal(made.data.survey.participantToken, undefined);
    const id = made.data.survey.id,
      token = made.data.survey.participantPath.split("=")[1],
      publicPath = "/participate/" + token;
    const draft = await call(null, "GET", publicPath);
    assert.equal(draft.status, 200);
    assert.equal(draft.data.survey.status, "Draft");
    assert.deepEqual(draft.data.survey.questions, []);
    const answer = {
      respondentId: "12345678-1234-1234-1234-123456789012",
      answers: { q: ["Water", "Schools"] },
      consent: true,
    };
    assert.equal((await call(null, "POST", publicPath, answer)).status, 400);
    assert.equal(
      (await call("other", "PATCH", "/" + id + "/share", {})).status,
      404,
    );
    assert.equal(
      (await call("agent", "PATCH", "/" + id + "/share", {})).status,
      403,
    );
    assert.equal(
      (await call("agent", "GET")).data.surveys[0].participantPath,
      null,
    );
    await call("owner", "PATCH", "/" + id, { status: "Open" });
    const publicStudy = (await call(null, "GET", publicPath)).data.survey;
    assert.deepEqual(
      Object.keys(publicStudy).sort(),
      ["title", "kind", "status", "sampling", "questions"].sort(),
    );
    assert.equal(publicStudy.questions[0].options.length, 3);
    assert.equal(
      (await call(null, "POST", publicPath, { ...answer, consent: false }))
        .status,
      400,
    );
    assert.equal(
      (
        await call(null, "POST", publicPath, {
          ...answer,
          answers: { q: ["Invented"] },
        })
      ).status,
      400,
    );
    assert.equal(
      (await call(null, "POST", publicPath, { ...answer, answers: {} })).status,
      400,
    );
    assert.equal((await call(null, "POST", publicPath, answer)).status, 201);
    assert.equal((await call(null, "POST", publicPath, answer)).status, 409);
    const saved = (await call("owner", "GET")).data.surveys[0];
    assert.equal(saved.responses.length, 1);
    assert.equal(saved.responses[0].source, "participant");
    assert.deepEqual(saved.responses[0].answers.q, ["Water", "Schools"]);
    assert.equal(
      (await call(null, "GET", "/participate/" + "0".repeat(64))).status,
      404,
    );
    await call("owner", "PATCH", "/" + id, { status: "Closed" });
    assert.equal(
      (
        await call(null, "POST", publicPath, {
          ...answer,
          respondentId: "22345678-1234-1234-1234-123456789012",
        })
      ).status,
      400,
    );
    const closed = (await call(null, "GET", publicPath)).data.survey;
    assert.equal(closed.status, "Closed");
    assert.deepEqual(closed.questions, []);
    const random = await call("owner", "POST", "", {
      title: "Sampled poll",
      kind: "poll",
      population: "Adults",
      method: "Online",
      sampling: "random",
      populationSize: 2,
      target: 2,
      frameDescription: "Complete frame",
      frame: "A\nB",
      questions,
    });
    const randomPath =
      "/participate/" + random.data.survey.participantPath.split("=")[1];
    await call("owner", "PATCH", "/" + random.data.survey.id, {
      status: "Open",
    });
    assert.equal(
      (await call(null, "POST", randomPath, { ...answer, code: "NOT-SAMPLED" }))
        .status,
      400,
    );
    assert.equal(
      (await call(null, "POST", randomPath, { ...answer, code: "A" })).status,
      201,
    );
    assert.equal(
      (
        await call(null, "POST", randomPath, {
          ...answer,
          code: "A",
          respondentId: "22345678-1234-1234-1234-123456789012",
        })
      ).status,
      409,
    );
    // Existing studies can receive a link without being recreated.
    const persisted = JSON.parse(
      fs.readFileSync(path.join(dir, "surveys.json"), "utf8"),
    );
    delete persisted[0].participantToken;
    fs.writeFileSync(path.join(dir, "surveys.json"), JSON.stringify(persisted));
    const shared = await call(
      "owner",
      "PATCH",
      "/" + random.data.survey.id + "/share",
      {},
    );
    assert.equal(shared.status, 200);
    assert.match(
      shared.data.survey.participantPath,
      /participate=[a-f0-9]{64}/,
    );
  } finally {
    if (old === undefined) delete process.env.USERS_FILE;
    else process.env.USERS_FILE = old;
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    fs.rmdirSync(dir);
  }
});
