const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());


// === Your EmailJS credentials ===
const EMAILJS_SERVICE_ID = 'service_q3x803q';
const EMAILJS_TEMPLATE_ID = 'template_qh9hhmd';
const EMAILJS_USER_ID = 'BdeTStneobP-p2DNW';

// MySQL connection
const db = mysql.createPool({
  host: '72.60.29.59',
  user: 'mteam',
  password: 'Mteam^2025',
  database: 'emanager',
  port: 3306
});
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL database successfully!');
    connection.release(); // release connection back to pool
  }
});

//================================== user========================
app.post('/user', (req, res) => {
  const store = req.body;
  db.query('INSERT INTO user SET ?', store, (err, result) => {
    if(err) return res.status(500).json(err);
    res.json({id: result.insertId, ...store});
  });
});

// Login API
app.post('/login', (req, res) => {
  const { email, mobile } = req.body;

  if (!email && !mobile)
    return res.status(400).json({ message: 'Email or mobile required' });

  // Query: match either email or mobile
  const query = 'SELECT * FROM user WHERE email = ? AND  mobile = ?';
  db.query(query, [email, mobile], (err, stores) => {
    if (err) return res.status(500).json(err);
    if (stores.length === 0)
      return res.status(401).json({ message: 'No user found with this email or mobile' });

    const store = stores[0];

    // Return only store data (no password, no products)
    res.json(store);
  });
});


app.get('/user', (req, res) => {
  db.query('SELECT * FROM user', (err, results) => {
    if(err) return res.status(500).json(err);
    res.json(results);
  });
});

// user count as per store name
app.get('/user/count', (req, res) => {
  const query = 'SELECT store_name, COUNT(*) AS count FROM user GROUP BY store_name';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Update store active_status
app.put('/user/:id/status', (req, res) => {
  const storeId = req.params.id;
  const { active_status } = req.body; // expects { "active_status": true } or false

  const query = 'UPDATE user SET active_status = ? WHERE id = ?';
  db.query(query, [active_status, storeId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'user not found' });

    res.json({ id: storeId, active_status, message: 'Status updated successfully' });
  });
});

// Update firebase token 
app.put('/user/:id/fcmToken', (req, res) => {
  const storeId = req.params.id;
  const { fcm_token } = req.body; // expects { "active_status": true } or false

  const query = 'UPDATE user SET fcm_token = ? WHERE id = ?';
  db.query(query, [fcm_token, storeId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'user not found' });

    res.json({ id: storeId, fcm_token, message: 'Status updated successfully' });
  });
});

// Delete Uses
app.delete('/user/:id', (req, res) => {
  const storeId = req.params.id;

  const query = 'DELETE FROM user WHERE id = ?';
  db.query(query, [storeId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'user not found' });

    res.json({ id: storeId, message: 'Store deleted successfully' });
  });
});
// get userbyID Uses 

app.get('/user/:id', (req, res) => {
  const storeId = req.params.id;

  const query = 'SELECT * FROM user WHERE id = ?';
  db.query(query, [storeId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (result.length === 0)
      return res.status(404).json({ message: 'user not found' });

    res.json(result[0]);
  });
});




// Generate OTP API
app.post('/generate-otp', (req, res) => {
  const { email, mobile } = req.body;

  if (!email && !mobile)
    return res.status(400).json({ message: 'Email or mobile required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const query = 'UPDATE user SET otp = ? WHERE email = ? OR mobile = ?';
  db.query(query, [otp, email, mobile], async (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'No store found for this email or mobile' });

    try {
      // === Send Email using EmailJS ===
      const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'origin': 'http://localhost',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_USER_ID,
          template_params: {
            email: email,
            passcode: otp,
            time: '15 minutes'
          }
        })
      });

      if (!emailRes.ok) {
        const errorText = await emailRes.text();
        return res.status(500).json({ message: 'Failed to send OTP email', error: errorText });
      }

      res.json({ message: 'OTP generated and sent to email successfully', otp });
    } catch (error) {
      res.status(500).json({ message: 'Error sending email', error });
    }
  });
});
// Verify OTP API
app.post('/verify-otp', (req, res) => {
  const { email, mobile, otp } = req.body;

  if (!otp)
    return res.status(400).json({ message: 'OTP is required' });

  const selectQuery = 'SELECT * FROM user WHERE (email = ? OR mobile = ?) AND otp = ?';
  db.query(selectQuery, [email, mobile, otp], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length === 0)
      return res.status(400).json({ message: 'Invalid OTP' });

    const store = results[0];

    // ✅ OTP valid → set active_status = 1 and clear OTP
    const updateQuery = 'UPDATE user SET active_status = 1, otp = NULL WHERE id = ?';
    db.query(updateQuery, [store.id], err2 => {
      if (err2) return res.status(500).json({ message: 'Failed to update account status', error: err2 });

      // ✅ Fetch and return full updated store data
      const fetchQuery = 'SELECT * FROM user WHERE id = ?';
      db.query(fetchQuery, [store.id], (err3, updatedResults) => {
        if (err3) return res.status(500).json({ message: 'Error fetching updated data', error: err3 });

        if (updatedResults.length === 0)
          return res.status(404).json({ message: 'Store not found after update' });

        const updatedStore = updatedResults[0];

        // ✅ Return only the store object (no message wrapper)
        res.json(updatedStore);
      });
    });
  });
});

//================================== user========================


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
