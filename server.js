import express from 'express';
import QRCode from 'qrcode';
import initSqlJs from 'sql.js';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'qrcodes.db');
let db = null;
let SQL = null;

// Initialize database
async function initDB() {
  SQL = await initSqlJs();
  
  let data;
  if (fs.existsSync(dbPath)) {
    data = fs.readFileSync(dbPath);
  }
  
  db = new SQL.Database(data);
  
  // Create table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS qrcodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      qr_id TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      label TEXT,
      qr_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      access_count INTEGER DEFAULT 0,
      last_accessed DATETIME
    )
  `);
  
  saveDB();
}

// Save database to file
function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Generate unique QR ID
function generateQRId() {
  return 'QR_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

// API Endpoints

// Generate QR Code
app.post('/api/generate', async (req, res) => {
  try {
    const { content, label } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required' });
    }

    const qrId = generateQRId();
    const qrDataUrl = await QRCode.toDataURL(content, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    // Store in database
    const now = new Date().toISOString();
    db.run(`
      INSERT INTO qrcodes (qr_id, content, label, qr_data, created_at, access_count, last_accessed)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `, [qrId, content, label || 'Untitled', qrDataUrl, now, now]);

    saveDB();

    res.json({
      success: true,
      qrId,
      label: label || 'Untitled',
      qrDataUrl,
      content,
      createdAt: now
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Get all QR Codes
app.get('/api/qrcodes', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, qr_id, content, label, created_at, access_count, last_accessed
      FROM qrcodes
      ORDER BY created_at DESC
    `);

    stmt.bind();
    const qrcodes = [];
    while (stmt.step()) {
      qrcodes.push(stmt.getAsObject());
    }
    stmt.free();

    res.json({ success: true, qrcodes });
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    res.status(500).json({ error: 'Failed to fetch QR codes' });
  }
});

// Get specific QR Code by ID
app.get('/api/qrcodes/:qrId', (req, res) => {
  try {
    const { qrId } = req.params;

    const stmt = db.prepare(`
      SELECT * FROM qrcodes WHERE qr_id = ?
    `);
    stmt.bind([qrId]);
    
    let qrcode = null;
    if (stmt.step()) {
      qrcode = stmt.getAsObject();
    }
    stmt.free();

    if (!qrcode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    // Update access count and last accessed time
    const now = new Date().toISOString();
    db.run(`
      UPDATE qrcodes 
      SET access_count = access_count + 1, last_accessed = ?
      WHERE qr_id = ?
    `, [now, qrId]);
    
    saveDB();

    res.json({ success: true, qrcode });
  } catch (error) {
    console.error('Error fetching QR code:', error);
    res.status(500).json({ error: 'Failed to fetch QR code' });
  }
});

// Delete QR Code
app.delete('/api/qrcodes/:qrId', (req, res) => {
  try {
    const { qrId } = req.params;

    // Check if exists first
    const checkStmt = db.prepare('SELECT id FROM qrcodes WHERE qr_id = ?');
    checkStmt.bind([qrId]);
    const exists = checkStmt.step();
    checkStmt.free();

    if (!exists) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    db.run('DELETE FROM qrcodes WHERE qr_id = ?', [qrId]);
    saveDB();

    res.json({ success: true, message: 'QR code deleted successfully' });
  } catch (error) {
    console.error('Error deleting QR code:', error);
    res.status(500).json({ error: 'Failed to delete QR code' });
  }
});

// Update QR Code label
app.put('/api/qrcodes/:qrId', (req, res) => {
  try {
    const { qrId } = req.params;
    const { label } = req.body;

    // Check if exists first
    const checkStmt = db.prepare('SELECT id FROM qrcodes WHERE qr_id = ?');
    checkStmt.bind([qrId]);
    const exists = checkStmt.step();
    checkStmt.free();

    if (!exists) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    db.run('UPDATE qrcodes SET label = ? WHERE qr_id = ?', [label || 'Untitled', qrId]);
    saveDB();

    res.json({ success: true, message: 'Label updated successfully' });
  } catch (error) {
    console.error('Error updating QR code:', error);
    res.status(500).json({ error: 'Failed to update QR code' });
  }
});

// Download QR Code as PNG
app.get('/api/download/:qrId', async (req, res) => {
  try {
    const { qrId } = req.params;

    const stmt = db.prepare('SELECT qr_data, label FROM qrcodes WHERE qr_id = ?');
    stmt.bind([qrId]);
    
    let qrcode = null;
    if (stmt.step()) {
      qrcode = stmt.getAsObject();
    }
    stmt.free();

    if (!qrcode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const base64Data = qrcode.qr_data.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${qrcode.label || 'qrcode'}.png"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    res.status(500).json({ error: 'Failed to download QR code' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 QR Code Generator running at http://localhost:${PORT}`);
    console.log(`📁 Database: ${dbPath}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
