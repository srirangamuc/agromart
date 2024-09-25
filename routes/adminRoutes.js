const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin dashboard route
router.get('/', adminController.getAdminDashboard);

// Update purchase status route
router.post('/update-purchase-status', adminController.updatePurchaseStatus);
router.get('/customer-analysis', adminController.getCustomerAnalysis);
router.get('/purchases-analysis', adminController.getPurchasesAnalysis); // New route

module.exports = router;
