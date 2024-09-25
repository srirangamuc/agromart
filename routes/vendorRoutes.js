const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const isAuthenticated = require('../middleware/authMiddleware');

// Route to add a product
router.post('/add-product', isAuthenticated, vendorController.addProduct);

// Route to fetch products for the vendor
router.get('/', isAuthenticated, vendorController.getProducts);

// Route to fetch the customer dashboard
router.get('/', isAuthenticated, vendorController.getVendorDashboard);

module.exports = router;
