import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Activity, X, Search, Shield, Filter, Database } from 'lucide-react';

export const AuditLogViewer = ({ onClose }) => {
  const { auditLogs } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.ipAddress.includes(searchTerm);
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '950px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Activity style={{ width: '22px', height: '22px', color: '#06b6d4' }} />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Immutable System Audit Trail Ledger</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Real-time cryptographic activity logging capturing IP, timestamp, role, and action</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              className="form-input"
              placeholder="Search audit trail by user, IP address, or keyword..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          <select className="form-select" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
            <option value="ALL">All Log Actions</option>
            <option value="EVIDENCE_SUBMISSION">Evidence Submissions</option>
            <option value="SUBMISSION_APPROVED">Approvals</option>
            <option value="MISMATCH_DETECTED">Mismatch Detections</option>
            <option value="USER_LOGIN_2FA">2FA Logins</option>
          </select>
        </div>

        {/* Audit Logs Table */}
        <div className="custom-table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp (UTC)</th>
                <th>User / Identity</th>
                <th>Role</th>
                <th>IP Address</th>
                <th>Action Type</th>
                <th>Audit Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: '600' }}>{log.userName}</td>
                  <td>
                    <span className={`role-badge role-${log.role.toLowerCase()}`}>
                      {log.role}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#67e8f9' }}>{log.ipAddress}</td>
                  <td>
                    <span 
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        background: log.action.includes('MISMATCH') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                        color: log.action.includes('MISMATCH') ? '#fca5a5' : '#a5b4fc'
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
