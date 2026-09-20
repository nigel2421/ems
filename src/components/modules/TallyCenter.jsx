import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { processOCRForm34A } from '../../services/api';
import {
  Vote,
  Plus,
  Scan,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileImage,
  X,
  Clock3,
  Scale,
  BarChart3
} from 'lucide-react';
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
import {
  resolveJurisdiction,
  hasNationalGeographyAccess,
  filterStationsByJurisdiction,
  filterTalliesByJurisdiction
} from '../../utils/jurisdictionAnalytics';
import '../dashboards/DashboardShared.css';
import './TallyCenter.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');

const CANDIDATE_COLORS = {
  A: '#006B3F',
  B: '#C9A227',
  C: '#0E7A45',
  Rejected: '#BB0A21'
};

const statusClass = (status) => {
  switch (status) {
    case 'Approved':
      return 'tc-status tc-status-approved';
    case 'Mismatch':
      return 'tc-status tc-status-mismatch';
    default:
      return 'tc-status tc-status-submitted';
  }
};

export const TallyCenter = () => {
  const { currentUser, canPerformAction } = useAuth();
  const { tallyResults, geography, submitTallyCenterForm, verifyTallyResult } = useData();


  const counties = geography?.counties || [];
  const isNational = hasNationalGeographyAccess(currentUser);
  const assignment = useMemo(
    () => resolveJurisdiction(currentUser, geography),
    [currentUser, geography]
  );
  const defaultCountyId = isNational
    ? counties[0]?.id || ''
    : assignment.county?.id || counties[0]?.id || '';

  const [activeTab, setActiveTab] = useState('summary');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCountyId, setSelectedCountyId] = useState(defaultCountyId);
  const [selectedStationId, setSelectedStationId] = useState('');

  const [candAVotes, setCandAVotes] = useState(412);
  const [candBVotes, setCandBVotes] = useState(198);
  const [candCVotes, setCandCVotes] = useState(45);
  const [rejectedVotes, setRejectedVotes] = useState(12);
  const [evidenceImage, setEvidenceImage] = useState(null);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [ocrData, setOcrData] = useState(null);

  const [verifyingTally, setVerifyingTally] = useState(null);
  const [verifyComment, setVerifyComment] = useState('');

  useEffect(() => {
    if (!isNational && assignment.county?.id) {
      setSelectedCountyId(assignment.county.id);
      return;
    }
    if (isNational && !selectedCountyId && defaultCountyId) {
      setSelectedCountyId(defaultCountyId);
    }
  }, [isNational, assignment.county?.id, defaultCountyId, selectedCountyId]);

  const scopedStations = useMemo(() => {
    const list = geography?.pollingStations || [];
    if (!isNational) {
      return filterStationsByJurisdiction(list, assignment);
    }
    if (!selectedCountyId) return [];
    return list.filter((ps) => ps && ps.countyId === selectedCountyId);
  }, [geography?.pollingStations, isNational, assignment, selectedCountyId]);

  const entryStations = useMemo(() => scopedStations.slice(0, 200), [scopedStations]);

  useEffect(() => {
    if (!entryStations.length) {
      setSelectedStationId('');
      return;
    }
    if (!entryStations.some((ps) => ps.id === selectedStationId)) {
      setSelectedStationId(entryStations[0].id);
    }
  }, [entryStations, selectedStationId]);

  const selectedPs = entryStations.find((ps) => ps.id === selectedStationId) || entryStations[0];
  const registeredVoters = selectedPs?.registeredVoters || 750;

  const calculatedTotal =
    Number(candAVotes || 0) + Number(candBVotes || 0) + Number(candCVotes || 0) + Number(rejectedVotes || 0);
  const isExceedingReg = calculatedTotal > registeredVoters;

  const scopedTallies = useMemo(
    () =>
      filterTalliesByJurisdiction(tallyResults, geography?.pollingStations || [], assignment, {
        national: isNational
      }),
    [tallyResults, geography?.pollingStations, assignment, isNational]
  );

  const metrics = useMemo(() => {
    const list = scopedTallies;
    return {
      total: list.length,
      submitted: list.filter((t) => t.status === 'Submitted').length,
      approved: list.filter((t) => t.status === 'Approved').length,
      mismatch: list.filter((t) => t.status === 'Mismatch').length
    };
  }, [scopedTallies]);

  const voteAnalytics = useMemo(() => {
    const list = scopedTallies;
    const totals = list.reduce(
      (acc, tally) => {
        acc.candA += Number(tally.candAVotes || 0);
        acc.candB += Number(tally.candBVotes || 0);
        acc.candC += Number(tally.candCVotes || 0);
        acc.rejected += Number(tally.rejectedVotes || 0);
        return acc;
      },
      { candA: 0, candB: 0, candC: 0, rejected: 0 }
    );

    const candidateTotal = totals.candA + totals.candB + totals.candC;
    const allBallots = candidateTotal + totals.rejected;
    const share = (value) => (candidateTotal > 0 ? Math.round((value / candidateTotal) * 1000) / 10 : 0);

    return {
      ...totals,
      candidateTotal,
      allBallots,
      shares: {
        candA: share(totals.candA),
        candB: share(totals.candB),
        candC: share(totals.candC)
      },
      leader:
        totals.candA >= totals.candB && totals.candA >= totals.candC
          ? 'Candidate A'
          : totals.candB >= totals.candC
            ? 'Candidate B'
            : 'Candidate C',
      margin: Math.abs(totals.candA - totals.candB)
    };
  }, [scopedTallies]);

  const scopeLabel = isNational
    ? 'National tally desk'
    : assignment.title || 'Assigned jurisdiction';
  const scopeSubtitle = isNational
    ? 'Form 34A capture, OCR assist, and supervisor verification'
    : `Form 34A for your ${String(assignment.label || 'area').toLowerCase()} only · ${assignment.county?.name || ''}${
        assignment.constituency ? ` · ${assignment.constituency.name}` : ''
      }${assignment.ward ? ` · ${assignment.ward.name}` : ''}`;
  const countyOptions = isNational
    ? counties
    : counties.filter((c) => c.id === assignment.county?.id);

  const candidatePieData = useMemo(
    () => ({
      labels: ['Candidate A', 'Candidate B', 'Candidate C'],
      datasets: [
        {
          label: 'Total votes',
          data: [voteAnalytics.candA, voteAnalytics.candB, voteAnalytics.candC],
          backgroundColor: [CANDIDATE_COLORS.A, CANDIDATE_COLORS.B, CANDIDATE_COLORS.C],
          borderColor: '#FFFFFF',
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    }),
    [voteAnalytics]
  );

  const ballotPieData = useMemo(
    () => ({
      labels: ['Candidate A', 'Candidate B', 'Candidate C', 'Rejected'],
      datasets: [
        {
          label: 'Ballots',
          data: [voteAnalytics.candA, voteAnalytics.candB, voteAnalytics.candC, voteAnalytics.rejected],
          backgroundColor: [
            CANDIDATE_COLORS.A,
            CANDIDATE_COLORS.B,
            CANDIDATE_COLORS.C,
            CANDIDATE_COLORS.Rejected
          ],
          borderColor: '#FFFFFF',
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    }),
    [voteAnalytics]
  );

  const comparisonBarData = useMemo(
    () => ({
      labels: ['Candidate A', 'Candidate B', 'Candidate C'],
      datasets: [
        {
          label: 'Total votes',
          data: [voteAnalytics.candA, voteAnalytics.candB, voteAnalytics.candC],
          backgroundColor: [CANDIDATE_COLORS.A, CANDIDATE_COLORS.B, CANDIDATE_COLORS.C],
          borderRadius: 10,
          maxBarThickness: 48
        }
      ]
    }),
    [voteAnalytics]
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
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: 'circle',
            color: '#6B756F',
            font: { size: 11, family: 'Inter, Segoe UI, sans-serif' },
            padding: 12
          }
        },
        tooltip: {
          backgroundColor: '#073322',
          titleColor: '#fff',
          bodyColor: '#fff',
          callbacks: {
            label: (ctx) => `${ctx.label}: ${formatCount(ctx.raw || 0)} votes`
          }
        }
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
        tooltip: {
          backgroundColor: '#073322',
          titleColor: '#fff',
          bodyColor: '#fff',
          callbacks: {
            label: (ctx) => `${formatCount(ctx.raw || 0)} votes`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6B756F', font: { size: 11 } }
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

  const filteredTallies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return scopedTallies.filter((tally) => {
      if (statusFilter && tally.status !== statusFilter) return false;
      if (!term) return true;
      return (
        tally.pollingStationName?.toLowerCase().includes(term) ||
        tally.pollingStationCode?.toLowerCase().includes(term)
      );
    });
  }, [scopedTallies, statusFilter, searchTerm]);

  const handleSimulateOCR = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceImage(URL.createObjectURL(file));
    setIsScanningOCR(true);

    const ocrRes = await processOCRForm34A(file);
    setIsScanningOCR(false);
    if (ocrRes.success) {
      setOcrData(ocrRes);
      setCandAVotes(ocrRes.extractedVotes.candA);
      setCandBVotes(ocrRes.extractedVotes.candB);
      setCandCVotes(ocrRes.extractedVotes.candC);
      setRejectedVotes(ocrRes.extractedVotes.rejected);
    }
  };

  const handleSubmitTally = (e) => {
    e.preventDefault();
    if (!selectedPs) return;

    submitTallyCenterForm(
      {
        pollingStationId: selectedPs.id,
        pollingStationCode: selectedPs.code,
        pollingStationName: selectedPs.name,
        registeredVoters,
        candAVotes: Number(candAVotes),
        candBVotes: Number(candBVotes),
        candCVotes: Number(candCVotes),
        rejectedVotes: Number(rejectedVotes),
        agentId: currentUser?.id || 'AGT-001',
        evidence: {
          formType: 'Form 34A',
          imageUrl:
            evidenceImage ||
            'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&auto=format&fit=crop&q=80',
          ocrExtracted: ocrData?.extractedVotes
        }
      },
      currentUser
    );

    setActiveTab('summary');
  };

  const handleVerifySubmit = (status) => {
    if (!verifyingTally) return;
    verifyTallyResult(verifyingTally.id, status, verifyComment, currentUser);
    setVerifyingTally(null);
    setVerifyComment('');
  };

  return (
    <div className="role-dash tc-shell">
      <header className="tc-top">
        <div>
          <h1>Tally center</h1>
          <p>
            {scopeLabel}: {scopeSubtitle}
          </p>
        </div>

        <div className="tc-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'summary'}
            className={activeTab === 'summary' ? 'is-active' : ''}
            onClick={() => setActiveTab('summary')}
          >
            <Vote strokeWidth={1.75} />
            Live stream
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'entry'}
            className={activeTab === 'entry' ? 'is-active' : ''}
            onClick={() => setActiveTab('entry')}
          >
            <Plus strokeWidth={1.75} />
            Submit Form 34A
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'analytics'}
            className={activeTab === 'analytics' ? 'is-active' : ''}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 strokeWidth={1.75} />
            Analytics
          </button>
        </div>
      </header>

      <section className="admin-metric-grid tc-metrics">
        <article className="admin-metric is-featured">
          <div className="admin-metric-top">
            <span>Forms received</span>
            <div className="admin-metric-icon">
              <Vote strokeWidth={1.75} />
            </div>
          </div>
          <strong>{formatCount(metrics.total)}</strong>
          <small>Station tallies in queue</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Awaiting review</span>
            <div className="admin-metric-icon">
              <Clock3 strokeWidth={1.75} />
            </div>
          </div>
          <strong>{formatCount(metrics.submitted)}</strong>
          <small>Submitted status</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Approved</span>
            <div className="admin-metric-icon">
              <CheckCircle2 strokeWidth={1.75} />
            </div>
          </div>
          <strong>{formatCount(metrics.approved)}</strong>
          <small>Supervisor signed off</small>
        </article>
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span>Mismatches</span>
            <div className="admin-metric-icon">
              <AlertTriangle strokeWidth={1.75} />
            </div>
          </div>
          <strong>{formatCount(metrics.mismatch)}</strong>
          <small>Math or evidence flags</small>
        </article>
      </section>

      {activeTab === 'summary' && (
        <article className="tc-panel">
          <div className="tc-toolbar">
            <input
              type="search"
              className="form-input tc-search"
              placeholder="Search station name or code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Mismatch">Mismatch</option>
            </select>
          </div>

          <div className="custom-table-container tc-table-wrap">
            <table className="custom-table tc-table">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>A</th>
                  <th>B</th>
                  <th>C</th>
                  <th>Rejected</th>
                  <th>Cast / Reg</th>
                  <th>Evidence</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredTallies.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <div className="admin-empty">No tallies match the current filters.</div>
                    </td>
                  </tr>
                ) : (
                  filteredTallies.map((tally) => (
                    <tr key={tally.id}>
                      <td>
                        <strong className="tc-station-name">{tally.pollingStationName}</strong>
                        <span className="tc-meta">{tally.pollingStationCode}</span>
                      </td>
                      <td className="tc-vote tc-vote-a">{formatCount(tally.candAVotes)}</td>
                      <td className="tc-vote">{formatCount(tally.candBVotes)}</td>
                      <td className="tc-vote">{formatCount(tally.candCVotes)}</td>
                      <td className="tc-meta-cell">{formatCount(tally.rejectedVotes)}</td>
                      <td>
                        <strong className={tally.status === 'Mismatch' ? 'tc-cast-bad' : 'tc-cast-ok'}>
                          {formatCount(tally.totalVotesCast)}
                        </strong>
                        <span className="tc-meta"> / {formatCount(tally.registeredVoters)}</span>
                      </td>
                      <td>
                        {tally.evidence?.imageUrl ? (
                          <a
                            href={tally.evidence.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="tc-evidence"
                          >
                            <FileImage strokeWidth={1.75} />
                            Form 34A
                          </a>
                        ) : (
                          <span className="tc-meta">—</span>
                        )}
                      </td>
                      <td>
                        <span className={statusClass(tally.status)}>{tally.status}</span>
                      </td>
                      <td>
                        {canPerformAction?.('VERIFY_TALLY') ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn-ghost tc-verify-btn"
                            onClick={() => setVerifyingTally(tally)}
                          >
                            <ShieldCheck strokeWidth={1.75} />
                            Verify
                          </button>
                        ) : (
                          <span className="tc-meta" title="Verification restricted to Coordinators and Admins">Read-only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {activeTab === 'analytics' && (
        <section className="tc-analytics">
          <div className="tc-analytics-summary">
            <article className="tc-share-card">
              <span>Candidate A</span>
              <strong>{formatCount(voteAnalytics.candA)}</strong>
              <small>{voteAnalytics.shares.candA}% share</small>
            </article>
            <article className="tc-share-card">
              <span>Candidate B</span>
              <strong>{formatCount(voteAnalytics.candB)}</strong>
              <small>{voteAnalytics.shares.candB}% share</small>
            </article>
            <article className="tc-share-card">
              <span>Candidate C</span>
              <strong>{formatCount(voteAnalytics.candC)}</strong>
              <small>{voteAnalytics.shares.candC}% share</small>
            </article>
            <article className="tc-share-card tc-share-lead">
              <span>Current lead</span>
              <strong>{voteAnalytics.leader}</strong>
              <small>Margin {formatCount(voteAnalytics.margin)} votes</small>
            </article>
          </div>

          <div className="tc-chart-grid">
            <article className="tc-panel tc-chart-card">
              <div className="tc-chart-head">
                <h2>Candidate vote share</h2>
                <p>Total votes across Form 34A tallies in {scopeLabel}</p>
              </div>
              <div className="tc-chart-canvas">
                <Pie data={candidatePieData} options={pieOptions} />
              </div>
            </article>

            <article className="tc-panel tc-chart-card">
              <div className="tc-chart-head">
                <h2>Ballot composition</h2>
                <p>Valid candidate votes versus rejected ballots</p>
              </div>
              <div className="tc-chart-canvas">
                <Pie data={ballotPieData} options={pieOptions} />
              </div>
            </article>

            <article className="tc-panel tc-chart-card tc-chart-wide">
              <div className="tc-chart-head">
                <h2>Candidate comparison</h2>
                <p>
                  Aggregate totals · {formatCount(voteAnalytics.candidateTotal)} valid votes ·{' '}
                  {formatCount(voteAnalytics.rejected)} rejected
                </p>
              </div>
              <div className="tc-chart-canvas tc-chart-bar">
                <Bar data={comparisonBarData} options={barOptions} />
              </div>
            </article>
          </div>
        </section>
      )}

      {activeTab === 'entry' && (
        <article className="tc-panel tc-entry-panel">
          <div className="tc-entry-head">
            <div>
              <h2>Submit Form 34A</h2>
              <p>Select a station, upload evidence, and confirm ballot figures before transmission.</p>
            </div>
          </div>

          <form onSubmit={handleSubmitTally} className="tc-entry-form">
            <div className="tc-form-grid">
              <div className="form-group">
                <label className="form-label">County</label>
                <select
                  className="form-select"
                  value={selectedCountyId}
                  onChange={(e) => {
                    if (!isNational) return;
                    setSelectedCountyId(e.target.value);
                  }}
                  disabled={!isNational}
                  title={isNational ? 'Select county' : `Locked to your ${String(assignment.label || 'assignment').toLowerCase()}`}
                >
                  {countyOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isNational ? c.name : scopeLabel}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Polling station</label>
                <select
                  className="form-select"
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  required
                >
                  {entryStations.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      {ps.code} — {ps.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="tc-ocr-box">
              <div className="tc-ocr-title">
                <Scan strokeWidth={1.75} />
                Form 34A evidence & OCR assist
              </div>
              <input type="file" accept="image/*" onChange={handleSimulateOCR} className="form-input" />
              {isScanningOCR && <p className="tc-ocr-scanning">Extracting figures from Form 34A…</p>}
              {ocrData && (
                <p className="tc-ocr-ok">
                  Extraction complete · confidence {Math.round((ocrData.confidence || 0) * 100)}%
                </p>
              )}
            </div>

            <div className="tc-vote-grid">
              <div className="form-group">
                <label className="form-label">Candidate A</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={candAVotes}
                  onChange={(e) => setCandAVotes(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Candidate B</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={candBVotes}
                  onChange={(e) => setCandBVotes(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Candidate C</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={candCVotes}
                  onChange={(e) => setCandCVotes(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rejected ballots</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={rejectedVotes}
                  onChange={(e) => setRejectedVotes(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={`tc-math ${isExceedingReg ? 'is-bad' : 'is-ok'}`}>
              <div>
                <Scale strokeWidth={1.75} />
                <span>
                  Total cast <strong>{formatCount(calculatedTotal)}</strong> / registered{' '}
                  <strong>{formatCount(registeredVoters)}</strong>
                </span>
              </div>
              {isExceedingReg && (
                <span className="tc-math-flag">
                  <AlertTriangle strokeWidth={1.75} />
                  Cast exceeds registered voters
                </span>
              )}
            </div>

            <button type="submit" className="admin-btn admin-btn-primary tc-submit" disabled={!selectedPs}>
              <Vote strokeWidth={1.75} />
              Transmit to verification queue
            </button>
          </form>
        </article>
      )}

      {verifyingTally && (
        <div className="tc-modal-overlay" onClick={() => setVerifyingTally(null)}>
          <div className="tc-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="tc-modal-head">
              <div>
                <h3>Verify tally</h3>
                <p>{verifyingTally.pollingStationName}</p>
              </div>
              <button type="button" className="tc-icon-btn" onClick={() => setVerifyingTally(null)} aria-label="Close">
                <X strokeWidth={1.75} />
              </button>
            </div>

            <div className="tc-verify-grid">
              <div>
                <span>Candidate A</span>
                <strong>{formatCount(verifyingTally.candAVotes)}</strong>
              </div>
              <div>
                <span>Candidate B</span>
                <strong>{formatCount(verifyingTally.candBVotes)}</strong>
              </div>
              <div>
                <span>Candidate C</span>
                <strong>{formatCount(verifyingTally.candCVotes)}</strong>
              </div>
              <div>
                <span>Rejected</span>
                <strong>{formatCount(verifyingTally.rejectedVotes)}</strong>
              </div>
              <div className="tc-verify-total">
                <span>Total cast</span>
                <strong>
                  {formatCount(verifyingTally.totalVotesCast)} / {formatCount(verifyingTally.registeredVoters)}
                </strong>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Supervisor comment</label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Confirm Form 34A evidence and ballot reconciliation notes"
                value={verifyComment}
                onChange={(e) => setVerifyComment(e.target.value)}
              />
            </div>

            <div className="tc-modal-actions">
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => handleVerifySubmit('Approved')}>
                <CheckCircle2 strokeWidth={1.75} />
                Approve
              </button>
              <button type="button" className="admin-btn tc-btn-danger" onClick={() => handleVerifySubmit('Mismatch')}>
                <XCircle strokeWidth={1.75} />
                Flag mismatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
