const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const isAuthenticated = require('../middleware/authMiddleware');

// Customer dashboard (view all unique products)
router.get('/', isAuthenticated, customerController.getCustomerDashboard);

// View product details
router.get('/product/:name', isAuthenticated, customerController.getProductDetails);

// Purchase product
router.post('/buy', isAuthenticated, customerController.buyProduct);

module.exports = router;
