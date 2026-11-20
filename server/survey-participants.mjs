import crypto from "node:crypto";
import { validateAnswers } from "../src/utils/surveyScience.js";

const windows = new Map();
export function respondToParticipant(req, body, study, send, save) {
  if (!study) {
    send(404, { error: "This participant link is unavailable." });
    return;
  }
  if (!["GET", "POST"].includes(req.method)) {
    send(405, { error: "Unavailable operation." });
    return;
  }
  const now = Date.now(),
    key =
      String(
        req.headers?.["x-real-ip"] || req.socket?.remoteAddress || "unknown",
      ) +
      ":" +
      req.method;
  for (const [k, v] of windows) if (v.until < now) windows.delete(k);
  const limit = windows.get(key) || { count: 0, until: now + 60000 };
  limit.count++;
  windows.set(key, limit);
  if (limit.count > (req.method === "GET" ? 120 : 30)) {
    send(429, {
      error: "Too many requests. Please wait a minute and try again.",
    });
    return;
  }
  if (req.method === "GET") {
    send(200, {
      survey: {
        title: study.title,
        kind: study.kind,
        status: study.status,
        sampling: study.sampling,
        questions:
          study.status === "Open"
            ? study.questions.map(({ id, text, type, required, options }) => ({
                id,
                text,
                type,
                required,
                options,
              }))
            : [],
      },
    });
    return;
  }
  if (study.status !== "Open") {
    send(400, {
      error:
        study.status === "Closed"
          ? "This study is closed."
          : "This study is not open for responses yet.",
    });
    return;
  }
  if (body.consent !== true) {
    send(400, { error: "Please confirm consent before submitting." });
    return;
  }
  const code =
    study.sampling === "random"
      ? String(body.code || "").trim()
      : String(body.respondentId || "").trim();
  if (study.sampling === "random" && !study.sample.includes(code)) {
    send(400, {
      error: "Enter the invitation code provided by the study organizer.",
    });
    return;
  }
  if (study.sampling !== "random" && !/^[a-f0-9-]{36}$/i.test(code)) {
    send(400, { error: "Refresh the page and try again." });
    return;
  }
  if (study.responses.some((r) => r.code === code)) {
    send(409, {
      error:
        "A response has already been recorded for this invitation or browser.",
    });
    return;
  }
  const problem = validateAnswers(study.questions, body.answers);
  if (problem) {
    send(400, { error: problem });
    return;
  }
  const answers = Object.fromEntries(
    study.questions
      .filter((q) => body.answers[q.id] !== undefined)
      .map((q) => [q.id, body.answers[q.id]]),
  );
  study.responses.push({
    id: crypto.randomUUID(),
    code,
    answers,
    group: "",
    collectorId: study.creatorId,
    source: "participant",
    createdAt: new Date().toISOString(),
    excluded: false,
  });
  save();
  send(201, { success: true });
}
