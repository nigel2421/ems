import React, { useState } from 'react';
import { executeFullElectionSimulation, setSystemMode, injectChaosScenario, getSystemMode } from '../../utils/simulationEngine';

export default function ElectionSimulationControl({ userRole = 'SUPER_ADMIN' }) {
  const [activeMode, setActiveModeState] = useState(getSystemMode());
  const [simulationReport, setSimulationReport] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleModeSwitch = (mode) => {
    try {
      setSystemMode(mode, { name: 'Admin Operator' });
      setActiveModeState(mode);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRunSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      const rpt = executeFullElectionSimulation({ stationCount: 46229, simulatedAgentCount: 46000 });
      setSimulationReport(rpt);
      setIsRunning(false);
    }, 800);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#f8fafc' }}>Election Simulation & Chaos Control</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Full election-day operational rehearsal, network outage injection, and After Action Report (AAR) generation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['LIVE', 'SIMULATION', 'TRAINING'].map((m) => (
            <button
              key={m}
              onClick={() => handleModeSwitch(m)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeMode === m ? (m === 'LIVE' ? '#059669' : '#2563eb') : '#1e293b',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              ENV: {m}
            </button>
          ))}
        </div>
      </div>

      {/* Trigger Button */}
      <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#f8fafc' }}>Execute CI-EMS 3.0 Full Election Simulation</h3>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
          Simulates 46,229 stations across 47 counties: T-12h setup $\rightarrow$ morning check-ins $\rightarrow$ network outage injection $\rightarrow$ evidence submission surge $\rightarrow$ reconciliation lock $\rightarrow$ closeout.
        </p>
        <button
          onClick={handleRunSimulation}
          disabled={isRunning}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            opacity: isRunning ? 0.7 : 1
          }}
        >
          {isRunning ? 'Running 46,229 Station Election Simulation...' : '🚀 Launch Full Election Simulation'}
        </button>
      </div>

      {/* After Action Report View */}
      {simulationReport && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>After Action Report (AAR) — {simulationReport.simulationId}</h3>
            <span style={{ padding: '6px 16px', borderRadius: '20px', backgroundColor: '#065f46', color: '#6ee7b7', fontWeight: 'bold', fontSize: '14px' }}>
              VERDICT: {simulationReport.afterActionReport.overallClassification}
            </span>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', color: '#38bdf8', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
            {simulationReport.afterActionReport.summary}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Agent SLA Performance</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>{simulationReport.performanceMetrics.agentSlaPerformance}</div>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Evidence Latency</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>{simulationReport.performanceMetrics.evidenceUploadLatencyMs} ms</div>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Reconciliation Throughput</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>{simulationReport.performanceMetrics.reconciliationThroughput}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
