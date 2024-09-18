const express = require('express');
const router = express.Router();
const Item = require('../models/itemModel');
const isAuthenticated = require('../middleware/authMiddleware');

// POST Route to add a product (Vendor)
router.post('/add-product', isAuthenticated, async (req, res) => {
    try {
        const { name, quantity, pricePerKg } = req.body;
        const vendorId = req.session.userId; // Retrieve vendor ID from session

        console.log(name);
        console.log(quantity);
        console.log(pricePerKg);
        console.log(vendorId);

        // Ensure all required fields are provided
        if (!name || quantity === undefined || pricePerKg === undefined || !vendorId) {
            return res.status(400).send('All fields are required and vendor must be logged in');
        }

        // Create new product
        const newItem = new Item({
            name,
            quantity,
            pricePerKg,
            vendor: vendorId // Directly use the vendorId as it will be handled by Mongoose
        });

        await newItem.save();
        res.redirect('/vendor')
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).send('Server error');
    }
});

// GET Route to fetch products for the vendor
router.get('/products', isAuthenticated, async (req, res) => {
    try {
        const vendorId = req.session.userId; // Retrieve vendor ID from session

        // Ensure vendor ID is valid
        if (!vendorId) {
            return res.status(400).send('Vendor must be logged in');
        }

        // Fetch products for the vendor
        const products = await Item.find({ vendor: vendorId }); // Directly use vendorId
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
