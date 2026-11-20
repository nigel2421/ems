import { analyzeSurvey } from '../utils/surveyScience.js';
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { handleSurveys } from "../../server/survey-routes.mjs";

test("editing preserves answers and sampling; confirmed deletion revokes participant links", async () => {
  const dir = path.resolve(".data", `lifecycle-test-${Date.now()}`),
    old = process.env.USERS_FILE;
  fs.mkdirSync(dir, { recursive: true });
  process.env.USERS_FILE = path.join(dir, "users.json");
  fs.writeFileSync(
    process.env.USERS_FILE,
    JSON.stringify([
      { id: "a", name: "Organizer", role: "MP", assignedEntity: "K" },
      { id: "b", name: "Other", role: "MP", assignedEntity: "K" },
      { id: "agent", role: "Agent", creatorId: "a" },
    ]),
  );
  const geography = {
    counties: [{ id: "C", name: "County" }],
    constituencies: [{ id: "K", name: "Const", countyId: "C" }],
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
      text: "Priority?",
      type: "single",
      required: true,
      options: ["Water", "Roads"],
    },
  ];
  try {
    const created = (
        await call("a", "POST", "", {
          title: "Study",
          population: "Adults",
          method: "Online",
          sampling: "feedback",
          questions,
        })
      ).data.survey,
      id = created.id;
    const edit = {
      title: "Updated study",
      population: "Registered adults",
      method: "Online",
      questions: [
        ...questions,
        { id: "q2", text: "Comments?", type: "text", required: false },
      ],
    };
    assert.equal(
      (await call("b", "PATCH", "/" + id + "/edit", edit)).status,
      404,
    );
    assert.equal(
      (await call("agent", "PATCH", "/" + id + "/edit", edit)).status,
      403,
    );
    assert.equal(
      (await call("a", "PATCH", "/" + id + "/edit", { ...edit, questions: [] }))
        .status,
      400,
    );
    const updated = await call("a", "PATCH", "/" + id + "/edit", edit);
    assert.equal(updated.status, 200);
    assert.equal(updated.data.survey.questions.length, 2);
    assert.equal(updated.data.survey.participantPath, created.participantPath);
    await call("a", "PATCH", "/" + id, { status: "Open" });
    assert.equal(
      (await call("a", "PATCH", "/" + id + "/edit", edit)).status,
      409,
    );
    assert.equal(
      (await call("a", "DELETE", "/" + id, { confirmTitle: edit.title }))
        .status,
      409,
    );
    await call("a", "POST", "/" + id + "/responses", {
      code: "R1",
      answers: { q: "Water", q2: "Thanks" },
      consent: true,
    });
    await call("a", "PATCH", "/" + id, { status: "Closed" });
    assert.equal(
      (await call("a", "PATCH", "/" + id + "/edit", { ...edit, questions }))
        .status,
      409,
    );
    const metadata = await call("a", "PATCH", "/" + id + "/edit", {
      ...edit,
      title: "Final study",
    });
    assert.equal(metadata.status, 200);
    assert.equal(metadata.data.survey.status, "Closed");
    assert.equal(metadata.data.survey.responses.length, 1);
    assert.deepEqual(metadata.data.survey.responses[0].answers, {
      q: "Water",
      q2: "Thanks",
    });
    assert.equal(metadata.data.survey.sampling, "feedback");
    assert.equal(metadata.data.survey.editHistory.length, 2);
    assert.equal(
      (await call("agent", "DELETE", "/" + id, { confirmTitle: "Final study" }))
        .status,
      403,
    );
    assert.equal(
      (await call("b", "DELETE", "/" + id, { confirmTitle: "Final study" }))
        .status,
      404,
    );
    assert.equal(
      (await call("a", "DELETE", "/" + id, { confirmTitle: "Wrong title" }))
        .status,
      400,
    );
    assert.equal(
      (await call("a", "DELETE", "/" + id, { confirmTitle: "Final study" }))
        .status,
      200,
    );
    assert.equal((await call("a", "GET")).data.surveys.length, 0);
    assert.equal(
      (
        await call(
          null,
          "GET",
          "/participate/" + created.participantPath.split("=")[1],
        )
      ).status,
      404,
    );
  } finally {
    if (old === undefined) delete process.env.USERS_FILE;
    else process.env.USERS_FILE = old;
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    fs.rmdirSync(dir);
  }
});

test('text and rating questions ignore option inputs left over from the choice editor',()=>{const analysis=analyzeSurvey({questions:[{id:'text',text:'Comments?',type:'text',options:['','']},{id:'rating',text:'Rating?',type:'rating',options:['','']}],responses:[]});assert.equal(analysis.questions[0].options,undefined);assert.deepEqual(analysis.questions[0].comments,[]);assert.equal(analysis.questions[1].options,undefined);assert.equal(analysis.questions[1].mean,null);});
