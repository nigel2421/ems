export const normalizeName = (v) =>
  String(v || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
export const parseResultText = (text, aspirant) => {
  const candidates = [];
  for (const line of text.replace(/(\d),(?=\d{3}\b)/g, "$1").split(/\r?\n/)) {
    const match = line
      .trim()
      .match(/^(?:\d+[.)]?\s+)?([A-Za-z][A-Za-z .'-]{3,})\s+(\d{1,4})$/);
    if (
      match &&
      !/total|registered|rejected|valid|votes|station/i.test(match[1])
    )
      candidates.push({ name: match[1].trim(), votes: match[2] });
  }
  const take = (label) =>
    text.match(new RegExp(label + "[^0-9]{0,18}(\\d+)", "i"))?.[1] || "";
  return {
    candidates,
    registered: take("registered voters"),
    rejected: take("rejected"),
    total: take("total (?:number of )?(?:votes|ballots)(?: cast)?"),
    matched: candidates.some(
      (c) => normalizeName(c.name) === normalizeName(aspirant),
    ),
  };
};
export const validateResult = (d) => {
  if (!d.candidates?.length) return "Add candidates.";
  if (
    d.candidates.some(
      (c) =>
        typeof c.name !== "string" ||
        !c.name.trim() ||
        !Number.isSafeInteger(Number(c.votes)) ||
        Number(c.votes) < 0 ||
        c.votes === "",
    )
  )
    return "Enter whole votes for each candidate.";
  if (
    new Set(d.candidates.map((c) => normalizeName(c.name))).size !==
    d.candidates.length
  )
    return "Candidate names must be distinct.";
  for (const key of ["registered", "rejected", "total"])
    if (
      String(d[key] ?? "").trim() === "" ||
      !Number.isSafeInteger(Number(d[key])) ||
      Number(d[key]) < 0
    )
      return "Complete totals.";
  if (
    d.candidates.reduce((n, c) => n + Number(c.votes), 0) +
      Number(d.rejected) !==
    Number(d.total)
  )
    return "Candidates plus rejected must equal total.";
  if (Number(d.total) > Number(d.registered))
    return "Total exceeds registered voters.";
  return "";
};
export const summarizeResults = (rows) => {
  const approved = rows.filter((r) => r.status === "Approved"),
    totals = {};
  for (const r of approved)
    for (const c of r.candidates)
      totals[c.name] = (totals[c.name] || 0) + Number(c.votes);
  return {
    approved: approved.length,
    ballots: approved.reduce((n, r) => n + Number(r.total), 0),
    totals,
  };
};
