const express = require('express');
const router = express.Router();
const Item = require('../models/itemModel');

// GET Route to fetch all products
router.get('/products', async (req, res) => {
    try {
        const products = await Item.find({});
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
