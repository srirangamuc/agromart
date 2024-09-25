const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin dashboard route
router.get('/', adminController.getAdminDashboard);

// Update purchase status route
router.post('/update-purchase-status', adminController.updatePurchaseStatus);

module.exports = router;
