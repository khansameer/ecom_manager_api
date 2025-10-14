// routes/contact_us.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // adjust path if needed

// POST /contact-us → Insert contact message

router.post('/create', (req, res) => {
  const store = req.body;
  store.id = store.id || null; // अगर id नहीं है तो null
  db.query('INSERT INTO orders SET ?', store, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, ...store });
  });
});
// DELETE /contact-us/:id → Delete a message
router.delete('/delete_order/:order_id', (req, res) => {
  const orderId = req.params.order_id;

  const query = 'DELETE FROM orders WHERE order_id = ?';
  db.query(query, [orderId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Order not found' });

    res.json({ message: 'Order deleted successfully', id: orderId });
  });
});

router.put('/update/:order_id', (req, res) => {
  const orderId = req.params.order_id;
  const updatedData = req.body; // name, value, status, store_name आदि

  db.query('UPDATE orders SET ? WHERE order_id = ?', [updatedData, orderId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Order not found' });

    res.json({ message: 'Order updated successfully', order_id: orderId, updatedData });
  });
});


module.exports = router; // ✅ Important: export the router
