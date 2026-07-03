const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const MENU_PATH = path.join(__dirname, 'data', 'menu.json');
const RESERVATIONS_PATH = path.join(__dirname, 'data', 'reservations.json');
const MESSAGES_PATH = path.join(__dirname, 'data', 'messages.json');

app.use(cors());
app.use(express.json());

// Serve the frontend as static files so the whole site can run from one server
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---------- helpers ----------
function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------- Restaurant status (signature "is the grill lit" indicator) ----------
// Open Tue-Sun, 5:00 PM - 11:00 PM local server time. Monday closed.
app.get('/api/status', (req, res) => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday ... 6 = Saturday
  const hour = now.getHours();
  const isMonday = day === 1;
  const withinHours = hour >= 17 && hour < 23;
  const isOpen = !isMonday && withinHours;

  res.json({
    isOpen,
    lit: isOpen,
    message: isMonday
      ? 'Closed today — the grill rests on Mondays.'
      : isOpen
      ? 'The fire is lit. We are open now.'
      : 'The grill is cold right now. We open at 5:00 PM.',
    hours: 'Tue–Sun, 5:00 PM – 11:00 PM',
    serverTime: now.toISOString()
  });
});

// ---------- Menu ----------
app.get('/api/menu', (req, res) => {
  const menu = readJSON(MENU_PATH);
  const { category } = req.query;
  if (category) {
    const filtered = menu.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase()
    );
    return res.json(filtered);
  }
  res.json(menu);
});

// ---------- Reservations ----------
app.get('/api/reservations', (req, res) => {
  // In production this would require admin authentication.
  const reservations = readJSON(RESERVATIONS_PATH);
  res.json(reservations);
});

app.post('/api/reservations', (req, res) => {
  const { name, email, phone, date, time, guests, notes } = req.body;

  const errors = [];
  if (!name || !name.trim()) errors.push('Name is required.');
  if (!email || !isValidEmail(email)) errors.push('A valid email is required.');
  if (!phone || !phone.trim()) errors.push('Phone number is required.');
  if (!date) errors.push('Date is required.');
  if (!time) errors.push('Time is required.');
  if (!guests || Number(guests) < 1) errors.push('Party size must be at least 1.');
  if (guests && Number(guests) > 12) {
    errors.push('For parties over 12, please call us directly.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const reservations = readJSON(RESERVATIONS_PATH);
  const newReservation = {
    id: 'r' + Date.now(),
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    date,
    time,
    guests: Number(guests),
    notes: notes ? notes.trim() : '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  reservations.push(newReservation);
  writeJSON(RESERVATIONS_PATH, reservations);

  res.status(201).json({
    success: true,
    message: `Table requested for ${newReservation.guests} on ${newReservation.date} at ${newReservation.time}. We'll confirm by email shortly.`,
    reservation: newReservation
  });
});

// ---------- Contact ----------
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  const errors = [];
  if (!name || !name.trim()) errors.push('Name is required.');
  if (!email || !isValidEmail(email)) errors.push('A valid email is required.');
  if (!message || !message.trim()) errors.push('Message cannot be empty.');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const messages = readJSON(MESSAGES_PATH);
  const newMessage = {
    id: 'msg' + Date.now(),
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    createdAt: new Date().toISOString()
  };

  messages.push(newMessage);
  writeJSON(MESSAGES_PATH, messages);

  res.status(201).json({
    success: true,
    message: 'Thanks for reaching out — we will get back to you soon.'
  });
});

// ---------- Fallback ----------
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found.' });
});

app.listen(PORT, () => {
  console.log(`Salt & Char server running at http://localhost:${PORT}`);
});
