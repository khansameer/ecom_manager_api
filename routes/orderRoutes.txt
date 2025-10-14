// routes/contact_us.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // adjust path if needed

// POST /contact-us → Insert contact message

router.post('/', (req, res) => {
  const store = req.body;
  db.query('INSERT INTO contact_us SET ?', store, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, ...store });
  });
});


// PUT /contact-us/:id → Update contact message
router.put('/:contact_id', (req, res) => {
  const contactId = req.params.contact_id;
  const updates = req.body;

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No data provided for update' });
  }

  const query = 'UPDATE contact_us SET ? WHERE contact_id = ?';
  db.query(query, [updates, contactId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Contact not found' });

    // Return the updated record
    db.query('SELECT * FROM contact_us WHERE id = ?', [contactId], (err2, rows) => {
      if (err2) return res.status(500).json({ message: 'Database error', error: err2 });
      res.json(rows[0]);
    });
  });
});

// GET /contact-us → Fetch all messages
router.get('/', (req, res) => {
  const query = 'SELECT * FROM contact_us ORDER BY created_date DESC';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
});


// DELETE /contact-us/:id → Delete a message
router.delete('/:contact_id', (req, res) => {
  const contactId = req.params.id;

  const query = 'DELETE FROM contact_us WHERE contact_id = ?';
  db.query(query, [contactId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Contact not found' });

    res.json({ message: 'Contact message deleted successfully', id: contactId });
  });
});

// get contact store name wise
router.get('/store', (req, res) => {
  const { store_name } = req.query;

  if (!store_name) {
    return res.status(400).json({ status: false, message: 'store_name is required' });
  }

  const query = 'SELECT * FROM contact_us WHERE store_name = ?';
  db.query(query, [store_name], (err, results) => {
    if (err) {
      console.error('DB Fetch Error:', err);
      return res.status(500).json({ status: false, message: 'Internal server error', error: err });
    }

    res.json({ status: true, contacts: results });
  });
});

router.get('/store/count', (req, res) => {
  const { store_name } = req.query;

  if (!store_name) {
    return res.status(400).json({ status: false, message: 'store_name is required' });
  }

  const query = 'SELECT COUNT(*) AS count FROM contact_us WHERE store_name = ?';
  db.query(query, [store_name], (err, results) => {
    if (err) {
      console.error('DB Count Error:', err);
      return res.status(500).json({ status: false, message: 'Internal server error', error: err });
    }

    res.json({
      status: true,
      store_name,
      count: results[0].count
    });
  });
});
module.exports = router; // ✅ Important: export the router
