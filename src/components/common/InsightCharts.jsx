import React from "react";
import "./InsightCharts.css";

const insightColors = ["#147d67", "#668ce8", "#e9af55", "#aa8bd4", "#d37a87"];
export function InsightBars({
  items,
  percent = false,
  empty = "No records available.",
}) {
  const max = percent ? 100 : Math.max(1, ...items.map((x) => x.value));
  return (
    <div className="insight-bars">
      {items.length ? (
        items.map((item, i) => (
          <div className="insight-row" key={item.id || item.label}>
            <div>
              <span>{item.label}</span>
              <strong>
                {item.value.toLocaleString()}
                {percent ? "%" : ""}
              </strong>
            </div>
            <div className="insight-track">
              <span
                style={{
                  width: `${Math.min(100, (item.value / max) * 100)}%`,
                  background: insightColors[i % 5],
                }}
              />
            </div>
            {item.detail && <small>{item.detail}</small>}
          </div>
        ))
      ) : (
        <p className="insight-empty">{empty}</p>
      )}
    </div>
  );
}
export function InsightRing({ items, label }) {
  const total = items.reduce((n, x) => n + x.value, 0);
  return (
    <div className="insight-ring">
      <svg
        viewBox="0 0 120 120"
        role="img"
        aria-label={`${label}: ${items.map((x) => `${x.label} ${x.value}`).join(", ")}`}
      >
        <circle
          cx="60"
          cy="60"
          r="46"
          fill="none"
          stroke="var(--insight-track,#eaf0ee)"
          strokeWidth="12"
        />
        {items.map((x, i) => {
          const length = total ? (x.value / total) * 289.03 : 0;
          const start = total
            ? (items.slice(0, i).reduce((sum, item) => sum + item.value, 0) /
                total) *
              289.03
            : 0;
          return (
            <circle
              key={x.label}
              cx="60"
              cy="60"
              r="46"
              fill="none"
              stroke={insightColors[i % 5]}
              strokeWidth="12"
              strokeDasharray={`${length} ${289.03 - length}`}
              strokeDashoffset={-start}
              transform="rotate(-90 60 60)"
            />
          );
        })}
        <text x="60" y="60" textAnchor="middle" className="insight-total">
          {total.toLocaleString()}
        </text>
        <text x="60" y="77" textAnchor="middle" className="insight-label">
          {label}
        </text>
      </svg>
      <div>
        {items.map((x, i) => (
          <div className="insight-key" key={x.label}>
            <i style={{ background: insightColors[i % 5] }} />
            <span>{x.label}</span>
            <strong>{x.value.toLocaleString()}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
export function ResponseTrend({ responses }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const key = d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
    return {
      label: d.toLocaleDateString("en-KE", {
        weekday: "short",
        timeZone: "Africa/Nairobi",
      }),
      key,
      value: 0,
    };
  });
  for (const r of responses) {
    const d = new Date(r.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const day = days.find(
      (x) =>
        x.key === d.toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" }),
    );
    if (day) day.value++;
  }
  const max = Math.max(1, ...days.map((x) => x.value));
  return (
    <div
      className="insight-trend"
      role="img"
      aria-label={`Responses in the last seven days: ${days.map((d) => `${d.label}: ${d.value}`).join(", ")}`}
    >
      {days.map((d) => (
        <div key={d.key}>
          <strong>{d.value}</strong>
          <div className="insight-column">
            <i style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
