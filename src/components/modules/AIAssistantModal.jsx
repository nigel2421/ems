import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getLLMApiKey, setLLMApiKey } from '../../services/llmService';
import {
  Sparkles,
  Send,
  X,
  Bot,
  Key,
  CheckCircle2,
  Settings,
  Cpu
} from 'lucide-react';

export const AIAssistantModal = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { aiChatHistory, sendAIQuery } = useData();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getLLMApiKey());
  const [keySaveNotice, setKeySaveNotice] = useState('');

  const quickPrompts = [
    'Which wards are becoming competitive?',
    'What are the top voter concerns this week?',
    'Which agents are underperforming?',
    'Generate weekly executive strategy briefing'
  ];

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    setLLMApiKey(apiKeyInput);
    setKeySaveNotice(apiKeyInput.trim() ? 'Google Gemini API Key saved!' : 'Key cleared. Using local rule engine.');
    setTimeout(() => {
      setKeySaveNotice('');
      setShowSettings(false);
    }, 2000);
  };

  const handleSend = async (promptToSend = null) => {
    const prompt = promptToSend || inputPrompt;
    if (!prompt.trim() || isProcessing) return;

    setInputPrompt('');
    setIsProcessing(true);

    await sendAIQuery(prompt, currentUser);
    setIsProcessing(false);
  };

  const currentApiKey = getLLMApiKey();

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 900 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '700px', 
          height: '640px', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '1.25rem',
          borderRadius: '20px',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 14, 26, 0.99) 100%)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)', border: '1px solid rgba(99,102,241,0.4)' }}>
              <Sparkles style={{ width: '22px', height: '22px', color: '#fbbf24' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>Campaign LLM Assistant</h2>
                <span className={`status-pill ${currentApiKey ? 'approved' : 'pending'}`} style={{ fontSize: '0.68rem' }}>
                  {currentApiKey ? 'Google Gemini 1.5 Flash Active' : 'Local Rule Engine'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time generative AI intelligence over ground truth data</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(!showSettings)} title="Configure LLM API Key">
              <Key style={{ width: '14px', height: '14px', color: '#fbbf24' }} />
              <span>API Key</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}><X style={{ width: '16px', height: '16px' }} /></button>
          </div>
        </div>

        {/* API Key Settings Drawer */}
        {showSettings && (
          <div style={{ background: 'rgba(99, 102, 241, 0.12)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#a5b4fc', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Cpu style={{ width: '15px', height: '15px' }} />
              <span>Configure Google Gemini LLM API Credentials</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Enter your Google Gemini API Key below, or set <code style={{ color: '#818cf8' }}>VITE_GEMINI_API_KEY</code> in your <code style={{ color: '#818cf8' }}>.env</code> file.
            </p>

            {keySaveNotice && (
              <div style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                <span>{keySaveNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveApiKey} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="password" 
                className="form-input" 
                placeholder="AIzaSy..." 
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                Save Key
              </button>
            </form>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(qp)}
              style={{
                fontSize: '0.74rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '20px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#a5b4fc',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              ✨ {qp}
            </button>
          ))}
        </div>

        {/* Chat Messages Stream */}
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.85rem',
            paddingRight: '0.5rem',
            marginBottom: '0.85rem'
          }}
        >
          {aiChatHistory.map(msg => (
            <div 
              key={msg.id}
              style={{
                display: 'flex',
                gap: '0.65rem',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%'
              }}
            >
              {msg.sender === 'ai' && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot style={{ width: '16px', height: '16px', color: '#fff' }} />
                </div>
              )}

              <div 
                style={{
                  background: msg.sender === 'user' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: msg.sender === 'user' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '0.85rem 1rem',
                  color: '#fff',
                  fontSize: '0.85rem',
                  lineHeight: '1.55',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div style={{ display: 'flex', gap: '0.65rem', alignSelf: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot style={{ width: '16px', height: '16px', color: '#fff' }} />
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#a5b4fc' }}>
                Analyzing live ground truth data & generating LLM response...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Ask LLM e.g. Summarize top voter concerns or high-risk wards..."
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            disabled={isProcessing}
            style={{ borderRadius: '12px' }}
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isProcessing || !inputPrompt.trim()}
            style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            <Send style={{ width: '16px', height: '16px' }} />
          </button>
        </form>
      </div>
    </div>
  );
};
