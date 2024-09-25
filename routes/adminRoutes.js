// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin dashboard
router.get('/dashboard', adminController.getAdminDashboard);

// Update purchase status
router.post('/update-purchase-status', adminController.updatePurchaseStatus);

module.exports = router;