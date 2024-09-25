const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const isAuthenticated = require('../middleware/authMiddleware');

// Route to add a product
router.post('/add-product', isAuthenticated, vendorController.addProduct);

// Route to fetch products for the vendor
router.get('/products', isAuthenticated, vendorController.getProducts);

// Route to fetch the vendor dashboard
router.get('/dashboard', isAuthenticated, vendorController.getVendorDashboard);

// Route to render the vendor page (including the profile section)
router.get('/', isAuthenticated, vendorController.getVendorDashboard); // Ensure this function is defined
router.post('/', isAuthenticated, vendorController.updateProfile); // Add this line to handle profile updates
module.exports = router;
