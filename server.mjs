import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'ems_server_db.json');
const DB_BACKUP_FILE = path.join(__dirname, 'ems_server_db.json.bak');
const PORT = process.env.PORT || 5000;

// Active Server-Sent Event (SSE) clients for real-time live sync
const sseClients = new Set();

function broadcastEvent(type, payload) {
  const message = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading DB_FILE, attempting backup restore:', err);
    try {
      if (fs.existsSync(DB_BACKUP_FILE)) {
        return JSON.parse(fs.readFileSync(DB_BACKUP_FILE, 'utf8'));
      }
    } catch (bErr) {
      console.error('Failed to load backup DB:', bErr);
    }
  }
  return {
    strategyMembers: [],
    strategyTasks: [],
    campaignRoadmap: [],
    strategyMeetings: [],
    agents: [],
    tallyResults: [],
    fieldReports: [],
    surveys: [],
    stakeholders: [],
    submissions: [],
    auditLogs: [],
    updatedAt: new Date().toISOString()
  };
}

function saveDb(db) {
  try {
    const serialized = JSON.stringify(db, null, 2);
    // Write to backup first for atomicity
    if (fs.existsSync(DB_FILE)) {
      fs.copyFileSync(DB_FILE, DB_BACKUP_FILE);
    }
    fs.writeFileSync(DB_FILE, serialized, 'utf8');
  } catch (err) {
    console.error('Error saving DB_FILE:', err);
  }
}

let currentDb = loadDb();

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Real-Time Server-Sent Events (SSE) Stream
  if (req.method === 'GET' && (pathname === '/api/stream' || pathname === '/ems/api/stream')) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(`event: init\ndata: ${JSON.stringify({ status: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // System Health
  if (pathname.includes('/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'HEALTHY',
      activeClients: sseClients.size,
      updatedAt: currentDb.updatedAt,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Common DB Full Sync endpoint
  if (req.method === 'GET' && (pathname === '/api/db' || pathname === '/ems/api/db')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(currentDb));
    return;
  }

  if (req.method === 'POST' && (pathname === '/api/db' || pathname === '/ems/api/db')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        currentDb = {
          ...currentDb,
          ...payload,
          updatedAt: new Date().toISOString()
        };
        saveDb(currentDb);
        broadcastEvent('db_update', payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, db: currentDb }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Specific Endpoint: Tallies
  if (pathname === '/api/tallies' || pathname === '/ems/api/tallies') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(currentDb.tallyResults || []));
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const tally = JSON.parse(body);
          const existingIdx = (currentDb.tallyResults || []).findIndex(t => t.id === tally.id || t.pollingStationId === tally.pollingStationId);
          if (existingIdx >= 0) {
            currentDb.tallyResults[existingIdx] = { ...currentDb.tallyResults[existingIdx], ...tally };
          } else {
            currentDb.tallyResults = [tally, ...(currentDb.tallyResults || [])];
          }
          currentDb.updatedAt = new Date().toISOString();
          saveDb(currentDb);
          broadcastEvent('tally_submitted', tally);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, tally }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  // Specific Endpoint: Audit Logs
  if (pathname === '/api/audit-logs' || pathname === '/ems/api/audit-logs') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(currentDb.auditLogs || []));
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const logEntry = JSON.parse(body);
          currentDb.auditLogs = [logEntry, ...(currentDb.auditLogs || [])];
          currentDb.updatedAt = new Date().toISOString();
          saveDb(currentDb);
          broadcastEvent('audit_logged', logEntry);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, logEntry }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`EMS Common Database & Real-Time Sync Server running on 127.0.0.1:${PORT}`);
});
