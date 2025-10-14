// routes/contact_us.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // adjust path if needed
const axios = require('axios'); // ✅ Add this line
// POST /contact-us → Insert contact message


router.post('/', (req, res) => {
  const { id, name, image_path, image_id,store_name  } = req.body;

  if (!image_path || !name || !store_name) {
    return res.status(400).json({ status: false, message: 'Missing required fields' });
  }
  
  const store = { id, name, image_path, image_id, store_name };

  db.query('INSERT INTO products SET ?', store, (err, result) => {
    if (err) {
      console.error('DB Insert Error:', err);
      return res.status(500).json({ status: false, message: 'Internal server issue' });
    }

    res.json({
      status: true,
      message: 'Product uploaded successfully',
      product_id: result.insertId,
    });
  });
});


// PUT /contact-us/:id → Update contact message
router.put('/:product_id', (req, res) => {
  const contactId = req.params.product_id;
  const updates = req.body;

  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No data provided for update' });
  }

  const query = 'UPDATE products SET ? WHERE product_id = ?';
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



//Approve Image from APi
// Approve Image from API
// Approve product image and delete from DB
router.post('/approve', async (req, res) => {
  const { shopifyProductId, imagePath, storeName, versionCode } = req.body;

  // Validate input
  if (!shopifyProductId || !imagePath || !storeName || !versionCode) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Shopify API URL
  const shopifyUrl = `https://${storeName}.myshopify.com/admin/api/${versionCode}/products/${shopifyProductId}/images.json`;

  console.log('===== Approve API called =====');
  console.log('Shopify URL:', shopifyUrl);
  console.log('Shopify Product ID:', shopifyProductId);
  console.log('Store Name:', storeName);
  console.log('Image Path length (Base64):', imagePath.length);

  try {
    // Call Shopify API
    const response = await axios.post(
      shopifyUrl,
      { image: { attachment: imagePath } },
      {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN, // Set your token in .env
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Shopify API response status:', response.status);
    console.log('Shopify API response data:', response.data);

    if (response.status === 200 || response.status === 201) {
      // Delete the product from MySQL
      db.query(
        'DELETE FROM products WHERE image_id = ?',
        [shopifyProductId],
        (err, result) => {
          if (err) {
            console.error('DB delete error:', err);
            return res.status(500).json({ message: 'DB delete error', error: err });
          }

          console.log(`Product ${shopifyProductId} deleted from DB`);
          return res.json({
            message: 'Product approved and deleted successfully',
            product_id: shopifyProductId,
            shopifyResponse: response.data,
          });
        }
      );
    } else {
      res.status(400).json({ message: 'Shopify API failed', shopifyResponse: response.data });
    }
  } catch (e) {
    console.error('Error calling Shopify API:', e.toString());
    res.status(500).json({ message: 'Error calling Shopify API', error: e.toString() });
  }
});


// DELETE /products/:id → delete product from table
router.delete('/:id', (req, res) => {
  const productId = req.params.id;

  const query = 'DELETE FROM products WHERE product_id = ?';
  db.query(query, [productId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Product deleted successfully', product_id: productId });
  });
});

//get all product store name wise
router.get('/', (req, res) => {
  const { store_name } = req.query;

  if (!store_name) {
    return res.status(400).json({ status: false, message: 'store_name is required' });
  }

  const query = 'SELECT * FROM products WHERE store_name = ?';
  db.query(query, [store_name], (err, results) => {
    if (err) {
      console.error('DB Fetch Error:', err);
      return res.status(500).json({ status: false, message: 'Internal server error', error: err });
    }

    res.json({ status: true, products: results });
  });
});

router.get('/count', (req, res) => {
  const { store_name } = req.query;

  if (!store_name) {
    return res.status(400).json({ status: false, message: 'store_name is required' });
  }

  const query = 'SELECT COUNT(*) AS count FROM products WHERE store_name = ?';
  db.query(query, [store_name], (err, results) => {
    if (err) {
      console.error('DB Count Error:', err);
      return res.status(500).json({ status: false, message: 'Internal server error', error: err });
    }

    res.json({
      status: true,
      store_name,
      count: results[0]?.count || 0
    });
  });
});
module.exports = router; // ✅ Important: export the router

