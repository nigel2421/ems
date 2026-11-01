import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

// Vite dev middleware for Common DB API & Manifest routing
function emsDevServerPlugin() {
  const dbFile = path.resolve(__dirname, 'ems_server_db.json');
  const manifestFile = path.resolve(__dirname, 'public', 'manifest.json');

  const loadDb = () => {
    try {
      if (fs.existsSync(dbFile)) {
        return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      }
    } catch {
      // fallback
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
  };

  const saveDb = (data) => {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('[EMS Dev Server] Could not write DB file:', e);
    }
  };

  return {
    name: 'ems-dev-server-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        // Serve manifest.json at root and with correct MIME type
        if (url === '/manifest.json' || url === '/ems/manifest.json') {
          if (fs.existsSync(manifestFile)) {
            res.setHeader('Content-Type', 'application/manifest+json');
            res.writeHead(200);
            return res.end(fs.readFileSync(manifestFile, 'utf8'));
          }
        }

        // Handle Database Sync endpoint
        if (url === '/api/db' || url === '/ems/api/db') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.writeHead(204);
            return res.end();
          }

          if (req.method === 'GET') {
            const currentDb = loadDb();
            res.writeHead(200);
            return res.end(JSON.stringify(currentDb));
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const payload = JSON.parse(body || '{}');
                const currentDb = loadDb();
                const updated = {
                  ...currentDb,
                  ...payload,
                  updatedAt: new Date().toISOString()
                };
                saveDb(updated);
                res.writeHead(200);
                return res.end(JSON.stringify({ success: true, db: updated }));
              } catch (err) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }

        // Handle Real-Time Tallies endpoint
        if (url === '/api/tallies' || url === '/ems/api/tallies') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (req.method === 'GET') {
            const currentDb = loadDb();
            res.writeHead(200);
            return res.end(JSON.stringify(currentDb.tallyResults || []));
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const tally = JSON.parse(body || '{}');
                const currentDb = loadDb();
                const existingIdx = (currentDb.tallyResults || []).findIndex(t => t.id === tally.id || t.pollingStationId === tally.pollingStationId);
                const updatedTallies = [...(currentDb.tallyResults || [])];
                if (existingIdx >= 0) {
                  updatedTallies[existingIdx] = { ...updatedTallies[existingIdx], ...tally };
                } else {
                  updatedTallies.unshift(tally);
                }
                const updated = { ...currentDb, tallyResults: updatedTallies, updatedAt: new Date().toISOString() };
                saveDb(updated);
                res.writeHead(200);
                return res.end(JSON.stringify({ success: true, tally }));
              } catch (err) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }

        // Handle Real-Time Audit Logs endpoint
        if (url === '/api/audit-logs' || url === '/ems/api/audit-logs') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (req.method === 'GET') {
            const currentDb = loadDb();
            res.writeHead(200);
            return res.end(JSON.stringify(currentDb.auditLogs || []));
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const logEntry = JSON.parse(body || '{}');
                const currentDb = loadDb();
                const updatedLogs = [logEntry, ...(currentDb.auditLogs || [])];
                const updated = { ...currentDb, auditLogs: updatedLogs, updatedAt: new Date().toISOString() };
                saveDb(updated);
                res.writeHead(200);
                return res.end(JSON.stringify({ success: true, logEntry }));
              } catch (err) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  // This app is served from its own domain root (for example kuratech.site).
  base: '/',
  plugins: [react(), emsDevServerPlugin()],
  build: {
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts';
            }
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor-libs';
          }
          if (id.includes('iebcGeographyData.json')) {
            return 'iebc-geography-data';
          }
        }
      }
    }
  }
})

