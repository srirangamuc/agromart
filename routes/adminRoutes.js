const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Admin dashboard route
router.get('/', (req, res) => adminController.getAdminDashboard(req, res));

// Update purchase status route
router.post('/update-purchase-status', (req, res) => adminController.updatePurchaseStatus(req, res));
router.get('/customer-analysis', (req, res) => adminController.getCustomerAnalysis(req, res));
router.get('/purchases-analysis', (req, res) => adminController.getPurchasesAnalysis(req, res)); // New route

module.exports = router;
