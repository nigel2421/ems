import React, { useState } from 'react';
import { createOperationalCase, CASE_PRIORITIES, CASE_STATUSES } from '../../utils/operationalCase';

export default function UnifiedOperationsQueue({ user }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState(null);

  const initialCases = [
    {
      case_id: 'CASE-INC-101',
      title: 'Missing Presiding Agent at Station Stream 02',
      case_type: 'INCIDENT',
      priority: 'P1_CRITICAL',
      status: 'IN_PROGRESS',
      assigned_to: user?.name || 'Ward Coordinator',
      assigned_team: 'WARD_COMMAND',
      sla_due_at: new Date(Date.now() + 6 * 60 * 1000 + 42 * 1000).toISOString(),
      correlation_id: 'COR-01K59F7Z-823901'
    },
    {
      case_id: 'CASE-DEV-773',
      title: 'Field agent device unable to sync offline queue',
      case_type: 'DEVICE_RECOVERY',
      priority: 'P1_CRITICAL',
      status: 'TRIAGED',
      assigned_to: 'Tech Response Team',
      assigned_team: 'SOC_COMMAND',
      sla_due_at: new Date(Date.now() + 9 * 60 * 1000 + 11 * 1000).toISOString(),
      correlation_id: 'COR-01K59F7Z-994812'
    },
    {
      case_id: 'CASE-REC-928',
      title: 'Statutory Form 34A vs Agent Entry count variance (+12 votes)',
      case_type: 'RECONCILIATION',
      priority: 'P2_HIGH',
      status: 'NEW',
      assigned_to: null,
      assigned_team: 'RECONCILIATION_DESK',
      sla_due_at: new Date(Date.now() + 21 * 60 * 1000 + 14 * 1000).toISOString(),
      correlation_id: 'COR-01K59F7Z-110293'
    },
    {
      case_id: 'CASE-LOG-837',
      title: 'Replacement power bank & seal kit required',
      case_type: 'LOGISTICS_GAP',
      priority: 'P3_MEDIUM',
      status: 'ASSIGNED',
      assigned_to: 'Logistics Officer',
      assigned_team: 'FIELD_LOGISTICS',
      sla_due_at: new Date(Date.now() + 108 * 60 * 1000).toISOString(),
      correlation_id: 'COR-01K59F7Z-449102'
    }
  ];

  const [cases, setCases] = useState(initialCases);

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'P1_CRITICAL':
        return { bg: '#991b1b', text: '#fca5a5', label: '🔴 P1 CRITICAL' };
      case 'P2_HIGH':
        return { bg: '#9a3412', text: '#fdba74', label: '🟠 P2 HIGH' };
      case 'P3_MEDIUM':
        return { bg: '#854d0e', text: '#fef08a', label: '🟡 P3 MEDIUM' };
      default:
        return { bg: '#1e3a8a', text: '#93c5fd', label: '🔵 P4 LOW' };
    }
  };

  const filteredCases = cases.filter((c) => {
    if (activeFilter === 'MY_CASES') return c.assigned_to === user?.name;
    if (activeFilter === 'CRITICAL') return c.priority === 'P1_CRITICAL';
    if (activeFilter === 'UNASSIGNED') return !c.assigned_to;
    return true;
  });

  return (
    <div style={{ padding: '24px', backgroundColor: '#0b0f19', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#f8fafc' }}>Unified Operations Queue</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Central consolidated inbox for Incidents, Reconciliation, Devices, Replacements, and Logistics.
          </p>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', color: '#38bdf8' }}>
          Active Cases: {cases.length} | SLA Breached: 0
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['ALL', 'MY_CASES', 'CRITICAL', 'UNASSIGNED'].map((filterKey) => (
          <button
            key={filterKey}
            onClick={() => setActiveFilter(filterKey)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeFilter === filterKey ? '#2563eb' : '#1e293b',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {filterKey.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Operations Cases List */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {filteredCases.map((item) => {
          const badge = getPriorityBadge(item.priority);
          const remainingMinutes = Math.max(0, Math.round((new Date(item.sla_due_at).getTime() - Date.now()) / (60 * 1000)));

          return (
            <div
              key={item.case_id}
              onClick={() => setSelectedCase(item)}
              style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '16px 20px',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ padding: '6px 10px', borderRadius: '4px', backgroundColor: badge.bg, color: badge.text, fontSize: '11px', fontWeight: 'bold' }}>
                  {badge.label}
                </span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    Case ID: <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{item.case_id}</span> | Team: {item.assigned_team} | Correlation: <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{item.correlation_id}</span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: remainingMinutes < 15 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                  ⏱ SLA: {remainingMinutes} mins remaining
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Status: <span style={{ color: '#cbd5e1' }}>{item.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
