const express = require('express');
const router = express.Router();
const db = require('../db');
//const fetch = require('node-fetch');

// EmailJS config
const EMAILJS_SERVICE_ID = 'service_q3x803q';
const EMAILJS_TEMPLATE_ID = 'template_qh9hhmd';
const EMAILJS_USER_ID = 'BdeTStneobP-p2DNW';

// Utility to run db queries as Promise
const queryAsync = (sql, params) => new Promise((resolve, reject) => {
  db.query(sql, params, (err, result) => err ? reject(err) : resolve(result));
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, mobile } = req.body;
    if (!email || !mobile) return res.status(400).json({ message: 'Email and mobile are required' });

    const users = await queryAsync(
      'SELECT * FROM user WHERE email = ? AND mobile = ?',
      [email, mobile]
    );

    if (users.length === 0) return res.status(401).json({ message: 'Invalid email or mobile' });

    res.json(users[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error', error: err });
  }
});

// Generate OTP
router.post('/generate-otp', async (req, res) => {
  try {
    const { email, mobile } = req.body;
    if (!email && !mobile) return res.status(400).json({ message: 'Email or mobile required' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    let query = 'UPDATE user SET otp = ? WHERE ';
    const params = [otp];

    if (email && mobile) {
      query += 'email = ? OR mobile = ?';
      params.push(email, mobile);
    } else if (email) {
      query += 'email = ?';
      params.push(email);
    } else {
      query += 'mobile = ?';
      params.push(mobile);
    }

    const result = await queryAsync(query, params);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'No user found' });

    // Send OTP via EmailJS
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_USER_ID,
        template_params: { email, passcode: otp, time: '15 minutes' }
      })
    });

    res.json({ message: 'OTP sent successfully', otp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending OTP', error: error.toString() });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, mobile, otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP required' });

    const users = await queryAsync(
      'SELECT * FROM user WHERE (email = ? OR mobile = ?) AND otp = ?',
      [email, mobile, otp]
    );

    if (users.length === 0) return res.status(400).json({ message: 'Invalid OTP' });

    const user = users[0];
    await queryAsync('UPDATE user SET active_status = 1, otp = NULL WHERE id = ?', [user.id]);

    const updated = await queryAsync('SELECT * FROM user WHERE id = ?', [user.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ✅ Export as named export
module.exports = router;
