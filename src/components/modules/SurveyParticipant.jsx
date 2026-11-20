import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  LockKeyhole,
} from "lucide-react";
import { validateAnswers } from "../../utils/surveyScience";
import "./SurveyEngine.css";
import "./SurveyParticipant.css";

const request = async (token, body) => {
  const response = await fetch(
    "/api/surveys/participate/" + encodeURIComponent(token),
    {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "omit",
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to load this study.");
  return data;
};
const browserCode = (token) => {
  const key = "ems_participant_" + token;
  try {
    let code = localStorage.getItem(key);
    if (!code) {
      code = crypto.randomUUID();
      localStorage.setItem(key, code);
    }
    return code;
  } catch {
    return crypto.randomUUID();
  }
};

export function SurveyParticipant({ token }) {
  const [survey, setSurvey] = useState(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [answers, setAnswers] = useState({}),
    [code, setCode] = useState(""),
    [consent, setConsent] = useState(false),
    [done, setDone] = useState(false),
    [respondentId] = useState(() => browserCode(token));
  useEffect(() => {
    let active = true;
    request(token)
      .then((d) => {
        if (active) setSurvey(d.survey);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const problem = validateAnswers(survey.questions, answers);
    if (problem) {
      setError(problem);
      return;
    }
    if (!consent) {
      setError("Please confirm consent before submitting.");
      return;
    }
    setBusy(true);
    try {
      await request(token, { answers, consent, code, respondentId });
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const answered =
    survey?.questions.filter((q) => {
      const a = answers[q.id];
      return Array.isArray(a) ? a.length > 0 : a !== undefined && a !== "";
    }).length || 0;
  return (
    <main className="sp-page">
      <div className="sp-brand">
        <ClipboardList size={20} />
        <span>RESEARCH PARTICIPATION</span>
      </div>
      <div className="se sp-content">
        {loading ? (
          <section className="se-card" role="status">
            Loading study…
          </section>
        ) : done ? (
          <section className="se-card sp-success">
            <CheckCircle2 size={48} />
            <h1>Thank you for taking part.</h1>
            <p>Your response has been recorded. You can close this page.</p>
          </section>
        ) : (
          <>
            {error && (
              <div className="se-error" role="alert">
                {error}
              </div>
            )}
            {survey && (
              <>
                <header className="sp-header">
                  <span className="se-overline">
                    {survey.kind === "poll" ? "OPINION POLL" : "SURVEY"}
                  </span>
                  <h1>{survey.title}</h1>
                  <p>
                    Your perspective helps the study organizer understand what
                    matters.
                  </p>
                </header>
                {survey.status !== "Open" ? (
                  <section className="se-card sp-closed">
                    <LockKeyhole size={28} />
                    <h2>
                      {survey.status === "Closed"
                        ? "This study has closed."
                        : "Responses are not open yet."}
                    </h2>
                    <p>
                      {survey.status === "Closed"
                        ? "The organizer is no longer accepting responses."
                        : "Please return when the organizer opens collection."}
                    </p>
                  </section>
                ) : (
                  <form onSubmit={submit}>
                    <div className="sp-progress">
                      <span>
                        {answered} of {survey.questions.length} questions
                        answered
                      </span>
                      <progress
                        max={survey.questions.length || 1}
                        value={answered}
                      />
                    </div>
                    {survey.sampling === "random" && (
                      <section className="se-card">
                        <h2>Your invitation</h2>
                        <p>
                          This study is limited to sampled participants. Enter
                          the code provided by the organizer.
                        </p>
                        <label>
                          Invitation code
                          <input
                            autoComplete="off"
                            required
                            maxLength={200}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                          />
                        </label>
                      </section>
                    )}
                    {survey.questions.map((q, i) => (
                      <fieldset className="sp-question" key={q.id}>
                        <legend>
                          <span>{String(i + 1).padStart(2, "0")}</span>
                          {q.text}
                          {q.required && (
                            <span className="se-required"> *</span>
                          )}
                        </legend>
                        <p>
                          {q.type === "multi"
                            ? "Select all that apply."
                            : q.type === "single"
                              ? "Select one answer."
                              : q.type === "rating"
                                ? "Choose a rating from 1 to 5."
                                : "Write your answer below."}
                          {!q.required ? " Optional." : ""}
                        </p>
                        {["single", "multi"].includes(q.type) ? (
                          q.options.map((option, j) => (
                            <label className="se-check" key={j}>
                              <input
                                type={
                                  q.type === "single" ? "radio" : "checkbox"
                                }
                                name={q.id}
                                checked={
                                  q.type === "single"
                                    ? answers[q.id] === option
                                    : (answers[q.id] || []).includes(option)
                                }
                                onChange={(e) =>
                                  setAnswers({
                                    ...answers,
                                    [q.id]:
                                      q.type === "single"
                                        ? option
                                        : e.target.checked
                                          ? [...(answers[q.id] || []), option]
                                          : (answers[q.id] || []).filter(
                                              (v) => v !== option,
                                            ),
                                  })
                                }
                              />
                              {option}
                            </label>
                          ))
                        ) : q.type === "rating" ? (
                          <div
                            className="se-rating-options"
                            role="group"
                            aria-label={q.text}
                          >
                            {[1, 2, 3, 4, 5].map((v) => (
                              <label key={v}>
                                <input
                                  type="radio"
                                  name={q.id}
                                  checked={answers[q.id] === v}
                                  onChange={() =>
                                    setAnswers({ ...answers, [q.id]: v })
                                  }
                                />
                                <span>{v}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            aria-label={q.text}
                            rows={4}
                            maxLength={2000}
                            placeholder="Your response…"
                            value={answers[q.id] || ""}
                            onChange={(e) =>
                              setAnswers({ ...answers, [q.id]: e.target.value })
                            }
                          />
                        )}
                      </fieldset>
                    ))}
                    <section className="se-card sp-submit">
                      <label className="se-check">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                        />
                        I agree to participate and share my answers with the
                        study organizer for analysis and reporting.
                      </label>
                      <p>
                        Participation is voluntary. Avoid including names, phone
                        numbers, or other identifying details in open answers.
                      </p>
                      <button
                        className="se-primary"
                        disabled={busy || !consent}
                      >
                        {busy ? "Submitting…" : "Submit response"}
                        <ArrowRight size={16} />
                      </button>
                    </section>
                  </form>
                )}
              </>
            )}
          </>
        )}
        <footer className="sp-footer">
          Survey & opinion poll participation · Powered by Kuratech
        </footer>
      </div>
    </main>
  );
}
