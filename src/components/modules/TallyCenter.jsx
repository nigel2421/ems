import React, { useState } from 'react';
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
  Upload,
  Search,
  Filter,
  X,
  Lock,
  Eye,
  Building2
} from 'lucide-react';

export const TallyCenter = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { tallyResults, geography, submitTallyCenterForm, verifyTallyResult } = useData();

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'entry' | 'verification'
  const [selectedStationId, setSelectedStationId] = useState(geography.pollingStations[0]?.id || '');
  
  // Vote Entry Form State
  const [candAVotes, setCandAVotes] = useState(412);
  const [candBVotes, setCandBVotes] = useState(198);
  const [candCVotes, setCandCVotes] = useState(45);
  const [rejectedVotes, setRejectedVotes] = useState(12);
  const [evidenceImage, setEvidenceImage] = useState(null);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [ocrData, setOcrData] = useState(null);

  // Verification Modal State
  const [verifyingTally, setVerifyingTally] = useState(null);
  const [verifyComment, setVerifyComment] = useState('');

  const selectedPs = geography.pollingStations.find(ps => ps.id === selectedStationId) || geography.pollingStations[0];
  const registeredVoters = selectedPs?.registeredVoters || 750;

  const calculatedTotal = parseInt(candAVotes || 0) + parseInt(candBVotes || 0) + parseInt(candCVotes || 0) + parseInt(rejectedVotes || 0);
  const isExceedingReg = calculatedTotal > registeredVoters;

  const handleSimulateOCR = async (e) => {
    const file = e.target.files[0];
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
    submitTallyCenterForm({
      pollingStationId: selectedPs.id,
      pollingStationCode: selectedPs.code,
      pollingStationName: selectedPs.name,
      registeredVoters,
      candAVotes: parseInt(candAVotes),
      candBVotes: parseInt(candBVotes),
      candCVotes: parseInt(candCVotes),
      rejectedVotes: parseInt(rejectedVotes),
      agentId: currentUser?.id || 'AGT-001',
      evidence: {
        formType: 'Form 34A',
        imageUrl: evidenceImage || 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&auto=format&fit=crop&q=80',
        ocrExtracted: ocrData?.extractedVotes
      }
    }, currentUser);

    setActiveTab('summary');
  };

  const handleVerifySubmit = (status) => {
    if (!verifyingTally) return;
    verifyTallyResult(verifyingTally.id, status, verifyComment, currentUser);
    setVerifyingTally(null);
    setVerifyComment('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Vote style={{ width: '28px', height: '28px', color: '#f59e0b' }} />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Election Day Tally Center Operations</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Capture Form 34A tallies, run simulated OCR scanner extraction, and process supervisor approvals.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('summary')}>
            <Vote style={{ width: '15px', height: '15px' }} />
            <span>Live Tally Summary</span>
          </button>
          <button className={`btn ${activeTab === 'entry' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('entry')}>
            <Plus style={{ width: '15px', height: '15px' }} />
            <span>Input Station Tally & OCR</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Live Tally Summary Table */}
      {activeTab === 'summary' && (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>
              Polling Station Form 34A Stream ({tallyResults.length})
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: '700' }}>
              {tallyResults.filter(t => t.status === 'Mismatch').length} Math Discrepancies Flagged
            </span>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Polling Station Code & Name</th>
                  <th>Candidate A</th>
                  <th>Candidate B</th>
                  <th>Candidate C</th>
                  <th>Rejected</th>
                  <th>Total Cast / Reg</th>
                  <th>Evidence Form 34A</th>
                  <th>Verification Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tallyResults.map(tally => (
                  <tr key={tally.id}>
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{tally.pollingStationName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Code: {tally.pollingStationCode}</div>
                    </td>
                    <td style={{ fontWeight: '700', color: '#818cf8' }}>{tally.candAVotes}</td>
                    <td style={{ fontWeight: '600' }}>{tally.candBVotes}</td>
                    <td>{tally.candCVotes}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{tally.rejectedVotes}</td>
                    <td style={{ fontSize: '0.82rem' }}>
                      <strong style={{ color: tally.status === 'Mismatch' ? '#ef4444' : '#fff' }}>{tally.totalVotesCast}</strong> / {tally.registeredVoters}
                    </td>
                    <td>
                      {tally.evidence?.imageUrl && (
                        <a href={tally.evidence.imageUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#06b6d4' }}>
                          <FileImage style={{ width: '13px', height: '13px' }} />
                          Form 34A
                        </a>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${tally.status.toLowerCase()}`}>{tally.status}</span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setVerifyingTally(tally)}>
                        <ShieldCheck style={{ width: '13px', height: '13px' }} />
                        <span>Verify</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Input Station Tally & OCR Scanner */}
      {activeTab === 'entry' && (
        <div className="glass-card" style={{ padding: '1.5rem', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>Submit Form 34A & OCR Scanner</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Upload signed Form 34A evidence photo. OCR will automatically parse candidate numbers.
          </p>

          <form onSubmit={handleSubmitTally} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Station Picker */}
            <div className="form-group">
              <label className="form-label">Select Target Polling Station</label>
              <select className="form-select" value={selectedStationId} onChange={e => setSelectedStationId(e.target.value)}>
                {geography.pollingStations.slice(0, 100).map(ps => (
                  <option key={ps.id} value={ps.id}>
                    {ps.code} - {ps.name} (Reg Voters: {ps.registeredVoters || 750})
                  </option>
                ))}
              </select>
            </div>

            {/* Simulated OCR Scanner Upload */}
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1.25rem', borderRadius: '12px', border: '1px dashed rgba(99, 102, 241, 0.4)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#a5b4fc', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Scan style={{ width: '18px', height: '18px', color: '#fbbf24' }} />
                <span>Simulated OCR Camera Form 34A Scanner</span>
              </div>
              <input type="file" accept="image/*" onChange={handleSimulateOCR} className="form-input" style={{ width: 'auto', margin: '0 auto' }} />

              {isScanningOCR && (
                <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '0.5rem', fontWeight: '700' }}>
                  Running OCR Pattern Recognition on Form 34A...
                </div>
              )}

              {ocrData && (
                <div style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.5rem', fontWeight: '700' }}>
                  ✓ OCR Extraction Success (Confidence: {ocrData.confidence * 100}%) • Hash: {ocrData.detectedHash.slice(0, 14)}...
                </div>
              )}
            </div>

            {/* Candidate Votes Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Candidate A (Our Candidate)</label>
                <input type="number" className="form-input" value={candAVotes} onChange={e => setCandAVotes(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Candidate B (Opponent)</label>
                <input type="number" className="form-input" value={candBVotes} onChange={e => setCandBVotes(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Candidate C (Independent)</label>
                <input type="number" className="form-input" value={candCVotes} onChange={e => setCandCVotes(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Rejected / Spoiled Ballots</label>
                <input type="number" className="form-input" value={rejectedVotes} onChange={e => setRejectedVotes(e.target.value)} required />
              </div>
            </div>

            {/* Math Validation Box */}
            <div style={{ background: isExceedingReg ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.1)', padding: '0.85rem 1rem', borderRadius: '10px', border: `1px solid ${isExceedingReg ? '#ef4444' : '#10b981'}`, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong>Calculated Total Votes Cast:</strong> {calculatedTotal} / Registered ({registeredVoters})
              </div>
              {isExceedingReg && (
                <span style={{ color: '#f87171', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertTriangle style={{ width: '16px', height: '16px' }} />
                  MISMATCH: Total Cast &gt; Registered Voters!
                </span>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <Vote style={{ width: '18px', height: '18px' }} />
              <span>Transmit Tally Form 34A to Verification Queue</span>
            </button>
          </form>
        </div>
      )}

      {/* Supervisor Verification Modal */}
      {verifyingTally && (
        <div className="modal-overlay" onClick={() => setVerifyingTally(null)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Tally Verification: {verifyingTally.pollingStationName}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setVerifyingTally(null)}><X style={{ width: '16px', height: '16px' }} /></button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div>Candidate A: <strong style={{ color: '#818cf8' }}>{verifyingTally.candAVotes}</strong></div>
              <div>Candidate B: <strong>{verifyingTally.candBVotes}</strong></div>
              <div>Candidate C: <strong>{verifyingTally.candCVotes}</strong></div>
              <div>Rejected: <strong>{verifyingTally.rejectedVotes}</strong></div>
              <div>Total Votes Cast: <strong>{verifyingTally.totalVotesCast}</strong> (Reg Voters: {verifyingTally.registeredVoters})</div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Supervisor Sign-Off Comments & Rationale</label>
              <textarea rows={3} className="form-input" placeholder="e.g. Physical Form 34A evidence verified. Figures match presiding officer record." value={verifyComment} onChange={e => setVerifyComment(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => handleVerifySubmit('Approved')} style={{ flex: 1, background: '#10b981' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                <span>Approve Tally</span>
              </button>
              <button className="btn btn-secondary" onClick={() => handleVerifySubmit('Mismatch')} style={{ flex: 1, borderColor: '#ef4444', color: '#f87171' }}>
                <XCircle style={{ width: '16px', height: '16px' }} />
                <span>Flag Discrepancy Mismatch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
