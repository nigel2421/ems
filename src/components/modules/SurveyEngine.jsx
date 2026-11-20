import { SurveyShareLink } from "./SurveyShareLink";
import {
  InsightRing,
  ResponseTrend,
  InsightBars,
} from "../common/InsightCharts";
import React, { useEffect, useState } from "react";
import {
  Plus,
  ArrowLeft,
  Download,
  ClipboardList,
  BarChart3,
  Search,
  ArrowUpRight,
  CheckCircle2,
  Users,
  Activity,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import { surveyRequest } from "../../services/surveys";
import { analyzeSurvey, planSample } from "../../utils/surveyScience";
import "./SurveyEngine.css";
const empty = {
  title: "",
  kind: "survey",
  population: "",
  method: "Face-to-face",
  sampling: "feedback",
  populationSize: 1000,
  target: 100,
  frameDescription: "",
  frame: "",
};
const question = () => ({
  id: crypto.randomUUID(),
  text: "",
  type: "single",
  required: true,
  options: ["", ""],
});
const download = (name, text, type) => {
  const u = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  URL.revokeObjectURL(u);
};
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const cell = (s) =>
  '"' +
  String(s ?? "")
    .replace(/^[=+@-]/, "'$&")
    .replace(/"/g, '""') +
  '"';
export const SurveyEngine = () => {
  const [surveys, setSurveys] = useState([]),
    [selected, setSelected] = useState(null),
    [view, setView] = useState("list"),
    [draft, setDraft] = useState(empty),
    [questions, setQuestions] = useState([question()]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [answers, setAnswers] = useState({}),
    [code, setCode] = useState(""),
    [group, setGroup] = useState(""),
    [consent, setConsent] = useState(false),
    [filter, setFilter] = useState("");
  const [search, setSearch] = useState(""),
    [kind, setKind] = useState("all"),
    [status, setStatus] = useState("all"),
    [loading, setLoading] = useState(true),
    [builderStep, setBuilderStep] = useState(1);
  const openStudy = (s, next) => {
    setSelected(s);
    setFilter("");
    setView(next);
    setAnswers({});
    setCode("");
    setGroup("");
    setConsent(false);
    setError("");
    setNotice("");
  };
  const startStudy = (type = "survey") => {
    setBuilderStep(1);
    setView("builder");
    setDraft({ ...empty, kind: type });
    setQuestions([question()]);
    setNotice("");
    setError("");
  };
  const filtered = surveys.filter(
    (s) =>
      (kind === "all" || s.kind === kind) &&
      (status === "all" || s.status === status) &&
      `${s.title} ${s.population}`.toLowerCase().includes(search.toLowerCase()),
  );
  const allResponses = surveys.flatMap((s) => s.responses);
  const included = allResponses.filter((r) => !r.excluded).length;

  const load = async () => {
    try {
      const d = await surveyRequest();
      setSurveys(d.surveys);
      setSelected((old) =>
        old ? d.surveys.find((s) => s.id === old.id) : null,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const act = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      setNotice("Saved successfully.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const analysis = selected
    ? analyzeSurvey({
        ...selected,
        responses: selected.responses.filter(
          (r) => !filter || r.group === filter,
        ),
      })
    : null;
  const exportData = () =>
    download(
      "responses.csv",
      [
        [
          "Code",
          "Group",
          "Collected",
          "Excluded",
          ...selected.questions.map((q) => q.text),
        ],
        ...selected.responses.map((r) => [
          r.code,
          r.group,
          r.createdAt,
          r.excluded,
          ...selected.questions.map((q) =>
            Array.isArray(r.answers[q.id])
              ? r.answers[q.id].join("; ")
              : r.answers[q.id],
          ),
        ]),
      ]
        .map((row) => row.map(cell).join(","))
        .join("\r\n"),
      "text/csv",
    );
  const report = () => {
    const a = analysis;
    download(
      "research-report.html",
      `<!doctype html><meta charset="utf-8"><title>${esc(selected.title)}</title><style>body{font:16px system-ui;max-width:850px;margin:40px auto;padding:20px;color:#17352b}h1{font-size:34px}table{border-collapse:collapse;width:100%}td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}small{color:#667}</style><h1>${esc(selected.title)}</h1><p>Generated ${new Date().toLocaleString()}</p><p>Analysis group: ${esc(filter || "All respondents")}</p><h2>Method</h2><p>${esc(selected.population)} · ${esc(selected.method)}</p><p>${esc(selected.frameDescription)}</p><p>${a.questions.length} questions · ${a.valid} included · ${a.excluded} excluded</p><p>${esc(a.limitations)}</p>${a.questions.map((q) => `<h2>${esc(q.text)}</h2><p>Base ${q.n}; missing ${q.missing}</p>${q.options ? `<table><tr><th>Answer</th><th>Count</th><th>%</th><th>95% interval</th></tr>${q.options.map((o) => `<tr><td>${esc(o.label)}</td><td>${o.count}</td><td>${o.percent.toFixed(1)}</td><td>${o.interval ? o.interval.map((v) => (v * 100).toFixed(1)).join(" – ") : "Not applicable"}</td></tr>`).join("")}</table>` : q.mean !== undefined ? `<p>Mean ${q.mean ?? "—"}</p>` : `<p>Open responses are reported verbatim.</p>`}`).join("")}<h2>Limitations</h2><p>${esc(a.limitations)}</p>`,
      "text/html",
    );
  };
  return (
    <div className="se">
      <header className="se-head">
        <div>
          <span className="se-kicker">
            <i /> CAMPAIGN RESEARCH
          </span>
          <h1>
            {view === "builder"
              ? "Design your next study"
              : view === "analysis"
                ? "Research insights"
                : view === "collect"
                  ? "Response collection"
                  : "Listen. Measure. Understand."}
          </h1>
          <p>
            {view === "list"
              ? "A clearer view of public opinion, from fieldwork to findings."
              : "Surveys & opinion polls / " +
                (view === "builder"
                  ? "New study"
                  : selected?.title || "Research desk")}
          </p>
        </div>
        {view !== "list" ? (
          <button
            onClick={() => {
              setView("list");
              setError("");
            }}
          >
            <ArrowLeft size={16} />
            All studies
          </button>
        ) : (
          <button className="se-primary" onClick={() => startStudy()}>
            <Plus size={17} />
            New study
          </button>
        )}
      </header>
      {notice && (
        <div role="status" className="se-note">
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="se-error">
          {error}
        </div>
      )}
      {view === "list" && (
        <>
          <div className="se-stats">
            <article>
              <div className="se-stat-label">
                <span>Total studies</span>
                <ClipboardList size={17} />
              </div>
              <strong>{surveys.length}</strong>
              <small>
                {surveys.filter((s) => s.kind === "poll").length} opinion polls
                · {surveys.filter((s) => s.kind !== "poll").length} surveys
              </small>
            </article>
            <article>
              <div className="se-stat-label">
                <span>Live in the field</span>
                <Activity size={17} />
              </div>
              <strong>
                {surveys.filter((s) => s.status === "Open").length}
                <i className="se-live-dot" />
              </strong>
              <small>Open and accepting responses</small>
            </article>
            <article>
              <div className="se-stat-label">
                <span>Included responses</span>
                <Users size={17} />
              </div>
              <strong>{included.toLocaleString()}</strong>
              <small>
                {allResponses.length - included} excluded during review
              </small>
            </article>
          </div>
          <div className="se-overview">
            <article className="se-card">
              <div className="se-section-head">
                <div>
                  <span className="se-overline">FIELDWORK PULSE</span>
                  <h2>Response activity</h2>
                </div>
                <span className="se-soft-tag">Last 7 days · EAT</span>
              </div>
              <ResponseTrend responses={allResponses} />
            </article>
            <article className="se-card">
              <span className="se-overline">STUDY PIPELINE</span>
              <h2>From design to findings</h2>
              <InsightRing
                label="studies"
                items={["Open", "Draft", "Closed"].map((label) => ({
                  label,
                  value: surveys.filter((s) => s.status === label).length,
                }))}
              />
            </article>
          </div>
          <div className="se-library-head">
            <div>
              <span className="se-overline">YOUR RESEARCH LIBRARY</span>
              <h2>
                Studies & opinion polls{" "}
                <span className="se-count">{filtered.length}</span>
              </h2>
            </div>
            <div className="se-tabs" role="group" aria-label="Study type">
              {[
                ["all", "All studies"],
                ["survey", "Surveys"],
                ["poll", "Opinion polls"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={kind === value}
                  onClick={() => setKind(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="se-toolbar">
            <label className="se-search">
              <Search size={17} />
              <input
                aria-label="Search studies"
                placeholder="Search by study or population…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className="se-status-filter">
              <SlidersHorizontal size={16} />
              <select
                aria-label="Filter study status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All statuses</option>
                {["Draft", "Open", "Closed"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          {loading ? (
            <div className="se-empty" role="status">
              Loading your research library…
            </div>
          ) : (
            <div className="se-grid">
              {filtered.map((s) => {
                const count = s.responses.filter((r) => !r.excluded).length;
                const target = s.sampling === "random" ? s.sample.length : null;
                return (
                  <article className="se-card se-study" key={s.id}>
                    <div className="se-study-top">
                      <div
                        className={
                          "se-study-icon " +
                          (s.kind === "poll" ? "is-poll" : "")
                        }
                      >
                        {s.kind === "poll" ? (
                          <BarChart3 size={22} />
                        ) : (
                          <ClipboardList size={22} />
                        )}
                      </div>
                      <span className={"se-badge is-" + s.status.toLowerCase()}>
                        <i />
                        {s.status === "Open" ? "Live" : s.status}
                      </span>
                    </div>
                    <span className="se-overline">
                      {s.kind === "poll" ? "OPINION POLL" : "SURVEY"} ·{" "}
                      {s.method}
                    </span>
                    <h2>{s.title}</h2>
                    <p>{s.population}</p>
                    <div className="se-study-numbers">
                      <div>
                        <strong>{count.toLocaleString()}</strong>
                        <small>included responses</small>
                      </div>
                      <span>{s.questions.length} questions</span>
                    </div>
                    {target ? (
                      <div className="se-target">
                        <div>
                          <span>Sample participation</span>
                          <strong>
                            {Math.round((s.responses.length / target) * 100)}%
                          </strong>
                        </div>
                        <progress max={target} value={s.responses.length} />
                        <small>
                          {s.responses.length} of {target} sampled codes
                        </small>
                      </div>
                    ) : (
                      <div className="se-method-note">
                        <Target size={14} /> Voluntary feedback · respondent
                        findings
                      </div>
                    )}
                    <SurveyShareLink survey={s} compact />
                    <div className="se-study-footer">
                      <button
                        className="se-text-button"
                        onClick={() => openStudy(s, "analysis")}
                      >
                        Explore insights <ArrowUpRight size={16} />
                      </button>
                      <button
                        disabled={s.status !== "Open"}
                        onClick={() => openStudy(s, "collect")}
                      >
                        <Plus size={15} /> Add response
                      </button>
                    </div>
                  </article>
                );
              })}
              {!filtered.length && (
                <div className="se-empty">
                  <div className="se-empty-icon">
                    <ClipboardList size={30} />
                  </div>
                  <h2>
                    {surveys.length
                      ? "No studies match your filters"
                      : "Turn questions into useful evidence"}
                  </h2>
                  <p>
                    {surveys.length
                      ? "Try another search or status."
                      : "Start a survey for deeper feedback or a poll for a focused opinion check."}
                  </p>
                  {!surveys.length && (
                    <div className="se-actions">
                      <button
                        className="se-primary"
                        onClick={() => startStudy("survey")}
                      >
                        Create survey <ArrowUpRight size={16} />
                      </button>
                      <button onClick={() => startStudy("poll")}>
                        Create opinion poll
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
      {view === "builder" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (builderStep === 1) {
              if (e.currentTarget.reportValidity()) setBuilderStep(2);
              return;
            }
            act(async () => {
              const data = await surveyRequest("", "POST", {
                ...draft,
                questions,
              });
              setSelected(data.survey);
              setFilter("");
              setView("analysis");
            });
          }}
        >
          <div className="se-builder">
            <aside className="se-build-guide">
              <span className="se-overline">BUILD A STUDY</span>
              <h2>Good research starts with a plan.</h2>
              <p>Set the audience first, then write a focused questionnaire.</p>
              <div
                className={
                  "se-build-step " + (builderStep === 1 ? "active" : "")
                }
              >
                <span>01</span>
                <div>
                  <strong>Research design</strong>
                  <small>Population, method & sampling</small>
                </div>
              </div>
              <div
                className={
                  "se-build-step " + (builderStep === 2 ? "active" : "")
                }
              >
                <span>02</span>
                <div>
                  <strong>Questionnaire</strong>
                  <small>Questions & response formats</small>
                </div>
              </div>
              <div className="se-build-summary">
                <span className="se-overline">YOUR STUDY</span>
                <strong>{draft.title || "Untitled study"}</strong>
                <p>
                  {draft.kind === "poll" ? "Opinion poll" : "Survey"} ·{" "}
                  {draft.method}
                </p>
                <p>
                  {draft.sampling === "random"
                    ? "Simple random sample"
                    : "Voluntary feedback"}
                </p>
                <small>{questions.length} questions · saved as a draft</small>
              </div>
            </aside>
            <fieldset
              className="se-stage"
              disabled={builderStep !== 1}
              hidden={builderStep !== 1}
            >
              <section className="se-card">
                <span className="se-overline">01 / RESEARCH DESIGN</span>
                <h2>Give your study a clear purpose</h2>
                <p className="se-helper">
                  Define who you want to hear from and how you will reach them.
                </p>
                <label>
                  Title
                  <input
                    required
                    value={draft.title}
                    onChange={(e) =>
                      setDraft({ ...draft, title: e.target.value })
                    }
                  />
                </label>
                <div className="se-two">
                  <label>
                    Type
                    <select
                      value={draft.kind}
                      onChange={(e) =>
                        setDraft({ ...draft, kind: e.target.value })
                      }
                    >
                      <option value="survey">Survey</option>
                      <option value="poll">Opinion poll</option>
                    </select>
                  </label>
                  <label>
                    Collection method
                    <select
                      value={draft.method}
                      onChange={(e) =>
                        setDraft({ ...draft, method: e.target.value })
                      }
                    >
                      <option>Face-to-face</option>
                      <option>Telephone</option>
                      <option>Online</option>
                    </select>
                  </label>
                </div>
                <label>
                  Target population
                  <input
                    required
                    placeholder="Who is this study about?"
                    value={draft.population}
                    onChange={(e) =>
                      setDraft({ ...draft, population: e.target.value })
                    }
                  />
                </label>
                <label>
                  Sampling
                  <select
                    value={draft.sampling}
                    onChange={(e) =>
                      setDraft({ ...draft, sampling: e.target.value })
                    }
                  >
                    <option value="feedback">
                      Voluntary / non-probability
                    </option>
                    <option value="random">Simple random sample</option>
                  </select>
                </label>
                {draft.sampling === "random" && (
                  <>
                    <label>
                      Population size
                      <input
                        type="number"
                        min="2"
                        value={draft.populationSize}
                        onChange={(e) =>
                          setDraft({ ...draft, populationSize: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Frame description
                      <textarea
                        required
                        value={draft.frameDescription}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            frameDescription: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Anonymous frame codes
                      <textarea
                        required
                        placeholder="One code per line; no names or phone numbers"
                        value={draft.frame}
                        onChange={(e) =>
                          setDraft({ ...draft, frame: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Sample target
                      <input
                        type="number"
                        min="1"
                        value={draft.target}
                        onChange={(e) =>
                          setDraft({ ...draft, target: e.target.value })
                        }
                      />
                    </label>
                    <div className="se-note">
                      Planning estimate: {planSample(draft.populationSize)} at
                      95% confidence and ±5 points. Assumes random sampling, 50%
                      proportion and complete response.
                    </div>
                  </>
                )}
                <div className="se-actions">
                  <button
                    type="button"
                    className="se-primary"
                    onClick={(e) => {
                      if (e.currentTarget.form.reportValidity())
                        setBuilderStep(2);
                    }}
                  >
                    Continue to questions <ArrowUpRight size={16} />
                  </button>
                </div>
              </section>
            </fieldset>
            <fieldset
              className="se-stage"
              disabled={builderStep !== 2}
              hidden={builderStep !== 2}
            >
              <section className="se-card">
                <span className="se-overline">02 / QUESTIONNAIRE</span>
                <h2>Ask the right questions</h2>
                <p className="se-helper">
                  Keep wording neutral. Use distinct choices and one idea per
                  question.
                </p>
                {questions.map((q, i) => (
                  <div className="se-question" key={q.id}>
                    <div className="se-question-number">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <label>
                      Question {i + 1}
                      <input
                        required
                        value={q.text}
                        onChange={(e) =>
                          setQuestions(
                            questions.map((x) =>
                              x.id === q.id
                                ? { ...x, text: e.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <select
                      aria-label={`Question ${i + 1} answer format`}
                      value={q.type}
                      onChange={(e) =>
                        setQuestions(
                          questions.map((x) =>
                            x.id === q.id ? { ...x, type: e.target.value } : x,
                          ),
                        )
                      }
                    >
                      {[
                        ["single", "Single choice"],
                        ["multi", "Multiple choice"],
                        ["rating", "Rating 1–5"],
                        ["text", "Open text"],
                      ].map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    {["single", "multi"].includes(q.type) && (
                      <div className="se-choice-editor">
                        <span className="se-choice-title">Answer choices</span>
                        <p>
                          {q.type === "multi"
                            ? "Participants can select more than one choice."
                            : "Participants select one choice."}
                        </p>
                        {q.options.map((option, choiceIndex) => (
                          <div className="se-choice-row" key={choiceIndex}>
                            <span
                              className={
                                "se-choice-marker " +
                                (q.type === "multi" ? "is-multi" : "")
                              }
                              aria-hidden="true"
                            />
                            <label>
                              Choice {choiceIndex + 1}
                              <input
                                required
                                maxLength={120}
                                placeholder={`Enter choice ${choiceIndex + 1}`}
                                value={option}
                                onChange={(e) =>
                                  setQuestions(
                                    questions.map((x) =>
                                      x.id === q.id
                                        ? {
                                            ...x,
                                            options: x.options.map((v, j) =>
                                              j === choiceIndex
                                                ? e.target.value
                                                : v,
                                            ),
                                          }
                                        : x,
                                    ),
                                  )
                                }
                              />
                            </label>
                            <button
                              type="button"
                              aria-label={`Remove choice ${choiceIndex + 1} from question ${i + 1}`}
                              disabled={q.options.length <= 2}
                              onClick={() =>
                                setQuestions(
                                  questions.map((x) =>
                                    x.id === q.id
                                      ? {
                                          ...x,
                                          options: x.options.filter(
                                            (_, j) => j !== choiceIndex,
                                          ),
                                        }
                                      : x,
                                  ),
                                )
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          disabled={q.options.length >= 12}
                          onClick={() =>
                            setQuestions(
                              questions.map((x) =>
                                x.id === q.id
                                  ? { ...x, options: [...x.options, ""] }
                                  : x,
                              ),
                            )
                          }
                        >
                          <Plus size={14} />
                          Add choice
                        </button>
                        <small>
                          {q.options.length} of 12 choices · at least 2 required
                        </small>
                      </div>
                    )}
                    <label className="se-check">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) =>
                          setQuestions(
                            questions.map((x) =>
                              x.id === q.id
                                ? { ...x, required: e.target.checked }
                                : x,
                            ),
                          )
                        }
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setQuestions(questions.filter((x) => x.id !== q.id))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="se-actions">
                  <button type="button" onClick={() => setBuilderStep(1)}>
                    <ArrowLeft size={15} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestions([...questions, question()])}
                  >
                    <Plus size={15} />
                    Add question
                  </button>
                  <button className="se-primary" disabled={busy}>
                    {busy ? "Saving…" : "Create study draft"}{" "}
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              </section>
            </fieldset>
          </div>
        </form>
      )}
      {selected && view === "analysis" && (
        <section>
          <div className="se-card">
            <div className="se-actions">
              <h2>{selected.title}</h2>
              <span className="se-badge">{selected.status}</span>
            </div>
            <p>
              {selected.population} · {selected.method}
            </p>
            <div className="se-actions">
              {selected.canManage && selected.status === "Draft" && (
                <button
                  onClick={() =>
                    act(() =>
                      surveyRequest("/" + selected.id, "PATCH", {
                        status: "Open",
                      }),
                    )
                  }
                >
                  Open collection
                </button>
              )}
              {selected.canManage && selected.status === "Open" && (
                <button
                  onClick={() =>
                    act(() =>
                      surveyRequest("/" + selected.id, "PATCH", {
                        status: "Closed",
                      }),
                    )
                  }
                >
                  Close collection
                </button>
              )}
              <button onClick={exportData}>
                <Download size={16} />
                Raw CSV
              </button>
              <button onClick={report}>Download report</button>
              {selected.canManage && selected.sample.length > 0 && (
                <button
                  onClick={() =>
                    download(
                      "sample-codes.csv",
                      selected.sample.map(cell).join("\n"),
                      "text/csv",
                    )
                  }
                >
                  Sample codes
                </button>
              )}
            </div>
          </div>
          <SurveyShareLink key={selected.id} survey={selected} />
          <div className="se-stats">
            <article>
              <strong>{analysis.valid}</strong>
              <span>Included</span>
            </article>
            <article>
              <strong>{analysis.excluded}</strong>
              <span>Excluded</span>
            </article>
            <article>
              <strong>
                {analysis.participation === null
                  ? "—"
                  : analysis.participation.toFixed(1) + "%"}
              </strong>
              <span>Of full sampled frame</span>
            </article>
          </div>
          <label>
            Analyze a group
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All respondents</option>
              {[
                ...new Set(
                  selected.responses.map((r) => r.group).filter(Boolean),
                ),
              ].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <div className="se-analysis-pulse">
            <article className="se-card">
              <span className="se-overline">COLLECTION TREND</span>
              <h2>Responses this week</h2>
              <ResponseTrend
                responses={selected.responses.filter(
                  (r) => !filter || r.group === filter,
                )}
              />
            </article>
            <article className="se-card">
              <span className="se-overline">RESPONSE QUALITY</span>
              <h2>Included in findings</h2>
              <InsightRing
                label="responses"
                items={[
                  { label: "Included", value: analysis.valid },
                  { label: "Excluded", value: analysis.excluded },
                ]}
              />
            </article>
          </div>
          <p className="se-note">
            {filter && (
              <>
                Filtered group: <strong>{filter}</strong>.{" "}
              </>
            )}
            {analysis.limitations}
          </p>
          {analysis.questions.map((q) => (
            <article className="se-card" key={q.id}>
              <h3>{q.text}</h3>
              <div className="se-question-meta">
                <span>Base n={q.n}</span>
                <span>{q.missing} missing</span>
                <span>
                  {q.type === "single"
                    ? "Single choice"
                    : q.type === "multi"
                      ? "Multiple choice"
                      : q.type === "rating"
                        ? "Rating scale"
                        : "Open text"}
                </span>
              </div>
              {q.options?.map((o) => (
                <div className="se-result" key={o.label}>
                  <span>{o.label}</span>
                  <div className="se-bar">
                    <i style={{ width: o.percent + "%" }} />
                  </div>
                  <strong>{o.percent.toFixed(1)}%</strong>
                  <small>
                    {o.count}
                    {o.interval
                      ? " · " +
                        o.interval.map((x) => (x * 100).toFixed(1)).join("–") +
                        "%"
                      : ""}
                  </small>
                </div>
              ))}
              {q.type === "multi" && (
                <small>Multiple answers: percentages may exceed 100%.</small>
              )}
              {q.distribution && (
                <div className="se-rating-chart">
                  <InsightBars
                    items={q.distribution.map((x) => ({
                      label: x.label + " stars",
                      value: x.count,
                    }))}
                  />
                </div>
              )}
              {q.mean !== undefined && (
                <p>
                  Mean {q.mean === null ? "—" : q.mean.toFixed(2)} · Median{" "}
                  {q.median ?? "—"}
                </p>
              )}
              {q.comments?.map((text, i) => (
                <blockquote key={i}>{text}</blockquote>
              ))}
            </article>
          ))}
          <details>
            <summary>Response quality</summary>
            {selected.responses.map((r) => (
              <div className="se-review" key={r.id}>
                <span>
                  {r.code} · {r.excluded ? "Excluded" : "Included"} {r.reason}
                </span>
                {selected.canManage && (
                  <button
                    onClick={() => {
                      const reason = prompt("Reason");
                      if (reason)
                        act(() =>
                          surveyRequest(
                            "/" + selected.id + "/exclude",
                            "PATCH",
                            { responseId: r.id, excluded: !r.excluded, reason },
                          ),
                        );
                    }}
                  >
                    Review
                  </button>
                )}
              </div>
            ))}
          </details>
          <p>
            <a href="https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm">
              Interval method
            </a>{" "}
            ·{" "}
            <a href="https://aapor.org/statements/understanding-a-credibility-interval-and-how-it-differs-from-the-margin-of-sampling-error-in-a-public-opinion-poll/">
              Polling standards
            </a>
          </p>
        </section>
      )}
      {selected && view === "collect" && (
        <section className="se-card se-narrow">
          <span className="se-overline">
            FIELD COLLECTION ·{" "}
            {selected.kind === "poll" ? "OPINION POLL" : "SURVEY"}
          </span>
          <h2>{selected.title}</h2>
          <p>
            {selected.status === "Open"
              ? "Collection is open"
              : "Collection has not started or is closed."}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              act(async () => {
                await surveyRequest("/" + selected.id + "/responses", "POST", {
                  answers,
                  code,
                  group,
                  consent,
                });
                setAnswers({});
                setCode("");
                setConsent(false);
                setGroup("");
              });
            }}
          >
            <label>
              Respondent code
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <label>
              Group (optional)
              <input value={group} onChange={(e) => setGroup(e.target.value)} />
            </label>
            {selected.questions.map((q) => (
              <fieldset key={q.id}>
                <legend>
                  {q.text}
                  {q.required && <span className="se-required"> *</span>}
                </legend>
                {["single", "multi"].includes(q.type) ? (
                  q.options.map((o) => (
                    <label className="se-check" key={o}>
                      <input
                        type={q.type === "single" ? "radio" : "checkbox"}
                        name={q.id}
                        checked={
                          q.type === "single"
                            ? answers[q.id] === o
                            : (answers[q.id] || []).includes(o)
                        }
                        onChange={(e) =>
                          setAnswers({
                            ...answers,
                            [q.id]:
                              q.type === "single"
                                ? o
                                : e.target.checked
                                  ? [...(answers[q.id] || []), o]
                                  : (answers[q.id] || []).filter(
                                      (v) => v !== o,
                                    ),
                          })
                        }
                      />
                      {o}
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
                          checked={Number(answers[q.id]) === v}
                          onChange={() => setAnswers({ ...answers, [q.id]: v })}
                        />
                        <span>{v}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    aria-label={q.text}
                    placeholder="Record the respondent’s answer…"
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [q.id]: e.target.value })
                    }
                  />
                )}
              </fieldset>
            ))}
            <label className="se-check">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              Respondent consented to participate
            </label>
            <button
              disabled={busy || selected.status !== "Open"}
              className="se-primary"
            >
              Save response
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
