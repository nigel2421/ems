import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { compressImageSimulation } from '../../services/api';
import {
  FileText,
  Plus,
  Camera,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Filter,
  Search,
  X,
  Image as ImageIcon,
  Clock,
  ShieldAlert,
  Minimize2
} from 'lucide-react';

export const FieldReporting = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { fieldReports, addFieldReport } = useData();

  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'create'
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Report Submission Form State
  const [category, setCategory] = useState('Mobilization Reports');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [severityLevel, setSeverityLevel] = useState('Low');
  const [locationName, setLocationName] = useState('Westlands Primary School, Stream 01');
  const [lat, setLat] = useState(-1.2676);
  const [lng, setLng] = useState(36.8111);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [compressedPreviews, setCompressedPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal State
  const [viewingReport, setViewingReport] = useState(null);

  const handleFileSelection = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);

    const previews = files.map(file => {
      const sim = compressImageSimulation(file);
      return {
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        ...sim
      };
    });
    setCompressedPreviews(previews);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !notes.trim()) return;
    setIsSubmitting(true);

    await addFieldReport({
      category,
      title,
      notes,
      severityLevel,
      locationName,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    }, selectedFiles, currentUser);

    setIsSubmitting(false);
    setTitle('');
    setNotes('');
    setSelectedFiles([]);
    setCompressedPreviews([]);
    setActiveTab('feed');
  };

  const filteredReports = fieldReports.filter(rep => {
    const matchesCategory = !categoryFilter || rep.category === categoryFilter;
    const matchesSeverity = !severityFilter || rep.severityLevel === severityFilter;
    return matchesCategory && matchesSeverity;
  });

  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
      case 'Critical': return 'status-pill rejected';
      case 'High': return 'status-pill mismatch';
      case 'Medium': return 'status-pill pending';
      case 'Low': return 'status-pill approved';
      default: return 'status-pill';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText style={{ width: '28px', height: '28px', color: '#6366f1' }} />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Field Intelligence & Incident Reporting</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Capture field reports with GPS location, photo auto-compression, and severity tagging.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button className={`btn ${activeTab === 'feed' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('feed')}>
            <FileText style={{ width: '15px', height: '15px' }} />
            <span>Reports Feed ({filteredReports.length})</span>
          </button>
          <button className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('create')}>
            <Plus style={{ width: '15px', height: '15px' }} />
            <span>Submit New Field Report</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {activeTab === 'feed' && (
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-select" style={{ width: '220px', padding: '0.45rem' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Mobilization Reports">Mobilization Reports</option>
            <option value="Campaign Reports">Campaign Reports</option>
            <option value="Incident Reports">Incident Reports</option>
            <option value="Opponent Activity Reports">Opponent Activity Reports</option>
            <option value="Community Sentiment Reports">Community Sentiment Reports</option>
          </select>

          <select className="form-select" style={{ width: '160px', padding: '0.45rem' }} value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
            <option value="">All Severity Levels</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      )}

      {/* TAB 1: Reports Feed */}
      {activeTab === 'feed' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredReports.map(rep => (
            <div 
              key={rep.id}
              className="glass-card clickable-card"
              onClick={() => setViewingReport(rep)}
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="status-pill pending" style={{ fontSize: '0.72rem' }}>{rep.category}</span>
                  <span className={getSeverityBadgeClass(rep.severityLevel)}>{rep.severityLevel}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{rep.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {rep.notes}
                </p>
              </div>

              {rep.media && rep.media.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {rep.media.map(med => (
                    <img key={med.id} src={med.thumbnailUrl || med.mediaUrl} alt={med.fileName} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin style={{ width: '13px', height: '13px', color: '#06b6d4' }} />
                  {rep.locationName}
                </span>
                <span>{new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Create Field Report */}
      {activeTab === 'create' && (
        <div className="glass-card" style={{ padding: '1.5rem', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>Submit New Field Report</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Attach evidence photos. Images will be automatically compressed by ~85% for low-bandwidth cellular transmission.
          </p>

          <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Report Category</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Mobilization Reports">1. Mobilization Report</option>
                  <option value="Campaign Reports">2. Campaign Report</option>
                  <option value="Incident Reports">3. Incident Report</option>
                  <option value="Opponent Activity Reports">4. Opponent Activity Report</option>
                  <option value="Community Sentiment Reports">5. Community Sentiment Report</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Severity Level</label>
                <select className="form-select" value={severityLevel} onChange={e => setSeverityLevel(e.target.value)}>
                  <option value="Low">Low Severity</option>
                  <option value="Medium">Medium Severity</option>
                  <option value="High">High Severity</option>
                  <option value="Critical">Critical Severity</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Report Title</label>
              <input type="text" className="form-input" placeholder="e.g. Opponent rally distribution in Westlands" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Notes & Observations</label>
              <textarea rows={4} className="form-input" placeholder="Describe the event, key actors involved, and immediate field impact..." value={notes} onChange={e => setNotes(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Location / Landmark Name</label>
              <input type="text" className="form-input" value={locationName} onChange={e => setLocationName(e.target.value)} required />
            </div>

            {/* Photo Attachment & Auto Compression Box */}
            <div className="form-group">
              <label className="form-label">Attach Photos / Camera Evidence</label>
              <input type="file" accept="image/*" multiple onChange={handleFileSelection} className="form-input" />
            </div>

            {/* Compression Calculation Preview */}
            {compressedPreviews.length > 0 && (
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Minimize2 style={{ width: '14px', height: '14px' }} />
                  <span>Automatic Client-Side Image Compression Engine</span>
                </div>
                {compressedPreviews.map((prev, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={prev.previewUrl} alt="prev" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                      <span>{prev.name}</span>
                    </div>
                    <div style={{ color: '#34d399', fontWeight: '700' }}>
                      {prev.originalSizeKb} KB &rarr; {prev.compressedSizeKb} KB ({prev.compressionRatioPct}% reduced)
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ padding: '0.85rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
              <FileText style={{ width: '18px', height: '18px' }} />
              <span>{isSubmitting ? 'Compressing & Transmitting Report...' : 'Transmit Field Intelligence Report'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Report Detail Modal */}
      {viewingReport && (
        <div className="modal-overlay" onClick={() => setViewingReport(null)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className={`status-pill ${viewingReport.severityLevel.toLowerCase()}`}>{viewingReport.severityLevel} Severity</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setViewingReport(null)}><X style={{ width: '16px', height: '16px' }} /></button>
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.35rem' }}>{viewingReport.title}</h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
              <span>Category: <strong>{viewingReport.category}</strong></span>
              <span>Reporter: <strong>{viewingReport.agentName}</strong></span>
            </div>

            <p style={{ fontSize: '0.88rem', lineHeight: '1.6', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              {viewingReport.notes}
            </p>

            {viewingReport.media && viewingReport.media.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.5rem', color: '#a5b4fc' }}>Attached Compressed Photo Evidence:</div>
                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
                  {viewingReport.media.map(med => (
                    <img key={med.id} src={med.mediaUrl || med.thumbnailUrl} alt={med.fileName} style={{ width: '100%', maxHeight: '240px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <MapPin style={{ width: '14px', height: '14px', color: '#06b6d4' }} />
              <span>Location: {viewingReport.locationName} (GPS: {viewingReport.latitude}, {viewingReport.longitude})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
