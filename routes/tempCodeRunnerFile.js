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
router.get('/update-profile', (req, res) => {
    res.render('update-profile'); // Render profile update page
});


router.get('/purchases', customerController.getPurchases); 
router.post('/update-profile', customerController.updateProfile);

router.post('/subscribe', customerController.purchaseSubscription);
router.get('/success-subscription', customerController.successSubscription);
router.get('/cancel', customerController.cancelPayment);


router.get('/success',customerController.getSucess)
router.get('/failure',customerController.getFaliure)

// Logout
router.post('/logout', customerController.logout);

module.exports = router;



router.get('/dashboard', authMiddleware, customerController.getCustomerDashBoard);

// Cart Operations
router.post('/cart/add', authMiddleware, customerController.addToCart);
router.post('/cart/delete', authMiddleware, customerController.deleteFromCart);
router.get('/cart', authMiddleware, customerController.getCustomerDashBoard); // Assuming the same dashboard shows cart

// Checkout
router.post('/checkout', authMiddleware, customerController.checkout);
router.get('/success', authMiddleware, customerController.success);
router.get('/cancel', authMiddleware, customerController.cancel);
router.get('/purchases', authMiddleware, customerController.getPurchases);

// Profile Management
router.post('/profile/update', authMiddleware, customerController.updateProfile);

// Logout
router.get('/logout', authMiddleware, customerController.logout);

// Subscription Purchase
router.post('/subscription/purchase', authMiddleware, customerController.purchaseSubscription);
router.get('/success-subscription', authMiddleware, customerController.successSubscription);
router.get('/cancel-payment', authMiddleware, customerController.cancelPayment);

module.exports = router;
