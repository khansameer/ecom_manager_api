// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require("axios");


// ✅ Get all store names with ID and user count
router.get('/store_list', (req, res) => {
  const query = `
    SELECT 
      MIN(id) AS id, 
      store_name, 
      COUNT(*) AS count 
    FROM user 
    WHERE store_name IS NOT NULL AND store_name != '' 
    GROUP BY store_name
    ORDER BY store_name ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching store list:', err);
      return res.status(500).json({ status: false, message: 'Database error', error: err });
    }

    res.json({ status: true, stores: results });
  });
});

// Get total counts for a specific store
router.get('/store_summary', (req, res) => {
  const { store_name } = req.query;

  if (!store_name) {
    return res.status(400).json({ status: false, message: 'store_name is required' });
  }

  const queries = {
    users: 'SELECT COUNT(*) AS count FROM user WHERE store_name = ?',
    products: 'SELECT COUNT(*) AS count FROM products WHERE store_name = ?',
    orders: 'SELECT COUNT(*) AS count FROM orders WHERE store_name = ?',
    contacts: 'SELECT COUNT(*) AS count FROM contact_us WHERE store_name = ?'
  };

  const results = {};

  // Execute sequentially
  db.query(queries.users, [store_name], (err, userRes) => {
    if (err) return res.status(500).json({ status: false, message: 'Error fetching users', error: err });
    results.users = userRes[0].count;

    db.query(queries.products, [store_name], (err, prodRes) => {
      if (err) return res.status(500).json({ status: false, message: 'Error fetching products', error: err });
      results.products = prodRes[0].count;

      db.query(queries.orders, [store_name], (err, orderRes) => {
        if (err) return res.status(500).json({ status: false, message: 'Error fetching orders', error: err });
        results.orders = orderRes[0].count;

        db.query(queries.contacts, [store_name], (err, contactRes) => {
          if (err) return res.status(500).json({ status: false, message: 'Error fetching contacts', error: err });
          results.contacts = contactRes[0].count;

          res.json({
            status: true,
            store_name,
            counts: results
          });
        });
      });
    });
  });
});
// ✅ GET /users/store
router.get('/users/store', (req, res) => {
  const { store_name } = req.query;

  if (!store_name) {
    return res.status(400).json({ status: false, message: 'store_name is required' });
  }

  const query = 'SELECT * FROM user WHERE store_name = ?';
  db.query(query, [store_name], (err, results) => {
    if (err) {
      return res.status(500).json({ status: false, message: 'DB error', error: err });
    }
    res.json({
      status: true,
      count: results.length,
      users: results
    });
  });
});
router.get('/products/store', (req, res) => {
  const { store_name } = req.query;

  if (!store_name) {
    return res.status(400).json({ status: false, message: 'store_name is required' });
  }

  // Step 1: Fetch products for this store
  const productQuery = 'SELECT * FROM products WHERE store_name = ?';

  db.query(productQuery, [store_name], (err, productResults) => {
    if (err) {
      return res.status(500).json({ status: false, message: 'DB error (products)', error: err });
    }

    if (productResults.length === 0) {
      return res.json({ status: true, count: 0, products: [] });
    }

    // Step 2: Get the userId or store_name to fetch store details
    const userQuery = 'SELECT store_name, version_code, accessToken FROM user WHERE store_name = ?';

    db.query(userQuery, [store_name], (err, userResults) => {
      if (err) {
        return res.status(500).json({ status: false, message: 'DB error (user)', error: err });
      }

      if (userResults.length === 0) {
        return res.status(404).json({ status: false, message: 'Store not found in user table' });
      }

      const userData = userResults[0];

      // Step 3: Merge store data into each product
      const finalProducts = productResults.map((product) => ({
        ...product,
        store_name: userData.store_name,
        version_code: userData.version_code,
        accessToken: userData.accessToken,
      }));

      res.json({
        status: true,
        count: finalProducts.length,
        products: finalProducts,
      });
    });
  });
});

// ✅ GET /orders/store
router.get('/orders/store', (req, res) => {
  const { store_name } = req.query;

  if (!store_name) {
    return res.status(400).json({ status: false, message: 'store_name is required' });
  }

  const query = 'SELECT * FROM orders WHERE store_name = ?';
  db.query(query, [store_name], (err, results) => {
    if (err) {
      return res.status(500).json({ status: false, message: 'DB error', error: err });
    }
    res.json({
      status: true,
      count: results.length,
      orders: results
    });
  });
});
router.get('/contacts/store', (req, res) => {
  const { store_name } = req.query;

  if (!store_name) {
    return res.status(400).json({ status: false, message: 'store_name is required' });
  }

  const query = 'SELECT * FROM contact_us WHERE store_name = ?';
  db.query(query, [store_name], (err, results) => {
    if (err) {
      return res.status(500).json({ status: false, message: 'DB error', error: err });
    }
    res.json({
      status: true,
      count: results.length,
      contacts: results
    });
  });
});


// ✅ Update user details API
router.put('/users/update', (req, res) => {
  const {
    id,
    name,
    email,
    mobile,
    store_name,
    accessToken,
    version_code,
    logo_url,
    //website_url,
    active_status
  } = req.body;

  // Validation
  if (!id) {
    return res.status(400).json({
      status: false,
      message: "User ID is required"
    });
  }

  // Prepare dynamic fields to update
  const fields = [];
  const values = [];

  if (name !== undefined) { fields.push("name = ?"); values.push(name); }
  if (email !== undefined) { fields.push("email = ?"); values.push(email); }
  if (mobile !== undefined) { fields.push("mobile = ?"); values.push(mobile); }
  if (store_name !== undefined) { fields.push("store_name = ?"); values.push(store_name); }
  if (accessToken !== undefined) { fields.push("accessToken = ?"); values.push(accessToken); }
  if (version_code !== undefined) { fields.push("version_code = ?"); values.push(version_code); }
  if (logo_url !== undefined) { fields.push("logo_url = ?"); values.push(logo_url); }
 // if (website_url !== undefined) { fields.push("website_url = ?"); values.push(website_url); }
  if (active_status !== undefined) { fields.push("active_status = ?"); values.push(active_status); }

  if (fields.length === 0) {
    return res.status(400).json({
      status: false,
      message: "No fields provided to update"
    });
  }

  const query = `UPDATE user SET ${fields.join(", ")} WHERE id = ?`;
  values.push(id);

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("DB Update Error:", err);
      return res.status(500).json({
        status: false,
        message: "Database error",
        error: err
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    // Fetch updated user details
    db.query("SELECT * FROM user WHERE id = ?", [id], (err2, userResult) => {
      if (err2) {
        console.error("DB Fetch Error:", err2);
        return res.status(500).json({
          status: false,
          message: "Error fetching updated user",
          error: err2
        });
      }

      res.json({
        status: true,
        message: "User updated successfully",
        updatedUser: userResult[0]
      });
    });
  });
});





router.post("/products/:image_id/images", async (req, res) => {
  const { image_id } = req.params; // Shopify image ID from URL
  const { product_id, imagePath, storeName, versionCode, accessToken } = req.body;

  // Validation
  if (!image_id || !product_id || !imagePath || !storeName || !versionCode || !accessToken) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const shopifyUrl = `https://${storeName}.myshopify.com/admin/api/${versionCode}/products/${image_id}/images.json`;

  try {
    // Upload image to Shopify
    const response = await axios.post(
      shopifyUrl,
      { image: { attachment: imagePath } },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200 || response.status === 201) {
      // Delete from products table using productId after successful upload
      const deleteQuery = "DELETE FROM products WHERE product_id = ?";
      db.query(deleteQuery, [product_id], (err, result) => {
        if (err) {
          return res.status(500).json({
            status: false,
            message: "Shopify upload done, but DB delete failed",
            error: err,
          });
        }

        res.json({
          status: true,
          message: "Product uploaded to Shopify and removed from DB",
          shopifyData: response.data,
        });
      });
    } else {
      res.status(400).json({ status: false, data: response.data });
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ status: false, error: error.response?.data || error.message });
  }
});

router.post("/products/disapprove/:productId", (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({ status: false, message: "productId is required" });
  }

  const query = "DELETE FROM products WHERE product_id = ?";

  db.query(query, [productId], (err, result) => {
    if (err) {
      return res.status(500).json({ status: false, message: "DB error", error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: false, message: "Product not found" });
    }

    res.json({ status: true, message: "Product disapproved and deleted successfully" });
  });
});

module.exports = router;
