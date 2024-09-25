const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Customer dashboard
router.get('/', customerController.getCustomerDashBoard);

// Add item to cart
router.post('/add-to-cart', customerController.addToCart);

// Add route to delete an item from the cart
router.post('/delete-from-cart', customerController.deleteFromCart);

// Checkout
router.post('/checkout', customerController.checkout);

// Update profile
router.post('/update-profile', customerController.updateProfile);

// Purchases
router.get('/purchases', customerController.getPurchases);

// Subscription
router.post('/subscribe', customerController.purchaseSubscription);
router.get('/success-subscription', customerController.successSubscription);

// Payment Cancellation
router.get('/cancel', customerController.cancelPayment);

// Success and Failure Pages
router.get('/success', customerController.getSucess);
router.get('/failure', customerController.getFaliure);

// Logout
router.post('/logout', customerController.logout);

module.exports = router;
