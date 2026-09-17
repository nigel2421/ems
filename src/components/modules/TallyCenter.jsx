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
  Scale
} from 'lucide-react';
import '../dashboards/DashboardShared.css';
import './TallyCenter.css';

const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');

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
  const { currentUser } = useAuth();
  const { tallyResults, geography, submitTallyCenterForm, verifyTallyResult } = useData();

  const counties = geography?.counties || [];
  const defaultCountyId = counties[0]?.id || '';

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
    if (!selectedCountyId && defaultCountyId) setSelectedCountyId(defaultCountyId);
  }, [defaultCountyId, selectedCountyId]);

  const countyStations = useMemo(() => {
    if (!selectedCountyId) return [];
    const list = geography?.pollingStations || [];
    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      const ps = list[i];
      if (ps && ps.countyId === selectedCountyId) out.push(ps);
    }
    return out.slice(0, 200);
  }, [geography?.pollingStations, selectedCountyId]);

  useEffect(() => {
    if (!countyStations.length) {
      setSelectedStationId('');
      return;
    }
    if (!countyStations.some((ps) => ps.id === selectedStationId)) {
      setSelectedStationId(countyStations[0].id);
    }
  }, [countyStations, selectedStationId]);

  const selectedPs = countyStations.find((ps) => ps.id === selectedStationId) || countyStations[0];
  const registeredVoters = selectedPs?.registeredVoters || 750;

  const calculatedTotal =
    Number(candAVotes || 0) + Number(candBVotes || 0) + Number(candCVotes || 0) + Number(rejectedVotes || 0);
  const isExceedingReg = calculatedTotal > registeredVoters;

  const metrics = useMemo(() => {
    const list = tallyResults || [];
    return {
      total: list.length,
      submitted: list.filter((t) => t.status === 'Submitted').length,
      approved: list.filter((t) => t.status === 'Approved').length,
      mismatch: list.filter((t) => t.status === 'Mismatch').length
    };
  }, [tallyResults]);

  const filteredTallies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (tallyResults || []).filter((tally) => {
      if (statusFilter && tally.status !== statusFilter) return false;
      if (!term) return true;
      return (
        tally.pollingStationName?.toLowerCase().includes(term) ||
        tally.pollingStationCode?.toLowerCase().includes(term)
      );
    });
  }, [tallyResults, statusFilter, searchTerm]);

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
          <p>Form 34A capture, OCR assist, and supervisor verification</p>
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
                        <button
                          type="button"
                          className="admin-btn admin-btn-ghost tc-verify-btn"
                          onClick={() => setVerifyingTally(tally)}
                        >
                          <ShieldCheck strokeWidth={1.75} />
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
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
                  onChange={(e) => setSelectedCountyId(e.target.value)}
                >
                  {counties.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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
                  {countyStations.map((ps) => (
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
