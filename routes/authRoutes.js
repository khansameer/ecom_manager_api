const express = require('express');
const router = express.Router();
const db = require('../db');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
require('dotenv').config();
//const fetch = require('node-fetch');
const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_USER_ID } = require('../config.js');


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
    const { email, mobile, otp } = req.body;

    if (!email && !mobile) {
      return res.status(400).json({ message: 'Email or mobile required' });
    }

    if (!otp) {
      return res.status(400).json({ message: 'OTP required from app side' });
    }

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
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No user found to update' });
    }

      res.json({
      message: 'OTP updated successfully',
      email: email || null,
      mobile: mobile || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating OTP', error: error.toString() });
  }
});*/

/*router.post('/generate-otp', async (req, res) => {
  try {
    const { email, mobile } = req.body;
    if (!email && !mobile)
      return res.status(400).json({ message: 'Email or mobile required' });

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
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'No user found' });

    // Send OTP using Resend (only if email is provided)
    if (email) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      try {
        await resend.emails.send({
          from: 'ECom Manager <onboarding@resend.dev>',
          to: email,
          subject: 'OTP for your ECom Manager authentication',
          html: `
            <p>To authenticate, please use the following One Time Password (OTP):</p>
            <h1 style="color: blue;">${otp}</h1>
            <p>This OTP will be valid for <b>15 minutes</b>.</p>
            <p>Do not share this OTP with anyone. If you didn't make this request, you can safely ignore this email.</p>
            <p><b>ECom Manager</b> will never contact you about this email or ask for any login codes or links. Beware of phishing scams.</p>
            <p>Thanks for visiting <b>ECom Manager</b>!</p>
          `
        });
      } catch (mailErr) {
        console.error('❌ Email send error:', mailErr);
        return res.status(500).json({ message: 'Failed to send OTP email', error: mailErr.toString() });
      }
    }

    res.json({ message: 'OTP sent successfully', otp });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Error sending OTP', error: error.toString() });
  }
});*/

router.post('/generate-otp', async (req, res) => {
  try {
    const { email, mobile } = req.body;
    if (!email && !mobile)
      return res.status(400).json({ message: 'Email or mobile required' });

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
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'No user found' });

    // Send OTP using Gmail SMTP with detailed logging
    if (email) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        service: 'gmail',
        // requireTLS: true,
        secure:false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        },
        // connectionTimeout: 10000,
        // logger: true, // Enable Nodemailer internal logger
        // debug: true   // Show SMTP traffic in console
      });

      // Listen for Nodemailer logs
      transporter.on('log', info => {
        console.log('Nodemailer Log:', info);
      });

      // Listen for Nodemailer errors
      transporter.on('error', err => {
        console.error('Nodemailer Transport Error:', err);
      });

      const mailOptions = {
        from: `"ECom Manager" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'OTP for your ECom Manager authentication',
        html: `<h1>Your OTP is: ${otp}</h1>`
      };

      try {
        console.log('📤 Sending email to:', email);
        console.log('📤 SMTP config:', transporter.options);

        let info = await transporter.sendMail(mailOptions);

        console.log('✅ Email sent:', info);
        if (info.accepted && info.accepted.length > 0) {
          console.log('📨 Accepted by:', info.accepted);
        }
        if (info.rejected && info.rejected.length > 0) {
          console.log('🚫 Rejected by:', info.rejected);
        }
        if (info.response) {
          console.log('📬 SMTP Response:', info.response);
        }
      } catch (mailErr) {
        console.error('❌ Email send error:', mailErr);
        if (mailErr.response) {
          console.error('SMTP Response:', mailErr.response);
        }
        if (mailErr.code) {
          console.error('SMTP Error Code:', mailErr.code);
        }
        if (mailErr.command) {
          console.error('SMTP Command:', mailErr.command);
        }
        return res.status(500).json({ message: 'Failed to send OTP email', error: mailErr.toString() });
      }
    }

    res.json({ message: 'OTP sent successfully', otp });
  } catch (error) {
    console.error('Error sending OTP:', error);
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
