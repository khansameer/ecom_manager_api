// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Create user
// POST /user → Insert user
router.post('/', (req, res) => {
  const { email, name, mobile, ...rest } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: 'Email and name are required' });
  }

  // Step 1: Check for duplicates
  const checkQuery = 'SELECT * FROM user WHERE email = ? OR name = ?';
  db.query(checkQuery, [email, name], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });

    if (results.length > 0) {
      return res.status(400).json({ message: 'Email or name already exists' });
    }

    // Step 2: Insert new user
    const insertQuery = 'INSERT INTO user SET ?';
    db.query(insertQuery, req.body, (err2, result) => {
      if (err2) return res.status(500).json({ message: 'Insert failed', error: err2 });

      res.json({ id: result.insertId, ...req.body });
    });
  });
});
// Get all users
router.get('/', (req, res) => {
  db.query('SELECT * FROM user', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});
router.get('/count', (req, res) => {
  const { store_name } = req.query;

  let query;
  let params = [];

  if (store_name) {
    query = 'SELECT * FROM user WHERE store_name = ?';
    params = [store_name];
  } else {
    query = 'SELECT store_name, COUNT(*) AS count FROM user GROUP BY store_name';
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
});  
router.get('/count_all', (req, res) => {
  const queries = {
    users: 'SELECT COUNT(*) AS count FROM user',
    orders: 'SELECT COUNT(*) AS count FROM orders',
    products: 'SELECT COUNT(*) AS count FROM products',
    contacts: 'SELECT COUNT(*) AS count FROM contact_us'
  };

  const results = {};

  // Execute queries sequentially
  db.query(queries.users, (err, userResult) => {
    if (err) return res.status(500).json({ message: 'Error fetching user count', error: err });
    results.users = userResult[0].count;

    db.query(queries.orders, (err, orderResult) => {
      if (err) return res.status(500).json({ message: 'Error fetching order count', error: err });
      results.orders = orderResult[0].count;

      db.query(queries.products, (err, productResult) => {
        if (err) return res.status(500).json({ message: 'Error fetching product count', error: err });
        results.products = productResult[0].count;

        db.query(queries.contacts, (err, contactResult) => {
          if (err) return res.status(500).json({ message: 'Error fetching contact count', error: err });
          results.contacts = contactResult[0].count;

          res.json({ status: true, counts: results });
        });
      });
    });
  });
});
// Get user by ID
router.get('/:id', (req, res) => {
  db.query('SELECT * FROM user WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0)
      return res.status(404).json({ message: 'user not found' });
    res.json(result[0]);
  });
});

// Update active_status
router.put('/:id/status', (req, res) => {
  const { active_status } = req.body;
  db.query('UPDATE user SET active_status = ? WHERE id = ?', [active_status, req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'user notasasasss found' });
    res.json({ id: req.params.id, active_status });
  });
});

// Update FCM token
router.put('/:id/fcmToken', (req, res) => {
  const { fcm_token } = req.body;
  db.query('UPDATE user SET fcm_token = ? WHERE id = ?', [fcm_token, req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: req.params.id, fcm_token });
  });
});

// Delete user
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM user WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'user not found' });
    res.json({ message: 'user deleted successfully' });
  });
});




//SELECT store_name, COUNT(*) AS count FROM user GROUP BY store_name

module.exports = router;
