const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const contact_us = require('./routes/contact_us');
const product = require('./routes/product');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Use routes
app.use('/user', userRoutes);
app.use('/', authRoutes);
app.use('/contact-us', contact_us);
app.use('/product', product);
app.use('/adminRoutes', adminRoutes);
app.use('/order', orderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
