const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../db');
//const fetch = require('node-fetch');
const axios = require('axios');  // ✅ use require, not import
//const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_USER_ID } = require('./config.js');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sameerflutter@gmail.com',       // replace with your Gmail
    pass: 'Sameer@007'           // generate App Password from Gmail settings
  }
});

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

/*router.post('/generate-otp', async (req, res) => {
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

     if (email) {
      await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_USER_ID,
        template_params: { email, passcode: otp, time: '15 minutes' }
      }, { headers: { 'Content-Type': 'application/json' } });
    }
    res.json({ message: 'OTP sent successfully', otp });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Error sending OTP', error: error.toString() });
  }
});
*/

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
    if (result[0].affectedRows === 0) return res.status(404).json({ message: 'No user found' });

    // Send OTP via email if email is provided
    if (email) {
      await transporter.sendMail({
        from: '"ECom Manager" sameerflutter@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP is ${otp}. It is valid for 15 minutes.`,
        html: `<p>Your OTP is <b>${otp}</b>. It is valid for 15 minutes.</p>`
      });
    }

    // Optional: Send SMS if mobile (use SMS API here)

    res.json({ message: 'OTP sent successfully', otp });
  } catch (error) {
    console.error('Error generating OTP:', error.message);
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
