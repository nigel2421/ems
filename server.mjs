import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'ems_server_db.json');
const PORT = process.env.PORT || 5000;

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading DB_FILE:', err);
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
    submissions: []
  };
}

function saveDb(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
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
        const payload = JSON.parse(body);
        currentDb = {
          ...currentDb,
          ...payload,
          updatedAt: new Date().toISOString()
        };
        saveDb(currentDb);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, db: currentDb }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (pathname.includes('/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'HEALTHY', timestamp: new Date().toISOString() }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`EMS Common Database Server running on port ${PORT}`);
});
