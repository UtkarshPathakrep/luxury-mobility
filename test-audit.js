/**
 * PTT India - Automated Tri-Agent Verification Audit
 * Runs complete in-process tests for UI/UX, Backend Pipeline, and Cybersecurity.
 */

const fs = require('fs');
const path = require('path');
const { Readable, Writable } = require('stream');
const server = require('./server.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

// Mock Request & Response for in-process HTTP Testing without TCP sockets
function mockRequest(options, postData = null) {
  return new Promise((resolve) => {
    const req = new Readable({
      read() {
        if (postData) {
          this.push(postData);
        }
        this.push(null);
      }
    });

    req.method = options.method || 'GET';
    req.url = options.path || '/';
    req.headers = options.headers || {};
    req.socket = { remoteAddress: options.ip || '127.0.0.1' };

    const res = new Writable();
    res.statusCode = 200;
    res.headers = {};
    res.body = '';

    res.setHeader = function(key, val) {
      this.headers[key.toLowerCase()] = val;
    };
    res.getHeader = function(key) {
      return this.headers[key.toLowerCase()];
    };
    res.writeHead = function(statusCode, headers = {}) {
      this.statusCode = statusCode;
      for (const [k, v] of Object.entries(headers)) {
        this.headers[k.toLowerCase()] = v;
      }
    };
    res._write = function(chunk, encoding, callback) {
      this.body += chunk.toString();
      callback();
    };

    res.on('finish', () => {
      resolve({ statusCode: res.statusCode, headers: res.headers, body: res.body });
    });

    const requestListener = server.listeners('request')[0];
    requestListener(req, res);
  });
}

async function runAudit() {
  console.log('\n======================================================');
  console.log('   AGENT 1: UI/UX DESIGN & ACCESSIBILITY AUDIT');
  console.log('======================================================');

  // Verify global-presence.html and clients.html are completely removed
  assert(!fs.existsSync('global-presence.html'), 'global-presence.html page is completely removed from project');
  assert(!fs.existsSync('clients.html'), 'clients.html page is completely removed from project');

  const pages = [
    'index.html', 'about.html', 'fleet.html', 'services.html',
    'indian-cities.html', 'tours.html', 'contact.html'
  ];

  pages.forEach(p => {
    const content = fs.readFileSync(p, 'utf8');
    assert(content.includes('<!DOCTYPE html>'), `${p}: Has valid HTML5 doctype`);
    assert(content.includes('toggleMobileNav()'), `${p}: Has responsive mobile navigation toggle`);
    assert(content.includes('id="mobile-nav"'), `${p}: Has mobile dropdown drawer`);
    assert(content.includes('9810594259'), `${p}: Has synchronized telephone 9810594259`);
    assert(content.includes('plazatravels2000@gmail.com'), `${p}: Has synchronized email`);
    assert(content.includes('PTT office, Dwarka Sec 12, New Delhi 110078'), `${p}: Has Dwarka Sec 12 HQ address in footer`);
    assert(content.includes('Corporate Account Enrollment'), `${p}: Has Corporate Account Enrollment in footer`);
    assert(!content.toLowerCase().includes('precision ground logistics'), `${p}: Zero precision ground logistics text`);
    assert(!content.toLowerCase().includes('mahipalpur'), `${p}: Zero old Mahipalpur address text`);
    assert(!content.includes('global-presence.html'), `${p}: Zero links to global-presence.html`);
    assert(!content.includes('clients.html'), `${p}: Zero links to clients.html`);
    assert(!content.includes('1999'), `${p}: Zero occurrences of year 1999 (replaced with 2001)`);
    assert(content.includes('viewport-fit=cover'), `${p}: Viewport has viewport-fit=cover for notched/bezel devices`);
    assert(content.includes('touch-action: manipulation'), `${p}: Fast touch responsiveness (touch-action: manipulation)`);
    assert(content.includes('overflow-x: hidden'), `${p}: Prevents horizontal page jitter/overflow (overflow-x: hidden)`);
    assert(content.includes('max-h-[calc(100vh-5rem)]'), `${p}: Drawer is constrained & scrollable for landscape orientation`);
    assert(content.includes('mobile-nav-icon'), `${p}: Mobile toggle button features animated state icon`);
    assert(content.includes('window.innerWidth >= 1280'), `${p}: Drawer auto-dismisses on screen rotation or desktop resize`);
    assert(content.includes('2001'), `${p}: Established/Since 2001 verified`);
    assert(!content.includes('38+ Countries Worldwide') && !content.includes('38+ Global Nations'), `${p}: Zero 38+ global nations text`);
    assert(content.includes('28 States Across India') || content.includes('28 states'), `${p}: Mentions 28 states across India`);
    assert(!content.includes('https://lh3.googleusercontent.com/aida/AEtjO1Wg0c9jr5e'), `${p}: Replaced KTC logo image with PTT India badge`);
    assert(content.includes('Toyota Innova Crysta'), `${p}: Mentions Toyota Innova Crysta in fleet options`);
    assert(content.includes('Maruti Ertiga'), `${p}: Mentions Maruti Ertiga in fleet options`);
    assert(content.includes('Maruti Swift Dezire'), `${p}: Mentions Maruti Swift Dezire in fleet options`);
    assert(content.includes('whitespace-nowrap') && content.includes('Indian Cities'), `${p}: Indian Cities link has whitespace-nowrap preventing multi-line wrap`);
    assert(!content.includes('-ml-3'), `${p}: Uniform gap maintained across all navigation links (no irregular negative margin)`);
    assert(content.includes('gap-4 xl:gap-5'), `${p}: Navigation has uniform responsive gap`);
  });

  const indexHtml = fs.readFileSync('index.html', 'utf8');
  assert(indexHtml.includes('id="booking-form"'), 'index.html: Interactive floating booking engine is fully rendered');
  assert(indexHtml.includes('id="vehicle-tier-select"'), 'index.html: vehicle-tier-select element present for quickReserve()');
  assert(indexHtml.includes('value="innova-crysta"'), 'index.html: vehicle-tier-select includes Toyota Innova Crysta');
  assert(indexHtml.includes('value="maruti-ertiga"'), 'index.html: vehicle-tier-select includes Maruti Ertiga');
  assert(indexHtml.includes('value="swift-dzire"'), 'index.html: vehicle-tier-select includes Maruti Swift Dezire');
  assert(indexHtml.includes('id="bespoke-quotation-form"'), 'index.html: Bespoke Quotation form has id="bespoke-quotation-form"');
  assert(indexHtml.includes('handleBespokeQuotationSubmit(event)'), 'index.html: Bespoke Quotation connects to handleBespokeQuotationSubmit');
  assert(indexHtml.includes('id="bespoke-name"') && indexHtml.includes('id="bespoke-phone"'), 'index.html: Bespoke inputs have id selectors');

  const fleetHtml = fs.readFileSync('fleet.html', 'utf8');
  assert(fleetHtml.includes('id="innova"'), 'fleet.html: Dedicated Toyota Innova Crysta fleet card present');
  assert(fleetHtml.includes('id="ertiga"'), 'fleet.html: Dedicated Maruti Ertiga fleet card present');
  assert(fleetHtml.includes('id="dzire"'), 'fleet.html: Dedicated Maruti Swift Dezire fleet card present');
  assert(fleetHtml.includes('images/fleet-force-urbania-sprinter.jpg'), 'fleet.html: Force Urbania & Sprinter card uses updated bespoke image');

  const aboutHtml = fs.readFileSync('about.html', 'utf8');
  assert(aboutHtml.includes('images/about-ptt-india-flagship.png'), 'about.html: About heritage section on the right uses updated bespoke image');

  const contactHtml = fs.readFileSync('contact.html', 'utf8');
  assert(!contactHtml.includes('Branch Office Directory'), 'contact.html: Branch Office Directory card is completely removed');
  assert(contactHtml.includes('VIP Service Commitments'), 'contact.html: Clean balanced design adjustment with VIP Service Commitments card');
  assert(contactHtml.includes('value="Maruti Ertiga"'), 'contact.html: Preferred vehicle dropdown includes Maruti Ertiga');
  assert(contactHtml.includes('value="Maruti Swift Dezire"'), 'contact.html: Preferred vehicle dropdown includes Maruti Swift Dezire');

  // Verify Flagship Fleet Card Images on index.html
  assert(indexHtml.includes("images/fleet-mercedes-s-class.jpg"), 'index.html: Mercedes S-Class card uses local PTT India image');
  assert(indexHtml.includes("images/fleet-bmw-7-series.jpg"), 'index.html: BMW 7 Series card uses local PTT India image');
  assert(indexHtml.includes("images/fleet-mercedes-gls-maybach.png"), 'index.html: Mercedes GLS / Maybach card uses local PTT India image');
  assert(indexHtml.includes("images/fleet-toyota-vellfire.png"), 'index.html: Toyota Vellfire card uses local PTT India image');
  assert(indexHtml.includes("images/fleet-toyota-innova-crysta.png"), 'index.html: Toyota Innova Crysta card uses local PTT India image');
  assert(indexHtml.includes("images/fleet-maruti-ertiga.jpg"), 'index.html: Maruti Ertiga card uses local PTT India image');
  assert(indexHtml.includes("images/fleet-maruti-swift-dezire.jpg"), 'index.html: Maruti Swift Dezire card uses local PTT India image');
  assert(indexHtml.includes("images/fleet-ev-green-mobility.jpg"), 'index.html: EV Green Mobility card uses local PTT India image');
  assert(indexHtml.includes("images/fleet-volvo-luxury-coach.jpg"), 'index.html: Volvo Luxury Coach card uses local PTT India image');

  // Verify Services Portfolio Images on index.html
  assert(indexHtml.includes("images/service-chauffeur-driven.jpg"), 'index.html: Chauffeur-driven daily & outstation uses local PTT India image');
  assert(indexHtml.includes("images/service-corporate-mobility.jpg"), 'index.html: Corporate mobility & long-term lease uses local PTT India image');
  assert(indexHtml.includes("images/service-vip-airport-transfer.png"), 'index.html: VIP Airport Meet & Greet uses local PTT India image (media_1793094490288)');

  // Verify Bespoke Chauffeur Tours Across India cards on index.html (reverted to original curated images)
  assert(indexHtml.includes("Taj Mahal Luxury Express") && indexHtml.includes("AB6AXuAVb2s_pJk3PY0vnk0_4gajoBIGaF2BprPtsjv"), 'index.html: Taj Mahal Luxury Express uses original sunrise image');
  assert(indexHtml.includes("Golden Triangle Circuit") && indexHtml.includes("AB6AXuA3-Hu6iC6TV-62J7mcLWShuiuIjQZpLdjFVJi"), 'index.html: Golden Triangle Circuit uses original Hawa Mahal image');
  assert(indexHtml.includes("Ayodhya Ram Mandir &amp; Kashi") && indexHtml.includes("AB6AXuDxGmbDLwYNUZ2LECjFEx-8FeqUzitAZXy26P4"), 'index.html: Ayodhya Ram Mandir uses original sacred Mandir image');
  assert(indexHtml.includes("Char Dham Yatra by SUV") && indexHtml.includes("AB6AXuDBv6AzapiMnb81PCyKuuQYuO7QsCz6i2xt4Vl"), 'index.html: Char Dham Yatra uses original Himalayan road image');

  // Verify tours.html Images (Updated with bespoke photoshoot images)
  const toursHtml = fs.readFileSync('tours.html', 'utf8');
  assert(toursHtml.includes("images/about-ptt-india-flagship.png"), 'tours.html: Hero banner uses PTT India flagship image');
  assert(toursHtml.includes("images/tour-golden-triangle.jpg"), 'tours.html: Golden Triangle Tour uses bespoke PTT India photo');
  assert(toursHtml.includes("images/tour-same-day-agra.jpg"), 'tours.html: Same Day Luxury Agra Tour uses bespoke PTT India photo');
  assert(toursHtml.includes("images/tour-mussoorie-dehradun.jpg"), 'tours.html: Mussoorie Tour uses bespoke PTT India photo');
  assert(toursHtml.includes("images/tour-ayodhya-ram-mandir.jpg"), 'tours.html: Ayodhya Tour uses bespoke PTT India photo');
  assert(toursHtml.includes("images/tour-chardham-yatra.jpg"), 'tours.html: Char Dham Yatra uses bespoke PTT India photo');
  assert(toursHtml.includes("images/tour-rajasthan-palace.jpg"), 'tours.html: Rajasthan Palace Tour uses bespoke PTT India photo');
  assert(!toursHtml.includes("lh3.googleusercontent.com"), 'tours.html: Zero external placeholder images remaining');

  console.log('\n======================================================');
  console.log('   AGENT 2: BACKEND DEVELOPER & PIPELINE AUDIT');
  console.log('======================================================');

  // Test static file serving via in-process pipeline
  const homeRes = await mockRequest({ path: '/', method: 'GET' });
  assert(homeRes.statusCode === 200, 'GET /: Static index.html served with 200 OK');
  assert(homeRes.headers['content-type'].includes('text/html'), 'GET /: Correct text/html MIME type');
  assert(Boolean(homeRes.headers['etag']), 'GET /: Server generates valid HTTP ETag for caching');
  assert(Boolean(homeRes.headers['cache-control']), 'GET /: Sets Cache-Control header');

  // Test ETag 304 Not Modified Revalidation
  const etagVal = homeRes.headers['etag'];
  const notModRes = await mockRequest({
    path: '/',
    method: 'GET',
    headers: { 'if-none-match': etagVal }
  });
  assert(notModRes.statusCode === 304, 'HTTP Caching: Returns 304 Not Modified on matching If-None-Match ETag');

  // Test Dynamic GZIP Compression
  const gzipRes = await mockRequest({
    path: '/',
    method: 'GET',
    headers: { 'accept-encoding': 'gzip, deflate, br' }
  });
  assert(gzipRes.statusCode === 200, 'GZIP Performance: Compresses payload with 200 OK');
  assert(gzipRes.headers['content-encoding'] === 'gzip', 'GZIP Performance: Returns Content-Encoding: gzip header');

  const jsRes = await mockRequest({ path: '/api-client.js', method: 'GET' });
  assert(jsRes.statusCode === 200, 'GET /api-client.js: Served with 200 OK');
  assert(jsRes.headers['content-type'].includes('javascript'), 'GET /api-client.js: Correct application/javascript MIME type');

  const apiClientContent = fs.readFileSync('api-client.js', 'utf8');
  assert(apiClientContent.includes('handleBespokeQuotationSubmit'), 'api-client.js: Implements handleBespokeQuotationSubmit()');
  assert(apiClientContent.includes('wa.me/919810594259'), 'api-client.js: Bespoke requests route to WhatsApp 9810594259');
  assert(apiClientContent.includes('handleCorporateEnrollment'), 'api-client.js: Implements handleCorporateEnrollment()');
  assert(apiClientContent.includes('mailto:plazatravels2000@gmail.com'), 'api-client.js: Corporate enrollments route to plazatravels2000@gmail.com');
  assert(apiClientContent.includes("'innova-crysta': 'Toyota Innova Crysta'"), 'api-client.js: Maps innova-crysta');
  assert(apiClientContent.includes("'maruti-ertiga': 'Maruti Ertiga'"), 'api-client.js: Maps maruti-ertiga');
  assert(apiClientContent.includes("'swift-dzire': 'Maruti Swift Dezire'"), 'api-client.js: Maps swift-dzire');

  // Test Fleet & Tour Images Serving Pipeline
  const fleetImages = [
    '/images/fleet-mercedes-s-class.jpg',
    '/images/fleet-bmw-7-series.jpg',
    '/images/fleet-mercedes-gls-maybach.png',
    '/images/fleet-toyota-vellfire.png',
    '/images/fleet-toyota-innova-crysta.png',
    '/images/fleet-maruti-ertiga.jpg',
    '/images/fleet-maruti-swift-dezire.jpg',
    '/images/fleet-ev-green-mobility.jpg',
    '/images/fleet-volvo-luxury-coach.jpg',
    '/images/fleet-force-urbania-sprinter.jpg',
    '/images/about-ptt-india-flagship.png',
    '/images/service-chauffeur-driven.jpg',
    '/images/service-corporate-mobility.jpg',
    '/images/service-vip-airport-transfer.png',
    '/images/tour-golden-triangle.jpg',
    '/images/tour-same-day-agra.jpg',
    '/images/tour-mussoorie-dehradun.jpg',
    '/images/tour-ayodhya-ram-mandir.jpg',
    '/images/tour-chardham-yatra.jpg',
    '/images/tour-rajasthan-palace.jpg'
  ];

  for (const imgUrl of fleetImages) {
    const imgRes = await mockRequest({ path: imgUrl, method: 'GET' });
    const expectedType = imgUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
    assert(imgRes.statusCode === 200, `GET ${imgUrl}: Served with 200 OK`);
    assert(imgRes.headers['content-type'] === expectedType, `GET ${imgUrl}: Correct MIME type (${expectedType})`);
  }

  // Test Booking REST API pipeline
  const testBooking = JSON.stringify({
    name: 'Ambassador Alexander Vance',
    phone: '+919810594259',
    email: 'plazatravels2000@gmail.com',
    service: 'VIP Airport Transfer',
    vehicle: 'Toyota Innova Crysta',
    pickupCity: 'New Delhi',
    destination: 'Dwarka Sec 12',
    datetime: '2026-10-30T10:00',
    notes: 'Executive corporate delegation'
  });

  const bookRes = await mockRequest({
    path: '/api/book',
    method: 'POST',
    headers: { 'content-type': 'application/json' }
  }, testBooking);

  assert(bookRes.statusCode === 200, 'POST /api/book: Receives and processes booking with 200 OK');
  const bookJson = JSON.parse(bookRes.body);
  assert(bookJson.success === true && bookJson.bookingId.startsWith('PTT-2026-'), 'POST /api/book: Generated valid PTT-2026 reference code');

  // Verify persistence in data/bookings.json
  const bookingsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'bookings.json'), 'utf8'));
  const foundBooking = bookingsData.find(b => b.id === bookJson.bookingId);
  assert(foundBooking !== undefined, 'Data Pipeline: Booking successfully persisted to disk in data/bookings.json');
  assert(foundBooking.customer.name === 'Ambassador Alexander Vance', 'Data Pipeline: Customer name accurately saved');

  // Test Corporate Newsletter / Enrollment Pipeline
  const subData = JSON.stringify({ email: 'director@corporate.com', type: 'Corporate Account Enrollment' });
  const subRes = await mockRequest({
    path: '/api/subscribe',
    method: 'POST',
    headers: { 'content-type': 'application/json' }
  }, subData);
  assert(subRes.statusCode === 200, 'POST /api/subscribe: Processed corporate subscription with 200 OK');

  const subsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'subscribers.json'), 'utf8'));
  const foundSub = subsData.filter(s => s.email === 'director@corporate.com').pop();
  assert(foundSub !== undefined, 'Data Pipeline: Email subscriber saved to data/subscribers.json');
  assert(foundSub.recipient === 'plazatravels2000@gmail.com', 'Data Pipeline: Recipient email is plazatravels2000@gmail.com');

  console.log('\n======================================================');
  console.log('   AGENT 3: CYBERSECURITY THREAT ASSESSMENT AUDIT');
  console.log('======================================================');

  // Security Headers Check
  assert(homeRes.headers['x-frame-options'] === 'SAMEORIGIN', 'Security Header: X-Frame-Options is SAMEORIGIN (Anti-Clickjacking)');
  assert(homeRes.headers['x-content-type-options'] === 'nosniff', 'Security Header: X-Content-Type-Options is nosniff (Anti-MIME Sniffing)');
  assert(homeRes.headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Security Header: Referrer-Policy is strict-origin-when-cross-origin');
  assert(homeRes.headers['content-security-policy'].includes("default-src 'self'"), 'Security Header: CSP configured with default-src self');

  // Directory Traversal Prevention
  const traversalRes = await mockRequest({ path: '/../../package.json', method: 'GET' });
  assert(traversalRes.statusCode === 403 || traversalRes.statusCode === 404, 'Path Traversal Protection: Blocked traversal attempt');

  // Request Body Size Limit Check (Oversized payload)
  const oversizedPayload = JSON.stringify({ data: 'A'.repeat(60 * 1024) });
  const overflowRes = await mockRequest({
    path: '/api/book',
    method: 'POST',
    headers: { 'content-type': 'application/json' }
  }, oversizedPayload);
  assert(overflowRes.statusCode === 413, 'DDoS / Buffer Overflow Protection: Blocked oversized payload with 413');

  // Input Validation (Reject invalid booking)
  const invalidBooking = JSON.stringify({ name: '' });
  const invalidRes = await mockRequest({
    path: '/api/book',
    method: 'POST',
    headers: { 'content-type': 'application/json' }
  }, invalidBooking);
  assert(invalidRes.statusCode === 400, 'Input Sanitization: Rejected incomplete payload with 400 Bad Request');

  console.log('\n======================================================');
  console.log(`   FINAL TRI-AGENT AUDIT RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('======================================================\n');
}

runAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
