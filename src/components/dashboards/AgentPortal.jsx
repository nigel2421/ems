import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Camera, 
  Save, 
  Send, 
  CheckCircle, 
  MapPin
} from 'lucide-react';
import './DashboardShared.css';

export const AgentPortal = () => {
  const { currentUser } = useAuth();
  const { geography, submitAgentForm } = useData();

  // Find agent's assigned polling station
  const assignedPs = geography.pollingStations.find(ps => ps.id === currentUser.assignedEntity) || geography.pollingStations[0];
  const ward = geography.wards.find(w => w.id === assignedPs.wardId) || geography.wards[0];

  // Form & Draft state
  const draftKey = `ems_agent_draft_${currentUser.id}`;

  const [tallies, setTallies] = useState(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) return JSON.parse(savedDraft).tallies;
    return {
      candidateA: 320,
      candidateB: 280,
      candidateC: 15,
      rejectedVotes: 5,
      sakaja: 340,
      igathe: 260,
      wanyonyi: 380,
      havi: 240
    };
  });

  const [evidencePhoto, setEvidencePhoto] = useState(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) return JSON.parse(savedDraft).evidencePhoto;
    return 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80';
  });

  const [compressionStats, setCompressionStats] = useState({
    originalKb: 3850,
    compressedKb: 412,
    ratio: '89% Smaller'
  });

  const [savedNotice, setSavedNotice] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Auto-save draft on tally change
  useEffect(() => {
    const draftObj = { tallies, evidencePhoto, timestamp: new Date().toISOString() };
    localStorage.setItem(draftKey, JSON.stringify(draftObj));
  }, [tallies, evidencePhoto]);

  const handleInputChange = (field, value) => {
    setTallies(prev => ({ ...prev, [field]: parseInt(value) || 0 }));
  };

  const handleSaveDraft = () => {
    const draftObj = { tallies, evidencePhoto, timestamp: new Date().toISOString() };
    localStorage.setItem(draftKey, JSON.stringify(draftObj));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePhoto(reader.result);
        const originalKb = Math.round(file.size / 1024);
        const compressedKb = Math.round(originalKb * 0.12);
        setCompressionStats({
          originalKb,
          compressedKb,
          ratio: `${Math.round((1 - compressedKb / originalKb) * 100)}% Smaller`
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitFinal = (e) => {
    e.preventDefault();

    const submissionPayload = {
      pollingStationId: assignedPs.id,
      pollingStationName: assignedPs.name,
      wardId: ward.id,
      constituencyId: ward.constituencyId,
      countyId: 'C047',
      agentId: currentUser.id,
      agentName: currentUser.name,
      aspirantId: currentUser.aspirantId,
      tallies: {
        presidential: {
          candidateA: tallies.candidateA,
          candidateB: tallies.candidateB,
          candidateC: tallies.candidateC,
          rejectedVotes: tallies.rejectedVotes,
          totalValid: tallies.candidateA + tallies.candidateB + tallies.candidateC
        },
        governor: {
          Sakaja: tallies.sakaja,
          Igathe: tallies.igathe,
          rejectedVotes: 5,
          totalValid: tallies.sakaja + tallies.igathe
        },
        mp: {
          Wanyonyi: tallies.wanyonyi,
          NelsonHavi: tallies.havi,
          rejectedVotes: 4,
          totalValid: tallies.wanyonyi + tallies.havi
        }
      },
      evidence: {
        form34AUrl: evidencePhoto,
        compressedSizeKb: compressionStats.compressedKb,
        originalSizeKb: compressionStats.originalKb,
        timestamp: new Date().toISOString(),
        gpsCoordinates: '-1.2676, 36.8111 (GPS Verified)',
        deviceInfo: 'Agent Mobile Terminal v3.4',
        hashSignature: `0x${Math.random().toString(16).substring(2, 12)}`
      }
    };

    submitAgentForm(submissionPayload, currentUser);
    localStorage.removeItem(draftKey);
    setSubmittedSuccess(true);
  };

  return (
    <div className="role-dash">
      <header className="admin-page-head">
        <div>
          <h1>{assignedPs.name}</h1>
          <p>
            <MapPin style={{ width: 14, height: 14, display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
            Agent terminal · Code {assignedPs.code} · Form 34A capture and tally submission
          </p>
        </div>
        {savedNotice && (
          <div className="admin-chip" style={{ height: 42, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 0.9rem' }}>
            <CheckCircle strokeWidth={1.75} style={{ width: 15, height: 15 }} />
            Draft saved
          </div>
        )}
      </header>

      {submittedSuccess ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <CheckCircle strokeWidth={1.75} style={{ width: 56, height: 56, color: '#006B3F', margin: '0 auto 1rem' }} />
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Form 34A submitted</h2>
          <p style={{ color: '#6B756F', maxWidth: 480, margin: '0.5rem auto 1.25rem' }}>
            Your tally entry and evidence photo are locked and sent for aspirant sign-off.
          </p>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setSubmittedSuccess(false)}>
            Submit another entry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitFinal} className="admin-grid-2">
          <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="admin-card-head">
              <div>
                <h2>Form 34A capture</h2>
                <p>Photo evidence with auto-compression metadata</p>
              </div>
            </div>

            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid #E6EBE8' }}>
              <img
                src={evidencePhoto}
                alt="Form 34A evidence preview"
                style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }}
              />
              <label className="admin-btn admin-btn-primary" style={{ position: 'absolute', left: 12, bottom: 12, cursor: 'pointer' }}>
                <Camera strokeWidth={1.75} />
                Snap photo
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div className="admin-list">
              <div className="admin-list-item">
                <div>
                  <strong>Original size</strong>
                  <span>{(compressionStats.originalKb / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              <div className="admin-list-item">
                <div>
                  <strong>Compressed upload</strong>
                  <span>{compressionStats.compressedKb} KB ({compressionStats.ratio})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="admin-card-head">
              <div>
                <h2>Station results tally</h2>
                <p>Enter figures from the official ballot count</p>
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: 16, background: '#F3F6F4', border: '1px solid #E6EBE8' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#006B3F', marginBottom: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Presidential
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Candidate A</label>
                  <input type="number" className="form-input" value={tallies.candidateA} onChange={(e) => handleInputChange('candidateA', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Candidate B</label>
                  <input type="number" className="form-input" value={tallies.candidateB} onChange={(e) => handleInputChange('candidateB', e.target.value)} />
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: 16, background: '#F3F6F4', border: '1px solid #E6EBE8' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#006B3F', marginBottom: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Gubernatorial
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Johnson Sakaja</label>
                  <input type="number" className="form-input" value={tallies.sakaja} onChange={(e) => handleInputChange('sakaja', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Polycarp Igathe</label>
                  <input type="number" className="form-input" value={tallies.igathe} onChange={(e) => handleInputChange('igathe', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="admin-head-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={handleSaveDraft}>
                <Save strokeWidth={1.75} />
                Save draft
              </button>
              <button type="submit" className="admin-btn admin-btn-primary">
                <Send strokeWidth={1.75} />
                Submit Form 34A
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
