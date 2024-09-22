const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const isAuthenticated = require('../middleware/authMiddleware');

// Customer dashboard (view all unique products)
router.get('/', isAuthenticated, customerController.getCustomerDashBoard);
router.post('/add-to-cart',isAuthenticated,customerController.addToCart)
router.post('/checkout',isAuthenticated,customerController.checkout)
router.get('/purchases',isAuthenticated,customerController.getPurchases)

module.exports=router