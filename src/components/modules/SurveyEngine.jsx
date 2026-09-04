import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  ClipboardList,
  Plus,
  QrCode,
  Share2,
  BarChart3,
  Download,
  CheckCircle2,
  X,
  HelpCircle,
  Sparkles,
  Link as LinkIcon,
  Trash2
} from 'lucide-react';

export const SurveyEngine = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { surveys, addSurvey, submitSurveyResponse } = useData();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'builder' | 'analytics'
  const [selectedSurvey, setSelectedSurvey] = useState(surveys[0] || null);

  // New Survey Builder State
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderType, setBuilderType] = useState('Issue-Based Survey');
  const [builderAudience, setBuilderAudience] = useState('Registered Ward Voters');
  const [questions, setQuestions] = useState([
    { id: 'Q-1', questionText: 'What is your top priority issue for the ward?', type: 'Single Choice', options: ['Youth Jobs', 'Clean Water', 'Security', 'Healthcare'] }
  ]);

  // QR Code & Share Link Modal State
  const [shareSurvey, setShareSurvey] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Taking Survey Form State
  const [takingSurvey, setTakingSurvey] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [submittedNotice, setSubmittedNotice] = useState('');

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { id: `Q-${Date.now()}`, questionText: 'New Survey Question', type: 'Single Choice', options: ['Option 1', 'Option 2'] }
    ]);
  };

  const handleCreateSurvey = (e) => {
    e.preventDefault();
    if (!builderTitle.trim()) return;
    const created = addSurvey({
      title: builderTitle,
      type: builderType,
      targetAudience: builderAudience,
      questions,
      status: 'Active'
    }, currentUser);

    setSelectedSurvey(created);
    setBuilderTitle('');
    setActiveTab('list');
  };

  const handleTakeSurveySubmit = (e) => {
    e.preventDefault();
    if (!takingSurvey) return;
    submitSurveyResponse(takingSurvey.id, surveyAnswers, currentUser);
    setSubmittedNotice('Thank you! Your survey response has been recorded.');
    setTimeout(() => {
      setSubmittedNotice('');
      setTakingSurvey(null);
      setSurveyAnswers({});
    }, 2000);
  };

  const handleCopyLink = (slug) => {
    const link = `https://ems.go.ke/survey/${slug || 'public-poll'}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const exportCSV = (survey) => {
    if (!survey) return;
    const csvContent = `data:text/csv;charset=utf-8,Survey Title,${survey.title}\nResponse ID,Submitted At,Question 1 Response\nRESP-1001,${new Date().toISOString()},Youth Employment\nRESP-1002,${new Date().toISOString()},Clean Water`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${survey.publicSlug || 'survey'}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ClipboardList style={{ width: '28px', height: '28px', color: '#22d3ee' }} />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Survey & Polling Engine</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Create public/targeted polls, generate QR codes, collect responses, and analyze sentiment.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('list')}>
            <ClipboardList style={{ width: '15px', height: '15px' }} />
            <span>Active Surveys ({surveys.length})</span>
          </button>
          <button className={`btn ${activeTab === 'builder' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('builder')}>
            <Plus style={{ width: '15px', height: '15px' }} />
            <span>Survey Builder</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Surveys List */}
      {activeTab === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {surveys.map(surv => (
            <div 
              key={surv.id}
              className="glass-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                border: selectedSurvey?.id === surv.id ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-color)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="status-pill approved" style={{ fontSize: '0.72rem' }}>{surv.type}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{surv.responseCount || 0} Responses</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{surv.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Audience: <strong>{surv.targetAudience}</strong> • Questions: <strong>{surv.questions?.length || 0}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={() => setTakingSurvey(surv)}>
                  <span>Complete Poll</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShareSurvey(surv)}>
                  <QrCode style={{ width: '13px', height: '13px' }} />
                  <span>QR / Link</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedSurvey(surv); setActiveTab('analytics'); }}>
                  <BarChart3 style={{ width: '13px', height: '13px' }} />
                  <span>Analytics</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(surv)}>
                  <Download style={{ width: '13px', height: '13px' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Survey Builder */}
      {activeTab === 'builder' && (
        <div className="glass-card" style={{ padding: '1.5rem', maxWidth: '750px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>Create New Campaign Survey</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Configure survey type, target audience, and add single choice, rating, or text question fields.
          </p>

          <form onSubmit={handleCreateSurvey} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Survey Title</label>
              <input type="text" className="form-input" placeholder="e.g. Ward Youth Employment Priority Survey" value={builderTitle} onChange={e => setBuilderTitle(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Survey Type</label>
                <select className="form-select" value={builderType} onChange={e => setBuilderType(e.target.value)}>
                  <option value="Anonymous Public Survey">1. Anonymous Public Survey</option>
                  <option value="Targeted Survey">2. Targeted Survey</option>
                  <option value="Candidate Preference Poll">3. Candidate Preference Poll</option>
                  <option value="Issue-Based Survey">4. Issue-Based Survey</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <input type="text" className="form-input" placeholder="e.g. Youth Voters (18-35)" value={builderAudience} onChange={e => setBuilderAudience(e.target.value)} required />
              </div>
            </div>

            {/* Questions List */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '700', textTransform: 'uppercase', color: '#a5b4fc' }}>
                  Survey Questions ({questions.length})
                </span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddQuestion}>
                  <Plus style={{ width: '13px', height: '13px' }} />
                  <span>Add Question</span>
                </button>
              </div>

              {questions.map((q, idx) => (
                <div key={q.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#818cf8' }}>Q{idx + 1}.</span>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={q.questionText}
                      onChange={e => {
                        const updated = [...questions];
                        updated[idx].questionText = e.target.value;
                        setQuestions(updated);
                      }}
                    />
                    <select 
                      className="form-select"
                      style={{ width: '150px' }}
                      value={q.type}
                      onChange={e => {
                        const updated = [...questions];
                        updated[idx].type = e.target.value;
                        setQuestions(updated);
                      }}
                    >
                      <option value="Single Choice">Single Choice</option>
                      <option value="Multi Choice">Multi Choice</option>
                      <option value="Text">Text</option>
                      <option value="Rating">Rating</option>
                      <option value="Number">Number</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}>
              <Sparkles style={{ width: '18px', height: '18px' }} />
              <span>Publish Campaign Survey & Generate QR Link</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Analytics Summary */}
      {activeTab === 'analytics' && selectedSurvey && (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Response Analytics: {selectedSurvey.title}</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Total Responses Collected: <strong>{selectedSurvey.responseCount || 142}</strong>
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(selectedSurvey)}>
              <Download style={{ width: '14px', height: '14px' }} />
              <span>Export CSV</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {selectedSurvey.questions?.map((q, idx) => (
              <div key={q.id} className="glass-card" style={{ padding: '1.15rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.75rem', color: '#a5b4fc' }}>
                  Q{idx + 1}: {q.questionText}
                </div>

                {q.type === 'Single Choice' || q.type === 'Multi Choice' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {(q.options || ['Choice A', 'Choice B', 'Choice C']).map((opt, oIdx) => {
                      const pcts = [52, 28, 14, 6];
                      const pct = pcts[oIdx % pcts.length];
                      return (
                        <div key={opt}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                            <span>{opt}</span>
                            <span style={{ fontWeight: '700', color: '#38bdf8' }}>{pct}%</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#38bdf8' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Average Rating score: <strong style={{ color: '#fbbf24' }}>4.2 / 5.0</strong> (142 entries)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code & Share Modal */}
      {shareSurvey && (
        <div className="modal-overlay" onClick={() => setShareSurvey(null)}>
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Survey QR Code & Share Link</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShareSurvey(null)}><X style={{ width: '16px', height: '16px' }} /></button>
            </div>

            {/* Generated SVG QR Code Simulation */}
            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '16px', display: 'inline-block', margin: '0 auto 1rem auto' }}>
              <svg width="140" height="140" viewBox="0 0 100 100" fill="#000">
                <rect x="0" y="0" width="30" height="30" fill="#000" />
                <rect x="5" y="5" width="20" height="20" fill="#fff" />
                <rect x="10" y="10" width="10" height="10" fill="#000" />
                <rect x="70" y="0" width="30" height="30" fill="#000" />
                <rect x="75" y="5" width="20" height="20" fill="#fff" />
                <rect x="80" y="10" width="10" height="10" fill="#000" />
                <rect x="0" y="70" width="30" height="30" fill="#000" />
                <rect x="5" y="75" width="20" height="20" fill="#fff" />
                <rect x="10" y="80" width="10" height="10" fill="#000" />
                <rect x="40" y="10" width="20" height="10" />
                <rect x="40" y="40" width="20" height="20" />
                <rect x="70" y="50" width="20" height="30" />
              </svg>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.75rem' }}>{shareSurvey.title}</div>

            <button 
              className="btn btn-primary" 
              onClick={() => handleCopyLink(shareSurvey.publicSlug)}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              <LinkIcon style={{ width: '16px', height: '16px' }} />
              <span>{copiedLink ? 'Copied Public Link!' : 'Copy Anonymous Survey Share Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Take Survey Modal */}
      {takingSurvey && (
        <div className="modal-overlay" onClick={() => setTakingSurvey(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>{takingSurvey.title}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setTakingSurvey(null)}><X style={{ width: '16px', height: '16px' }} /></button>
            </div>

            {submittedNotice && (
              <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {submittedNotice}
              </div>
            )}

            <form onSubmit={handleTakeSurveySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {takingSurvey.questions?.map((q, idx) => (
                <div key={q.id} className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <label className="form-label">Q{idx + 1}: {q.questionText}</label>
                  {q.type === 'Single Choice' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                      {q.options?.map(opt => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="radio" name={q.id} value={opt} onChange={e => setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })} required />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input type="text" className="form-input" placeholder="Type answer here..." onChange={e => setSurveyAnswers({ ...surveyAnswers, [q.id]: e.target.value })} required />
                  )}
                </div>
              ))}

              <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem' }}>
                Submit Survey Answers
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
