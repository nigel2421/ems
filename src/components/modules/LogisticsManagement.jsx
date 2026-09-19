import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Package,
  Truck,
  BatteryCharging,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Filter
} from 'lucide-react';
import './LogisticsManagement.css';

export const LogisticsManagement = () => {
  const { userScope } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');

  const centers = [
    { id: 'CTR-2841', name: 'Highridge Primary Polling Centre', ward: 'Parklands/Highridge', agents: '8/8', transport: 'Ready', kits: '7/8', powerBanks: '8/8', status: 'WARNING', priority: 'HIGH' },
    { id: 'CTR-2842', name: 'Westlands Primary Polling Centre', ward: 'Parklands/Highridge', agents: '12/12', transport: 'Ready', kits: '12/12', powerBanks: '12/12', status: 'OK', priority: 'NORMAL' },
    { id: 'CTR-2843', name: 'Kangemi Youth Centre', ward: 'Kangemi', agents: '6/6', transport: 'Pending Fuel', kits: '6/6', powerBanks: '5/6', status: 'WARNING', priority: 'HIGH' },
    { id: 'CTR-2844', name: 'Kitisuru Secondary School', ward: 'Kitisuru', agents: '10/10', transport: 'Ready', kits: '10/10', powerBanks: '10/10', status: 'OK', priority: 'NORMAL' }
  ];

  return (
    <div className="logistics-shell">
      <header className="log-header">
        <div>
          <h1>Resource & Logistics Management</h1>
          <p>Scope: <strong>{userScope?.name || 'National Scope'}</strong> · Agent kits, power banks, transport dispatch, and center equipment readiness.</p>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="log-cards-grid">
        <article className="log-card">
          <div className="log-card-top">
            <span>Agent Kits Issued</span>
            <Package size={20} className="log-icon" />
          </div>
          <strong>4,611 / 4,820</strong>
          <small>Badges, credentials & stationery</small>
        </article>

        <article className="log-card">
          <div className="log-card-top">
            <span>Power Banks & Devices</span>
            <BatteryCharging size={20} className="log-icon-ok" />
          </div>
          <strong>4,580 Issued</strong>
          <small>Fully charged & assigned</small>
        </article>

        <article className="log-card">
          <div className="log-card-top">
            <span>Transport Dispatch</span>
            <Truck size={20} className="log-icon" />
          </div>
          <strong>184 Vehicles</strong>
          <small>Voter GOTV & agent transit</small>
        </article>
      </section>

      {/* Polling Center Logistics Readiness Table */}
      <article className="log-panel">
        <div className="log-panel-head">
          <h3>Polling Centre Resource Readiness</h3>
          <div className="log-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search polling centre or ward"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="log-table-wrap">
          <table className="log-table">
            <thead>
              <tr>
                <th>Polling Centre</th>
                <th>Ward</th>
                <th>Agents</th>
                <th>Kits</th>
                <th>Power Banks</th>
                <th>Transport</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {centers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                    <span className="log-subtext">{c.id}</span>
                  </td>
                  <td>{c.ward}</td>
                  <td><span className="log-tag-ok">{c.agents} ✅</span></td>
                  <td>
                    <span className={c.kits.includes('7/8') ? 'log-tag-warn' : 'log-tag-ok'}>
                      {c.kits} {c.kits.includes('7/8') ? '⚠️' : '✅'}
                    </span>
                  </td>
                  <td><span className="log-tag-ok">{c.powerBanks} ✅</span></td>
                  <td>
                    <span className={c.transport.includes('Pending') ? 'log-tag-warn' : 'log-tag-ok'}>
                      {c.transport}
                    </span>
                  </td>
                  <td>
                    <span className={`log-pri-badge is-${c.priority.toLowerCase()}`}>{c.priority}</span>
                  </td>
                  <td>
                    <button type="button" className="log-dispatch-btn">Dispatch Kit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
};
