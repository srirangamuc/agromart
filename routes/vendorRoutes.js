const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const Vendor = require('../models/vendorModel');
const isAuthenticated = require('../middleware/authMiddleware');

// Route to add a product
router.post('/add-product', isAuthenticated, vendorController.addProduct);

// Route to fetch products for the vendor
router.get('/products', isAuthenticated, vendorController.getProducts);

// Route to fetch the vendor dashboard
router.get('/dashboard', isAuthenticated, vendorController.getVendorDashboard);

// Route to render the vendor page (including the profile section)
router.get('/', isAuthenticated, vendorController.getVendorDashboard); // Ensure this function is defined
router.post('/', isAuthenticated, vendorController.updateProfile); // Add this line to handle profile updates
router.get('/profit-data', isAuthenticated, async (req, res) => {
    try {
        const vendorId = req.session.userId;

        // Fetch products for the specific vendor
        const products = await Vendor.find({ vendor: vendorId });

        // Prepare data for the profit chart
        const profitDataMap = new Map(); // Use a Map to keep track of product profits

        products.forEach(product => {
            if (profitDataMap.has(product.itemName)) {
                // Update profit if product already exists
                const existingProfit = profitDataMap.get(product.itemName);
                profitDataMap.set(product.itemName, existingProfit + product.profit);
            } else {
                // Add new product to the Map
                profitDataMap.set(product.itemName, product.profit);
            }
        });

        // Convert the Map to arrays for response
        const productNames = Array.from(profitDataMap.keys());
        const profits = Array.from(profitDataMap.values());

        // Send the data as JSON response
        res.json({ productNames, profits });
    } catch (error) {
        console.error('Error fetching profit data:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;
