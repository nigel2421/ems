import { respondToParticipant } from "./survey-participants.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadUsers, getUsersFilePath } from "./users.store.js";
import {
  campaignRoot,
  isDescendant,
  isTeamAccountActive,
  isStationAgent,
  teamScope,
} from "../src/utils/teamHierarchy.js";
import {
  validateQuestionnaire,
  validateAnswers,
} from "../src/utils/surveyScience.js";
const file = () => path.join(path.dirname(getUsersFilePath()), "surveys.json");
const read = () => {
  try {
    return JSON.parse(fs.readFileSync(file(), "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
};
const save = (rows) => {
  fs.mkdirSync(path.dirname(file()), { recursive: true });
  fs.writeFileSync(file() + ".tmp", JSON.stringify(rows));
  fs.renameSync(file() + ".tmp", file());
};
const error = (status, message) =>
  Object.assign(new Error(message), { status });
export const handleSurveys = async (req, res, ctx) => {
  const send = (status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  try {
    let body = {};
    if (req.method !== "GET") {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 300000) throw error(413, "Request too large.");
      }
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        throw error(400, "Invalid JSON.");
      }
    }
    const parts = ctx.url.pathname.split("/").filter(Boolean),
      index = parts.indexOf("surveys"),
      id = parts[index + 1],
      action = parts[index + 2];
    const rows = read();
    if (id === "participate") {
      const study = rows.find(
        (s) =>
          s.participantToken === action && /^[a-f0-9]{64}$/.test(action || ""),
      );
      respondToParticipant(req, body, study, send, () => save(rows));
      return;
    }
    const users = loadUsers(),
      actor = users.find((u) => u.id === ctx.session?.uid),
      root = campaignRoot(actor, users);
    if (!actor || !root || !isTeamAccountActive(actor, users))
      throw error(403, "Sign in to an active campaign.");
    const canManage = (s) =>
      s.creatorId === actor.id ||
      isDescendant(
        actor,
        users.find((u) => u.id === s.creatorId),
        users,
      );
    const canCollect = (s) =>
      canManage(s) ||
      isDescendant(
        users.find((u) => u.id === s.creatorId),
        actor,
        users,
      );
    const visible = (s) => s.campaignId === root.id && canCollect(s);
    const present = (s) => {
      const { participantToken, ...safe } = s;
      return {
        ...safe,
        participantPath:
          canManage(s) && participantToken
            ? "/?participate=" + participantToken
            : null,
        canManage: canManage(s),
        sample: canManage(s) ? s.sample : [],
        responses: canManage(s)
          ? s.responses
          : s.responses.filter((r) => r.collectorId === actor.id),
      };
    };
    if (req.method === "GET") {
      send(200, { surveys: rows.filter(visible).map(present) });
      return;
    }
    if (req.method === "POST" && !id) {
      if (isStationAgent(actor))
        throw error(403, "Ask your supervisor to design a survey.");
      const problem = validateQuestionnaire(body.questions);
      if (problem) throw error(400, problem);
      if (
        !body.title?.trim() ||
        body.title.length > 120 ||
        !body.population?.trim() ||
        !body.method?.trim()
      )
        throw error(400, "Add title, population and collection method.");
      if (!["feedback", "random"].includes(body.sampling))
        throw error(400, "Choose a sampling method.");
      const frame = String(body.frame || "")
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);
      if (new Set(frame).size !== frame.length)
        throw error(400, "Frame codes must be unique.");
      if (frame.length > 5000)
        throw error(400, "Use at most 5,000 frame codes.");
      const sample = [];
      if (body.sampling === "random") {
        if (
          frame.length < 2 ||
          frame.length !== Number(body.populationSize) ||
          !body.frameDescription?.trim()
        )
          throw error(
            400,
            "Provide the complete frame and matching population size.",
          );
        const n = Number(body.target);
        if (!Number.isInteger(n) || n < 1 || n > frame.length)
          throw error(400, "Sample size exceeds the frame.");
        while (sample.length < n) {
          sample.push(frame.splice(crypto.randomInt(frame.length), 1)[0]);
        }
      }
      const s = {
        id: crypto.randomUUID(),
        participantToken: crypto.randomBytes(32).toString("hex"),
        title: body.title.trim(),
        kind: body.kind === "poll" ? "poll" : "survey",
        population: body.population,
        method: body.method,
        sampling: body.sampling,
        populationSize: Number(body.populationSize) || null,
        target: Number(body.target) || null,
        frameDescription: body.frameDescription || "",
        sample,
        questions: body.questions,
        status: "Draft",
        creatorId: actor.id,
        creatorName: actor.name,
        campaignId: root.id,
        scope: teamScope(actor, ctx.geography).locked,
        createdAt: new Date().toISOString(),
        responses: [],
      };
      rows.unshift(s);
      save(rows);
      send(201, { survey: present(s) });
      return;
    }
    const s = rows.find((s) => s.id === id && visible(s));
    if (!s) throw error(404, "Survey not found.");
    if (req.method === "DELETE") {
      if (!canManage(s))
        throw error(
          403,
          "Only the organizer or their supervisor can delete this study.",
        );
      if (s.status === "Open")
        throw error(409, "Close collection before deleting this study.");
      if (body.confirmTitle !== s.title)
        throw error(400, "Enter the study title to confirm deletion.");
      rows.splice(rows.indexOf(s), 1);
      save(rows);
      send(200, { success: true });
      return;
    }
    if (req.method === "PATCH") {
      if (!canManage(s))
        throw error(403, "Only supervisors can change this survey.");
      if (action === "edit") {
        if (s.status === "Open")
          throw error(409, "Close collection before editing this study.");
        if (
          typeof body.title !== "string" ||
          !body.title.trim() ||
          body.title.length > 120 ||
          typeof body.population !== "string" ||
          !body.population.trim() ||
          typeof body.method !== "string" ||
          !body.method.trim()
        )
          throw error(400, "Add a title, population and collection method.");
        if (body.questions) {
          const problem = validateQuestionnaire(body.questions);
          if (problem) throw error(400, problem);
          if (
            s.responses.length &&
            JSON.stringify(body.questions) !== JSON.stringify(s.questions)
          )
            throw error(
              409,
              "Questions cannot change after responses have been collected. You can edit the study details.",
            );
        }
        s.editHistory ||= [];
        s.editHistory.push({
          by: actor.id,
          at: new Date().toISOString(),
          before: {
            title: s.title,
            population: s.population,
            method: s.method,
            questions: s.questions,
          },
        });
        s.title = body.title.trim();
        s.population = body.population.trim();
        s.method = body.method.trim();
        if (body.questions) s.questions = body.questions;
        s.updatedAt = new Date().toISOString();
        save(rows);
        send(200, { survey: present(s) });
        return;
      }
      if (action === "share") {
        s.participantToken ||= crypto.randomBytes(32).toString("hex");
        save(rows);
        send(200, { survey: present(s) });
        return;
      }
      if (action === "exclude") {
        const r = s.responses.find((r) => r.id === body.responseId);
        if (!r) throw error(404, "Response not found.");
        if (!body.reason?.trim()) throw error(400, "Add an exclusion reason.");
        r.excluded = Boolean(body.excluded);
        r.reason = body.reason;
        r.reviewedBy = actor.id;
      } else {
        if (!["Open", "Closed"].includes(body.status) || s.status === "Closed")
          throw error(400, "A closed survey cannot be reopened.");
        s.status = body.status;
        s[body.status === "Open" ? "openedAt" : "closedAt"] =
          new Date().toISOString();
      }
      save(rows);
      send(200, { survey: present(s) });
      return;
    }
    if (req.method === "POST" && action === "responses") {
      if (s.status !== "Open") throw error(400, "Collection is closed.");
      if (!body.consent) throw error(400, "Consent is required.");
      const code = String(body.code || "").trim();
      if (!code) throw error(400, "Add a respondent code.");
      if (s.sampling === "random" && !s.sample.includes(code))
        throw error(400, "Code is not in the random sample.");
      if (s.responses.some((r) => r.code === code))
        throw error(409, "This code has already responded.");
      const problem = validateAnswers(s.questions, body.answers);
      if (problem) throw error(400, problem);
      s.responses.push({
        id: crypto.randomUUID(),
        code,
        answers: body.answers,
        group: String(body.group || "").slice(0, 80),
        collectorId: actor.id,
        createdAt: new Date().toISOString(),
        excluded: false,
      });
      save(rows);
      send(201, { success: true });
      return;
    }
    throw error(405, "Unavailable operation.");
  } catch (e) {
    send(e.status || 500, {
      error: e.status ? e.message : "Unable to save. Try again.",
    });
  }
};
