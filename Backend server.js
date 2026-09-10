const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const DB = path.join(__dirname, 'data.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

function read() {
  return JSON.parse(fs.readFileSync(DB, 'utf8'));
}
function write(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}
function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(503).json({ error: 'Admin is not configured. Set ADMIN_TOKEN on the server.' });
  const supplied = req.get('authorization') || '';
  if (supplied !== `Bearer ${ADMIN_TOKEN}`) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/api/site', (req, res) => res.json(read()));

app.put('/api/site', requireAdmin, (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return res.status(400).json({ error: 'Invalid site data' });
  }
  const current = read();
  const data = {
    ...current,
    ...incoming,
    services: Array.isArray(incoming.services) ? incoming.services : current.services,
    reviews: Array.isArray(incoming.reviews) ? incoming.reviews : current.reviews,
    bookings: current.bookings || []
  };
  write(data);
  res.json({ ok: true });
});

app.post('/api/bookings', (req, res) => {
  const { name = '', service = '', preferredDate = '', preferredTime = '', message = '' } = req.body || {};
  if (!String(name).trim() || !String(service).trim()) {
    return res.status(400).json({ error: 'Name and service are required' });
  }
  const data = read();
  data.bookings = Array.isArray(data.bookings) ? data.bookings : [];
  data.bookings.push({
    name: String(name).trim(), service: String(service).trim(),
    preferredDate: String(preferredDate).trim(), preferredTime: String(preferredTime).trim(),
    message: String(message).trim(), createdAt: new Date().toISOString()
  });
  write(data);
  res.status(201).json({ ok: true });
});

app.get('/api/bookings', requireAdmin, (req, res) => res.json(read().bookings || []));
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'Zahra Beauty Care' }));

app.listen(PORT, () => console.log(`Zahra Beauty Care server running on port ${PORT}`));
