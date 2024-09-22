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
// router.get('/profile', customerController.getProfile);

// POST route for updating profile
router.post('/profile/update', customerController.updateProfile);

router.post('/cart/update',customerController.updateCartQuantity);



module.exports = router;
