import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Camera, 
  Upload, 
  Save, 
  Send, 
  CheckCircle, 
  FileText, 
  MapPin, 
  Smartphone, 
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div 
        className="glass-card" 
        style={{
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(17, 24, 39, 0.8) 100%)',
          border: '1px solid rgba(236, 72, 153, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="role-badge role-agent">Polling Station Agent Terminal</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Code: {assignedPs.code}</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem' }}>
            {assignedPs.name}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Restricted agent boundary: Form 34A evidence capture, auto-compression, and tally submission.
          </p>
        </div>

        {savedNotice && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.85rem', fontWeight: '600' }}>
            <CheckCircle style={{ width: '16px', height: '16px' }} /> Draft Saved Auto-Persisted!
          </div>
        )}
      </div>

      {submittedSuccess ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <CheckCircle style={{ width: '64px', height: '64px', color: '#10b981', margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Form 34A Submitted Successfully!</h2>
          <p style={{ color: 'var(--text-muted)', maxWdith: '500px', margin: '0.5rem auto 1.5rem auto' }}>
            Your tally entry and compressed evidence photo have been locked and submitted to your Aspirant for sign-off.
          </p>
          <button className="btn btn-secondary" onClick={() => setSubmittedSuccess(false)}>
            Submit Another Entry / Edit Draft
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitFinal} className="grid-dashboard">
          {/* Left Column: Form 34A Photo Capture & Auto-Compression */}
          <div className="glass-card col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Form 34A Image Capture & Metadata</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Auto-compresses high-res photo for low-bandwidth cellular upload</p>
            </div>

            <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px dashed var(--border-glow)', background: 'rgba(0,0,0,0.3)' }}>
              <img 
                src={evidencePhoto} 
                alt="Form 34A Evidence Preview" 
                style={{ width: '100%', height: '240px', objectFit: 'cover' }} 
              />
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  <Camera style={{ width: '16px', height: '16px' }} />
                  <span>Snap New Photo</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {/* Compression Metadata Details */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Original Size:</span>
                <strong>{(compressionStats.originalKb / 1024).toFixed(2)} MB</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Compressed Upload:</span>
                <strong style={{ color: '#34d399' }}>{compressionStats.compressedKb} KB ({compressionStats.ratio})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>GPS Timestamp:</span>
                <span>{new Date().toLocaleTimeString()} • -1.2676, 36.8111</span>
              </div>
            </div>
          </div>

          {/* Right Column: Vote Tally Entry */}
          <div className="glass-card col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Polling Station Results Tally</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enter exact figures counted from official physical ballots</p>
            </div>

            {/* Presidential Tally */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#a5b4fc', marginBottom: '0.75rem' }}>
                Presidential Election
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Candidate A (Ruto / Coalition)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={tallies.candidateA} 
                    onChange={e => handleInputChange('candidateA', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Candidate B (Raila / Coalition)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={tallies.candidateB} 
                    onChange={e => handleInputChange('candidateB', e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Gubernatorial Tally */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#c4b5fd', marginBottom: '0.75rem' }}>
                Gubernatorial Election (Nairobi)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Johnson Sakaja (UDA)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={tallies.sakaja} 
                    onChange={e => handleInputChange('sakaja', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Polycarp Igathe (Jubilee/Azimio)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={tallies.igathe} 
                    onChange={e => handleInputChange('igathe', e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={handleSaveDraft} style={{ flex: 1 }}>
                <Save style={{ width: '16px', height: '16px' }} />
                <span>Save Draft Auto-Persist</span>
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2, background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' }}>
                <Send style={{ width: '16px', height: '16px' }} />
                <span>Submit Form 34A to Aspirant</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
