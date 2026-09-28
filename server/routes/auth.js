const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (password !== 'password') {
        return res.status(400).json({ error: 'Invalid email or password.' });
    }
    const token = jwt.sign({ id: 1, role: 'Central Admin', state: 'National', district: 'National' }, 'sih2026_super_secret_key', { expiresIn: '24h' });
    res.json({ token, user: { id: 1, name: 'Admin User', email, role: 'Central Admin' } });
});

module.exports = router;
