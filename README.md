# QR Code Generator - Lifetime Edition

A powerful, self-hosted QR code generator that creates lifetime QR codes which never expire. All data is stored locally in an SQLite database.

## Features

✨ **Lifetime QR Codes** - QR codes never expire
📱 **Full-Featured** - Generate QR codes from URLs, text, emails, phone numbers, etc.
💾 **Local Database** - SQLite database stores all QR codes permanently
📊 **Statistics** - Track total QR codes and scan counts
🎨 **Modern UI** - Beautiful, responsive interface
📥 **Easy Download** - Download QR codes as PNG images
🔐 **Secure** - All data stored locally on your machine

## Requirements

- Node.js 14+ (Download from https://nodejs.org/)
- npm (comes with Node.js)

## Installation & Setup

### 1. Extract the ZIP file
```bash
unzip qr-code-generator.zip
cd qr-generator
```

### 2. Install dependencies
```bash
npm install
```

This will install:
- Express.js (web server)
- QRCode library (QR generation)
- better-sqlite3 (database)
- CORS & body-parser (middleware)

### 3. Run the application
```bash
npm start
```

You should see:
```
🚀 QR Code Generator running at http://localhost:3000
📁 Database: /path/to/qrcodes.db
```

### 4. Open in your browser
Navigate to: **http://localhost:3000**

## Usage

### Generate a QR Code
1. Enter content (URL, text, email, phone, etc.)
2. Optionally add a label
3. Click "Generate QR Code"
4. The QR code appears immediately and is saved to the database

### View All QR Codes
- All generated QR codes appear in the "QR Code History" panel
- Shows label, content, creation date, and scan count
- Organized by newest first

### Download QR Code
- Click "Download" on any QR code
- Saves as PNG image with the label as filename

### Delete QR Code
- Click "Delete" to remove from database
- Confirmation required

### Statistics
- Total QR codes generated
- Total scans/access count across all codes

## Database

The app uses **SQLite** for permanent storage:
- **Location**: `qrcodes.db` (in the project root)
- **Table**: `qrcodes` with columns:
  - `id` - Auto-incrementing ID
  - `qr_id` - Unique identifier
  - `content` - What the QR code contains
  - `label` - User-friendly name
  - `qr_data` - Base64 encoded PNG image
  - `created_at` - Timestamp of creation
  - `access_count` - Number of times accessed
  - `last_accessed` - Last access timestamp

The database file persists forever - your QR codes are never deleted unless you manually remove them.

## File Structure

```
qr-generator/
├── server.js              # Express backend server
├── package.json           # Dependencies configuration
├── qrcodes.db            # SQLite database (created on first run)
└── public/
    └── index.html        # Frontend interface
```

## API Endpoints

All endpoints respond with JSON:

### POST /api/generate
Generate a new QR code
```json
{
  "content": "https://example.com",
  "label": "My Website"
}
```

### GET /api/qrcodes
Get all QR codes

### GET /api/qrcodes/:qrId
Get specific QR code details

### PUT /api/qrcodes/:qrId
Update QR code label
```json
{
  "label": "New Label"
}
```

### DELETE /api/qrcodes/:qrId
Delete a QR code

### GET /api/download/:qrId
Download QR code as PNG

### GET /api/health
Health check

## Customization

### Change Port
Edit `server.js` line:
```javascript
const PORT = process.env.PORT || 3000;
```

Or set environment variable:
```bash
PORT=8080 npm start
```

### Modify Colors
Edit `public/index.html` CSS variables:
```css
:root {
  --primary: #0f766e;
  --accent: #14b8a6;
  /* ... */
}
```

### Database Location
Change in `server.js`:
```javascript
const dbPath = path.join(__dirname, 'qrcodes.db');
```

## Troubleshooting

**Port already in use:**
```bash
PORT=8080 npm start
```

**npm install fails:**
```bash
npm install --no-save
```

**Database locked:**
Restart the application and ensure no other instance is running.

**QR codes not loading:**
Check browser console (F12) for errors and ensure server is running.

## Backing Up Your Data

Your QR codes are in `qrcodes.db`. To back up:
```bash
cp qrcodes.db qrcodes.db.backup
```

To restore:
```bash
cp qrcodes.db.backup qrcodes.db
```

## Performance

- Handles thousands of QR codes efficiently
- Database queries are optimized with proper indexing
- Frontend loads instantly even with many codes
- QR generation takes <1 second

## License

MIT License - Feel free to use and modify!

## Support

If you encounter issues:
1. Check the browser console (F12)
2. Check server logs in terminal
3. Ensure Node.js is installed: `node --version`
4. Restart the application: Kill process and run `npm start` again

---

**Created with ❤️ - Your QR codes, forever stored locally.**
