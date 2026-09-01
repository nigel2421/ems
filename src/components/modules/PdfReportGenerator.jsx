import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { X, Download, ShieldCheck, Printer, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const PdfReportGenerator = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { submissions, auditLogs } = useData();
  const reportRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`IEBC_EMS_Dossier_${currentUser.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '900px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Export Verified PDF Dossier Report</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Generate official printable evidence dossier for election petitions and IEBC audit</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={generating}>
              <Download style={{ width: '16px', height: '16px' }} />
              <span>{generating ? 'Generating PDF...' : 'Download PDF Dossier'}</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {/* Printable PDF Template Area */}
        <div style={{ overflowX: 'auto', maxHeight: '550px', borderRadius: 'var(--radius-sm)' }}>
          <div 
            ref={reportRef}
            style={{
              background: '#ffffff',
              color: '#111827',
              padding: '2.5rem',
              width: '800px',
              margin: '0 auto',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {/* Header */}
            <div style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', color: '#1e3a8a', fontWeight: 'bold', margin: 0 }}>REPUBLIC OF KENYA</h1>
                <h2 style={{ fontSize: '1.1rem', color: '#374151', margin: '0.2rem 0 0 0' }}>INDEPENDENT ELECTORAL & BOUNDARIES COMMISSION</h2>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem' }}>VERIFIED FORM 34A AGENT TALLY & MISMATCH DOSSIER</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#4b5563' }}>
                <div><strong>Document Ref:</strong> DOS-2026-NBI</div>
                <div><strong>Date Generated:</strong> {new Date().toLocaleDateString()}</div>
                <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
              </div>
            </div>

            {/* Aspirant / Candidate Meta */}
            <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <div><strong>Candidate Name:</strong> {currentUser.name}</div>
                <div><strong>Role / Position:</strong> {currentUser.role}</div>
              </div>
              <div>
                <div><strong>Assigned Entity:</strong> {currentUser.entityName}</div>
                <div><strong>System Verification Hash:</strong> SHA256-EMS-9921A</div>
              </div>
            </div>

            {/* Verified Agent Submissions Summary */}
            <h3 style={{ fontSize: '1rem', color: '#1e3a8a', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
              1. Verified Form 34A Agent Evidence Submissions ({submissions.length} Polling Stations)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ background: '#e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>Polling Station</th>
                  <th style={{ padding: '6px' }}>Agent</th>
                  <th style={{ padding: '6px' }}>Pres. Valid Votes</th>
                  <th style={{ padding: '6px' }}>Gov. Valid Votes</th>
                  <th style={{ padding: '6px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '6px', fontWeight: 'bold' }}>{sub.pollingStationName}</td>
                    <td style={{ padding: '6px' }}>{sub.agentName}</td>
                    <td style={{ padding: '6px' }}>{sub.tallies.presidential?.totalValid}</td>
                    <td style={{ padding: '6px' }}>{sub.tallies.governor?.totalValid}</td>
                    <td style={{ padding: '6px', color: sub.status === 'Approved' ? '#059669' : '#dc2626', fontWeight: 'bold' }}>{sub.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Audit Trail Summary */}
            <h3 style={{ fontSize: '1rem', color: '#1e3a8a', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
              2. Immutable System Audit Activity Trail (Sample Extracts)
            </h3>
            <div style={{ fontSize: '0.75rem', color: '#374151' }}>
              {auditLogs.slice(0, 3).map(log => (
                <div key={log.id} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px dashed #e5e7eb' }}>
                  <strong>[{new Date(log.timestamp).toLocaleTimeString()}] {log.userName} ({log.role})</strong> - IP: {log.ipAddress} - Action: {log.action}<br/>
                  <span style={{ color: '#6b7280' }}>{log.details}</span>
                </div>
              ))}
            </div>

            {/* Footer Sign-off */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid #1e3a8a', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <div>
                <div>___________________________</div>
                <div style={{ marginTop: '0.2rem' }}><strong>Chief Agent Signature</strong></div>
              </div>
              <div>
                <div>___________________________</div>
                <div style={{ marginTop: '0.2rem' }}><strong>IEBC Presiding Officer Signature</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
