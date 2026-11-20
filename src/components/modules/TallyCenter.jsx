import React, { useEffect, useState } from "react";
import {
  UploadCloud,
  FileCheck2,
  ArrowRight,
  Plus,
  Download,
} from "lucide-react";
import { readForm } from "../../services/readForm";
import {
  parseResultText,
  normalizeName,
  validateResult,
  summarizeResults,
} from "../../utils/resultMath";
import "./ResultSubmission.css";
const request = async (method = "GET", body, suffix = "") => {
  const r = await fetch("/api/results" + suffix, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Request failed.");
  return d;
};
const blank = (name) => ({
  stationId: "",
  candidates: [
    { name, votes: "" },
    { name: "", votes: "" },
  ],
  registered: "",
  rejected: "",
  total: "",
  confirmed: false,
});
export const TallyCenter = () => {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [step, setStep] = useState(1),
    [form, setForm] = useState(blank("")),
    [file, setFile] = useState(null),
    [preview, setPreview] = useState(""),
    [busy, setBusy] = useState(""),
    [raw, setRaw] = useState(""),
    [notice, setNotice] = useState(""),
    [search, setSearch] = useState("");
  const refresh = async () => {
    try {
      const d = await request();
      setData(d);
      setForm((f) => ({
        ...f,
        candidates: f.candidates.map((c, i) =>
          i ? c : { ...c, name: d.aspirant.name },
        ),
      }));
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const change = (key, value) =>
    setForm((f) => ({ ...f, [key]: value, confirmed: false }));
  const candidate = (i, key, value) =>
    change(
      "candidates",
      form.candidates.map((c, j) => (j === i ? { ...c, [key]: value } : c)),
    );
  const upload = async (f) => {
    setError("");
    setNotice("");
    if (!f) return;
    if (
      !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
        f.type,
      ) ||
      f.size > 5 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, WebP or PDF up to 5 MB.");
      return;
    }
    setFile(f);
    setRaw("");
    setForm(blank(data.aspirant.name));
    setBusy("Reading document…");
    try {
      const result = await readForm(f, setBusy);
      setRaw(result.text);
      const parsed = parseResultText(result.text, data.aspirant.name);
      const own = parsed.candidates.find(
        (c) => normalizeName(c.name) === normalizeName(data.aspirant.name),
      );
      setForm((f) => ({
        ...f,
        registered: parsed.registered,
        rejected: parsed.rejected,
        total: parsed.total,
        candidates: [
          { name: data.aspirant.name, votes: own?.votes || "" },
          ...parsed.candidates.filter((c) => c !== own),
          ...(parsed.candidates.filter((c) => c !== own).length
            ? []
            : [{ name: "", votes: "" }]),
        ],
      }));
      setNotice(
        (result.confidence == null
          ? "PDF text extracted."
          : `Text recognition confidence: ${Math.round(result.confidence)}%.`) +
          (own
            ? " Verify every name and figure."
            : " Aspirant name was not matched. Enter their votes from the document."),
      );
      setStep(2);
    } catch (e) {
      setError(
        "Document reading failed. You can enter the figures manually and review the attachment.",
      );
      setStep(2);
    } finally {
      setBusy("");
    }
  };
  const submit = async () => {
    setError("");
    const problem = validateResult(form);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy("Submitting…");
    try {
      const evidence = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await request("POST", { ...form, evidence, filename: file.name });
      setNotice("Submitted for independent review.");
      setFile(null);
      setForm(blank(data.aspirant.name));
      setRaw("");
      setStep(1);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };
  const review = async (r, status) => {
    const comment = window.prompt("Review comment (required)");
    if (!comment) return;
    try {
      await request("PATCH", { id: r.id, status, comment });
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };
  const view = async (r) => {
    try {
      const d = await request("GET", null, "?evidence=" + r.id);
      const blob = await (await fetch(d.evidence)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      setError(e.message);
    }
  };
  const report = () => {
    const rows = [
      [
        "Station",
        "Status",
        "Candidate",
        "Votes",
        "Registered",
        "Rejected",
        "Total",
      ],
      ...data.results.flatMap((r) =>
        r.candidates.map((c) => [
          r.stationName,
          r.status,
          c.name,
          c.votes,
          r.registered,
          r.rejected,
          r.total,
        ]),
      ),
    ];
    const csv = rows
      .map((row) =>
        row
          .map(
            (v) =>
              '"' +
              String(v)
                .replace(/"/g, '""')
                .replace(/^[=+@-]/, "'$&") +
              '"',
          )
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "campaign-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const summary = summarizeResults(data?.results || []),
    valid = Object.values(summary.totals).reduce((a, b) => a + b, 0),
    rank = Object.entries(summary.totals).sort((a, b) => b[1] - a[1]);
  return (
    <section className="rs">
      <header className="rs-heading">
        <div>
          <span className="rs-eyebrow">ELECTION RESULTS / DOCUMENT INTAKE</span>
          <h1>Result submission</h1>
          <p>
            Upload the signed station return, check the figures, then send for
            review.
          </p>
        </div>
        <FileCheck2 size={36} />
      </header>
      {error && (
        <div role="alert" className="rs-alert">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rs-notice">
          {notice}
        </div>
      )}
      {!data ? (
        <p>Loading campaign profile…</p>
      ) : (
        <>
          <div className="rs-profile">
            <strong>{data.aspirant.name}</strong>
            <span>
              {data.aspirant.role} · Affiliated aspirant · Candidate A locked
            </span>
          </div>
          <div className="rs-layout">
            <article className="rs-card">
              <nav className="rs-steps" aria-label="Submission steps">
                {["Upload", "Review figures", "Confirm"].map((label, i) => (
                  <span key={label} className={step === i + 1 ? "active" : ""}>
                    {i + 1}. {label}
                  </span>
                ))}
              </nav>
              {step === 1 ? (
                <>
                  <h2>Attach station return</h2>
                  <p>
                    Form 34A is the presidential return. For other offices,
                    attach the corresponding official station return for this
                    aspirant’s contest.
                  </p>
                  <label className="rs-drop">
                    <UploadCloud size={36} />
                    <strong>Choose a photo or PDF</strong>
                    <span>
                      JPG, PNG, WebP or PDF · up to 5 MB · one station per
                      submission
                    </span>
                    <input
                      aria-label="Upload station return"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      disabled={!!busy}
                      onChange={(e) => upload(e.target.files[0])}
                    />
                  </label>
                  {busy && <p role="status">{busy}</p>}
                </>
              ) : (
                <>
                  <h2>
                    {step === 2
                      ? "Review extracted figures"
                      : "Confirm submission"}
                  </h2>
                  <label>
                    Polling station
                    <input
                      placeholder="Search assigned stations"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                      disabled={step === 3}
                      value={form.stationId}
                      onChange={(e) => change("stationId", e.target.value)}
                    >
                      <option value="">Select assigned station</option>
                      {data.stations
                        .filter(
                          (s) =>
                            !search ||
                            `${s.name} ${s.code}`
                              .toLowerCase()
                              .includes(search.toLowerCase()) ||
                            s.id === form.stationId,
                        )
                        .slice(0, 500)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} · {s.code || s.id}
                          </option>
                        ))}
                    </select>
                  </label>
                  <p className="rs-muted">
                    Candidate A is taken from your campaign profile. Confirm OCR
                    against the source, including candidates that were missed.
                  </p>
                  {form.candidates.map((c, i) => (
                    <div className="rs-candidate" key={i}>
                      <label>
                        {i === 0
                          ? "A · Affiliated aspirant"
                          : `Candidate ${i + 1}`}
                        <input
                          aria-label={`Candidate ${i + 1} name`}
                          value={c.name}
                          readOnly={i === 0 || step === 3}
                          onChange={(e) => candidate(i, "name", e.target.value)}
                        />
                      </label>
                      <label>
                        Votes
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={c.votes}
                          readOnly={step === 3}
                          onChange={(e) =>
                            candidate(i, "votes", e.target.value)
                          }
                        />
                      </label>
                      {i > 0 && step === 2 && (
                        <button
                          aria-label="Remove candidate"
                          onClick={() =>
                            change(
                              "candidates",
                              form.candidates.filter((_, j) => j !== i),
                            )
                          }
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {step === 2 && (
                    <button
                      className="rs-secondary"
                      onClick={() =>
                        change("candidates", [
                          ...form.candidates,
                          { name: "", votes: "" },
                        ])
                      }
                    >
                      <Plus size={16} /> Add candidate
                    </button>
                  )}
                  <div className="rs-totals">
                    {[
                      ["registered", "Registered voters"],
                      ["rejected", "Rejected ballots"],
                      ["total", "Total ballots cast"],
                    ].map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          type="number"
                          min="0"
                          step="1"
                          readOnly={step === 3}
                          value={form[key]}
                          onChange={(e) => change(key, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  {step === 3 && (
                    <label className="rs-check">
                      <input
                        type="checkbox"
                        checked={form.confirmed}
                        onChange={(e) =>
                          setForm({ ...form, confirmed: e.target.checked })
                        }
                      />{" "}
                      I checked every candidate, figure, and station against the
                      uploaded return. This is submitted data, pending review.
                    </label>
                  )}
                  <div className="rs-actions">
                    <button
                      className="rs-secondary"
                      disabled={!!busy}
                      onClick={() => setStep(step - 1)}
                    >
                      Back
                    </button>
                    {step === 2 ? (
                      <button
                        onClick={() => {
                          const problem = validateResult(form);
                          if (problem || !form.stationId) {
                            setError(problem || "Select a station.");
                            return;
                          }
                          setError("");
                          setStep(3);
                        }}
                      >
                        Continue <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        disabled={!!busy || !form.confirmed}
                        onClick={submit}
                      >
                        {busy || "Submit for review"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </article>
            <aside className="rs-card">
              <h2>Source document</h2>
              {preview ? (
                <>
                  {file.type === "application/pdf" ? (
                    <iframe title="Uploaded result document" src={preview} />
                  ) : (
                    <img alt="Uploaded station return" src={preview} />
                  )}
                  <p>{file.name}</p>
                </>
              ) : (
                <p className="rs-muted">Your document will appear here.</p>
              )}
              {raw && (
                <details>
                  <summary>Recognized text</summary>
                  <pre>{raw}</pre>
                </details>
              )}
            </aside>
          </div>
          <article className="rs-card rs-analysis">
            <div className="rs-heading">
              <h2>Results & analysis</h2>
              <button className="rs-secondary" onClick={report}>
                <Download size={16} /> Export CSV
              </button>
            </div>
            <div className="rs-metrics">
              <div>
                <strong>
                  {summary.approved} / {data.stations.length}
                </strong>
                <span>stations approved in your area</span>
              </div>
              <div>
                <strong>{summary.ballots.toLocaleString()}</strong>
                <span>reported ballots · approved only</span>
              </div>
              <div>
                <strong>
                  {data.results.filter((r) => r.status === "Submitted").length}
                </strong>
                <span>awaiting independent review</span>
              </div>
            </div>
            {rank.map(([name, votes]) => (
              <div className="rs-bar" key={name}>
                <span>{name}</span>
                <progress max={valid || 1} value={votes} />
                <strong>
                  {votes.toLocaleString()} ·{" "}
                  {valid ? ((votes / valid) * 100).toFixed(1) : 0}%
                  <small>
                    Scenario total:{" "}
                    {Math.round(
                      (votes / summary.approved) * data.stations.length,
                    ).toLocaleString()}
                  </small>
                </strong>
              </div>
            ))}
            <p className="rs-muted">
              Scenario projection: if remaining stations have the same candidate
              shares as approved stations, projected shares equal those above.
              Scenario totals also assume the same average ballots per station.
              Reporting stations are not a random sample; this is not a win
              probability or an official prediction. No projection is available
              until results are approved.
            </p>
            <div className="rs-table">
              <table>
                <thead>
                  <tr>
                    <th>Station</th>
                    <th>Status</th>
                    <th>Ballots</th>
                    <th>Document & review</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((r) => (
                    <tr key={r.id}>
                      <td>{r.stationName}</td>
                      <td>{r.status}</td>
                      <td>{r.total}</td>
                      <td>
                        <button
                          className="rs-secondary"
                          onClick={() => view(r)}
                        >
                          Download source
                        </button>
                        {r.canReview && r.status === "Submitted" && (
                          <>
                            <button onClick={() => review(r, "Approved")}>
                              Approve
                            </button>
                            <button
                              className="rs-secondary"
                              onClick={() => review(r, "Rejected")}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {r.review && <small>{r.review.comment}</small>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.results.length && <p>No station returns submitted yet.</p>}
            </div>
          </article>
        </>
      )}
    </section>
  );
};
