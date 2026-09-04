import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Layers,
  Plus,
  Users,
  Star,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Search,
  Filter,
  X,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

export const TeamMobilization = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { stakeholders, addStakeholder, logStakeholderActivity } = useData();

  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add Stakeholder Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Village Elders');
  const [county, setCounty] = useState('Nairobi');
  const [ward, setWard] = useState('Westlands Ward');
  const [village, setVillage] = useState('Kangemi Central');
  const [influenceRating, setInfluenceRating] = useState(8);
  const [reachEstimate, setReachEstimate] = useState(1000);
  const [status, setStatus] = useState('Supportive');

  // Log Activity Modal State
  const [loggingStakeholder, setLoggingStakeholder] = useState(null);
  const [activityType, setActivityType] = useState('Community Meeting');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('2026-09-15');

  const filteredStakeholders = stakeholders.filter(stk => {
    const matchesCat = !categoryFilter || stk.category === categoryFilter;
    const matchesStat = !statusFilter || stk.status === statusFilter;
    return matchesCat && matchesStat;
  });

  const totalReach = filteredStakeholders.reduce((acc, curr) => acc + (curr.reachEstimate || 0), 0);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addStakeholder({
      name,
      category,
      county,
      ward,
      village,
      influenceRating: parseInt(influenceRating),
      reachEstimate: parseInt(reachEstimate),
      assignedCoordinator: currentUser?.name || 'Regional Coordinator',
      status
    }, currentUser);

    setName('');
    setShowAddModal(false);
  };

  const handleLogActivitySubmit = (e) => {
    e.preventDefault();
    if (!loggingStakeholder) return;
    logStakeholderActivity(loggingStakeholder.id, {
      type: activityType,
      notes,
      followUpDate,
      loggedBy: currentUser?.name || 'Agent'
    }, currentUser);

    setNotes('');
    setLoggingStakeholder(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Layers style={{ width: '28px', height: '28px', color: '#10b981' }} />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Team Mobilization & Influence Network</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Track village elders, clergy, youth, bodaboda, and women leaders to estimate voter reach.
            </p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>Add Key Stakeholder</span>
        </button>
      </div>

      {/* Analytics Card */}
      <div className="glass-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#34d399', textTransform: 'uppercase' }}>Total Estimated Network Reach</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginTop: '0.2rem' }}>
            {totalReach.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Voters Influenced</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Leaders</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#22d3ee' }}>{filteredStakeholders.length} Leaders</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Support Rating</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fbbf24' }}>88% Positive</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-select" style={{ width: '220px', padding: '0.45rem' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories (7 Types)</option>
          <option value="Village Elders">Village Elders</option>
          <option value="Clergy">Clergy</option>
          <option value="Youth Mobilizers">Youth Mobilizers</option>
          <option value="Women Leaders">Women Leaders</option>
          <option value="Bodaboda Leaders">Bodaboda Leaders</option>
          <option value="Business Leaders">Business Leaders</option>
          <option value="Community Organizers">Community Organizers</option>
        </select>

        <select className="form-select" style={{ width: '160px', padding: '0.45rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Support Statuses</option>
          <option value="Supportive">Supportive</option>
          <option value="Engaged">Engaged</option>
          <option value="Neutral">Neutral</option>
          <option value="Opposed">Opposed</option>
        </select>
      </div>

      {/* Stakeholders Table */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Leader Name & Category</th>
                <th>Location / Ward</th>
                <th>Influence Rating</th>
                <th>Voter Reach</th>
                <th>Assigned Coordinator</th>
                <th>Status</th>
                <th>Recent Activities</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStakeholders.map(stk => (
                <tr key={stk.id}>
                  <td>
                    <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{stk.name}</div>
                    <span className="status-pill pending" style={{ fontSize: '0.72rem' }}>{stk.category}</span>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    <div>{stk.ward}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stk.village}</div>
                  </td>
                  <td>
                    <div style={{ color: '#fbbf24', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Star style={{ width: '13px', height: '13px', fill: '#fbbf24' }} />
                      <span>{stk.influenceRating} / 10</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: '700', color: '#34d399', fontSize: '0.88rem' }}>
                    {(stk.reachEstimate || 100).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{stk.assignedCoordinator}</td>
                  <td>
                    <span className={`status-pill ${stk.status === 'Opposed' ? 'rejected' : 'approved'}`}>
                      {stk.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem' }}>
                    {stk.activities && stk.activities.length > 0 ? (
                      <div>
                        <strong>{stk.activities[0].type}</strong>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Follow up: {stk.activities[0].followUpDate}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>No logs yet</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setLoggingStakeholder(stk)}>
                      <MessageSquare style={{ width: '13px', height: '13px' }} />
                      <span>Log Meeting</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stakeholder Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Add Key Influence Leader</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}><X style={{ width: '16px', height: '16px' }} /></button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Stakeholder Full Name</label>
                <input type="text" className="form-input" placeholder="e.g. Pastor Joseph Mwangi" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="Village Elders">Village Elders</option>
                    <option value="Clergy">Clergy</option>
                    <option value="Youth Mobilizers">Youth Mobilizers</option>
                    <option value="Women Leaders">Women Leaders</option>
                    <option value="Bodaboda Leaders">Bodaboda Leaders</option>
                    <option value="Business Leaders">Business Leaders</option>
                    <option value="Community Organizers">Community Organizers</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Support Status</label>
                  <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="Supportive">Supportive</option>
                    <option value="Engaged">Engaged</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Opposed">Opposed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Influence Rating (1 - 10)</label>
                  <input type="number" min="1" max="10" className="form-input" value={influenceRating} onChange={e => setInfluenceRating(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Voter Reach Estimate</label>
                  <input type="number" className="form-input" value={reachEstimate} onChange={e => setReachEstimate(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ward / Village Location</label>
                <input type="text" className="form-input" value={ward} onChange={e => setWard(e.target.value)} required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem' }}>
                Save Stakeholder to Network
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Log Activity Modal */}
      {loggingStakeholder && (
        <div className="modal-overlay" onClick={() => setLoggingStakeholder(null)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Log Engagement: {loggingStakeholder.name}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setLoggingStakeholder(null)}><X style={{ width: '16px', height: '16px' }} /></button>
            </div>

            <form onSubmit={handleLogActivitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Activity Type</label>
                <input type="text" className="form-input" placeholder="e.g. Townhall Breakfast, Reflector Jacket Drive" value={activityType} onChange={e => setActivityType(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Meeting Notes & Outcomes</label>
                <textarea rows={3} className="form-input" value={notes} onChange={e => setNotes(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Follow-Up Target Date</label>
                <input type="date" className="form-input" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem' }}>
                Log Stakeholder Activity
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
