const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Customer dashboard
router.get('/', customerController.getCustomerDashBoard);

// Add item to cart
router.post('/add-to-cart', customerController.addToCart);

// Checkout
router.post('/checkout', customerController.checkout);

// Update profile
router.get('/update-profile', (req, res) => {
    res.render('update-profile'); // Render profile update page
});


router.get('/purchases', customerController.getPurchases); 
router.post('/update-profile', customerController.updateProfile);

// Logout
router.post('/logout', customerController.logout);

module.exports = router;
