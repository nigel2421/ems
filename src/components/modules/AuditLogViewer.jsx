import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { exportLoginLogsToCSV } from '../../utils/deviceParser';
import { 
  Activity, 
  X, 
  Search, 
  ShieldCheck, 
  KeyRound, 
  Download, 
  Smartphone, 
  Monitor, 
  AlertTriangle,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ShieldAlert
} from 'lucide-react';

export const AuditLogViewer = ({ onClose }) => {
  const { auditLogs } = useData();
  const { loginActivityLogs, currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('system_logs'); // 'system_logs' | 'login_tracker'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDevice, setFilterDevice] = useState('ALL');

  const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';

  // Filter System Audit Logs
  const filteredAuditLogs = (auditLogs || []).filter(log => {
    const matchesSearch = (log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.ipAddress || '').includes(searchTerm);
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  // Filter Login Activity Logs
  const filteredLoginLogs = (loginActivityLogs || []).filter(log => {
    const matchesSearch = (log.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.ipAddress || '').includes(searchTerm) ||
                          (log.geoLocation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.browser || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
    const matchesDevice = filterDevice === 'ALL' || log.deviceType === filterDevice;

    return matchesSearch && matchesStatus && matchesDevice;
  });

  // Analytics KPI calculations
  const totalLogins = loginActivityLogs?.length || 0;
  const successfulLogins = loginActivityLogs?.filter(l => l.status === 'Success').length || 0;
  const failedLogins = loginActivityLogs?.filter(l => l.status === 'Failure').length || 0;
  const successRate = totalLogins > 0 ? Math.round((successfulLogins / totalLogins) * 100) : 100;
  const mobileCount = loginActivityLogs?.filter(l => l.deviceType === 'Mobile' || l.deviceType === 'Tablet').length || 0;
  const desktopCount = loginActivityLogs?.filter(l => l.deviceType === 'Desktop').length || 0;

  const handleCSVExport = () => {
    exportLoginLogsToCSV(filteredLoginLogs.length > 0 ? filteredLoginLogs : loginActivityLogs);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '1050px', background: 'var(--bg-surface-card)', border: '1px solid var(--border-color)', borderRadius: '20px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck style={{ width: '24px', height: '24px', color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                System Security & Activity Audit Suite
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Cryptographic operations ledger and device-level login telemetry tracker
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.35rem 0.6rem' }}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
          <button
            onClick={() => { setActiveTab('system_logs'); setSearchTerm(''); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'system_logs' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'system_logs' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'system_logs' ? '700' : '500',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <Activity style={{ width: '16px', height: '16px' }} />
            <span>System Operations Ledger</span>
            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
              {auditLogs?.length || 0}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('login_tracker'); setSearchTerm(''); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'login_tracker' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'login_tracker' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'login_tracker' ? '700' : '500',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <KeyRound style={{ width: '16px', height: '16px' }} />
            <span>Admin Login & Device Tracker</span>
            {failedLogins > 0 && (
              <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: '999px', background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', fontWeight: '800' }}>
                {failedLogins} Alert{failedLogins > 1 ? 's' : ''}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: SYSTEM OPERATIONS LEDGER */}
        {activeTab === 'system_logs' && (
          <>
            {/* Search & Action Filter Bar */}
            <div className="responsive-filter-bar" style={{ marginBottom: '1.25rem' }}>
              <div className="search-input-wrap" style={{ position: 'relative', flex: 1 }}>
                <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Search ledger by user, IP address, or details..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.4rem', width: '100%' }}
                />
              </div>

              <select 
                className="form-select" 
                style={{ width: 'auto', flex: '1 1 180px' }} 
                value={filterAction} 
                onChange={e => setFilterAction(e.target.value)}
              >
                <option value="ALL">All Log Actions</option>
                <option value="FIELD_REPORT_SUBMITTED">Field Reports</option>
                <option value="TALLY_SUBMITTED">Tally Submissions</option>
                <option value="TALLY_MISMATCH_DETECTED">Mismatch Detections</option>
                <option value="INTELLIGENCE_UPDATE">Intelligence Updates</option>
                <option value="SYSTEM_HARDENED">System Events</option>
              </select>
            </div>

            {/* Audit Logs Table */}
            <div className="custom-table-container touch-table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User Identity</th>
                    <th>Role</th>
                    <th>IP Address</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{log.userName}</td>
                      <td>
                        <span className={`role-badge role-${log.role.toLowerCase()}`}>
                          {log.role}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#06B6D4' }}>{log.ipAddress}</td>
                      <td>
                        <span 
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            background: log.action.includes('MISMATCH') ? 'rgba(239, 68, 68, 0.18)' : 'rgba(59, 130, 246, 0.18)',
                            color: log.action.includes('MISMATCH') ? '#EF4444' : '#60A5FA'
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
          </>
        )}

        {/* TAB 2: ADMIN LOGIN ACTIVITY & DEVICE TRACKER */}
        {activeTab === 'login_tracker' && (
          <>
            {!isAdmin ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '14px', margin: '1rem 0' }}>
                <ShieldAlert style={{ width: '40px', height: '40px', color: '#EF4444', margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>Restricted Security Access</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '450px', margin: '0.4rem auto 0 auto' }}>
                  Detailed device-level login telemetry and IP auditing are restricted exclusively to Admin and Super Admin accounts.
                </p>
              </div>
            ) : (
              <>
                {/* Analytics KPI Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Login Attempts</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.2rem' }}>{totalLogins}</div>
                  </div>

                  <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Authentication Success Rate</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: successRate >= 90 ? '#10B981' : '#F59E0B', marginTop: '0.2rem' }}>
                      {successRate}%
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Device Ratio (Desktop / Mobile)</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Monitor style={{ width: '16px', height: '16px', color: '#3B82F6' }} /> {desktopCount}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>/</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Smartphone style={{ width: '16px', height: '16px', color: '#06B6D4' }} /> {mobileCount}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: failedLogins > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-canvas)', border: failedLogins > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: failedLogins > 0 ? '#EF4444' : 'var(--text-muted)', textTransform: 'uppercase' }}>Failed Login Security Alerts</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: failedLogins > 0 ? '#EF4444' : '#10B981', marginTop: '0.2rem' }}>
                      {failedLogins}
                    </div>
                  </div>
                </div>

                {/* Filter & Export Bar */}
                <div className="responsive-filter-bar" style={{ marginBottom: '1.25rem', gap: '0.6rem' }}>
                  <div className="search-input-wrap" style={{ position: 'relative', flex: 2 }}>
                    <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="Search login logs by email, IP address, city, browser, or OS..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: '2.4rem', width: '100%' }}
                    />
                  </div>

                  <select 
                    className="form-select" 
                    style={{ width: 'auto', flex: '1 1 140px' }} 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Success">Success Only</option>
                    <option value="Failure">Failures Only</option>
                  </select>

                  <select 
                    className="form-select" 
                    style={{ width: 'auto', flex: '1 1 140px' }} 
                    value={filterDevice} 
                    onChange={e => setFilterDevice(e.target.value)}
                  >
                    <option value="ALL">All Devices</option>
                    <option value="Desktop">Desktop Only</option>
                    <option value="Mobile">Mobile Only</option>
                    <option value="Tablet">Tablet Only</option>
                  </select>

                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={handleCSVExport}
                    style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    <Download style={{ width: '14px', height: '14px' }} />
                    <span>Export CSV</span>
                  </button>
                </div>

                {/* Detailed Login Activity Table */}
                <div className="custom-table-container touch-table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Timestamp (Local)</th>
                        <th>User Account / Email</th>
                        <th>Status</th>
                        <th>IP Address & Location</th>
                        <th>Device Category & OS</th>
                        <th>Browser & Version</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLoginLogs.map(log => {
                        const isSuccess = log.status === 'Success';
                        return (
                          <tr key={log.id}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td>
                              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{log.userName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.email}</div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                <span 
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '999px',
                                    fontSize: '0.72rem',
                                    fontWeight: '800',
                                    width: 'fit-content',
                                    background: isSuccess ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                                    color: isSuccess ? '#10B981' : '#EF4444'
                                  }}
                                >
                                  {isSuccess ? <CheckCircle2 style={{ width: '12px', height: '12px' }} /> : <XCircle style={{ width: '12px', height: '12px' }} />}
                                  {log.status}
                                </span>
                                {log.failureReason && (
                                  <span style={{ fontSize: '0.7rem', color: '#EF4444' }}>
                                    {log.failureReason}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#06B6D4', fontWeight: '700' }}>
                                {log.ipAddress}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Globe style={{ width: '11px', height: '11px' }} />
                                {log.geoLocation || 'Kenya'}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {log.deviceType === 'Mobile' ? (
                                  <Smartphone style={{ width: '15px', height: '15px', color: '#06B6D4' }} />
                                ) : (
                                  <Monitor style={{ width: '15px', height: '15px', color: '#3B82F6' }} />
                                )}
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '0.82rem', color: 'var(--text-primary)' }}>{log.deviceType}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.os}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {log.browser}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
