import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { Users, Building2, Layers, Trophy, MapPin } from 'lucide-react';
import { buildJurisdictionAnalytics, CHART_COLORS } from '../../utils/jurisdictionAnalytics';
import './JurisdictionVoterAnalytics.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');

const chartTooltip = {
  backgroundColor: '#073322',
  titleColor: '#fff',
  bodyColor: '#fff',
  callbacks: {
    label: (ctx) => `${ctx.label || ctx.dataset.label}: ${formatCount(ctx.raw || 0)} voters`
  }
};

export const JurisdictionVoterAnalytics = ({ user, geography, onOpenModule }) => {
  const analytics = useMemo(() => buildJurisdictionAnalytics(user, geography), [user, geography]);

  const {
    scope,
    totalVoters,
    unitCount,
    stationCount,
    breakdownLabel,
    breakdown,
    topBlocks,
    topShare,
    insights
  } = analytics;

  const pieSource = topBlocks.length ? topBlocks : breakdown.slice(0, 8);
  const barSource = breakdown.slice(0, 10);

  const pieData = useMemo(
    () => ({
      labels: pieSource.map((row) => row.name),
      datasets: [
        {
          data: pieSource.map((row) => row.registeredVoters),
          backgroundColor: pieSource.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          borderColor: '#FFFFFF',
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    }),
    [pieSource]
  );

  const barData = useMemo(
    () => ({
      labels: barSource.map((row) => row.name),
      datasets: [
        {
          label: 'Registered voters',
          data: barSource.map((row) => row.registeredVoters),
          backgroundColor: barSource.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          borderRadius: 8,
          maxBarThickness: 42
        }
      ]
    }),
    [barSource]
  );

  const pieOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 10,
            usePointStyle: true,
            pointStyle: 'circle',
            color: '#6B756F',
            font: { size: 11, family: 'Inter, Segoe UI, sans-serif' },
            padding: 10
          }
        },
        tooltip: chartTooltip
      }
    }),
    []
  );

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: chartTooltip
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#6B756F',
            font: { size: 10 },
            maxRotation: 45,
            minRotation: 0,
            callback(value) {
              const label = this.getLabelForValue(value);
              return label?.length > 14 ? `${label.slice(0, 14)}…` : label;
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#E6EBE8' },
          ticks: {
            color: '#6B756F',
            font: { size: 11 },
            callback: (value) => formatCount(value)
          }
        }
      }
    }),
    []
  );

  const roleHint =
    scope.level === 'county'
      ? 'Focus mobilisation on the largest constituencies and protect high-registration wards inside each.'
      : scope.level === 'constituency'
        ? 'Prioritise top wards by registered voters for agent coverage, GOTV, and Form 34A control.'
        : 'Concentrate agents on the densest polling streams — these are your decisive voter blocks.';

  if (!scope.county && !scope.constituency && !scope.ward) {
    return (
      <article className="admin-card jva-empty">
        <p>No jurisdiction geography could be resolved for this account.</p>
      </article>
    );
  }

  return (
    <section className="jva-shell">
      <header className="jva-head">
        <div>
          <span className="jva-kicker">{scope.label} voter intelligence</span>
          <h2>{scope.title}</h2>
          <p>{roleHint}</p>
        </div>
        {onOpenModule && (
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onOpenModule('polling_stations')}>
            <MapPin strokeWidth={1.75} />
            Open polling intel
          </button>
        )}
      </header>

      <div className="admin-metric-grid jva-metrics">
        <article className="admin-metric is-featured">
          <div className="admin-metric-top">
            <span>Total registered voters</span>
            <div className="admin-metric-icon">
              <Users strokeWidth={1.75} />
            </div>
          </div>
          <strong>{formatCount(totalVoters)}</strong>
          <small>
            {scope.county?.name}
            {scope.constituency ? ` · ${scope.constituency.name}` : ''}
            {scope.ward ? ` · ${scope.ward.name}` : ''}
          </small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>{breakdownLabel}</span>
            <div className="admin-metric-icon">
              <Layers strokeWidth={1.75} />
            </div>
          </div>
          <strong>{formatCount(unitCount)}</strong>
          <small>Reporting units in scope</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Polling stations</span>
            <div className="admin-metric-icon">
              <Building2 strokeWidth={1.75} />
            </div>
          </div>
          <strong>{formatCount(stationCount)}</strong>
          <small>Gazetted streams</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Top voter blocks</span>
            <div className="admin-metric-icon">
              <Trophy strokeWidth={1.75} />
            </div>
          </div>
          <strong>{topShare}%</strong>
          <small>Share held by top {Math.min(5, topBlocks.length)} units</small>
        </article>
      </div>

      <div className="jva-charts">
        <article className="admin-card jva-chart-card">
          <div className="admin-card-head">
            <div>
              <h2>Main voter blocks</h2>
              <p>Highest registration concentrations in your {scope.label.toLowerCase()}</p>
            </div>
          </div>
          <div className="jva-chart-canvas">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </article>

        <article className="admin-card jva-chart-card">
          <div className="admin-card-head">
            <div>
              <h2>{breakdownLabel} comparison</h2>
              <p>Registered voters by unit</p>
            </div>
          </div>
          <div className="jva-chart-canvas jva-bar">
            <Bar data={barData} options={barOptions} />
          </div>
        </article>
      </div>

      <article className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>Priority highlights</h2>
            <p>What to watch in this jurisdiction</p>
          </div>
        </div>
        <div className="jva-highlights">
          <div className="jva-highlight">
            <span>Largest block</span>
            <strong>{insights.largestBlock?.name || '—'}</strong>
            <small>{formatCount(insights.largestBlock?.registeredVoters || 0)} voters</small>
          </div>
          <div className="jva-highlight">
            <span>Average unit size</span>
            <strong>{formatCount(insights.averageBlock)}</strong>
            <small>Registered voters per {breakdownLabel.slice(0, -1).toLowerCase() || 'unit'}</small>
          </div>
          <div className="jva-highlight">
            <span>Coverage ask</span>
            <strong>{formatCount(Math.min(5, topBlocks.length))} hot zones</strong>
            <small>Ensure agents, materials, and Form 34A control here first</small>
          </div>
        </div>

        <div className="custom-table-container jva-table">
          <table className="custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{breakdownLabel.slice(0, -1) || 'Unit'}</th>
                <th>Registered voters</th>
                <th>Share</th>
                <th>Child units</th>
              </tr>
            </thead>
            <tbody>
              {topBlocks.map((row, index) => {
                const share = totalVoters > 0 ? Math.round((row.registeredVoters / totalVoters) * 1000) / 10 : 0;
                return (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{row.name}</strong>
                      {row.code ? <div className="jva-code">{row.code}</div> : null}
                    </td>
                    <td>{formatCount(row.registeredVoters)}</td>
                    <td>{share}%</td>
                    <td>{formatCount(row.childCount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};
