const http = require('http');
const fs = require('fs');
const path = require('path');
const SqlGenerator = require('./js/sql_generator.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(__dirname, 'data');
const DB_JSON_FILE = path.join(DATA_DIR, 'database.json');
const DB_JS_FILE = path.join(DATA_DIR, 'database.js');
const DB_SQL_FILE = path.join(DATA_DIR, 'database.sql');
const ROOT_SQL_FILE = path.join(PUBLIC_DIR, 'database.sql');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Active Server-Sent Events (SSE) client connections
const sseClients = new Set();

function broadcastDatabaseUpdate(data, source = 'server') {
  const payload = JSON.stringify({
    type: 'database_updated',
    source: source,
    timestamp: new Date().toISOString(),
    data: data
  });

  for (const client of sseClients) {
    client.write(`data: ${payload}\n\n`);
  }
}

// Helper to write database.json, database.js, and database.sql
function saveDatabaseFiles(dataObj) {
  dataObj._lastUpdated = new Date().toISOString();
  const jsonStr = JSON.stringify(dataObj, null, 2);

  // 1. Write database.json
  fs.writeFileSync(DB_JSON_FILE, jsonStr, 'utf8');

  // 2. Write database.js wrapper (universal UMD)
  const jsStr = `// data/database.js - Embedded Live Database Wrapper\n(function(root) {\n  const dbData = ${jsonStr};\n  if (typeof module !== 'undefined' && module.exports) { module.exports = dbData; }\n  if (typeof window !== 'undefined') { window.LIVE_DATABASE = dbData; }\n  root.LIVE_DATABASE = dbData;\n})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);\n`;
  fs.writeFileSync(DB_JS_FILE, jsStr, 'utf8');

  // 3. Auto-generate and sync database.sql
  try {
    const sqlStr = SqlGenerator.generateSqlDump(dataObj);
    fs.writeFileSync(ROOT_SQL_FILE, sqlStr, 'utf8');
    fs.writeFileSync(DB_SQL_FILE, sqlStr, 'utf8');
  } catch (err) {
    console.error('Error generating SQL dump:', err);
  }
}

// Helper to read database
function readDatabase() {
  if (fs.existsSync(DB_JSON_FILE)) {
    try {
      const raw = fs.readFileSync(DB_JSON_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading database.json:', e);
    }
  }
  return null;
}

// Watch data/database.json for external file modifications
let watchDebounce = null;
try {
  fs.watch(DATA_DIR, (eventType, filename) => {
    if (filename === 'database.json') {
      clearTimeout(watchDebounce);
      watchDebounce = setTimeout(() => {
        const currentData = readDatabase();
        if (currentData) {
          console.log(`[LIVE SYNC] Perubahan terdeteksi pada ${filename}, memperbarui klien...`);
          broadcastDatabaseUpdate(currentData, 'disk_change');
        }
      }, 250);
    }
  });
} catch (e) {
  console.warn('Watch warning:', e.message);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.sql': 'application/sql; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // SSE Live Stream Endpoint
  if (pathname === '/api/database/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // SQL Dump REST API Endpoint
  if (pathname === '/api/database/sql' || pathname === '/api/export-sql') {
    const db = readDatabase();
    if (db) {
      try {
        const sqlContent = SqlGenerator.generateSqlDump(db);
        res.writeHead(200, {
          'Content-Type': 'application/sql; charset=utf-8',
          'Content-Disposition': 'attachment; filename="database.sql"'
        });
        res.end(sqlContent);
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to generate SQL dump', message: e.message }));
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Database file not found' }));
    }
    return;
  }

  // Database REST API Endpoints
  if (pathname === '/api/database' || pathname === '/api/state') {
    if (req.method === 'GET') {
      const db = readDatabase();
      if (db) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(db));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database file not found' }));
      }
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          saveDatabaseFiles(parsed);
          broadcastDatabaseUpdate(parsed, 'client_post');

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'success',
            message: 'Live database file updated successfully',
            file: 'data/database.json',
            timestamp: new Date().toISOString()
          }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON payload', message: e.message }));
        }
      });
      return;
    }
  }

  // Static File Serving
  let reqPath = pathname === '/' ? '/index.html' : pathname;
  let safePath = path.normalize(path.join(PUBLIC_DIR, reqPath));

  // Path traversal protection
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🟢 SNAPRINT DIGITAL PRINTING - LIVE DATABASE SYSTEM AKTIF`);
  console.log(`   Database JSON     : ${DB_JSON_FILE}`);
  console.log(`   Database SQL      : ${ROOT_SQL_FILE} (Auto-sync)`);
  console.log(`   URL Aplikasi      : http://localhost:${PORT}`);
  console.log(`   Sinkronisasi Live : Real-time SSE Stream & File Watcher Aktif`);
  console.log(`   Tekan Ctrl + C untuk menghentikan server`);
  console.log(`================================================================`);
});
