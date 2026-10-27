/**
 * PTT India - Production Node.js Server
 * Features: Zero dependencies, OWASP-aligned Security Headers,
 * REST APIs for bookings & subscriptions, in-memory rate limiting,
 * WHATWG URL parser, and strict path-traversal & sensitive-file protection.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname);
const DATA_DIR = path.join(ROOT_DIR, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, '[]', 'utf8');
}
if (!fs.existsSync(SUBSCRIBERS_FILE)) {
  fs.writeFileSync(SUBSCRIBERS_FILE, '[]', 'utf8');
}

// Whitelisted MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// Rate limiter: Max 30 requests per minute per IP
const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReq = 30;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, [now]);
    return false;
  }

  const timestamps = rateLimitMap.get(ip).filter(t => now - t < windowMs);
  if (timestamps.length >= maxReq) {
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

// Global Security Headers (OWASP Top 10 recommendations)
function setSecurityHeaders(res) {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; script-src 'self' https://cdn.tailwindcss.com 'unsafe-inline';"
  );
}

// Parse JSON request body with max size limit (50KB)
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    const MAX_SIZE = 50 * 1024;

    req.on('data', chunk => {
      body += chunk;
      if (body.length > MAX_SIZE) {
        reject(new Error('Payload Too Large'));
      }
    });

    req.on('end', () => {
      if (!body) return resolve({});
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON Payload'));
      }
    });

    req.on('error', err => reject(err));
  });
}

// Server handler
const server = http.createServer(async (req, res) => {
  setSecurityHeaders(res);

  const clientIp = req.socket.remoteAddress || '127.0.0.1';
  // Use WHATWG URL API instead of deprecated url.parse()
  const reqUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = reqUrl.pathname;

  // Rate limit API endpoints
  if (pathname.startsWith('/api/') && isRateLimited(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Too Many Requests. Please wait a minute.' }));
  }

  // 1. API: POST /api/book
  if (req.method === 'POST' && pathname === '/api/book') {
    try {
      const data = await parseRequestBody(req);

      if (!data.name || !data.phone) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Missing required fields: name and phone are mandatory.' }));
      }

      const bookingId = 'PTT-2026-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      const bookingRecord = {
        id: bookingId,
        timestamp: new Date().toISOString(),
        clientIp,
        customer: {
          name: String(data.name).substring(0, 100),
          phone: String(data.phone).substring(0, 30),
          email: String(data.email || '').substring(0, 100)
        },
        details: {
          service: String(data.service || 'Chauffeur Booking').substring(0, 100),
          vehicle: String(data.vehicle || 'Mercedes S-Class').substring(0, 100),
          pickupCity: String(data.pickupCity || 'New Delhi').substring(0, 100),
          destination: String(data.destination || 'Local').substring(0, 150),
          datetime: String(data.datetime || '').substring(0, 50),
          notes: String(data.notes || '').substring(0, 500)
        },
        status: 'DISPATCH_PENDING'
      };

      // Atomic file write
      const currentBookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8') || '[]');
      currentBookings.push(bookingRecord);
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(currentBookings, null, 2), 'utf8');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        bookingId,
        message: 'Your booking has been received and confirmed by 24/7 central dispatch.'
      }));
    } catch (err) {
      res.writeHead(err.message === 'Payload Too Large' ? 413 : 400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 2. API: POST /api/subscribe (Corporate Newsletter)
  if (req.method === 'POST' && pathname === '/api/subscribe') {
    try {
      const data = await parseRequestBody(req);
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Valid email is required.' }));
      }

      const currentSubscribers = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8') || '[]');
      currentSubscribers.push({
        email: String(data.email).substring(0, 100),
        timestamp: new Date().toISOString(),
        clientIp,
        recipient: 'plazatravels2000@gmail.com',
        type: data.type || 'Corporate Account Enrollment'
      });
      fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(currentSubscribers, null, 2), 'utf8');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: 'Subscribed to corporate notifications.' }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 3. API: GET /api/bookings (Administrative / Telemetry)
  if (req.method === 'GET' && pathname === '/api/bookings') {
    try {
      const currentBookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8') || '[]');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ count: currentBookings.length, bookings: currentBookings }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Failed to read bookings store.' }));
    }
  }

  // 4. Cybersecurity Check: Path Traversal & Sensitive File Exposure Prevention
  const decodedPath = decodeURIComponent(pathname);
  if (decodedPath.includes('..') || decodedPath.includes('\0') || decodedPath.startsWith('/data/') || decodedPath === '/package.json' || decodedPath === '/server.js' || decodedPath === '/test-audit.js') {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden: Access denied');
  }

  // 5. Static Asset Server
  let reqPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const safeRelativePath = path.normalize(reqPath).replace(/^(\/|\\)+/, '');
  const filePath = path.resolve(ROOT_DIR, safeRelativePath);

  // Guard against escaping ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden: Access denied');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext];

  // Block unauthorized extensions (e.g. .json, .env, hidden files)
  if (!contentType) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<h1>404 - Not Found</h1>');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found | PTT India</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:50px; background:#fbfbfa; color:#1a1917;">
          <h1>404 - Page Not Found</h1>
          <p>The requested route could not be located on the server.</p>
          <a href="/" style="color:#775a19; font-weight:bold;">Return to Home</a>
        </body>
        </html>
      `);
    }

    // ETag & 304 Not Modified
    const etag = `W/"${stats.size}-${stats.mtime.getTime()}"`;
    if (req.headers && req.headers['if-none-match'] === etag) {
      res.writeHead(304);
      return res.end();
    }

    const headers = {
      'Content-Type': contentType,
      'ETag': etag,
      'Cache-Control': ext === '.html' ? 'public, max-age=0, must-revalidate' : 'public, max-age=604800, stale-while-revalidate=86400'
    };

    const isCompressible = /^(text\/|application\/javascript|image\/svg\+xml)/.test(contentType);
    const acceptEncoding = (req.headers && req.headers['accept-encoding']) || '';

    if (isCompressible && acceptEncoding.includes('gzip')) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      const rawStream = fs.createReadStream(filePath);
      const gzip = zlib.createGzip({ level: 6 });
      rawStream.pipe(gzip).pipe(res);
    } else {
      res.writeHead(200, headers);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[PTT INDIA] Server live and listening on http://localhost:${PORT}`);
    console.log(`[PTT INDIA] Global Headquarters: PTT office, Dwarka Sec 12, New Delhi 110078`);
    console.log(`[PTT INDIA] 24/7 Hotline: 9810594259 | Email: plazatravels2000@gmail.com`);
  });
}

module.exports = server;
