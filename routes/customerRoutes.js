const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController'); // Assuming CustomerController is the class




// Customer dashboard
router.get('/', (req, res) => customerController.getCustomerDashBoard(req, res));

// Add item to cart
router.post('/add-to-cart', (req, res) => customerController.addToCart(req, res));

// Delete an item from the cart
router.post('/delete-from-cart', (req, res) => customerController.deleteFromCart(req, res));

// Checkout
router.post('/checkout', (req, res) => customerController.checkout(req, res));

// Update profile
router.post('/update-profile', (req, res) => customerController.updateProfile(req, res));

// Purchases
router.get('/purchases', (req, res) => customerController.getPurchases(req, res));

// Subscription
router.post('/subscribe', (req, res) => customerController.purchaseSubscription(req, res));
router.get('/success-subscription', (req, res) => customerController.successSubscription(req, res));

// Payment Cancellation
router.get('/cancel', (req, res) => customerController.cancelPayment(req, res));

// Success and Failure Pages
router.get('/success', (req, res) => customerController.getSucess(req, res));
router.get('/failure', (req, res) => customerController.getFaliure(req, res));

// Logout
router.post('/logout', (req, res) => customerController.logout(req, res));

module.exports = router;
