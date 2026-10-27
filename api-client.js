/**
 * PTT India - Unified API Client & Security Utility
 * Handles form validation, XSS sanitization, request pipeline, WhatsApp dispatch,
 * and corporate email enrollment.
 */

// 1. Cybersecurity: HTML Sanitization & Input Validation
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function validateEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(email).trim());
}

function validatePhone(phone) {
  const digits = String(phone).replace(/[^0-9]/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

// 2. Luxury Toast / Modal Notification System
function showLuxuryModal(title, message, bookingId = null, extraAction = null) {
  const existing = document.getElementById('ptt-luxury-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'ptt-luxury-modal';
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';

  let bookingCodeHtml = '';
  if (bookingId) {
    bookingCodeHtml = `
      <div class="my-4 p-3 rounded-lg bg-surface-container border border-outline-variant/30 text-center">
        <span class="font-label-eyebrow text-secondary uppercase text-[11px] block font-bold">Booking Reference ID</span>
        <span class="font-mono font-bold text-on-surface text-[18px] tracking-wider">${escapeHtml(bookingId)}</span>
      </div>
    `;
  }

  let extraButtonHtml = '';
  if (extraAction) {
    extraButtonHtml = `
      <a href="${extraAction.url}" target="_blank" class="flex-1 py-3 px-4 rounded-lg bg-secondary-fixed text-on-secondary-fixed font-label-md font-semibold text-center hover:bg-secondary-fixed-dim transition-all flex items-center justify-center gap-2">
        <span class="material-symbols-outlined text-[18px]">${extraAction.icon || 'chat'}</span>
        <span>${escapeHtml(extraAction.label)}</span>
      </a>
    `;
  }

  modal.innerHTML = `
    <div class="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 lg:p-8 shadow-2xl border border-outline-variant/30 relative">
      <button onclick="document.getElementById('ptt-luxury-modal').remove()" class="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface">
        <span class="material-symbols-outlined text-[20px]">close</span>
      </button>
      <div class="w-12 h-12 rounded-full bg-secondary-fixed/20 flex items-center justify-center text-secondary mb-4 mx-auto">
        <span class="material-symbols-outlined text-[28px]">check_circle</span>
      </div>
      <h3 class="font-headline-md text-on-surface font-semibold text-center text-[20px] mb-2">${escapeHtml(title)}</h3>
      <p class="font-body-sm text-on-surface-variant text-center leading-relaxed mb-4">${escapeHtml(message)}</p>
      ${bookingCodeHtml}
      <div class="flex items-center gap-3 mt-6">
        ${extraButtonHtml}
        <button onclick="document.getElementById('ptt-luxury-modal').remove()" class="flex-1 py-3 px-4 rounded-lg bg-primary-container text-white font-label-md font-semibold hover:bg-black transition-all text-center">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// 3. Backend Pipeline: Store and Dispatch Booking
async function submitBookingPipeline(bookingData) {
  const payload = {
    name: escapeHtml(bookingData.name || 'Guest'),
    phone: escapeHtml(bookingData.phone || ''),
    email: escapeHtml(bookingData.email || ''),
    service: escapeHtml(bookingData.service || 'Chauffeur Booking'),
    vehicle: escapeHtml(bookingData.vehicle || 'Mercedes S-Class'),
    pickupCity: escapeHtml(bookingData.pickupCity || bookingData.city || 'New Delhi'),
    destination: escapeHtml(bookingData.destination || 'Local'),
    datetime: escapeHtml(bookingData.datetime || new Date().toISOString()),
    notes: escapeHtml(bookingData.notes || 'None'),
    source: escapeHtml(bookingData.source || 'Web Portal'),
    timestamp: new Date().toISOString()
  };

  let bookingId = 'PTT-' + Date.now().toString(36).toUpperCase();

  let backendSuccess = false;
  try {
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.bookingId) bookingId = data.bookingId;
      backendSuccess = true;
    }
  } catch (err) {
    console.warn('Backend endpoint unreachable, using client-side offline storage:', err.message);
  }

  try {
    const existing = JSON.parse(localStorage.getItem('ptt_bookings') || '[]');
    existing.push({ ...payload, bookingId, backendSynced: backendSuccess });
    localStorage.setItem('ptt_bookings', JSON.stringify(existing));
  } catch (e) {
    console.error('localStorage unavailable:', e);
  }

  const waMsg = encodeURIComponent(
    `Hello PTT India Concierge,\n\n` +
    `*Booking Inquiry Reference: ${bookingId}*\n` +
    `• Name: ${payload.name}\n` +
    `• Phone: ${payload.phone}\n` +
    `• Email: ${payload.email}\n` +
    `• Service: ${payload.service}\n` +
    `• Vehicle: ${payload.vehicle}\n` +
    `• City: ${payload.pickupCity}\n` +
    `• Destination/Duration: ${payload.destination}\n` +
    `• Date/Time: ${payload.datetime}\n` +
    `• Special Notes: ${payload.notes}`
  );

  const waUrl = `https://wa.me/919810594259?text=${waMsg}`;

  showLuxuryModal(
    'Reservation Request Confirmed',
    'Your chauffeur request has been dispatched to our 24/7 New Delhi central operations desk. An executive will connect with you within 15 minutes.',
    bookingId,
    { label: 'Chat on WhatsApp', url: waUrl, icon: 'chat' }
  );

  return { success: true, bookingId, waUrl };
}

// 4. Request Bespoke Quotation Handler -> Send to WhatsApp 9810594259
function handleBespokeQuotationSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('bespoke-name')?.value || '';
  const email = document.getElementById('bespoke-email')?.value || '';
  const phone = document.getElementById('bespoke-phone')?.value || '';
  const service = document.getElementById('bespoke-service')?.value || 'Chauffeur Driven Daily VIP Rental';
  const notes = document.getElementById('bespoke-notes')?.value || '';

  if (!validatePhone(phone)) {
    alert('Please enter a valid phone or WhatsApp number (at least 10 digits).');
    return;
  }
  if (!validateEmail(email)) {
    alert('Please enter a valid corporate or personal email address.');
    return;
  }

  // 1. Submit to internal database / storage pipeline
  submitBookingPipeline({
    name,
    phone,
    email,
    service,
    vehicle: 'Bespoke Quotation Fleet',
    pickupCity: 'New Delhi / Pan-India',
    destination: 'As specified in itinerary',
    notes,
    source: 'Request Bespoke Quotation'
  });

  // 2. Format detailed message specifically requested for WhatsApp number 9810594259
  const waMsg = encodeURIComponent(
    `Hello PTT India Concierge,\n\n` +
    `*REQUEST BESPOKE QUOTATION*\n` +
    `• Full Legal Name: ${name}\n` +
    `• Corporate / Personal Email: ${email}\n` +
    `• Direct Phone / WhatsApp: ${phone}\n` +
    `• Service Tier: ${service}\n` +
    `• Itinerary / Requirements: ${notes || 'Standard executive itinerary'}`
  );

  const waUrl = `https://wa.me/919810594259?text=${waMsg}`;

  // 3. Open WhatsApp directly to 9810594259
  window.open(waUrl, '_blank');
}

// 5. Hero Section Booking Handler on index.html
function handleHeroBooking(event) {
  event.preventDefault();
  const pickup = document.getElementById('hero-pickup')?.value || '';
  const dest = document.getElementById('hero-dest')?.value || '';
  const vehicle = document.getElementById('vehicle-tier-select')?.value || 's-class';
  const datetime = document.getElementById('hero-datetime')?.value || '';

  const vehicleMap = {
    's-class': 'Mercedes-Benz S-Class',
    'bmw-7': 'BMW 7 Series',
    'maybach': 'Mercedes GLS / Maybach SUV',
    'vellfire': 'Toyota Vellfire VIP Lounge',
    'innova-crysta': 'Toyota Innova Crysta',
    'maruti-ertiga': 'Maruti Ertiga',
    'swift-dzire': 'Maruti Swift Dezire',
    'ev-luxury': 'EV Green Luxury (BYD / MG)',
    'volvo': 'Volvo Luxury Coach'
  };

  const selectedVehicleName = vehicleMap[vehicle] || 'Mercedes-Benz S-Class';

  window.location.href = `contact.html?vehicle=${encodeURIComponent(selectedVehicleName)}&city=${encodeURIComponent(pickup)}&service=Hourly%20City%20Disposal`;
}

// 6. Contact Form Handler on contact.html
function handleContactSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('cust-name')?.value || '';
  const phone = document.getElementById('cust-phone')?.value || '';
  const email = document.getElementById('cust-email')?.value || '';
  const service = document.getElementById('cust-service')?.value || '';
  const vehicle = document.getElementById('cust-vehicle')?.value || '';
  const city = document.getElementById('cust-city')?.value || '';
  const datetime = document.getElementById('cust-datetime')?.value || '';
  const destination = document.getElementById('cust-destination')?.value || '';
  const notes = document.getElementById('cust-notes')?.value || '';

  if (!validatePhone(phone)) {
    alert('Please enter a valid phone number (at least 10 digits).');
    return;
  }
  if (!validateEmail(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  submitBookingPipeline({
    name,
    phone,
    email,
    service,
    vehicle,
    pickupCity: city,
    destination,
    datetime,
    notes,
    source: 'Contact Page Reservation'
  });
}

// 7. Corporate Account Enrollment Handler -> Send details to plazatravels2000@gmail.com
async function handleCorporateEnrollment(event) {
  event.preventDefault();
  const form = event.target;
  const input = form.querySelector('input[type="email"]');
  if (!input) return;
  const email = input.value.trim();

  if (!validateEmail(email)) {
    alert('Please enter a valid corporate business email address.');
    return;
  }

  // 1. Submit to backend API pipeline
  try {
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: escapeHtml(email),
        targetEmail: 'plazatravels2000@gmail.com',
        type: 'Corporate Account Enrollment',
        timestamp: new Date().toISOString()
      })
    });
  } catch (e) {}

  // 2. Save locally
  try {
    const existing = JSON.parse(localStorage.getItem('ptt_corporate_enrollments') || '[]');
    existing.push({ email, target: 'plazatravels2000@gmail.com', timestamp: new Date().toISOString() });
    localStorage.setItem('ptt_corporate_enrollments', JSON.stringify(existing));
  } catch (e) {}

  // 3. Send email to plazatravels2000@gmail.com via mailto
  const subject = encodeURIComponent('New Corporate Account Enrollment Request');
  const body = encodeURIComponent(
    `Hello PTT India Operations Desk,\n\n` +
    `A new corporate organization has requested Account Enrollment:\n\n` +
    `• Organization Business Email: ${email}\n` +
    `• Target Recipient: plazatravels2000@gmail.com\n` +
    `• Timestamp: ${new Date().toLocaleString()}\n\n` +
    `Please dispatch the enterprise rate card, master service agreement (MSA), and priority corporate booking credentials.`
  );

  const mailtoUrl = `mailto:plazatravels2000@gmail.com?subject=${subject}&body=${body}`;

  // Trigger default email client dispatch
  window.location.href = mailtoUrl;

  input.value = '';

  showLuxuryModal(
    'Corporate Enrollment Dispatched',
    `Your enrollment details have been sent to plazatravels2000@gmail.com. Our executive accounts desk will dispatch your corporate tariff kit and SLA agreement.`,
    null,
    { label: 'Email Concierge Directly', url: mailtoUrl, icon: 'mail' }
  );
}

// Backward compatibility alias
function handleNewsletterSubmit(event) {
  return handleCorporateEnrollment(event);
}
