const express = require('express');
const router = express.Router();
const Item = require('../models/itemModel');
const isAuthenticated = require('../middleware/authMiddleware');

// POST Route to add a product (Vendor)
router.post('/add-product', isAuthenticated, async (req, res) => {
    try {
        let { name, quantity, pricePerKg } = req.body;
        const vendorId = req.session.userId; // Retrieve vendor ID from session

        // Convert quantity and pricePerKg to numbers
        quantity = parseInt(quantity, 10);  // Convert quantity to an integer
        pricePerKg = parseFloat(pricePerKg);  // Convert pricePerKg to a floating-point number

        

        // Ensure all required fields are provided and valid
        if (!name || isNaN(quantity) || isNaN(pricePerKg) || !vendorId) {
            return res.status(400).send('All fields are required and must be valid numbers. Vendor must be logged in');
        }

        // Check if the product already exists for the vendor
        const existingProduct = await Item.findOne({ name, vendor: vendorId });

        if (existingProduct) {
            // Update the existing product: add the new quantity and update the price
            existingProduct.quantity += quantity;  // Correctly add quantities as numbers
            existingProduct.pricePerKg = pricePerKg;  // Update the price per kg with the new value

            await existingProduct.save();
            res.redirect('/vendor');
        } else {
            // If the product doesn't exist, create a new one
            const newItem = new Item({
                name,
                quantity,
                pricePerKg,
                vendor: vendorId
            });

            await newItem.save();
            res.redirect('/vendor');
        }

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
