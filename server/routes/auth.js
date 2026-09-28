const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Pre-configured admin accounts for all existing places in the system
const ADMIN_ACCOUNTS = [
  { id: 1, name: 'Central Nodal Admin', email: 'admin@sih.gov.in', role: 'Central Admin', state: 'National', district: 'National' },
  // Karnataka
  { id: 2, name: 'Karnataka State Admin', email: 'karnataka@sih.gov.in', role: 'State Officer', state: 'Karnataka', district: 'ALL' },
  { id: 3, name: 'Tumkur District Admin', email: 'tumkur@sih.gov.in', role: 'District Officer', state: 'Karnataka', district: 'Tumkur' },
  // Maharashtra
  { id: 4, name: 'Maharashtra State Admin', email: 'maharashtra@sih.gov.in', role: 'State Officer', state: 'Maharashtra', district: 'ALL' },
  { id: 5, name: 'Pune District Admin', email: 'pune@sih.gov.in', role: 'District Officer', state: 'Maharashtra', district: 'Pune' },
  // Uttar Pradesh
  { id: 6, name: 'Uttar Pradesh State Admin', email: 'up@sih.gov.in', role: 'State Officer', state: 'Uttar Pradesh', district: 'ALL' },
  { id: 7, name: 'Varanasi District Admin', email: 'varanasi@sih.gov.in', role: 'District Officer', state: 'Uttar Pradesh', district: 'Varanasi' },
  // Gujarat
  { id: 8, name: 'Gujarat State Admin', email: 'gujarat@sih.gov.in', role: 'State Officer', state: 'Gujarat', district: 'ALL' },
  { id: 9, name: 'Ahmedabad District Admin', email: 'ahmedabad@sih.gov.in', role: 'District Officer', state: 'Gujarat', district: 'Ahmedabad' },
  // Tamil Nadu
  { id: 10, name: 'Tamil Nadu State Admin', email: 'tamilnadu@sih.gov.in', role: 'State Officer', state: 'Tamil Nadu', district: 'ALL' },
  { id: 11, name: 'Coimbatore District Admin', email: 'coimbatore@sih.gov.in', role: 'District Officer', state: 'Tamil Nadu', district: 'Coimbatore' },
  // Rajasthan
  { id: 12, name: 'Rajasthan State Admin', email: 'rajasthan@sih.gov.in', role: 'State Officer', state: 'Rajasthan', district: 'ALL' },
  { id: 13, name: 'Jaipur District Admin', email: 'jaipur@sih.gov.in', role: 'District Officer', state: 'Rajasthan', district: 'Jaipur' },
  // West Bengal
  { id: 14, name: 'West Bengal State Admin', email: 'westbengal@sih.gov.in', role: 'State Officer', state: 'West Bengal', district: 'ALL' },
  { id: 15, name: 'Hooghly District Admin', email: 'hooghly@sih.gov.in', role: 'District Officer', state: 'West Bengal', district: 'Hooghly' },
  // Punjab
  { id: 16, name: 'Punjab State Admin', email: 'punjab@sih.gov.in', role: 'State Officer', state: 'Punjab', district: 'ALL' },
  { id: 17, name: 'Ludhiana District Admin', email: 'ludhiana@sih.gov.in', role: 'District Officer', state: 'Punjab', district: 'Ludhiana' },
  // Field Agent
  { id: 18, name: 'Field Agent Ramesh', email: 'ramesh@sih.gov.in', role: 'Field Agent', state: 'Karnataka', district: 'Tumkur' }
];

router.get('/accounts', (req, res) => {
  res.json(ADMIN_ACCOUNTS);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (password !== 'password') {
    return res.status(400).json({ error: 'Invalid email or password. Demo password is "password".' });
  }

  const normalizedEmail = (email || '').toLowerCase().trim();
  const account = ADMIN_ACCOUNTS.find(a => a.email.toLowerCase() === normalizedEmail);

  if (!account) {
    return res.status(404).json({ error: 'Account not found for this email.' });
  }

  const token = jwt.sign(
    { id: account.id, role: account.role, state: account.state, district: account.district },
    process.env.JWT_SECRET || 'sih2026_super_secret_key',
    { expiresIn: '24h' }
  );

  res.json({ token, user: account });
});

router.post('/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (currentPassword !== 'password') {
    return res.status(400).json({ error: 'Current password is incorrect (demo default is "password").' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters.' });
  }

  res.json({ success: true, message: 'Password updated successfully!' });
});

module.exports = router;

